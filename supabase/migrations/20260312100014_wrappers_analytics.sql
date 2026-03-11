-- ============================================================
-- DOMAIN: analytics
-- WRAPPERS: Backward compatibility for legacy RPC signatures
-- ============================================================

-- WRAPPER: deprecated, calls update_leaderboard_v2
CREATE OR REPLACE FUNCTION update_leaderboard(
  p_user_id         UUID,
  p_score_delta     INTEGER
) RETURNS JSONB AS $$
BEGIN
  RETURN update_leaderboard_v2(p_user_id, p_score_delta::NUMERIC);
END;
$$ LANGUAGE plpgsql;

-- WRAPPER: deprecated, calls get_leaderboard_v2
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_limit  INT DEFAULT 100,
  p_offset INT DEFAULT 0
) RETURNS TABLE(user_id UUID, username TEXT, pnl NUMERIC, rank INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_leaderboard_v2(
    p_limit  := p_limit,
    p_offset := p_offset
  );
END;
$$;

-- WRAPPER: deprecated, calls get_leaderboard_v2
CREATE OR REPLACE FUNCTION fetch_leaderboard(
  limit_count INT DEFAULT 100
) RETURNS TABLE(user_id UUID, username TEXT, pnl NUMERIC, rank INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM get_leaderboard_v2(
    p_limit  := limit_count,
    p_offset := 0
  );
END;
$$;
