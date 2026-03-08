-- ============================================
-- PARTIAL FILL MANAGEMENT SYSTEM
-- TIF Types: FOK, IOC, GTC, GTD, AON
-- ============================================

-- ============================================
-- 1. TIF TYPE ENUM
-- ============================================

CREATE TYPE tif_type AS ENUM ('FOK', 'IOC', 'GTC', 'GTD', 'AON');

-- ============================================
-- 2. ENHANCE ORDER BOOK WITH TIF
-- ============================================

-- Add TIF columns to order_book
ALTER TABLE order_book 
  ADD COLUMN IF NOT EXISTS tif tif_type DEFAULT 'GTC',
  ADD COLUMN IF NOT EXISTS gtd_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS original_quantity DECIMAL(36, 18) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_fill_price DECIMAL(36, 18) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fill_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_fill_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_re_entry BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES order_book(id);

-- Set original_quantity for existing orders
UPDATE order_book SET original_quantity = size WHERE original_quantity = 0;

-- ============================================
-- 3. FILL RECORDS TABLE
-- ============================================

CREATE TABLE fill_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES order_book(id) ON DELETE CASCADE,
  
  -- Fill details
  quantity DECIMAL(36, 18) NOT NULL,
  price DECIMAL(36, 18) NOT NULL,
  total_value DECIMAL(36, 18) NOT NULL, -- quantity * price
  
  -- Counterparty (anonymized)
  counterparty_order_id UUID REFERENCES order_book(id),
  counterparty_user_id UUID REFERENCES auth.users(id),
  
  -- Trade reference
  trade_id UUID REFERENCES trades(id),
  
  -- Metadata
  fill_number INTEGER NOT NULL, -- Sequential fill number for this order
  is_maker BOOLEAN DEFAULT FALSE, -- True if order was maker
  
  -- Transaction tracking
  transaction_hash VARCHAR(128),
  blockchain_reference VARCHAR(256),
  
  -- Timestamps
  filled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fill records
CREATE INDEX idx_fill_records_order ON fill_records(order_id, fill_number);
CREATE INDEX idx_fill_records_trade ON fill_records(trade_id);
CREATE INDEX idx_fill_records_time ON fill_records(filled_at);

-- ============================================
-- 4. PARTIAL FILL STATE VIEW
-- ============================================

CREATE VIEW partial_fill_state AS
SELECT 
  ob.id as order_id,
  ob.user_id,
  ob.market_id,
  ob.side,
  ob.price,
  ob.original_quantity,
  ob.filled as filled_quantity,
  (ob.original_quantity - ob.filled) as remaining_quantity,
  ob.avg_fill_price,
  ob.fill_count,
  ob.last_fill_at,
  ob.tif,
  ob.gtd_expiry,
  ob.status,
  ob.time_priority,
  ob.is_re_entry,
  ob.parent_order_id,
  
  -- Aggregate fill history
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'fillId', fr.id,
        'quantity', fr.quantity,
        'price', fr.price,
        'totalValue', fr.total_value,
        'isMaker', fr.is_maker,
        'filledAt', fr.filled_at,
        'fillNumber', fr.fill_number
      )
      ORDER BY fr.fill_number
    )
    FROM fill_records fr
    WHERE fr.order_id = ob.id
    ),
    '[]'::jsonb
  ) as fill_history

FROM order_book ob;

-- ============================================
-- 5. VWAP CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_vwap(p_order_id UUID)
RETURNS DECIMAL(36, 18)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_value DECIMAL(36, 18) := 0;
  v_total_quantity DECIMAL(36, 18) := 0;
  v_tick_size DECIMAL(36, 18) := 0.01; -- Default tick size
  v_raw_avg DECIMAL(36, 18);
  v_remainder DECIMAL(36, 18);
  v_rounded DECIMAL(36, 18);
  v_fill RECORD;
BEGIN
  -- Sum up all fills
  SELECT 
    COALESCE(SUM(total_value), 0),
    COALESCE(SUM(quantity), 0)
  INTO v_total_value, v_total_quantity
  FROM fill_records
  WHERE order_id = p_order_id;
  
  IF v_total_quantity = 0 THEN
    RETURN 0;
  END IF;
  
  -- Get tick size from market (optional enhancement)
  -- SELECT tick_size INTO v_tick_size FROM markets WHERE id = ...
  
  -- Calculate raw average with extra precision
  v_raw_avg := (v_total_value * 1000000) / v_total_quantity;
  v_remainder := v_raw_avg % 1000000;
  
  -- Round half-up to nearest tick
  IF v_remainder >= 500000 THEN
    v_rounded := (v_raw_avg / 1000000) + 1;
  ELSE
    v_rounded := v_raw_avg / 1000000;
  END IF;
  
  RETURN v_rounded;
