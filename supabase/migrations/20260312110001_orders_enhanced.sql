-- ============================================================
-- PHASE 3A: Orders Domain Enhancement (Production-Safe)
-- Adds missing columns + advanced features to existing orders table
-- Production state: 24 columns, 8 rows, 11 indexes, 6 triggers
-- ============================================================

-- ── 1. ADD MISSING COLUMNS ─────────────────────────────────
-- These columns may be needed by the new RPCs
ALTER TABLE orders ADD COLUMN IF NOT EXISTS remaining_quantity NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS average_fill_price NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fee_rate NUMERIC DEFAULT 0.02;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_post_only BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_reduce_only BOOLEAN DEFAULT FALSE;

-- ── 2. PERFORMANCE INDEXES ─────────────────────────────────
-- Composite index for the matching engine hot path
CREATE INDEX IF NOT EXISTS idx_orders_matching_v2 
  ON orders(market_id, outcome, side, status, price) 
  WHERE status = 'open';

-- For user portfolio queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
  ON orders(user_id, status) 
  WHERE status IN ('open', 'partially_filled');

-- For order expiration cron
CREATE INDEX IF NOT EXISTS idx_orders_expires_at 
  ON orders(expires_at) 
  WHERE expires_at IS NOT NULL AND status = 'open';

-- ── 3. TRIGGER: Auto-calculate remaining_quantity ──────────
CREATE OR REPLACE FUNCTION calculate_remaining_quantity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_quantity := NEW.quantity - NEW.filled_quantity;
  IF NEW.remaining_quantity <= 0 THEN
    NEW.status := 'filled';
    NEW.filled_at := NOW();
  ELSIF NEW.filled_quantity > 0 THEN
    NEW.status := 'partially_filled';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_remaining ON orders;
CREATE TRIGGER trg_calc_remaining
  BEFORE INSERT OR UPDATE OF filled_quantity ON orders
  FOR EACH ROW EXECUTE FUNCTION calculate_remaining_quantity();

-- ── 4. CANONICAL RPCs ──────────────────────────────────────

