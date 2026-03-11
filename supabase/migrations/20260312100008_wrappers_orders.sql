-- ============================================================
-- DOMAIN: orders
-- WRAPPERS: Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls place_order_atomic_v2
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_user_id    UUID,
  p_market_id  UUID,
  p_side       TEXT,         -- 'buy' or 'sell' (or 'YES'/'NO' if old code sent that)
  p_price      NUMERIC,      -- 0.01 to 0.99
  p_size       NUMERIC,      -- in USDC
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

-- WRAPPER: deprecated, calls place_order_atomic_v2
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
    p_type       := 'limit',   -- default for old callers
    p_price      := p_price,
    p_quantity   := p_size
  );
END;
$$;
