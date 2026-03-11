-- ============================================================
-- PHASE 3C: Order/Trade Backward Compatibility Wrappers
-- Ensures existing frontend callers continue to work
-- ============================================================

-- WRAPPER: Legacy place_order_atomic → v2
-- Existing callers use TEXT for side/type instead of enum
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_user_id    UUID,
  p_market_id  UUID,
  p_side       TEXT,
  p_price      NUMERIC,
  p_size       NUMERIC,
  p_order_type TEXT DEFAULT 'limit'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN place_order_atomic_v2(
    p_user_id    := p_user_id,
    p_market_id  := p_market_id,
    p_side       := p_side::order_side,
    p_type       := p_order_type::order_type,
    p_price      := p_price,
    p_quantity   := p_size
  );
END;
$$;

-- WRAPPER: Legacy submit_order → v2
CREATE OR REPLACE FUNCTION submit_order(
  p_user_id   UUID,
  p_market_id UUID,
  p_side      TEXT,
  p_price     NUMERIC,
  p_size      NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN place_order_atomic_v2(
    p_user_id    := p_user_id,
    p_market_id  := p_market_id,
    p_side       := p_side::order_side,
    p_type       := 'limit',
    p_price      := p_price,
    p_quantity   := p_size
  );
END;
$$;

-- WRAPPER: Legacy cancel_order → v2
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id  UUID,
  p_user_id   UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If user_id not provided, get from auth context
  IF p_user_id IS NULL THEN
    p_user_id := auth.uid();
  END IF;
  RETURN cancel_order_v2(p_order_id, p_user_id);
END;
$$;

-- WRAPPER: Legacy get_order_book → v2
CREATE OR REPLACE FUNCTION get_order_book(
  p_market_id UUID,
  p_depth     INT DEFAULT 20
) RETURNS TABLE (side TEXT, price NUMERIC, total_quantity NUMERIC, order_count BIGINT)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_order_book_v2(p_market_id, 'YES', p_depth);
END;
$$;

-- WRAPPER: Legacy settle_market → v2
CREATE OR REPLACE FUNCTION settle_market(
  p_market_id    UUID,
  p_outcome      TEXT,
  p_resolved_by  UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN settle_market_v2(p_market_id, p_outcome);
END;
$$;

-- WRAPPER: Legacy get_user_orders → v2
CREATE OR REPLACE FUNCTION get_user_orders(
  p_user_id UUID, p_limit INT DEFAULT 50
) RETURNS TABLE (
  id UUID, market_id UUID, side order_side, order_type order_type,
  outcome outcome_type, price NUMERIC, quantity BIGINT,
  filled_quantity BIGINT, remaining_quantity NUMERIC,
  status order_status, total_cost NUMERIC, fee_amount NUMERIC,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_user_orders_v2(p_user_id, NULL, NULL, p_limit, 0);
END;
$$;

-- WRAPPER: Legacy get_market_trades → v2
CREATE OR REPLACE FUNCTION get_market_trades(
  p_market_id UUID, p_limit INT DEFAULT 50
) RETURNS TABLE (
  id UUID, price NUMERIC, quantity BIGINT, outcome outcome_type,
  created_at TIMESTAMPTZ, trade_type TEXT
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_market_trades_v2(p_market_id, p_limit, 0);
END;
$$;
