-- Migration 072: Risk Management & KYC Advanced Workflow

-- 1. Initialize Risk Controls in admin_settings

-- Fix: Ensure admin_settings exists (from 070)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO admin_settings (key, value)
VALUES (
  'risk_controls',
  '{
    "trading_halted": false,
    "withdrawals_halted": false,
    "emergency_message": "Platform maintenance in progress. Trading is temporarily halted."
  }'
)
ON CONFLICT (key) DO NOTHING;

-- 2. Update Trading Eligibility Function to include Emergency Halt
CREATE OR REPLACE FUNCTION check_trading_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    v_user_status user_account_status;
    v_kyc_level INTEGER;
    v_trading_halted BOOLEAN;
BEGIN
    -- Check Global Trading Halt
    SELECT (value->>'trading_halted')::boolean INTO v_trading_halted
    FROM public.admin_settings
    WHERE key = 'risk_controls';

    IF v_trading_halted = TRUE THEN
        RAISE EXCEPTION 'মার্কেট বর্তমানে রক্ষণাবেক্ষণের জন্য বন্ধ আছে। সাময়িক অসুবিধার জন্য আমরা দুঃখিত। (Trading is temporarily halted by admin)';
    END IF;

    -- Get user status and KYC level
    SELECT status, kyc_level INTO v_user_status, v_kyc_level
    FROM public.user_profiles
    WHERE id = NEW.user_id;

    -- Check 1: Is user banned or restricted?
    IF v_user_status != 'active' THEN
        RAISE EXCEPTION 'আপনার অ্যাকাউন্টটি বর্তমানে লেনদেনের জন্য সচল নয়। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন। (Account status: %)', v_user_status;
    END IF;

    -- Check 2: KYC Level check for high-value trades (e.g., > 500 BDT)
    IF TG_TABLE_NAME = 'order_book' THEN
        IF v_kyc_level < 1 AND (NEW.size * NEW.price) > 500 THEN
            RAISE EXCEPTION '৫০০ টাকার বেশি ট্রেড করতে হলে KYC লেভেল ১ সম্পন্ন করুন। বর্তমান লেভেল: %', v_kyc_level;
        END IF;
    END IF;

    -- Check 3: Deposit check (if manual_deposits)
    IF TG_TABLE_NAME = 'manual_deposits' THEN
        IF v_kyc_level < 1 THEN
            RAISE EXCEPTION 'ডিপোজিট করতে হলে নূন্যতম KYC লেভেল ১ সম্পন্ন করুন।';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Redefine admin_kyc_action to sync with user_profiles.kyc_level
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
    v_prev_status VARCHAR;
BEGIN
    -- Get current status for logging
    SELECT verification_status INTO v_prev_status
    FROM user_kyc_profiles WHERE id = p_user_id;

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
            
            -- Sync kyc_level
            UPDATE user_profiles SET kyc_level = 1 WHERE id = p_user_id;

            -- Update submission (Fix: Use subquery for ORDER BY LIMIT)
            UPDATE kyc_submissions
            SET
                status = 'approved',
                reviewed_by = p_admin_id,
                reviewed_at = NOW(),
                review_notes = p_reason
            WHERE id = (
                SELECT id FROM kyc_submissions 
                WHERE user_id = p_user_id AND status = 'pending' 
                ORDER BY created_at DESC LIMIT 1
            );
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'approved');
            
        WHEN 'reject' THEN
            UPDATE user_kyc_profiles SET
                verification_status = 'rejected',
                rejection_reason = p_rejection_reason,
                updated_at = NOW()
            WHERE id = p_user_id;
            
            -- Sync kyc_level
            UPDATE user_profiles SET kyc_level = 0 WHERE id = p_user_id;

            UPDATE kyc_submissions
            SET
                status = 'rejected',
                reviewed_by = p_admin_id,
                reviewed_at = NOW(),
                rejection_reason = p_rejection_reason,
                review_notes = p_reason
            WHERE id = (
                SELECT id FROM kyc_submissions 
                WHERE user_id = p_user_id AND status = 'pending' 
                ORDER BY created_at DESC LIMIT 1
            );
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'rejected');
            
        WHEN 'force_kyc' THEN
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
            INSERT INTO kyc_admin_overrides (user_id, override_type, admin_id, reason)
            VALUES (p_user_id, 'force_kyc', p_admin_id, COALESCE(p_reason, 'Admin forced KYC requirement'));
            
            v_result := jsonb_build_object('success', TRUE, 'action', 'force_kyc');
            
        WHEN 'waive_kyc' THEN
            UPDATE kyc_admin_overrides SET
                is_active = FALSE,
                revoked_at = NOW(),
                revoked_by = p_admin_id
            WHERE user_id = p_user_id AND is_active = TRUE;
            
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
        jsonb_build_object('verification_status', v_prev_status),
        v_result,
        COALESCE(p_reason, p_rejection_reason, p_action)
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
