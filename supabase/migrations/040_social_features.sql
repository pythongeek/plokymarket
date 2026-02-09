-- ============================================================
-- PLOKYMARKET ADVANCED SOCIAL FEATURES MIGRATION
-- Comprehensive social system with comments, reputation, moderation
-- Migration: 040_social_features.sql
-- ============================================================

BEGIN;

-- ===================================
-- PART 1: ENUMS
-- ===================================

-- Sentiment types for comments
DO $$ BEGIN
    CREATE TYPE public.sentiment_type AS ENUM ('positive', 'negative', 'neutral', 'mixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vote types for comments
DO $$ BEGIN
    CREATE TYPE public.vote_type AS ENUM ('upvote', 'downvote');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Flag reasons for community moderation
DO $$ BEGIN
    CREATE TYPE public.flag_reason AS ENUM (
        'spam', 
        'harassment', 
        'misinformation', 
        'off_topic', 
        'hate_speech', 
        'self_harm', 
        'violence', 
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Moderation status
DO $$ BEGIN
    CREATE TYPE public.moderation_status AS ENUM (
        'pending_review',
        'approved',
        'rejected',
        'auto_approved',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Badge categories
DO $$ BEGIN
    CREATE TYPE public.badge_category AS ENUM (
        'accuracy',
        'volume',
        'streak',
        'community',
        'special',
        'expert'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Badge rarity levels
DO $$ BEGIN
    CREATE TYPE public.badge_rarity AS ENUM (
        'common',
        'uncommon',
        'rare',
        'epic',
        'legendary'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Accuracy tiers for reputation
DO $$ BEGIN
    CREATE TYPE public.accuracy_tier AS ENUM (
        'novice',        -- 0-40%
        'apprentice',    -- 40-55%
        'predictor',     -- 55-65%
        'analyst',       -- 65-75%
        'expert',        -- 75-85%
        'oracle'         -- 85%+
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content types for activities
DO $$ BEGIN
    CREATE TYPE public.content_type AS ENUM (
        'trade',
        'comment',
        'prediction',
        'badge_earned',
        'follow',
        'market_create',
        'market_resolve',
        'achievement'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Attachment types for comments
DO $$ BEGIN
    CREATE TYPE public.attachment_type AS ENUM ('image', 'link', 'gif', 'file');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================
-- PART 2: COMMENTS ENHANCEMENT TABLES
-- ===================================

-- Enhanced market comments table with threading and moderation
CREATE TABLE IF NOT EXISTS public.market_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.market_comments(id) ON DELETE CASCADE,
    
    -- Content
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
    content_plain TEXT, -- Plain text version for search/display
    
    -- Threading
    depth_level INTEGER DEFAULT 0 CHECK (depth_level >= 0 AND depth_level <= 10),
    is_collapsed BOOLEAN DEFAULT FALSE,
    
    -- Voting (separate upvotes/downvotes for transparency)
    upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
    downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
    score NUMERIC(10, 4) DEFAULT 0, -- Weighted by reputation
    
    -- Sentiment analysis
    sentiment sentiment_type DEFAULT 'neutral',
    sentiment_confidence NUMERIC(4, 3) DEFAULT 0.5 CHECK (sentiment_confidence >= 0 AND sentiment_confidence <= 1),
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0 CHECK (flag_count >= 0),
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_reason TEXT,
    deleted_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT no_self_parent CHECK (id != parent_id),
    CONSTRAINT max_depth CHECK (depth_level <= 10)
);

-- Comment votes table with reputation weight tracking
CREATE TABLE IF NOT EXISTS public.comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.market_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    
    -- Reputation context at time of vote
    voter_reputation_score NUMERIC(10, 2) DEFAULT 0,
    vote_weight NUMERIC(5, 2) DEFAULT 1.0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(comment_id, user_id)
);

-- Comment flags for community moderation
CREATE TABLE IF NOT EXISTS public.comment_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.market_comments(id) ON DELETE CASCADE,
    flagged_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    flag_reason flag_reason NOT NULL,
    flag_details TEXT,
    
    -- Review status
    is_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    action_taken VARCHAR(50), -- 'dismissed', 'comment_removed', 'user_warned', 'user_banned'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(comment_id, flagged_by)
);

-- Comment attachments for rich content
CREATE TABLE IF NOT EXISTS public.comment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.market_comments(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL,
    
    -- URL and metadata
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    
    -- Safety
    is_safe BOOLEAN DEFAULT TRUE,
    safety_checked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- PART 3: REPUTATION & EXPERT BADGES TABLES
-- ===================================

-- User reputation tracking
CREATE TABLE IF NOT EXISTS public.user_reputation (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Prediction accuracy metrics
    prediction_accuracy NUMERIC(5, 2) DEFAULT 0 CHECK (prediction_accuracy >= 0 AND prediction_accuracy <= 100),
    total_predictions INTEGER DEFAULT 0 CHECK (total_predictions >= 0),
    correct_predictions INTEGER DEFAULT 0 CHECK (correct_predictions >= 0),
    
    -- Weighted reputation score (0-10000)
    reputation_score NUMERIC(10, 2) DEFAULT 0 CHECK (reputation_score >= 0),
    
    -- Accuracy tier classification
    accuracy_tier accuracy_tier DEFAULT 'novice',
    
    -- Additional metrics
    markets_participated INTEGER DEFAULT 0,
    avg_position_size NUMERIC(15, 2) DEFAULT 0,
    total_profit_loss NUMERIC(15, 2) DEFAULT 0,
    
    -- Streak tracking
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    
    -- Social metrics contribution
    helpful_votes_received INTEGER DEFAULT 0,
    quality_comments_count INTEGER DEFAULT 0,
    
    -- Tier progression tracking
    tier_at DATE DEFAULT CURRENT_DATE,
    tier_history JSONB DEFAULT '[]'::jsonb,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert badges definition table
CREATE TABLE IF NOT EXISTS public.expert_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    short_description VARCHAR(255),
    
    -- Visual
    icon_url TEXT NOT NULL,
    icon_color VARCHAR(7) DEFAULT '#6366F1', -- Hex color
    animation_url TEXT, -- For special badges
    
    -- Categorization
    category badge_category NOT NULL,
    rarity badge_rarity DEFAULT 'common',
    
    -- Requirements
    min_accuracy NUMERIC(5, 2), -- Minimum accuracy % required
    min_predictions INTEGER DEFAULT 0,
    min_reputation_score NUMERIC(10, 2) DEFAULT 0,
    required_badges UUID[] DEFAULT '{}', -- Prerequisite badges
    
    -- Verification
    verification_required BOOLEAN DEFAULT FALSE,
    verification_type VARCHAR(50), -- 'manual', 'ai_verified', 'community'
    
    -- Rewards
    reputation_bonus NUMERIC(10, 2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_limited BOOLEAN DEFAULT FALSE,
    max_recipients INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-badge associations
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.expert_badges(id) ON DELETE CASCADE,
    
    -- Award details
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_by UUID REFERENCES public.users(id) ON DELETE SET NULL, -- NULL for auto-awarded
    award_reason TEXT,
    
    -- Display preferences
    is_displayed BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    -- Verification proof
    verification_proof JSONB DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ,
    
    UNIQUE(user_id, badge_id)
);

-- User follows for social connections
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Notification preferences
    notify_on_trade BOOLEAN DEFAULT TRUE,
    notify_on_prediction BOOLEAN DEFAULT TRUE,
    notify_on_comment BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ===================================
-- PART 4: ACTIVITY FEED TABLES
-- ===================================

-- Enhanced activities table (extends existing)
-- First, add new columns to existing activities table if they exist
DO $$
BEGIN
    -- Check if activities table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
        -- Add algorithmic weight column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'activities' AND column_name = 'algorithmic_weight') THEN
            ALTER TABLE public.activities 
            ADD COLUMN algorithmic_weight NUMERIC(5, 2) DEFAULT 1.0,
            ADD COLUMN content_type content_type DEFAULT 'trade',
            ADD COLUMN is_read BOOLEAN DEFAULT FALSE,
            ADD COLUMN priority_score NUMERIC(10, 4) DEFAULT 0,
            ADD COLUMN expires_at TIMESTAMPTZ,
            ADD COLUMN is_highlighted BOOLEAN DEFAULT FALSE,
            ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        END IF;
    END IF;
END $$;

-- Feed preferences for user customization
CREATE TABLE IF NOT EXISTS public.feed_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Content type preferences (0-100 sliders)
    trade_content_weight INTEGER DEFAULT 100 CHECK (trade_content_weight BETWEEN 0 AND 100),
    comment_content_weight INTEGER DEFAULT 80 CHECK (comment_content_weight BETWEEN 0 AND 100),
    prediction_content_weight INTEGER DEFAULT 90 CHECK (prediction_content_weight BETWEEN 0 AND 100),
    badge_content_weight INTEGER DEFAULT 70 CHECK (badge_content_weight BETWEEN 0 AND 100),
    
    -- Algorithm settings
    chronologic_bias INTEGER DEFAULT 30 CHECK (chronologic_bias BETWEEN 0 AND 100),
    popularity_bias INTEGER DEFAULT 40 CHECK (popularity_bias BETWEEN 0 AND 100),
    reputation_bias INTEGER DEFAULT 30 CHECK (reputation_bias BETWEEN 0 AND 100),
    
    -- Filtering
    muted_keywords TEXT[] DEFAULT '{}',
    muted_users UUID[] DEFAULT '{}',
    muted_markets UUID[] DEFAULT '{}',
    
    -- Minimum thresholds
    min_user_reputation NUMERIC(10, 2) DEFAULT 0,
    min_activity_engagement INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity aggregations for batched content
CREATE TABLE IF NOT EXISTS public.activity_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Aggregation grouping
    aggregation_type VARCHAR(50) NOT NULL, -- 'daily_summary', 'market_update', 'user_milestone'
    aggregation_key VARCHAR(255) NOT NULL, -- e.g., "user_id:2024-01-01" or "market_id:weekly"
    
    -- Content
    title TEXT NOT NULL,
    description TEXT,
    aggregated_count INTEGER DEFAULT 0,
    
    -- Related activities (JSON array of activity IDs)
    activity_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Preview data
    preview_data JSONB DEFAULT '{}'::jsonb,
    
    -- Algorithmic scoring
    priority_score NUMERIC(10, 4) DEFAULT 0,
    
    -- Target audience
    target_user_ids UUID[] DEFAULT '{}', -- Empty = public
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    UNIQUE(aggregation_type, aggregation_key)
);

-- ===================================
-- PART 5: MODERATION TABLES
-- ===================================

-- Comment moderation queue for AI toxicity review
CREATE TABLE IF NOT EXISTS public.comment_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.market_comments(id) ON DELETE CASCADE,
    
    -- AI Analysis
    toxicity_score NUMERIC(4, 3) CHECK (toxicity_score >= 0 AND toxicity_score <= 1),
    sentiment_score NUMERIC(4, 3) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    
    -- Category flags from AI
    is_spam BOOLEAN DEFAULT FALSE,
    is_harassment BOOLEAN DEFAULT FALSE,
    is_misinformation BOOLEAN DEFAULT FALSE,
    is_hate_speech BOOLEAN DEFAULT FALSE,
    is_self_harm BOOLEAN DEFAULT FALSE,
    is_violence BOOLEAN DEFAULT FALSE,
    
    -- Confidence scores for each category
    category_scores JSONB DEFAULT '{}'::jsonb,
    
    -- Queue status
    status moderation_status DEFAULT 'pending_review',
    
    -- Review details
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Auto-actions taken
    auto_action VARCHAR(50), -- 'none', 'flagged', 'hidden', 'removed'
    confidence_threshold NUMERIC(4, 3) DEFAULT 0.8,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(comment_id)
);

-- User moderation status for tracking flagged users
CREATE TABLE IF NOT EXISTS public.user_moderation_status (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Overall status
    status VARCHAR(50) DEFAULT 'good_standing', -- 'good_standing', 'warned', 'limited', 'suspended', 'banned'
    
    -- Strikes system
    total_strikes INTEGER DEFAULT 0 CHECK (total_strikes >= 0),
    active_strikes INTEGER DEFAULT 0 CHECK (active_strikes >= 0),
    last_strike_at TIMESTAMPTZ,
    strike_expiry_date TIMESTAMPTZ,
    
    -- Restrictions
    is_comment_banned BOOLEAN DEFAULT FALSE,
    comment_ban_until TIMESTAMPTZ,
    is_trade_limited BOOLEAN DEFAULT FALSE,
    trade_limit_reason TEXT,
    
    -- Flag statistics
    comments_flagged INTEGER DEFAULT 0,
    comments_removed INTEGER DEFAULT 0,
    flags_filed INTEGER DEFAULT 0,
    valid_flags_filed INTEGER DEFAULT 0,
    
    -- Review tracking
    requires_review BOOLEAN DEFAULT FALSE,
    review_priority INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Appeals
    appeal_count INTEGER DEFAULT 0,
    last_appeal_at TIMESTAMPTZ,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation action log for audit trail
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action details
    action_type VARCHAR(50) NOT NULL, -- 'warn', 'strike', 'suspend', 'ban', 'unban', 'remove_comment', etc.
    action_reason TEXT NOT NULL,
    
    -- Target
    target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_comment_id UUID REFERENCES public.market_comments(id) ON DELETE SET NULL,
    
    -- Actor
    acted_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_auto_action BOOLEAN DEFAULT FALSE, -- TRUE for AI/system actions
    
    -- Context
    related_flags UUID[] DEFAULT '{}',
    evidence JSONB DEFAULT '{}'::jsonb,
    
    -- Duration (for temporary actions)
    duration_hours INTEGER,
    expires_at TIMESTAMPTZ,
    
    -- Appeal status
    is_appealed BOOLEAN DEFAULT FALSE,
    appeal_resolved_at TIMESTAMPTZ,
    appeal_resolution TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- PART 6: INDEXES FOR PERFORMANCE
-- ===================================

-- Market comments indexes
CREATE INDEX IF NOT EXISTS idx_market_comments_market_id ON public.market_comments(market_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_market_created ON public.market_comments(market_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_comments_parent_id ON public.market_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_market_comments_user_id ON public.market_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_depth ON public.market_comments(depth_level);
CREATE INDEX IF NOT EXISTS idx_market_comments_score ON public.market_comments(score DESC);
CREATE INDEX IF NOT EXISTS idx_market_comments_flagged ON public.market_comments(is_flagged) WHERE is_flagged = TRUE;
CREATE INDEX IF NOT EXISTS idx_market_comments_deleted ON public.market_comments(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_market_comments_sentiment ON public.market_comments(sentiment) WHERE sentiment != 'neutral';

-- Comment votes indexes
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON public.comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON public.comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_type ON public.comment_votes(vote_type);

-- Comment flags indexes
CREATE INDEX IF NOT EXISTS idx_comment_flags_comment_id ON public.comment_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_flags_reviewed ON public.comment_flags(is_reviewed) WHERE is_reviewed = FALSE;
CREATE INDEX IF NOT EXISTS idx_comment_flags_reason ON public.comment_flags(flag_reason);

-- Comment attachments indexes
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON public.comment_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_type ON public.comment_attachments(attachment_type);

-- User reputation indexes
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON public.user_reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_accuracy ON public.user_reputation(prediction_accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_tier ON public.user_reputation(accuracy_tier);

-- Expert badges indexes
CREATE INDEX IF NOT EXISTS idx_expert_badges_category ON public.expert_badges(category);
CREATE INDEX IF NOT EXISTS idx_expert_badges_rarity ON public.expert_badges(rarity);
CREATE INDEX IF NOT EXISTS idx_expert_badges_active ON public.expert_badges(is_active) WHERE is_active = TRUE;

-- User badges indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_displayed ON public.user_badges(user_id, is_displayed) WHERE is_displayed = TRUE;

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_pair ON public.user_follows(follower_id, following_id);

-- Activity feed indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'activities' AND column_name = 'priority_score') THEN
        CREATE INDEX IF NOT EXISTS idx_activities_priority ON public.activities(priority_score DESC);
        CREATE INDEX IF NOT EXISTS idx_activities_content_type ON public.activities(content_type);
        CREATE INDEX IF NOT EXISTS idx_activities_is_read ON public.activities(is_read) WHERE is_read = FALSE;
    END IF;
END $$;

-- Activity aggregations indexes
CREATE INDEX IF NOT EXISTS idx_activity_aggregations_type_key ON public.activity_aggregations(aggregation_type, aggregation_key);
CREATE INDEX IF NOT EXISTS idx_activity_aggregations_priority ON public.activity_aggregations(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_activity_aggregations_expires ON public.activity_aggregations(expires_at);

-- Moderation queue indexes
CREATE INDEX IF NOT EXISTS idx_comment_moderation_status ON public.comment_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_comment_moderation_toxicity ON public.comment_moderation_queue(toxicity_score DESC);
CREATE INDEX IF NOT EXISTS idx_comment_moderation_created ON public.comment_moderation_queue(created_at);

-- User moderation indexes
CREATE INDEX IF NOT EXISTS idx_user_moderation_status ON public.user_moderation_status(status);
CREATE INDEX IF NOT EXISTS idx_user_moderation_review ON public.user_moderation_status(requires_review) WHERE requires_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_moderation_strikes ON public.user_moderation_status(active_strikes DESC);

-- Moderation actions indexes
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user ON public.moderation_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON public.moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON public.moderation_actions(created_at DESC);

-- ===================================
-- PART 7: FUNCTIONS
-- ===================================

-- Function to calculate weighted comment score
CREATE OR REPLACE FUNCTION public.calculate_comment_weighted_score(
    p_upvotes INTEGER,
    p_downvotes INTEGER,
    p_author_reputation NUMERIC DEFAULT 0
)
RETURNS NUMERIC AS $$
DECLARE
    v_raw_score INTEGER;
    v_engagement INTEGER;
    v_reputation_multiplier NUMERIC;
    v_time_decay NUMERIC;
    v_final_score NUMERIC;
BEGIN
    -- Raw score (Wilson score lower bound approximation)
    v_raw_score := p_upvotes - p_downvotes;
    
    -- Engagement factor (more votes = more confidence)
    v_engagement := p_upvotes + p_downvotes;
    
    -- Reputation multiplier (logarithmic scale to prevent abuse)
    IF p_author_reputation <= 0 THEN
        v_reputation_multiplier := 1.0;
    ELSE
        v_reputation_multiplier := 1.0 + (LN(p_author_reputation + 1) / 5);
    END IF;
    
    -- Calculate final score
    IF v_engagement = 0 THEN
        v_final_score := 0;
    ELSE
        v_final_score := v_raw_score * v_reputation_multiplier * (1 + LN(v_engagement + 1) / 10);
    END IF;
    
    RETURN ROUND(v_final_score, 4);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get user reputation with caching
CREATE OR REPLACE FUNCTION public.get_user_reputation(p_user_id UUID)
RETURNS TABLE (
    reputation_score NUMERIC,
    prediction_accuracy NUMERIC,
    accuracy_tier TEXT,
    total_predictions INTEGER,
    correct_predictions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.reputation_score,
        ur.prediction_accuracy,
        ur.accuracy_tier::TEXT,
        ur.total_predictions,
        ur.correct_predictions
    FROM public.user_reputation ur
    WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update comment score after vote
CREATE OR REPLACE FUNCTION public.update_comment_score()
RETURNS TRIGGER AS $$
DECLARE
    v_author_reputation NUMERIC;
    v_upvotes INTEGER;
    v_downvotes INTEGER;
    v_new_score NUMERIC;
BEGIN
    -- Get author reputation
    SELECT reputation_score INTO v_author_reputation
    FROM public.user_reputation
    WHERE user_id = (SELECT user_id FROM public.market_comments WHERE id = COALESCE(NEW.comment_id, OLD.comment_id));
    
    -- Recalculate vote counts
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'upvote'),
        COUNT(*) FILTER (WHERE vote_type = 'downvote')
    INTO v_upvotes, v_downvotes
    FROM public.comment_votes
    WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id);
    
    -- Calculate new score
    v_new_score := public.calculate_comment_weighted_score(v_upvotes, v_downvotes, COALESCE(v_author_reputation, 0));
    
    -- Update comment
    UPDATE public.market_comments
    SET 
        upvotes = v_upvotes,
        downvotes = v_downvotes,
        score = v_new_score
    WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote changes
DROP TRIGGER IF EXISTS trg_update_comment_score ON public.comment_votes;
CREATE TRIGGER trg_update_comment_score
    AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_comment_score();

-- Function to update user reputation tier
CREATE OR REPLACE FUNCTION public.update_accuracy_tier()
RETURNS TRIGGER AS $$
DECLARE
    v_new_tier accuracy_tier;
BEGIN
    -- Determine tier based on accuracy
    SELECT CASE
        WHEN NEW.prediction_accuracy >= 85 THEN 'oracle'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 75 THEN 'expert'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 65 THEN 'analyst'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 55 THEN 'predictor'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 40 THEN 'apprentice'::accuracy_tier
        ELSE 'novice'::accuracy_tier
    END INTO v_new_tier;
    
    -- Only update if tier changed
    IF NEW.accuracy_tier IS DISTINCT FROM v_new_tier THEN
        -- Record tier history
        NEW.tier_history := COALESCE(NEW.tier_history, '[]'::jsonb) || jsonb_build_object(
            'tier', v_new_tier,
            'from', NEW.accuracy_tier,
            'at', NOW()
        );
        NEW.accuracy_tier := v_new_tier;
        NEW.tier_at := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reputation tier updates
DROP TRIGGER IF EXISTS trg_update_accuracy_tier ON public.user_reputation;
CREATE TRIGGER trg_update_accuracy_tier
    BEFORE UPDATE ON public.user_reputation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_accuracy_tier();

-- Function to aggregate activities (for batching)
CREATE OR REPLACE FUNCTION public.aggregate_user_activities(
    p_user_id UUID,
    p_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_aggregation_id UUID;
    v_activity_count INTEGER;
    v_activity_ids jsonb;
BEGIN
    -- Get activities for the user on the specified date
    SELECT 
        COUNT(*),
        jsonb_agg(id)
    INTO v_activity_count, v_activity_ids
    FROM public.activities
    WHERE user_id = p_user_id
      AND DATE(created_at) = p_date;
    
    -- Only create aggregation if there are activities
    IF v_activity_count > 0 THEN
        INSERT INTO public.activity_aggregations (
            aggregation_type,
            aggregation_key,
            title,
            aggregated_count,
            activity_ids,
            preview_data
        )
        VALUES (
            'daily_summary',
            p_user_id || ':' || p_date,
            'Daily Activity Summary',
            v_activity_count,
            v_activity_ids,
            jsonb_build_object('user_id', p_user_id, 'date', p_date)
        )
        ON CONFLICT (aggregation_type, aggregation_key)
        DO UPDATE SET
            aggregated_count = v_activity_count,
            activity_ids = v_activity_ids,
            preview_data = jsonb_build_object('user_id', p_user_id, 'date', p_date)
        RETURNING id INTO v_aggregation_id;
    END IF;
    
    RETURN v_aggregation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and flag toxic comments
CREATE OR REPLACE FUNCTION public.check_comment_moderation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if comment is not already flagged
    IF NOT NEW.is_flagged THEN
        -- Insert into moderation queue for AI review
        INSERT INTO public.comment_moderation_queue (comment_id)
        VALUES (NEW.id)
        ON CONFLICT (comment_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for moderation check on new comments
DROP TRIGGER IF EXISTS trg_check_comment_moderation ON public.market_comments;
CREATE TRIGGER trg_check_comment_moderation
    AFTER INSERT ON public.market_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_comment_moderation();

-- Function to get threaded comments for a market
CREATE OR REPLACE FUNCTION public.get_market_comments_threaded(
    p_market_id UUID,
    p_sort_by TEXT DEFAULT 'score',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    market_id UUID,
    user_id UUID,
    parent_id UUID,
    content TEXT,
    depth_level INTEGER,
    is_collapsed BOOLEAN,
    upvotes INTEGER,
    downvotes INTEGER,
    score NUMERIC,
    sentiment sentiment_type,
    is_flagged BOOLEAN,
    is_deleted BOOLEAN,
    created_at TIMESTAMPTZ,
    edited_at TIMESTAMPTZ,
    author_reputation NUMERIC,
    reply_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE comment_tree AS (
        -- Base case: top-level comments
        SELECT 
            mc.*,
            ur.reputation_score as author_reputation,
            0 as depth_level
        FROM public.market_comments mc
        LEFT JOIN public.user_reputation ur ON mc.user_id = ur.user_id
        WHERE mc.market_id = p_market_id
          AND mc.parent_id IS NULL
          AND mc.is_deleted = FALSE
        
        UNION ALL
        
        -- Recursive case: replies
        SELECT 
            mc.*,
            ur.reputation_score as author_reputation,
            ct.depth_level + 1
        FROM public.market_comments mc
        INNER JOIN comment_tree ct ON mc.parent_id = ct.id
        LEFT JOIN public.user_reputation ur ON mc.user_id = ur.user_id
        WHERE mc.is_deleted = FALSE
          AND ct.depth_level < 10  -- Prevent runaway recursion
    ),
    reply_counts AS (
        SELECT 
            parent_id,
            COUNT(*) as count
        FROM public.market_comments
        WHERE parent_id IS NOT NULL AND is_deleted = FALSE
        GROUP BY parent_id
    )
    SELECT 
        ct.id,
        ct.market_id,
        ct.user_id,
        ct.parent_id,
        ct.content,
        ct.depth_level,
        ct.is_collapsed,
        ct.upvotes,
        ct.downvotes,
        ct.score,
        ct.sentiment,
        ct.is_flagged,
        ct.is_deleted,
        ct.created_at,
        ct.edited_at,
        ct.author_reputation,
        COALESCE(rc.count, 0)::BIGINT as reply_count
    FROM comment_tree ct
    LEFT JOIN reply_counts rc ON ct.id = rc.parent_id
    ORDER BY 
        CASE 
            WHEN p_sort_by = 'score' THEN ct.score
            WHEN p_sort_by = 'newest' THEN EXTRACT(EPOCH FROM ct.created_at)
            ELSE ct.score
        END DESC,
        ct.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================================
-- PART 8: SEED DATA
-- ===================================

-- Seed expert badges
INSERT INTO public.expert_badges (
    name, 
    description, 
    short_description,
    icon_url, 
    icon_color,
    category, 
    rarity, 
    min_accuracy, 
    min_predictions,
    min_reputation_score,
    verification_required
) VALUES 
-- Accuracy badges
('Market Novice', 'Made your first 5 predictions', 'First steps in prediction', '/badges/novice.png', '#CD7F32', 'accuracy', 'common', NULL, 5, 0, FALSE),
('Apprentice Predictor', 'Achieved 40% accuracy with 20+ predictions', 'Learning the ropes', '/badges/apprentice.png', '#A0A0A0', 'accuracy', 'common', 40, 20, 100, FALSE),
('Skilled Analyst', 'Achieved 55% accuracy with 50+ predictions', 'Above average predictor', '/badges/analyst.png', '#4169E1', 'uncommon', 55, 50, 500, FALSE),
('Expert Forecaster', 'Achieved 65% accuracy with 100+ predictions', 'Reliable predictions', '/badges/expert.png', '#9333EA', 'rare', 65, 100, 1000, FALSE),
('Master Oracle', 'Achieved 75% accuracy with 200+ predictions', 'Highly accurate trader', '/badges/master.png', '#E11D48', 'epic', 75, 200, 2500, TRUE),
('Legendary Prophet', 'Achieved 85% accuracy with 500+ predictions', 'Unmatched accuracy', '/badges/prophet.png', '#F59E0B', 'legendary', 85, 500, 5000, TRUE),

-- Volume badges
('Active Trader', 'Participated in 10 different markets', 'Getting active', '/badges/active.png', '#22C55E', 'volume', 'common', NULL, NULL, 0, FALSE),
('Market Veteran', 'Participated in 50 different markets', 'Experienced participant', '/badges/veteran.png', '#3B82F6', 'uncommon', NULL, NULL, 500, FALSE),
('Market Whale', 'Participated in 200+ markets with significant volume', 'Major market player', '/badges/whale.png', '#8B5CF6', 'rare', NULL, NULL, 2500, TRUE),

-- Streak badges
('Hot Streak', '5 correct predictions in a row', 'On fire!', '/badges/hot.png', '#F97316', 'streak', 'uncommon', NULL, NULL, 0, FALSE),
('Unstoppable', '10 correct predictions in a row', 'Incredible streak', '/badges/unstoppable.png', '#EF4444', 'rare', NULL, NULL, 1000, FALSE),
('Perfect Run', '20 correct predictions in a row', 'Legendary streak', '/badges/perfect.png', '#FFD700', 'legendary', NULL, NULL, 5000, TRUE),

-- Community badges
('Helpful Commenter', 'Received 50+ upvotes on comments', 'Community contributor', '/badges/helpful.png', '#14B8A6', 'community', 'uncommon', NULL, NULL, 0, FALSE),
('Discussion Leader', 'Started 10+ popular comment threads', 'Thought leader', '/badges/leader.png', '#6366F1', 'community', 'rare', NULL, NULL, 500, FALSE),
('Moderator Assistant', 'Filed 20+ valid flags', 'Helping keep order', '/badges/assistant.png', '#78716C', 'community', 'uncommon', NULL, NULL, 0, FALSE),

-- Special badges
('Early Adopter', 'Joined during platform beta', 'Founding member', '/badges/early.png', '#EC4899', 'special', 'rare', NULL, NULL, 0, FALSE),
('Bug Hunter', 'Reported 5+ verified bugs', 'Platform improver', '/badges/bug.png', '#DC2626', 'special', 'epic', NULL, NULL, 0, TRUE),

-- Expert badges (verified)
('Certified Analyst', 'Verified financial analyst', 'Professional analyst', '/badges/certified.png', '#1E40AF', 'expert', 'epic', NULL, NULL, 2000, TRUE),
('Subject Matter Expert', 'Verified expertise in specific category', 'Domain expert', '/badges/sme.png', '#047857', 'expert', 'legendary', NULL, NULL, 3000, TRUE)

ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon_url = EXCLUDED.icon_url,
    min_accuracy = EXCLUDED.min_accuracy,
    min_predictions = EXCLUDED.min_predictions;

-- ===================================
-- PART 9: RLS POLICIES
-- ===================================

-- Enable RLS on new tables
ALTER TABLE public.market_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_moderation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Market comments policies
CREATE POLICY "Comments are viewable by everyone" 
    ON public.market_comments FOR SELECT USING (true);

CREATE POLICY "Users can create comments" 
    ON public.market_comments FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update own comments" 
    ON public.market_comments FOR UPDATE USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can soft delete own comments" 
    ON public.market_comments FOR DELETE USING (user_id = current_setting('app.current_user_id')::UUID);

-- Comment votes policies
CREATE POLICY "Votes are viewable by everyone" 
    ON public.comment_votes FOR SELECT USING (true);

CREATE POLICY "Users can cast votes" 
    ON public.comment_votes FOR INSERT WITH CHECK (
        user_id = current_setting('app.current_user_id')::UUID
    );

CREATE POLICY "Users can change their votes" 
    ON public.comment_votes FOR UPDATE USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can remove their votes" 
    ON public.comment_votes FOR DELETE USING (user_id = current_setting('app.current_user_id')::UUID);

-- Comment flags policies
CREATE POLICY "Flags are viewable by moderators" 
    ON public.comment_flags FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

CREATE POLICY "Users can flag comments" 
    ON public.comment_flags FOR INSERT WITH CHECK (
        flagged_by = current_setting('app.current_user_id')::UUID
    );

-- Comment attachments policies
CREATE POLICY "Attachments are viewable by everyone" 
    ON public.comment_attachments FOR SELECT USING (true);

CREATE POLICY "Users can add attachments to own comments" 
    ON public.comment_attachments FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.market_comments 
            WHERE id = comment_id AND user_id = current_setting('app.current_user_id')::UUID
        )
    );

-- User reputation policies
CREATE POLICY "Reputation is viewable by everyone" 
    ON public.user_reputation FOR SELECT USING (true);

CREATE POLICY "Only system can modify reputation" 
    ON public.user_reputation FOR ALL USING (false);

-- Expert badges policies
CREATE POLICY "Badges are viewable by everyone" 
    ON public.expert_badges FOR SELECT USING (true);

CREATE POLICY "Only admins can manage badges" 
    ON public.expert_badges FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

-- User badges policies
CREATE POLICY "User badges are viewable by everyone" 
    ON public.user_badges FOR SELECT USING (true);

CREATE POLICY "Only system can award badges" 
    ON public.user_badges FOR ALL USING (false);

-- User follows policies
CREATE POLICY "Follows are viewable by everyone" 
    ON public.user_follows FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" 
    ON public.user_follows FOR ALL USING (follower_id = current_setting('app.current_user_id')::UUID);

-- Feed preferences policies
CREATE POLICY "Users can view own preferences" 
    ON public.feed_preferences FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY "Users can manage own preferences" 
    ON public.feed_preferences FOR ALL USING (user_id = current_setting('app.current_user_id')::UUID);

-- Activity aggregations policies
CREATE POLICY "Aggregations are viewable by everyone" 
    ON public.activity_aggregations FOR SELECT USING (
        target_user_ids = '{}' OR 
        current_setting('app.current_user_id')::UUID = ANY(target_user_ids)
    );

-- Comment moderation queue policies
CREATE POLICY "Only moderators can view queue" 
    ON public.comment_moderation_queue FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

CREATE POLICY "Only system can add to queue" 
    ON public.comment_moderation_queue FOR INSERT WITH CHECK (false);

CREATE POLICY "Only moderators can update queue" 
    ON public.comment_moderation_queue FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

-- User moderation status policies
CREATE POLICY "Users can view own moderation status" 
    ON public.user_moderation_status FOR SELECT USING (
        user_id = current_setting('app.current_user_id')::UUID OR
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

CREATE POLICY "Only moderators can update moderation status" 
    ON public.user_moderation_status FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

-- Moderation actions policies
CREATE POLICY "Users can view actions on self" 
    ON public.moderation_actions FOR SELECT USING (
        target_user_id = current_setting('app.current_user_id')::UUID OR
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

CREATE POLICY "Only moderators can create actions" 
    ON public.moderation_actions FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = current_setting('app.current_user_id')::UUID AND is_admin = true)
    );

COMMIT;
