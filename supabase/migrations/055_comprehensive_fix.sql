-- ============================================
-- COMPREHENSIVE FIX: Create user_profiles and fix all syntax errors
-- Run this BEFORE migrations 049, 050, 051
-- ============================================

-- ============================================
-- 1. CREATE USER_PROFILES TABLE (Required by 050 and 051)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_senior_counsel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
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
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists and create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO user_profiles (id, full_name, email, is_admin)
SELECT id, raw_user_meta_data->>'full_name', email, FALSE
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. FIX NOTIFICATION SYSTEM (Migration 049 issues)
-- ============================================

-- Drop functions that might have syntax errors
DROP FUNCTION IF EXISTS create_notification_from_template(UUID, VARCHAR, UUID, UUID, UUID, UUID, JSONB, VARCHAR, VARCHAR);

-- Create notification tables first
CREATE TABLE IF NOT EXISTS notification_channels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO notification_channels (id, name, description) VALUES
('websocket', 'WebSocket', 'Real-time in-app notifications'),
('push', 'Push Notification', 'Browser push notifications'),
('email', 'Email', 'Email notifications'),
('webhook', 'Webhook', 'External webhook callbacks'),
('in_app', 'In-App', 'In-app notification center'),
('sms', 'SMS', 'SMS text messages')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title_en TEXT NOT NULL,
    title_bn TEXT,
    title_hi TEXT,
    body_en TEXT NOT NULL,
    body_bn TEXT,
    body_hi TEXT,
    default_priority VARCHAR(20) DEFAULT 'normal',
    default_channels JSONB DEFAULT jsonb_build_array('websocket', 'in_app'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO notification_templates (id, name, category, title_en, title_bn, body_en, body_bn) VALUES
('order_filled', 'Order Filled', 'trade', 'Order Filled', 'অর্ডার সম্পন্ন', 'Your order has been filled.', 'আপনার অর্ডার সম্পন্ন হয়েছে।'),
('market_resolved', 'Market Resolved', 'market', 'Market Resolved', 'মার্কেট সমাধান', 'The market has resolved.', 'মার্কেট সমাধান হয়েছে।'),
('price_alert', 'Price Alert', 'market', 'Price Alert', 'দাম সতর্কতা', 'Price has changed significantly.', 'দাম উল্লেখযোগ্যভাবে পরিবর্তিত হয়েছে।'),
('margin_call', 'Margin Warning', 'risk', 'Margin Warning', 'মার্জিন সতর্কতা', 'Your position is at risk.', 'আপনার পজিশন ঝুঁকিতে আছে।'),
('new_follower', 'New Follower', 'social', 'New Follower', 'নতুন ফলোয়ার', 'Someone followed you.', 'কেউ আপনাকে ফলো করেছে।'),
('system_maintenance', 'Maintenance', 'system', 'System Maintenance', 'সিস্টেম রক্ষণাবেক্ষণ', 'Scheduled maintenance.', 'নির্ধারিত রক্ষণাবেক্ষণ।')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    do_not_disturb BOOLEAN DEFAULT FALSE,
    order_fills_enabled BOOLEAN DEFAULT TRUE,
    order_fills_channels JSONB DEFAULT jsonb_build_array('websocket', 'push', 'email'),
    market_resolution_enabled BOOLEAN DEFAULT TRUE,
    market_resolution_channels JSONB DEFAULT jsonb_build_array('websocket', 'push', 'email', 'in_app'),
    price_alerts_enabled BOOLEAN DEFAULT TRUE,
    price_alerts_channels JSONB DEFAULT jsonb_build_array('push', 'email'),
    position_risk_enabled BOOLEAN DEFAULT TRUE,
    position_risk_channels JSONB DEFAULT jsonb_build_array('websocket', 'push'),
    social_notifications_enabled BOOLEAN DEFAULT TRUE,
    social_channels JSONB DEFAULT jsonb_build_array('in_app', 'email'),
    system_maintenance_enabled BOOLEAN DEFAULT TRUE,
    system_maintenance_channels JSONB DEFAULT jsonb_build_array('email', 'in_app'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id VARCHAR(100) REFERENCES notification_templates(id),
    category VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    market_id UUID REFERENCES markets(id),
    order_id UUID,
    sender_id UUID REFERENCES users(id),
    channels JSONB DEFAULT jsonb_build_array('in_app'),
    priority VARCHAR(20) DEFAULT 'normal',
    relevance_score INTEGER DEFAULT 50,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create FIXED function with proper syntax
CREATE OR REPLACE FUNCTION create_notification_from_template(
    p_user_id UUID,
    p_template_id VARCHAR(100),
    p_market_id UUID DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL,
    p_position_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT NULL,
    p_language VARCHAR(10) DEFAULT 'bn'
)
RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_prefs RECORD;
    v_notification_id UUID;
    v_title TEXT;
    v_body TEXT;
    v_relevance INTEGER := 50;
    rec RECORD;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM notification_templates
    WHERE id = p_template_id AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Get user preferences
    SELECT * INTO v_prefs
    FROM notification_preferences
    WHERE user_id = p_user_id;
    
    IF NOT FOUND OR NOT v_prefs.notifications_enabled THEN
        RETURN NULL;
    END IF;
    
    -- Check do not disturb
    IF v_prefs.do_not_disturb THEN
        IF p_priority != 'urgent' THEN
            RETURN NULL;
        END IF;
    END IF;
    
    -- Select language
    CASE p_language
        WHEN 'bn' THEN
            v_title := COALESCE(v_template.title_bn, v_template.title_en);
            v_body := COALESCE(v_template.body_bn, v_template.body_en);
        WHEN 'hi' THEN
            v_title := COALESCE(v_template.title_hi, v_template.title_en);
            v_body := COALESCE(v_template.body_hi, v_template.body_en);
        ELSE
            v_title := v_template.title_en;
            v_body := v_template.body_en;
    END CASE;
    
    -- Template variable replacement - FIXED SYNTAX
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
        p_market_id, p_order_id, p_sender_id, v_template.default_channels, 
        COALESCE(p_priority, v_template.default_priority), v_relevance
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 3. CREATE TABLES NEEDED FOR 050 AND 051
-- ============================================

-- User status table
CREATE TABLE IF NOT EXISTS user_status (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    account_status VARCHAR(50) NOT NULL DEFAULT 'active',
    can_trade BOOLEAN DEFAULT TRUE,
    can_deposit BOOLEAN DEFAULT TRUE,
    can_withdraw BOOLEAN DEFAULT TRUE,
    trading_restricted_until TIMESTAMP WITH TIME ZONE,
    restriction_reason TEXT,
    restriction_notes TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by UUID REFERENCES auth.users(id),
    suspension_reason TEXT,
    suspension_expires TIMESTAMP WITH TIME ZONE,
    appeal_submitted BOOLEAN DEFAULT FALSE,
    appeal_text TEXT,
    appeal_submitted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC profiles
CREATE TABLE IF NOT EXISTS user_kyc_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified',
    verification_tier VARCHAR(20) NOT NULL DEFAULT 'basic',
    full_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(100),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    address_line1 TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    phone_number VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 50,
    risk_factors JSONB DEFAULT '[]',
    daily_deposit_limit DECIMAL(20, 8) DEFAULT 1000,
    daily_withdrawal_limit DECIMAL(20, 8) DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backfill user_status
INSERT INTO user_status (id, account_status, can_trade, can_deposit, can_withdraw)
SELECT id, 'active', TRUE, TRUE, TRUE
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM user_status WHERE user_status.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- Backfill kyc_profiles
INSERT INTO user_kyc_profiles (id, verification_status, verification_tier, risk_score)
SELECT id, 'unverified', 'basic', 50
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM user_kyc_profiles WHERE user_kyc_profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kyc_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all status" ON user_status FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can modify status" ON user_status FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can view all KYC" ON user_kyc_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));
