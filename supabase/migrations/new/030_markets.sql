-- ============================================================
-- DOMAIN: markets
-- FIXES: Missing columns, FK constraints, and incomplete JSON RPCs
-- ============================================================

CREATE TABLE IF NOT EXISTS markets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  slug              TEXT UNIQUE NOT NULL,
  
  status            market_status NOT NULL DEFAULT 'draft',
  
  min_tick          NUMERIC NOT NULL DEFAULT 0.01,
  max_tick          NUMERIC NOT NULL DEFAULT 0.99,
  current_tick      NUMERIC NOT NULL DEFAULT 0.50,
  fee_percent       NUMERIC NOT NULL DEFAULT 0.02,
  
  market_type       TEXT NOT NULL DEFAULT 'binary',
  realized_volatility_24h NUMERIC DEFAULT 0,
  
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_markets_event_status ON markets(event_id, status);
CREATE INDEX IF NOT EXISTS idx_markets_ends_at ON markets(ends_at);

-- Auto-update updated_at on any row change
DROP TRIGGER IF EXISTS markets_updated_at ON markets;
CREATE TRIGGER markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: markets
-- Version: v2
-- Replaces: create_market functionality in all previous patch files
-- Callers: app/api/markets/route.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION create_market_v2(
  p_event_id        UUID,
  p_slug            TEXT,
  p_min_tick        NUMERIC,
  p_max_tick        NUMERIC,
  p_fee_percent     NUMERIC,
  p_market_type     TEXT,
  p_ends_at         TIMESTAMPTZ
) RETURNS JSONB AS $$
DECLARE
  v_market_id UUID;
BEGIN
  INSERT INTO markets (
    event_id, slug, min_tick, max_tick, fee_percent, market_type, ends_at
  ) VALUES (
    p_event_id, p_slug, p_min_tick, p_max_tick, p_fee_percent, p_market_type, p_ends_at
  ) RETURNING id INTO v_market_id;

  RETURN jsonb_build_object('success', true, 'market_id', v_market_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
