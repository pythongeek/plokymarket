-- ============================================================================
-- Migration 134: Debug and Fix Event Creation
-- Add better error handling and logging
-- ============================================================================

-- ============================================================================
-- FIX 1: Create a simpler, more robust event creation function
-- This version has better error handling and debugging
-- ============================================================================
CREATE OR REPLACE FUNCTION create_event_debug(
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
    v_result JSONB;
    v_initial_liquidity NUMERIC := 1000;
    v_category TEXT := 'general';
    v_title TEXT;
    v_question TEXT;
    v_trading_closes_at TIMESTAMPTZ;
BEGIN
    -- Extract key values with defaults
    v_title := COALESCE(p_event_data->>'title', p_event_data->>'name', 'Untitled Event');
    v_question := COALESCE(p_event_data->>'question', v_title);
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    -- Parse trading closes at
    BEGIN
        v_trading_closes_at := (p_event_data->>'trading_closes_at')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        v_trading_closes_at := NOW() + INTERVAL '7 days';
    END;
    
    -- Get initial liquidity
    BEGIN
        v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    EXCEPTION WHEN OTHERS THEN
        v_initial_liquidity := 1000;
    END;
    
    -- Get category
    v_category := COALESCE(p_event_data->>'category', 'general');
    
    RAISE NOTICE 'Creating event: title=%, slug=%, category=%', v_title, v_slug, v_category;

    -- STEP 1: Insert Event (simplified)
    BEGIN
        INSERT INTO public.events (
            title,
            slug,
            question,
            description,
            category,
            subcategory,
            status,
            starts_at,
            trading_opens_at,
            trading_closes_at,
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
            v_slug,
            v_question,
            p_event_data->>'description',
            v_category,
            p_event_data->>'subcategory',
            'active',
            NOW(),
            NOW(),
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
        
        RAISE NOTICE 'Event created with ID: %', v_event_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Failed to create event: ' || SQLERRM,
            'detail', SQLSTATE
        );
    END;
    
    -- STEP 2: Create Market
    BEGIN
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
            v_question,
            p_event_data->>'description',
            v_category,
            p_event_data->>'subcategory',
            v_trading_closes_at,
            COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
            v_initial_liquidity,
            v_initial_liquidity,
            'active',
            v_slug,
            'binary',
            'হ্যাঁ (Yes)',
            'না (No)',
            COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
            p_admin_id
        )
        RETURNING id INTO v_market_id;
        
        RAISE NOTICE 'Market created with ID: %', v_market_id;
    EXCEPTION WHEN OTHERS THEN
        -- Don't fail if market creation fails
        RAISE WARNING 'Market creation failed: %', SQLERRM;
        v_market_id := NULL;
    END;
    
    -- STEP 3: Return success
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully'
    );
    
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION create_event_debug(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_debug(JSONB, UUID) TO service_role;

-- ============================================================================
-- FIX 2: Check if the actual create_event_complete function exists and works
-- ============================================================================
DO $$
BEGIN
    -- Test if create_event_complete exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_event_complete'
    ) THEN
        RAISE NOTICE 'create_event_complete function exists';
    ELSE
        RAISE NOTICE 'create_event_complete function DOES NOT exist - need to create it';
    END IF;
END $$;

-- ============================================================================
-- FIX 3: Create a direct test to verify event insertion works
-- ============================================================================
-- This is a diagnostic function you can call to test event creation
CREATE OR REPLACE FUNCTION test_event_creation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_admin_id UUID;
BEGIN
    -- Find an admin user
    SELECT id INTO v_admin_id
    FROM public.user_profiles
    WHERE is_admin = TRUE
    LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'No admin user found'
        );
    END IF;
    
    -- Try to insert a test event directly
    BEGIN
        INSERT INTO public.events (
            title,
            slug,
            question,
            category,
            status,
            created_by
        ) VALUES (
            'Test Event',
            'test-event-' || substr(gen_random_uuid()::text, 1, 8),
            'Test Question?',
            'general',
            'active',
            v_admin_id
        )
        RETURNING id INTO v_event_id;
        
        -- Delete the test event immediately
        DELETE FROM public.events WHERE id = v_event_id;
        
        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'Event insertion works correctly',
            'test_event_id', v_event_id
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Event insertion failed: ' || SQLERRM,
            'detail', SQLSTATE
        );
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION test_event_creation() TO authenticated;

-- ============================================================================
-- FIX 4: Check column types in events table
-- ============================================================================
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Checking events table columns...';
    FOR rec IN 
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name IN ('tags', 'ai_keywords', 'ai_sources')
    LOOP
        RAISE NOTICE 'Column: %, Type: %, UDT: %', rec.column_name, rec.data_type, rec.udt_name;
    END LOOP;
END $$;

-- ============================================================================
-- Notify PostgREST to reload schema
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Instructions for debugging
-- ============================================================================
/*
After applying this migration, run these commands in Supabase SQL Editor:

1. Test if basic event insertion works:
   SELECT test_event_creation();

2. If that works, try the debug function:
   SELECT create_event_debug(
       '{"title": "Test Event", "question": "Test?", "category": "sports"}'::jsonb,
       (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
   );

3. Check for any remaining column type issues:
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'events' 
   AND column_name IN ('tags', 'ai_keywords', 'ai_sources');

4. Check the actual error from create_event_complete:
   SELECT create_event_complete(
       '{"title": "Test", "question": "Test?", "trading_closes_at": "2026-03-15T18:00:00Z"}'::jsonb,
       (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
   );
*/
