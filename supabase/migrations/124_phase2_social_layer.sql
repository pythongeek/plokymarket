-- ============================================================
-- Migration 124: Social Layer (Phase 2)
-- Bookmarks, Follows, Comment Likes
-- ============================================================
-- Technical Implementation:
-- - Composite Primary Keys prevent duplicate entries
-- - Trigger logic for atomic like_count updates
-- - Indexes ensure fast queries even with thousands of records
-- ============================================================

-- ============================================================
-- User Bookmarks
-- ============================================================
CREATE TABLE IF NOT EXISTS user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

-- Indexes for bookmark queries
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_market ON user_bookmarks(market_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_created ON user_bookmarks(created_at DESC);

-- RLS: Users can only see their own bookmarks
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "bookmarks_own_select" ON user_bookmarks FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "bookmarks_own_insert" ON user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "bookmarks_own_delete" ON user_bookmarks FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Market Followers
-- ============================================================
CREATE TABLE IF NOT EXISTS market_followers (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  notify_on_trade BOOLEAN DEFAULT false,
  notify_on_resolve BOOLEAN DEFAULT true,
  notify_on_price_change BOOLEAN DEFAULT false,
  price_alert_threshold DECIMAL(5,2),     -- Alert when price moves +/- this %
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, market_id)
);

-- Indexes for follower queries
CREATE INDEX IF NOT EXISTS idx_followers_user ON market_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_followers_market ON market_followers(market_id);
CREATE INDEX IF NOT EXISTS idx_followers_notify_trade ON market_followers(market_id, notify_on_trade) WHERE notify_on_trade = true;
CREATE INDEX IF NOT EXISTS idx_followers_notify_resolve ON market_followers(market_id, notify_on_resolve) WHERE notify_on_resolve = true;

-- RLS: Users can only see their own follows
ALTER TABLE market_followers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "followers_own_select" ON market_followers FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "followers_own_insert" ON market_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "followers_own_update" ON market_followers FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "followers_own_delete" ON market_followers FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Comment Likes
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES market_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

-- Indexes for comment like queries
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

-- RLS policies for comment likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "comment_likes_own_select" ON comment_likes FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "comment_likes_read_all" ON comment_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "comment_likes_own_insert" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "comment_likes_own_delete" ON comment_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- Add like_count to market_comments (computed via trigger)
-- ============================================================
ALTER TABLE market_comments 
  ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

-- Trigger to keep like_count in sync (Atomic Operation)
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE market_comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE market_comments 
    SET like_count = GREATEST(0, like_count - 1) 
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_comment_like_count ON comment_likes;
CREATE TRIGGER trg_comment_like_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- ============================================================
-- Function: Toggle bookmark (convenience function)
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_bookmark(p_market_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if bookmark exists
  SELECT EXISTS(
    SELECT 1 FROM user_bookmarks 
    WHERE user_id = auth.uid() AND market_id = p_market_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove bookmark
    DELETE FROM user_bookmarks 
    WHERE user_id = auth.uid() AND market_id = p_market_id;
    v_result := jsonb_build_object('bookmarked', false, 'market_id', p_market_id);
  ELSE
    -- Add bookmark
    INSERT INTO user_bookmarks (user_id, market_id)
    VALUES (auth.uid(), p_market_id);
    v_result := jsonb_build_object('bookmarked', true, 'market_id', p_market_id);
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Toggle market follow (convenience function)
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_market_follow(
  p_market_id UUID,
  p_notify_on_trade BOOLEAN DEFAULT false,
  p_notify_on_resolve BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if follow exists
  SELECT EXISTS(
    SELECT 1 FROM market_followers 
    WHERE user_id = auth.uid() AND market_id = p_market_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unfollow
    DELETE FROM market_followers 
    WHERE user_id = auth.uid() AND market_id = p_market_id;
    v_result := jsonb_build_object('following', false, 'market_id', p_market_id);
  ELSE
    -- Follow
    INSERT INTO market_followers (
      user_id, market_id, notify_on_trade, notify_on_resolve
    ) VALUES (
      auth.uid(), p_market_id, p_notify_on_trade, p_notify_on_resolve
    );
    v_result := jsonb_build_object('following', true, 'market_id', p_market_id);
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Function: Toggle comment like (convenience function)
-- ============================================================
CREATE OR REPLACE FUNCTION toggle_comment_like(p_comment_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if like exists
  SELECT EXISTS(
    SELECT 1 FROM comment_likes 
    WHERE user_id = auth.uid() AND comment_id = p_comment_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Unlike
    DELETE FROM comment_likes 
    WHERE user_id = auth.uid() AND comment_id = p_comment_id;
    v_result := jsonb_build_object('liked', false, 'comment_id', p_comment_id);
  ELSE
    -- Like
    INSERT INTO comment_likes (user_id, comment_id)
    VALUES (auth.uid(), p_comment_id);
    v_result := jsonb_build_object('liked', true, 'comment_id', p_comment_id);
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_bookmarks IS 'User saved/bookmarked markets for quick access';
COMMENT ON TABLE market_followers IS 'Users following markets with notification preferences';
COMMENT ON TABLE comment_likes IS 'Likes on market comments for engagement tracking';