END;
$$;

-- ============================================
-- 6. RECORD FILL FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION record_fill(
  p_order_id UUID,
  p_quantity DECIMAL(36, 18),
  p_price DECIMAL(36, 18),
  p_counterparty_order_id UUID,
  p_counterparty_user_id UUID,
  p_trade_id UUID,
  p_is_maker BOOLEAN DEFAULT FALSE,
  p_transaction_hash VARCHAR(128) DEFAULT NULL
)
RETURNS TABLE(fill_id UUID, new_avg_price DECIMAL(36, 18))
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fill_id UUID;
  v_fill_number INTEGER;
  v_new_avg DECIMAL(36, 18);
  v_new_filled DECIMAL(36, 18);
  v_status VARCHAR(20);
BEGIN
  -- Get next fill number
  SELECT COALESCE(MAX(fill_number), 0) + 1
  INTO v_fill_number
  FROM fill_records
  WHERE order_id = p_order_id;
  
  -- Insert fill record
  INSERT INTO fill_records (
    order_id,
    quantity,
    price,
    total_value,
    counterparty_order_id,
    counterparty_user_id,
    trade_id,
    fill_number,
    is_maker,
    transaction_hash
  ) VALUES (
    p_order_id,
    p_quantity,
    p_price,
    p_quantity * p_price,
    p_counterparty_order_id,
    p_counterparty_user_id,
    p_trade_id,
    v_fill_number,
    p_is_maker,
    p_transaction_hash
  )
  RETURNING id INTO v_fill_id;
  
  -- Update order with new fill info
  SELECT filled + p_quantity INTO v_new_filled
  FROM order_book WHERE id = p_order_id;
  
  -- Calculate new VWAP
  v_new_avg := calculate_vwap(p_order_id);
  
  -- Determine new status
  SELECT 
    CASE 
      WHEN v_new_filled >= size THEN 'FILLED'
      ELSE 'PARTIAL'
    END
  INTO v_status
  FROM order_book WHERE id = p_order_id;
  
  -- Update order book
  UPDATE order_book
  SET 
    filled = v_new_filled,
    avg_fill_price = v_new_avg,
    fill_count = v_fill_number,
    last_fill_at = NOW(),
    status = v_status,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN QUERY SELECT v_fill_id, v_new_avg;
END;
$$;

-- ============================================
-- 7. TIF ORDER PROCESSING
-- ============================================

