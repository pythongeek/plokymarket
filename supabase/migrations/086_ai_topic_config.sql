-- ===============================================
-- AI Topic Configuration Migration
-- Admin-configurable sources, prompts, and categories
-- ===============================================

-- AI Topic Configuration Table
CREATE TABLE IF NOT EXISTS public.ai_topic_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Context/Region settings
  context_type VARCHAR(50) NOT NULL DEFAULT 'bangladesh' 
    CHECK (context_type IN ('bangladesh', 'international', 'sports', 'custom')),
  
  -- News Sources (RSS feeds, APIs)
  news_sources JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"name": "Prothom Alo", "url": "https://prothomalo.com/feed", "type": "rss"}]
  
  -- Search Keywords for context
  search_keywords TEXT[],
  
  -- Custom Prompt Template
  prompt_template TEXT NOT NULL DEFAULT 'You are a professional prediction market analyst for {context}.

Task: Create {count} binary outcome prediction market questions (Yes/No) based on current trending topics.

Requirements:
1. Questions must be verifiable after the suggested end date
2. Focus on: {focus_areas}
3. Categories to include: {categories}
4. Use these sources for context: {sources}

Validation Rules:
- Must have clear Yes/No outcome
- Must be verifiable by a specific date
- Should be relevant to {context}
- Avoid subjective/opinion-based questions

Return JSON format:
[
  {
    "title": "Will [event] happen by [date]?",
    "category": "Sports|Politics|Crypto|Tech|Entertainment",
    "description": "Detailed context...",
    "suggested_end_date": "YYYY-MM-DD",
    "source_keywords": ["keyword1", "keyword2"],
    "confidence_reasoning": "Why this is a good prediction market"
  }
]',

  -- AI Model settings
  ai_model VARCHAR(50) DEFAULT 'gemini-1.5-flash',
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  
  -- Generation settings
  topics_per_generation INTEGER DEFAULT 5,
  focus_areas TEXT[], -- ['cricket', 'politics', 'economy']
  
  -- Scheduling
  is_active BOOLEAN DEFAULT true,
  generation_schedule VARCHAR(20) DEFAULT '0 6 * * *', -- Cron expression
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_generated_at TIMESTAMPTZ,
  generation_count INTEGER DEFAULT 0
);

-- AI Topic Generation Jobs (for tracking)
CREATE TABLE IF NOT EXISTS public.ai_topic_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.ai_topic_configs(id),
  
  -- Job status
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  
  -- Input data
  sources_used JSONB,
  keywords_used TEXT[],
  prompt_sent TEXT,
  
  -- Results
  raw_response TEXT,
  topics_generated JSONB,
  topics_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Performance
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add reference to config in daily topics
ALTER TABLE public.ai_daily_topics 
ADD COLUMN IF NOT EXISTS config_id UUID REFERENCES public.ai_topic_configs(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_topic_configs_active ON public.ai_topic_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_topic_configs_context ON public.ai_topic_configs(context_type);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_config ON public.ai_topic_generation_jobs(config_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.ai_topic_generation_jobs(status);

-- Enable RLS
ALTER TABLE public.ai_topic_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_topic_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "topic_configs_admin_all" ON public.ai_topic_configs;
DROP POLICY IF EXISTS "topic_jobs_admin_all" ON public.ai_topic_generation_jobs;

CREATE POLICY "topic_configs_admin_all"
  ON public.ai_topic_configs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "topic_jobs_admin_all"
  ON public.ai_topic_generation_jobs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE));

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION public.sync_topic_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_topic_config_updated_at ON public.ai_topic_configs;

CREATE TRIGGER tr_topic_config_updated_at
  BEFORE UPDATE ON public.ai_topic_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_topic_config_updated_at();

-- Insert default configurations
INSERT INTO public.ai_topic_configs (name, description, context_type, news_sources, search_keywords, focus_areas, created_by)
VALUES 
  (
    'Bangladesh News',
    'Trending topics from Bangladesh news sources',
    'bangladesh',
    '[
      {"name": "Prothom Alo", "url": "https://www.prothomalo.com/feed", "type": "rss"},
      {"name": "Daily Star", "url": "https://www.thedailystar.net/rss.xml", "type": "rss"},
      {"name": "BDNews24", "url": "https://bdnews24.com/rss.xml", "type": "rss"}
    ]'::jsonb,
    ARRAY['bangladesh', 'dhaka', 'bengali', 'sheikh hasina', 'bnp', 'awami league'],
    ARRAY['politics', 'cricket', 'economy', 'floods', 'elections'],
    NULL
  ),
  (
    'International Sports',
    'Global sports events and tournaments',
    'sports',
    '[
      {"name": "ESPN", "url": "https://www.espn.com/espn/rss/news", "type": "rss"},
      {"name": "BBC Sport", "url": "https://feeds.bbci.co.uk/sport/rss.xml", "type": "rss"}
    ]'::jsonb,
    ARRAY['world cup', 'olympics', 'cricket', 'football', 'tennis', 'ipl', 'bpl'],
    ARRAY['cricket', 'football', 'tennis', 'olympics'],
    NULL
  ),
  (
    'International News',
    'Global news and events',
    'international',
    '[
      {"name": "BBC News", "url": "https://feeds.bbci.co.uk/news/rss.xml", "type": "rss"},
      {"name": "Reuters", "url": "https://www.reutersagency.com/feed/?best-topics=politicalgeneral", "type": "rss"}
    ]'::jsonb,
    ARRAY['usa', 'trump', 'biden', 'ukraine', 'russia', 'china', 'india', 'election'],
    ARRAY['politics', 'economy', 'technology', 'climate'],
    NULL
  )
ON CONFLICT DO NOTHING;

-- ===============================================
-- END OF AI TOPIC CONFIG MIGRATION
-- ===============================================
