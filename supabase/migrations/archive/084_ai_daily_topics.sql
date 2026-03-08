-- ===============================================
-- AI Daily Topics Migration
-- Table for AI-generated daily prediction market topics
-- ===============================================

-- Create AI Daily Topics table
CREATE TABLE IF NOT EXISTS public.ai_daily_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  trading_end_date DATE,
  source_keywords TEXT[],
  
  -- AI metadata
  ai_confidence NUMERIC(3, 2) DEFAULT 0.5,
  ai_model_version VARCHAR(50),
  generated_prompt TEXT,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Approval tracking
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Market reference
  market_id UUID REFERENCES public.markets(id),
  
  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_topics_status ON public.ai_daily_topics(status);
CREATE INDEX IF NOT EXISTS idx_daily_topics_category ON public.ai_daily_topics(category);
CREATE INDEX IF NOT EXISTS idx_daily_topics_created ON public.ai_daily_topics(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_topics_generated ON public.ai_daily_topics(generated_at);

-- Enable RLS
ALTER TABLE public.ai_daily_topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "daily_topics_public_select" ON public.ai_daily_topics;
DROP POLICY IF EXISTS "daily_topics_admin_all" ON public.ai_daily_topics;

-- RLS Policies
-- Public can view approved topics
CREATE POLICY "daily_topics_public_select"
  ON public.ai_daily_topics FOR SELECT
  TO public
  USING (status = 'approved');

-- Admins can do everything
CREATE POLICY "daily_topics_admin_all"
  ON public.ai_daily_topics FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.sync_daily_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_daily_topics_updated_at ON public.ai_daily_topics;

CREATE TRIGGER tr_daily_topics_updated_at
  BEFORE UPDATE ON public.ai_daily_topics
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_daily_topics_updated_at();

-- Grant permissions
GRANT SELECT ON public.ai_daily_topics TO authenticated;
GRANT ALL ON public.ai_daily_topics TO authenticated;

-- ===============================================
-- END OF AI DAILY TOPICS MIGRATION
-- ===============================================
