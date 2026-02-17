-- ============================================
-- 067_fix_kyc_profiles_rls.sql
-- SAFE RE-RUNNABLE SCRIPT
-- ============================================

-- 1. Ensure user_kyc_profiles exists (it should, but just in case)
CREATE TABLE IF NOT EXISTS user_kyc_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    verification_tier VARCHAR(20) NOT NULL DEFAULT 'basic',
    full_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(100),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    id_expiry DATE,
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    phone_number VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    id_document_front_url TEXT,
    id_document_back_url TEXT,
    selfie_url TEXT,
    proof_of_address_url TEXT,
    risk_score INTEGER DEFAULT 50,
    risk_factors JSONB DEFAULT '[]'::jsonb,
    daily_deposit_limit DECIMAL(20, 8) DEFAULT 1000,
    daily_withdrawal_limit DECIMAL(20, 8) DEFAULT 1000,
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_kyc_profiles ENABLE ROW LEVEL SECURITY;

-- 2. FIX RLS POLICIES FOR USER_KYC_PROFILES
-- Allow users to INSERT (Upsert) their own profile
DROP POLICY IF EXISTS "Users can upsert own KYC profile" ON user_kyc_profiles;
CREATE POLICY "Users can upsert own KYC profile"
    ON user_kyc_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Allow users to UPDATE their own profile
DROP POLICY IF EXISTS "Users can update own KYC profile" ON user_kyc_profiles;
CREATE POLICY "Users can update own KYC profile"
    ON user_kyc_profiles FOR UPDATE
    USING (id = auth.uid());

-- Ensure SELECT policy exists
DROP POLICY IF EXISTS "Users can view own KYC profile" ON user_kyc_profiles;
CREATE POLICY "Users can view own KYC profile"
    ON user_kyc_profiles FOR SELECT
    USING (id = auth.uid());

-- Ensure Admin policies exist
DROP POLICY IF EXISTS "Admins can view all KYC profiles" ON user_kyc_profiles;
CREATE POLICY "Admins can view all KYC profiles"
    ON user_kyc_profiles FOR SELECT
    USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can modify KYC profiles" ON user_kyc_profiles;
CREATE POLICY "Admins can modify KYC profiles"
    ON user_kyc_profiles FOR ALL
    USING (is_admin(auth.uid()));


-- 3. ENSURE MISSING RPC FUNCTIONS EXIST (From 063)

-- Check Withdrawal Gate
CREATE OR REPLACE FUNCTION check_kyc_withdrawal_gate(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_withdrawn DECIMAL(20, 2) := 0;
    v_threshold DECIMAL(20, 2);
    v_kyc_status VARCHAR(50);
    v_override RECORD;
    v_globally_required BOOLEAN;
BEGIN
    SELECT withdrawal_threshold, kyc_globally_required 
    INTO v_threshold, v_globally_required
    FROM kyc_settings WHERE id = 1;
    
    SELECT verification_status INTO v_kyc_status
    FROM user_kyc_profiles WHERE id = p_user_id;
    
    v_kyc_status := COALESCE(v_kyc_status, 'unverified');
    
    -- Check overrides
    SELECT * INTO v_override
    FROM kyc_admin_overrides
    WHERE user_id = p_user_id AND is_active = TRUE
    ORDER BY created_at DESC LIMIT 1;
    
    IF v_kyc_status = 'verified' THEN
        RETURN jsonb_build_object('needs_kyc', FALSE, 'reason', 'verified');
    END IF;
    
    IF v_override IS NOT NULL AND v_override.override_type = 'waive_kyc' THEN
        RETURN jsonb_build_object('needs_kyc', FALSE, 'reason', 'admin_waived');
    END IF;
    
    IF v_override IS NOT NULL AND v_override.override_type = 'force_kyc' THEN
        RETURN jsonb_build_object('needs_kyc', TRUE, 'reason', 'admin_forced');
    END IF;
    
    IF v_globally_required THEN
        RETURN jsonb_build_object('needs_kyc', TRUE, 'reason', 'globally_required');
    END IF;
    
    -- Calculate withdrawals
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total_withdrawn
    FROM wallet_transactions
    WHERE user_id = p_user_id AND transaction_type = 'withdrawal' AND status = 'completed';
    
    IF v_total_withdrawn >= v_threshold THEN
        RETURN jsonb_build_object('needs_kyc', TRUE, 'reason', 'threshold_exceeded');
    END IF;
    
    RETURN jsonb_build_object('needs_kyc', FALSE, 'reason', 'under_threshold');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Admin KYC Action
CREATE OR REPLACE FUNCTION admin_kyc_action(
    p_admin_id UUID,
    p_user_id UUID,
    p_action VARCHAR(20),
    p_reason TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Check admin permission
    IF NOT is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    CASE p_action
        WHEN 'approve' THEN
            UPDATE user_kyc_profiles SET
                verification_status = 'verified',
                verified_at = NOW(),
                verified_by = p_admin_id,
                updated_at = NOW()
            WHERE id = p_user_id;
            
            UPDATE kyc_submissions SET
                status = 'approved',
                reviewed_by = p_admin_id,
                reviewed_at = NOW(),
                review_notes = p_reason
            WHERE user_id = p_user_id AND status = 'pending';
            
            v_result := jsonb_build_object('success', TRUE);
            
        WHEN 'reject' THEN
            UPDATE user_kyc_profiles SET
                verification_status = 'rejected',
                rejection_reason = p_rejection_reason,
                updated_at = NOW()
            WHERE id = p_user_id;
            
            UPDATE kyc_submissions SET
                status = 'rejected',
                reviewed_by = p_admin_id,
                reviewed_at = NOW(),
                rejection_reason = p_rejection_reason,
                review_notes = p_reason
            WHERE user_id = p_user_id AND status = 'pending';
            
            v_result := jsonb_build_object('success', TRUE);

        WHEN 'force_kyc' THEN
             INSERT INTO kyc_admin_overrides (user_id, override_type, admin_id, reason)
             VALUES (p_user_id, 'force_kyc', p_admin_id, COALESCE(p_reason, 'Forced'));
             v_result := jsonb_build_object('success', TRUE);

        WHEN 'waive_kyc' THEN
             INSERT INTO kyc_admin_overrides (user_id, override_type, admin_id, reason)
             VALUES (p_user_id, 'waive_kyc', p_admin_id, COALESCE(p_reason, 'Waived'));
             v_result := jsonb_build_object('success', TRUE);
    END CASE;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
