-- ===============================================
-- AI Daily Topics System Migration
-- Complete implementation with admin settings
-- ===============================================

-- 1. Drop existing if any (clean slate)
DROP TABLE IF EXISTS public.ai_daily_topics CASCADE;
DROP TABLE IF EXISTS public.admin_ai_settings CASCADE;

-- 2. AI Daily Topics Table
CREATE TABLE public.ai_daily_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_title TEXT NOT NULL,
  suggested_question TEXT NOT NULL,
  suggested_description TEXT,
  suggested_category VARCHAR(50),
  ai_reasoning TEXT,
  ai_confidence NUMERIC(5,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  market_id UUID REFERENCES public.markets(id),
  rejected_reason TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Admin AI Settings Table
CREATE TABLE public.admin_ai_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  custom_instruction TEXT DEFAULT 'Generate engaging prediction market topics relevant to Bangladesh users',
  target_region VARCHAR(50) DEFAULT 'Bangladesh',
  default_categories VARCHAR(50)[] DEFAULT ARRAY['Sports', 'Politics', 'Economy', 'Entertainment'],
  auto_generate_enabled BOOLEAN DEFAULT FALSE,
  auto_generate_time TIME DEFAULT '08:00:00',
  max_daily_topics INTEGER DEFAULT 5,
  gemini_model VARCHAR(50) DEFAULT 'gemini-1.5-flash',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO public.admin_ai_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 4. Indexes
CREATE INDEX idx_ai_topics_status ON public.ai_daily_topics(status);
CREATE INDEX idx_ai_topics_category ON public.ai_daily_topics(suggested_category);
CREATE INDEX idx_ai_topics_generated ON public.ai_daily_topics(generated_at DESC);

-- 5. Enable RLS
ALTER TABLE public.ai_daily_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_ai_settings ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- AI Topics Policies
CREATE POLICY "ai_topics_admin_select"
  ON public.ai_daily_topics FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "ai_topics_admin_all"
  ON public.ai_daily_topics FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Admin Settings Policies
CREATE POLICY "ai_settings_admin_select"
  ON public.admin_ai_settings FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "ai_settings_admin_update"
  ON public.admin_ai_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- 7. Functions

-- Update settings timestamp
CREATE OR REPLACE FUNCTION update_ai_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_settings_updated
  BEFORE UPDATE ON public.admin_ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_ai_settings_timestamp();

-- Approve topic and create market
CREATE OR REPLACE FUNCTION approve_ai_topic(
  p_topic_id UUID,
  p_admin_id UUID,
  p_trading_closes_at TIMESTAMPTZ,
  p_initial_liquidity NUMERIC DEFAULT 1000
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_topic RECORD;
  v_market_id UUID;
BEGIN
  -- Get topic
  SELECT * INTO v_topic FROM public.ai_daily_topics WHERE id = p_topic_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Topic not found';
  END IF;
  
  IF v_topic.status != 'pending' THEN
    RAISE EXCEPTION 'Topic already processed';
  END IF;
  
  -- Create market
  INSERT INTO public.markets (
    question,
    description,
    category,
    trading_volume,
    liquidity,
    trading_closes_at,
    status,
    created_by
  ) VALUES (
    v_topic.suggested_question,
    v_topic.suggested_description,
    v_topic.suggested_category,
    0,
    p_initial_liquidity,
    p_trading_closes_at,
    'active',
    p_admin_id
  )
  RETURNING id INTO v_market_id;
  
  -- Update topic
  UPDATE public.ai_daily_topics
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = p_admin_id,
    market_id = v_market_id
  WHERE id = p_topic_id;
  
  RETURN v_market_id;
END;
$$;

-- Reject topic
CREATE OR REPLACE FUNCTION reject_ai_topic(
  p_topic_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ai_daily_topics
  SET 
    status = 'rejected',
    rejected_reason = COALESCE(p_reason, 'Rejected by admin'),
    approved_by = p_admin_id,
    approved_at = NOW()
  WHERE id = p_topic_id AND status = 'pending';
END;
$$;

-- Get topics summary
CREATE OR REPLACE FUNCTION get_ai_topics_summary()
RETURNS TABLE (
  total_pending BIGINT,
  total_approved BIGINT,
  total_rejected BIGINT,
  today_generated BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'pending')::BIGINT as total_pending,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'approved')::BIGINT as total_approved,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE status = 'rejected')::BIGINT as total_rejected,
    (SELECT COUNT(*) FROM public.ai_daily_topics WHERE generated_at >= CURRENT_DATE)::BIGINT as today_generated;
END;
$$;

-- 8. Comments
COMMENT ON TABLE public.ai_daily_topics IS 'AI-generated daily prediction market topics';
COMMENT ON TABLE public.admin_ai_settings IS 'Admin configuration for AI topic generation';
COMMENT ON FUNCTION approve_ai_topic IS 'Approves an AI topic and creates a market';
COMMENT ON FUNCTION reject_ai_topic IS 'Rejects an AI topic with optional reason';
