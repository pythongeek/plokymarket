-- ============================================================
-- Migration: 070_social_and_market_features.sql
-- Adds: user_bookmarks, market_followers, comment_likes, price_history
-- These support Gaps 2, 5, 6, 8 from the Event Page Feature Gap audit
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Gap 2: Bookmarks & Follows
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_bookmarks (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user    ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_market  ON user_bookmarks(market_id);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bookmarks"
  ON user_bookmarks FOR ALL
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS market_followers (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id         UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  notify_on_trade   BOOLEAN DEFAULT false,
  notify_on_resolve BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_market_followers_market ON market_followers(market_id);
CREATE INDEX IF NOT EXISTS idx_market_followers_user   ON market_followers(user_id);

ALTER TABLE market_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own follows"
  ON market_followers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view follower counts"
  ON market_followers FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- Gap 6: Comment Likes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own likes"
  ON comment_likes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes"
  ON comment_likes FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- Gap 8: Price History (for sparklines & 24h deltas)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id   UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  outcome     TEXT NOT NULL DEFAULT 'YES',
  price       DECIMAL(10,4) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_market
  ON price_history(market_id, recorded_at DESC);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history"
  ON price_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert price history"
  ON price_history FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- Helper view: comment_like_counts (avoids N+1 on CommentSection)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW comment_like_counts AS
  SELECT comment_id, COUNT(*) AS like_count
  FROM comment_likes
  GROUP BY comment_id;
