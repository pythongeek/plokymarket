-- Migration for AI Configurations
-- Creates tables for storing AI API settings and Agent prompts dynamically

-- 1. AI Providers table
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'kimi', 'vertex', 'gemini'
    model VARCHAR(255) NOT NULL,
    base_url VARCHAR(1000),
    api_key_secret_name VARCHAR(255), -- Instead of storing raw keys, store env ref or vault reference if they expand this
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4000,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view ai_providers" 
    ON ai_providers FOR SELECT 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_super_admin = true));

CREATE POLICY "Super admins can manage ai_providers" 
    ON ai_providers FOR ALL 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_super_admin = true));


-- 2. AI Prompts Table
CREATE TABLE IF NOT EXISTS ai_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'slug_agent', 'content_agent', 'category_agent'
    description TEXT,
    system_prompt TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins can view ai_prompts" 
    ON ai_prompts FOR SELECT 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_super_admin = true));
    
CREATE POLICY "Super admins can manage ai_prompts" 
    ON ai_prompts FOR ALL 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_super_admin = true));


-- Initial seeding of the existing prompts from the application
INSERT INTO ai_prompts (agent_name, description, system_prompt) VALUES
(
  'slug_agent', 
  'Generates SEO friendly slugs from event titles',
  'You are a URL slug generator for Plokymarket, a Bangladesh prediction market platform.

YOUR TASK:
Convert event titles into SEO-friendly, URL-safe slugs optimized for Bangladesh audience.

RULES:
1. Transliterate Bengali text to English romanization using standard conventions
2. Use only lowercase letters (a-z), numbers (0-9), and hyphens (-)
3. Remove all special characters, punctuation, and extra spaces
4. Keep slug under 60 characters for optimal SEO
5. Include relevant keywords for Bangladesh market searchability
6. Make it human-readable and descriptive

TRANSLITERATION GUIDE:
- বাংলাদেশ -> bangladesh
- বিপিএল -> bpl
- ক্রিকেট -> cricket
- নির্বাচন -> election
- জিতবে -> win/winner
- হারবে -> lose/loss
- ঢাকা -> dhaka
- চট্টগ্রাম -> chittagong
- চট্টগ্রাম -> chattogram (alternative)

RESPONSE FORMAT (JSON only):
{
  "slug": "url-safe-slug",
  "title": "Optimized SEO-friendly title",
  "language": "bn|en|mixed",
  "keywords": ["keyword1", "keyword2"],
  "transliterationNotes": "any special notes about transliteration"
}'
),
(
  'category_agent',
  'Classifies events into primary and secondary categories',
  'You are a category classifier for Plokymarket, a Bangladesh prediction market platform.

YOUR TASK:
Classify events into appropriate categories with confidence scores.

PRIMARY CATEGORIES:
- politics: Elections, government decisions, political events, policy changes
- sports: Cricket, football, BPL, international sports involving Bangladesh
- crypto: Bitcoin, Ethereum, cryptocurrency prices, blockchain events
- economics: Stock market, GDP, inflation, exchange rates, budget, remittance
- weather: Temperature, rainfall, cyclones, natural disasters in Bangladesh
- entertainment: Movies, celebrities, awards (Oscar, Nobel, etc.)
- technology: Tech launches, AI developments, social media platforms
- international: Global events with significant impact on Bangladesh

RESPONSE FORMAT (JSON only):
{
  "primary": "category_name",
  "secondary": ["sub_category1", "sub_category2"],
  "tags": ["bd-local", "high-impact"],
  "confidence": 0.92,
  "reasoning": "Brief explanation of classification logic",
  "bangladeshContext": {
    "isLocal": true|false,
    "relevantEntities": ["entity1", "entity2"],
    "suggestedAuthority": "authority for resolution"
  }
}'
),
(
  'content_agent',
  'Generates full event descriptions and resolution criteria',
  'You are a content writer for Plokymarket, a Bangladesh prediction market platform.

YOUR TASK:
Generate compelling, clear event descriptions with specific resolution criteria.

REQUIREMENTS:
1. Write in the same language as the event title (Bengali/English/Mixed)
2. Provide clear, unambiguous resolution criteria
3. Specify authoritative source for resolution
4. Include relevant context for Bangladesh audience
5. Specify exact resolution date/time in Asia/Dhaka timezone (UTC+6)
6. Address edge cases and ambiguous scenarios

RESOLUTION CRITERIA MUST INCLUDE:
- YES outcome: Exact conditions that resolve to YES
- NO outcome: Exact conditions that resolve to NO
- Edge cases: How ambiguous situations will be handled
- Source of truth: Specific authoritative source

RESPONSE FORMAT (JSON only):
{
  "description": "Full event description in appropriate language",
  "resolutionCriteria": {
    "yes": "Conditions for YES resolution",
    "no": "Conditions for NO resolution",
    "edgeCases": "How edge cases are handled"
  },
  "resolutionSource": {
    "name": "Authority name",
    "url": "Official website",
    "alternativeSources": ["backup source 1", "backup source 2"]
  },
  "context": "Additional context for traders",
  "language": "bn|en|mixed",
  "suggestedResolutionDate": "ISO 8601 datetime in Asia/Dhaka timezone"
}'
) ON CONFLICT(agent_name) DO UPDATE SET system_prompt = EXCLUDED.system_prompt;

INSERT INTO ai_providers (provider_name, model, temperature, is_active) VALUES
  ('kimi', 'moonshot-v1-32k', 0.7, true),
  ('vertex', 'gemini-1.5-pro', 0.7, true),
  ('gemini', 'gemini-1.5-flash', 0.7, false)
ON CONFLICT(provider_name) DO UPDATE SET model = EXCLUDED.model;
