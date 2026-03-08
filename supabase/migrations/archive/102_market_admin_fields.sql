-- Migration 102: Market Admin Fields
-- Adds financial and blockchain fields to markets table
-- and creates admin update function

-- ============================================
-- 1. Add missing columns to markets table
-- ============================================

ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS initial_liquidity NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS condition_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS token1 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS token2 VARCHAR(255),
  ADD COLUMN IF NOT EXISTS neg_risk BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS resolver_reference TEXT;

-- Volume column (if not already present)
ALTER TABLE public.markets
  ADD COLUMN IF NOT EXISTS volume NUMERIC DEFAULT 0;

-- ============================================
-- 2. Admin function to update market fields
-- ============================================

CREATE OR REPLACE FUNCTION public.admin_update_market_fields(
  p_market_id UUID,
  p_fields JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update only the fields provided in p_fields
  UPDATE public.markets
  SET
    initial_liquidity = COALESCE((p_fields->>'initial_liquidity')::NUMERIC, initial_liquidity),
    volume            = COALESCE((p_fields->>'volume')::NUMERIC, volume),
    condition_id      = COALESCE(p_fields->>'condition_id', condition_id),
    token1            = COALESCE(p_fields->>'token1', token1),
    token2            = COALESCE(p_fields->>'token2', token2),
    neg_risk          = COALESCE((p_fields->>'neg_risk')::BOOLEAN, neg_risk),
    resolver_reference = COALESCE(p_fields->>'resolver_reference', resolver_reference),
    updated_at        = NOW()
  WHERE id = p_market_id
  RETURNING jsonb_build_object(
    'id', id,
    'initial_liquidity', initial_liquidity,
    'volume', volume,
    'condition_id', condition_id,
    'token1', token1,
    'token2', token2,
    'neg_risk', neg_risk,
    'resolver_reference', resolver_reference,
    'updated_at', updated_at
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Market not found: %', p_market_id;
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users (admin check done in API layer)
GRANT EXECUTE ON FUNCTION public.admin_update_market_fields(UUID, JSONB) TO authenticated;

-- ============================================
-- 3. Update get_admin_events to include new fields
-- ============================================

-- (markets fields are already accessible via direct query in admin API)

COMMENT ON COLUMN public.markets.initial_liquidity IS 'Seed funding in USDT for AMM price curve initialization';
COMMENT ON COLUMN public.markets.condition_id IS 'Conditional Token Framework identifier for on-chain settlement';
COMMENT ON COLUMN public.markets.token1 IS 'YES outcome token contract address (0x-prefixed)';
COMMENT ON COLUMN public.markets.token2 IS 'NO outcome token contract address (0x-prefixed)';
COMMENT ON COLUMN public.markets.neg_risk IS 'Negative risk flag: shared collateral pool for correlated markets';
COMMENT ON COLUMN public.markets.resolver_reference IS 'Oracle/contract address responsible for final resolution';
