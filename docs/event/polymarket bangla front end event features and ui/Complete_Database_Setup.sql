-- ===============================================
-- উন্নত Polymarket-স্টাইল প্ল্যাটফর্ম
-- সম্পূর্ণ ডাটাবেস সেটআপ স্ক্রিপ্ট
-- ===============================================
-- 
-- এই ফাইলটি Supabase SQL Editor-এ রান করুন
-- প্রতিটি সেকশন ক্রমানুসারে এক্সিকিউট করুন
-- 
-- ===============================================

-- ===============================================
-- ১. Extensions সক্রিয় করুন
-- ===============================================

-- UUID জেনারেশনের জন্য
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ফুল-টেক্সট সার্চের জন্য
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===============================================
-- ২. Custom Types তৈরি করুন
-- ===============================================

CREATE TYPE trading_status AS ENUM ('active', 'paused', 'resolved', 'cancelled', 'pending');
CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop_loss', 'oco');
CREATE TYPE order_side AS ENUM ('yes', 'no', 'buy', 'sell');
CREATE TYPE order_status AS ENUM ('pending', 'filled', 'partial', 'cancelled', 'expired');
CREATE TYPE notification_type AS ENUM (
  'trade_filled', 
  'trade_partial', 
  'price_alert', 
  'market_resolved', 
  'comment_reply', 
  'new_follower',
  'market_ending', 
  'position_update'
);

-- ===============================================
-- ৩. মূল টেবিল তৈরি করুন
-- ===============================================

-- ৩.১ Events টেবিল (মার্কেট ডাটা)
CREATE TABLE events (
  -- প্রাথমিক আইডেন্টিফায়ার
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  
  -- মার্কেট তথ্য
  name VARCHAR(255) NOT NULL,
  question TEXT NOT NULL CHECK (length(question) BETWEEN 20 AND 2000),
  description TEXT,
  ticker VARCHAR(255) UNIQUE,
  
  -- ক্যাটাগরি এবং মেটাডাটা
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'Sports', 'Politics', 'Crypto', 'Economics', 
    'Technology', 'Entertainment', 'World Events', 
    'Science', 'Culture', 'Business'
  )),
  subcategory VARCHAR(100),
  tags TEXT[],
  
  -- ভিজুয়াল অ্যাসেট
  image_url TEXT,
  thumbnail_url TEXT,
  banner_url TEXT,
  
  -- ভেরিফিকেশন এবং স্ট্যাটাস
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  trading_status trading_status DEFAULT 'active',
  
  -- উত্তরের অপশন
  answer1 VARCHAR(255) DEFAULT 'Yes',
  answer2 VARCHAR(255) DEFAULT 'No',
  answer_type VARCHAR(20) DEFAULT 'binary' CHECK (
    answer_type IN ('binary', 'multiple', 'scalar')
  ),
  
  -- টাইম ম্যানেজমেন্ট
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  resolution_delay INTEGER DEFAULT 60 CHECK (resolution_delay BETWEEN 0 AND 20160),
  closed_time TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- ফিন্যান্সিয়াল ট্র্যাকিং
  initial_liquidity NUMERIC(20, 2) DEFAULT 1000 CHECK (initial_liquidity >= 0),
  current_liquidity NUMERIC(20, 2) DEFAULT 1000 CHECK (current_liquidity >= 0),
  volume NUMERIC(20, 2) DEFAULT 0 CHECK (volume >= 0),
  total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
  unique_traders INTEGER DEFAULT 0 CHECK (unique_traders >= 0),
  
  -- প্রাইসিং
  current_yes_price NUMERIC(5, 4) DEFAULT 0.5000 CHECK (current_yes_price BETWEEN 0.0001 AND 0.9999),
  current_no_price NUMERIC(5, 4) DEFAULT 0.5000 CHECK (current_no_price BETWEEN 0.0001 AND 0.9999),
  price_24h_change NUMERIC(6, 4),
  
  -- ব্লকচেইন ইন্টিগ্রেশন
  condition_id VARCHAR(255),
  token1 VARCHAR(255),
  token2 VARCHAR(255),
  resolver_reference TEXT,
  neg_risk BOOLEAN DEFAULT FALSE,
  
  -- রেজোলিউশন
  resolved_outcome INTEGER CHECK (resolved_outcome IN (1, 2, NULL)),
  resolved_by UUID REFERENCES auth.users(id),
  winning_token VARCHAR(255),
  resolution_source TEXT,
  
  -- পজ কন্ট্রোল
  pause_reason TEXT,
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES auth.users(id),
  estimated_resume_at TIMESTAMPTZ,
  
  -- অডিট ট্রেইল
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- সার্চ ভেক্টর
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(question, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'C')
  ) STORED,
  
  CONSTRAINT valid_time_range CHECK (ends_at > starts_at),
  CONSTRAINT valid_prices CHECK (current_yes_price + current_no_price <= 1.0)
);

