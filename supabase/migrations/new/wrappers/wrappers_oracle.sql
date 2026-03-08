-- ============================================================
-- DOMAIN: oracle
-- WRAPPERS: Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls resolve_market_v2
CREATE OR REPLACE FUNCTION resolve_market(
  p_market_id       UUID,
  p_data            TEXT
) RETURNS JSONB AS $$
BEGIN
  RETURN resolve_market_v2(p_market_id, p_data::JSONB);
END;
$$ LANGUAGE plpgsql;
