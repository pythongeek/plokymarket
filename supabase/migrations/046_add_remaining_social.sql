-- ===================================
-- ADD REMAINING SOCIAL FEATURES (safe - checks if exists)
-- ===================================

-- Types
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_reason') THEN CREATE TYPE flag_reason AS ENUM ('spam', 'harassment', 'hate_speech', 'misinformation', 'off_topic', 'trolling', 'other'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_category') THEN CREATE TYPE badge_category AS ENUM ('accuracy', 'volume', 'streak', 'community', 'special', 'expert'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_rarity') THEN CREATE TYPE badge_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN CREATE TYPE moderation_status AS ENUM ('clean', 'pending_review', 'flagged', 'removed', 'appealed'); END IF; END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.expert_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, description TEXT, category badge_category DEFAULT 'accuracy',
    rarity badge_rarity DEFAULT 'common', min_accuracy INTEGER, min_predictions INTEGER,
    min_reputation_score INTEGER DEFAULT 0, verification_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, badge_id UUID NOT NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(), is_displayed BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0, UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL, following_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    notify_on_trade BOOLEAN DEFAULT TRUE, notify_on_comment BOOLEAN DEFAULT TRUE,
    UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.feed_preferences (
    user_id UUID PRIMARY KEY,
    market_movements_weight INTEGER DEFAULT 90, trader_activity_weight INTEGER DEFAULT 60,
    system_notifications_weight INTEGER DEFAULT 100, social_interactions_weight INTEGER DEFAULT 50,
    trending_markets_weight INTEGER DEFAULT 30, muted_keywords TEXT[] DEFAULT '{}',
    notifications_paused BOOLEAN DEFAULT FALSE, compact_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comment_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL, user_id UUID NOT NULL,
    toxicity_score NUMERIC DEFAULT 0, status moderation_status DEFAULT 'pending_review',
    created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(comment_id)
);

-- Seed badges
INSERT INTO public.expert_badges (name, description, category, rarity, min_accuracy, min_predictions, verification_required) VALUES
('Market Novice', 'Made 5+ predictions', 'accuracy', 'common', NULL, 5, FALSE),
('Skilled Analyst', '55% accuracy, 50+ predictions', 'accuracy', 'uncommon', 55, 50, FALSE),
('Expert Forecaster', '65% accuracy, 100+ predictions', 'accuracy', 'rare', 65, 100, FALSE),
('Master Oracle', '75% accuracy, 200+ predictions', 'accuracy', 'epic', 75, 200, TRUE)
ON CONFLICT DO NOTHING;

-- Update score function
CREATE OR REPLACE FUNCTION public.update_comment_score()
RETURNS TRIGGER AS $$
DECLARE v_upvotes INTEGER; v_downvotes INTEGER;
BEGIN
    SELECT COUNT(*) FILTER (WHERE vote_type = 'upvote'), COUNT(*) FILTER (WHERE vote_type = 'downvote')
    INTO v_upvotes, v_downvotes FROM public.comment_votes WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id);
    UPDATE public.market_comments SET upvotes = v_upvotes, downvotes = v_downvotes, score = (v_upvotes - v_downvotes)
    WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_comment_score ON public.comment_votes;
CREATE TRIGGER trg_update_comment_score AFTER INSERT OR UPDATE OR DELETE ON public.comment_votes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_score();

SELECT 'Remaining social features added!' as status;
