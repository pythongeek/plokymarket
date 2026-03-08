-- ============================================
-- ADMIN SECURITY SETUP
-- ============================================
-- This migration sets up secure admin access controls

-- ============================================
-- 1. ENSURE USER_PROFILES HAS ADMIN FIELDS
-- ============================================

-- Add is_senior_counsel if not exists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_senior_counsel BOOLEAN DEFAULT FALSE;

-- Add last_admin_login for audit
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMP WITH TIME ZONE;

-- Add admin_notes for internal tracking
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================
-- 2. ADMIN ACCESS LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    admin_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- login, logout, api_access, failed_attempt
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_access_log_admin ON admin_access_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_log_action ON admin_access_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_access_log_created ON admin_access_log(created_at DESC);

-- Enable RLS
ALTER TABLE admin_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view their own access logs
CREATE POLICY "Admins can view own access logs"
    ON admin_access_log FOR SELECT
    USING (auth.uid() = admin_id);

-- ============================================
-- 3. FUNCTION TO LOG ADMIN ACCESS
-- ============================================

CREATE OR REPLACE FUNCTION log_admin_access(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_success BOOLEAN DEFAULT TRUE,
    p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_email VARCHAR(255);
BEGIN
    SELECT email INTO v_email FROM auth.users WHERE id = p_admin_id;
    
    INSERT INTO admin_access_log (
        admin_id, admin_email, action, ip_address, user_agent, success, failure_reason
    ) VALUES (
        p_admin_id, v_email, p_action, inet_client_addr(), 
        current_setting('request.headers', true)::json->>'user-agent',
        p_success, p_failure_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FUNCTION TO CHECK AND LOG ADMIN LOGIN
-- ============================================

CREATE OR REPLACE FUNCTION handle_admin_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if this is an admin
    IF NEW.is_admin = TRUE THEN
        -- Update last login time
        NEW.last_admin_login := NOW();
        
        -- Log the access
        PERFORM log_admin_access(NEW.id, 'login', TRUE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_profiles update
DROP TRIGGER IF EXISTS trg_admin_login ON user_profiles;
CREATE TRIGGER trg_admin_login
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW 
    WHEN (OLD.last_admin_login IS DISTINCT FROM NEW.last_admin_login)
    EXECUTE FUNCTION handle_admin_login();

-- ============================================
-- 5. SECURE FUNCTION TO PROMOTE USER TO ADMIN
-- ============================================
-- This should ONLY be run manually by a superuser or via secure script

CREATE OR REPLACE FUNCTION promote_to_admin(p_user_id UUID, p_promoted_by UUID, p_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_promoter_email VARCHAR(255);
    v_user_email VARCHAR(255);
BEGIN
    -- Check if promoter is admin
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_promoted_by AND is_admin = TRUE) THEN
        RAISE EXCEPTION 'Only admins can promote users to admin';
    END IF;
    
    -- Get emails for logging
    SELECT email INTO v_promoter_email FROM auth.users WHERE id = p_promoted_by;
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    
    -- Promote user
    UPDATE user_profiles 
    SET is_admin = TRUE, 
        admin_notes = COALESCE(admin_notes, '') || E'\nPromoted to admin by ' || v_promoter_email || ' at ' || NOW() || E'\nReason: ' || p_reason
    WHERE id = p_user_id;
    
    -- Log the promotion
    PERFORM log_admin_access(p_promoted_by, 'promote_user:' || p_user_id, TRUE);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FUNCTION TO REVOKE ADMIN ACCESS
-- ============================================

CREATE OR REPLACE FUNCTION revoke_admin_access(p_user_id UUID, p_revoked_by UUID, p_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_revoker_email VARCHAR(255);
    v_user_email VARCHAR(255);
BEGIN
    -- Check if revoker is admin
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_revoked_by AND is_admin = TRUE) THEN
        RAISE EXCEPTION 'Only admins can revoke admin access';
    END IF;
    
    -- Prevent self-revocation if last admin
    IF p_user_id = p_revoked_by THEN
        IF (SELECT COUNT(*) FROM user_profiles WHERE is_admin = TRUE) <= 1 THEN
            RAISE EXCEPTION 'Cannot revoke the last admin';
        END IF;
    END IF;
    
    -- Get emails for logging
    SELECT email INTO v_revoker_email FROM auth.users WHERE id = p_revoked_by;
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
    
    -- Revoke admin
    UPDATE user_profiles 
    SET is_admin = FALSE,
        admin_notes = COALESCE(admin_notes, '') || E'\nAdmin access revoked by ' || v_revoker_email || ' at ' || NOW() || E'\nReason: ' || p_reason
    WHERE id = p_user_id;
    
    -- Log the revocation
    PERFORM log_admin_access(p_revoked_by, 'revoke_admin:' || p_user_id, TRUE);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. VIEW FOR ADMIN ACTIVITY MONITORING
-- ============================================

CREATE OR REPLACE VIEW admin_activity_summary AS
SELECT 
    up.id as admin_id,
    up.full_name,
    up.email,
    up.is_admin,
    up.is_senior_counsel,
    up.last_admin_login,
    up.created_at as profile_created,
    (SELECT COUNT(*) FROM admin_access_log WHERE admin_id = up.id AND action = 'login' AND created_at > NOW() - INTERVAL '30 days') as logins_last_30_days,
    (SELECT COUNT(*) FROM admin_audit_log WHERE admin_id = up.id AND created_at > NOW() - INTERVAL '30 days') as actions_last_30_days
FROM user_profiles up
WHERE up.is_admin = TRUE;

-- ============================================
-- 8. SECURITY POLICY: Only admins can view other admin data
-- ============================================

-- Policy for admin_access_log
DROP POLICY IF EXISTS "Admins can view all access logs" ON admin_access_log;
CREATE POLICY "Admins can view all access logs"
    ON admin_access_log FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================
-- 9. SETUP INSTRUCTIONS (as comments)
-- ============================================

/*

TO SETUP INITIAL ADMIN ACCESS:

1. First, ensure user_profiles table exists and has your user:
   
   SELECT * FROM user_profiles WHERE email = 'your-email@example.com';

2. If your user doesn't exist in user_profiles, run:
   
   INSERT INTO user_profiles (id, full_name, email, is_admin)
   SELECT id, raw_user_meta_data->>'full_name', email, TRUE
   FROM auth.users 
   WHERE email = 'your-email@example.com'
   ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;

3. To promote another user to admin (from SQL editor):
   
   SELECT promote_to_admin(
       'user-uuid-here',           -- User to promote
       'your-admin-uuid-here',     -- Your admin UUID
       'Initial admin setup'       -- Reason
   );

4. Verify admin access:
   
   SELECT * FROM admin_activity_summary;

SECURITY RECOMMENDATIONS:

1. Always use strong passwords for admin accounts
2. Enable 2FA (Two-Factor Authentication) in Supabase
3. Monitor admin_access_log regularly
4. Limit the number of admin users
5. Use senior_counsel designation for legal review access
6. Review admin_audit_log for suspicious activity
7. Never hardcode admin credentials in frontend code

*/
