-- ============================================================
-- DOMAIN: analytics (Phase 4) — PRODUCTION SAFE
-- Adds leaderboard columns + RPCs + price history RPC
-- Skips partitioned table migration (high risk)
-- ============================================================

-- Add missing columns to existing leaderboard table
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS score NUMERIC DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

DROP TRIGGER IF EXISTS leaderboard_updated_at ON leaderboard;
CREATE TRIGGER leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── CANONICAL RPC: update_leaderboard_v2 ───────────────────
CREATE OR REPLACE FUNCTION update_leaderboard_v2(
  p_user_id UUID, p_score_delta NUMERIC
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

-- ── PRICE HISTORY BRIN INDEX (if table exists) ─────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'price_history' AND schemaname = 'public') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_price_history_recorded_brin ON price_history USING brin(recorded_at)';
  END IF;
END $$;

-- ── GET PRICE HISTORY OHLC RPC ─────────────────────────────
CREATE OR REPLACE FUNCTION get_price_history(
  p_market_id UUID, p_interval_hours INT DEFAULT 24
) RETURNS TABLE (
  timestamp_bucket TIMESTAMPTZ, open_price NUMERIC,
  high_price NUMERIC, low_price NUMERIC, close_price NUMERIC, volume NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', recorded_at),
    (array_agg(price ORDER BY recorded_at ASC))[1],
    MAX(price), MIN(price),
    (array_agg(price ORDER BY recorded_at DESC))[1],
    COUNT(*) * 10.0
  FROM price_history
  WHERE market_id = p_market_id
    AND recorded_at >= NOW() - (p_interval_hours || ' hours')::INTERVAL
  GROUP BY date_trunc('hour', recorded_at)
  ORDER BY 1 ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
