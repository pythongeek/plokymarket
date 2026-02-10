-- ============================================
-- USER MANAGEMENT SYSTEM WITH AUDIT TRAILS
-- ============================================

-- User KYC profiles extension
CREATE TABLE IF NOT EXISTS user_kyc_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Verification status
    verification_status VARCHAR(50) NOT NULL DEFAULT 'unverified', -- unverified, pending, verified, rejected
    verification_tier VARCHAR(20) NOT NULL DEFAULT 'basic', -- basic, intermediate, advanced, institutional
    
    -- KYC Data
    full_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(100),
    id_type VARCHAR(50), -- passport, national_id, driving_license
    id_number VARCHAR(100),
    id_expiry DATE,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Contact
    phone_number VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Documents
    id_document_front_url TEXT,
    id_document_back_url TEXT,
    selfie_url TEXT,
    proof_of_address_url TEXT,
    
    -- Risk scoring
    risk_score INTEGER DEFAULT 50, -- 0-100
    risk_factors JSONB DEFAULT '[]'::jsonb,
    risk_last_assessed TIMESTAMP WITH TIME ZONE,
    
    -- Trading limits based on tier
    daily_deposit_limit DECIMAL(20, 8) DEFAULT 1000,
    daily_withdrawal_limit DECIMAL(20, 8) DEFAULT 1000,
    max_position_size DECIMAL(20, 8) DEFAULT 10000,
    
    -- Submission tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User status and restrictions
CREATE TABLE IF NOT EXISTS user_status (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Account status
    account_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, banned, dormant
    
    -- Trading restrictions
    can_trade BOOLEAN DEFAULT TRUE,
    can_deposit BOOLEAN DEFAULT TRUE,
    can_withdraw BOOLEAN DEFAULT TRUE,
    trading_restricted_until TIMESTAMP WITH TIME ZONE,
    
    -- Restriction reasons
    restriction_reason TEXT,
    restriction_notes TEXT,
    
    -- Suspension details
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_by UUID REFERENCES auth.users(id),
    suspension_reason TEXT,
    suspension_expires TIMESTAMP WITH TIME ZONE,
    
    -- Appeal
    appeal_submitted BOOLEAN DEFAULT FALSE,
    appeal_text TEXT,
    appeal_submitted_at TIMESTAMP WITH TIME ZONE,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin audit log for all user management actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who performed the action
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    admin_name VARCHAR(255),
    
    -- What action
    action VARCHAR(100) NOT NULL, -- view_profile, modify_status, liquidate_position, etc.
    action_category VARCHAR(50) NOT NULL, -- kyc, status, position, support
    
    -- On which user
    target_user_id UUID REFERENCES auth.users(id),
    target_user_email VARCHAR(255),
    
    -- Action details
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    
    -- For dual authorization
    requires_dual_auth BOOLEAN DEFAULT FALSE,
    dual_auth_admin_id UUID REFERENCES auth.users(id),
    dual_auth_at TIMESTAMP WITH TIME ZONE,
    
    -- IP and session info
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Position interventions (liquidations, forced closures)
CREATE TABLE IF NOT EXISTS position_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Intervention details
    user_id UUID NOT NULL REFERENCES auth.users(id),
    market_id UUID REFERENCES markets(id),
    position_id UUID,
    
    intervention_type VARCHAR(50) NOT NULL, -- liquidation, forced_closure, margin_call
    
    -- Financial details
    position_value DECIMAL(20, 8),
    pnl DECIMAL(20, 8),
    liquidation_price DECIMAL(20, 8),
    exit_price DECIMAL(20, 8),
    
    -- Reason
    reason VARCHAR(255),
    risk_level_at_time VARCHAR(20),
    
    -- Admin who performed
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Notification sent
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- User acknowledgment
    user_acknowledged BOOLEAN DEFAULT FALSE,
    user_acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Ticket info
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100), -- account, trading, deposit, withdrawal, technical, other
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, pending_user, resolved, closed
    
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    sender_id UUID REFERENCES auth.users(id),
    sender_type VARCHAR(20) NOT NULL, -- user, admin, system
    
    message TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE, -- Only visible to admins
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Internal user notes (for admins)
CREATE TABLE IF NOT EXISTS user_internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    
    note TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general', -- general, kyc, risk, support, trading
    
    -- For escalation
    is_escalation BOOLEAN DEFAULT FALSE,
    escalated_to UUID REFERENCES auth.users(id),
    escalation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading history summary for admin view
