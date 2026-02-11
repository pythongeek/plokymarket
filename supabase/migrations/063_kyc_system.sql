-- ============================================
-- KYC SYSTEM ENHANCEMENT
-- Threshold-based gating + admin overrides
-- ============================================

-- Platform-wide KYC settings
CREATE TABLE IF NOT EXISTS kyc_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton row
    
    -- Withdrawal threshold (cumulative total before KYC required)
    withdrawal_threshold DECIMAL(20, 2) NOT NULL DEFAULT 5000.00,
    
    -- Required document types
    required_documents JSONB NOT NULL DEFAULT '["id_front", "selfie"]'::jsonb,
    
    -- Auto-approve for low-risk users
    auto_approve_enabled BOOLEAN DEFAULT FALSE,
    auto_approve_max_risk_score INTEGER DEFAULT 30,
    
    -- KYC enforcement
    kyc_globally_required BOOLEAN DEFAULT FALSE, -- if true, everyone must KYC regardless of threshold
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO kyc_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Admin overrides per user (force or waive KYC)
CREATE TABLE IF NOT EXISTS kyc_admin_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Override type: 'force_kyc' or 'waive_kyc'
    override_type VARCHAR(20) NOT NULL CHECK (override_type IN ('force_kyc', 'waive_kyc')),
    
    -- Admin who made the override
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    
    -- Whether this override is currently active
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Expiry (optional - for temporary waivers)
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES auth.users(id)
);

-- KYC document submissions tracking  
CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Submission data snapshot
    submitted_data JSONB NOT NULL,
    
    -- Status of this specific submission
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Review details
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_overrides_user ON kyc_admin_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_overrides_active ON kyc_admin_overrides(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);

-- RLS
ALTER TABLE kyc_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_admin_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Settings: admins can read/write
CREATE POLICY "Admins can manage KYC settings"
    ON kyc_settings FOR ALL
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

-- Overrides: admins can manage
CREATE POLICY "Admins can manage KYC overrides"
    ON kyc_admin_overrides FOR ALL
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

-- Submissions: users can view own, admins can view all
CREATE POLICY "Users can view own KYC submissions"
    ON kyc_submissions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own KYC submissions"
    ON kyc_submissions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all KYC submissions"
    ON kyc_submissions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

