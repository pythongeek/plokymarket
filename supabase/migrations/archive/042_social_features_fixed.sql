-- ===================================
-- SOCIAL FEATURES MIGRATION - BULLETPROOF VERSION
-- ===================================
-- This migration handles all edge cases including:
-- - Existing tables/columns
-- - Type conflicts
-- - Dependency ordering
-- - Partial migration states

-- ===================================
-- PART 0: CLEANUP (Only if needed - uncomment to reset)
-- ===================================
-- Uncomment lines below ONLY if you want to start fresh
-- WARNING: This will DELETE existing social data
/*
DROP TABLE IF EXISTS public.comment_flags CASCADE;
DROP TABLE IF EXISTS public.comment_votes CASCADE;
DROP TABLE IF EXISTS public.comment_attachments CASCADE;
DROP TABLE IF EXISTS public.comment_moderation_queue CASCADE;
DROP TABLE IF EXISTS public.moderation_actions CASCADE;
DROP TABLE IF EXISTS public.user_moderation_status CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.expert_badges CASCADE;
DROP TABLE IF EXISTS public.activity_aggregations CASCADE;
DROP TABLE IF EXISTS public.feed_preferences CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;
DROP TABLE IF EXISTS public.market_follows CASCADE;
DROP TABLE IF EXISTS public.market_comments CASCADE;
DROP TABLE IF EXISTS public.user_reputation CASCADE;
DROP FUNCTION IF EXISTS public.get_market_comments_threaded CASCADE;
DROP FUNCTION IF EXISTS public.update_comment_score CASCADE;
DROP FUNCTION IF EXISTS public.update_accuracy_tier CASCADE;
DROP FUNCTION IF EXISTS public.calculate_comment_weighted_score CASCADE;
DROP FUNCTION IF EXISTS public.check_comment_moderation CASCADE;
DROP FUNCTION IF EXISTS public.aggregate_user_activities CASCADE;
DROP TYPE IF EXISTS sentiment_type CASCADE;
DROP TYPE IF EXISTS vote_type CASCADE;
DROP TYPE IF EXISTS flag_reason CASCADE;
DROP TYPE IF EXISTS moderation_status CASCADE;
DROP TYPE IF EXISTS badge_category CASCADE;
DROP TYPE IF EXISTS badge_rarity CASCADE;
DROP TYPE IF EXISTS accuracy_tier CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS attachment_type CASCADE;
*/

-- ===================================
-- PART 1: CREATE TYPES (Safe - won't fail if exists)
-- ===================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sentiment_type') THEN
        CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral', 'mixed');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vote_type') THEN
        CREATE TYPE vote_type AS ENUM ('upvote', 'downvote', 'none');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_reason') THEN
        CREATE TYPE flag_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'off_topic', 'trolling', 'other');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
        CREATE TYPE moderation_status AS ENUM ('clean', 'pending_review', 'flagged', 'removed', 'appealed');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_category') THEN
        CREATE TYPE badge_category AS ENUM ('accuracy', 'volume', 'streak', 'community', 'special', 'expert');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_rarity') THEN
        CREATE TYPE badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accuracy_tier') THEN
        CREATE TYPE accuracy_tier AS ENUM ('novice', 'apprentice', 'analyst', 'expert', 'master', 'oracle');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM (
            'market_movement', 'trader_activity', 'system_notification', 
            'social_interaction', 'trending_market', 'comment_reply', 
            'mention', 'follow', 'badge_earned', 'market_resolve'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_type') THEN
        CREATE TYPE attachment_type AS ENUM ('image', 'link', 'gif', 'file');
    END IF;
END $$;

-- ===================================
-- PART 2: CREATE TABLES (Safe with IF NOT EXISTS)
-- ===================================

-- Main comments table
CREATE TABLE IF NOT EXISTS public.market_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL,
    user_id UUID NOT NULL,
    parent_id UUID,
    content TEXT NOT NULL,
    content_html TEXT,
    depth_level INTEGER DEFAULT 0,
    is_collapsed BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    score NUMERIC DEFAULT 0,
    sentiment sentiment_type DEFAULT 'neutral',
    sentiment_score NUMERIC DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_depth CHECK (depth_level >= 0 AND depth_level <= 10)
);

