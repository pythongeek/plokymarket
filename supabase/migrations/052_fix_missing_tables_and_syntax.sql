-- ============================================
-- FIX: Create missing user_profiles table and fix syntax errors
-- ============================================

-- Create user_profiles table if it doesn't exist (referenced by other migrations)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Trigger to create user_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, is_admin)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists and create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIX: Fix notification system syntax error
-- ============================================

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS create_notification_from_template(UUID, VARCHAR, UUID, UUID, UUID, UUID, JSONB, VARCHAR, VARCHAR);

-- Recreate with fixed syntax
CREATE OR REPLACE FUNCTION create_notification_from_template(
    p_user_id UUID,
    p_template_id VARCHAR(100),
    p_market_id UUID DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL,
    p_position_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT NULL,
    p_language VARCHAR(10) DEFAULT 'en'
)
RETURNS UUID AS $$
DECLARE
    v_template notification_templates%ROWTYPE;
    v_title TEXT;
    v_body TEXT;
    v_channels TEXT[];
    v_relevance FLOAT;
    v_notification_id UUID;
    rec RECORD;
BEGIN
    -- Get template
    SELECT * INTO v_template 
    FROM notification_templates 
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Select language
    CASE p_language
        WHEN 'bn' THEN
            v_title := v_template.title_bn;
            v_body := v_template.body_bn;
        WHEN 'hi' THEN
            v_title := COALESCE(v_template.title_hi, v_template.title_en);
            v_body := COALESCE(v_template.body_hi, v_template.body_en);
        ELSE
            v_title := v_template.title_en;
            v_body := v_template.body_en;
    END CASE;
    
    -- Simple template variable replacement - FIXED SYNTAX
    FOR rec IN SELECT * FROM jsonb_each_text(p_data) LOOP
        v_title := REPLACE(v_title, '{{' || rec.key || '}}', rec.value);
        v_body := REPLACE(v_body, '{{' || rec.key || '}}', rec.value);
    END LOOP;
    
    -- Create notification
    INSERT INTO notifications (
        user_id, template_id, category, title, body, data,
        market_id, order_id, sender_id, channels, priority, relevance_score
    ) VALUES (
        p_user_id, p_template_id, v_template.category, v_title, v_body, p_data,
        p_market_id, p_order_id, p_sender_id, v_channels, 
        COALESCE(p_priority, v_template.default_priority), v_relevance
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX: Ensure user_status exists for market_creation_drafts
-- ============================================

-- The user_status table is created in 051, but let's ensure it exists
-- with proper defaults for any missing rows
INSERT INTO user_status (id, account_status, can_trade, can_deposit, can_withdraw)
SELECT id, 'active', TRUE, TRUE, TRUE
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM user_status WHERE user_status.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FIX: Ensure user_kyc_profiles exists with defaults
-- ============================================

INSERT INTO user_kyc_profiles (id, verification_status, verification_tier, risk_score)
SELECT id, 'unverified', 'basic', 50
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM user_kyc_profiles WHERE user_kyc_profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;
