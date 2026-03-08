-- ============================================
-- ADVANCED ORDER CANCELLATION SYSTEM
-- Soft Cancel vs Hard Cancel with In-Flight Handling
-- ============================================

-- ============================================
-- 1. EXTEND ORDER STATUS ENUM
-- ============================================

-- Add new status values for cancellation workflow
ALTER TABLE order_book 
  DROP CONSTRAINT IF EXISTS order_book_status_check;

ALTER TABLE order_book
  ADD CONSTRAINT order_book_status_check 
  CHECK (status IN ('OPEN', 'PARTIAL', 'CANCELLING', 'CANCELLED', 'FILLED', 'EXPIRED'));

-- ============================================
-- 2. CANCELLATION METADATA TABLE
-- ============================================

CREATE TABLE cancellation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES order_book(id) ON DELETE CASCADE,
  
  -- Cancellation Type
  cancel_type VARCHAR(20) NOT NULL CHECK (cancel_type IN ('SOFT', 'HARD', 'EXPIRY')),
  
  -- Timing
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  soft_cancelled_at TIMESTAMPTZ,
  hard_cancelled_at TIMESTAMPTZ,
  
  -- State at cancellation
  filled_quantity_before DECIMAL(36, 18) NOT NULL DEFAULT 0,
  remaining_quantity DECIMAL(36, 18) NOT NULL,
  average_fill_price DECIMAL(36, 18),
  
  -- Final state
  final_filled_quantity DECIMAL(36, 18),
  final_cancelled_quantity DECIMAL(36, 18),
  
  -- Collateral/Funds released
  released_collateral DECIMAL(36, 18) NOT NULL DEFAULT 0,
  
  -- Race condition resolution
  race_condition_detected BOOLEAN DEFAULT FALSE,
  race_resolution VARCHAR(20) CHECK (race_resolution IN ('CANCEL_WON', 'FILL_WON', 'PARTIAL_FILL')),
  
  -- Confirmation data
  sequence_number BIGINT NOT NULL,
  cancellation_signature VARCHAR(128),
  
  -- Metadata
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason VARCHAR(50),
  client_request_id VARCHAR(64),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for cancellation queries
CREATE INDEX idx_cancellation_order ON cancellation_records(order_id);
CREATE INDEX idx_cancellation_sequence ON cancellation_records(sequence_number);
CREATE INDEX idx_cancellation_time ON cancellation_records(requested_at);

-- ============================================
-- 3. GLOBAL SEQUENCE FOR STATE RECONCILIATION
-- ============================================

CREATE TABLE global_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_sequence BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO global_sequence (id, last_sequence) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Function to get next sequence number
CREATE OR REPLACE FUNCTION get_next_sequence()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next BIGINT;
BEGIN
  UPDATE global_sequence 
  SET last_sequence = last_sequence + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING last_sequence INTO v_next;
  
  RETURN v_next;
END;
$$;