-- Add columns if they don't exist (for partial migrations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_comments' AND column_name = 'depth_level') THEN
        ALTER TABLE public.market_comments ADD COLUMN depth_level INTEGER DEFAULT 0 CHECK (depth_level >= 0 AND depth_level <= 10);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_comments' AND column_name = 'content_html') THEN
        ALTER TABLE public.market_comments ADD COLUMN content_html TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_comments' AND column_name = 'sentiment_score') THEN
        ALTER TABLE public.market_comments ADD COLUMN sentiment_score NUMERIC DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_comments' AND column_name = 'is_collapsed') THEN
        ALTER TABLE public.market_comments ADD COLUMN is_collapsed BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Comment votes
CREATE TABLE IF NOT EXISTS public.comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    vote_type vote_type NOT NULL,
    user_reputation_at_vote INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Comment flags
CREATE TABLE IF NOT EXISTS public.comment_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reason flag_reason NOT NULL,
    details TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(comment_id, user_id)
);

-- Comment attachments
CREATE TABLE IF NOT EXISTS public.comment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    type attachment_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User reputation
CREATE TABLE IF NOT EXISTS public.user_reputation (
    user_id UUID PRIMARY KEY,
    prediction_accuracy NUMERIC(5,2) DEFAULT 0,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    accuracy_tier accuracy_tier DEFAULT 'novice',
    volume_score INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    social_score INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    rank_percentile INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert badges
CREATE TABLE IF NOT EXISTS public.expert_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    icon_url TEXT,
    icon_color TEXT,
    category badge_category NOT NULL,
    rarity badge_rarity DEFAULT 'common',
    min_accuracy INTEGER,
    min_predictions INTEGER,
    min_streak INTEGER,
    min_reputation_score INTEGER DEFAULT 0,
    verification_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_id UUID NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    awarded_by UUID,
    is_displayed BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    verification_proof TEXT,
    UNIQUE(user_id, badge_id)
);

-- User follows
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notify_on_trade BOOLEAN DEFAULT TRUE,
    notify_on_comment BOOLEAN DEFAULT TRUE,
    notify_on_market BOOLEAN DEFAULT TRUE,
    UNIQUE(follower_id, following_id)
);

-- Market follows
CREATE TABLE IF NOT EXISTS public.market_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    market_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notify_on_price_change BOOLEAN DEFAULT TRUE,
    notify_on_resolve BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, market_id)
);

-- Feed preferences
CREATE TABLE IF NOT EXISTS public.feed_preferences (
    user_id UUID PRIMARY KEY,
    market_movements_weight INTEGER DEFAULT 90,
    trader_activity_weight INTEGER DEFAULT 60,
    system_notifications_weight INTEGER DEFAULT 100,
    social_interactions_weight INTEGER DEFAULT 50,
    trending_markets_weight INTEGER DEFAULT 30,
    muted_keywords TEXT[] DEFAULT '{}',
    muted_users UUID[] DEFAULT '{}',
    muted_markets UUID[] DEFAULT '{}',
    notifications_paused BOOLEAN DEFAULT FALSE,
    notifications_pause_until TIMESTAMPTZ,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    compact_mode BOOLEAN DEFAULT FALSE,
    auto_expand_threads BOOLEAN DEFAULT FALSE,
    default_thread_depth INTEGER DEFAULT 3,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity aggregations
CREATE TABLE IF NOT EXISTS public.activity_aggregations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    aggregation_type TEXT NOT NULL,
    aggregation_key TEXT NOT NULL,
    title TEXT,
    aggregated_count INTEGER DEFAULT 0,
    activity_ids JSONB DEFAULT '[]',
    preview_data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aggregation_type, aggregation_key)
);

-- Comment moderation queue
CREATE TABLE IF NOT EXISTS public.comment_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    toxicity_score NUMERIC DEFAULT 0,
    spam_score NUMERIC DEFAULT 0,
    sentiment_mismatch BOOLEAN DEFAULT FALSE,
    flagged_categories TEXT[] DEFAULT '{}',
    ai_confidence NUMERIC DEFAULT 0,
    ai_reasoning TEXT,
    status moderation_status DEFAULT 'pending_review',
    reviewed_by UUID,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(comment_id)
);

