-- ============================================================================
-- Migration 125: Fix Event Creation + Market Fetch
-- Fixes:
--   1. "column 'outcomes' of relation 'markets' does not exist" error
--   2. Market status filter so all events are visible
--   3. Custom categories support
-- ============================================================================

-- ============================================================================
-- FIX 1: Drop and recreate create_event_with_markets without invalid columns
-- The old version tried to INSERT `outcomes` into `markets` table — that column
-- does not exist. `outcomes` is a separate table (see migration 123_phase2).
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
    i INT;
BEGIN
    event_title := COALESCE(p_event_data->>'title', p_event_data->>'name');
    event_slug  := p_event_data->>'slug';

    RAISE NOTICE 'Creating event: % with slug: %', event_title, event_slug;

    -- -------------------------------------------------------------------------
    -- STEP 1: Insert Event
    -- -------------------------------------------------------------------------
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
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')),
            ARRAY[]::TEXT[]
        ),
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
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_keywords')),
            ARRAY[]::TEXT[]
        ),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_sources')),
            ARRAY[]::TEXT[]
        ),
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85)
    )
    RETURNING id INTO new_event_id;

    RAISE NOTICE 'Event created with ID: %', new_event_id;

    -- -------------------------------------------------------------------------
    -- STEP 2: Insert Markets (NO `outcomes` column — that is a separate table)
    -- -------------------------------------------------------------------------
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
                COALESCE(
                    ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')),
                    ARRAY[]::TEXT[]
                ),
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

            -- Create outcomes in the separate `outcomes` table (if it exists)
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
            COALESCE(
                ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')),
                ARRAY[]::TEXT[]
            ),
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

    -- -------------------------------------------------------------------------
    -- STEP 3: Create resolution config
    -- -------------------------------------------------------------------------
    BEGIN
        INSERT INTO resolution_systems (
            event_id,
            primary_method,
            ai_keywords,
            ai_sources,
            confidence_threshold,
            status
        ) VALUES (
            new_market_id,  -- resolution_systems.event_id FK points to markets.id
            COALESCE(p_event_data->>'resolution_method', p_event_data->>'primary_method', 'manual_admin'),
            COALESCE(
                ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_keywords')),
                ARRAY[]::TEXT[]
            ),
            COALESCE(
                ARRAY(SELECT jsonb_array_elements_text(p_event_data->'ai_sources')),
                ARRAY[]::TEXT[]
            ),
            COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
            'pending'
        )
        ON CONFLICT (event_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Resolution config skipped: %', SQLERRM;
    END;

    -- -------------------------------------------------------------------------
    -- STEP 4: Activity log
    -- -------------------------------------------------------------------------
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
-- FIX 2: Add `custom_categories` table for user-defined categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.custom_categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '📌',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 999,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_categories_public_read" ON public.custom_categories;
CREATE POLICY "custom_categories_public_read"
    ON public.custom_categories FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "custom_categories_admin_all" ON public.custom_categories;
CREATE POLICY "custom_categories_admin_all"
    ON public.custom_categories FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
    WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));


-- ============================================================================
-- FIX 3: Insert full Bangladesh-specific categories into custom_categories
-- ============================================================================
INSERT INTO public.custom_categories (name, slug, icon, display_order) VALUES
    ('Sports',           'sports',           '🏏', 1),
    ('Cricket',          'cricket',          '🏏', 2),
    ('Football',         'football',         '⚽', 3),
    ('BPL',              'bpl',              '🏏', 4),
    ('Politics',         'politics',         '🗳️',  5),
    ('Bangladesh Politics', 'bangladesh-politics', '🏛️', 6),
    ('Election',         'election',         '🗳️',  7),
    ('Economy',          'economy',          '💰', 8),
    ('Stock Market',     'stock-market',     '📈', 9),
    ('Crypto',           'crypto',           '₿',  10),
    ('Technology',       'technology',       '💻', 11),
    ('Entertainment',    'entertainment',    '🎬', 12),
    ('Bollywood',        'bollywood',        '🎥', 13),
    ('Dhallywood',       'dhallywood',       '🎞️',  14),
    ('World Events',     'world-events',     '🌍', 15),
    ('Science',          'science',          '🔬', 16),
    ('Culture',          'culture',          '🎭', 17),
    ('Business',         'business',         '🏢', 18),
    ('Education',        'education',        '📚', 19),
    ('Health',           'health',           '🏥', 20),
    ('Environment',      'environment',      '🌿', 21),
    ('Infrastructure',   'infrastructure',   '🏗️',  22),
    ('Dhaka City',       'dhaka-city',       '🏙️',  23),
    ('International',    'international',    '🌐', 24),
    ('General',          'general',          '📌', 25)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- FIX 4: Markets RLS - allow ALL markets to be fetched (remove status filter)
-- Frontend should control what it shows, not RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public can view markets" ON public.markets;
DROP POLICY IF EXISTS "Public can view active markets" ON public.markets;

CREATE POLICY "Public can view markets"
    ON public.markets FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events"
    ON public.events FOR SELECT
    USING (true);


-- ============================================================================
-- FIX 5: Helper function to get all categories (built-in + custom)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_all_categories()
RETURNS TABLE (name TEXT, slug TEXT, icon TEXT, display_order INTEGER, is_custom BOOLEAN)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT 
        cc.name, cc.slug, cc.icon, cc.display_order, false AS is_custom
    FROM public.custom_categories cc
    WHERE cc.is_active = TRUE
    ORDER BY cc.display_order, cc.name;
$$;

GRANT EXECUTE ON FUNCTION get_all_categories() TO authenticated, anon;

NOTIFY pgrst, 'reload schema';
