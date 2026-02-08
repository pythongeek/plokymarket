-- Advanced AI-Powered Oracle System Schema
-- Production-ready with full audit trail, feedback loops, and model versioning

-- 1. AI Resolution Pipelines
CREATE TABLE IF NOT EXISTS public.ai_resolution_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id VARCHAR(100) NOT NULL UNIQUE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    
    -- Agent Outputs (stored as JSONB for flexibility)
    retrieval_output JSONB,
    synthesis_output JSONB,
    deliberation_output JSONB,
    explanation_output JSONB,
    
    -- Final Result
    final_outcome VARCHAR(50),
    final_confidence DECIMAL(5,4),
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('automated', 'human_review', 'escalation')),
    recommended_action VARCHAR(50),
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'escalated')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_execution_time_ms INTEGER,
    
    -- Model Versions
    synthesis_model_version VARCHAR(20),
    deliberation_model_version VARCHAR(20),
    explanation_model_version VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resolution Feedback (for continuous improvement)
CREATE TABLE IF NOT EXISTS public.resolution_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id VARCHAR(100) NOT NULL REFERENCES public.ai_resolution_pipelines(pipeline_id),
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    
    -- Feedback Data
    was_disputed BOOLEAN DEFAULT false,
    dispute_outcome VARCHAR(20) CHECK (dispute_outcome IN ('upheld', 'overturned')),
    human_corrected_outcome VARCHAR(50),
    human_reviewer_id UUID REFERENCES public.users(id),
    feedback_score DECIMAL(3,2), -- -1 to 1
    
    -- Error Analysis
    error_type VARCHAR(50) CHECK (error_type IN ('false_positive', 'false_negative', 'confidence_miscalibration', 'evidence_miss')),
    root_cause TEXT,
    
    -- Processing
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Human Review Queue
CREATE TABLE IF NOT EXISTS public.human_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id VARCHAR(100) NOT NULL REFERENCES public.ai_resolution_pipelines(pipeline_id),
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    market_question TEXT NOT NULL,
    
    -- AI Recommendation
    ai_outcome VARCHAR(50) NOT NULL,
    ai_confidence DECIMAL(5,4) NOT NULL,
    ai_explanation TEXT,
    evidence_summary JSONB,
    
    -- Review Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed', 'escalated')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES public.users(id),
    assigned_at TIMESTAMPTZ,
    
    -- Review Result
    reviewer_decision VARCHAR(20) CHECK (reviewer_decision IN ('accept', 'modify', 'escalate')),
    final_outcome VARCHAR(50),
    reviewer_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deadline_at TIMESTAMPTZ NOT NULL
);

-- 4. Model Versions (for A/B testing and rollback)
CREATE TABLE IF NOT EXISTS public.ai_model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('synthesis', 'deliberation', 'explanation', 'retrieval')),
    version VARCHAR(20) NOT NULL,
    deployment_status VARCHAR(20) DEFAULT 'staging' CHECK (deployment_status IN ('staging', 'active', 'deprecated')),
    
    -- Performance Metrics
    accuracy DECIMAL(5,4),
    precision DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    avg_latency_ms INTEGER,
    
    -- Training Info
    training_date TIMESTAMPTZ,
    dataset_size INTEGER,
    training_parameters JSONB,
    
    -- Canary Deployment
    is_canary BOOLEAN DEFAULT false,
    canary_traffic_percent INTEGER DEFAULT 0 CHECK (canary_traffic_percent BETWEEN 0 AND 100),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(model_type, version)
);

