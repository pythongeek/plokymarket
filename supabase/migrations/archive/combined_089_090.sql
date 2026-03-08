-- Combined Migration: Trust Score, Dispute System & Workflow Functions
-- Copy this entire content and paste into Supabase SQL Editor

-- =====================================================
-- PART 1: Trust Score & Dispute System (from 089)
-- =====================================================

-- 1. AI Resolution Trust Scores Table
CREATE TABLE IF NOT EXISTS ai_trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    ai_outcome INTEGER,
    ai_confidence NUMERIC(5, 2),
    ai_reasoning TEXT,
    ai_sources TEXT[],
    ai_model_version VARCHAR(50),
    trust_score NUMERIC(5, 2) DEFAULT 0.0,
    evidence_quality_score NUMERIC(5, 2),
    consistency_score NUMERIC(5, 2),
    timeliness_score NUMERIC(5, 2),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (
        verification_status IN ('pending', 'verified', 'disputed', 'overridden')
    ),
    overridden_by UUID REFERENCES auth.users(id),
    override_reason TEXT,
    overridden_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_market_trust UNIQUE (market_id)
);

-- 2. Dispute Records Table
CREATE TABLE IF NOT EXISTS dispute_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    disputed_by UUID NOT NULL REFERENCES auth.users(id),
    dispute_type VARCHAR(50) CHECK (
        dispute_type IN ('wrong_outcome', 'insufficient_evidence', 'ai_error', 'premature_resolution', 'other')
    ),
    dispute_reason TEXT NOT NULL,
    evidence_provided TEXT[],
    bond_amount NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    bond_paid BOOLEAN DEFAULT FALSE,
    bond_transaction_id UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'under_review', 'accepted', 'rejected', 'escalated', 'withdrawn')
    ),
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    resolution VARCHAR(20) CHECK (
        resolution IN ('upheld', 'dismissed', 'partial', 'escalated')
    ),
    bond_returned BOOLEAN DEFAULT FALSE,
    bond_forfeited BOOLEAN DEFAULT FALSE,
    bond_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    CONSTRAINT positive_bond CHECK (bond_amount > 0)
);

-- 3. Manual Review Queue Table
CREATE TABLE IF NOT EXISTS manual_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    review_type VARCHAR(20) NOT NULL CHECK (
        review_type IN ('low_confidence', 'disputed', 'flagged', 'admin_request')
    ),
    ai_trust_score_id UUID REFERENCES ai_trust_scores(id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (
        priority IN ('low', 'medium', 'high', 'urgent')
    ),
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_review', 'approved', 'rejected', 'escalated')
    ),
    assigned_to UUID REFERENCES auth.users(id),
    admin_decision INTEGER,
    admin_reasoning TEXT,
    admin_confidence NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT unique_market_review UNIQUE (market_id, status)
);

-- 4. Dispute Votes Table
CREATE TABLE IF NOT EXISTS dispute_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES dispute_records(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id),
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('YES', 'NO', 'ABSTAIN')),
    reasoning TEXT,
    weight NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voter_dispute UNIQUE (dispute_id, voter_id)
);

-- =====================================================
-- PART 2: Functions (from 090)
-- =====================================================

