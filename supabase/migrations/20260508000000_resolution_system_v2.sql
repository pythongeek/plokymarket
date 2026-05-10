-- Ploky Resolution System v2.1 — Open Source Stack
-- প্লোকি রিজলুশন সিস্টেম ভার্সন 2.1
--
-- New tables for the on-chain + off-chain resolution system
-- Connects to local Supabase + blockchain contracts

-- Enable Row Level Security
ALTER TABLE IF EXISTS resolution_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_analyses ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────────
-- resolution_questions — mirrors on-chain questions with rich metadata
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resolution_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id BYTEA UNIQUE NOT NULL,              -- bytes32 from contract
    chain_question_id TEXT,                          -- hex string for easy lookup
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    
    -- Tier & Status (mirror contract enums)
    tier SMALLINT DEFAULT 0 CHECK (tier IN (0,1,2)),
    -- 0=OBJECTIVE, 1=SEMI_SUBJECTIVE, 2=FULLY_SUBJECTIVE
    
    status SMALLINT DEFAULT 0 CHECK (status IN (0,1,2,3,4,5,6)),
    -- 0=OPEN, 1=PROPOSED, 2=TIMELOCK, 3=RESOLVED, 4=CANCELLED, 5=AI_REVIEW, 6=COMMUNITY_VOTE
    
    outcome SMALLINT DEFAULT 0 CHECK (outcome IN (0,1,2,3,4,5,6)),
    -- 0=UNRESOLVED, 1=YES, 2=NO, 3=DISPUTED, 4=CANCELLED, 5=AI_PENDING, 6=UMA_PENDING
    
    -- Resolution config
    resolution_time TIMESTAMP WITH TIME ZONE,        -- when question should resolve
    bond_amount NUMERIC(78,0) DEFAULT 0,             -- required bond in wei
    
    -- AI Analysis
    ai_confidence_score INTEGER DEFAULT 0,           -- 0-10000
    ai_recommended_outcome SMALLINT DEFAULT 0,
    ai_analysis_cid TEXT,                            -- IPFS CID of full analysis
    ai_analyzed_at TIMESTAMP WITH TIME ZONE,
    llm_used TEXT DEFAULT '',                        -- "minimax" | "ollama"
    
    -- Dispute tracking
    dispute_count INTEGER DEFAULT 0,
    dispute_threshold INTEGER DEFAULT 3,
    is_frozen BOOLEAN DEFAULT FALSE,
    
    -- Blockchain links
    contract_address TEXT,                           -- PlokyResolver address
    transaction_hash TEXT,
    block_number BIGINT,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Search & indexing
    search_vector tsvector
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resolution_questions_status ON resolution_questions(status);
CREATE INDEX IF NOT EXISTS idx_resolution_questions_tier ON resolution_questions(tier);
CREATE INDEX IF NOT EXISTS idx_resolution_questions_category ON resolution_questions(category);
CREATE INDEX IF NOT EXISTS idx_resolution_questions_created_by ON resolution_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_resolution_questions_chain_id ON resolution_questions(chain_question_id);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_resolution_questions_search 
ON resolution_questions USING GIN(search_vector);

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION resolution_questions_search_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resolution_questions_search_trigger ON resolution_questions;
CREATE TRIGGER resolution_questions_search_trigger
    BEFORE INSERT OR UPDATE ON resolution_questions
    FOR EACH ROW EXECUTE FUNCTION resolution_questions_search_update();

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resolution_questions_updated_at ON resolution_questions;
CREATE TRIGGER resolution_questions_updated_at
    BEFORE UPDATE ON resolution_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
CREATE POLICY "resolution_questions_select_all"
    ON resolution_questions FOR SELECT TO authenticated, anon
    USING (true);

CREATE POLICY "resolution_questions_insert_auth"
    ON resolution_questions FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "resolution_questions_update_admin"
    ON resolution_questions FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
    );

