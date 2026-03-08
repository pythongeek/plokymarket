-- ============================================================
-- DOMAIN: markets
-- WRAPPERS: Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls create_market_v2
CREATE OR REPLACE FUNCTION create_market(
  p_event_id        UUID,
  p_slug            TEXT,
  p_ends_at         TIMESTAMPTZ DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  RETURN create_market_v2(
    p_event_id    := p_event_id,
    p_slug        := p_slug,
    p_min_tick    := 0.01,
    p_max_tick    := 0.99,
    p_fee_percent := 0.02,
    p_market_type := 'binary',
    p_ends_at     := p_ends_at
  );
END;
$$ LANGUAGE plpgsql;
