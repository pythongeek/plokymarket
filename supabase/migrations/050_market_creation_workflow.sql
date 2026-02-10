-- ============================================
-- MARKET CREATION WORKFLOW WITH QUALITY GATES
-- ============================================

-- Market creation drafts table (stores work-in-progress market creation)
CREATE TABLE IF NOT EXISTS market_creation_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Workflow status
    current_stage VARCHAR(50) NOT NULL DEFAULT 'template_selection',
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, in_review, approved, rejected, deployed
    
    -- Stage completion tracking
    stages_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Stage 1: Template Selection
    market_type VARCHAR(50), -- binary, categorical, scalar, custom
    template_id VARCHAR(100),
    
    -- Stage 2: Parameter Configuration
    question TEXT,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags TEXT[],
    
    -- For scalar markets
    min_value DECIMAL(20, 8),
    max_value DECIMAL(20, 8),
    unit VARCHAR(50),
    
    -- For categorical markets
    outcomes JSONB, -- [{"id": "1", "label": "Outcome 1"}, ...]
    
    -- Resolution criteria
    resolution_source VARCHAR(255),
    resolution_source_url TEXT,
    resolution_criteria TEXT,
    resolution_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Oracle configuration
    oracle_type VARCHAR(50), -- MANUAL, AI, UMA, CHAINLINK, CUSTOM
    oracle_config JSONB, -- oracle-specific settings
    
    -- Stage 3: Liquidity Commitment
    liquidity_commitment DECIMAL(20, 8) NOT NULL DEFAULT 0,
    liquidity_currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
    liquidity_deposited BOOLEAN NOT NULL DEFAULT FALSE,
    liquidity_tx_hash VARCHAR(100),
    
    -- Stage 4: Legal Review
    sensitive_topics TEXT[],
    regulatory_risk_level VARCHAR(20), -- low, medium, high
    legal_review_status VARCHAR(50), -- pending, approved, rejected, escalated
    legal_review_notes TEXT,
    legal_reviewer_id UUID REFERENCES auth.users(id),
    legal_reviewed_at TIMESTAMP WITH TIME ZONE,
    requires_senior_counsel BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Stage 5: Preview & Simulation
    simulation_config JSONB,
    simulation_results JSONB,
    
    -- Stage 6: Deployment
    deployment_config JSONB,
    deployment_tx_hash VARCHAR(100),
    deployed_market_id UUID REFERENCES markets(id),
    deployed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    version INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID REFERENCES market_creation_drafts(id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_market_drafts_creator ON market_creation_drafts(creator_id);
CREATE INDEX IF NOT EXISTS idx_market_drafts_status ON market_creation_drafts(status);
CREATE INDEX IF NOT EXISTS idx_market_drafts_stage ON market_creation_drafts(current_stage);
CREATE INDEX IF NOT EXISTS idx_market_drafts_legal_review ON market_creation_drafts(legal_review_status) WHERE legal_review_status IS NOT NULL;

-- Enable RLS
ALTER TABLE market_creation_drafts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Creators can view own drafts"
    ON market_creation_drafts
    FOR SELECT
    USING (auth.uid() = creator_id OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE
    ));

CREATE POLICY "Creators can insert own drafts"
    ON market_creation_drafts
    FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own drafts"
    ON market_creation_drafts
    FOR UPDATE
    USING (auth.uid() = creator_id OR EXISTS (
        SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE
    ));

-- Legal review queue (for senior counsel)
CREATE TABLE IF NOT EXISTS legal_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES market_creation_drafts(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_review, completed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(draft_id)
);

CREATE INDEX IF NOT EXISTS idx_legal_queue_status ON legal_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_legal_queue_assigned ON legal_review_queue(assigned_to);

-- Market templates table
CREATE TABLE IF NOT EXISTS market_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    market_type VARCHAR(50) NOT NULL, -- binary, categorical, scalar, custom
    category VARCHAR(100),
    
    -- Default parameters
    default_params JSONB,
    
    -- Validation rules
    validation_rules JSONB,
    
    -- UI configuration
    ui_config JSONB,
    
    -- Template status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default templates
INSERT INTO market_templates (id, name, description, market_type, category, default_params, validation_rules) VALUES
('binary_yes_no', 'Yes/No Prediction', 'Simple binary outcome market', 'binary', 'General', 
 '{"outcomes": [{"id": "yes", "label": "Yes"}, {"id": "no", "label": "No"}]}',
 '{"min_liquidity": 1000, "max_resolution_days": 365}'),

('sports_match', 'Sports Match Result', 'Predict sports match outcomes', 'categorical', 'Sports',
 '{"outcomes": [{"id": "home", "label": "Home Win"}, {"id": "draw", "label": "Draw"}, {"id": "away", "label": "Away Win"}]}',
 '{"min_liquidity": 2000, "max_resolution_days": 7}'),

