-- Advanced Multi-Source Verification Architecture Schema
-- Defense-in-depth with source independence, temporal validation, and dynamic weighting

-- 1. Source Ownership Registry
CREATE TABLE IF NOT EXISTS public.source_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(200) NOT NULL UNIQUE,
    owner_name VARCHAR(200) NOT NULL,
    owner_type VARCHAR(50) NOT NULL CHECK (owner_type IN ('government', 'media_group', 'corporate', 'independent')),
    parent_company VARCHAR(200),
    country VARCHAR(100),
    is_independent BOOLEAN DEFAULT true,
    related_domains TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Bangladesh ownership data
INSERT INTO public.source_ownership (domain, owner_name, owner_type, parent_company, country, is_independent, related_domains) VALUES
-- Government
('eci.gov.bd', 'Government of Bangladesh', 'government', NULL, 'Bangladesh', true, '{}'),
('bb.org.bd', 'Bangladesh Bank', 'government', 'Government of Bangladesh', 'Bangladesh', true, '{}'),
('sec.gov.bd', 'SEC Bangladesh', 'government', 'Government of Bangladesh', 'Bangladesh', true, '{}'),
('dse.com.bd', 'Dhaka Stock Exchange', 'government', NULL, 'Bangladesh', true, '{"cse.com.bd"}'),
('cse.com.bd', 'Chittagong Stock Exchange', 'government', NULL, 'Bangladesh', true, '{"dse.com.bd"}'),
('bmd.gov.bd', 'Bangladesh Meteorological Department', 'government', 'Government of Bangladesh', 'Bangladesh', true, '{}'),
('tigercricket.com.bd', 'Bangladesh Cricket Board', 'government', NULL, 'Bangladesh', true, '{}'),
('bff.com.bd', 'Bangladesh Football Federation', 'government', NULL, 'Bangladesh', true, '{}'),

-- Media Groups
('prothomalo.com', 'Transcom Group', 'media_group', 'Transcom Group', 'Bangladesh', false, '{"abcradio.fm"}'),
('banglatribune.com', 'East West Media Group', 'media_group', 'East West Media Group', 'Bangladesh', false, '{"banglanews24.com","news24bd.tv"}'),
('banglanews24.com', 'East West Media Group', 'media_group', 'East West Media Group', 'Bangladesh', false, '{"banglatribune.com","news24bd.tv"}'),
('thedailystar.net', 'Impress Group', 'media_group', 'Impress Group', 'Bangladesh', false, '{"channeli.tv"}'),
('independent24.com', 'BEXIMCO Group', 'media_group', 'BEXIMCO Group', 'Bangladesh', false, '{"independenttv.com"}'),
('somoynews.tv', 'IPDC Finance', 'media_group', 'IPDC Finance', 'Bangladesh', false, '{}'),

-- Independent Media
('bdnews24.com', 'BDNews24', 'independent', NULL, 'Bangladesh', true, '{}'),
('dhakatribune.com', 'Dhaka Tribune', 'independent', NULL, 'Bangladesh', true, '{}'),
('jugantor.com', 'Jugantor', 'independent', NULL, 'Bangladesh', true, '{}'),
('kalerkantho.com', 'Kaler Kantho', 'independent', NULL, 'Bangladesh', true, '{}'),
('ittefaq.com.bd', 'Ittefaq', 'independent', NULL, 'Bangladesh', true, '{}'),

-- International
('reuters.com', 'Thomson Reuters', 'corporate', 'Thomson Reuters', 'Canada', true, '{}'),
('bloomberg.com', 'Bloomberg LP', 'corporate', 'Bloomberg LP', 'USA', true, '{}'),
('bbc.com', 'BBC', 'government', 'BBC', 'UK', true, '{"bbc.co.uk"}'),
('aljazeera.com', 'Al Jazeera Media Network', 'government', 'Qatar Government', 'Qatar', true, '{}')

ON CONFLICT (domain) DO UPDATE SET
    owner_name = EXCLUDED.owner_name,
    owner_type = EXCLUDED.owner_type,
    parent_company = EXCLUDED.parent_company,
    updated_at = NOW();

