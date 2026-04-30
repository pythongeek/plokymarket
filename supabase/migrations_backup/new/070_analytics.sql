-- ============================================================
-- DOMAIN: analytics
-- FIXES: leaderboard logic and drops SERIAL anti-pattern
-- ============================================================

CREATE TABLE IF NOT EXISTS leaderboard (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  score             NUMERIC NOT NULL DEFAULT 0,
  
  -- The fix: Avoid SERIAL, use standard IDENTITY
  rank              BIGINT GENERATED ALWAYS AS IDENTITY,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- Auto-update updated_at on any row change
DROP TRIGGER IF EXISTS leaderboard_updated_at ON leaderboard;
CREATE TRIGGER leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PRICE HISTORY (Partitioned)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history_v2 (
  id                UUID DEFAULT gen_random_uuid(),
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  price             NUMERIC NOT NULL,
  recorded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- RANGE by quarter 
CREATE TABLE IF NOT EXISTS price_history_2026_q1 PARTITION OF price_history_v2 FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
CREATE TABLE IF NOT EXISTS price_history_2026_q2 PARTITION OF price_history_v2 FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS price_history_2026_q3 PARTITION OF price_history_v2 FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
CREATE TABLE IF NOT EXISTS price_history_2026_q4 PARTITION OF price_history_v2 FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'price_history' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND relkind = 'r') THEN
     
     INSERT INTO price_history_v2 SELECT * FROM price_history;
     ALTER TABLE price_history RENAME TO price_history_legacy;
     ALTER TABLE price_history_v2 RENAME TO price_history;
  ELSIF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'price_history' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
     ALTER TABLE price_history_v2 RENAME TO price_history;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_price_history_recorded_brin ON price_history USING brin(market_id, recorded_at);

-- ── CANONICAL RPC ───────────────────────────────────────────
-- Domain: analytics
-- Version: v2
-- Replaces: update_leaderboard and mock data inserts mixing
-- Callers: app/api/analytics/leaderboard/route.ts
-- Safe to drop wrappers after: 2026-03-29
CREATE OR REPLACE FUNCTION update_leaderboard_v2(
  p_user_id         UUID,
  p_score_delta     NUMERIC
) RETURNS JSONB AS $$
BEGIN
  INSERT INTO leaderboard (user_id, score)
  VALUES (p_user_id, p_score_delta)
  ON CONFLICT (user_id) DO UPDATE 
  SET score = leaderboard.score + EXCLUDED.score;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================
-- MATERIALIZED LEADERBOARD
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_mv AS
SELECT 
    l.user_id, 
    u.display_name AS username, 
    l.score as pnl, 
    l.rank
FROM leaderboard l
JOIN users u ON u.id = l.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_mv_user_id ON leaderboard_mv(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mv_rank ON leaderboard_mv(rank);

CREATE OR REPLACE FUNCTION get_leaderboard_v2(
  p_limit  INT DEFAULT 100,
  p_offset INT DEFAULT 0
) RETURNS TABLE(user_id UUID, username TEXT, pnl NUMERIC, rank INT) AS $$
BEGIN
  RETURN QUERY SELECT mv.user_id, mv.username, mv.pnl, mv.rank::INT 
  FROM leaderboard_mv mv
  ORDER BY mv.rank ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- ============================================================
-- RPC: get_price_history (OHLC Aggregation)
-- Callers: Chart components needing Open, High, Low, Close
-- ============================================================
CREATE OR REPLACE FUNCTION get_price_history(
  p_market_id UUID,
  p_interval_hours INT DEFAULT 24
) RETURNS TABLE (
  timestamp_bucket TIMESTAMPTZ,
  open_price NUMERIC,
  high_price NUMERIC,
  low_price  NUMERIC,
  close_price NUMERIC,
  volume NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', recorded_at) AS timestamp_bucket,
    (array_agg(price ORDER BY recorded_at ASC))[1] AS open_price,
    MAX(price) AS high_price,
    MIN(price) AS low_price,
    (array_agg(price ORDER BY recorded_at DESC))[1] AS close_price,
    COUNT(*) * 10.0 AS volume  -- mocked volume extraction scalar
  FROM price_history
  WHERE market_id = p_market_id
    AND recorded_at >= NOW() - (p_interval_hours || ' hours')::INTERVAL
  GROUP BY date_trunc('hour', recorded_at)
  ORDER BY timestamp_bucket ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
