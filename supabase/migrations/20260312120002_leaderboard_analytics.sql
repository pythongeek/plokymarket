-- ============================================================
-- PHASE 4B: Leaderboard + Analytics (Production-Safe)
-- Creates leaderboard table (MISSING), materialized view,
-- and comprehensive analytics RPCs
-- ============================================================

-- ── 1. CREATE LEADERBOARD TABLE ────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  username    TEXT,
  score       NUMERIC NOT NULL DEFAULT 0,
  total_pnl   NUMERIC NOT NULL DEFAULT 0,
  win_count   INT NOT NULL DEFAULT 0,
  loss_count  INT NOT NULL DEFAULT 0,
  trade_count INT NOT NULL DEFAULT 0,
  win_rate    NUMERIC GENERATED ALWAYS AS (
    CASE WHEN (win_count + loss_count) > 0 
      THEN ROUND(win_count::NUMERIC / (win_count + loss_count) * 100, 2) 
      ELSE 0 
    END
  ) STORED,
  best_trade  NUMERIC NOT NULL DEFAULT 0,
  worst_trade NUMERIC NOT NULL DEFAULT 0,
  streak      INT NOT NULL DEFAULT 0,
  rank_tier   TEXT NOT NULL DEFAULT 'bronze',
  badge_ids   JSONB DEFAULT '[]'::JSONB,
  season      TEXT DEFAULT '2026-Q1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_pnl ON leaderboard(total_pnl DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_tier ON leaderboard(rank_tier);
CREATE INDEX IF NOT EXISTS idx_leaderboard_season ON leaderboard(season);

DROP TRIGGER IF EXISTS leaderboard_updated_at ON leaderboard;
CREATE TRIGGER leaderboard_updated_at
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 2. LEADERBOARD MATERIALIZED VIEW ──────────────────────
-- Pre-computed cached view for fast leaderboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_mv AS
SELECT 
  l.user_id,
  COALESCE(l.username, u.display_name, u.email) AS username,
  l.total_pnl AS pnl,
  l.score,
  l.win_count,
  l.loss_count,
  l.trade_count,
  l.win_rate,
  l.rank_tier,
  l.streak,
  ROW_NUMBER() OVER (ORDER BY l.score DESC) AS rank
