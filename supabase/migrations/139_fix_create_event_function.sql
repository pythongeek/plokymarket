-- ============================================================================
-- Migration 139: Fix create_event_complete Function
-- Problem: Function fails silently when called from frontend
-- Solution: Simplify function and add better error handling
-- ============================================================================

-- ============================================================================
-- STEP 1: Create a simplified working version of create_event_complete
-- ============================================================================

CREATE OR REPLACE FUNCTION create_event_complete(
    p_event_data JSONB,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_market_id UUID;
    v_slug TEXT;
    v_title TEXT;
    v_category TEXT;
    v_trading_closes_at TIMESTAMPTZ;
    v_initial_liquidity NUMERIC;
BEGIN
    -- Extract and validate required fields
    v_title := COALESCE(p_event_data->>'title', p_event_data->>'name', 'Untitled Event');
    
    -- Generate slug
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    -- Get category
    v_category := COALESCE(p_event_data->>'category', 'general');
    
    -- Parse trading closes at
    BEGIN
        v_trading_closes_at := (p_event_data->>'trading_closes_at')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        v_trading_closes_at := NOW() + INTERVAL '7 days';
    END;
    
    -- Get initial liquidity
    v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    
    -- STEP 1: Insert Event (minimal required fields)
    INSERT INTO public.events (
        title,
        name,
        name_en,
        slug,
        question,
        description,
        category,
        subcategory,
        status,
        starts_at,
        trading_opens_at,
        trading_closes_at,
        event_date,
        resolution_method,
        resolution_delay_hours,
        initial_liquidity,
        current_liquidity,
        is_featured,
        answer_type,
        answer1,
        answer2,
        created_by
    ) VALUES (
        v_title,
        v_title,
        v_title,
        v_slug,
        COALESCE(p_event_data->>'question', v_title),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        'active',  -- Use 'active' instead of 'published' to match constraint
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        v_trading_closes_at,
        v_trading_closes_at,
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        v_initial_liquidity,
        v_initial_liquidity,
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        'binary',
        'হ্যাঁ (Yes)',
        'না (No)',
        p_admin_id
    )
    RETURNING id INTO v_event_id;
    
    -- STEP 2: Create Market
    INSERT INTO public.markets (
        event_id,
        name,
        question,
        description,
        category,
        subcategory,
        trading_closes_at,
        resolution_delay_hours,
        initial_liquidity,
        liquidity,
        status,
        slug,
        answer_type,
        answer1,
        answer2,
        is_featured,
        created_by
    ) VALUES (
        v_event_id,
        v_title,
        COALESCE(p_event_data->>'question', v_title),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        v_trading_closes_at,
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        v_initial_liquidity,
        v_initial_liquidity,
        'active',
        v_slug || '-market',
        'binary',
        'হ্যাঁ (Yes)',
        'না (No)',
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        p_admin_id
    )
    RETURNING id INTO v_market_id;
    
    -- STEP 3: Return success
    RETURN jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully'
    );

EXCEPTION WHEN OTHERS THEN
    -- Return detailed error
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE,
        'hint', 'Check that all required fields are provided'
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO service_role;

-- ============================================================================
-- STEP 2: Test the function
-- ============================================================================
DO $$
DECLARE
    v_result JSONB;
    v_admin_id UUID;
    v_test_event_id UUID;
BEGIN
    -- Find admin
    SELECT id INTO v_admin_id
    FROM public.user_profiles
    WHERE is_admin = true
    LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        RAISE NOTICE 'No admin user found';
        RETURN;
    END IF;
    
    -- Test the function
    v_result := create_event_complete(
        '{
            "title": "Function Test Event",
            "question": "Will this function work?",
            "category": "sports",
            "trading_closes_at": "2026-03-15T18:00:00Z",
            "resolution_method": "manual_admin",
            "is_featured": true
        }'::jsonb,
        v_admin_id
    );
    
    RAISE NOTICE 'Function test result: %', v_result;
    
    -- If success, clean up
    IF (v_result->>'success')::BOOLEAN THEN
        v_test_event_id := (v_result->>'event_id')::UUID;
        DELETE FROM public.events WHERE id = v_test_event_id;
        RAISE NOTICE 'Test event cleaned up';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Reload schema
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 139 applied: create_event_complete function simplified';
END $$;
