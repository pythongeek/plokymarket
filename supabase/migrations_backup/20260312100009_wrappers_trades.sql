-- ============================================================
-- DOMAIN: trades
-- WRAPPERS: Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls settle_market_v2
CREATE OR REPLACE FUNCTION settle_market(
  p_market_id    UUID,
  p_outcome      TEXT,   -- 'YES' | 'NO' | outcome string
  p_resolved_by  UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- settle_market_v2 has the correct payout distribution logic
  -- that was missing from the 061 version
  RETURN settle_market_v2(
    p_market_id  := p_market_id,
    p_resolution := p_outcome
  );
END;
$$;
