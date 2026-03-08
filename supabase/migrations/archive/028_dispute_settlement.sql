-- Dispute Mechanism and Settlement Schema
-- Escalating bonds, expert panels, and automated settlement

-- 1. Disputes Table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id VARCHAR(100) NOT NULL UNIQUE,
    market_id UUID NOT NULL REFERENCES public.markets(id),
    pipeline_id VARCHAR(100) REFERENCES public.ai_resolution_pipelines(pipeline_id),
    
    -- Dispute level
    level VARCHAR(20) NOT NULL CHECK (level IN ('initial', 'appeal', 'final')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'resolved', 'rejected', 'expired')),
    
    -- Participants
    challenger_id UUID NOT NULL REFERENCES public.users(id),
    proposer_id UUID REFERENCES public.users(id),
    
    -- Bonds
    bond_amount DECIMAL(18, 2) NOT NULL,
    bond_currency VARCHAR(10) DEFAULT 'BDT',
    bond_locked_at TIMESTAMPTZ NOT NULL,
    bond_released_at TIMESTAMPTZ,
    
    -- Challenge details
    challenge_reason TEXT NOT NULL,
    evidence_urls TEXT[],
    expected_outcome VARCHAR(50) NOT NULL,
    
    -- Resolution
    resolution_method VARCHAR(50),
    resolution_outcome VARCHAR(20) CHECK (resolution_outcome IN ('upheld', 'overturned', 'split', 'timeout')),
    final_outcome VARCHAR(50),
    resolution_details JSONB,
    
    -- Timeline
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deadline_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    
    -- Economics
    reward_distributed BOOLEAN DEFAULT false,
    challenger_reward DECIMAL(18, 2),
    treasury_fee DECIMAL(18, 2),
    
    -- Appeals hierarchy
    parent_dispute_id UUID REFERENCES public.disputes(id),
    child_dispute_id UUID REFERENCES public.disputes(id)
);

-- 2. Expert Panel Members
CREATE TABLE IF NOT EXISTS public.expert_panel_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    name VARCHAR(200) NOT NULL,
    expertise TEXT[], -- ['bangladesh_politics', 'cricket', 'economy']
    credibility_score DECIMAL(4, 3) DEFAULT 0.80 CHECK (credibility_score BETWEEN 0 AND 1),
    total_reviews INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5, 4) DEFAULT 0.80 CHECK (accuracy_rate BETWEEN 0 AND 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Bangladesh domain experts
INSERT INTO public.expert_panel_members (name, expertise, credibility_score) VALUES
('Dr. Aminul Islam', ARRAY['bangladesh_politics', 'election_analysis', 'constitutional_law'], 0.95),
('Prof. Farhana Rahman', ARRAY['bangladesh_economy', 'financial_markets', 'banking'], 0.93),
('Imran Khan', ARRAY['bangladesh_cricket', 'sports_analytics', 'icc_regulations'], 0.90),
('Dr. Tanvir Ahmed', ARRAY['bangladesh_weather', 'climate_science', 'disaster_management'], 0.92),
('Advocate Sultana Jahan', ARRAY['bangladesh_law', 'corporate_governance', 'regulatory_compliance'], 0.94)
ON CONFLICT DO NOTHING;

-- 3. Expert Panel Reviews
CREATE TABLE IF NOT EXISTS public.expert_panel_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES public.disputes(id),
    panel_members UUID[] NOT NULL, -- Array of expert IDs
    
    -- Votes
    votes JSONB DEFAULT '[]', -- Array of {expert_id, outcome, confidence, reasoning, voted_at}
    
    -- Consensus
    consensus_outcome VARCHAR(50),
    consensus_confidence DECIMAL(5, 4),
    
    -- Timeline
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 4. Settlement Claims
CREATE TABLE IF NOT EXISTS public.settlement_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id VARCHAR(100) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    market_id UUID NOT NULL REFERENCES public.markets(id),
    
    outcome VARCHAR(50) NOT NULL,
    shares DECIMAL(18, 8) NOT NULL,
    payout_amount DECIMAL(18, 2) NOT NULL,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'auto_settled', 'failed')),
    opt_in_auto_settle BOOLEAN DEFAULT false,
    
    relayer_fee DECIMAL(18, 4),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ
);

