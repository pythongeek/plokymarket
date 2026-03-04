-- =====================================================================
-- AI Agent Configuration & Usage Tracking
-- =====================================================================
-- Tables: ai_agent_configs, ai_usage_logs
-- RPC: increment_agent_usage
-- Pre-seeds all 10 MoAgent Garden agents
-- =====================================================================

-- 1. AI Agent Configuration Table
CREATE TABLE IF NOT EXISTS ai_agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key TEXT UNIQUE NOT NULL,
    agent_name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL DEFAULT '',
    model_name TEXT DEFAULT 'gemini-2.5-flash',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    temperature DECIMAL DEFAULT 0.2,
    daily_token_limit INTEGER DEFAULT 100000,
    total_tokens_spent BIGINT DEFAULT 0,
    pipeline TEXT, -- market_creation, oracle_resolution, security, support, growth, audit
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage agent configs" ON ai_agent_configs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 2. Daily Token Usage Logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_key TEXT REFERENCES ai_agent_configs(agent_key) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE,
    tokens_used INTEGER DEFAULT 0,
    calls_count INTEGER DEFAULT 0,
    estimated_cost DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_key, usage_date)
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view usage logs" ON ai_usage_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. Atomic Token Usage Increment RPC
CREATE OR REPLACE FUNCTION increment_agent_usage(
    p_agent_key TEXT,
    p_tokens INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Update total tokens on agent config
    UPDATE ai_agent_configs
    SET total_tokens_spent = total_tokens_spent + p_tokens,
        last_run_at = NOW(),
        updated_at = NOW()
    WHERE agent_key = p_agent_key;

    -- Upsert daily usage log
    INSERT INTO ai_usage_logs (agent_key, usage_date, tokens_used, calls_count, estimated_cost)
    VALUES (
        p_agent_key,
        CURRENT_DATE,
        p_tokens,
        1,
        (p_tokens::DECIMAL / 1000000) * 0.075  -- Gemini 2.5 Flash pricing estimate
    )
    ON CONFLICT (agent_key, usage_date) DO UPDATE
    SET tokens_used = ai_usage_logs.tokens_used + p_tokens,
        calls_count = ai_usage_logs.calls_count + 1,
        estimated_cost = ai_usage_logs.estimated_cost + ((p_tokens::DECIMAL / 1000000) * 0.075);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Pre-seed all 10 MoAgent Garden agents
INSERT INTO ai_agent_configs (agent_key, agent_name, description, model_name, temperature, pipeline, status) VALUES
('content-v2',      'Content Architect',        'SEO-optimized Bengali content generation with citations',     'gemini-2.5-flash', 0.3,  'market_creation',    'active'),
('osint',           'OSINT Architect Pro',       'Evidence verification with grounded citations',               'gemini-2.5-flash', 0.1,  'oracle_resolution',  'active'),
('quant-logic',     'Quant Logic Architect',     'LMSR market design with anti-manipulation guardrails',        'gemini-2.5-flash', 0.15, 'market_creation',    'active'),
('chronos',         'Chronos Timing Architect',  'BD timezone-aware trading window determination',              'gemini-2.5-flash', 0.1,  'market_creation',    'active'),
('sentinel',        'Sentinel Shield Pro',       'Real-time fraud detection and AML risk scoring',              'gemini-2.5-flash', 0.05, 'security',           'active'),
('oracle-resolve',  'Oracle Guardian BD Prime',  'Final market resolution with tiered source authority',        'gemini-2.5-flash', 0.05, 'oracle_resolution',  'active'),
('concierge',       'Concierge Mentor Pro',      'White-glove user support and trading education in Bengali',   'gemini-2.5-flash', 0.4,  'support',            'active'),
('tribunal',        'Supreme Tribunal Pro',      'Dispute resolution with Bengali legal reasoning',             'gemini-2.5-flash', 0.05, 'oracle_resolution',  'active'),
('growth',          'Viral Growth Machine',      'BD trend mining, VPS scoring, social content generation',     'gemini-2.5-flash', 0.7,  'growth',             'active'),
('audit',           'Audit Fiscal Integrity',    'Triple-entry reconciliation and anomaly detection',           'gemini-2.5-flash', 0.05, 'audit',              'active')
ON CONFLICT (agent_key) DO NOTHING;

-- 5. Audit logs table (for fiscal watchdog)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type TEXT NOT NULL,
    status TEXT NOT NULL,
    reserve_ratio DECIMAL,
    variance DECIMAL,
    action TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_agent_date ON ai_usage_logs(agent_key, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_configs_status ON ai_agent_configs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(audit_type, created_at DESC);
