-- ===================================
-- FIX: Drop and recreate function with correct return type
-- ===================================

-- Drop ALL versions of the function
DROP FUNCTION IF EXISTS public.get_market_comments_threaded(UUID);
DROP FUNCTION IF EXISTS public.get_market_comments_threaded(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_market_comments_threaded(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER);

-- Now create the function fresh
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
) 
LANGUAGE plpgsql
STABLE
AS $$
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
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_market_comments_threaded(UUID, TEXT, INTEGER, INTEGER) TO anon;

-- Verify it works
SELECT 'Function recreated successfully!' as status;

-- Test the function (will return empty if no comments, but won't error)
SELECT * FROM get_market_comments_threaded('00000000-0000-0000-0000-000000000000'::UUID, 'score', 1, 0);