-- 5. Settlement Batches
CREATE TABLE IF NOT EXISTS public.settlement_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(100) NOT NULL UNIQUE,
    market_id UUID NOT NULL REFERENCES public.markets(id),
    
    claim_ids TEXT[] NOT NULL,
    total_amount DECIMAL(18, 2) NOT NULL,
    gas_estimate INTEGER,
    
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 6. Settlement Escalations
CREATE TABLE IF NOT EXISTS public.settlement_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES public.markets(id),
    batch_id VARCHAR(100),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
    resolved_by UUID REFERENCES public.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_market ON public.disputes(market_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_level ON public.disputes(level);
CREATE INDEX IF NOT EXISTS idx_disputes_challenger ON public.disputes(challenger_id);
CREATE INDEX IF NOT EXISTS idx_disputes_deadline ON public.disputes(deadline_at);

CREATE INDEX IF NOT EXISTS idx_expert_expertise ON public.expert_panel_members USING GIN(expertise);
CREATE INDEX IF NOT EXISTS idx_expert_active ON public.expert_panel_members(is_active);

CREATE INDEX IF NOT EXISTS idx_claims_user ON public.settlement_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_market ON public.settlement_claims(market_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.settlement_claims(status);

CREATE INDEX IF NOT EXISTS idx_batches_market ON public.settlement_batches(market_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.settlement_batches(status);

-- Views

-- Dispute Statistics
CREATE OR REPLACE VIEW public.dispute_statistics AS
SELECT 
    COUNT(*) as total_disputes,
    COUNT(*) FILTER (WHERE level = 'initial') as initial_disputes,
    COUNT(*) FILTER (WHERE level = 'appeal') as appeal_disputes,
    COUNT(*) FILTER (WHERE level = 'final') as final_disputes,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_disputes,
    COUNT(*) FILTER (WHERE resolution_outcome = 'overturned') as successful_challenges,
    COALESCE(AVG(CASE WHEN resolution_outcome = 'overturned' THEN 1.0 ELSE 0.0 END), 0) as success_rate,
    COALESCE(SUM(bond_amount), 0) as total_bonds_locked,
    COALESCE(SUM(challenger_reward), 0) as total_rewards_distributed,
    COALESCE(SUM(treasury_fee), 0) as total_treasury_fees
FROM public.disputes;

-- Settlement Statistics
CREATE OR REPLACE VIEW public.settlement_statistics AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'claimed') as manual_claims,
    COUNT(*) FILTER (WHERE status = 'auto_settled') as auto_settled_claims,
    COALESCE(SUM(payout_amount) FILTER (WHERE status IN ('claimed', 'auto_settled')), 0) as total_payout,
    COALESCE(SUM(relayer_fee) FILTER (WHERE status IN ('claimed', 'auto_settled')), 0) as total_relayer_fees,
    COALESCE(AVG(CASE WHEN status = 'auto_settled' THEN 1.0 ELSE 0.0 END), 0) as auto_settle_rate
FROM public.settlement_claims;

-- Row Level Security
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own disputes and claims
CREATE POLICY disputes_select_own ON public.disputes
    FOR SELECT USING (challenger_id = auth.uid());

CREATE POLICY claims_select_own ON public.settlement_claims
    FOR SELECT USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE public.disputes IS 'Escalating bond dispute mechanism with 3 levels';
COMMENT ON TABLE public.expert_panel_members IS 'Bangladesh domain experts for appeal-level disputes';
COMMENT ON TABLE public.expert_panel_reviews IS 'Expert panel voting records';
COMMENT ON TABLE public.settlement_claims IS 'User redemption claims after market settlement';
COMMENT ON TABLE public.settlement_batches IS 'Batch processing for gas optimization';
