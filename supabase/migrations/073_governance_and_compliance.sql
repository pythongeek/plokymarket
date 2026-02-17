-- ============================================
-- GOVERNANCE & COMPLIANCE UPDATES
-- Audit Logs, Dormant Accounts, and KYC Expiry
-- ============================================

-- 1. ACTIVITY LOG: public.audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_name TEXT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- user, market, order, system
    entity_id UUID,
    previous_state JSONB,
    new_state JSONB,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
    ON public.audit_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- 2. DORMANT ACCOUNT MANAGEMENT
-- Add last_login_at to user_profiles if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login_at') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update user status with dormant status
-- 'dormant' status already exists in Check constraint of user_status (from 051)
-- Let's ensure 'dormant' is handled in user_status

-- Function to update last login and check dormant status
CREATE OR REPLACE FUNCTION public.track_user_activity(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_last_login TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current last login
    SELECT last_login_at INTO v_last_login
    FROM user_profiles
    WHERE id = p_user_id;

    -- Update last login
    UPDATE user_profiles
    SET last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- If the user was dormant, we could trigger a flag here, 
    -- but the logic says "if 90 days log-in not done, status becomes dormant".
    -- This is usually checked at login time or by a background cron.
    
    -- If user was dormant, and is logging in, we might want to keep it dormant 
    -- until email verification is done (handled by app logic).
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Routine to mark accounts as dormant (can be called by n8n or cron)
CREATE OR REPLACE FUNCTION public.cleanup_dormant_accounts()
RETURNS TABLE (user_id UUID) AS $$
BEGIN
    RETURN QUERY
    UPDATE user_status
    SET account_status = 'dormant',
        updated_at = NOW()
    FROM user_profiles
    WHERE user_status.id = user_profiles.id
      AND user_profiles.last_login_at < NOW() - INTERVAL '90 days'
      AND user_status.account_status = 'active'
    RETURNING user_status.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. KYC DOCUMENT EXPIRY
-- id_expiry already exists in user_kyc_profiles from 051.
-- We just need a view or function to help identify expiring ones.

CREATE OR REPLACE VIEW public.vw_expiring_kyc AS
SELECT 
    id as user_id,
    full_name,
    id_type,
    id_number,
    id_expiry,
    (id_expiry - NOW()::DATE) as days_until_expiry
FROM user_kyc_profiles
WHERE id_expiry IS NOT NULL
  AND id_expiry <= (NOW() + INTERVAL '30 days')::DATE;

-- Function to log admin actions into audit_logs automatically via trigger
CREATE OR REPLACE FUNCTION public.log_entity_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        previous_state,
        new_state,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach logs to critical tables
DO $$
BEGIN
    -- User Status Changes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_audit_user_status') THEN
        CREATE TRIGGER trig_audit_user_status
        AFTER INSERT OR UPDATE OR DELETE ON user_status
        FOR EACH ROW EXECUTE FUNCTION log_entity_change();
    END IF;

    -- Market Resolution (if we have a markets table)
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trig_audit_markets') THEN
        CREATE TRIGGER trig_audit_markets
        AFTER UPDATE ON markets
        FOR EACH ROW 
        WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION log_entity_change();
    END IF;
END $$;
