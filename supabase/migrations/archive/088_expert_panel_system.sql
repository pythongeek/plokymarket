-- Migration 088: Expert Panel System with Weighted Reputation
-- Complete expert panel management with reputation calculation

-- 1. Expert Panel Table
CREATE TABLE IF NOT EXISTS expert_panel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Expert Profile
    expert_name VARCHAR(100) NOT NULL,
    credentials TEXT,
    specializations VARCHAR(50)[] NOT NULL DEFAULT '{}',
    bio TEXT,
    avatar_url TEXT,
    
    -- Verification Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents TEXT[],
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    -- Performance Metrics
    total_votes INTEGER DEFAULT 0,
    correct_votes INTEGER DEFAULT 0,
    incorrect_votes INTEGER DEFAULT 0,
    
    -- Reputation Score (Calculated)
    reputation_score NUMERIC(10, 4) DEFAULT 0.0,
    accuracy_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_votes > 0 THEN (correct_votes::NUMERIC / total_votes * 100)
            ELSE 0
        END
    ) STORED,
    
    -- Rating & Ranking
    expert_rating NUMERIC(3, 2) DEFAULT 0.00 CHECK (expert_rating BETWEEN 0 AND 5),
    rank_tier VARCHAR(20) DEFAULT 'bronze' CHECK (rank_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    
    -- Availability
    is_active BOOLEAN DEFAULT TRUE,
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (
        availability_status IN ('available', 'busy', 'unavailable', 'on_leave')
    ),
    
    -- Contact
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_vote_at TIMESTAMPTZ,
    
    CONSTRAINT unique_expert_user UNIQUE (user_id)
);

-- 2. Expert Votes Table
CREATE TABLE IF NOT EXISTS expert_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID NOT NULL REFERENCES expert_panel(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Vote Details
    vote_outcome INTEGER NOT NULL CHECK (vote_outcome IN (1, 2)), -- 1=YES, 2=NO
    confidence_level NUMERIC(5, 2) CHECK (confidence_level BETWEEN 0 AND 100),
    reasoning TEXT NOT NULL,
    
    -- AI Verification
    ai_relevance_score NUMERIC(3, 2), -- 1-10 score from AI verification
    ai_verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
        ai_verification_status IN ('pending', 'verified', 'rejected', 'flagged')
    ),
    ai_feedback TEXT,
    
    -- Result Tracking
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    
    CONSTRAINT unique_expert_event_vote UNIQUE (expert_id, event_id)
);

-- 3. Expert Assignments Table (for specific events)
CREATE TABLE IF NOT EXISTS expert_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID NOT NULL REFERENCES expert_panel(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Assignment Details
    assigned_by UUID REFERENCES auth.users(id),
    assignment_reason TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'declined', 'completed', 'expired')
    ),
    
    -- Timestamps
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT unique_expert_event_assignment UNIQUE (expert_id, event_id)
);