-- ───────────────────────────────────────────────────────────────────────────────
-- evidence — evidence submissions for questions
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES resolution_questions(id) ON DELETE CASCADE,
    
    evidence_text TEXT NOT NULL,
    evidence_type SMALLINT DEFAULT 2 CHECK (evidence_type IN (0,1,2)),
    -- 0=SUPPORTING, 1=OPPOSING, 2=NEUTRAL
    
    source_url TEXT,
    source_domain TEXT,
    
    -- AI assessment
    credibility_score INTEGER DEFAULT 0,     -- 0-10000
    manipulation_risk INTEGER DEFAULT 0,     -- 0-10000
    factuality_score INTEGER DEFAULT 0,      -- 0-10000
    
    -- On-chain evidence
    ipfs_cid TEXT,                           -- IPFS CID of evidence content
    bond_amount NUMERIC(78,0) DEFAULT 0,
    transaction_hash TEXT,
    
    submitter UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_question ON evidence(question_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_submitter ON evidence(submitter);

-- RLS
CREATE POLICY "evidence_select_all"
    ON evidence FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "evidence_insert_auth"
    ON evidence FOR INSERT TO authenticated
    WITH CHECK (submitter = auth.uid());

-- ───────────────────────────────────────────────────────────────────────────────
-- proposals — resolver verdict proposals
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES resolution_questions(id) ON DELETE CASCADE,
    
    proposed_outcome SMALLINT NOT NULL CHECK (proposed_outcome IN (1,2)),
    -- 1=YES, 2=NO
    
    reasoning TEXT NOT NULL,
    evidence_cid TEXT,                       -- IPFS CID of proposal evidence
    
    -- Approval tracking
    approvals INTEGER DEFAULT 0,
    required_approvals INTEGER DEFAULT 2,
    approvers UUID[] DEFAULT '{}',
    
    -- Timelock
    proposed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    timelock_until TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    executed BOOLEAN DEFAULT FALSE,
    
    -- Bond
    bond_amount NUMERIC(78,0) DEFAULT 0,
    
    proposer UUID REFERENCES auth.users(id),
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_question ON proposals(question_id);
CREATE INDEX IF NOT EXISTS idx_proposals_executed ON proposals(executed);

-- RLS
CREATE POLICY "proposals_select_all"
    ON proposals FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "proposals_insert_resolver"
    ON proposals FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM resolvers 
            WHERE address = auth.uid()::text AND is_active = true
        )
    );