-- 2. Source Accuracy Tracking
CREATE TABLE IF NOT EXISTS public.source_accuracy_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(200) NOT NULL REFERENCES public.source_ownership(domain),
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy DECIMAL(5,4) DEFAULT 0,
    
    -- Bias metrics
    false_positives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,
    bias_score DECIMAL(4,3) DEFAULT 0, -- -1 to +1
    
    -- Delay metrics
    avg_reporting_delay_minutes DECIMAL(10,2) DEFAULT 0,
    is_fast_source BOOLEAN DEFAULT true,
    
    -- Weight tracking
    base_weight DECIMAL(4,3) DEFAULT 0.70,
    current_weight DECIMAL(4,3) DEFAULT 0.70,
    weight_penalty DECIMAL(4,3) DEFAULT 0,
    
    -- Trend analysis
    recent_accuracy DECIMAL(5,4) DEFAULT 0,
    accuracy_trend VARCHAR(20) DEFAULT 'stable' CHECK (accuracy_trend IN ('improving', 'stable', 'declining')),
    
    -- Tier
    source_tier VARCHAR(20) DEFAULT 'tertiary' CHECK (source_tier IN ('primary', 'secondary', 'tertiary')),
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize tracking for known sources
INSERT INTO public.source_accuracy_tracking (domain, base_weight, current_weight, source_tier)
SELECT domain, 
    CASE 
        WHEN owner_type = 'government' THEN 0.95
        WHEN owner_type = 'media_group' THEN 0.88
        WHEN owner_type = 'corporate' THEN 0.92
        ELSE 0.80
    END,
    CASE 
        WHEN owner_type = 'government' THEN 0.95
        WHEN owner_type = 'media_group' THEN 0.88
        WHEN owner_type = 'corporate' THEN 0.92
        ELSE 0.80
    END,
    CASE 
        WHEN owner_type = 'government' THEN 'primary'
        WHEN owner_type IN ('corporate', 'media_group') THEN 'secondary'
        ELSE 'tertiary'
    END
FROM public.source_ownership
ON CONFLICT (domain) DO NOTHING;

-- 3. Verification Events Log
CREATE TABLE IF NOT EXISTS public.verification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id VARCHAR(100) NOT NULL REFERENCES public.ai_resolution_pipelines(pipeline_id),
    market_id UUID NOT NULL REFERENCES public.markets(id),
    
    -- Verification results
    can_auto_resolve BOOLEAN DEFAULT false,
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('verified', 'partial', 'insufficient', 'rejected')),
    confidence_score DECIMAL(5,4) NOT NULL,
    independence_score DECIMAL(5,4) NOT NULL,
    
    -- Source breakdown
    primary_sources INTEGER DEFAULT 0,
    secondary_sources INTEGER DEFAULT 0,
    tertiary_sources INTEGER DEFAULT 0,
    
    -- Issues
    ownership_conflicts JSONB DEFAULT '[]',
    temporal_issues JSONB DEFAULT '[]',
    blockers JSONB DEFAULT '[]',
    
    -- Consensus
    consensus_outcome VARCHAR(50),
    consensus_confidence DECIMAL(5,4),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Source Outcome Records (for accuracy tracking)
CREATE TABLE IF NOT EXISTS public.source_outcome_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(200) NOT NULL,
    pipeline_id VARCHAR(100) NOT NULL,
    market_id UUID NOT NULL,
    
    predicted_outcome VARCHAR(50) NOT NULL,
    actual_outcome VARCHAR(50) NOT NULL,
    was_correct BOOLEAN NOT NULL,
    
    reporting_delay_minutes DECIMAL(10,2),
    source_content TEXT,
    
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Temporal Validation Log
CREATE TABLE IF NOT EXISTS public.temporal_validation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id VARCHAR(100) NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    
    is_valid BOOLEAN DEFAULT false,
    out_of_sequence_count INTEGER DEFAULT 0,
    consensus_window_start TIMESTAMPTZ,
    consensus_window_end TIMESTAMPTZ,
    consensus_window_minutes DECIMAL(10,2),
    
    issues JSONB DEFAULT '[]',
    source_timestamps JSONB DEFAULT '[]',
    
    validated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_source_ownership_owner ON public.source_ownership(owner_name);