-- 4. Calculate Reputation Score Function
CREATE OR REPLACE FUNCTION calculate_reputation_score(
    p_correct_votes INTEGER,
    p_total_votes INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_accuracy NUMERIC;
    v_log_factor NUMERIC;
    v_reputation NUMERIC;
BEGIN
    -- Handle edge case
    IF p_total_votes = 0 THEN
        RETURN 0.0;
    END IF;
    
    -- Calculate accuracy
    v_accuracy := p_correct_votes::NUMERIC / p_total_votes;
    
    -- Calculate log factor: log(total_votes + 1)
    v_log_factor := LN(p_total_votes + 1);
    
    -- Reputation = Accuracy * Log(Total Votes + 1)
    v_reputation := v_accuracy * v_log_factor;
    
    RETURN ROUND(v_reputation, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Update Expert Rank Tier Function
CREATE OR REPLACE FUNCTION update_expert_rank_tier(
    p_reputation_score NUMERIC
)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE
        WHEN p_reputation_score >= 4.0 THEN 'diamond'
        WHEN p_reputation_score >= 3.0 THEN 'platinum'
        WHEN p_reputation_score >= 2.0 THEN 'gold'
        WHEN p_reputation_score >= 1.0 THEN 'silver'
        ELSE 'bronze'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Update Expert Stats After Vote Function
CREATE OR REPLACE FUNCTION update_expert_after_vote()
RETURNS TRIGGER AS $$
DECLARE
    v_correct_count INTEGER;
    v_total_count INTEGER;
    v_new_reputation NUMERIC;
    v_new_rank VARCHAR;
BEGIN
    -- Count correct and total votes for this expert
    SELECT 
        COUNT(*) FILTER (WHERE is_correct = TRUE),
        COUNT(*)
    INTO v_correct_count, v_total_count
    FROM expert_votes
    WHERE expert_id = NEW.expert_id;
    
    -- Calculate new reputation
    v_new_reputation := calculate_reputation_score(v_correct_count, v_total_count);
    
    -- Determine new rank
    v_new_rank := update_expert_rank_tier(v_new_reputation);
    
    -- Update expert panel record
    UPDATE expert_panel
    SET 
        total_votes = v_total_count,
        correct_votes = v_correct_count,
        incorrect_votes = v_total_count - v_correct_count,
        reputation_score = v_new_reputation,
        rank_tier = v_new_rank,
        updated_at = NOW()
    WHERE id = NEW.expert_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote updates
DROP TRIGGER IF EXISTS trigger_update_expert_stats ON expert_votes;
CREATE TRIGGER trigger_update_expert_stats
    AFTER INSERT OR UPDATE ON expert_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_after_vote();

-- 7. Get Weighted Expert Consensus Function
CREATE OR REPLACE FUNCTION get_weighted_expert_consensus(
    p_event_id UUID
)
RETURNS TABLE (
    outcome INTEGER,
    total_weight NUMERIC,
    vote_count INTEGER,
    avg_confidence NUMERIC,
    consensus_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH weighted_votes AS (
        SELECT 
            ev.vote_outcome,
            ep.reputation_score * (ev.confidence_level / 100.0) as vote_weight,
            ev.confidence_level
        FROM expert_votes ev
        JOIN expert_panel ep ON ev.expert_id = ep.id
        WHERE ev.event_id = p_event_id
        AND ep.is_verified = TRUE
        AND ep.is_active = TRUE
    )
    SELECT 
        wv.vote_outcome,
        SUM(wv.vote_weight) as total_weight,
        COUNT(*)::INTEGER as vote_count,
        AVG(wv.confidence_level) as avg_confidence,
        ROUND(
            SUM(wv.vote_weight) * 100.0 / NULLIF(SUM(SUM(wv.vote_weight)) OVER (), 0),
            2
        ) as consensus_percentage
    FROM weighted_votes wv
    GROUP BY wv.vote_outcome
    ORDER BY total_weight DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Cache Top Experts to Redis (via HTTP request)
CREATE OR REPLACE FUNCTION cache_top_experts()
RETURNS TRIGGER AS $$
DECLARE
    v_top_experts JSONB;
    v_redis_url TEXT;
    v_redis_token TEXT;
BEGIN
    -- Get top 10 experts
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'expert_name', expert_name,
            'reputation_score', reputation_score,
            'accuracy_rate', accuracy_rate,
            'rank_tier', rank_tier,
            'specializations', specializations
        )
    )
    INTO v_top_experts
    FROM (
        SELECT id, expert_name, reputation_score, accuracy_rate, rank_tier, specializations
        FROM expert_panel
        WHERE is_active = TRUE AND is_verified = TRUE
        ORDER BY reputation_score DESC
        LIMIT 10
    ) sub;
    
    -- Note: Actual Redis cache update happens via Edge Function or n8n
    -- This trigger just logs the change
    INSERT INTO admin_activity_logs (
        action_type,
        resource_type,
        change_summary,
        new_values
    )
    VALUES (
        'update_oracle',
        'expert_panel',
        'Top experts ranking updated',
        jsonb_build_object('top_experts', v_top_experts)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for caching
DROP TRIGGER IF EXISTS trigger_cache_top_experts ON expert_panel;
CREATE TRIGGER trigger_cache_top_experts
    AFTER UPDATE OF reputation_score ON expert_panel
    FOR EACH ROW
    WHEN (OLD.reputation_score IS DISTINCT FROM NEW.reputation_score)
    EXECUTE FUNCTION cache_top_experts();

-- 9. Process Expert Vote with AI Verification
CREATE OR REPLACE FUNCTION process_expert_vote(
    p_expert_id UUID,
    p_event_id UUID,
    p_vote_outcome INTEGER,
    p_confidence_level NUMERIC,
    p_reasoning TEXT
)
RETURNS UUID AS $$
DECLARE
    v_vote_id UUID;
BEGIN
    -- Insert the vote
    INSERT INTO expert_votes (
        expert_id,
        event_id,
        vote_outcome,
        confidence_level,
        reasoning,
        ai_verification_status
    )
    VALUES (
        p_expert_id,
        p_event_id,
        p_vote_outcome,
        p_confidence_level,
        p_reasoning,
        'pending' -- Will be verified by AI
    )
    RETURNING id INTO v_vote_id;
    
    -- Update expert's last vote timestamp
    UPDATE expert_panel
    SET last_vote_at = NOW()
    WHERE id = p_expert_id;
    
    RETURN v_vote_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Verify Expert Vote (called by AI/n8n)
CREATE OR REPLACE FUNCTION verify_expert_vote(
    p_vote_id UUID,
    p_ai_relevance_score NUMERIC,
    p_ai_feedback TEXT,
    p_final_outcome INTEGER -- The actual outcome of the event
)
RETURNS VOID AS $$
DECLARE
    v_vote_record RECORD;
    v_is_correct BOOLEAN;
    v_points INTEGER;
BEGIN
    -- Get the vote record
    SELECT * INTO v_vote_record
    FROM expert_votes
    WHERE id = p_vote_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vote not found: %', p_vote_id;
    END IF;
    
    -- Determine if vote was correct
    v_is_correct := (v_vote_record.vote_outcome = p_final_outcome);
    
    -- Calculate points based on AI relevance and correctness
    v_points := CASE
        WHEN v_is_correct AND p_ai_relevance_score >= 7 THEN 10
        WHEN v_is_correct AND p_ai_relevance_score >= 5 THEN 5
        WHEN v_is_correct THEN 2
        WHEN p_ai_relevance_score >= 7 THEN -2
        ELSE -5
    END;
    
    -- Update the vote record
    UPDATE expert_votes
    SET 
        ai_relevance_score = p_ai_relevance_score,
        ai_feedback = p_ai_feedback,
        ai_verification_status = CASE 
            WHEN p_ai_relevance_score >= 5 THEN 'verified'
            ELSE 'flagged'
        END,
        is_correct = v_is_correct,
        points_earned = v_points,
        verified_at = NOW()
    WHERE id = p_vote_id;
    
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expert_panel_user ON expert_panel(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_panel_reputation ON expert_panel(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_expert_panel_active ON expert_panel(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_expert_panel_specializations ON expert_panel USING gin(specializations);
CREATE INDEX IF NOT EXISTS idx_expert_votes_expert ON expert_votes(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_votes_event ON expert_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_expert_votes_status ON expert_votes(ai_verification_status);
CREATE INDEX IF NOT EXISTS idx_expert_assignments_expert ON expert_assignments(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignments_event ON expert_assignments(event_id);

-- Enable RLS
ALTER TABLE expert_panel ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Experts are viewable by everyone"
    ON expert_panel FOR SELECT
    USING (is_verified = TRUE AND is_active = TRUE);

CREATE POLICY "Experts can update own profile"
    ON expert_panel FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Admin can manage experts"
    ON expert_panel FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Votes viewable by assigned experts and admin"
    ON expert_votes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM expert_panel ep
            WHERE ep.id = expert_votes.expert_id AND ep.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Experts can create own votes"
    ON expert_votes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM expert_panel ep
            WHERE ep.id = expert_votes.expert_id AND ep.user_id = auth.uid()
        )
    );

-- Comments
COMMENT ON TABLE expert_panel IS 'Expert panel members with reputation tracking';
COMMENT ON TABLE expert_votes IS 'Individual votes cast by experts with AI verification';
COMMENT ON TABLE expert_assignments IS 'Expert assignments to specific events';
COMMENT ON FUNCTION calculate_reputation_score IS 'Calculates weighted reputation: accuracy * log(total_votes + 1)';
COMMENT ON FUNCTION get_weighted_expert_consensus IS 'Returns weighted consensus for an event based on expert reputation';