CREATE TABLE IF NOT EXISTS user_trading_stats (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trading activity
    total_trades INTEGER DEFAULT 0,
    total_volume DECIMAL(20, 8) DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    
    -- PnL
    total_realized_pnl DECIMAL(20, 8) DEFAULT 0,
    total_unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
    
    -- Current positions
    open_positions_count INTEGER DEFAULT 0,
    open_positions_value DECIMAL(20, 8) DEFAULT 0,
    
    -- Risk metrics
    max_drawdown DECIMAL(20, 8) DEFAULT 0,
    avg_position_size DECIMAL(20, 8) DEFAULT 0,
    avg_trade_duration INTERVAL,
    
    -- Last activity
    last_trade_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_status ON user_kyc_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_tier ON user_kyc_profiles(verification_tier);
CREATE INDEX IF NOT EXISTS idx_user_status ON user_status(account_status);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_user ON position_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notes_user ON user_internal_notes(user_id);

-- Enable RLS
ALTER TABLE user_kyc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all KYC profiles"
    ON user_kyc_profiles FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Users can view own KYC profile"
    ON user_kyc_profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Admins can modify KYC profiles"
    ON user_kyc_profiles FOR ALL
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins can view all user status"
    ON user_status FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins can modify user status"
    ON user_status FOR ALL
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins can view audit logs"
    ON admin_audit_log FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins can create audit logs"
    ON admin_audit_log FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins can view interventions"
    ON position_interventions FOR SELECT
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins can create interventions"
    ON position_interventions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Log admin action with audit trail
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action VARCHAR(100),
    p_action_category VARCHAR(50),
    p_target_user_id UUID,
    p_previous_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_requires_dual_auth BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_admin_name VARCHAR(255);
    v_target_email VARCHAR(255);
BEGIN
    -- Get admin name
    SELECT full_name INTO v_admin_name 
    FROM user_profiles WHERE id = p_admin_id;
    
    -- Get target user email
    SELECT email INTO v_target_email
    FROM auth.users WHERE id = p_target_user_id;
    
    INSERT INTO admin_audit_log (
        admin_id,
        admin_name,
        action,
        action_category,
        target_user_id,
        target_user_email,
        previous_value,
        new_value,
        reason,
        requires_dual_auth,
        ip_address,
        user_agent
    ) VALUES (
        p_admin_id,
        v_admin_name,
        p_action,
        p_action_category,
        p_target_user_id,
        v_target_email,
        p_previous_value,
        p_new_value,
        p_reason,
        p_requires_dual_auth,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user status with dual authorization
CREATE OR REPLACE FUNCTION update_user_status(
    p_admin_id UUID,
    p_user_id UUID,
    p_status_changes JSONB,
    p_reason TEXT,
    p_dual_auth_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_requires_dual BOOLEAN;
    v_previous_status JSONB;
    v_log_id UUID;
BEGIN
    -- Check if changes require dual authorization
    v_requires_dual := (p_status_changes->>'account_status') IN ('suspended', 'banned') 
        OR (p_status_changes->>'can_trade')::boolean = FALSE;
    
    -- Get previous status
    SELECT to_jsonb(user_status) INTO v_previous_status
    FROM user_status WHERE id = p_user_id;
    
    -- If dual auth required and not provided, create pending log
    IF v_requires_dual AND p_dual_auth_admin_id IS NULL THEN
        v_log_id := log_admin_action(
            p_admin_id,
            'status_change_pending',
            'status',
            p_user_id,
            v_previous_status,
            p_status_changes,
            p_reason,
            TRUE
        );
        
        -- Notify that dual auth is required
        RAISE EXCEPTION 'Dual authorization required for this action. Log ID: %', v_log_id;
    END IF;
    
    -- Apply changes
    UPDATE user_status SET
        account_status = COALESCE(p_status_changes->>'account_status', account_status),
        can_trade = COALESCE((p_status_changes->>'can_trade')::boolean, can_trade),
        can_deposit = COALESCE((p_status_changes->>'can_deposit')::boolean, can_deposit),
        can_withdraw = COALESCE((p_status_changes->>'can_withdraw')::boolean, can_withdraw),
        trading_restricted_until = COALESCE((p_status_changes->>'trading_restricted_until')::timestamptz, trading_restricted_until),
        restriction_reason = COALESCE(p_status_changes->>'restriction_reason', restriction_reason),
        restriction_notes = COALESCE(p_status_changes->>'restriction_notes', restriction_notes),
        suspended_at = CASE WHEN p_status_changes->>'account_status' = 'suspended' THEN NOW() ELSE suspended_at END,
        suspended_by = CASE WHEN p_status_changes->>'account_status' = 'suspended' THEN p_admin_id ELSE suspended_by END,
        suspension_reason = CASE WHEN p_status_changes->>'account_status' = 'suspended' THEN p_reason ELSE suspension_reason END,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log the action
    PERFORM log_admin_action(
        p_admin_id,
        'status_change',
        'status',
        p_user_id,
        v_previous_status,
        p_status_changes,
        p_reason,
        v_requires_dual
    );
    
    -- If dual auth was used, update the log
    IF p_dual_auth_admin_id IS NOT NULL THEN
        UPDATE admin_audit_log 
        SET dual_auth_admin_id = p_dual_auth_admin_id,
            dual_auth_at = NOW()
        WHERE id = v_log_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Perform position intervention
CREATE OR REPLACE FUNCTION perform_position_intervention(
    p_admin_id UUID,
    p_user_id UUID,
    p_position_id UUID,
    p_intervention_type VARCHAR(50),
    p_reason TEXT,
    p_send_notification BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
    v_intervention_id UUID;
BEGIN
    -- Create intervention record
    INSERT INTO position_interventions (
        user_id,
        position_id,
        intervention_type,
        reason,
        performed_by,
        notification_sent
    ) VALUES (
        p_user_id,
        p_position_id,
        p_intervention_type,
        p_reason,
        p_admin_id,
        p_send_notification
    )
    RETURNING id INTO v_intervention_id;
    
    -- Log admin action
    PERFORM log_admin_action(
        p_admin_id,
        'position_intervention',
        'position',
        p_user_id,
        NULL,
        jsonb_build_object(
            'intervention_id', v_intervention_id,
            'intervention_type', p_intervention_type,
            'position_id', p_position_id
        ),
        p_reason,
        FALSE
    );
    
    -- Send notification if requested
    IF p_send_notification THEN
        -- This would integrate with notification system
        UPDATE position_interventions
        SET notification_sent = TRUE,
            notification_sent_at = NOW()
        WHERE id = v_intervention_id;
    END IF;
    
    RETURN v_intervention_id;
END;
$$ LANGUAGE plpgsql;

-- Get user full profile for admin view
CREATE OR REPLACE FUNCTION get_user_admin_profile(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    full_name VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    kyc_status VARCHAR,
    verification_tier VARCHAR,
    account_status VARCHAR,
    can_trade BOOLEAN,
    can_deposit BOOLEAN,
    can_withdraw BOOLEAN,
    risk_score INTEGER,
    total_trades INTEGER,
    total_volume DECIMAL,
    total_realized_pnl DECIMAL,
    open_positions_count INTEGER,
    open_positions_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        up.full_name,
        u.created_at,
        u.last_sign_in_at,
        ukp.verification_status,
        ukp.verification_tier,
        us.account_status,
        us.can_trade,
        us.can_deposit,
        us.can_withdraw,
        ukp.risk_score,
        COALESCE(uts.total_trades, 0),
        COALESCE(uts.total_volume, 0),
        COALESCE(uts.total_realized_pnl, 0),
        COALESCE(uts.open_positions_count, 0),
        COALESCE(uts.open_positions_value, 0)
    FROM auth.users u
    LEFT JOIN user_profiles up ON up.id = u.id
    LEFT JOIN user_kyc_profiles ukp ON ukp.id = u.id
    LEFT JOIN user_status us ON us.id = u.id
    LEFT JOIN user_trading_stats uts ON uts.id = u.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Search users for admin
CREATE OR REPLACE FUNCTION search_users(
    p_query TEXT,
    p_status_filter VARCHAR DEFAULT NULL,
    p_kyc_filter VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    full_name VARCHAR,
    account_status VARCHAR,
    kyc_status VARCHAR,
    verification_tier VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    total_matches BIGINT
) AS $$
DECLARE
    v_total BIGINT;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO v_total
    FROM auth.users u
    LEFT JOIN user_profiles up ON up.id = u.id
    LEFT JOIN user_kyc_profiles ukp ON ukp.id = u.id
    LEFT JOIN user_status us ON us.id = u.id
    WHERE (
        u.email ILIKE '%' || p_query || '%'
        OR up.full_name ILIKE '%' || p_query || '%'
        OR u.id::text = p_query
    )
    AND (p_status_filter IS NULL OR us.account_status = p_status_filter)
    AND (p_kyc_filter IS NULL OR ukp.verification_status = p_kyc_filter);
    
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        up.full_name,
        us.account_status,
        ukp.verification_status,
        ukp.verification_tier,
        u.created_at,
        v_total
    FROM auth.users u
    LEFT JOIN user_profiles up ON up.id = u.id
    LEFT JOIN user_kyc_profiles ukp ON ukp.id = u.id
    LEFT JOIN user_status us ON us.id = u.id
    WHERE (
        u.email ILIKE '%' || p_query || '%'
        OR up.full_name ILIKE '%' || p_query || '%'
        OR u.id::text = p_query
    )
    AND (p_status_filter IS NULL OR us.account_status = p_status_filter)
    AND (p_kyc_filter IS NULL OR ukp.verification_status = p_kyc_filter)
    ORDER BY u.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create support ticket
CREATE OR REPLACE FUNCTION create_support_ticket(
    p_user_id UUID,
    p_subject VARCHAR,
    p_description TEXT,
    p_category VARCHAR,
    p_priority VARCHAR DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    v_ticket_id UUID;
    v_ticket_number VARCHAR(50);
BEGIN
    -- Generate ticket number
    v_ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || substring(md5(random()::text), 1, 6);
    
    INSERT INTO support_tickets (
        ticket_number,
        user_id,
        subject,
        description,
        category,
        priority
    ) VALUES (
        v_ticket_number,
        p_user_id,
        p_subject,
        p_description,
        p_category,
        p_priority
    )
    RETURNING id INTO v_ticket_id;
    
    -- Create initial message
    INSERT INTO support_ticket_messages (
        ticket_id,
        sender_id,
        sender_type,
        message
    ) VALUES (
        v_ticket_id,
        p_user_id,
        'user',
        p_description
    );
    
    RETURN v_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kyc_profiles_updated_at
    BEFORE UPDATE ON user_kyc_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_status_updated_at
    BEFORE UPDATE ON user_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_internal_notes_updated_at
    BEFORE UPDATE ON user_internal_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