CREATE INDEX IF NOT EXISTS idx_source_ownership_type ON public.source_ownership(owner_type);
CREATE INDEX IF NOT EXISTS idx_source_ownership_independent ON public.source_ownership(is_independent);

CREATE INDEX IF NOT EXISTS idx_source_accuracy_domain ON public.source_accuracy_tracking(domain);
CREATE INDEX IF NOT EXISTS idx_source_accuracy_tier ON public.source_accuracy_tracking(source_tier);
CREATE INDEX IF NOT EXISTS idx_source_accuracy_accuracy ON public.source_accuracy_tracking(accuracy);

CREATE INDEX IF NOT EXISTS idx_verification_events_pipeline ON public.verification_events(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_verification_events_market ON public.verification_events(market_id);
CREATE INDEX IF NOT EXISTS idx_verification_events_status ON public.verification_events(verification_status);

CREATE INDEX IF NOT EXISTS idx_source_outcomes_domain ON public.source_outcome_records(domain);
CREATE INDEX IF NOT EXISTS idx_source_outcomes_correct ON public.source_outcome_records(was_correct);

CREATE INDEX IF NOT EXISTS idx_temporal_log_pipeline ON public.temporal_validation_log(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_temporal_log_valid ON public.temporal_validation_log(is_valid);

-- Views for reporting

-- Source Accuracy Leaderboard
CREATE OR REPLACE VIEW public.source_accuracy_leaderboard AS
SELECT 
    sat.domain,
    so.owner_name,
    so.owner_type,
    sat.source_tier,
    sat.total_predictions,
    sat.correct_predictions,
    sat.accuracy,
    sat.bias_score,
    sat.is_fast_source,
    sat.current_weight,
    sat.accuracy_trend,
    sat.last_updated
FROM public.source_accuracy_tracking sat
JOIN public.source_ownership so ON sat.domain = so.domain
WHERE sat.total_predictions >= 5
ORDER BY sat.accuracy DESC, sat.total_predictions DESC;

-- Verification Success Rate
CREATE OR REPLACE VIEW public.verification_success_rate AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_verifications,
    SUM(CASE WHEN can_auto_resolve THEN 1 ELSE 0 END) as auto_resolved,
    SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as fully_verified,
    AVG(confidence_score) as avg_confidence,
    AVG(independence_score) as avg_independence
FROM public.verification_events
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Update triggers
CREATE OR REPLACE FUNCTION update_source_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate accuracy
    NEW.accuracy := CASE 
        WHEN NEW.total_predictions > 0 THEN NEW.correct_predictions::DECIMAL / NEW.total_predictions
        ELSE 0 
    END;
    
    -- Recalculate bias
    IF (NEW.false_positives + NEW.false_negatives) > 0 THEN
        NEW.bias_score := (NEW.false_positives - NEW.false_negatives)::DECIMAL / 
                         (NEW.false_positives + NEW.false_negatives);
    ELSE
        NEW.bias_score := 0;
    END IF;
    
    -- Update is_fast_source
    NEW.is_fast_source := NEW.avg_reporting_delay_minutes < 60;
    
    -- Update weight based on accuracy
    IF NEW.total_predictions >= 5 THEN
        NEW.current_weight := LEAST(0.99, NEW.base_weight * (0.5 + NEW.accuracy));
        NEW.weight_penalty := NEW.base_weight - NEW.current_weight;
    END IF;
    
    NEW.last_updated := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_source_accuracy
BEFORE UPDATE ON public.source_accuracy_tracking
FOR EACH ROW EXECUTE FUNCTION update_source_accuracy();

-- Comments
COMMENT ON TABLE public.source_ownership IS 'Media ownership structure for detecting source dependencies';
COMMENT ON TABLE public.source_accuracy_tracking IS 'Historical accuracy metrics for dynamic source weighting';
COMMENT ON TABLE public.verification_events IS 'Log of all cross-verification attempts';
COMMENT ON TABLE public.source_outcome_records IS 'Individual prediction outcomes for accuracy tracking';
COMMENT ON TABLE public.temporal_validation_log IS 'Temporal alignment validation results';