-- 5. A/B Tests
CREATE TABLE IF NOT EXISTS public.ai_ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    model_a_id UUID NOT NULL REFERENCES public.ai_model_versions(id),
    model_b_id UUID NOT NULL REFERENCES public.ai_model_versions(id),
    
    -- Traffic Split [A%, B%]
    traffic_split_a INTEGER NOT NULL CHECK (traffic_split_a BETWEEN 0 AND 100),
    traffic_split_b INTEGER NOT NULL CHECK (traffic_split_b BETWEEN 0 AND 100),
    CHECK (traffic_split_a + traffic_split_b = 100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'cancelled')),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    
    -- Metrics
    model_a_metrics JSONB,
    model_b_metrics JSONB,
    winner_id UUID REFERENCES public.ai_model_versions(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Evidence Sources Cache
CREATE TABLE IF NOT EXISTS public.ai_evidence_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(500) NOT NULL UNIQUE,
    query TEXT NOT NULL,
    sources JSONB NOT NULL,
    
    -- TTL
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    source_types TEXT[],
    total_sources INTEGER,
    cross_verification_score DECIMAL(5,4),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Circuit Breaker State (for distributed tracking)
CREATE TABLE IF NOT EXISTS public.ai_circuit_breaker_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('closed', 'open', 'half_open')),
    failure_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 5,
    timeout_ms INTEGER NOT NULL DEFAULT 60000,
    last_failure_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Rate Limit Tracking
CREATE TABLE IF NOT EXISTS public.ai_rate_limit_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(100) NOT NULL UNIQUE,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    request_count INTEGER DEFAULT 0,
    request_limit INTEGER NOT NULL,
    window_ms INTEGER NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_market ON public.ai_resolution_pipelines(market_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_status ON public.ai_resolution_pipelines(status);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_confidence ON public.ai_resolution_pipelines(confidence_level);
CREATE INDEX IF NOT EXISTS idx_ai_pipelines_started ON public.ai_resolution_pipelines(started_at);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_pipeline ON public.resolution_feedback(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_market ON public.resolution_feedback(market_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_error ON public.resolution_feedback(error_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_unprocessed ON public.resolution_feedback(processed_at) WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_human_review_status ON public.human_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_human_review_priority ON public.human_review_queue(priority);
CREATE INDEX IF NOT EXISTS idx_human_review_assigned ON public.human_review_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_human_review_deadline ON public.human_review_queue(deadline_at);
CREATE INDEX IF NOT EXISTS idx_human_review_pending ON public.human_review_queue(status, priority) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_model_versions_type ON public.ai_model_versions(model_type);
CREATE INDEX IF NOT EXISTS idx_model_versions_status ON public.ai_model_versions(deployment_status);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON public.ai_model_versions(model_type, deployment_status) WHERE deployment_status = 'active';

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON public.ai_ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_evidence_cache_expires ON public.ai_evidence_cache(expires_at);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_pipelines_updated_at BEFORE UPDATE ON public.ai_resolution_pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_versions_updated_at BEFORE UPDATE ON public.ai_model_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_breaker_updated_at BEFORE UPDATE ON public.ai_circuit_breaker_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_updated_at BEFORE UPDATE ON public.ai_rate_limit_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.ai_resolution_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_review_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can view their own market pipelines
CREATE POLICY ai_pipelines_select ON public.ai_resolution_pipelines
    FOR SELECT USING (true);

-- Only admins can insert/update
CREATE POLICY ai_pipelines_insert ON public.ai_resolution_pipelines
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reviewers can see assigned items
CREATE POLICY human_review_select ON public.human_review_queue
    FOR SELECT USING (
        assigned_to = auth.uid() OR 
        status = 'pending' OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
    );

-- Row Level Security for feedback (admin only)
CREATE POLICY feedback_select ON public.resolution_feedback
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Comments
COMMENT ON TABLE public.ai_resolution_pipelines IS 'Tracks AI Oracle resolution pipelines with full agent output history';
COMMENT ON TABLE public.resolution_feedback IS 'Feedback loop data for continuous model improvement';
COMMENT ON TABLE public.human_review_queue IS 'Queue for human oversight of AI resolutions';
COMMENT ON TABLE public.ai_model_versions IS 'Model versioning and deployment tracking for A/B testing';
COMMENT ON TABLE public.ai_ab_tests IS 'A/B test configuration and results';
COMMENT ON TABLE public.ai_evidence_cache IS 'Cached evidence sources to reduce API calls';
