-- ============================================================
-- PHASE 4D FIX v2: RLS + Wrappers
-- Drops old leaderboard wrappers before recreating with new return types
-- ============================================================

-- ── 1. RLS FOR LEADERBOARD ─────────────────────────────────
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leaderboard viewable by everyone" ON leaderboard;
CREATE POLICY "Leaderboard viewable by everyone" ON leaderboard FOR SELECT USING (true);

-- ── 2. RLS FOR ORACLE_DISPUTES ─────────────────────────────
ALTER TABLE oracle_disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view disputes" ON oracle_disputes;
CREATE POLICY "Users can view disputes" ON oracle_disputes FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can create disputes" ON oracle_disputes;
CREATE POLICY "Users can create disputes" ON oracle_disputes FOR INSERT WITH CHECK (auth.uid() = disputer_id);

-- ── 3. FIX LEADERBOARD WRAPPERS ───────────────────────────
-- Drop old versions with incompatible return types
DO $$ BEGIN
  DROP FUNCTION IF EXISTS get_leaderboard(INT, INT);
  DROP FUNCTION IF EXISTS fetch_leaderboard(INT);
  DROP FUNCTION IF EXISTS update_leaderboard(UUID, INTEGER);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some leaderboard functions could not be dropped: %', SQLERRM;
END $$;

-- Recreate with correct types
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit INT DEFAULT 100, p_offset INT DEFAULT 0
) RETURNS TABLE(
  user_id UUID, username TEXT, pnl NUMERIC, score NUMERIC,
  win_count INT, loss_count INT, trade_count INT, win_rate NUMERIC,
  rank_tier TEXT, streak INT, rank BIGINT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_leaderboard_v2(p_limit, p_offset);
END;
$$;

CREATE OR REPLACE FUNCTION fetch_leaderboard(
  limit_count INT DEFAULT 100
) RETURNS TABLE(
  user_id UUID, username TEXT, pnl NUMERIC, score NUMERIC,
  win_count INT, loss_count INT, trade_count INT, win_rate NUMERIC,
  rank_tier TEXT, streak INT, rank BIGINT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_leaderboard_v2(limit_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION update_leaderboard(
  p_user_id UUID, p_score_delta INTEGER
) RETURNS JSONB AS $$
BEGIN
  RETURN update_leaderboard_v2(p_user_id, p_score_delta::NUMERIC);
END;
$$ LANGUAGE plpgsql;

-- ── 4. WALLET WRAPPERS ────────────────────────────────────
CREATE OR REPLACE FUNCTION unlock_wallet_funds(
  p_user_id UUID, p_amount NUMERIC
) RETURNS VOID AS $$
BEGIN
  PERFORM release_funds_v2(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_exchange_rate(
  pair TEXT, new_rate NUMERIC
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT COALESCE((SELECT is_admin FROM users WHERE id = auth.uid()), false) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  PERFORM update_exchange_rate_v2(pair, new_rate, NOW());
END;
$$;
