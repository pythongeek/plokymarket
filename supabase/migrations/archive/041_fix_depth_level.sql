-- ===================================
-- FIX: Correct depth_level column reference in get_market_comments_threaded
-- ===================================

-- First ensure the column exists (for partial migration scenarios)
ALTER TABLE public.market_comments 
ADD COLUMN IF NOT EXISTS depth_level INTEGER DEFAULT 0 CHECK (depth_level >= 0 AND depth_level <= 10);

-- Drop the function if it exists to recreate it
DROP FUNCTION IF EXISTS public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER);

-- Recreate the function with the correct column references
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER) TO anon;

-- Create the index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_market_comments_depth ON public.market_comments(depth_level);
