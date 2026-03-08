-- ============================================
-- ADVANCED MATCHING ENGINE
-- Price-Time Priority with Pro-Rata Support
-- ============================================

-- ============================================
-- 1. ORDER NODE TABLE (Intrusive Linked List)
-- ============================================

CREATE TABLE order_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Linked list structure (intrusive)
  prev_node_id UUID REFERENCES order_nodes(id),
  next_node_id UUID REFERENCES order_nodes(id),
  
  -- Price level reference
  price_level_id UUID NOT NULL,
  
  -- Order data
  order_id UUID NOT NULL REFERENCES order_book(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES auth.users(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  price DECIMAL(36, 18) NOT NULL,
  size DECIMAL(36, 18) NOT NULL,
  remaining_size DECIMAL(36, 18) NOT NULL,
  
  -- Microsecond precision timestamp (nanosecond storage)
  placed_at_ns BIGINT NOT NULL, -- Nanoseconds since epoch
  sequence_number BIGINT NOT NULL, -- Atomic counter for tiebreaking
  
  -- Worker assignment for NUMA-aware processing
  worker_id INTEGER DEFAULT 0,
  numa_node INTEGER DEFAULT 0,
  
  -- Matching state
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'FILLED', 'CANCELLED')),
  
  -- Cancellation support
  cancel_requested BOOLEAN DEFAULT FALSE,
  cancel_requested_at TIMESTAMPTZ,
  
  -- Pro-rata specific
  is_pro_rata_eligible BOOLEAN DEFAULT FALSE,
  pro_rata_allocation DECIMAL(36, 18) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for O(1) lookups
CREATE INDEX idx_order_nodes_order ON order_nodes(order_id);
CREATE INDEX idx_order_nodes_price_level ON order_nodes(price_level_id, placed_at_ns);
CREATE INDEX idx_order_nodes_worker ON order_nodes(worker_id, status);
CREATE INDEX idx_order_nodes_sequence ON order_nodes(sequence_number);

-- ============================================
-- 2. PRICE LEVEL TABLE
-- ============================================

CREATE TABLE price_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id),
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  price DECIMAL(36, 18) NOT NULL,
  
  -- Linked list references
  head_node_id UUID REFERENCES order_nodes(id),
  tail_node_id UUID REFERENCES order_nodes(id),
  
  -- Aggregated metrics
  total_volume DECIMAL(36, 18) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  
  -- Pro-rata configuration
  pro_rata_enabled BOOLEAN DEFAULT FALSE,
  pro_rata_min_volume DECIMAL(36, 18) DEFAULT 1000000, -- $1M threshold
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(market_id, side, price)
);

CREATE INDEX idx_price_levels_market ON price_levels(market_id, side, price);

-- ============================================
-- 3. GLOBAL SEQUENCE COUNTER
-- ============================================

