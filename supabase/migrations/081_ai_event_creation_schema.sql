-- ===============================================
-- Event Creation Backend Schema
-- ===============================================

-- Ensure is_pro column exists in user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'is_pro'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_pro BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- AI Daily Topics টেবিল (User Requested Spec)
CREATE TABLE IF NOT EXISTS public.ai_daily_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_title VARCHAR(255) NOT NULL,
  suggested_question TEXT NOT NULL,
  suggested_description TEXT,
  suggested_category VARCHAR(50) NOT NULL,
  suggested_subcategory VARCHAR(100),
  suggested_tags TEXT[],
  trending_score NUMERIC(5, 2) CHECK (trending_score BETWEEN 0 AND 100),
  source_urls TEXT[],
  confidence_score NUMERIC(5, 2) CHECK (confidence_score BETWEEN 0 AND 100),
  ai_reasoning TEXT,
  suggested_start_date TIMESTAMPTZ,
  suggested_end_date TIMESTAMPTZ,
  suggested_resolution_delay INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'converted', 'expired')
  ),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_event_id UUID REFERENCES public.markets(id), -- existing markets table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);


-- Resolution Systems টেবিল
CREATE TABLE IF NOT EXISTS resolution_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  primary_method VARCHAR(50) NOT NULL,
  fallback_methods VARCHAR(50)[],
  ai_oracle_config JSONB DEFAULT '{}'::jsonb,
  assigned_experts UUID[],
  expert_votes JSONB DEFAULT '[]'::jsonb,
  expert_consensus_threshold NUMERIC(3, 2) DEFAULT 0.75,
  dispute_count INTEGER DEFAULT 0,
  disputes JSONB DEFAULT '[]'::jsonb,
  dispute_bond_amount NUMERIC(10, 2) DEFAULT 100.00,
  external_oracle_type VARCHAR(50),
  external_api_endpoint TEXT,
  external_api_key_encrypted TEXT,
  external_last_check TIMESTAMPTZ,
  resolution_status VARCHAR(20) DEFAULT 'pending',
  proposed_outcome INTEGER,
  confidence_level NUMERIC(5, 2),
  evidence JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT unique_event_resolution UNIQUE (event_id)
);

-- Expert Panel টেবিল
CREATE TABLE IF NOT EXISTS expert_panel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  expert_name VARCHAR(100) NOT NULL,
  credentials TEXT,
  specializations VARCHAR(50)[] NOT NULL,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  total_votes INTEGER DEFAULT 0,
  correct_votes INTEGER DEFAULT 0,
  incorrect_votes INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_votes > 0 THEN (correct_votes::NUMERIC / total_votes * 100) ELSE 0 END
  ) STORED,
  expert_rating NUMERIC(3, 2) DEFAULT 0.00,
  reputation_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  availability_status VARCHAR(20) DEFAULT 'available',
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_vote_at TIMESTAMPTZ,
  CONSTRAINT unique_expert_user UNIQUE (user_id)
);

-- News Sources টেবিল
CREATE TABLE IF NOT EXISTS news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(100) NOT NULL,
  source_url TEXT NOT NULL,
  source_type VARCHAR(50),
  country_code CHAR(2) DEFAULT 'BD',
  language_code CHAR(2) DEFAULT 'bn',
  is_verified BOOLEAN DEFAULT FALSE,
  trust_score INTEGER DEFAULT 50,
  bias_rating VARCHAR(20),
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  requires_authentication BOOLEAN DEFAULT FALSE,
  rate_limit_per_hour INTEGER DEFAULT 100,
  rss_feed_url TEXT,
  categories_covered VARCHAR(50)[],
  total_articles_fetched INTEGER DEFAULT 0,
  successful_fetches INTEGER DEFAULT 0,
  failed_fetches INTEGER DEFAULT 0,
  last_fetch_at TIMESTAMPTZ,
  last_fetch_status VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  is_whitelisted BOOLEAN DEFAULT FALSE,
  scraping_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_source_url UNIQUE (source_url)
);

-- Dispute Records টেবিল
CREATE TABLE IF NOT EXISTS dispute_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resolution_system_id UUID REFERENCES resolution_systems(id),
  disputed_by UUID NOT NULL REFERENCES auth.users(id),
  dispute_type VARCHAR(50),
  dispute_reason TEXT NOT NULL,
  evidence_urls TEXT[],
  evidence_files TEXT[],
  bond_amount NUMERIC(10, 2) NOT NULL,
  bond_locked_at TIMESTAMPTZ DEFAULT NOW(),
  bond_status VARCHAR(20) DEFAULT 'locked',
  assigned_judge UUID REFERENCES auth.users(id),
  judge_notes TEXT,
  ruling VARCHAR(50),
  ruling_reason TEXT,
  ruling_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  community_votes_yes INTEGER DEFAULT 0,
  community_votes_no INTEGER DEFAULT 0,
  voting_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Admin Activity Logs টেবিল
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ইনডেক্স তৈরি করুন
-- Renamed indexes to avoid conflicts with existing objects
CREATE INDEX IF NOT EXISTS idx_ai_daily_topics_status ON ai_daily_topics(status);
CREATE INDEX IF NOT EXISTS idx_ai_daily_topics_trending ON ai_daily_topics(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_resolution_systems_event ON resolution_systems(event_id);
CREATE INDEX IF NOT EXISTS idx_expert_panel_specializations ON expert_panel USING gin(specializations);
CREATE INDEX IF NOT EXISTS idx_dispute_records_event ON dispute_records(event_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin ON admin_activity_logs(admin_id);

-- RLS Policies
ALTER TABLE ai_daily_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_panel ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- AI Topics - শুধু অ্যাডমিন দেখতে পারবে
CREATE POLICY "Only admins can view AI topics"
  ON ai_daily_topics FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_pro = TRUE)
  );

CREATE POLICY "Only admins can manage AI topics"
  ON ai_daily_topics FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_pro = TRUE)
  );

-- Resolution Systems - সবাই দেখতে পারবে, শুধু অ্যাডমিন পরিবর্তন করতে পারবে
CREATE POLICY "Everyone can view resolution systems"
  ON resolution_systems FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only admins can modify resolution systems"
  ON resolution_systems FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_pro = TRUE)
  );

-- Dispute Records - ইউজার নিজের বিরোধ দেখতে পারবে
CREATE POLICY "Users can view own disputes"
  ON dispute_records FOR SELECT
  TO authenticated
  USING (disputed_by = auth.uid() OR 
         EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_pro = TRUE));

CREATE POLICY "Users can create disputes"
  ON dispute_records FOR INSERT
  TO authenticated
  WITH CHECK (disputed_by = auth.uid());

-- Admin Activity Logs - শুধু অ্যাডমিন দেখতে পারবে
CREATE POLICY "Only admins can view activity logs"
  ON admin_activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_pro = TRUE)
  );
