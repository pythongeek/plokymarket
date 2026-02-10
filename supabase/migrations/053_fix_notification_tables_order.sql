-- ============================================
-- FIX: Ensure notification tables exist in correct order
-- ============================================

-- First, drop functions that depend on tables
DROP FUNCTION IF EXISTS create_notification_from_template(UUID, VARCHAR, UUID, UUID, UUID, UUID, JSONB, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS calculate_notification_relevance(UUID, VARCHAR, JSONB);

-- ============================================
-- 1. NOTIFICATION CHANNELS CONFIG
-- ============================================
CREATE TABLE IF NOT EXISTS notification_channels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert channels (ignore conflicts)
INSERT INTO notification_channels (id, name, description) VALUES
('websocket', 'WebSocket', 'Real-time in-app notifications via WebSocket'),
('push', 'Push Notification', 'Browser push notifications'),
('email', 'Email', 'Email notifications'),
('webhook', 'Webhook', 'External webhook callbacks'),
('in_app', 'In-App', 'In-app notification center'),
('sms', 'SMS', 'SMS text messages (premium)')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. NOTIFICATION TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Multi-language content
    title_en TEXT NOT NULL,
    title_bn TEXT,
    title_hi TEXT,
    body_en TEXT NOT NULL,
    body_bn TEXT,
    body_hi TEXT,
    
    -- Default settings
    default_priority VARCHAR(20) DEFAULT 'normal',
    default_channels JSONB DEFAULT '["websocket", "in_app"]',
    
    -- Smart features
    requires_ml_scoring BOOLEAN DEFAULT FALSE,
    min_relevance_score INTEGER DEFAULT 0, -- 0-100
    
    -- Auto-expiry
    auto_expire_hours INTEGER DEFAULT 168, -- 7 days
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default templates (ignore conflicts)
INSERT INTO notification_templates (
    id, name, category, description,
    title_en, title_bn, title_hi,
    body_en, body_bn, body_hi,
    default_priority, default_channels
) VALUES 
-- Order fills
('order_filled', 'Order Filled', 'trade', 'When an order is completely filled',
 'Order Filled: {{market_name}}', 'অর্ডার সম্পন্ন: {{market_name}}', 'ऑर्डर पूरा हुआ: {{market_name}}',
 'Your {{side}} order for {{quantity}} shares at {{price}} has been filled.', 
 'আপনার {{quantity}} শেয়ারের {{side}} অর্ডার {{price}} দামে সম্পন্ন হয়েছে।',
 'आपका {{quantity}} शेयरों के लिए {{side}} ऑर्डर {{price}} पर पूरा हुआ।',
 'normal', '["websocket", "push", "email"]'),

-- Market resolutions
('market_resolved', 'Market Resolved', 'market', 'When a market resolves',
 'Market Resolved: {{market_name}}', 'মার্কেট সমাধান হয়েছে: {{market_name}}', 'मार्केट समाधान हुआ: {{market_name}}',
 'The market "{{market_name}}" has resolved to {{outcome}}.',
 'মার্কেট "{{market_name}}" {{outcome}} হিসাবে সমাধান হয়েছে।',
 'मार्केट "{{market_name}}" {{outcome}} के रूप में समाधान हुआ।',
 'high', '["websocket", "push", "email", "in_app"]'),

-- Price alerts
('price_alert', 'Price Alert', 'market', 'Significant price movement',
 'Price Alert: {{market_name}}', 'দাম সতর্কতা: {{market_name}}', 'कीमत अलर्ट: {{market_name}}',
 'Price moved {{direction}} {{percent}}% to {{current_price}}.',
 'দাম {{direction}} {{percent}}% পরিবর্তন হয়ে {{current_price}} হয়েছে।',
 'कीमत {{direction}} {{percent}}% बदलकर {{current_price}} हो गई।',
 'normal', '["push", "email"]'),

-- Position risk
('margin_call_warning', 'Margin Warning', 'risk', 'Position approaching liquidation',
 'Margin Warning', 'মার্জিন সতর্কতা', 'मार्जिन चेतावनी',
 'Your position is at {{margin_percent}}% margin. Add funds or reduce position.',
 'আপনার পজিশন {{margin_percent}}% মার্জিনে আছে। ফান্ড যোগ করুন বা পজিশন কমান।',
 'आपकी पोजीशन {{margin_percent}}% मार्जिन पर है। फंड जोड़ें या पोजीशन कम करें।',
 'urgent', '["websocket", "push"]'),

-- Social notifications
('new_follower', 'New Follower', 'social', 'Someone followed you',
 'New Follower', 'নতুন ফলোয়ার', 'नया फॉलोअर',
 '{{username}} started following you.',
 '{{username}} আপনাকে ফলো করছে।', '{{username}} ने आपको फॉलो किया।',
 'normal', '["in_app", "email"]'),

('comment_reply', 'Comment Reply', 'social', 'Reply to your comment',
 'New Reply to Your Comment', 'আপনার কমেন্টে নতুন উত্তর', 'आपकी टिप्पणी पर नया जवाब',
 '{{username}} replied: "{{preview}}"',
 '{{username}} উত্তর দিয়েছেন: "{{preview}}"', '{{username}} ने जवाब दिया: "{{preview}}"',
 'normal', '["in_app"]'),

('mention', 'Mentioned You', 'social', 'Someone mentioned you',
 'You Were Mentioned', 'আপনাকে উল্লেখ করা হয়েছে', 'आपका उल्लेख किया गया',
 '{{username}} mentioned you in a comment.',
 '{{username}} একটি কমেন্টে আপনাকে উল্লেখ করেছেন।',
 '{{username}} ने एक टिप्पणी में आपका उल्लेख किया।',
 'normal', '["in_app", "email"]'),

-- System maintenance
('system_maintenance', 'Scheduled Maintenance', 'system', 'Upcoming maintenance',
 'Scheduled Maintenance', 'নির্ধারিত রক্ষণাবেক্ষণ', 'निर्धारित रखरखाव',
 'System maintenance scheduled for {{start_time}}. Duration: {{duration}}.',
 'সিস্টেম রক্ষণাবেক্ষণ {{start_time}}-এ নির্ধারিত। সময়কাল: {{duration}}।',
 'सिस्टम रखरखाव {{start_time}} के लिए निर्धारित। अवधि: {{duration}}।',
 'high', '["email", "in_app"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    notifications_enabled BOOLEAN DEFAULT TRUE,
    do_not_disturb BOOLEAN DEFAULT FALSE,
    do_not_disturb_until TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    
    order_fills_enabled BOOLEAN DEFAULT TRUE,
    order_fills_min_amount DECIMAL(20, 2) DEFAULT 1000,
    order_fills_channels JSONB DEFAULT '["websocket", "push", "email"]',
    
    market_resolution_enabled BOOLEAN DEFAULT TRUE,
    market_resolution_advance_warning BOOLEAN DEFAULT TRUE,
    market_resolution_channels JSONB DEFAULT '["websocket", "push", "email", "in_app"]',
    
    price_alerts_enabled BOOLEAN DEFAULT TRUE,
    price_alerts_threshold DECIMAL(5, 2) DEFAULT 5.0,
    price_alerts_cooldown_minutes INTEGER DEFAULT 60,
    price_alerts_channels JSONB DEFAULT '["push", "email"]',
    
    position_risk_enabled BOOLEAN DEFAULT TRUE,
    position_risk_margin_threshold DECIMAL(5, 2) DEFAULT 80.0,
    position_risk_channels JSONB DEFAULT '["websocket", "push"]',
    
    social_notifications_enabled BOOLEAN DEFAULT TRUE,
    social_digest_frequency VARCHAR(20) DEFAULT 'hourly',
    social_channels JSONB DEFAULT '["in_app", "email"]',
    
    system_maintenance_enabled BOOLEAN DEFAULT TRUE,
    system_maintenance_advance_hours INTEGER DEFAULT 24,
    system_maintenance_channels JSONB DEFAULT '["email", "in_app"]',
    
    volatility_adjusted_thresholds BOOLEAN DEFAULT TRUE,
    ml_relevance_filtering BOOLEAN DEFAULT TRUE,
    snooze_enabled BOOLEAN DEFAULT TRUE,
    
    batch_non_urgent BOOLEAN DEFAULT TRUE,
    batch_interval_minutes INTEGER DEFAULT 5,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================
-- 4. NOTIFICATIONS TABLE
-- ============================================
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
    position_id UUID,
    sender_id UUID REFERENCES users(id),
    
    channels JSONB DEFAULT '["in_app"]',
    priority VARCHAR(20) DEFAULT 'normal',
    relevance_score INTEGER DEFAULT 50,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,
    
    is_snoozed BOOLEAN DEFAULT FALSE,
    snooze_until TIMESTAMPTZ,
    
    requires_action BOOLEAN DEFAULT FALSE,
    action_taken BOOLEAN DEFAULT FALSE,
    action_taken_at TIMESTAMPTZ,
    
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. FUNCTIONS (now that tables exist)
-- ============================================

-- Function to create notification from template
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
    v_channels JSONB;
    v_title TEXT;
    v_body TEXT;
    v_relevance INTEGER;
    v_user_lang VARCHAR := 'bn';
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
    IF v_prefs.do_not_disturb AND (v_prefs.do_not_disturb_until IS NULL OR v_prefs.do_not_disturb_until > NOW()) THEN
        IF p_priority != 'urgent' THEN
            RETURN NULL;
        END IF;
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
    
    -- Template variable replacement
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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
