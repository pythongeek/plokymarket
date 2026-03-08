-- ===================================
-- USER FOLLOWS SYSTEM & FEED ENHANCEMENT
-- ===================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS follow_requests CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS market_follows CASCADE;

-- ===================================
-- USER FOLLOWS TABLE
-- ===================================
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notification_preferences JSONB DEFAULT '{
        "trades": true,
        "comments": true,
        "market_creations": true,
        "achievements": true
    }'::jsonb,
    
    -- Prevent self-follows
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    -- Prevent duplicate follows
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Indexes for user follows
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created ON user_follows(created_at);

-- ===================================
-- FOLLOW REQUESTS TABLE (for approved visibility)
-- ===================================
CREATE TABLE follow_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    -- Prevent self-requests
    CONSTRAINT no_self_request CHECK (requester_id != target_id),
    -- Prevent duplicate pending requests
    CONSTRAINT unique_pending_request UNIQUE (requester_id, target_id, status)
);

-- Indexes for follow requests
CREATE INDEX idx_follow_requests_target ON follow_requests(target_id, status);
CREATE INDEX idx_follow_requests_requester ON follow_requests(requester_id);

-- ===================================
-- MARKET FOLLOWS TABLE
-- ===================================
CREATE TABLE market_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notification_preferences JSONB DEFAULT '{
        "price_movements": true,
        "volume_spikes": true,
        "resolutions": true,
        "news": true
    }'::jsonb,
    
    -- Prevent duplicate follows
    CONSTRAINT unique_market_follow UNIQUE (user_id, market_id)
);

-- Indexes for market follows
CREATE INDEX idx_market_follows_user ON market_follows(user_id);
CREATE INDEX idx_market_follows_market ON market_follows(market_id);

-- ===================================
-- USER PRIVACY SETTINGS
-- ===================================
-- Add privacy tier to users table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'privacy_tier'
    ) THEN
        ALTER TABLE users ADD COLUMN privacy_tier VARCHAR(20) DEFAULT 'public' 
            CHECK (privacy_tier IN ('public', 'approved', 'private', 'anonymous'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'follower_count'
    ) THEN
        ALTER TABLE users ADD COLUMN follower_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'following_count'
    ) THEN
        ALTER TABLE users ADD COLUMN following_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'max_followers'
    ) THEN
        ALTER TABLE users ADD COLUMN max_followers INTEGER DEFAULT 1000;
    END IF;
END $$;

-- ===================================
-- FUNCTIONS FOR FOLLOW OPERATIONS
-- ===================================

