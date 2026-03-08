-- Bangladesh-specific AI Oracle Schema Extensions
-- Adds Bangladesh context tracking and local source categorization

-- Add Bangladesh context columns to pipelines table
ALTER TABLE public.ai_resolution_pipelines 
ADD COLUMN IF NOT EXISTS bangladesh_context JSONB,
ADD COLUMN IF NOT EXISTS bangladesh_division VARCHAR(50),
ADD COLUMN IF NOT EXISTS detected_language VARCHAR(10),
ADD COLUMN IF NOT EXISTS is_bangladesh_context BOOLEAN DEFAULT false;

-- Create indexes for Bangladesh queries
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_bangladesh ON public.ai_resolution_pipelines(is_bangladesh_context);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_division ON public.ai_resolution_pipelines(bangladesh_division);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_language ON public.ai_resolution_pipelines(detected_language);

-- Bangladesh News Source Registry
CREATE TABLE IF NOT EXISTS public.bd_news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    domain VARCHAR(200) NOT NULL UNIQUE,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('english', 'bengali', 'online_portal')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('general', 'business', 'sports', 'politics')),
    authority_score DECIMAL(3,2) NOT NULL CHECK (authority_score BETWEEN 0 AND 1),
    is_government BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    contact_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert major Bangladesh news sources
INSERT INTO public.bd_news_sources (name, domain, source_type, category, authority_score, is_government) VALUES
-- Government
('Bangladesh Election Commission', 'eci.gov.bd', 'english', 'politics', 0.98, true),
('Bangladesh Bank', 'bb.org.bd', 'english', 'business', 0.98, true),
('Dhaka Stock Exchange', 'dse.com.bd', 'english', 'business', 0.96, true),
('Chittagong Stock Exchange', 'cse.com.bd', 'english', 'business', 0.95, true),
('Bangladesh Cricket Board', 'tigercricket.com.bd', 'english', 'sports', 0.96, true),
('Bangladesh Football Federation', 'bff.com.bd', 'english', 'sports', 0.92, true),
('Bangladesh Meteorological Department', 'bmd.gov.bd', 'english', 'general', 0.97, true),

-- English News
('The Daily Star', 'thedailystar.net', 'english', 'general', 0.92, false),
('BDNews24', 'bdnews24.com', 'english', 'general', 0.91, false),
('Dhaka Tribune', 'dhakatribune.com', 'english', 'general', 0.90, false),
('New Age', 'newagebd.net', 'english', 'general', 0.88, false),
('The Financial Express', 'thefinancialexpress.com.bd', 'english', 'business', 0.88, false),
('The Independent', 'theindependentbd.com', 'english', 'general', 0.87, false),
('Daily Sun', 'daily-sun.com', 'english', 'general', 0.86, false),

-- Bengali News
('Prothom Alo', 'prothomalo.com', 'bengali', 'general', 0.93, false),
('Jugantor', 'jugantor.com', 'bengali', 'general', 0.91, false),
('Kaler Kantho', 'kalerkantho.com', 'bengali', 'general', 0.91, false),
('The Daily Ittefaq', 'ittefaq.com.bd', 'bengali', 'general', 0.90, false),
('Amader Shomoy', 'dainikamadershomoy.com', 'bengali', 'general', 0.88, false),
('Samakal', 'samakal.com', 'bengali', 'general', 0.88, false),
('Naya Diganta', 'nayadiganta.com', 'bengali', 'general', 0.87, false),
('Manab Zamin', 'mzamin.com', 'bengali', 'general', 0.86, false),

-- Online Portals
('Bangla News 24', 'banglanews24.com', 'bengali', 'general', 0.86, false),
('Bangla Tribune', 'banglatribune.com', 'bengali', 'general', 0.85, false),
('Jago News 24', 'jagonews24.com', 'bengali', 'general', 0.85, false),
('Rising BD', 'risingbd.com', 'bengali', 'general', 0.84, false),
('Somoy News', 'somoynews.tv', 'bengali', 'general', 0.86, false),
('Channel i', 'channelionline.com', 'bengali', 'general', 0.85, false),
('Ekattor TV', 'ekattor.tv', 'bengali', 'general', 0.85, false),
('RTV Online', 'rtvonline.com', 'bengali', 'general', 0.83, false)

ON CONFLICT (domain) DO UPDATE SET
    authority_score = EXCLUDED.authority_score,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Bangladesh Division Reference
CREATE TABLE IF NOT EXISTS public.bd_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    name_bn VARCHAR(100),
    headquarters VARCHAR(100),
    population_2021 BIGINT,
    area_sq_km DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true
);