-- ============================================
-- 4. SOFT CANCEL FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION soft_cancel_order(
  p_order_id UUID,
  p_user_id UUID,
  p_client_request_id VARCHAR(64) DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  cancel_record_id UUID,
  sequence_number BIGINT,
  message TEXT,
  current_status VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_seq BIGINT;
  v_cancel_id UUID;
  v_updated INTEGER;
BEGIN
  -- Get and lock the order
  SELECT * INTO v_order
  FROM order_book
  WHERE id = p_order_id
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 'Order not found'::TEXT, NULL::VARCHAR(20);
    RETURN;
  END IF;
  
  -- Verify ownership
  IF v_order.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 'Unauthorized: not order owner'::TEXT, v_order.status;
    RETURN;
  END IF;
  
  -- Check if order can be cancelled
  IF v_order.status IN ('CANCELLED', 'FILLED', 'EXPIRED') THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 
      'Order already in terminal state: ' || v_order.status::TEXT, 
      v_order.status;
    RETURN;
  END IF;
  
  IF v_order.status = 'CANCELLING' THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 
      'Cancellation already in progress'::TEXT, 
      v_order.status;
    RETURN;
  END IF;
  
  -- Get sequence number
  v_seq := get_next_sequence();
  
  -- Attempt optimistic soft cancel
  UPDATE order_book
  SET status = 'CANCELLING',
      updated_at = NOW()
  WHERE id = p_order_id
    AND status IN ('OPEN', 'PARTIAL');
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated = 0 THEN
    -- Order state changed during check
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 
      'Order state changed, retry required'::TEXT, 
      (SELECT status FROM order_book WHERE id = p_order_id);
    RETURN;
  END IF;
  
  -- Create cancellation record
  INSERT INTO cancellation_records (
    order_id,
    cancel_type,
    requested_at,
    soft_cancelled_at,
    filled_quantity_before,
    remaining_quantity,
    average_fill_price,
    sequence_number,
    cancelled_by,
    client_request_id
  ) VALUES (
    p_order_id,
    'SOFT',
    NOW(),
    NOW(),
    v_order.filled,
    v_order.size - v_order.filled,
    NULL,
    v_seq,
    p_user_id,
    p_client_request_id
  )
  RETURNING id INTO v_cancel_id;
  
  RETURN QUERY SELECT TRUE, v_cancel_id, v_seq, 
    'Soft cancel accepted, pending hard cancel'::TEXT, 
    'CANCELLING'::VARCHAR(20);
END;
$$;

-- ============================================
-- 5. HARD CANCEL FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION hard_cancel_order(
  p_order_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_is_system BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  success BOOLEAN,
  cancel_record_id UUID,
  sequence_number BIGINT,
  released_collateral DECIMAL(36, 18),
  final_status VARCHAR(20),
  filled_during_cancel DECIMAL(36, 18),
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_cancel_record RECORD;
  v_seq BIGINT;
  v_old_filled DECIMAL(36, 18);
  v_new_filled DECIMAL(36, 18);
  v_released DECIMAL(36, 18);
  v_race_detected BOOLEAN := FALSE;
  v_race_resolution VARCHAR(20);
  v_final_cancelled_qty DECIMAL(36, 18);
BEGIN
  -- Lock the order
  SELECT * INTO v_order
  FROM order_book
  WHERE id = p_order_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 0::DECIMAL, NULL::VARCHAR(20), 0::DECIMAL, 'Order not found'::TEXT;
    RETURN;
  END IF;
  
  -- Authorization check (skip if system call)
  IF NOT p_is_system AND v_order.user_id != p_user_id THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 0::DECIMAL, NULL::VARCHAR(20), 0::DECIMAL, 'Unauthorized'::TEXT;
    RETURN;
  END IF;
  
  -- Can only hard cancel from CANCELLING state
  IF v_order.status != 'CANCELLING' AND NOT p_is_system THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::BIGINT, 0::DECIMAL, v_order.status, 0::DECIMAL, 
      'Order not in cancellable state: ' || v_order.status::TEXT;
    RETURN;
  END IF;
  
  -- Get the cancellation record
  SELECT * INTO v_cancel_record
  FROM cancellation_records
  WHERE order_id = p_order_id
  ORDER BY requested_at DESC
  LIMIT 1;
  
  v_old_filled := COALESCE(v_cancel_record.filled_quantity_before, v_order.filled);
  v_new_filled := v_order.filled;
  
  -- Detect race condition: fill occurred during cancellation
  IF v_new_filled > v_old_filled THEN
    v_race_detected := TRUE;
    
    IF v_new_filled >= v_order.size THEN
      -- Fully filled before cancel completed
      v_race_resolution := 'FILL_WON';
      v_final_cancelled_qty := 0;
      
      -- Update order to FILLED
      UPDATE order_book
      SET status = 'FILLED',
          updated_at = NOW()
      WHERE id = p_order_id;
      
      RETURN QUERY SELECT FALSE, v_cancel_record.id, v_cancel_record.sequence_number, 0::DECIMAL, 
        'FILLED'::VARCHAR(20), (v_new_filled - v_old_filled),
        'Order filled during cancellation, cancel rejected'::TEXT;
      RETURN;
    ELSE
      -- Partial fill
      v_race_resolution := 'PARTIAL_FILL';
      v_final_cancelled_qty := v_order.size - v_new_filled;
    END IF;
  ELSE
    v_race_resolution := 'CANCEL_WON';
    v_final_cancelled_qty := v_order.size - v_new_filled;
  END IF;
  
  -- Calculate released collateral
  v_released := v_final_cancelled_qty * v_order.price;
  
  -- Get new sequence number
  v_seq := get_next_sequence();
  
  -- Finalize order status
  UPDATE order_book
  SET status = 'CANCELLED',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Update cancellation record
  UPDATE cancellation_records
  SET hard_cancelled_at = NOW(),
      cancel_type = CASE 
        WHEN cancel_type = 'SOFT' AND v_race_detected THEN 'SOFT'
        WHEN cancel_type = 'SOFT' THEN 'HARD'
        ELSE cancel_type
      END,
      final_filled_quantity = v_new_filled,
      final_cancelled_quantity = v_final_cancelled_qty,
      released_collateral = v_released,
      race_condition_detected = v_race_detected,
      race_resolution = v_race_resolution,
      sequence_number = v_seq
  WHERE id = v_cancel_record.id;
  
  -- Release locked funds (simplified - actual implementation depends on wallet system)
  -- This would call a wallet release function
  
  RETURN QUERY SELECT TRUE, v_cancel_record.id, v_seq, v_released, 
    CASE WHEN v_race_resolution = 'PARTIAL_FILL' THEN 'PARTIAL'::VARCHAR(20) ELSE 'CANCELLED'::VARCHAR(20) END,
    (v_new_filled - v_old_filled),
    CASE 
      WHEN v_race_resolution = 'FILL_WON' THEN 'Order filled, cancel rejected'
      WHEN v_race_resolution = 'PARTIAL_FILL' THEN 'Partial fill occurred, remainder cancelled'
      ELSE 'Order successfully cancelled'
    END::TEXT;
END;
$$;

-- ============================================
-- 6. EXPIRY CANCEL (for GTD orders)
-- ============================================

CREATE OR REPLACE FUNCTION expire_order(
  p_order_id UUID,
  p_expiry_reason VARCHAR(50) DEFAULT 'GTD_EXPIRED'
)
RETURNS TABLE(
  success BOOLEAN,
  cancel_record_id UUID,
  released_collateral DECIMAL(36, 18)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_seq BIGINT;
  v_cancel_id UUID;
  v_released DECIMAL(36, 18);
BEGIN
  SELECT * INTO v_order
  FROM order_book
  WHERE id = p_order_id
    AND status IN ('OPEN', 'PARTIAL', 'CANCELLING')
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::DECIMAL;
    RETURN;
  END IF;
  
  v_seq := get_next_sequence();
  v_released := (v_order.size - v_order.filled) * v_order.price;
  
  -- Create expiry record
  INSERT INTO cancellation_records (
    order_id,
    cancel_type,
    filled_quantity_before,
    remaining_quantity,
    final_filled_quantity,
    final_cancelled_quantity,
    released_collateral,
    sequence_number,
    cancellation_reason
  ) VALUES (
    p_order_id,
    'EXPIRY',
    v_order.filled,
    v_order.size - v_order.filled,
    v_order.filled,
    v_order.size - v_order.filled,
    v_released,
    v_seq,
    p_expiry_reason
  )
  RETURNING id INTO v_cancel_id;
  
  -- Mark order as expired
  UPDATE order_book
  SET status = 'EXPIRED',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN QUERY SELECT TRUE, v_cancel_id, v_released;
END;
$$;

-- ============================================
-- 7. STATE RECONCILIATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION reconcile_order_state(
  p_order_ids UUID[],
  p_client_last_sequence BIGINT DEFAULT 0
)
RETURNS TABLE(
  order_id UUID,
  current_status VARCHAR(20),
  filled_quantity DECIMAL(36, 18),
  cancelled_quantity DECIMAL(36, 18),
  sequence_number BIGINT,
  changes_since_sequence JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ob.id AS order_id,
    ob.status::VARCHAR(20) AS current_status,
    ob.filled AS filled_quantity,
    COALESCE(cr.final_cancelled_quantity, 0) AS cancelled_quantity,
    COALESCE(cr.sequence_number, 0) AS sequence_number,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'sequence', sub_cr.sequence_number,
          'type', sub_cr.cancel_type,
          'timestamp', sub_cr.requested_at,
          'filled_before', sub_cr.filled_quantity_before,
          'remaining', sub_cr.remaining_quantity
        )
        ORDER BY sub_cr.sequence_number
      )
      FROM cancellation_records sub_cr
      WHERE sub_cr.order_id = ob.id
        AND sub_cr.sequence_number > p_client_last_sequence
      ),
      '[]'::jsonb
    ) AS changes_since_sequence
  FROM order_book ob
  LEFT JOIN LATERAL (
    SELECT *
    FROM cancellation_records cr
    WHERE cr.order_id = ob.id
    ORDER BY cr.sequence_number DESC
    LIMIT 1
  ) cr ON true
  WHERE ob.id = ANY(p_order_ids)
  ORDER BY COALESCE(cr.sequence_number, 0);
