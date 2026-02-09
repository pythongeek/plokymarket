-- ===================================
-- FIX: Add all missing columns to market_comments
-- ===================================

-- Check and add ALL missing columns to market_comments
DO $$
BEGIN
    -- Add depth_level if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'depth_level') THEN
        ALTER TABLE public.market_comments ADD COLUMN depth_level INTEGER DEFAULT 0;
        ALTER TABLE public.market_comments ADD CONSTRAINT check_depth_level 
            CHECK (depth_level >= 0 AND depth_level <= 10);
    END IF;

    -- Add content_html if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'content_html') THEN
        ALTER TABLE public.market_comments ADD COLUMN content_html TEXT;
    END IF;

    -- Add sentiment_score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'sentiment_score') THEN
        ALTER TABLE public.market_comments ADD COLUMN sentiment_score NUMERIC DEFAULT 0;
    END IF;

    -- Add is_collapsed if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'is_collapsed') THEN
        ALTER TABLE public.market_comments ADD COLUMN is_collapsed BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add upvotes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'upvotes') THEN
        ALTER TABLE public.market_comments ADD COLUMN upvotes INTEGER DEFAULT 0;
    END IF;

    -- Add downvotes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'downvotes') THEN
        ALTER TABLE public.market_comments ADD COLUMN downvotes INTEGER DEFAULT 0;
    END IF;

    -- Add score if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'score') THEN
        ALTER TABLE public.market_comments ADD COLUMN score NUMERIC DEFAULT 0;
    END IF;

    -- Add sentiment if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'sentiment') THEN
        ALTER TABLE public.market_comments ADD COLUMN sentiment TEXT DEFAULT 'neutral';
    END IF;

    -- Add is_flagged if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'is_flagged') THEN
        ALTER TABLE public.market_comments ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add flag_count if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'flag_count') THEN
        ALTER TABLE public.market_comments ADD COLUMN flag_count INTEGER DEFAULT 0;
    END IF;

    -- Add is_deleted if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'is_deleted') THEN
        ALTER TABLE public.market_comments ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add edited_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'market_comments' AND column_name = 'edited_at') THEN
        ALTER TABLE public.market_comments ADD COLUMN edited_at TIMESTAMPTZ;
    END IF;
END $$;

-- Now create the indexes
CREATE INDEX IF NOT EXISTS idx_market_comments_market_id ON public.market_comments(market_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_parent_id ON public.market_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_user_id ON public.market_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_market_comments_depth ON public.market_comments(depth_level);
CREATE INDEX IF NOT EXISTS idx_market_comments_score ON public.market_comments(score DESC);
CREATE INDEX IF NOT EXISTS idx_market_comments_created ON public.market_comments(created_at DESC);

-- ===================================
-- CREATE SUPPORT TABLES (if missing)
-- ===================================

-- Create types if they don't exist
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
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accuracy_tier') THEN
        CREATE TYPE accuracy_tier AS ENUM ('novice', 'apprentice', 'analyst', 'expert', 'master', 'oracle');
    END IF;
END $$;

-- Create comment_votes table
CREATE TABLE IF NOT EXISTS public.comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    vote_type TEXT NOT NULL DEFAULT 'upvote',
    user_reputation_at_vote INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON public.comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON public.comment_votes(user_id);

-- Create user_reputation table
CREATE TABLE IF NOT EXISTS public.user_reputation (
    user_id UUID PRIMARY KEY,
    prediction_accuracy NUMERIC(5,2) DEFAULT 0,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    accuracy_tier TEXT DEFAULT 'novice',
    volume_score INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    social_score INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    rank_percentile INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- CREATE THE MAIN FUNCTION
-- ===================================

DROP FUNCTION IF EXISTS public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER);

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
    sentiment TEXT,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER) TO anon;

-- ===================================
-- VERIFICATION
-- ===================================

SELECT 'Fix applied successfully!' as status;

-- Show current columns in market_comments
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'market_comments'
ORDER BY ordinal_position;