-- Calculate Trust Score
CREATE OR REPLACE FUNCTION calculate_trust_score(
    p_confidence NUMERIC,
    p_evidence_count INTEGER,
    p_source_quality NUMERIC,
    p_consistency NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    v_confidence_weight NUMERIC := 0.4;
    v_evidence_weight NUMERIC := 0.2;
    v_quality_weight NUMERIC := 0.25;
    v_consistency_weight NUMERIC := 0.15;
    v_trust_score NUMERIC;
BEGIN
    v_trust_score := (
        (p_confidence * v_confidence_weight) +
        (LEAST(p_evidence_count, 10) * 10 * v_evidence_weight) +
        (p_source_quality * v_quality_weight) +
        (p_consistency * v_consistency_weight)
    );
    RETURN ROUND(LEAST(v_trust_score, 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Lock Dispute Bond
CREATE OR REPLACE FUNCTION lock_dispute_bond(
    p_user_id UUID,
    p_amount NUMERIC,
    p_dispute_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet RECORD;
    v_available_balance NUMERIC;
BEGIN
    SELECT * INTO v_wallet
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found for user: %', p_user_id;
    END IF;
    
    v_available_balance := v_wallet.balance - v_wallet.locked_balance;
    
    IF v_available_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %', 
            v_available_balance, p_amount;
    END IF;
    
    UPDATE wallets
    SET locked_balance = locked_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    INSERT INTO transactions (
        user_id, transaction_type, amount, description, metadata, status
    )
    VALUES (
        p_user_id, 'dispute_bond', -p_amount, 'Dispute bond locked',
        jsonb_build_object('dispute_id', p_dispute_id, 'amount', p_amount, 'type', 'bond_lock'),
        'completed'
    );
    
    RETURN TRUE;
END;
$$;

-- Return Dispute Bond
CREATE OR REPLACE FUNCTION return_dispute_bond(
    p_user_id UUID,
    p_amount NUMERIC,
    p_dispute_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE wallets
    SET locked_balance = GREATEST(0, locked_balance - p_amount),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    INSERT INTO transactions (
        user_id, transaction_type, amount, description, metadata, status
    )
    VALUES (
        p_user_id, 'dispute_bond_return', p_amount, 'Dispute bond returned - dispute upheld',
        jsonb_build_object('dispute_id', p_dispute_id, 'amount', p_amount, 'type', 'bond_return'),
        'completed'
    );
    
    RETURN TRUE;
END;
$$;

-- Forfeit Dispute Bond
CREATE OR REPLACE FUNCTION forfeit_dispute_bond(
    p_dispute_id UUID,
    p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dispute RECORD;
    v_platform_wallet UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    SELECT * INTO v_dispute
    FROM dispute_records
    WHERE id = p_dispute_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Dispute not found: %', p_dispute_id;
    END IF;
    
    UPDATE wallets
    SET balance = balance - p_amount,
        locked_balance = GREATEST(0, locked_balance - p_amount),
        updated_at = NOW()
    WHERE user_id = v_dispute.disputed_by;
    
    UPDATE wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = v_platform_wallet;
    
    INSERT INTO transactions (
        user_id, transaction_type, amount, description, metadata, status
    )
    VALUES (
        v_dispute.disputed_by, 'dispute_bond_forfeit', -p_amount, 'Dispute bond forfeited - dispute dismissed',
        jsonb_build_object('dispute_id', p_dispute_id, 'amount', p_amount, 'type', 'bond_forfeit', 'to_platform', true),
        'completed'
    );
    
    RETURN TRUE;
END;
$$;

-- Handle New Dispute Trigger
CREATE OR REPLACE FUNCTION handle_new_dispute()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM lock_dispute_bond(NEW.disputed_by, NEW.bond_amount, NEW.id);
    
    INSERT INTO admin_activity_logs (
        admin_id, action_type, resource_type, resource_id, change_summary, new_values
    )
    VALUES (
        NEW.disputed_by, 'create_event', 'dispute', NEW.id,
        'New dispute filed with bond: ' || NEW.bond_amount,
        jsonb_build_object('market_id', NEW.market_id, 'bond_amount', NEW.bond_amount, 'dispute_type', NEW.dispute_type)
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to lock dispute bond: %', SQLERRM;
END;
$$;

DROP TRIGGER IF EXISTS on_dispute_created ON dispute_records;
CREATE TRIGGER on_dispute_created
    AFTER INSERT ON dispute_records
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_dispute();

-- =====================================================
-- PART 3: Indexes & RLS
-- =====================================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_trust_market ON ai_trust_scores(market_id);
CREATE INDEX IF NOT EXISTS idx_ai_trust_score ON ai_trust_scores(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_dispute_market ON dispute_records(market_id);
CREATE INDEX IF NOT EXISTS idx_dispute_status ON dispute_records(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON manual_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_priority ON manual_review_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_dispute_votes_dispute ON dispute_votes(dispute_id);

-- Enable RLS
ALTER TABLE ai_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Trust scores viewable by all" ON ai_trust_scores FOR SELECT USING (true);
CREATE POLICY "Admin can manage trust scores" ON ai_trust_scores FOR ALL 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users can view own disputes" ON dispute_records FOR SELECT USING (disputed_by = auth.uid());
CREATE POLICY "Admin can manage disputes" ON dispute_records FOR ALL 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Review queue viewable by admin" ON manual_review_queue FOR SELECT 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admin can manage review queue" ON manual_review_queue FOR ALL 
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users can view votes on disputes" ON dispute_votes FOR SELECT USING (true);
CREATE POLICY "Users can create their own vote" ON dispute_votes FOR INSERT 
    WITH CHECK (voter_id = auth.uid());

-- Success message
SELECT 'Migration completed successfully!' as status;