-- ৩.২ User Profiles টেবিল
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- প্রোফাইল তথ্য
  username VARCHAR(50) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  display_name VARCHAR(100),
  bio TEXT CHECK (length(bio) <= 500),
  avatar_url TEXT,
  banner_url TEXT,
  
  -- লোকেশন এবং ল্যাঙ্গুয়েজ
  country_code CHAR(2),
  timezone VARCHAR(50) DEFAULT 'UTC',
  preferred_language VARCHAR(10) DEFAULT 'en',
  
  -- ভেরিফিকেশন
  is_verified BOOLEAN DEFAULT FALSE,
  is_pro BOOLEAN DEFAULT FALSE,
  verification_level INTEGER DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 3),
  
  -- স্ট্যাটিসটিক্স
  total_trades INTEGER DEFAULT 0 CHECK (total_trades >= 0),
  total_volume NUMERIC(20, 2) DEFAULT 0 CHECK (total_volume >= 0),
  total_profit NUMERIC(20, 2) DEFAULT 0,
  win_rate NUMERIC(5, 2) DEFAULT 0 CHECK (win_rate BETWEEN 0 AND 100),
  reputation_score INTEGER DEFAULT 0,
  
  -- ব্যালেন্স
  usdc_balance NUMERIC(20, 2) DEFAULT 0 CHECK (usdc_balance >= 0),
  locked_balance NUMERIC(20, 2) DEFAULT 0 CHECK (locked_balance >= 0),
  
  -- নোটিফিকেশন সেটিংস
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  trade_alerts BOOLEAN DEFAULT TRUE,
  market_updates BOOLEAN DEFAULT TRUE,
  
  -- প্রাইভেসি সেটিংস
  profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (
    profile_visibility IN ('public', 'followers', 'private')
  ),
  show_trades BOOLEAN DEFAULT TRUE,
  show_portfolio BOOLEAN DEFAULT FALSE,
  
  -- সোশ্যাল
  followers_count INTEGER DEFAULT 0 CHECK (followers_count >= 0),
  following_count INTEGER DEFAULT 0 CHECK (following_count >= 0),
  
  -- অডিট
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  CONSTRAINT sufficient_balance CHECK (usdc_balance >= locked_balance)
);

-- ৩.৩ Trades টেবিল
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ট্রেড তথ্য
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- অর্ডার বিবরণ
  order_type order_type NOT NULL,
  side order_side NOT NULL,
  
  -- পরিমাণ এবং প্রাইস
  shares NUMERIC(20, 8) NOT NULL CHECK (shares > 0),
  price NUMERIC(5, 4) NOT NULL CHECK (price BETWEEN 0.0001 AND 0.9999),
  total_cost NUMERIC(20, 2) NOT NULL CHECK (total_cost >= 0),
  fee NUMERIC(20, 2) DEFAULT 0 CHECK (fee >= 0),
  
  -- লিমিট অর্ডার
  limit_price NUMERIC(5, 4) CHECK (limit_price IS NULL OR (limit_price BETWEEN 0.0001 AND 0.9999)),
  stop_price NUMERIC(5, 4) CHECK (stop_price IS NULL OR (stop_price BETWEEN 0.0001 AND 0.9999)),
  
  -- এক্সিকিউশন
  status order_status DEFAULT 'pending',
  filled_shares NUMERIC(20, 8) DEFAULT 0 CHECK (filled_shares >= 0 AND filled_shares <= shares),
  average_price NUMERIC(5, 4),
  
  -- টাইমিং
  created_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- অ্যাডভান্সড
  slippage_tolerance NUMERIC(5, 4) DEFAULT 0.01 CHECK (slippage_tolerance BETWEEN 0 AND 0.1),
  price_impact NUMERIC(5, 4),
  
  -- মেটাডাটা
  tx_hash VARCHAR(255),
  error_message TEXT
);

