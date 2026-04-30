-- ============================================================
-- DOMAIN: oracle
-- FIXES: disputes schema issues and missing timestamps
-- ============================================================

CREATE TABLE IF NOT EXISTS oracle_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  
  status            TEXT NOT NULL DEFAULT 'pending',
  resolution_data   JSONB,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oracle_market_id ON oracle_requests(market_id);

-- Auto-update updated_at on any row change
DROP TRIGGER IF EXISTS oracle_updated_at ON oracle_requests;
CREATE TRIGGER oracle_updated_at
  BEFORE UPDATE ON oracle_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: oracle
-- Version: v2
-- Replaces: resolve_market functionality from early versions
-- Callers: supabase/functions/oracle-resolve/index.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION resolve_market_v2(
  p_market_id       UUID,
  p_data            JSONB
) RETURNS JSONB AS $$
DECLARE
  v_req_id UUID;
BEGIN
  INSERT INTO oracle_requests (market_id, resolution_data, status)
  VALUES (p_market_id, p_data, 'resolved')
  RETURNING id INTO v_req_id;

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
