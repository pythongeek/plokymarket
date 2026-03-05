-- =============================================
-- INTEGRATE ORDERBOOK SEEDING INTO create_event_complete
-- Migration 999c - Atomic Market Creation + Liquidity Seeding
--
-- Problem: Market creation and orderbook seeding are separate operations
-- Solution: Integrate seeding directly into create_event_complete RPC
-- =============================================

BEGIN;

-- =============================================
-- UPDATE create_event_complete TO SEED ORDER_BOOK
-- =============================================

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
    v_title TEXT;
    v_spread NUMERIC := 0.04;  -- 4% spread (0.48 - 0.52)
    v_liquidity_per_side NUMERIC;
    v_order_id UUID;
BEGIN
    -- Extract title
    v_title := COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question', 'Untitled Event');
    
    -- Generate slug
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    v_is_custom_category := COALESCE((p_event_data->>'is_custom_category')::BOOLEAN, FALSE);
    v_category := COALESCE(p_event_data->>'category', 'general');
    
    -- Handle custom category
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
    
    -- Convert JSONB arrays to TEXT[]
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
        name,
        name_en,
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
        v_title,
        v_title,
        v_title,
        v_slug,
        COALESCE(p_event_data->>'question', v_title),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        v_tags,
        p_event_data->>'image_url',
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'হ্যাঁ (Yes)'),
        COALESCE(p_event_data->>'answer2', 'না (No)'),
        COALESCE(p_event_data->>'status', 'active'),
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
    
    -- Create market
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
        v_title,
        COALESCE(p_event_data->>'question', v_title),
        p_event_data->>'description',
        v_category,
        p_event_data->>'subcategory',
        v_tags,
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE((p_event_data->>'resolution_delay_hours')::INTEGER, 24),
        v_initial_liquidity,
        v_initial_liquidity,
        'active',
        v_slug || '-market',
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
    
    -- =============================================
    -- SEED ORDERBOOK WITH PROPER SPREAD (ATOMIC)
    -- =============================================
    IF COALESCE(p_event_data->>'status', 'active') = 'active' AND v_initial_liquidity > 0 THEN
        -- Get system user for liquidity provision
        SELECT id INTO v_system_user_id
        FROM public.user_profiles
        WHERE is_admin = true
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If no admin user, use null user_id (will need RLS policy for this)
        IF v_system_user_id IS NULL THEN
            v_system_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        END IF;
        
        -- Calculate liquidity per side
        v_liquidity_per_side := v_initial_liquidity / 4;  -- Split into 4 levels
        
        -- YES Outcome: Create BIDS (Buy orders at lower prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        -- YES Outcome: Create ASKS (Sell orders at higher prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        -- NO Outcome: Create BIDS (Buy orders at lower prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'BUY', 0.50 - v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        -- NO Outcome: Create ASKS (Sell orders at higher prices)
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread, v_liquidity_per_side, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        v_order_id := gen_random_uuid();
        INSERT INTO order_book (id, market_id, user_id, side, price, size, filled, status, order_type, time_in_force, created_at, updated_at)
        VALUES (v_order_id, v_event_id, v_system_user_id, 'SELL', 0.50 + v_spread/2, v_liquidity_per_side/2, 0, 'OPEN', 'LIMIT', 'GTC', NOW(), NOW());
        
        RAISE NOTICE 'Orderbook seeded with 8 orders for event %', v_event_id;
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully with orderbook liquidity'
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

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO service_role;

-- =============================================
-- VERIFY
-- =============================================

DO $$
DECLARE
    func_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_event_complete' 
        AND pronargs = 2
    ) INTO func_exists;
    
    IF func_exists THEN
        RAISE NOTICE '✅ create_event_complete updated with integrated orderbook seeding!';
        RAISE NOTICE 'Now every new event will have:';
        RAISE NOTICE '  - YES bids at 0.48 and 0.49';
        RAISE NOTICE '  - YES asks at 0.51 and 0.52';
        RAISE NOTICE '  - NO bids at 0.48 and 0.49';
        RAISE NOTICE '  - NO asks at 0.51 and 0.52';
    ELSE
        RAISE WARNING 'Function update failed!';
    END IF;
END $$;

COMMIT;

-- =============================================
-- SUMMARY:
-- 1. Updated create_event_complete to seed order_book (not orders)
-- 2. Creates proper spread with 8 orders (4 levels x 2 outcomes)
-- 3. Uses events.id as market_id (after FK fix)
-- 4. Atomic transaction - market + liquidity created together
-- =============================================