('crypto_price', 'Crypto Price Target', 'Will crypto reach a price target by date?', 'binary', 'Crypto',
 '{"resolution_criteria": "Price must be reached on at least one major exchange (Binance, Coinbase, Kraken) at any point before the resolution deadline."}',
 '{"min_liquidity": 5000, "max_resolution_days": 90}'),

('political_election', 'Political Election', 'Election outcome prediction', 'categorical', 'Politics',
 '{"resolution_criteria": "Based on official election results from certified government sources."}',
 '{"min_liquidity": 10000, "requires_legal_review": true, "max_resolution_days": 180}'),

('scalar_price', 'Scalar Price Prediction', 'Predict exact price/value within a range', 'scalar', 'Finance',
 '{"unit": "USD", "decimals": 2}',
 '{"min_liquidity": 5000, "max_range": 1000000}');

-- Sensitive topics detection
CREATE TABLE IF NOT EXISTS sensitive_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- violence, gambling, politics, etc.
    risk_level VARCHAR(20) NOT NULL, -- low, medium, high
    requires_review BOOLEAN NOT NULL DEFAULT FALSE,
    auto_flag BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert sensitive topic keywords
INSERT INTO sensitive_topics (keyword, category, risk_level, requires_review, auto_flag) VALUES
('terrorism', 'Violence', 'high', true, true),
('assassination', 'Violence', 'high', true, true),
('war', 'Violence', 'medium', true, false),
('casino', 'Gambling', 'medium', true, false),
('betting', 'Gambling', 'low', false, false),
('election fraud', 'Politics', 'high', true, true),
('corruption', 'Politics', 'medium', true, false),
('pandemic', 'Health', 'medium', true, false),
('death', 'Sensitive', 'medium', true, false),
('illegal', 'Legal', 'high', true, true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check for sensitive topics in market text
CREATE OR REPLACE FUNCTION check_sensitive_topics(p_text TEXT)
RETURNS TABLE (
    keyword VARCHAR(100),
    category VARCHAR(100),
    risk_level VARCHAR(20),
    requires_review BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT st.keyword, st.category, st.risk_level, st.requires_review
    FROM sensitive_topics st
    WHERE p_text ILIKE '%' || st.keyword || '%'
    AND st.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new market draft
CREATE OR REPLACE FUNCTION create_market_draft(
    p_creator_id UUID,
    p_market_type VARCHAR(50),
    p_template_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_draft_id UUID;
BEGIN
    INSERT INTO market_creation_drafts (
        creator_id,
        market_type,
        template_id,
        current_stage,
        stages_completed
    ) VALUES (
        p_creator_id,
        p_market_type,
        p_template_id,
        'template_selection',
        '[]'::jsonb
    )
    RETURNING id INTO v_draft_id;
    
    RETURN v_draft_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update draft stage
CREATE OR REPLACE FUNCTION update_draft_stage(
    p_draft_id UUID,
    p_stage VARCHAR(50),
    p_stage_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_stage VARCHAR(50);
    v_stages_completed JSONB;
BEGIN
    -- Get current state
    SELECT current_stage, stages_completed 
    INTO v_current_stage, v_stages_completed
    FROM market_creation_drafts
    WHERE id = p_draft_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Add current stage to completed if not already there
    IF NOT v_stages_completed ? v_current_stage THEN
        v_stages_completed := v_stages_completed || to_jsonb(v_current_stage);
    END IF;
    
    -- Update the draft
    UPDATE market_creation_drafts SET
        current_stage = p_stage,
        stages_completed = v_stages_completed,
        updated_at = NOW(),
        -- Merge stage-specific data
        question = COALESCE((p_stage_data->>'question'), question),
        description = COALESCE((p_stage_data->>'description'), description),
        category = COALESCE((p_stage_data->>'category'), category),
        subcategory = COALESCE((p_stage_data->>'subcategory'), subcategory),
        tags = COALESCE((p_stage_data->'tags')::text[], tags),
        min_value = COALESCE((p_stage_data->>'min_value')::decimal, min_value),
        max_value = COALESCE((p_stage_data->>'max_value')::decimal, max_value),
        unit = COALESCE((p_stage_data->>'unit'), unit),
        outcomes = COALESCE(p_stage_data->'outcomes', outcomes),
        resolution_source = COALESCE((p_stage_data->>'resolution_source'), resolution_source),
        resolution_source_url = COALESCE((p_stage_data->>'resolution_source_url'), resolution_source_url),
        resolution_criteria = COALESCE((p_stage_data->>'resolution_criteria'), resolution_criteria),
        resolution_deadline = COALESCE((p_stage_data->>'resolution_deadline')::timestamptz, resolution_deadline),
        oracle_type = COALESCE((p_stage_data->>'oracle_type'), oracle_type),
        oracle_config = COALESCE(p_stage_data->'oracle_config', oracle_config),
        liquidity_commitment = COALESCE((p_stage_data->>'liquidity_commitment')::decimal, liquidity_commitment),
        simulation_config = COALESCE(p_stage_data->'simulation_config', simulation_config)
    WHERE id = p_draft_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to submit for legal review
CREATE OR REPLACE FUNCTION submit_for_legal_review(
    p_draft_id UUID,
    p_submitter_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_risk_level VARCHAR(20) := 'low';
    v_requires_senior BOOLEAN := FALSE;
    v_sensitive_found TEXT[];
BEGIN
    -- Check for sensitive topics in question and description
    SELECT array_agg(st.keyword), MAX(st.risk_level)
    INTO v_sensitive_found, v_risk_level
    FROM market_creation_drafts d
    CROSS JOIN check_sensitive_topics(COALESCE(d.question, '') || ' ' || COALESCE(d.description, '')) st
    WHERE d.id = p_draft_id;
    
    -- Determine if senior counsel needed
    SELECT EXISTS (
        SELECT 1 FROM check_sensitive_topics(
            (SELECT COALESCE(question, '') || ' ' || COALESCE(description, '') 
             FROM market_creation_drafts WHERE id = p_draft_id)
        ) st WHERE st.risk_level = 'high'
    ) INTO v_requires_senior;
    
    -- Update draft
    UPDATE market_creation_drafts SET
        sensitive_topics = v_sensitive_found,
        regulatory_risk_level = COALESCE(v_risk_level, 'low'),
        legal_review_status = 'pending',
        requires_senior_counsel = v_requires_senior,
        status = 'in_review',
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    -- Add to review queue if requires review
    IF v_risk_level IN ('medium', 'high') OR v_requires_senior THEN
        INSERT INTO legal_review_queue (draft_id, priority, status)
        VALUES (p_draft_id, 
            CASE 
                WHEN v_requires_senior THEN 'high'
                WHEN v_risk_level = 'high' THEN 'high'
                WHEN v_risk_level = 'medium' THEN 'normal'
                ELSE 'low'
            END,
            'pending'
        );
    ELSE
        -- Auto-approve if low risk
        UPDATE market_creation_drafts SET
            legal_review_status = 'approved',
            legal_reviewed_at = NOW()
        WHERE id = p_draft_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to complete legal review
CREATE OR REPLACE FUNCTION complete_legal_review(
    p_draft_id UUID,
    p_reviewer_id UUID,
    p_status VARCHAR(50), -- approved, rejected, escalated
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE market_creation_drafts SET
        legal_review_status = p_status,
        legal_reviewer_id = p_reviewer_id,
        legal_review_notes = p_notes,
        legal_reviewed_at = NOW(),
        status = CASE 
            WHEN p_status = 'approved' THEN 'approved'
            WHEN p_status = 'rejected' THEN 'rejected'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    UPDATE legal_review_queue SET
        status = 'completed',
        completed_at = NOW()
    WHERE draft_id = p_draft_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to record liquidity deposit
CREATE OR REPLACE FUNCTION record_liquidity_deposit(
    p_draft_id UUID,
    p_tx_hash VARCHAR(100),
    p_amount DECIMAL(20, 8)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE market_creation_drafts SET
        liquidity_deposited = TRUE,
        liquidity_tx_hash = p_tx_hash,
        liquidity_commitment = p_amount,
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to record market deployment
CREATE OR REPLACE FUNCTION record_market_deployment(
    p_draft_id UUID,
    p_market_id UUID,
    p_tx_hash VARCHAR(100),
    p_deployment_config JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE market_creation_drafts SET
        status = 'deployed',
        deployed_market_id = p_market_id,
        deployment_tx_hash = p_tx_hash,
        deployment_config = p_deployment_config,
        deployed_at = NOW(),
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_draft_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get drafts requiring legal review
CREATE OR REPLACE FUNCTION get_legal_review_queue(
    p_assignee_id UUID DEFAULT NULL
)
RETURNS TABLE (
    draft_id UUID,
    question TEXT,
    category VARCHAR(100),
    risk_level VARCHAR(20),
    priority VARCHAR(20),
    requires_senior BOOLEAN,
    sensitive_topics TEXT[],
    submitted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.question,
        d.category,
        d.regulatory_risk_level,
        q.priority,
        d.requires_senior_counsel,
        d.sensitive_topics,
        d.submitted_at
    FROM market_creation_drafts d
    JOIN legal_review_queue q ON q.draft_id = d.id
    WHERE d.legal_review_status = 'pending'
    AND (p_assignee_id IS NULL OR q.assigned_to = p_assignee_id)
    ORDER BY 
        CASE q.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'normal' THEN 3 
            ELSE 4 
        END,
        d.submitted_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_market_drafts_updated_at
    BEFORE UPDATE ON market_creation_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_templates_updated_at
    BEFORE UPDATE ON market_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
