-- ============================================================================
-- Migration 133: Fix JSONB to TEXT[] casting errors
-- Problem: Some columns are TEXT[] type but code tries to insert JSONB
-- Solution: Fix the casting in create_event_complete function
-- ============================================================================

-- ============================================================================
-- FIX 1: Fix create_event_complete function in migration 094
-- The function was trying to cast JSONB to TEXT[] directly which fails
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
    v_result JSONB;
    v_initial_liquidity NUMERIC;
    v_system_user_id UUID;
    v_category TEXT;
    v_is_custom_category BOOLEAN;
    v_tags TEXT[];
    v_ai_keywords TEXT[];
    v_ai_sources TEXT[];
BEGIN
    -- Generate slug if not provided
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(COALESCE(p_event_data->>'title', p_event_data->>'question'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    
    -- Check if this is a custom category
    v_is_custom_category := COALESCE((p_event_data->>'is_custom_category')::BOOLEAN, FALSE);
    v_category := COALESCE(p_event_data->>'category', 'general');
    
    -- If custom category, add to custom_categories table
    IF v_is_custom_category AND v_category != 'general' THEN
        BEGIN
            INSERT INTO public.custom_categories (name, slug, icon, display_order, created_by)
            VALUES (
                v_category,
                lower(regexp_replace(v_category, '[^a-zA-Z0-9]+', '-', 'g')),
                '📌',
                999,
                p_admin_id
            );
        EXCEPTION WHEN unique_violation THEN
            NULL;
        END;
    END IF;
    
    -- FIX: Properly convert JSONB arrays to TEXT[]
    -- Method 1: If it's a JSONB array, use jsonb_array_elements_text
    -- Method 2: If empty or null, use empty array
    IF p_event_data->'tags' IS NOT NULL AND jsonb_array_length(p_event_data->'tags') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')) INTO v_tags;
    ELSE
        v_tags := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_keywords' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_keywords') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_keywords')) INTO v_ai_keywords;
    ELSE
        v_ai_keywords := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_sources' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_sources') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_sources')) INTO v_ai_sources;
    ELSE
        v_ai_sources := ARRAY[]::TEXT[];
    END IF;
    
    -- Insert event
    INSERT INTO public.events (
        title,
        slug,
        question,
        description,
        category,
        subcategory,
        tags,
        image_url,
        answer_type,
        answer1,
        answer2,
        status,
        starts_at,
        trading_opens_at,
        trading_closes_at,
        resolution_method,
        resolution_delay_hours,
        resolution_source,
        initial_liquidity,
        current_liquidity,
        is_featured,
        ai_keywords,
        ai_sources,
        ai_confidence_threshold,
        created_by
    ) VALUES (
        COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question'),
        v_slug,
        COALESCE(p_event_data->>'question', p_event_data->>'title'),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        v_tags,
        p_event_data->>'image_url',
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE(p_event_data->>'status', 'pending'),
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        p_event_data->>'resolution_source',
        v_initial_liquidity,
        v_initial_liquidity,
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        v_ai_keywords,
        v_ai_sources,
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
        p_admin_id
    )
    RETURNING id INTO v_event_id;
    
    -- Also create a linked market record
    INSERT INTO public.markets (
        event_id,
        name,
        question,
        description,
        category,
        subcategory,
        tags,
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
        created_by,
        image_url
    ) VALUES (
        v_event_id,
        COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question'),
        COALESCE(p_event_data->>'question', p_event_data->>'title'),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        v_tags,
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        v_initial_liquidity,
        v_initial_liquidity,
        'active',
        v_slug,
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        p_admin_id,
        p_event_data->>'image_url'
    )
    RETURNING id INTO v_market_id;
    
    -- Create resolution config
    BEGIN
        INSERT INTO resolution_systems (
            event_id,
            primary_method,
            ai_keywords,
            ai_sources,
            confidence_threshold,
            status
        ) VALUES (
            COALESCE(v_market_id, v_event_id),
            COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
            v_ai_keywords,
            v_ai_sources,
            COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
            'pending'
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Resolution config creation skipped: %', SQLERRM;
    END;
    
    -- INITIALIZE ORDERBOOK
    IF COALESCE(p_event_data->>'status', 'pending') = 'active' AND v_initial_liquidity > 0 THEN
        SELECT id INTO v_system_user_id
        FROM public.user_profiles
        WHERE is_admin = true
        ORDER BY created_at ASC
        LIMIT 1;

        IF v_system_user_id IS NOT NULL THEN
            INSERT INTO public.orders (
                market_id,
                user_id,
                side,
                outcome,
                price,
                quantity,
                filled_quantity,
                status,
                order_type
            ) VALUES 
            (v_market_id, v_system_user_id, 'buy', 'YES', 0.48, v_initial_liquidity, 0, 'open', 'limit'),
            (v_market_id, v_system_user_id, 'buy', 'NO', 0.48, v_initial_liquidity, 0, 'open', 'limit');
        ELSE
            RAISE WARNING 'No admin user found to seed market liquidity';
        END IF;
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully',
        'is_custom_category', v_is_custom_category,
        'category', v_category
    );
    
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    v_result := jsonb_build_object(
        'success', FALSE,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
    RETURN v_result;
END;
$$;

-- ============================================================================
-- FIX 2: Also fix create_event_with_markets function from migration 123
-- ============================================================================
CREATE OR REPLACE FUNCTION create_event_with_markets(
    p_event_data JSONB,
    p_markets_data JSONB[]
) RETURNS JSONB AS $$
DECLARE
    new_event_id UUID;
    new_market_id UUID;
    market_record JSONB;
    result JSONB;
    event_title TEXT;
    event_slug TEXT;
    outcome_label TEXT;
    outcome_labels TEXT[];
    v_tags TEXT[];
    v_ai_keywords TEXT[];
    v_ai_sources TEXT[];
    i INT;
BEGIN
    event_title := COALESCE(p_event_data->>'title', p_event_data->>'name');
    event_slug  := p_event_data->>'slug';

    RAISE NOTICE 'Creating event: % with slug: %', event_title, event_slug;

    -- Convert JSONB arrays to TEXT[] safely
    IF p_event_data->'tags' IS NOT NULL AND jsonb_array_length(p_event_data->'tags') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')) INTO v_tags;
    ELSE
        v_tags := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_keywords' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_keywords') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_keywords')) INTO v_ai_keywords;
    ELSE
        v_ai_keywords := ARRAY[]::TEXT[];
    END IF;
    
    IF p_event_data->'ai_sources' IS NOT NULL AND jsonb_array_length(p_event_data->'ai_sources') > 0 THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_sources')) INTO v_ai_sources;
    ELSE
        v_ai_sources := ARRAY[]::TEXT[];
    END IF;

    INSERT INTO events (
        title,
        question,
        description,
        category,
        subcategory,
        tags,
        slug,
        image_url,
        trading_closes_at,
        resolution_method,
        status,
        is_featured,
        created_by,
        initial_liquidity,
        starts_at,
        trading_opens_at,
        resolution_delay_hours,
        answer_type,
        answer1,
        answer2,
        ai_keywords,
        ai_sources,
        ai_confidence_threshold
    ) VALUES (
        event_title,
        COALESCE(p_event_data->>'question', event_title),
        p_event_data->>'description',
        COALESCE(p_event_data->>'category', 'general'),
        p_event_data->>'subcategory',
        v_tags,
        event_slug,
        p_event_data->>'image_url',
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', p_event_data->>'primary_method', 'manual_admin'),
        COALESCE(p_event_data->>'status', 'active'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
        (p_event_data->>'created_by')::UUID,
        COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        v_ai_keywords,
        v_ai_sources,
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85)
    )
    RETURNING id INTO new_event_id;

    RAISE NOTICE 'Event created with ID: %', new_event_id;

    -- Create markets
    IF p_markets_data IS NOT NULL AND array_length(p_markets_data, 1) > 0 THEN
        FOREACH market_record IN ARRAY p_markets_data
        LOOP
            RAISE NOTICE 'Creating market for event: %', new_event_id;

            INSERT INTO markets (
                event_id,
                name,
                question,
                description,
                category,
                subcategory,
                tags,
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
                created_by,
                image_url
            ) VALUES (
                new_event_id,
                COALESCE(market_record->>'name', event_title),
                COALESCE(market_record->>'question', market_record->>'name', event_title),
                COALESCE(market_record->>'description', p_event_data->>'description'),
                COALESCE(market_record->>'category', p_event_data->>'category', 'general'),
                p_event_data->>'subcategory',
                v_tags,
                COALESCE(
                    (market_record->>'trading_closes_at')::TIMESTAMPTZ,
                    (p_event_data->>'trading_closes_at')::TIMESTAMPTZ
                ),
                COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
                COALESCE((market_record->>'liquidity')::DECIMAL, 1000),
                COALESCE((market_record->>'liquidity')::DECIMAL, 1000),
                'active',
                event_slug || '-market-' || gen_random_uuid()::TEXT,
                COALESCE(p_event_data->>'answer_type', 'binary'),
                COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
                COALESCE(p_event_data->>'answer2', 'না (No)'),
                COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
                (p_event_data->>'created_by')::UUID,
                p_event_data->>'image_url'
            )
            RETURNING id INTO new_market_id;

            -- Create outcomes in separate outcomes table
            BEGIN
                IF market_record->'outcomes' IS NOT NULL AND jsonb_array_length(market_record->'outcomes') > 0 THEN
                    FOR i IN 0..jsonb_array_length(market_record->'outcomes')-1
                    LOOP
                        outcome_label := market_record->'outcomes'->>i;
                        INSERT INTO outcomes (market_id, label, display_order, current_price)
                        VALUES (
                            new_market_id,
                            outcome_label,
                            i,
                            1.0 / jsonb_array_length(market_record->'outcomes')
                        );
                    END LOOP;
                END IF;
            EXCEPTION WHEN undefined_table THEN
                RAISE NOTICE 'outcomes table not found, skipping outcome creation';
            WHEN OTHERS THEN
                RAISE NOTICE 'Outcome creation skipped: %', SQLERRM;
            END;
        END LOOP;
    ELSE
        -- Default single market
        INSERT INTO markets (
            event_id,
            name,
            question,
            description,
            category,
            subcategory,
            tags,
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
            created_by,
            image_url
        ) VALUES (
            new_event_id,
            event_title,
            COALESCE(p_event_data->>'question', event_title),
            p_event_data->>'description',
            COALESCE(p_event_data->>'category', 'general'),
            p_event_data->>'subcategory',
            v_tags,
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
            COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
            COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
            COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
            'active',
            event_slug,
            COALESCE(p_event_data->>'answer_type', 'binary'),
            COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
            COALESCE(p_event_data->>'answer2', 'না (No)'),
            COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
            (p_event_data->>'created_by')::UUID,
            p_event_data->>'image_url'
        )
        RETURNING id INTO new_market_id;
    END IF;

    -- Create resolution config
    BEGIN
        INSERT INTO resolution_systems (
            event_id,
            primary_method,
            ai_keywords,
            ai_sources,
            confidence_threshold,
            status
        ) VALUES (
            new_market_id,
            COALESCE(p_event_data->>'resolution_method', p_event_data->>'primary_method', 'manual_admin'),
            v_ai_keywords,
            v_ai_sources,
            COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
            'pending'
        )
        ON CONFLICT (event_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Resolution config skipped: %', SQLERRM;
    END;

    -- Activity log
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_activity_logs') THEN
            INSERT INTO admin_activity_logs (admin_id, action_type, resource_type, resource_id, change_summary, new_values)
            VALUES (
                (p_event_data->>'created_by')::UUID,
                'create_event',
                'market',
                new_market_id,
                'Event created: ' || event_title,
                p_event_data
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Activity log skipped: %', SQLERRM;
    END;

    result := jsonb_build_object(
        'success',    true,
        'event_id',   new_event_id,
        'market_id',  new_market_id,
        'slug',       event_slug,
        'message',    'Event and market created successfully'
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Transaction failed: % | Event: % | Slug: %',
        SQLERRM, event_title, event_slug;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB[]) TO service_role;

-- ============================================================================
-- FIX 3: Grant execute permission on create_event_complete
-- ============================================================================
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO service_role;

-- ============================================================================
-- FIX 4: Ensure markets table has correct columns
-- ============================================================================
-- Add missing columns to markets table if they don't exist
DO $$
BEGIN
    -- Add answer_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'answer_type') THEN
        ALTER TABLE public.markets ADD COLUMN answer_type VARCHAR(20) DEFAULT 'binary';
    END IF;
    
    -- Add answer1 if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'answer1') THEN
        ALTER TABLE public.markets ADD COLUMN answer1 VARCHAR(200) DEFAULT 'হ্যাঁ (Yes)';
    END IF;
    
    -- Add answer2 if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'markets' AND column_name = 'answer2') THEN
        ALTER TABLE public.markets ADD COLUMN answer2 VARCHAR(200) DEFAULT 'না (No)';
    END IF;
    
    -- Ensure tags is TEXT[] type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'markets' AND column_name = 'tags' 
               AND data_type = 'jsonb') THEN
        -- Convert jsonb tags to text[]
        ALTER TABLE public.markets ADD COLUMN tags_new TEXT[] DEFAULT ARRAY[]::TEXT[];
        UPDATE public.markets SET tags_new = ARRAY(SELECT jsonb_array_elements_text(tags)) WHERE tags IS NOT NULL;
        ALTER TABLE public.markets DROP COLUMN tags;
        ALTER TABLE public.markets RENAME COLUMN tags_new TO tags;
    END IF;
END $$;

-- ============================================================================
-- Notify PostgREST to reload schema
-- ============================================================================
NOTIFY pgrst, 'reload schema';
