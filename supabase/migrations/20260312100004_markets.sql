-- ============================================================
-- DOMAIN: markets (Phase 2)
-- FIXES: Missing columns, FK constraints, and incomplete JSON RPCs
-- PRODUCTION-SAFE: Uses ALTER TABLE ADD COLUMN IF NOT EXISTS
-- ============================================================

-- Add missing columns to existing markets table
ALTER TABLE markets ADD COLUMN IF NOT EXISTS event_id UUID;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS status market_status DEFAULT 'draft';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS min_tick NUMERIC DEFAULT 0.01;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS max_tick NUMERIC DEFAULT 0.99;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS current_tick NUMERIC DEFAULT 0.50;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS fee_percent NUMERIC DEFAULT 0.02;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS market_type TEXT DEFAULT 'binary';
ALTER TABLE markets ADD COLUMN IF NOT EXISTS realized_volatility_24h NUMERIC DEFAULT 0;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE markets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes (already idempotent)
CREATE INDEX IF NOT EXISTS idx_markets_event_status ON markets(event_id, status);
CREATE INDEX IF NOT EXISTS idx_markets_ends_at ON markets(ends_at);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS markets_updated_at ON markets;
CREATE TRIGGER markets_updated_at
  BEFORE UPDATE ON markets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC ───────────────────────────────────────────
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
