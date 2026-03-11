-- ============================================================
-- PHASE 3B: Trades Domain Enhancement (Production-Safe)
-- Adds missing columns + advanced features to existing trades table
-- Production state: 10 columns, 0 rows
-- ============================================================

-- ── 1. ADD MISSING COLUMNS ─────────────────────────────────
ALTER TABLE trades ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS maker_fee NUMERIC DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS taker_fee NUMERIC DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_type TEXT DEFAULT 'limit';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending';
ALTER TABLE trades ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── 2. PERFORMANCE INDEXES ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_trades_market_created 
  ON trades(market_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trades_maker_taker 
  ON trades(maker_id, taker_id);

CREATE INDEX IF NOT EXISTS idx_trades_settlement 
  ON trades(settlement_status) 
  WHERE settlement_status = 'pending';

-- ── 3. TRIGGER: Auto-update updated_at ─────────────────────
DROP TRIGGER IF EXISTS trades_updated_at ON trades;
CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 4. CANONICAL RPCs ──────────────────────────────────────

-- 4a. execute_trade_v2: Core matching engine trade execution
-- Called when a new order matches an existing resting order
CREATE OR REPLACE FUNCTION execute_trade_v2(
  p_market_id       UUID,
  p_buy_order_id    UUID,
  p_sell_order_id   UUID,
  p_maker_id        UUID,
  p_taker_id        UUID,
  p_price           NUMERIC,
  p_quantity         NUMERIC,
  p_outcome         outcome_type DEFAULT 'YES'
) RETURNS JSONB AS $$
DECLARE
  v_trade_id UUID;
  v_maker_fee NUMERIC;
  v_taker_fee NUMERIC;
BEGIN
  -- Maker rebate: -0.5% (negative = rebate)
  -- Taker fee: +1.5%
  v_maker_fee := p_price * p_quantity * (-0.005); -- rebate
  v_taker_fee := p_price * p_quantity * 0.015;

  -- Insert trade record
  INSERT INTO trades (
    market_id, buy_order_id, sell_order_id, outcome, price, quantity,
    maker_id, taker_id, fee_amount, maker_fee, taker_fee, trade_type
  ) VALUES (
    p_market_id, p_buy_order_id, p_sell_order_id, p_outcome, p_price, p_quantity,
    p_maker_id, p_taker_id, v_maker_fee + v_taker_fee, v_maker_fee, v_taker_fee, 'limit'
  ) RETURNING id INTO v_trade_id;

  -- Update filled quantities on both orders
  UPDATE orders SET filled_quantity = filled_quantity + p_quantity WHERE id = p_buy_order_id;
  UPDATE orders SET filled_quantity = filled_quantity + p_quantity WHERE id = p_sell_order_id;

  -- Update or create positions for both parties
  PERFORM upsert_position_v2(p_maker_id, p_market_id, p_outcome, p_quantity, p_price, 'buy');
  PERFORM upsert_position_v2(p_taker_id, p_market_id, p_outcome, p_quantity, p_price, 'sell');

  -- Release locked funds for filled portion and apply fees
  -- Maker gets rebate
  UPDATE wallets SET 
    locked_balance = locked_balance - (p_price * p_quantity * 1.02),
    balance = balance + ABS(v_maker_fee) -- rebate back to available
  WHERE user_id = p_maker_id;

  -- Taker pays fee
  UPDATE wallets SET 
    locked_balance = locked_balance - (p_price * p_quantity * 1.02)
  WHERE user_id = p_taker_id;

  -- Update market current_tick to last trade price
  UPDATE markets SET current_tick = p_price WHERE id = p_market_id;

  RETURN jsonb_build_object(
    'success', true, 
    'trade_id', v_trade_id,
    'price', p_price,
    'quantity', p_quantity,
    'maker_fee', v_maker_fee,
    'taker_fee', v_taker_fee
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4b. upsert_position_v2: Create or update user position
CREATE OR REPLACE FUNCTION upsert_position_v2(
  p_user_id     UUID,
  p_market_id   UUID,
  p_outcome     outcome_type,
  p_quantity    NUMERIC,
  p_price       NUMERIC,
  p_side        TEXT
) RETURNS VOID AS $$
DECLARE
  v_existing RECORD;
  v_new_qty NUMERIC;
  v_new_avg NUMERIC;
BEGIN
  SELECT * INTO v_existing FROM positions 
  WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome
  FOR UPDATE;

  IF v_existing IS NULL THEN
    -- New position
    INSERT INTO positions (user_id, market_id, outcome, quantity, average_price)
    VALUES (p_user_id, p_market_id, p_outcome, 
      CASE WHEN p_side = 'buy' THEN p_quantity ELSE -p_quantity END,
      p_price);
  ELSE
    -- Update existing position with volume-weighted average price
    IF p_side = 'buy' THEN
      v_new_qty := v_existing.quantity + p_quantity;
      IF v_new_qty > 0 THEN
        v_new_avg := ((v_existing.quantity * v_existing.average_price) + (p_quantity * p_price)) / v_new_qty;
      ELSE
        v_new_avg := p_price;
      END IF;
    ELSE
      v_new_qty := v_existing.quantity - p_quantity;
      v_new_avg := v_existing.average_price; -- avg doesn't change on sell
    END IF;

    UPDATE positions 
    SET quantity = v_new_qty, average_price = v_new_avg, updated_at = NOW()
    WHERE id = v_existing.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4c. settle_market_v2 OVERRIDE: Complete market settlement with payout
-- Replaces the earlier stub with full payout logic
CREATE OR REPLACE FUNCTION settle_market_v2(
  p_market_id    UUID,
  p_resolution   TEXT  -- 'YES' or 'NO'
) RETURNS JSONB AS $$
DECLARE
  v_pos RECORD;
  v_total_payout NUMERIC := 0;
  v_settled_count INT := 0;
BEGIN
  -- 1. Update market status
  UPDATE markets 
  SET status = 'resolved', 
      resolution_value = p_resolution, 
      resolved_at = NOW()
  WHERE id = p_market_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market not found or not active');
  END IF;

  -- 2. Cancel all open orders for this market and refund
  WITH cancelled AS (
    UPDATE orders 
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE market_id = p_market_id AND status IN ('open', 'partially_filled')
    RETURNING user_id, remaining_quantity, price, fee_rate
  )
  UPDATE wallets w
  SET balance = w.balance + (c.remaining_quantity * c.price * (1 + c.fee_rate)),
      locked_balance = w.locked_balance - (c.remaining_quantity * c.price * (1 + c.fee_rate))
  FROM cancelled c
  WHERE w.user_id = c.user_id;

  -- 3. Settle positions: winners get $1 per share, losers get $0
  FOR v_pos IN 
    SELECT user_id, outcome, quantity, average_price 
    FROM positions 
    WHERE market_id = p_market_id AND quantity > 0
  LOOP
    IF v_pos.outcome::TEXT = p_resolution THEN
      -- Winner: payout = quantity * $1.00
      UPDATE wallets SET balance = balance + v_pos.quantity WHERE user_id = v_pos.user_id;
      v_total_payout := v_total_payout + v_pos.quantity;
    END IF;
    -- Losers get nothing (their cost was already deducted at order time)
    
    -- Record realized PnL
    UPDATE positions SET 
      realized_pnl = CASE 
        WHEN v_pos.outcome::TEXT = p_resolution THEN v_pos.quantity - (v_pos.quantity * v_pos.average_price)
        ELSE -(v_pos.quantity * v_pos.average_price)
      END,
      updated_at = NOW()
    WHERE user_id = v_pos.user_id AND market_id = p_market_id AND outcome = v_pos.outcome;

    v_settled_count := v_settled_count + 1;
  END LOOP;

  -- 4. Mark all trades as settled
  UPDATE trades SET settlement_status = 'settled', settled_at = NOW()
  WHERE market_id = p_market_id;

  RETURN jsonb_build_object(
    'success', true,
    'market_id', p_market_id,
    'resolution', p_resolution,
    'positions_settled', v_settled_count,
    'total_payout', v_total_payout
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4d. get_market_trades_v2: Public trade history for a market
CREATE OR REPLACE FUNCTION get_market_trades_v2(
  p_market_id   UUID,
  p_limit       INT DEFAULT 50,
  p_offset      INT DEFAULT 0
) RETURNS TABLE (
  id UUID, price NUMERIC, quantity BIGINT, outcome outcome_type,
  created_at TIMESTAMPTZ, trade_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.price, t.quantity, t.outcome, t.created_at, t.trade_type
  FROM trades t
  WHERE t.market_id = p_market_id
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 4e. get_user_positions_v2: All active positions for a user
CREATE OR REPLACE FUNCTION get_user_positions_v2(
  p_user_id UUID
) RETURNS TABLE (
  market_id UUID, outcome outcome_type, quantity BIGINT,
  average_price NUMERIC, realized_pnl NUMERIC, current_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.market_id, p.outcome, p.quantity, p.average_price, p.realized_pnl,
    (p.quantity * COALESCE(m.current_tick, p.average_price)) as current_value
  FROM positions p
  JOIN markets m ON m.id = p.market_id
  WHERE p.user_id = p_user_id AND p.quantity > 0
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 4f. get_market_stats_v2: Aggregate market statistics
CREATE OR REPLACE FUNCTION get_market_stats_v2(
  p_market_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_volume', COALESCE(SUM(t.price * t.quantity), 0),
    'trade_count', COUNT(t.id),
    'last_price', (SELECT price FROM trades WHERE market_id = p_market_id ORDER BY created_at DESC LIMIT 1),
    'high_24h', (SELECT MAX(price) FROM trades WHERE market_id = p_market_id AND created_at > NOW() - INTERVAL '24 hours'),
    'low_24h', (SELECT MIN(price) FROM trades WHERE market_id = p_market_id AND created_at > NOW() - INTERVAL '24 hours'),
    'open_interest', (SELECT COALESCE(SUM(remaining_quantity), 0) FROM orders WHERE market_id = p_market_id AND status IN ('open', 'partially_filled')),
    'active_orders', (SELECT COUNT(*) FROM orders WHERE market_id = p_market_id AND status IN ('open', 'partially_filled'))
  ) INTO v_stats
  FROM trades t
  WHERE t.market_id = p_market_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