-- ৩.৪ Positions টেবিল
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- পজিশন তথ্য
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  side order_side NOT NULL,
  
  -- শেয়ার এবং প্রাইসিং
  total_shares NUMERIC(20, 8) NOT NULL CHECK (total_shares >= 0),
  average_entry_price NUMERIC(5, 4) NOT NULL CHECK (average_entry_price BETWEEN 0.0001 AND 0.9999),
  total_invested NUMERIC(20, 2) NOT NULL CHECK (total_invested >= 0),
  
  -- বর্তমান মূল্যায়ন
  current_value NUMERIC(20, 2),
  unrealized_pnl NUMERIC(20, 2),
  realized_pnl NUMERIC(20, 2) DEFAULT 0,
  
  -- পারফরম্যান্স
  roi NUMERIC(8, 4),
  
  -- টাইমস্ট্যাম্প
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  -- স্ট্যাটাস
  is_active BOOLEAN DEFAULT TRUE,
  
  CONSTRAINT unique_user_event_side UNIQUE (user_id, event_id, side)
);

-- ৩.৫ Comments টেবিল
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- কমেন্ট তথ্য
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- কন্টেন্ট
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  
  -- রিঅ্যাকশন
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  dislikes_count INTEGER DEFAULT 0 CHECK (dislikes_count >= 0),
  replies_count INTEGER DEFAULT 0 CHECK (replies_count >= 0),
  
  -- স্ট্যাটাস
  is_deleted BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- মডারেশন
  is_reported BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0 CHECK (report_count >= 0),
  
  -- টাইমস্ট্যাম্প
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_reply CHECK (id != parent_id)
);

-- ৩.৬ Notifications টেবিল
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- রিসিপিয়েন্ট
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- টাইপ
  type notification_type NOT NULL,
  
  -- কন্টেন্ট
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- রেফারেন্স
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- স্ট্যাটাস
  is_read BOOLEAN DEFAULT FALSE,
  is_seen BOOLEAN DEFAULT FALSE,
  
  -- টাইমস্ট্যাম্প
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ৩.৭ Watchlist টেবিল
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- অ্যালার্ট সেটিংস
  price_alert_enabled BOOLEAN DEFAULT FALSE,
  target_yes_price NUMERIC(5, 4) CHECK (target_yes_price IS NULL OR (target_yes_price BETWEEN 0.0001 AND 0.9999)),
  target_no_price NUMERIC(5, 4) CHECK (target_no_price IS NULL OR (target_no_price BETWEEN 0.0001 AND 0.9999)),
  
  -- নোটস
  personal_notes TEXT,
  
  -- টাইমস্ট্যাম্প
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
);

-- ৩.৮ Followers টেবিল
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- ৩.৯ Comment Reactions টেবিল
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_comment_reaction UNIQUE (comment_id, user_id)
);

-- ===============================================
-- ৪. Indexes তৈরি করুন
-- ===============================================

-- Events ইনডেক্স
CREATE INDEX idx_events_category_ends ON events(category, ends_at DESC) WHERE trading_status = 'active';
CREATE INDEX idx_events_volume_desc ON events(volume DESC) WHERE trading_status = 'active';
CREATE INDEX idx_events_trending ON events(is_trending, created_at DESC) WHERE is_trending = TRUE;
CREATE INDEX idx_events_featured ON events(is_featured, starts_at DESC) WHERE is_featured = TRUE;
CREATE INDEX idx_events_search ON events USING GIN(search_vector);
CREATE INDEX idx_events_ending_soon ON events(ends_at ASC) WHERE trading_status = 'active' AND ends_at > NOW();
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(trading_status, created_at DESC);