-- ───────────────────────────────────────────────────────────────────────────────
-- ai_analyses — detailed AI analysis records
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES resolution_questions(id) ON DELETE CASCADE,
    
    -- AI scores
    confidence INTEGER DEFAULT 0,            -- 0-10000
    recommended_outcome SMALLINT DEFAULT 0,
    sentiment_score INTEGER DEFAULT 0,       -- 0-10000
    fact_check_score INTEGER DEFAULT 0,      -- 0-10000
    bias_risk_score INTEGER DEFAULT 0,       -- 0-10000 (lower is better)
    manipulation_risk INTEGER DEFAULT 0,     -- 0-10000 (lower is better)
    evidence_quality INTEGER DEFAULT 0,      -- 0-10000
    
    -- Reasoning
    reasoning TEXT,
    key_facts TEXT[],
    contradictions TEXT[],
    
    -- LLM metadata
    llm_used TEXT DEFAULT '',                -- "minimax" | "ollama"
    model_version TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    
    -- Storage
    ipfs_cid TEXT,                           -- Full analysis JSON on IPFS
    
    -- Auto-resolve flag
    auto_resolve_eligible BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_question ON ai_analyses(question_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_llm ON ai_analyses(llm_used);

-- RLS
CREATE POLICY "ai_analyses_select_all"
    ON ai_analyses FOR SELECT TO authenticated, anon USING (true);

-- ───────────────────────────────────────────────────────────────────────────────
-- resolvers — resolver registry (extends existing table if present)
-- ───────────────────────────────────────────────────────────────────────────────
-- If resolvers table doesn't exist, create it
CREATE TABLE IF NOT EXISTS resolvers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    stake_amount NUMERIC(78,0) DEFAULT 0,
    reputation_score INTEGER DEFAULT 5000,   -- 0-10000
    resolved_count INTEGER DEFAULT 0,
    disputed_count INTEGER DEFAULT 0,
    slashed_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_ai_oracle BOOLEAN DEFAULT FALSE,
    wallet_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_resolvers_address ON resolvers(address);
CREATE INDEX IF NOT EXISTS idx_resolvers_active ON resolvers(is_active);

-- ───────────────────────────────────────────────────────────────────────────────
-- disputes — dispute records
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dispute_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES resolution_questions(id) ON DELETE CASCADE,
    
    dispute_type TEXT NOT NULL,              -- "outcome", "evidence", "process"
    reason TEXT NOT NULL,
    evidence_cid TEXT,
    
    bond_amount NUMERIC(78,0) DEFAULT 0,
    
    -- Resolution
    resolved_by UUID REFERENCES auth.users(id),
    resolution TEXT,
    resolution_outcome SMALLINT,             -- 0=rejected, 1=accepted
    bond_returned BOOLEAN,
    
    disputer UUID REFERENCES auth.users(id),
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_disputes_question ON dispute_records(question_id);
CREATE INDEX IF NOT EXISTS idx_disputes_type ON dispute_records(dispute_type);

-- ───────────────────────────────────────────────────────────────────────────────
-- Functions for common operations
-- ───────────────────────────────────────────────────────────────────────────────

-- Increment dispute count and auto-freeze if threshold reached
CREATE OR REPLACE FUNCTION increment_dispute_count(question_uuid UUID)
RETURNS VOID AS $$
DECLARE
    current_count INTEGER;
    threshold INTEGER;
BEGIN
    UPDATE resolution_questions 
    SET dispute_count = dispute_count + 1 
    WHERE id = question_uuid
    RETURNING dispute_count, dispute_threshold INTO current_count, threshold;
    
    IF current_count >= threshold THEN
        UPDATE resolution_questions 
        SET is_frozen = TRUE, status = 6  -- COMMUNITY_VOTE
        WHERE id = question_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Search questions by text
CREATE OR REPLACE FUNCTION search_resolution_questions(search_query TEXT)
RETURNS SETOF resolution_questions AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM resolution_questions
    WHERE search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY ts_rank(search_vector, plainto_tsquery('english', search_query)) DESC;
END;
$$ LANGUAGE plpgsql;

-- Get resolver leaderboard
CREATE OR REPLACE FUNCTION get_resolver_leaderboard(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    resolver_id UUID,
    resolver_name TEXT,
    resolver_address TEXT,
    reputation_score INTEGER,
    resolved_count INTEGER,
    accuracy NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.address,
        r.reputation_score,
        r.resolved_count,
        CASE 
            WHEN r.resolved_count + r.disputed_count = 0 THEN 100
            ELSE (r.resolved_count::NUMERIC / (r.resolved_count + r.disputed_count) * 100)
        END as accuracy
    FROM resolvers r
    WHERE r.is_active = TRUE
    ORDER BY r.reputation_score DESC, accuracy DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────────
-- Seed data (optional)
-- ───────────────────────────────────────────────────────────────────────────────

-- Example categories (uncomment to seed)
-- INSERT INTO resolution_categories (name, description, icon) VALUES
-- ('খেলাধুলা', 'Sports and athletics events', '🏆'),
-- ('রাজনীতি', 'Political elections and governance', '🏛️'),
-- ('সামাজিক', 'Social media and internet trends', '📱'),
-- ('সিনেমা', 'Movies and entertainment', '🎬'),
-- ('ফাইনানস', 'Financial markets and crypto', '💰'),
-- ('বিশ্ব', 'International events', '🌍');