-- FOK (Fill or Kill)
CREATE OR REPLACE FUNCTION process_fok_order(
  p_order_id UUID,
  p_market_id UUID,
  p_side VARCHAR(4),
  p_price DECIMAL(36, 18),
  p_size DECIMAL(36, 18)
)
RETURNS TABLE(success BOOLEAN, message TEXT, fills JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_depth DECIMAL(36, 18);
  v_fills JSONB := '[]'::JSONB;
BEGIN
  -- Check if full size can be filled immediately
  SELECT COALESCE(SUM(size - filled), 0)
  INTO v_available_depth
  FROM order_book
  WHERE market_id = p_market_id
    AND side != p_side
    AND status IN ('OPEN', 'PARTIAL')
    AND CASE 
      WHEN p_side = 'BUY' THEN price <= p_price
      ELSE price >= p_price
    END;
  
  IF v_available_depth < p_size THEN
    -- Kill the order
    UPDATE order_book
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT FALSE, 'FOK order killed: insufficient liquidity'::TEXT, '[]'::JSONB;
    RETURN;
  END IF;
  
  -- Return success - matching engine will handle fills
  RETURN QUERY SELECT TRUE, 'FOK order accepted, awaiting atomic fill'::TEXT, '[]'::JSONB;
END;
$$;

-- IOC (Immediate or Cancel)
CREATE OR REPLACE FUNCTION process_ioc_order(
  p_order_id UUID,
  p_size DECIMAL(36, 18)
)
RETURNS TABLE(
  filled_quantity DECIMAL(36, 18),
  remaining_quantity DECIMAL(36, 18),
  cancelled BOOLEAN,
  avg_price DECIMAL(36, 18)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_filled DECIMAL(36, 18);
  v_avg DECIMAL(36, 18);
BEGIN
  -- Wait briefly for matching to occur
  PERFORM pg_sleep(0.1);
  
  -- Get current fill state
  SELECT filled, avg_fill_price
  INTO v_filled, v_avg
  FROM order_book
  WHERE id = p_order_id;
  
  -- Cancel any remainder
  IF v_filled < p_size THEN
    UPDATE order_book
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT v_filled, (p_size - v_filled), TRUE, v_avg;
  ELSE
    RETURN QUERY SELECT v_filled, 0::DECIMAL, FALSE, v_avg;
  END IF;
END;
$$;

-- AON (All or Nothing)
CREATE OR REPLACE FUNCTION process_aon_order(
  p_order_id UUID,
  p_market_id UUID,
  p_side VARCHAR(4),
  p_price DECIMAL(36, 18),
  p_size DECIMAL(36, 18)
)
RETURNS TABLE(can_proceed BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_depth DECIMAL(36, 18);
BEGIN
  -- Check if full size can be filled
  SELECT COALESCE(SUM(size - filled), 0)
  INTO v_available_depth
  FROM order_book
  WHERE market_id = p_market_id
    AND side != p_side
    AND status IN ('OPEN', 'PARTIAL')
    AND CASE 
      WHEN p_side = 'BUY' THEN price <= p_price
      ELSE price >= p_price
    END;
  
  IF v_available_depth < p_size THEN
    -- Cancel - cannot fill completely
    UPDATE order_book
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN QUERY SELECT FALSE, 'AON order cancelled: complete fill impossible'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, 'AON order accepted'::TEXT;
  END IF;
END;
$$;

-- GTD (Good Till Date) Expiry Check
CREATE OR REPLACE FUNCTION check_gtd_expiry()
RETURNS TABLE(expired_order_id UUID, released_collateral DECIMAL(36, 18))
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_remaining DECIMAL(36, 18);
BEGIN
  FOR v_order IN
    SELECT id, size, filled, price
    FROM order_book
    WHERE tif = 'GTD'
      AND gtd_expiry < NOW()
      AND status IN ('OPEN', 'PARTIAL')
  LOOP
    v_remaining := v_order.size - v_order.filled;
    
    -- Expire the order
    UPDATE order_book
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE id = v_order.id;
    
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
    )
    SELECT 
      v_order.id,
      'EXPIRY'::cancel_type,
      v_order.filled,
      v_remaining,
      v_order.filled,
      v_remaining,
      v_remaining * v_order.price,
      get_next_sequence(),
      'GTD_EXPIRED';
    
    RETURN QUERY SELECT v_order.id, (v_remaining * v_order.price);
  END LOOP;
END;
$$;

-- ============================================
-- 8. RE-ENTRY LOGIC FOR GTC ORDERS
-- ============================================

CREATE OR REPLACE FUNCTION re_enter_gtc_order(
  p_order_id UUID,
  p_new_price DECIMAL(36, 18)
)
RETURNS TABLE(
  new_order_id UUID,
  preserved_priority BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_order RECORD;
  v_remaining DECIMAL(36, 18);
  v_new_order_id UUID;
  v_preserve_priority BOOLEAN;
BEGIN
  -- Get original order
  SELECT * INTO v_old_order
  FROM order_book
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Order not found'::TEXT;
    RETURN;
  END IF;
  
  v_remaining := v_old_order.size - v_old_order.filled;
  
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'No remaining quantity'::TEXT;
    RETURN;
  END IF;
  
  -- Determine if priority can be preserved
  -- Price unchanged: maintain original time priority
  -- Price improved (better for market): new time priority at new price
  -- Price worsened: rejected as queue jumping
  
  IF p_new_price = v_old_order.price THEN
    v_preserve_priority := TRUE;
  ELSIF (v_old_order.side = 'BUY' AND p_new_price > v_old_order.price) OR
        (v_old_order.side = 'SELL' AND p_new_price < v_old_order.price) THEN
    -- Price improved
    v_preserve_priority := FALSE;
  ELSE
    -- Price worsened - reject
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Re-entry rejected: price worsening constitutes queue jumping'::TEXT;
    RETURN;
  END IF;
  
  -- Cancel old order
  UPDATE order_book
  SET status = 'CANCELLED',
      updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Create new order
  INSERT INTO order_book (
    market_id,
    user_id,
    side,
    price,
    size,
    filled,
    status,
    order_type,
    tif,
    original_quantity,
    avg_fill_price,
    time_priority,
    is_re_entry,
    parent_order_id,
    created_at
  ) VALUES (
    v_old_order.market_id,
    v_old_order.user_id,
    v_old_order.side,
    p_new_price,
    v_remaining,
    0,
    'OPEN',
    v_old_order.order_type,
    'GTC',
    v_old_order.original_quantity,
    v_old_order.avg_fill_price,
    CASE WHEN v_preserve_priority THEN v_old_order.time_priority ELSE EXTRACT(EPOCH FROM NOW())::INTEGER END,
    TRUE,
    p_order_id,
    v_old_order.created_at -- Preserve original creation time
  )
  RETURNING id INTO v_new_order_id;
  
  RETURN QUERY SELECT 
    v_new_order_id, 
    v_preserve_priority,
    CASE 
      WHEN v_preserve_priority THEN 'Re-entry with preserved time priority'
      ELSE 'Re-entry with new time priority (price improved)'
    END::TEXT;
END;
$$;

-- ============================================
-- 9. MASTER ORDER PROCESSING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION process_order_with_tif(
  p_market_id UUID,
  p_user_id UUID,
  p_side VARCHAR(4),
  p_price DECIMAL(36, 18),
  p_size DECIMAL(36, 18),
  p_order_type VARCHAR(20) DEFAULT 'LIMIT',
  p_tif tif_type DEFAULT 'GTC',
  p_gtd_expiry TIMESTAMPTZ DEFAULT NULL,
  p_time_in_force VARCHAR(10) DEFAULT 'GTC'
)
RETURNS TABLE(order_id UUID, status VARCHAR(20), message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_fok_result RECORD;
  v_aon_result RECORD;
  v_time_priority INTEGER;
BEGIN
  -- Calculate time priority
  v_time_priority := EXTRACT(EPOCH FROM NOW())::INTEGER;
  
  -- Insert base order
  INSERT INTO order_book (
    market_id,
    user_id,
    side,
    price,
    size,
    filled,
    status,
    order_type,
    tif,
    gtd_expiry,
    original_quantity,
    time_priority,
    time_in_force,
    created_at,
    updated_at
  ) VALUES (
    p_market_id,
    p_user_id,
    p_side,
    p_price,
    p_size,
    0,
    'OPEN',
    p_order_type,
    p_tif,
    p_gtd_expiry,
    p_size,
    v_time_priority,
    COALESCE(p_time_in_force, p_tif::VARCHAR),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;
  
  -- Apply TIF-specific logic
  CASE p_tif
    WHEN 'FOK' THEN
      SELECT * INTO v_fok_result
      FROM process_fok_order(v_order_id, p_market_id, p_side, p_price, p_size);
      
      IF NOT v_fok_result.success THEN
        RETURN QUERY SELECT v_order_id, 'CANCELLED'::VARCHAR(20), v_fok_result.message;
        RETURN;
      END IF;
      
    WHEN 'AON' THEN
      SELECT * INTO v_aon_result
      FROM process_aon_order(v_order_id, p_market_id, p_side, p_price, p_size);
      
      IF NOT v_aon_result.can_proceed THEN
        RETURN QUERY SELECT v_order_id, 'CANCELLED'::VARCHAR(20), v_aon_result.message;
        RETURN;
      END IF;
      
    WHEN 'GTD' THEN
      IF p_gtd_expiry IS NULL OR p_gtd_expiry <= NOW() THEN
        UPDATE order_book SET status = 'EXPIRED' WHERE id = v_order_id;
        RETURN QUERY SELECT v_order_id, 'EXPIRED'::VARCHAR(20), 'GTD expiry in past'::TEXT;
        RETURN;
      END IF;
      
    ELSE
      -- GTC, IOC - no special pre-processing
      NULL;
  END CASE;
  
  RETURN QUERY SELECT v_order_id, 'OPEN'::VARCHAR(20), 
    format('%s order placed successfully', p_tif)::TEXT;
END;
$$;

-- ============================================
-- 10. RLS POLICIES
-- ============================================

ALTER TABLE fill_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fill records"
ON fill_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM order_book ob 
    WHERE ob.id = fill_records.order_id 
    AND ob.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert fill records"
ON fill_records FOR INSERT
WITH CHECK (true);

-- ============================================
-- 11. SCHEDULED GTD EXPIRY (via pg_cron if available)
-- ============================================

-- Note: In production, set up a cron job or scheduled function
-- For now, applications should call check_gtd_expiry() periodically

COMMENT ON FUNCTION check_gtd_expiry IS 'Call this function periodically (e.g., every minute) to expire GTD orders';
