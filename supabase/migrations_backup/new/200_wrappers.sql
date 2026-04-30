-- ============================================================
-- DOMAIN: wrappers
-- PURPOSE: Backward compatibility for legacy RPC signatures
-- Redirects old function calls to canonical v2/v3 versions
-- ============================================================

-- ── ANALYTICS WRAPPERS ───────────────────────────────────────
DROP FUNCTION IF EXISTS update_leaderboard(UUID, INTEGER);
CREATE OR REPLACE FUNCTION update_leaderboard(
  p_user_id         UUID,
  p_score_delta     INTEGER
) RETURNS JSONB AS $$
BEGIN
  RETURN update_leaderboard_v2(p_user_id, p_score_delta::NUMERIC);
END;
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_leaderboard(INT, INT);
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

-- ── ORDERS WRAPPERS ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION place_order_atomic(
  p_user_id     UUID,
  p_market_id   UUID,
  p_side        order_side,
  p_type        order_type,
  p_price       NUMERIC,
  p_quantity    NUMERIC
) RETURNS JSONB AS $$
BEGIN
  RETURN place_order_atomic_v2(p_user_id, p_market_id, p_side, p_type, p_price, p_quantity);
END;
$$ LANGUAGE plpgsql;

-- ── WALLETS WRAPPERS ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION freeze_funds(
  p_user_id UUID, p_amount NUMERIC
) RETURNS JSONB AS $$
BEGIN
  RETURN freeze_funds_v2(p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql;

-- ── EVENTS WRAPPERS ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_event_complete(
  p_title           VARCHAR(200),
  p_description     TEXT,
  p_answer_type     answer_type,
  p_tags            JSONB,
  p_category_id     UUID,
  p_resolution_source TEXT,
  p_starts_at       TIMESTAMPTZ,
  p_ends_at         TIMESTAMPTZ
) RETURNS JSONB AS $$
BEGIN
  RETURN create_event_complete_v3(p_title, p_description, p_answer_type, p_tags, p_category_id, p_resolution_source, p_starts_at, p_ends_at);
END;
$$ LANGUAGE plpgsql;
