-- ============================================================
-- DOMAIN: positions
-- PURPOSE: User holdings, average cost, and realized/unrealized PnL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.positions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  market_id         UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  outcome           outcome_type NOT NULL,
  
  quantity          NUMERIC NOT NULL DEFAULT 0,
  average_price     NUMERIC NOT NULL DEFAULT 0,
  realized_pnl      NUMERIC NOT NULL DEFAULT 0,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, market_id, outcome)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_positions_user_market ON public.positions(user_id, market_id);

-- Trigger to update updated_at
CREATE TRIGGER trg_positions_updated_at
BEFORE UPDATE ON public.positions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC: get_user_positions_v2 ────────────────────
CREATE OR REPLACE FUNCTION get_user_positions_v2(
  p_user_id UUID,
  p_market_id UUID DEFAULT NULL
) RETURNS TABLE (
  market_id UUID,
  outcome outcome_type,
  quantity NUMERIC,
  average_price NUMERIC,
  realized_pnl NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT pos.market_id, pos.outcome, pos.quantity, pos.average_price, pos.realized_pnl
  FROM public.positions pos
  WHERE pos.user_id = p_user_id
    AND (p_market_id IS NULL OR pos.market_id = p_market_id)
    AND pos.quantity > 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