INSERT INTO public.bd_divisions (name, name_bn, headquarters) VALUES
('dhaka', 'ঢাকা', 'Dhaka'),
('chittagong', 'চট্টগ্রাম', 'Chittagong'),
('sylhet', 'সিলেট', 'Sylhet'),
('rajshahi', 'রাজশাহী', 'Rajshahi'),
('khulna', 'খুলনা', 'Khulna'),
('barisal', 'বরিশাল', 'Barisal'),
('rangpur', 'রংপুর', 'Rangpur'),
('mymensingh', 'ময়মনসিংহ', 'Mymensingh')
ON CONFLICT (name) DO NOTHING;

-- Bangladesh Political Events Tracking
CREATE TABLE IF NOT EXISTS public.bd_political_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('election', 'protest', 'policy_change', 'cabinet_reshuffle', 'international_visit')),
    event_date DATE NOT NULL,
    description TEXT NOT NULL,
    parties_involved TEXT[],
    locations TEXT[],
    outcome_summary TEXT,
    market_impact_score INTEGER CHECK (market_impact_score BETWEEN 1 AND 10),
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bangladesh Cricket Events
CREATE TABLE IF NOT EXISTS public.bd_cricket_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_type VARCHAR(50) NOT NULL CHECK (match_type IN ('test', 'odi', 't20', 't20i')),
    opponent VARCHAR(100) NOT NULL,
    match_date DATE NOT NULL,
    venue VARCHAR(200),
    is_home BOOLEAN DEFAULT true,
    bangladesh_result VARCHAR(20) CHECK (bangladesh_result IN ('win', 'loss', 'draw', 'tie', 'upcoming')),
    player_of_match VARCHAR(100),
    key_players TEXT[],
    market_relevance BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bangladesh Economic Indicators
CREATE TABLE IF NOT EXISTS public.bd_economic_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_name VARCHAR(100) NOT NULL,
    indicator_date DATE NOT NULL,
    value DECIMAL(18,4) NOT NULL,
    unit VARCHAR(50),
    previous_value DECIMAL(18,4),
    change_percent DECIMAL(8,4),
    source VARCHAR(200),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bd_news_sources_type ON public.bd_news_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_bd_news_sources_category ON public.bd_news_sources(category);
CREATE INDEX IF NOT EXISTS idx_bd_news_sources_active ON public.bd_news_sources(is_active);

CREATE INDEX IF NOT EXISTS idx_bd_political_events_date ON public.bd_political_events(event_date);
CREATE INDEX IF NOT EXISTS idx_bd_political_events_type ON public.bd_political_events(event_type);

CREATE INDEX IF NOT EXISTS idx_bd_cricket_events_date ON public.bd_cricket_events(match_date);
CREATE INDEX IF NOT EXISTS idx_bd_cricket_events_opponent ON public.bd_cricket_events(opponent);

CREATE INDEX IF NOT EXISTS idx_bd_economic_indicators_name ON public.bd_economic_indicators(indicator_name);
CREATE INDEX IF NOT EXISTS idx_bd_economic_indicators_date ON public.bd_economic_indicators(indicator_date);

-- Row Level Security
ALTER TABLE public.bd_news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_political_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_cricket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_economic_indicators ENABLE ROW LEVEL SECURITY;

-- Public read access for reference tables
CREATE POLICY bd_news_sources_public_read ON public.bd_news_sources FOR SELECT USING (true);
CREATE POLICY bd_divisions_public_read ON public.bd_divisions FOR SELECT USING (true);
CREATE POLICY bd_political_events_public_read ON public.bd_political_events FOR SELECT USING (true);
CREATE POLICY bd_cricket_events_public_read ON public.bd_cricket_events FOR SELECT USING (true);
CREATE POLICY bd_economic_indicators_public_read ON public.bd_economic_indicators FOR SELECT USING (true);

-- Comments
COMMENT ON TABLE public.bd_news_sources IS 'Registry of Bangladesh news sources with authority scores for AI Oracle';
COMMENT ON TABLE public.bd_divisions IS 'Bangladesh administrative divisions for geographic context';
COMMENT ON TABLE public.bd_political_events IS 'Historical political events in Bangladesh for pattern recognition';
COMMENT ON TABLE public.bd_cricket_events IS 'Bangladesh cricket match history for sports markets';
COMMENT ON TABLE public.bd_economic_indicators IS 'Bangladesh economic data for financial markets';
