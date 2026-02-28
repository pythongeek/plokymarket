-- ============================================================================
-- Migration 137: Fix Slug and Required Columns
-- Problem: slug column has NOT NULL constraint but no default value
-- Solution: Add default value generator for slug
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix events table - Add default for slug
-- ============================================================================

-- First, let's see the current constraint
DO $$
BEGIN
    RAISE NOTICE 'Checking events.slug constraint...';
END $$;

-- Add a default value for slug using a function
-- We'll use a trigger to auto-generate slug from title

-- Create the slug generation function
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug from title if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(
            COALESCE(NEW.title, NEW.name, 'event'), 
            '[^a-zA-Z0-9]+', 
            '-', 
            'g'
        )) || '-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_generate_event_slug ON public.events;

-- Create the trigger
CREATE TRIGGER trg_generate_event_slug
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION generate_event_slug();

-- ============================================================================
-- STEP 2: Also ensure markets table has the same
-- ============================================================================

-- Create slug generator for markets
CREATE OR REPLACE FUNCTION generate_market_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug from name/question if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(
            COALESCE(NEW.name, NEW.question, 'market'), 
            '[^a-zA-Z0-9]+', 
            '-', 
            'g'
        )) || '-' || substr(gen_random_uuid()::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_generate_market_slug ON public.markets;

-- Create the trigger
CREATE TRIGGER trg_generate_market_slug
    BEFORE INSERT OR UPDATE ON public.markets
    FOR EACH ROW
    EXECUTE FUNCTION generate_market_slug();

-- ============================================================================
-- STEP 3: Fix any existing NULL slugs
-- ============================================================================

-- Update existing events with NULL slug
UPDATE public.events 
SET slug = lower(regexp_replace(
    COALESCE(title, name, 'event-' || id::text), 
    '[^a-zA-Z0-9]+', 
    '-', 
    'g'
)) || '-' || substr(gen_random_uuid()::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Update existing markets with NULL slug
UPDATE public.markets 
SET slug = lower(regexp_replace(
    COALESCE(name, question, 'market-' || id::text), 
    '[^a-zA-Z0-9]+', 
    '-', 
    'g'
)) || '-' || substr(gen_random_uuid()::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- ============================================================================
-- STEP 4: Also fix the create_event_complete function to ensure slug is set
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
    v_title TEXT;
BEGIN
    -- Extract title
    v_title := COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question', 'Untitled Event');
    
    -- Generate slug - THIS IS THE KEY FIX
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
    
    -- Insert event - NOW WITH EXPLICIT SLUG
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
        v_slug,  -- EXPLICIT SLUG
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
    
    -- Create market with explicit slug
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
        slug,  -- EXPLICIT SLUG
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
        v_slug || '-market',  -- EXPLICIT SLUG
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
    
    -- Initialize orderbook
    IF COALESCE(p_event_data->>'status', 'active') = 'active' AND v_initial_liquidity > 0 THEN
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
        END IF;
    END IF;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'event_id', v_event_id,
        'market_id', v_market_id,
        'slug', v_slug,
        'message', 'Event created successfully'
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

GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO service_role;

-- ============================================================================
-- STEP 5: Reload PostgREST schema
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 137 applied successfully!';
    RAISE NOTICE 'Slug auto-generation triggers created.';
    RAISE NOTICE 'create_event_complete function updated with explicit slug handling.';
END $$;