-- 4a. place_order_atomic_v2: The production order placement function
-- Validates inputs, freezes funds, inserts order, returns result
CREATE OR REPLACE FUNCTION place_order_atomic_v2(
  p_user_id     UUID,
  p_market_id   UUID,
  p_side        order_side,
  p_type        order_type,
  p_price       NUMERIC,
  p_quantity    NUMERIC,
  p_outcome     outcome_type DEFAULT 'YES',
  p_tif         TEXT DEFAULT 'GTC',
  p_stop_price  NUMERIC DEFAULT NULL,
  p_post_only   BOOLEAN DEFAULT FALSE,
  p_client_id   TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_cost NUMERIC;
  v_market_status TEXT;
  v_fee NUMERIC;
BEGIN
  -- Validate market is open
  SELECT status INTO v_market_status FROM markets WHERE id = p_market_id;
  IF v_market_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market not found');
  END IF;
  IF v_market_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market is not active: ' || v_market_status);
  END IF;

  -- Validate price range (0.01 - 0.99 for binary markets)
  IF p_price < 0.01 OR p_price > 0.99 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Price must be between 0.01 and 0.99');
  END IF;

  -- Validate quantity
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity must be positive');
  END IF;

  -- Calculate cost and fee
  v_cost := p_price * p_quantity;
  v_fee := v_cost * 0.02; -- 2% fee

  -- Freeze funds atomically (pessimistic lock)
  PERFORM 1 FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF (SELECT balance FROM wallets WHERE user_id = p_user_id) < (v_cost + v_fee) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds', 
      'required', v_cost + v_fee,
      'available', (SELECT balance FROM wallets WHERE user_id = p_user_id));
  END IF;

  -- Deduct from available, add to locked
  UPDATE wallets 
  SET balance = balance - (v_cost + v_fee), 
      locked_balance = locked_balance + (v_cost + v_fee)
  WHERE user_id = p_user_id;

  -- Insert order
  INSERT INTO orders (
    user_id, market_id, side, order_type, outcome, price, quantity,
    filled_quantity, remaining_quantity, status, total_cost, fee_amount, fee_rate,
    time_in_force, stop_price, is_post_only, client_order_id, source
  ) VALUES (
    p_user_id, p_market_id, p_side, p_type, p_outcome, p_price, p_quantity,
    0, p_quantity, 'open', v_cost, v_fee, 0.02,
    p_tif, p_stop_price, p_post_only, p_client_id, 'web'
  ) RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'success', true, 
    'order_id', v_order_id,
    'cost', v_cost,
    'fee', v_fee,
    'total', v_cost + v_fee
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4b. cancel_order_v2: Safely cancel an open order and release locked funds
CREATE OR REPLACE FUNCTION cancel_order_v2(
  p_order_id    UUID,
  p_user_id     UUID
) RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_refund NUMERIC;
BEGIN
  -- Lock the order row
  SELECT * INTO v_order FROM orders WHERE id = p_order_id AND user_id = p_user_id FOR UPDATE;
  
  IF v_order IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or not yours');
  END IF;
  
  IF v_order.status NOT IN ('open', 'partially_filled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order cannot be cancelled: ' || v_order.status);
  END IF;

  -- Calculate refund for unfilled portion
  v_refund := (v_order.remaining_quantity * v_order.price) + 
              (v_order.remaining_quantity * v_order.price * v_order.fee_rate);

  -- Update order status
  UPDATE orders 
  SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;

  -- Release locked funds back to available
  UPDATE wallets 
  SET balance = balance + v_refund, 
      locked_balance = locked_balance - v_refund
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true, 
    'order_id', p_order_id, 
    'refunded', v_refund,
    'filled_quantity', v_order.filled_quantity
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4c. get_order_book_v2: Returns aggregated order book for a market
CREATE OR REPLACE FUNCTION get_order_book_v2(
  p_market_id   UUID,
  p_outcome     outcome_type DEFAULT 'YES',
  p_depth       INT DEFAULT 20
) RETURNS TABLE (
  side TEXT,
  price NUMERIC,
  total_quantity NUMERIC,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 'buy'::TEXT, o.price, SUM(o.remaining_quantity), COUNT(*)
    FROM orders o
    WHERE o.market_id = p_market_id 
      AND o.outcome = p_outcome
      AND o.side = 'buy'
      AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY o.price DESC
    LIMIT p_depth
  )
  UNION ALL
  (
    SELECT 'sell'::TEXT, o.price, SUM(o.remaining_quantity), COUNT(*)
    FROM orders o
    WHERE o.market_id = p_market_id 
      AND o.outcome = p_outcome
      AND o.side = 'sell'
      AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY o.price ASC
    LIMIT p_depth
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 4d. get_user_orders_v2: Paginated user order history with filters
CREATE OR REPLACE FUNCTION get_user_orders_v2(
  p_user_id     UUID,
  p_market_id   UUID DEFAULT NULL,
  p_status      order_status DEFAULT NULL,
  p_limit       INT DEFAULT 50,
  p_offset      INT DEFAULT 0
) RETURNS TABLE (
  id UUID, market_id UUID, side order_side, order_type order_type,
  outcome outcome_type, price NUMERIC, quantity BIGINT,
  filled_quantity BIGINT, remaining_quantity NUMERIC,
  status order_status, total_cost NUMERIC, fee_amount NUMERIC,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.market_id, o.side, o.order_type, o.outcome, o.price, 
    o.quantity, o.filled_quantity, o.remaining_quantity,
    o.status, o.total_cost, o.fee_amount, o.created_at, o.updated_at
  FROM orders o
  WHERE o.user_id = p_user_id
    AND (p_market_id IS NULL OR o.market_id = p_market_id)
    AND (p_status IS NULL OR o.status = p_status)
  ORDER BY o.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 4e. expire_stale_orders: Cron-callable function to auto-cancel expired orders
CREATE OR REPLACE FUNCTION expire_stale_orders()
RETURNS JSONB AS $$
DECLARE
  v_count INT;
BEGIN
  WITH expired AS (
    UPDATE orders 
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE status = 'open' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
    RETURNING id, user_id, remaining_quantity, price, fee_rate
  )
  -- Release locked funds for each expired order
  UPDATE wallets w
  SET balance = w.balance + (e.remaining_quantity * e.price * (1 + e.fee_rate)),
      locked_balance = w.locked_balance - (e.remaining_quantity * e.price * (1 + e.fee_rate))
  FROM expired e
  WHERE w.user_id = e.user_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'expired_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