FROM leaderboard l
JOIN users u ON u.id = l.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_mv_user ON leaderboard_mv(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mv_rank ON leaderboard_mv(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mv_score ON leaderboard_mv(score DESC);

-- ── 3. LEADERBOARD RPCs ────────────────────────────────────

-- 3a. update_leaderboard_v2: Record a trade result
CREATE OR REPLACE FUNCTION update_leaderboard_v2(
  p_user_id UUID, p_score_delta NUMERIC
) RETURNS JSONB AS $$
BEGIN
  INSERT INTO leaderboard (user_id, score, username)
  VALUES (
    p_user_id, p_score_delta,
    (SELECT COALESCE(display_name, email) FROM users WHERE id = p_user_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    score = leaderboard.score + EXCLUDED.score,
    updated_at = NOW();

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 3b. record_trade_result_v2: Full trade result with win/loss tracking
CREATE OR REPLACE FUNCTION record_trade_result_v2(
  p_user_id UUID,
  p_pnl NUMERIC,
  p_is_win BOOLEAN
) RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_score_delta NUMERIC;
BEGIN
  -- Score calculation: wins give 10 + PnL%, losses subtract 5
  v_score_delta := CASE WHEN p_is_win THEN 10 + ABS(p_pnl) ELSE -5 END;

  INSERT INTO leaderboard (user_id, score, total_pnl, win_count, loss_count, trade_count, best_trade, worst_trade, streak, username)
  VALUES (
    p_user_id, GREATEST(v_score_delta, 0), p_pnl,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    CASE WHEN p_is_win THEN 0 ELSE 1 END,
    1,
    CASE WHEN p_pnl > 0 THEN p_pnl ELSE 0 END,
    CASE WHEN p_pnl < 0 THEN p_pnl ELSE 0 END,
    CASE WHEN p_is_win THEN 1 ELSE 0 END,
    (SELECT COALESCE(display_name, email) FROM users WHERE id = p_user_id)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    score = GREATEST(leaderboard.score + v_score_delta, 0),
    total_pnl = leaderboard.total_pnl + p_pnl,
    win_count = leaderboard.win_count + CASE WHEN p_is_win THEN 1 ELSE 0 END,
    loss_count = leaderboard.loss_count + CASE WHEN p_is_win THEN 0 ELSE 1 END,
    trade_count = leaderboard.trade_count + 1,
    best_trade = GREATEST(leaderboard.best_trade, p_pnl),
    worst_trade = LEAST(leaderboard.worst_trade, p_pnl),
    streak = CASE WHEN p_is_win THEN leaderboard.streak + 1 ELSE 0 END,
    updated_at = NOW();

  -- Update rank tier based on new score
  SELECT CASE
    WHEN score >= 1000 THEN 'diamond'
    WHEN score >= 500 THEN 'platinum'
    WHEN score >= 200 THEN 'gold'
    WHEN score >= 50 THEN 'silver'
    ELSE 'bronze'
  END INTO v_tier
  FROM leaderboard WHERE user_id = p_user_id;

  UPDATE leaderboard SET rank_tier = v_tier WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'score_delta', v_score_delta, 'tier', v_tier);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3c. get_leaderboard_v2: Paginated with tier filtering
CREATE OR REPLACE FUNCTION get_leaderboard_v2(
  p_limit  INT DEFAULT 100,
  p_offset INT DEFAULT 0,
  p_tier   TEXT DEFAULT NULL,
  p_season TEXT DEFAULT NULL
) RETURNS TABLE(
  user_id UUID, username TEXT, pnl NUMERIC, score NUMERIC,
  win_count INT, loss_count INT, trade_count INT, win_rate NUMERIC,
  rank_tier TEXT, streak INT, rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT mv.user_id, mv.username, mv.pnl, mv.score,
    mv.win_count::INT, mv.loss_count::INT, mv.trade_count::INT, mv.win_rate,
    mv.rank_tier, mv.streak::INT, mv.rank
  FROM leaderboard_mv mv
  WHERE (p_tier IS NULL OR mv.rank_tier = p_tier)
  ORDER BY mv.rank ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- 3d. get_user_rank_v2: Single user's leaderboard position
CREATE OR REPLACE FUNCTION get_user_rank_v2(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', mv.user_id,
    'username', mv.username,
    'rank', mv.rank,
    'score', mv.score,
    'pnl', mv.pnl,
    'tier', mv.rank_tier,
    'win_rate', mv.win_rate,
    'streak', mv.streak,
    'trade_count', mv.trade_count,
    'total_players', (SELECT COUNT(*) FROM leaderboard_mv)
  ) INTO v_result
  FROM leaderboard_mv mv
  WHERE mv.user_id = p_user_id;

  RETURN COALESCE(v_result, jsonb_build_object('found', false));
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- ── 4. PRICE HISTORY ENHANCEMENTS ──────────────────────────
-- Add columns to existing price_history table
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS open_price NUMERIC;
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS high_price NUMERIC;
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS low_price NUMERIC;
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS close_price NUMERIC;
ALTER TABLE price_history ADD COLUMN IF NOT EXISTS interval_type TEXT DEFAULT 'tick';

CREATE INDEX IF NOT EXISTS idx_price_history_market_time 
  ON price_history(market_id, recorded_at DESC);

-- 4a. get_price_history_ohlc: OHLC data for charts
CREATE OR REPLACE FUNCTION get_price_history_ohlc(
  p_market_id UUID,
  p_interval TEXT DEFAULT '1h',
  p_limit INT DEFAULT 168
) RETURNS TABLE (
  bucket TIMESTAMPTZ,
  open_price NUMERIC,
  high_price NUMERIC,
  low_price NUMERIC,
  close_price NUMERIC,
  volume NUMERIC,
  trade_count BIGINT
) AS $$
DECLARE
  v_interval INTERVAL;
BEGIN
  v_interval := CASE p_interval
    WHEN '5m' THEN INTERVAL '5 minutes'
    WHEN '15m' THEN INTERVAL '15 minutes'
    WHEN '1h' THEN INTERVAL '1 hour'
    WHEN '4h' THEN INTERVAL '4 hours'  
    WHEN '1d' THEN INTERVAL '1 day'
    ELSE INTERVAL '1 hour'
  END;

  RETURN QUERY
  SELECT
    date_trunc('hour', ph.recorded_at) AS bucket,
    (array_agg(ph.price ORDER BY ph.recorded_at ASC))[1] AS open_price,
    MAX(ph.price) AS high_price,
    MIN(ph.price) AS low_price,
    (array_agg(ph.price ORDER BY ph.recorded_at DESC))[1] AS close_price,
    COALESCE(SUM(ph.volume_at_time), 0) AS volume,
    COUNT(*) AS trade_count
  FROM price_history ph
  WHERE ph.market_id = p_market_id
    AND ph.recorded_at >= NOW() - (p_limit * v_interval)
  GROUP BY date_trunc('hour', ph.recorded_at)
  ORDER BY bucket ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

-- ── 5. PLATFORM ANALYTICS RPCs ─────────────────────────────

-- 5a. get_platform_stats_v2: Admin dashboard overview
CREATE OR REPLACE FUNCTION get_platform_stats_v2()
RETURNS JSONB AS $$
DECLARE v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'active_users_24h', (SELECT COUNT(DISTINCT user_id) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours'),
    'total_markets', (SELECT COUNT(*) FROM markets),
    'active_markets', (SELECT COUNT(*) FROM markets WHERE status = 'active'),
    'resolved_markets', (SELECT COUNT(*) FROM markets WHERE status = 'resolved'),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'open_orders', (SELECT COUNT(*) FROM orders WHERE status IN ('open', 'partially_filled')),
    'total_trades', (SELECT COUNT(*) FROM trades),
    'total_volume', (SELECT COALESCE(SUM(price * quantity), 0) FROM trades),
    'volume_24h', (SELECT COALESCE(SUM(price * quantity), 0) FROM trades WHERE created_at > NOW() - INTERVAL '24 hours'),
    'total_deposits', (SELECT COALESCE(SUM(total_deposited), 0) FROM wallets),
    'total_withdrawals', (SELECT COALESCE(SUM(total_withdrawn), 0) FROM wallets),
    'total_wallet_balance', (SELECT COALESCE(SUM(balance + locked_balance), 0) FROM wallets),
    'leaderboard_players', (SELECT COUNT(*) FROM leaderboard),
    'timestamp', NOW()
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5b. get_user_analytics_v2: Per-user trading analytics
CREATE OR REPLACE FUNCTION get_user_analytics_v2(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id),
    'open_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id AND status IN ('open', 'partially_filled')),
    'filled_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id AND status = 'filled'),
    'cancelled_orders', (SELECT COUNT(*) FROM orders WHERE user_id = p_user_id AND status = 'cancelled'),
    'total_trades_as_maker', (SELECT COUNT(*) FROM trades WHERE maker_id = p_user_id),
    'total_trades_as_taker', (SELECT COUNT(*) FROM trades WHERE taker_id = p_user_id),
    'total_volume', (
      SELECT COALESCE(SUM(price * quantity), 0) FROM trades 
      WHERE maker_id = p_user_id OR taker_id = p_user_id
    ),
    'active_positions', (SELECT COUNT(*) FROM positions WHERE user_id = p_user_id AND quantity > 0),
    'total_pnl', (SELECT COALESCE(SUM(realized_pnl), 0) FROM positions WHERE user_id = p_user_id),
    'wallet', (SELECT get_wallet_summary_v2(p_user_id)),
    'rank', (SELECT get_user_rank_v2(p_user_id)),
    'member_since', (SELECT created_at FROM users WHERE id = p_user_id)
  ) INTO v_result;

  RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;