-- Function to follow a user
CREATE OR REPLACE FUNCTION follow_user(
    p_follower_id UUID,
    p_following_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_privacy VARCHAR(20);
    v_follower_count INTEGER;
    v_max_followers INTEGER;
    v_existing_request UUID;
    v_result JSONB;
BEGIN
    -- Check if target user exists and get their privacy setting
    SELECT privacy_tier, follower_count, max_followers 
    INTO v_target_privacy, v_follower_count, v_max_followers
    FROM users WHERE id = p_following_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Check follower limit
    IF v_follower_count >= v_max_followers THEN
        RETURN jsonb_build_object('success', false, 'error', 'User has reached follower limit');
    END IF;
    
    -- Handle based on privacy tier
    CASE v_target_privacy
        WHEN 'private' THEN
            RETURN jsonb_build_object('success', false, 'error', 'User does not accept followers');
            
        WHEN 'approved' THEN
            -- Check for existing pending request
            SELECT id INTO v_existing_request
            FROM follow_requests
            WHERE requester_id = p_follower_id 
              AND target_id = p_following_id 
              AND status = 'pending';
              
            IF v_existing_request IS NOT NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Follow request already pending');
            END IF;
            
            -- Create follow request
            INSERT INTO follow_requests (requester_id, target_id)
            VALUES (p_follower_id, p_following_id);
            
            RETURN jsonb_build_object('success', true, 'status', 'pending_approval');
            
        ELSE -- public or anonymous
            -- Direct follow
            INSERT INTO user_follows (follower_id, following_id)
            VALUES (p_follower_id, p_following_id)
            ON CONFLICT (follower_id, following_id) DO NOTHING;
            
            -- Update counts
            UPDATE users SET follower_count = follower_count + 1 WHERE id = p_following_id;
            UPDATE users SET following_count = following_count + 1 WHERE id = p_follower_id;
            
            RETURN jsonb_build_object('success', true, 'status', 'following');
    END CASE;
END;
$$;

-- Function to unfollow a user
CREATE OR REPLACE FUNCTION unfollow_user(
    p_follower_id UUID,
    p_following_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM user_follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id;
    
    IF FOUND THEN
        UPDATE users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = p_following_id;
        UPDATE users SET following_count = GREATEST(0, following_count - 1) WHERE id = p_follower_id;
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Not following this user');
    END IF;
END;
$$;

-- Function to handle follow request response
CREATE OR REPLACE FUNCTION respond_to_follow_request(
    p_request_id UUID,
    p_target_id UUID,
    p_approve BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requester_id UUID;
BEGIN
    SELECT requester_id INTO v_requester_id
    FROM follow_requests
    WHERE id = p_request_id AND target_id = p_target_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found');
    END IF;
    
    IF p_approve THEN
        -- Update request status
        UPDATE follow_requests 
        SET status = 'approved', responded_at = NOW()
        WHERE id = p_request_id;
        
        -- Create follow relationship
        INSERT INTO user_follows (follower_id, following_id)
        VALUES (v_requester_id, p_target_id)
        ON CONFLICT (follower_id, following_id) DO NOTHING;
        
        -- Update counts
        UPDATE users SET follower_count = follower_count + 1 WHERE id = p_target_id;
        UPDATE users SET following_count = following_count + 1 WHERE id = v_requester_id;
        
        RETURN jsonb_build_object('success', true, 'status', 'approved');
    ELSE
        UPDATE follow_requests 
        SET status = 'rejected', responded_at = NOW()
        WHERE id = p_request_id;
        
        RETURN jsonb_build_object('success', true, 'status', 'rejected');
    END IF;
END;
$$;

-- Function to follow a market
CREATE OR REPLACE FUNCTION follow_market(
    p_user_id UUID,
    p_market_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO market_follows (user_id, market_id)
    VALUES (p_user_id, p_market_id)
    ON CONFLICT (user_id, market_id) DO NOTHING;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Already following this market');
    END IF;
END;
$$;

-- Function to unfollow a market
CREATE OR REPLACE FUNCTION unfollow_market(
    p_user_id UUID,
    p_market_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM market_follows 
    WHERE user_id = p_user_id AND market_id = p_market_id;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Not following this market');
    END IF;
END;
$$;

-- Function to get follow status
CREATE OR REPLACE FUNCTION get_follow_status(
    p_follower_id UUID,
    p_following_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_following BOOLEAN;
    v_has_pending_request BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM user_follows 
        WHERE follower_id = p_follower_id AND following_id = p_following_id
    ) INTO v_is_following;
    
    SELECT EXISTS(
        SELECT 1 FROM follow_requests 
        WHERE requester_id = p_follower_id 
          AND target_id = p_following_id 
          AND status = 'pending'
    ) INTO v_has_pending_request;
    
    RETURN jsonb_build_object(
        'is_following', v_is_following,
        'has_pending_request', v_has_pending_request
    );
END;
$$;

-- ===================================
-- ENHANCED ACTIVITY GENERATION
-- ===================================

-- Function to log market movement activity
CREATE OR REPLACE FUNCTION log_market_movement_activity(
    p_market_id UUID,
    p_user_id UUID,
    p_movement_type VARCHAR(50),
    p_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_activity_id UUID;
    v_follower_id UUID;
BEGIN
    -- Create activity for the user who triggered it
    INSERT INTO activities (
        user_id,
        type,
        priority,
        algorithmic_weight,
        data,
        is_global
    ) VALUES (
        p_user_id,
        'market_movement',
        'high',
        90,
        p_data || jsonb_build_object('marketId', p_market_id, 'movementType', p_movement_type),
        false
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_activity_id;
    
    -- Create activities for followers of this market
    FOR v_follower_id IN 
        SELECT user_id FROM market_follows WHERE market_id = p_market_id
    LOOP
        INSERT INTO activities (
            user_id,
            type,
            priority,
            algorithmic_weight,
            data,
            is_global,
            source_user_id
        ) VALUES (
            v_follower_id,
            'market_movement',
            'high',
            90,
            p_data || jsonb_build_object('marketId', p_market_id, 'movementType', p_movement_type),
            false,
            p_user_id
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN v_activity_id;
END;
$$;

-- Function to log trader activity
CREATE OR REPLACE FUNCTION log_trader_activity(
    p_trader_id UUID,
    p_activity_type VARCHAR(50),
    p_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_follower_id UUID;
BEGIN
    -- Create activities for followers of this trader
    FOR v_follower_id IN 
        SELECT follower_id FROM user_follows WHERE following_id = p_trader_id
    LOOP
        INSERT INTO activities (
            user_id,
            type,
            priority,
            algorithmic_weight,
            data,
            is_global,
            source_user_id
        ) VALUES (
            v_follower_id,
            'trader_activity',
            'medium',
            60,
            p_data || jsonb_build_object('traderId', p_trader_id, 'activityType', p_activity_type),
            false,
            p_trader_id
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;

-- Function to create new follower notification
CREATE OR REPLACE FUNCTION create_follower_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create notification for the user being followed
    INSERT INTO notifications (
        user_id,
        sender_id,
        type,
        data
    ) VALUES (
        NEW.following_id,
        NEW.follower_id,
        'new_follower',
        jsonb_build_object(
            'followerId', NEW.follower_id,
            'followedAt', NEW.created_at
        )
    );
    
    -- Create activity for the followed user
    INSERT INTO activities (
        user_id,
        type,
        priority,
        algorithmic_weight,
        data,
        is_global,
        source_user_id
    ) VALUES (
        NEW.following_id,
        'follow',
        'medium',
        50,
        jsonb_build_object(
            'followerId', NEW.follower_id,
            'followType', 'new_follower'
        ),
        false,
        NEW.follower_id
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new follower notifications
DROP TRIGGER IF EXISTS on_new_follower ON user_follows;
CREATE TRIGGER on_new_follower
    AFTER INSERT ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION create_follower_notification();

-- ===================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_follows ENABLE ROW LEVEL SECURITY;

-- User follows policies
CREATE POLICY "Users can view their own follows"
    ON user_follows FOR SELECT
    USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create their own follows"
    ON user_follows FOR INSERT
    WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete their own follows"
    ON user_follows FOR DELETE
    USING (follower_id = auth.uid());

-- Follow requests policies
CREATE POLICY "Users can view their follow requests"
    ON follow_requests FOR SELECT
    USING (requester_id = auth.uid() OR target_id = auth.uid());

CREATE POLICY "Users can create follow requests"
    ON follow_requests FOR INSERT
    WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Target users can update requests"
    ON follow_requests FOR UPDATE
    USING (target_id = auth.uid());

-- Market follows policies
CREATE POLICY "Users can view their market follows"
    ON market_follows FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their market follows"
    ON market_follows FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their market follows"
    ON market_follows FOR DELETE
    USING (user_id = auth.uid());

-- ===================================
-- GRANT PERMISSIONS
-- ===================================
GRANT ALL ON user_follows TO authenticated;
GRANT ALL ON follow_requests TO authenticated;
GRANT ALL ON market_follows TO authenticated;
GRANT EXECUTE ON FUNCTION follow_user TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_user TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_follow_request TO authenticated;
GRANT EXECUTE ON FUNCTION follow_market TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_market TO authenticated;
GRANT EXECUTE ON FUNCTION get_follow_status TO authenticated;
GRANT EXECUTE ON FUNCTION log_market_movement_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_trader_activity TO authenticated;