CREATE TABLE matching_sequence (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_sequence BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO matching_sequence (id, last_sequence) VALUES (1, 0) ON CONFLICT DO NOTHING;

-- Function to get next sequence with atomic increment
CREATE OR REPLACE FUNCTION get_matching_sequence()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next BIGINT;
BEGIN
  UPDATE matching_sequence 
  SET last_sequence = last_sequence + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING last_sequence INTO v_next;
  
  RETURN v_next;
END;
$$;

-- ============================================
-- 4. FIFO QUEUE OPERATIONS
-- ============================================

-- Enqueue order at price level (O(1))
CREATE OR REPLACE FUNCTION fifo_enqueue(
  p_market_id UUID,
  p_side VARCHAR(4),
  p_price DECIMAL(36, 18),
  p_order_id UUID,
  p_account_id UUID,
  p_size DECIMAL(36, 18)
)
RETURNS TABLE(node_id UUID, sequence_number BIGINT, placed_at_ns BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price_level_id UUID;
  v_node_id UUID;
  v_sequence BIGINT;
  v_now_ns BIGINT;
  v_tail_id UUID;
BEGIN
  -- Get nanosecond timestamp
  v_now_ns := EXTRACT(EPOCH FROM NOW()) * 1000000000;
  v_sequence := get_matching_sequence();
  
  -- Get or create price level
  SELECT id, tail_node_id INTO v_price_level_id, v_tail_id
  FROM price_levels
  WHERE market_id = p_market_id AND side = p_side AND price = p_price;
  
  IF NOT FOUND THEN
    INSERT INTO price_levels (market_id, side, price)
    VALUES (p_market_id, p_side, p_price)
    RETURNING id INTO v_price_level_id;
  END IF;
  
  -- Create new node
  INSERT INTO order_nodes (
    price_level_id,
    order_id,
    account_id,
    market_id,
    side,
    price,
    size,
    remaining_size,
    placed_at_ns,
    sequence_number,
    prev_node_id,
    status
  ) VALUES (
    v_price_level_id,
    p_order_id,
    p_account_id,
    p_market_id,
    p_side,
    p_price,
    p_size,
    p_size,
    v_now_ns,
    v_sequence,
    v_tail_id,
    'PENDING'
  )
  RETURNING id INTO v_node_id;
  
  -- Update linked list
  IF v_tail_id IS NOT NULL THEN
    UPDATE order_nodes SET next_node_id = v_node_id WHERE id = v_tail_id;
  END IF;
  
  -- Update price level
  UPDATE price_levels
  SET 
    tail_node_id = v_node_id,
    head_node_id = COALESCE(head_node_id, v_node_id),
    total_volume = total_volume + p_size,
    order_count = order_count + 1,
    updated_at = NOW()
  WHERE id = v_price_level_id;
  
  RETURN QUERY SELECT v_node_id, v_sequence, v_now_ns;
END;
$$;

-- Dequeue order (O(1))
CREATE OR REPLACE FUNCTION fifo_dequeue(
  p_price_level_id UUID
)
RETURNS TABLE(node_id UUID, order_id UUID, remaining_size DECIMAL(36, 18))
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_head_id UUID;
  v_order_id UUID;
  v_remaining DECIMAL(36, 18);
  v_next_id UUID;
BEGIN
  -- Get head node
  SELECT head_node_id INTO v_head_id
  FROM price_levels
  WHERE id = p_price_level_id;
  
  IF v_head_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get node details
  SELECT order_id, remaining_size, next_node_id
  INTO v_order_id, v_remaining, v_next_id
  FROM order_nodes
  WHERE id = v_head_id;
  
  -- Remove from linked list
  UPDATE order_nodes SET status = 'FILLED' WHERE id = v_head_id;
  
  -- Update price level
  UPDATE price_levels
  SET 
    head_node_id = v_next_id,
    tail_node_id = CASE WHEN tail_node_id = v_head_id THEN NULL ELSE tail_node_id END,
    total_volume = total_volume - v_remaining,
    order_count = order_count - 1,
    updated_at = NOW()
  WHERE id = p_price_level_id;
  
  -- Clear prev reference of new head
  IF v_next_id IS NOT NULL THEN
    UPDATE order_nodes SET prev_node_id = NULL WHERE id = v_next_id;
  END IF;
  
  RETURN QUERY SELECT v_head_id, v_order_id, v_remaining;
END;
$$;

-- Remove specific node (O(1))
CREATE OR REPLACE FUNCTION fifo_remove(
  p_node_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_node RECORD;
  v_price_level RECORD;
BEGIN
  SELECT * INTO v_node
  FROM order_nodes
  WHERE id = p_node_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update linked list
  IF v_node.prev_node_id IS NOT NULL THEN
    UPDATE order_nodes SET next_node_id = v_node.next_node_id 
    WHERE id = v_node.prev_node_id;
  END IF;
  
  IF v_node.next_node_id IS NOT NULL THEN
    UPDATE order_nodes SET prev_node_id = v_node.prev_node_id 
    WHERE id = v_node.next_node_id;
  END IF;
  
  -- Update price level
  SELECT * INTO v_price_level FROM price_levels WHERE id = v_node.price_level_id;
  
  UPDATE price_levels
  SET 
    head_node_id = CASE WHEN head_node_id = p_node_id THEN v_node.next_node_id ELSE head_node_id END,
    tail_node_id = CASE WHEN tail_node_id = p_node_id THEN v_node.prev_node_id ELSE tail_node_id END,
    total_volume = total_volume - v_node.remaining_size,
    order_count = order_count - 1,
    updated_at = NOW()
  WHERE id = v_node.price_level_id;
  
  -- Mark node as cancelled
  UPDATE order_nodes
  SET status = 'CANCELLED',
      cancel_requested = TRUE,
      cancel_requested_at = NOW(),
      updated_at = NOW()
  WHERE id = p_node_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 5. PRO-RATA MATCHING
-- ============================================

CREATE OR REPLACE FUNCTION calculate_pro_rata_fills(
  p_incoming_size DECIMAL(36, 18),
  p_price_level_id UUID
)
RETURNS TABLE(
  node_id UUID,
  order_id UUID,
  allocated_size DECIMAL(36, 18),
  is_remainder BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_volume DECIMAL(36, 18);
  v_remaining DECIMAL(36, 18);
  v_allocated DECIMAL(36, 18) := 0;
  v_node RECORD;
  v_proportional DECIMAL(36, 18);
  v_fill DECIMAL(36, 18);
BEGIN
  -- Get total volume at price level
  SELECT total_volume INTO v_total_volume
  FROM price_levels
  WHERE id = p_price_level_id;
  
  IF v_total_volume = 0 OR v_total_volume IS NULL THEN
    RETURN;
  END IF;
  
  v_remaining := p_incoming_size;
  
  -- First pass: proportional allocation
  FOR v_node IN
    SELECT * FROM order_nodes
    WHERE price_level_id = p_price_level_id
      AND status IN ('PENDING', 'PARTIAL')
    ORDER BY placed_at_ns ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    -- Calculate proportional allocation
    v_proportional := (p_incoming_size * v_node.remaining_size) / v_total_volume;
    v_fill := LEAST(v_proportional, v_node.remaining_size, v_remaining);
    
    IF v_fill > 0 THEN
      RETURN QUERY SELECT v_node.id, v_node.order_id, v_fill, FALSE;
      v_allocated := v_allocated + v_fill;
      v_remaining := v_remaining - v_fill;
    END IF;
  END LOOP;
  
  -- Second pass: distribute remainder by time priority
  IF v_remaining > 0 THEN
    FOR v_node IN
      SELECT * FROM order_nodes
      WHERE price_level_id = p_price_level_id
        AND status IN ('PENDING', 'PARTIAL')
      ORDER BY placed_at_ns ASC
    LOOP
      EXIT WHEN v_remaining <= 0;
      
      v_fill := LEAST(v_node.remaining_size - (
        SELECT COALESCE(SUM(allocated_size), 0)
        FROM calculate_pro_rata_fills
        WHERE node_id = v_node.id
      ), v_remaining);
      
      IF v_fill > 0 THEN
        RETURN QUERY SELECT v_node.id, v_node.order_id, v_fill, TRUE;
        v_remaining := v_remaining - v_fill;
      END IF;
    END LOOP;
  END IF;
END;
$$;

-- ============================================
-- 6. MATCHING ENGINE CORE
-- ============================================

CREATE OR REPLACE FUNCTION match_order_fifo(
  p_market_id UUID,
  p_side VARCHAR(4),
  p_price DECIMAL(36, 18),
  p_size DECIMAL(36, 18)
)
RETURNS TABLE(
  matched_order_id UUID,
  matched_account_id UUID,
  fill_size DECIMAL(36, 18),
  fill_price DECIMAL(36, 18),
  is_maker BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opposite_side VARCHAR(4);
  v_price_level RECORD;
  v_match RECORD;
  v_remaining DECIMAL(36, 18) := p_size;
  v_fill DECIMAL(36, 18);
BEGIN
  v_opposite_side := CASE WHEN p_side = 'BUY' THEN 'SELL' ELSE 'BUY' END;
  
  -- Find matching price levels
  FOR v_price_level IN
    SELECT * FROM price_levels
    WHERE market_id = p_market_id
      AND side = v_opposite_side
      AND CASE 
        WHEN p_side = 'BUY' THEN price <= p_price
        ELSE price >= p_price
      END
    ORDER BY 
      CASE WHEN p_side = 'BUY' THEN price ASC ELSE price DESC END,
      placed_at_ns ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    
    -- Get best order at this price level
    SELECT * INTO v_match
    FROM fifo_dequeue(v_price_level.id);
    
    IF v_match.node_id IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Calculate fill size
    v_fill := LEAST(v_match.remaining_size, v_remaining);
    
    RETURN QUERY SELECT 
      v_match.order_id,
      (SELECT account_id FROM order_nodes WHERE id = v_match.node_id),
      v_fill,
      v_price_level.price,
      FALSE; -- Taker
    
    v_remaining := v_remaining - v_fill;
    
    -- If partially filled, re-queue remainder
    IF v_match.remaining_size > v_fill THEN
      PERFORM fifo_enqueue(
        p_market_id,
        v_opposite_side,
        v_price_level.price,
        v_match.order_id,
        (SELECT account_id FROM order_nodes WHERE id = v_match.node_id),
        v_match.remaining_size - v_fill
      );
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- 7. FILL NOTIFICATION PIPELINE
-- ============================================

CREATE TABLE fill_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fill details
  fill_id UUID REFERENCES fill_records(id),
  order_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  market_id UUID NOT NULL,
  
  -- Fill data
  quantity DECIMAL(36, 18) NOT NULL,
  price DECIMAL(36, 18) NOT NULL,
  total_value DECIMAL(36, 18) NOT NULL,
  side VARCHAR(4) NOT NULL,
  
  -- Notification channels
  websocket_sent BOOLEAN DEFAULT FALSE,
  websocket_sent_at TIMESTAMPTZ,
  
  persistent_stored BOOLEAN DEFAULT FALSE,
  persistent_stored_at TIMESTAMPTZ,
  
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  
  webhook_delivered BOOLEAN DEFAULT FALSE,
  webhook_delivered_at TIMESTAMPTZ,
  webhook_url TEXT,
  
  audit_logged BOOLEAN DEFAULT FALSE,
  audit_logged_at TIMESTAMPTZ,
  
  analytics_streamed BOOLEAN DEFAULT FALSE,
  analytics_streamed_at TIMESTAMPTZ,
  
  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Sequence for ordering guarantee
  sequence_number BIGINT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_fill_notifications_user ON fill_notifications(user_id, created_at DESC);
CREATE INDEX idx_fill_notifications_pending ON fill_notifications(completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_fill_notifications_sequence ON fill_notifications(sequence_number);

-- Notification channel function
CREATE OR REPLACE FUNCTION notify_fill(
  p_fill_id UUID,
  p_order_id UUID,
  p_user_id UUID,
  p_market_id UUID,
  p_quantity DECIMAL(36, 18),
  p_price DECIMAL(36, 18),
  p_side VARCHAR(4)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
  v_sequence BIGINT;
  v_total_value DECIMAL(36, 18);
  v_is_large BOOLEAN;
  LARGE_FILL_THRESHOLD CONSTANT DECIMAL(36, 18) := 100000; -- $100k
BEGIN
  v_sequence := get_matching_sequence();
  v_total_value := p_quantity * p_price;
  v_is_large := v_total_value >= LARGE_FILL_THRESHOLD;
  
  INSERT INTO fill_notifications (
    fill_id,
    order_id,
    user_id,
    market_id,
    quantity,
    price,
    total_value,
    side,
    sequence_number,
    -- Mark immediate channels as attempted
    websocket_sent_at,
    persistent_stored_at,
    audit_logged_at,
    analytics_streamed_at
  ) VALUES (
    p_fill_id,
    p_order_id,
    p_user_id,
    p_market_id,
    p_quantity,
    p_price,
    v_total_value,
    p_side,
    v_sequence,
    NOW(),
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  -- Publish to Realtime for WebSocket delivery
  PERFORM pg_notify('fill_notification', jsonb_build_object(
    'notificationId', v_notification_id,
    'userId', p_user_id,
    'fillId', p_fill_id,
    'orderId', p_order_id,
    'quantity', p_quantity,
    'price', p_price,
    'totalValue', v_total_value,
    'side', p_side,
    'sequenceNumber', v_sequence,
    'isLarge', v_is_large,
    'timestamp', NOW()
  )::TEXT);
  
  RETURN v_notification_id;
END;
$$;

-- ============================================
-- 8. LATENCY METRICS
-- ============================================

CREATE TABLE matching_latency_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Operation details
  operation_type VARCHAR(50) NOT NULL, -- 'ENQUEUE', 'DEQUEUE', 'MATCH', 'NOTIFY'
  market_id UUID,
  
  -- Timing (microseconds)
  latency_us INTEGER NOT NULL,
  queue_depth INTEGER,
  
  -- System info
  worker_id INTEGER,
  numa_node INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_latency_metrics_operation ON matching_latency_metrics(operation_type, created_at);
CREATE INDEX idx_latency_metrics_market ON matching_latency_metrics(market_id, created_at);

-- Record latency metric
CREATE OR REPLACE FUNCTION record_latency(
  p_operation_type VARCHAR(50),
  p_latency_us INTEGER,
  p_market_id UUID DEFAULT NULL,
  p_queue_depth INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO matching_latency_metrics (
    operation_type,
    market_id,
    latency_us,
    queue_depth,
    worker_id,
    numa_node
  ) VALUES (
    p_operation_type,
    p_market_id,
    p_latency_us,
    p_queue_depth,
    0, -- Current worker
    0  -- Current NUMA node
  );
END;
$$;

-- ============================================
-- 9. VIEWS FOR MONITORING
-- ============================================

-- Order book depth view
CREATE VIEW order_book_depth AS
SELECT 
  pl.market_id,
  pl.side,
  pl.price,
  pl.total_volume,
  pl.order_count,
  pl.pro_rata_enabled,
  
  -- List all order IDs at this level
  (SELECT array_agg(on2.order_id ORDER BY on2.placed_at_ns)
   FROM order_nodes on2
   WHERE on2.price_level_id = pl.id
     AND on2.status IN ('PENDING', 'PARTIAL')
  ) as order_ids,
  
  -- Best quote flag
  CASE 
    WHEN pl.side = 'BUY' THEN
      pl.price = (SELECT MAX(price) FROM price_levels WHERE market_id = pl.market_id AND side = 'BUY')
    ELSE
      pl.price = (SELECT MIN(price) FROM price_levels WHERE market_id = pl.market_id AND side = 'SELL')
  END as is_best_quote

FROM price_levels pl
WHERE pl.order_count > 0;

-- Matching performance view
CREATE VIEW matching_performance AS
SELECT 
  operation_type,
  
  -- Percentiles
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_us) as p50_latency_us,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_us) as p99_latency_us,
  PERCENTILE_CONT(0.999) WITHIN GROUP (ORDER BY latency_us) as p999_latency_us,
  
  -- Aggregates
  AVG(latency_us)::INTEGER as avg_latency_us,
  MIN(latency_us) as min_latency_us,
  MAX(latency_us) as max_latency_us,
  COUNT(*) as operation_count,
  
  -- Time bucket
  DATE_TRUNC('minute', created_at) as time_bucket

FROM matching_latency_metrics
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY operation_type, DATE_TRUNC('minute', created_at)
ORDER BY time_bucket DESC;

-- ============================================
-- 10. RLS POLICIES
-- ============================================

ALTER TABLE order_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE fill_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order nodes"
ON order_nodes FOR SELECT
USING (account_id = auth.uid());

CREATE POLICY "System can manage order nodes"
ON order_nodes FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view price levels"
ON price_levels FOR SELECT
USING (true);

CREATE POLICY "Users can view their own fill notifications"
ON fill_notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create fill notifications"
ON fill_notifications FOR INSERT
WITH CHECK (true);

-- ============================================
-- 11. TRIGGER: AUTO-CLEANUP OLD METRICS
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete metrics older than 7 days
  DELETE FROM matching_latency_metrics
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Delete completed notifications older than 30 days
  DELETE FROM fill_notifications
  WHERE completed_at < NOW() - INTERVAL '30 days';
  
  RETURN NULL;
END;
$$;

-- Run cleanup periodically (via cron or manual trigger)
COMMENT ON FUNCTION cleanup_old_metrics IS 'Run this periodically to clean up old metrics';