END;
$$;

-- ============================================
-- 8. BATCH CANCELLATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION batch_cancel_orders(
  p_order_ids UUID[],
  p_user_id UUID
)
RETURNS TABLE(
  order_id UUID,
  success BOOLEAN,
  message TEXT,
  sequence_number BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_result RECORD;
BEGIN
  FOREACH v_order_id IN ARRAY p_order_ids
  LOOP
    SELECT * INTO v_result
    FROM soft_cancel_order(v_order_id, p_user_id);
    
    order_id := v_order_id;
    success := v_result.success;
    message := v_result.message;
    sequence_number := v_result.sequence_number;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ============================================
-- 9. CANCELLATION CONFIRMATION GENERATOR
-- ============================================

CREATE OR REPLACE FUNCTION generate_cancellation_confirmation(
  p_cancel_record_id UUID
)
RETURNS TABLE(
  confirmation_data JSONB,
  signature_payload TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'orderId', cr.order_id,
      'cancellationTimestamp', EXTRACT(EPOCH FROM cr.hard_cancelled_at) * 1000000000, -- nanoseconds
      'filledQuantity', cr.final_filled_quantity::TEXT,
      'remainingQuantity', cr.final_cancelled_quantity::TEXT,
      'averageFillPrice', COALESCE(cr.average_fill_price, 0)::TEXT,
      'releasedCollateral', cr.released_collateral::TEXT,
      'sequenceNumber', cr.sequence_number,
      'cancelType', cr.cancel_type,
      'raceCondition', cr.race_condition_detected,
      'timestamp', cr.hard_cancelled_at
    ) AS confirmation_data,
    format('%s:%s:%s:%s:%s:%s:%s',
      cr.order_id,
      EXTRACT(EPOCH FROM cr.hard_cancelled_at) * 1000000000,
      COALESCE(cr.final_filled_quantity, 0),
      COALESCE(cr.final_cancelled_quantity, 0),
      COALESCE(cr.average_fill_price, 0),
      cr.released_collateral,
      cr.sequence_number
    ) AS signature_payload
  FROM cancellation_records cr
  WHERE cr.id = p_cancel_record_id;
END;
$$;

-- ============================================
-- 10. RLS POLICIES FOR CANCELLATION RECORDS
-- ============================================

ALTER TABLE cancellation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cancellation records"
ON cancellation_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_book ob 
    WHERE ob.id = cancellation_records.order_id 
    AND ob.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert cancellation records"
ON cancellation_records FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update cancellation records"
ON cancellation_records FOR UPDATE
USING (true);

-- ============================================
-- 11. TRIGGER: AUTO HARD CANCEL AFTER SOFT CANCEL
-- ============================================

CREATE OR REPLACE FUNCTION auto_complete_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is a soft cancel, schedule/execute hard cancel after brief delay
  IF NEW.cancel_type = 'SOFT' AND NEW.hard_cancelled_at IS NULL THEN
    -- In production, this might use pg_cron or external scheduler
    -- For now, we rely on explicit hard cancel calls or matching engine completion
    PERFORM pg_notify('cancellation_requested', jsonb_build_object(
      'orderId', NEW.order_id,
      'cancelRecordId', NEW.id,
      'requestedAt', NEW.requested_at
    )::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_complete_cancellation
AFTER INSERT ON cancellation_records
FOR EACH ROW
EXECUTE FUNCTION auto_complete_cancellation();

-- ============================================
-- 12. VIEW: ACTIVE CANCELLATIONS
-- ============================================

CREATE VIEW active_cancellations AS
SELECT 
  cr.*,
  ob.market_id,
  ob.user_id,
  ob.side,
  ob.price,
  ob.size,
  ob.filled,
  EXTRACT(EPOCH FROM (NOW() - cr.requested_at)) * 1000 AS elapsed_ms
FROM cancellation_records cr
JOIN order_book ob ON ob.id = cr.order_id
WHERE cr.hard_cancelled_at IS NULL
  AND ob.status = 'CANCELLING';

COMMENT ON VIEW active_cancellations IS 'Orders currently in soft-cancel state awaiting hard cancel';
