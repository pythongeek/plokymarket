-- ============================================================
-- DOMAIN: trades
-- FIXES: settle_market multiple versions and trade immutability
-- ============================================================

CREATE TABLE IF NOT EXISTS trades_v2 (
  id                UUID DEFAULT gen_random_uuid(),
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  
  maker_order_id    UUID NOT NULL REFERENCES orders(id),
  taker_order_id    UUID NOT NULL REFERENCES orders(id),
  
  maker_id          UUID NOT NULL REFERENCES users(id),
  taker_id          UUID NOT NULL REFERENCES users(id),
  
  price             NUMERIC NOT NULL,
  quantity          NUMERIC NOT NULL,
  
  executed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, executed_at)
) PARTITION BY RANGE (executed_at);

-- Default partitions for near future 2026
CREATE TABLE IF NOT EXISTS trades_2026_03 PARTITION OF trades_v2 FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS trades_2026_04 PARTITION OF trades_v2 FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE IF NOT EXISTS trades_2026_05 PARTITION OF trades_v2 FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'trades' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND relkind = 'r') THEN
     
     INSERT INTO trades_v2 SELECT * FROM trades;
     ALTER TABLE trades RENAME TO trades_legacy;
     ALTER TABLE trades_v2 RENAME TO trades;
  ELSIF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'trades' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
     ALTER TABLE trades_v2 RENAME TO trades;
  END IF;
END $$;

-- Indexes on canonical trades table
CREATE INDEX IF NOT EXISTS idx_trades_market_executed ON trades(market_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_executed_brin ON trades USING brin(executed_at);

-- Auto-update updated_at on any row change
DROP TRIGGER IF EXISTS trades_updated_at ON trades;
CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: trades
-- Version: v2
-- Replaces: settle_market, settle_market_v2
-- Callers: app/api/admin/markets/settle/route.ts, supabase/functions/admin-settle/index.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION settle_market_v2(
  p_market_id       UUID,
  p_resolution      TEXT
) RETURNS JSONB AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE markets 
  SET status = 'resolved', resolution_value = p_resolution, resolved_at = NOW() 
  WHERE id = p_market_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  IF v_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'market_id', p_market_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