-- Trades ইনডেক্স
CREATE INDEX idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX idx_trades_event_created ON trades(event_id, created_at DESC);
CREATE INDEX idx_trades_status ON trades(status, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_trades_user_event ON trades(user_id, event_id, created_at DESC);

-- Positions ইনডেক্স
CREATE INDEX idx_positions_user_active ON positions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_positions_event ON positions(event_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_positions_user_event ON positions(user_id, event_id);

-- Comments ইনডেক্স
CREATE INDEX idx_comments_event_created ON comments(event_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_user ON comments(user_id, created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_parent ON comments(parent_id, created_at DESC) WHERE parent_id IS NOT NULL AND is_deleted = FALSE;

-- Notifications ইনডেক্স
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- User Profiles ইনডেক্স
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_reputation ON user_profiles(reputation_score DESC);

-- Watchlist ইনডেক্স
CREATE INDEX idx_watchlist_user ON watchlist(user_id, created_at DESC);
CREATE INDEX idx_watchlist_event ON watchlist(event_id);

-- Followers ইনডেক্স
CREATE INDEX idx_followers_follower ON followers(follower_id, created_at DESC);
CREATE INDEX idx_followers_following ON followers(following_id, created_at DESC);

-- ===============================================
-- ৫. Functions এবং Triggers
-- ===============================================

-- ৫.১ updated_at অটোমেটিক আপডেট
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers প্রয়োগ
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ৫.২ পজিশন আপডেট (ট্রেডের পরে)
CREATE OR REPLACE FUNCTION update_position_after_trade()
RETURNS TRIGGER AS $$
DECLARE
  v_position_id UUID;
  v_existing_shares NUMERIC;
  v_existing_invested NUMERIC;
  v_new_avg_price NUMERIC;
BEGIN
  -- শুধু filled ট্রেডের জন্য
  IF NEW.status != 'filled' THEN
    RETURN NEW;
  END IF;
  
  -- বিদ্যমান পজিশন খুঁজুন
  SELECT id, total_shares, total_invested 
  INTO v_position_id, v_existing_shares, v_existing_invested
  FROM positions
  WHERE user_id = NEW.user_id 
    AND event_id = NEW.event_id 
    AND side = NEW.side 
    AND is_active = TRUE;
  
  IF v_position_id IS NULL THEN
    -- নতুন পজিশন তৈরি
    INSERT INTO positions (
      user_id, event_id, side, total_shares, 
      average_entry_price, total_invested
    )
    VALUES (
      NEW.user_id, NEW.event_id, NEW.side, NEW.filled_shares, 
      NEW.average_price, NEW.total_cost
    );
  ELSE
    -- বিদ্যমান পজিশন আপডেট
    v_new_avg_price := (v_existing_invested + NEW.total_cost) / 
                       (v_existing_shares + NEW.filled_shares);
    
    UPDATE positions
    SET 
      total_shares = v_existing_shares + NEW.filled_shares,
      average_entry_price = v_new_avg_price,
      total_invested = v_existing_invested + NEW.total_cost,
      updated_at = NOW()
    WHERE id = v_position_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_position_on_trade
AFTER INSERT OR UPDATE ON trades
FOR EACH ROW EXECUTE FUNCTION update_position_after_trade();

-- ৫.৩ ইভেন্ট ভলিউম এবং ট্রেড কাউন্ট আপডেট
CREATE OR REPLACE FUNCTION update_event_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'filled' THEN
    UPDATE events
    SET 
      volume = volume + NEW.total_cost,
      total_trades = total_trades + 1,
      updated_at = NOW()
    WHERE id = NEW.event_id;
    
    -- unique_traders আপডেট
    UPDATE events e
    SET unique_traders = (
      SELECT COUNT(DISTINCT user_id)
      FROM trades
      WHERE event_id = e.id AND status = 'filled'
    )
    WHERE e.id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_stats_on_trade
AFTER INSERT OR UPDATE ON trades
FOR EACH ROW EXECUTE FUNCTION update_event_stats();

-- ৫.৪ ইউজার স্ট্যাটিসটিক্স আপডেট
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'filled' THEN
    UPDATE user_profiles
    SET 
      total_trades = total_trades + 1,
      total_volume = total_volume + NEW.total_cost,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_stats_on_trade
AFTER INSERT OR UPDATE ON trades
FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- ৫.৫ কমেন্ট রিঅ্যাকশন কাউন্ট আপডেট
CREATE OR REPLACE FUNCTION update_comment_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments
    SET 
      likes_count = CASE WHEN NEW.reaction_type = 'like' THEN likes_count + 1 ELSE likes_count END,
      dislikes_count = CASE WHEN NEW.reaction_type = 'dislike' THEN dislikes_count + 1 ELSE dislikes_count END
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments
    SET 
      likes_count = CASE WHEN OLD.reaction_type = 'like' THEN likes_count - 1 ELSE likes_count END,
      dislikes_count = CASE WHEN OLD.reaction_type = 'dislike' THEN dislikes_count - 1 ELSE dislikes_count END
    WHERE id = OLD.comment_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_reactions
AFTER INSERT OR DELETE ON comment_reactions
FOR EACH ROW EXECUTE FUNCTION update_comment_reaction_counts();

-- ৫.৬ ফলোয়ার কাউন্ট আপডেট
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- ফলোয়ার কাউন্ট বাড়ান
    UPDATE user_profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE user_profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- ফলোয়ার কাউন্ট কমান
    UPDATE user_profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    UPDATE user_profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_followers
AFTER INSERT OR DELETE ON followers
FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- ===============================================
-- ৬. Row Level Security (RLS) Policies
-- ===============================================

-- RLS সক্রিয় করুন
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Events পলিসি
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

CREATE POLICY "Only admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_pro = TRUE
    )
  );

-- User Profiles পলিসি
CREATE POLICY "Public profiles are viewable"
  ON user_profiles FOR SELECT
  TO authenticated, anon
  USING (
    profile_visibility = 'public' OR
    id = auth.uid() OR
    (profile_visibility = 'followers' AND 
     EXISTS (SELECT 1 FROM followers WHERE follower_id = auth.uid() AND following_id = id))
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Trades পলিসি
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pending trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Positions পলিসি
CREATE POLICY "Users can view own positions"
  ON positions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Comments পলিসি
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated, anon
  USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications পলিসি
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Watchlist পলিসি
CREATE POLICY "Users can manage own watchlist"
  ON watchlist FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Followers পলিসি
CREATE POLICY "Users can view followers"
  ON followers FOR SELECT
  TO authenticated
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can follow others"
  ON followers FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

-- Comment Reactions পলিসি
CREATE POLICY "Anyone can view reactions"
  ON comment_reactions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can manage own reactions"
  ON comment_reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===============================================
-- ৭. Realtime Configuration
-- ===============================================

-- Realtime সক্রিয় করুন
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ===============================================
-- ৮. Sample Data (ঐচ্ছিক - টেস্টিংয়ের জন্য)
-- ===============================================

-- নমুনা ইভেন্ট
INSERT INTO events (
  slug, name, question, category, 
  starts_at, ends_at, 
  initial_liquidity, current_liquidity,
  is_verified, is_featured
) VALUES
(
  'btc-100k-2026',
  'Bitcoin $100K',
  'Will Bitcoin reach $100,000 by end of 2026?',
  'Crypto',
  NOW(),
  NOW() + INTERVAL '365 days',
  10000,
  10000,
  TRUE,
  TRUE
),
(
  'world-cup-2026-winner',
  'World Cup 2026 Winner',
  'Will Brazil win the 2026 FIFA World Cup?',
  'Sports',
  NOW(),
  NOW() + INTERVAL '180 days',
  5000,
  5000,
  TRUE,
  FALSE
);

-- ===============================================
-- সম্পন্ন!
-- ===============================================

-- এই স্ক্রিপ্ট চালানোর পর:
-- 1. Supabase Dashboard এ Authentication সেটআপ করুন
-- 2. Storage Buckets তৈরি করুন (avatars, event-images)
-- 3. Edge Functions ডিপ্লয় করুন (যদি প্রয়োজন হয়)
-- 4. n8n Workflows কনফিগার করুন