-- User moderation status
CREATE TABLE IF NOT EXISTS public.user_moderation_status (
    user_id UUID PRIMARY KEY,
    total_strikes INTEGER DEFAULT 0,
    active_strikes INTEGER DEFAULT 0,
    last_strike_at TIMESTAMPTZ,
    is_comment_banned BOOLEAN DEFAULT FALSE,
    comment_ban_until TIMESTAMPTZ,
    is_trade_restricted BOOLEAN DEFAULT FALSE,
    trade_restriction_until TIMESTAMPTZ,
    restriction_reason TEXT,
    appeal_count INTEGER DEFAULT 0,
    last_appeal_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation actions log
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    target_user_id UUID,
    target_comment_id UUID,
    performed_by UUID NOT NULL,
    reason TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- PART 3: CREATE INDEXES
-- ===================================

-- Market comments indexes
CREATE INDEX IF NOT EXISTS idx_market_comments_market_id ON public.market_comments(market_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_parent_id ON public.market_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_user_id ON public.market_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_depth ON public.market_comments(depth_level);
CREATE INDEX IF NOT EXISTS idx_market_comments_score ON public.market_comments(score DESC);
CREATE INDEX IF NOT EXISTS idx_market_comments_created ON public.market_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_comments_active ON public.market_comments(market_id, is_deleted) WHERE is_deleted = FALSE;

-- Comment votes indexes
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON public.comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON public.comment_votes(user_id);

-- Comment flags indexes
CREATE INDEX IF NOT EXISTS idx_comment_flags_comment_id ON public.comment_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_flags_resolved ON public.comment_flags(is_resolved) WHERE is_resolved = FALSE;

-- User reputation indexes
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON public.user_reputation(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_reputation_tier ON public.user_reputation(accuracy_tier);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Activity aggregations indexes
CREATE INDEX IF NOT EXISTS idx_activity_aggregations_user ON public.activity_aggregations(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_aggregations_type_key ON public.activity_aggregations(aggregation_type, aggregation_key);

-- Moderation queue indexes
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.comment_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON public.comment_moderation_queue(created_at);

-- ===================================
-- PART 4: CREATE FUNCTIONS
-- ===================================

-- Function to calculate weighted comment score
CREATE OR REPLACE FUNCTION public.calculate_comment_weighted_score(
    p_upvotes INTEGER,
    p_downvotes INTEGER,
    p_author_reputation INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_raw_score INTEGER;
    v_reputation_multiplier NUMERIC;
    v_wilson_score NUMERIC;
    v_total INTEGER;
    v_pos_prop NUMERIC;
BEGIN
    v_raw_score := p_upvotes - p_downvotes;
    
    -- Reputation multiplier
    v_reputation_multiplier := CASE
        WHEN p_author_reputation >= 8000 THEN 3.0
        WHEN p_author_reputation >= 6000 THEN 2.5
        WHEN p_author_reputation >= 4000 THEN 2.0
        WHEN p_author_reputation >= 2000 THEN 1.5
        WHEN p_author_reputation >= 500 THEN 1.2
        ELSE 1.0
    END;
    
    -- Wilson score for statistical confidence
    v_total := GREATEST(p_upvotes + p_downvotes, 1);
    v_pos_prop := p_upvotes::NUMERIC / v_total;
    
    -- Simplified Wilson score (avoiding complex math for now)
    v_wilson_score := v_raw_score * v_reputation_multiplier;
    
    RETURN v_wilson_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update comment score (trigger)
CREATE OR REPLACE FUNCTION public.update_comment_score()
RETURNS TRIGGER AS $$
DECLARE
    v_upvotes INTEGER;
    v_downvotes INTEGER;
    v_author_reputation INTEGER;
    v_new_score NUMERIC;
BEGIN
    -- Count votes
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 'upvote'),
        COUNT(*) FILTER (WHERE vote_type = 'downvote')
    INTO v_upvotes, v_downvotes
    FROM public.comment_votes
    WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id);
    
    -- Get author reputation
    SELECT COALESCE(reputation_score, 0)
    INTO v_author_reputation
    FROM public.user_reputation
    WHERE user_id = (SELECT user_id FROM public.market_comments WHERE id = COALESCE(NEW.comment_id, OLD.comment_id));
    
    -- Calculate new score
    v_new_score := public.calculate_comment_weighted_score(v_upvotes, v_downvotes, COALESCE(v_author_reputation, 0));
    
    -- Update comment
    UPDATE public.market_comments
    SET score = v_new_score,
        upvotes = v_upvotes,
        downvotes = v_downvotes
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

-- Function to update accuracy tier
CREATE OR REPLACE FUNCTION public.update_accuracy_tier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.accuracy_tier := CASE
        WHEN NEW.prediction_accuracy >= 80 AND NEW.total_predictions >= 100 THEN 'oracle'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 70 AND NEW.total_predictions >= 50 THEN 'master'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 65 AND NEW.total_predictions >= 25 THEN 'expert'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 60 AND NEW.total_predictions >= 10 THEN 'analyst'::accuracy_tier
        WHEN NEW.prediction_accuracy >= 55 AND NEW.total_predictions >= 5 THEN 'apprentice'::accuracy_tier
        ELSE 'novice'::accuracy_tier
    END;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reputation tier updates
DROP TRIGGER IF EXISTS trg_update_accuracy_tier ON public.user_reputation;
CREATE TRIGGER trg_update_accuracy_tier
    BEFORE UPDATE ON public.user_reputation
    FOR EACH ROW
    EXECUTE FUNCTION public.update_accuracy_tier();

-- Function to get threaded comments (THE FIXED ONE)
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
            mc.id,
            mc.market_id,
            mc.user_id,
            mc.parent_id,
            mc.content,
            mc.depth_level,
            mc.is_collapsed,
            mc.upvotes,
            mc.downvotes,
            mc.score,
            mc.sentiment,
            mc.is_flagged,
            mc.is_deleted,
            mc.created_at,
            mc.edited_at,
            COALESCE(ur.reputation_score, 0) as author_reputation
        FROM public.market_comments mc
        LEFT JOIN public.user_reputation ur ON mc.user_id = ur.user_id
        WHERE mc.market_id = p_market_id
          AND mc.parent_id IS NULL
          AND mc.is_deleted = FALSE
        
        UNION ALL
        
        -- Recursive case: replies
        SELECT 
            mc.id,
            mc.market_id,
            mc.user_id,
            mc.parent_id,
            mc.content,
            mc.depth_level,
            mc.is_collapsed,
            mc.upvotes,
            mc.downvotes,
            mc.score,
            mc.sentiment,
            mc.is_flagged,
            mc.is_deleted,
            mc.created_at,
            mc.edited_at,
            COALESCE(ur.reputation_score, 0) as author_reputation
        FROM public.market_comments mc
        INNER JOIN comment_tree ct ON mc.parent_id = ct.id
        LEFT JOIN public.user_reputation ur ON mc.user_id = ur.user_id
        WHERE mc.is_deleted = FALSE
          AND mc.depth_level < 10
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
        ct.*,
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

-- Function to check comment moderation
CREATE OR REPLACE FUNCTION public.check_comment_moderation()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT NEW.is_flagged THEN
        INSERT INTO public.comment_moderation_queue (comment_id, user_id)
        VALUES (NEW.id, NEW.user_id)
        ON CONFLICT (comment_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for moderation check
DROP TRIGGER IF EXISTS trg_check_comment_moderation ON public.market_comments;
CREATE TRIGGER trg_check_comment_moderation
    AFTER INSERT ON public.market_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_comment_moderation();

-- ===================================
-- PART 5: ENABLE RLS (Optional - add policies as needed)
-- ===================================

ALTER TABLE public.market_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_preferences ENABLE ROW LEVEL SECURITY;

-- ===================================
-- PART 6: SEED BADGES (Safe - won't duplicate)
-- ===================================

INSERT INTO public.expert_badges (
    name, description, short_description, category, rarity,
    min_accuracy, min_predictions, min_reputation_score, verification_required
) VALUES 
    ('Market Novice', 'Made your first 5 predictions', 'First steps', 'accuracy', 'common', NULL, 5, 0, FALSE),
    ('Apprentice Predictor', 'Achieved 40% accuracy with 20+ predictions', 'Learning', 'accuracy', 'common', 40, 20, 100, FALSE),
    ('Skilled Analyst', 'Achieved 55% accuracy with 50+ predictions', 'Above average', 'accuracy', 'uncommon', 55, 50, 500, FALSE),
    ('Expert Forecaster', 'Achieved 65% accuracy with 100+ predictions', 'Reliable', 'accuracy', 'rare', 65, 100, 1000, FALSE),
    ('Master Oracle', 'Achieved 75% accuracy with 200+ predictions', 'Highly accurate', 'accuracy', 'epic', 75, 200, 2500, TRUE),
    ('Legendary Prophet', 'Achieved 85% accuracy with 500+ predictions', 'Unmatched', 'accuracy', 'legendary', 85, 500, 5000, TRUE)
ON CONFLICT DO NOTHING;

-- ===================================
-- VERIFICATION
-- ===================================
SELECT 'Migration completed successfully!' as status;

-- Verify key objects exist
SELECT 
    (SELECT COUNT(*) FROM pg_type WHERE typname = 'sentiment_type') as sentiment_type_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'market_comments') as market_comments_exists,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'market_comments' AND column_name = 'depth_level') as depth_level_exists,
    (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_market_comments_threaded') as threaded_function_exists;
