-- ===================================
-- COMPREHENSIVE NOTIFICATION SYSTEM
-- ===================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notification_delivery_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notification_channels CASCADE;

-- ===================================
-- NOTIFICATION CHANNELS CONFIG
-- ===================================
CREATE TABLE notification_channels (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert channels
INSERT INTO notification_channels (id, name, description) VALUES
('websocket', 'WebSocket', 'Real-time in-app notifications via WebSocket'),
('push', 'Push Notification', 'Browser push notifications'),
('email', 'Email', 'Email notifications'),
('webhook', 'Webhook', 'External webhook callbacks'),
('in_app', 'In-App', 'In-app notification center'),
('sms', 'SMS', 'SMS text messages (premium)');

-- ===================================
-- NOTIFICATION PREFERENCES
-- ===================================
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Global settings
    notifications_enabled BOOLEAN DEFAULT TRUE,
    do_not_disturb BOOLEAN DEFAULT FALSE,
    do_not_disturb_until TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    
    -- Order fills
    order_fills_enabled BOOLEAN DEFAULT TRUE,
    order_fills_min_amount DECIMAL(20, 2) DEFAULT 1000, -- Only notify if > $1K
    order_fills_channels JSONB DEFAULT '["websocket", "push", "email"]',
    
    -- Market resolutions
    market_resolution_enabled BOOLEAN DEFAULT TRUE,
    market_resolution_advance_warning BOOLEAN DEFAULT TRUE, -- 24h advance warning
    market_resolution_channels JSONB DEFAULT '["websocket", "push", "email", "in_app"]',
    
    -- Price alerts
    price_alerts_enabled BOOLEAN DEFAULT TRUE,
    price_alerts_threshold DECIMAL(5, 2) DEFAULT 5.0, -- 5% change
    price_alerts_cooldown_minutes INTEGER DEFAULT 60, -- 1 hour cooldown
    price_alerts_channels JSONB DEFAULT '["push", "email"]',
    
    -- Position risk
    position_risk_enabled BOOLEAN DEFAULT TRUE,
    position_risk_margin_threshold DECIMAL(5, 2) DEFAULT 80.0, -- 80% margin used
    position_risk_channels JSONB DEFAULT '["websocket", "push"]',
    
    -- Social notifications
    social_notifications_enabled BOOLEAN DEFAULT TRUE,
    social_digest_frequency VARCHAR(20) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily'
    social_channels JSONB DEFAULT '["in_app", "email"]',
    
    -- System maintenance
    system_maintenance_enabled BOOLEAN DEFAULT TRUE,
    system_maintenance_advance_hours INTEGER DEFAULT 24,
    system_maintenance_channels JSONB DEFAULT '["email", "in_app"]',
    
    -- Smart features
    volatility_adjusted_thresholds BOOLEAN DEFAULT TRUE,
    ml_relevance_filtering BOOLEAN DEFAULT TRUE,
    snooze_enabled BOOLEAN DEFAULT TRUE,
    
    -- Batching settings
    batch_non_urgent BOOLEAN DEFAULT TRUE,
    batch_interval_minutes INTEGER DEFAULT 5,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- ===================================
-- NOTIFICATION TEMPLATES
-- ===================================
CREATE TABLE notification_templates (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    -- Content templates (i18n)
    title_bn TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_hi TEXT,
    
    body_bn TEXT NOT NULL,
    body_en TEXT NOT NULL,
    body_hi TEXT,
    
    -- Template variables (JSON schema)
    variables JSONB DEFAULT '[]',
    
    -- Default channels for this type
    default_channels JSONB NOT NULL,
    default_priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    -- Smart features
    requires_ml_scoring BOOLEAN DEFAULT FALSE,
    volatility_sensitive BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert notification templates
INSERT INTO notification_templates (id, name, category, title_bn, title_en, body_bn, body_en, default_channels, default_priority) VALUES
-- Order fills
('order_filled', 'Order Filled', 'trading', 
 'অর্ডার পূর্ণ হয়েছে!', 'Order Filled!',
 'আপনার {{side}} অর্ডার {{market}}-এ {{price}}-এ পূর্ণ হয়েছে। পরিমাণ: {{quantity}}',
 'Your {{side}} order for {{market}} was filled at {{price}}. Quantity: {{quantity}}',
 '["websocket", "push"]', 'high'),

('order_partial_fill', 'Order Partially Filled', 'trading',
 'অর্ডার আংশিক পূর্ণ', 'Order Partially Filled',
 'আপনার {{side}} অর্ডার আংশিক পূর্ণ হয়েছে। পূর্ণ: {{filled}}/{{total}}',
 'Your {{side}} order was partially filled. Filled: {{filled}}/{{total}}',
 '["websocket"]', 'normal'),

-- Market resolutions
('market_resolved', 'Market Resolved', 'market',
 'মার্কেট সমাধান হয়েছে', 'Market Resolved',
 '{{market}} {{outcome}} হিসাবে সমাধান হয়েছে। আপনার পেআউট: {{payout}}',
 '{{market}} was resolved to {{outcome}}. Your payout: {{payout}}',
 '["websocket", "push", "email", "in_app"]', 'high'),

('market_resolution_warning', 'Market Resolution Warning', 'market',
 'মার্কেট সমাধান সতর্কতা', 'Market Resolution Warning',
 '{{market}} আগামী ২৪ ঘন্টার মধ্যে সমাধান হতে পারে। আপনার পজিশন চেক করুন।',
 '{{market}} may resolve within 24 hours. Check your positions.',
 '["email", "in_app"]', 'normal'),

-- Price alerts
('price_alert', 'Price Alert', 'market',
 'মূল্য সতর্কতা', 'Price Alert',
 '{{market}}-এ মূল্য {{change}}% পরিবর্তন হয়েছে। বর্তমান মূল্য: {{price}}',
 'Price for {{market}} changed by {{change}}%. Current: {{price}}',
 '["push", "email"]', 'normal'),

-- Position risk
('margin_call_warning', 'Margin Call Warning', 'risk',
 'মার্জিন কল সতর্কতা', 'Margin Call Warning',
 'সতর্কতা! আপনার মার্জিন ব্যবহার {{percent}}%। অতিরিক্ত ফান্ড জমা করুন।',
 'Warning! Your margin usage is {{percent}}%. Please deposit additional funds.',
 '["websocket", "push"]', 'urgent'),

('position_liquidation_warning', 'Liquidation Warning', 'risk',
 'লিকুইডেশন সতর্কতা', 'Liquidation Warning',
 'আপনার পজিশন লিকুইডেশনের কাছাকাছি! মার্জিন: {{margin}}%',
 'Your position is near liquidation! Margin: {{margin}}%',
 '["websocket", "push", "email"]', 'urgent'),

-- Social
('new_follower', 'New Follower', 'social',
 'নতুন ফলোয়ার', 'New Follower',
 '{{user}} আপনাকে ফলো করেছে!', '{{user}} started following you!',
 '["in_app"]', 'low'),

('comment_reply', 'Comment Reply', 'social',
 'মন্তব্যের উত্তর', 'Comment Reply',
 '{{user}} আপনার মন্তব্যের উত্তর দিয়েছে', '{{user}} replied to your comment',
 '["in_app", "email"]', 'normal'),

('mention', 'Mention', 'social',
 'উল্লেখ', 'Mention',
 '{{user}} একটি মন্তব্যে আপনাকে উল্লেখ করেছে', '{{user}} mentioned you in a comment',
 '["in_app", "push"]', 'normal'),

-- System
('system_maintenance', 'Scheduled Maintenance', 'system',
 'নির্ধারিত রক্ষণাবেক্ষণ', 'Scheduled Maintenance',
 'প্ল্যাটফর্ম রক্ষণাবেক্ষণ {{time}}-এ হবে। {{duration}} সময়কাল।',
 'Platform maintenance scheduled at {{time}}. Duration: {{duration}}.',
 '["email", "in_app"]', 'normal'),

('system_update', 'System Update', 'system',
 'সিস্টেম আপডেট', 'System Update',
 'নতুন ফিচার উপলব্ধ: {{features}}', 'New features available: {{features}}',
 '["in_app"]', 'low');

-- ===================================
-- NOTIFICATIONS (Main table)
-- ===================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification content
    template_id VARCHAR(100) REFERENCES notification_templates(id),
    category VARCHAR(50) NOT NULL,
    
    -- Translated content (cached)
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Data for template variables
    data JSONB DEFAULT '{}',
    
    -- Related entities
    market_id UUID REFERENCES markets(id),
    order_id UUID REFERENCES orders(id),
    comment_id UUID REFERENCES market_comments(id),
    sender_id UUID REFERENCES users(id),
    
    -- Delivery tracking
    channels JSONB NOT NULL, -- ['websocket', 'push', 'email']
    priority VARCHAR(20) DEFAULT 'normal',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'sent', 'failed', 'dismissed'
    
    -- Read status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Dismiss/Snooze
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    
    -- ML relevance score (0-100)
    relevance_score INTEGER,
    
    -- Batching
    batch_id UUID,
    batched_at TIMESTAMPTZ,
    
    -- Timestamps
    scheduled_for TIMESTAMPTZ, -- For delayed notifications
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_category ON notifications(user_id, category);
CREATE INDEX idx_notifications_batch ON notifications(batch_id);

-- ===================================
-- NOTIFICATION DELIVERY LOG
-- ===================================
CREATE TABLE notification_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'bounced', 'suppressed'
    
    -- Delivery details
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_delivery_log_notification ON notification_delivery_log(notification_id);
CREATE INDEX idx_delivery_log_user ON notification_delivery_log(user_id);
CREATE INDEX idx_delivery_log_status ON notification_delivery_log(status);

-- ===================================
-- WEBHOOK SUBSCRIPTIONS
-- ===================================
CREATE TABLE webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(200),
    url TEXT NOT NULL,
    secret VARCHAR(255), -- For HMAC signature
    
    -- Event types to subscribe to
    events JSONB NOT NULL, -- ['order_filled', 'market_resolved', etc.']
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_subscriptions_user ON webhook_subscriptions(user_id);
CREATE INDEX idx_webhook_subscriptions_active ON webhook_subscriptions(is_active);

-- ===================================
-- FUNCTIONS
-- ===================================

-- Initialize default preferences for new user
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS on_user_create_notification_prefs ON users;
CREATE TRIGGER on_user_create_notification_prefs
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_notification_preferences();

-- Calculate relevance score for ML filtering
CREATE OR REPLACE FUNCTION calculate_notification_relevance(
    p_user_id UUID,
    p_template_id VARCHAR,
    p_data JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_score INTEGER := 50; -- Base score
    v_user_prefs RECORD;
BEGIN
    -- Get user preferences
    SELECT * INTO v_user_prefs
    FROM notification_preferences
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN v_score;
    END IF;
    
    -- Adjust based on notification type
    CASE p_template_id
        WHEN 'margin_call_warning', 'position_liquidation_warning' THEN
            v_score := 95; -- Always urgent
        WHEN 'order_filled' THEN
            -- Check order size
            IF (p_data->>'amount')::DECIMAL > v_user_prefs.order_fills_min_amount THEN
                v_score := 80;
            ELSE
                v_score := 30;
            END IF;
        WHEN 'price_alert' THEN
            -- Check if user follows this market
            IF EXISTS (
                SELECT 1 FROM market_follows 
                WHERE user_id = p_user_id AND market_id = (p_data->>'market_id')::UUID
            ) THEN
                v_score := 70;
            ELSE
                v_score := 20;
            END IF;
        ELSE
            v_score := 50;
    END CASE;
    
    -- Apply ML filtering if enabled
    IF v_user_prefs.ml_relevance_filtering AND v_score < 40 THEN
        v_score := 0; -- Suppress low-relevance notifications
    END IF;
    
    RETURN LEAST(100, GREATEST(0, v_score));
END;
$$;

-- Create notification with smart routing
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_template_id VARCHAR,
    p_data JSONB,
    p_market_id UUID DEFAULT NULL,
    p_order_id UUID DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL,
    p_priority VARCHAR DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template RECORD;
    v_prefs RECORD;
    v_notification_id UUID;
    v_channels JSONB;
    v_title TEXT;
    v_body TEXT;
    v_relevance INTEGER;
    v_user_lang VARCHAR := 'bn'; -- Default to Bangla
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
        -- Only allow urgent notifications during DND
        IF p_priority != 'urgent' THEN
            RETURN NULL;
        END IF;
    END IF;
    
    -- Calculate relevance score
    v_relevance := calculate_notification_relevance(p_user_id, p_template_id, p_data);
    
    -- Skip if filtered out by ML
    IF v_relevance = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Determine channels based on type and preferences
    CASE p_template_id
        WHEN 'order_filled', 'order_partial_fill' THEN
            IF NOT v_prefs.order_fills_enabled THEN RETURN NULL; END IF;
            v_channels := v_prefs.order_fills_channels;
        WHEN 'market_resolved', 'market_resolution_warning' THEN
            IF NOT v_prefs.market_resolution_enabled THEN RETURN NULL; END IF;
            v_channels := v_prefs.market_resolution_channels;
        WHEN 'price_alert' THEN
            IF NOT v_prefs.price_alerts_enabled THEN RETURN NULL; END IF;
            v_channels := v_prefs.price_alerts_channels;
        WHEN 'margin_call_warning', 'position_liquidation_warning' THEN
            IF NOT v_prefs.position_risk_enabled THEN RETURN NULL; END IF;
            v_channels := v_prefs.position_risk_channels;
        WHEN 'new_follower', 'comment_reply', 'mention' THEN
            IF NOT v_prefs.social_notifications_enabled THEN RETURN NULL; END IF;
            v_channels := v_prefs.social_channels;
        WHEN 'system_maintenance', 'system_update' THEN
            IF NOT v_prefs.system_maintenance_enabled THEN RETURN NULL; END IF;
            v_channels := v_prefs.system_maintenance_channels;
        ELSE
            v_channels := v_template.default_channels;
    END CASE;
    
    -- Get user's language (simplified - you'd get from users table)
    -- Default to Bangla for Bangladesh context
    SELECT COALESCE(i18n_language, 'bn') INTO v_user_lang 
    FROM users WHERE id = p_user_id;
    
    -- Select translated content
    CASE v_user_lang
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
    
    -- Simple template variable replacement
    FOR var_key, var_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
        v_title := REPLACE(v_title, '{{' || var_key || '}}', var_value);
        v_body := REPLACE(v_body, '{{' || var_key || '}}', var_value);
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
$$;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Dismiss notification
CREATE OR REPLACE FUNCTION dismiss_notification(
    p_notification_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET is_dismissed = TRUE, dismissed_at = NOW()
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Snooze notification
CREATE OR REPLACE FUNCTION snooze_notification(
    p_notification_id UUID,
    p_user_id UUID,
    p_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications
    SET snoozed_until = NOW() + (p_minutes || ' minutes')::INTERVAL
    WHERE id = p_notification_id AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id 
      AND is_read = FALSE 
      AND is_dismissed = FALSE
      AND (snoozed_until IS NULL OR snoozed_until <= NOW());
    
    RETURN v_count;
END;
$$;

-- Batch notifications for digest
CREATE OR REPLACE FUNCTION batch_notifications_for_digest(
    p_user_id UUID,
    p_category VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_batch_id UUID := gen_random_uuid();
BEGIN
    UPDATE notifications
    SET batch_id = v_batch_id, batched_at = NOW()
    WHERE user_id = p_user_id 
      AND category = p_category
      AND status = 'pending'
      AND batch_id IS NULL;
    
    RETURN v_batch_id;
END;
$$;

-- ===================================
-- VIEWS
-- ===================================

-- User notifications with delivery status
CREATE OR REPLACE VIEW user_notifications AS
SELECT 
    n.*,
    get_unread_notification_count(n.user_id) as total_unread
FROM notifications n
WHERE n.is_dismissed = FALSE
  AND (n.snoozed_until IS NULL OR n.snoozed_until <= NOW());

-- Notification digest for email batching
CREATE OR REPLACE VIEW notification_digest AS
SELECT 
    user_id,
    category,
    DATE_TRUNC('hour', created_at) as digest_hour,
    COUNT(*) as notification_count,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', id,
            'title', title,
            'body', body,
            'created_at', created_at
        ) ORDER BY created_at DESC
    ) as notifications
FROM notifications
WHERE is_read = FALSE 
  AND status = 'sent'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, category, DATE_TRUNC('hour', created_at);

-- ===================================
-- ROW LEVEL SECURITY
-- ===================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own preferences"
    ON notification_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
    ON notification_preferences FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own delivery logs"
    ON notification_delivery_log FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own webhooks"
    ON webhook_subscriptions FOR ALL
    USING (user_id = auth.uid());

-- ===================================
-- GRANTS
-- ===================================

GRANT ALL ON notification_preferences TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notification_delivery_log TO authenticated;
GRANT ALL ON webhook_subscriptions TO authenticated;
GRANT SELECT ON notification_templates TO authenticated;
GRANT SELECT ON notification_channels TO authenticated;
GRANT SELECT ON user_notifications TO authenticated;
GRANT SELECT ON notification_digest TO authenticated;

GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_notification TO authenticated;
GRANT EXECUTE ON FUNCTION snooze_notification TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_notification_relevance TO authenticated;