-- Also allow users to INSERT into user_kyc_profiles for their own record
CREATE POLICY "Users can upsert own KYC profile"
    ON user_kyc_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own KYC profile"
    ON user_kyc_profiles FOR UPDATE
    USING (id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Check if a user needs KYC for withdrawal
-- Returns: { needs_kyc, reason, total_withdrawn, threshold, kyc_status, override_type }
CREATE OR REPLACE FUNCTION check_kyc_withdrawal_gate(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_withdrawn DECIMAL(20, 2) := 0;
    v_threshold DECIMAL(20, 2);
    v_kyc_status VARCHAR(50);
    v_override RECORD;
    v_globally_required BOOLEAN;
    v_result JSONB;
BEGIN
    -- Get platform settings
    SELECT withdrawal_threshold, kyc_globally_required 
    INTO v_threshold, v_globally_required
    FROM kyc_settings WHERE id = 1;
    
    -- Get user's KYC status
    SELECT verification_status INTO v_kyc_status
    FROM user_kyc_profiles WHERE id = p_user_id;
    
    v_kyc_status := COALESCE(v_kyc_status, 'unverified');
    
    -- Check for admin overrides (most recent active)
    SELECT * INTO v_override
    FROM kyc_admin_overrides
    WHERE user_id = p_user_id 
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If KYC is already verified, allow
    IF v_kyc_status = 'verified' THEN
        RETURN jsonb_build_object(
            'needs_kyc', FALSE,
            'reason', 'verified',
            'kyc_status', v_kyc_status,
            'total_withdrawn', v_total_withdrawn,
            'threshold', v_threshold
        );
    END IF;
    
    -- If admin waived KYC, allow
    IF v_override IS NOT NULL AND v_override.override_type = 'waive_kyc' THEN
        RETURN jsonb_build_object(
            'needs_kyc', FALSE,
            'reason', 'admin_waived',
            'kyc_status', v_kyc_status,
            'override_type', 'waive_kyc',
            'total_withdrawn', v_total_withdrawn,
            'threshold', v_threshold
        );
    END IF;
    
    -- If admin forced KYC, require it
    IF v_override IS NOT NULL AND v_override.override_type = 'force_kyc' THEN
        RETURN jsonb_build_object(
            'needs_kyc', TRUE,
            'reason', 'admin_forced',
            'kyc_status', v_kyc_status,
            'override_type', 'force_kyc',
            'total_withdrawn', v_total_withdrawn,
            'threshold', v_threshold
        );
    END IF;
    
    -- If globally required
    IF v_globally_required THEN
        RETURN jsonb_build_object(
            'needs_kyc', TRUE,
            'reason', 'globally_required',
            'kyc_status', v_kyc_status,
            'total_withdrawn', v_total_withdrawn,
            'threshold', v_threshold
        );
    END IF;
    
    -- Calculate total withdrawals
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO v_total_withdrawn
    FROM wallet_transactions
    WHERE user_id = p_user_id 
      AND transaction_type = 'withdrawal'
      AND status = 'completed';
    
    -- Check against threshold
    IF v_total_withdrawn >= v_threshold THEN
        RETURN jsonb_build_object(
            'needs_kyc', TRUE,
            'reason', 'threshold_exceeded',
            'kyc_status', v_kyc_status,
            'total_withdrawn', v_total_withdrawn,
            'threshold', v_threshold,
            'remaining', 0
        );
    END IF;
    
    -- Under threshold, no KYC needed
    RETURN jsonb_build_object(
        'needs_kyc', FALSE,
        'reason', 'under_threshold',
        'kyc_status', v_kyc_status,
        'total_withdrawn', v_total_withdrawn,
        'threshold', v_threshold,
        'remaining', v_threshold - v_total_withdrawn
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin KYC action: approve, reject, force, waive
CREATE OR REPLACE FUNCTION admin_kyc_action(
    p_admin_id UUID,
    p_user_id UUID,
    p_action VARCHAR(20), -- 'approve', 'reject', 'force_kyc', 'waive_kyc', 'revoke_override'
    p_reason TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    CASE p_action
        WHEN 'approve' THEN
            -- Update KYC profile
            UPDATE user_kyc_profiles SET
                verification_status = 'verified',
                verification_tier = 'intermediate',
                verified_at = NOW(),
                verified_by = p_admin_id,
                daily_withdrawal_limit = 50000,
                updated_at = NOW()
            WHERE id = p_user_id;
            
            -- Update submission
            UPDATE kyc_submissions SET
                status = 'approved',
                reviewed_by = p_admin_id,
                reviewed_at = NOW(),
                review_notes = p_reason
            WHERE user_id = p_user_id AND status = 'pending'
            ORDER BY created_at DESC LIMIT 1;
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'approved');
            
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
            WHERE user_id = p_user_id AND status = 'pending'
            ORDER BY created_at DESC LIMIT 1;
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'rejected');
            
        WHEN 'force_kyc' THEN
            -- Deactivate any existing overrides
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
            -- Create force override
            INSERT INTO kyc_admin_overrides (user_id, override_type, admin_id, reason)
            VALUES (p_user_id, 'force_kyc', p_admin_id, COALESCE(p_reason, 'Admin forced KYC requirement'));
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'force_kyc');
            
        WHEN 'waive_kyc' THEN
            -- Deactivate any existing overrides
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
            -- Create waive override
            INSERT INTO kyc_admin_overrides (user_id, override_type, admin_id, reason)
            VALUES (p_user_id, 'waive_kyc', p_admin_id, COALESCE(p_reason, 'Admin waived KYC requirement'));
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'waive_kyc');
            
        WHEN 'revoke_override' THEN
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'revoke_override');
            
        ELSE
            RAISE EXCEPTION 'Invalid KYC action: %', p_action;
    END CASE;
    
    -- Log admin action
    PERFORM log_admin_action(
        p_admin_id,
        'kyc_' || p_action,
        'kyc',
        p_user_id,
        NULL,
        v_result,
        COALESCE(p_reason, p_rejection_reason, p_action)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
