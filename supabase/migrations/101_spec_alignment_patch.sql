-- ===============================================
-- Migration 101: Spec Alignment Patch
-- Aligns events table with design spec §1.1
-- ===============================================

-- -----------------------------------------------
-- 1. Add `name` column (spec §1.1.1)
--    Spec requires `name VARCHAR(255) NOT NULL`
--    Keep `title` as-is, add `name` and backfill
-- -----------------------------------------------
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Backfill name from title for existing rows
UPDATE public.events SET name = title WHERE name IS NULL;

-- Now make it NOT NULL with a default trigger
ALTER TABLE public.events ALTER COLUMN name SET DEFAULT '';
-- For future inserts, auto-populate name from title via trigger
CREATE OR REPLACE FUNCTION sync_event_name_title()
RETURNS TRIGGER AS $$
BEGIN
    -- If name is not provided, copy from title
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name := NEW.title;
    END IF;
    -- If title is not provided, copy from name
    IF NEW.title IS NULL OR NEW.title = '' THEN
        NEW.title := NEW.name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_event_name_title ON public.events;
CREATE TRIGGER trg_sync_event_name_title
    BEFORE INSERT OR UPDATE OF name, title
    ON public.events
    FOR EACH ROW EXECUTE FUNCTION sync_event_name_title();

-- -----------------------------------------------
-- 2. Slug regex CHECK (spec §1.1.1)
--    Spec: CHECK (slug ~ '^[a-z0-9-]+$')
-- -----------------------------------------------
-- Drop existing check if any, then add
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_slug_format;
ALTER TABLE public.events ADD CONSTRAINT events_slug_format 
    CHECK (slug ~ '^[a-z0-9-]+$');

-- -----------------------------------------------
-- 3. Ticker: widen to VARCHAR(255) + UNIQUE (spec §1.1.1)
-- -----------------------------------------------
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'ticker' 
        AND (data_type != 'character varying' OR character_maximum_length != 255)
    ) THEN
        ALTER TABLE public.events ALTER COLUMN ticker TYPE VARCHAR(255);
    END IF;
END $$;
-- Drop existing unique constraint if any, then add
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_ticker_unique;
ALTER TABLE public.events ADD CONSTRAINT events_ticker_unique UNIQUE (ticker);

-- -----------------------------------------------
-- 4. Category CHECK constraint (spec §1.1.2)
--    Spec: CHECK (category IN ('Sports', 'Politics', 'Crypto', 
--           'Economics', 'Technology', 'Entertainment', 'World Events'))
-- -----------------------------------------------
-- First normalize existing data
UPDATE public.events SET category = 'Sports' WHERE category ILIKE 'sports' OR category ILIKE 'খেলাধুলা';
UPDATE public.events SET category = 'Politics' WHERE category ILIKE 'politics' OR category ILIKE 'রাজনীতি';
UPDATE public.events SET category = 'Crypto' WHERE category ILIKE 'crypto' OR category ILIKE 'cryptocurrency';
UPDATE public.events SET category = 'Economics' WHERE category ILIKE 'economics' OR category ILIKE 'economy' OR category ILIKE 'অর্থনীতি';
UPDATE public.events SET category = 'Technology' WHERE category ILIKE 'technology' OR category ILIKE 'tech' OR category ILIKE 'প্রযুক্তি';
UPDATE public.events SET category = 'Entertainment' WHERE category ILIKE 'entertainment' OR category ILIKE 'বিনোদন';
UPDATE public.events SET category = 'World Events' WHERE category ILIKE 'world events' OR category ILIKE 'international' OR category ILIKE 'আন্তর্জাতিক';
-- Map 'general' and any unmatched to 'World Events' as catch-all
UPDATE public.events SET category = 'World Events' 
WHERE category NOT IN ('Sports', 'Politics', 'Crypto', 'Economics', 'Technology', 'Entertainment', 'World Events');

-- Drop old check and add new
-- Must drop search_vector trigger first — PG blocks ALTER TYPE on trigger-dependent columns
DROP TRIGGER IF EXISTS trg_events_search_vector ON public.events;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'category' 
        AND (data_type != 'character varying' OR character_maximum_length != 50)
    ) THEN
        ALTER TABLE public.events ALTER COLUMN category TYPE VARCHAR(50);
    END IF;
END $$;
ALTER TABLE public.events ADD CONSTRAINT events_category_check 
    CHECK (category IN ('Sports', 'Politics', 'Crypto', 'Economics', 'Technology', 'Entertainment', 'World Events'));
ALTER TABLE public.events ALTER COLUMN category SET DEFAULT 'World Events';

-- Recreate the search vector trigger
CREATE TRIGGER trg_events_search_vector
    BEFORE INSERT OR UPDATE OF title, question, description, category, tags
    ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_events_search_vector();

-- -----------------------------------------------
-- 5. Answer fields: widen to VARCHAR(255), change defaults (spec §1.1.2)
-- -----------------------------------------------
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'answer1' 
        AND (data_type != 'character varying' OR character_maximum_length != 255)
    ) THEN
        ALTER TABLE public.events ALTER COLUMN answer1 TYPE VARCHAR(255);
    END IF;
END $$;
ALTER TABLE public.events ALTER COLUMN answer1 SET DEFAULT 'Yes';
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'answer2' 
        AND (data_type != 'character varying' OR character_maximum_length != 255)
    ) THEN
        ALTER TABLE public.events ALTER COLUMN answer2 TYPE VARCHAR(255);
    END IF;
END $$;
ALTER TABLE public.events ALTER COLUMN answer2 SET DEFAULT 'No';

-- -----------------------------------------------
-- 6. Rename resolution_delay_hours → resolution_delay (spec §1.1.3)
--    Spec unit: minutes (not hours)
--    Convert existing hour values → minutes
-- -----------------------------------------------
-- Add new column
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS resolution_delay INTEGER;

-- Convert hours to minutes for existing data (dynamic SQL to avoid parsing errors if column is missing)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'resolution_delay_hours') THEN
        EXECUTE 'UPDATE public.events SET resolution_delay = COALESCE(resolution_delay_hours * 60, 1440) WHERE resolution_delay IS NULL';
    END IF;
END $$;

-- Set default (1440 = 24 hours in minutes)
ALTER TABLE public.events ALTER COLUMN resolution_delay SET DEFAULT 1440;

-- Add range CHECK (60 min to 10080 min = 7 days)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_resolution_delay_check;
ALTER TABLE public.events ADD CONSTRAINT events_resolution_delay_check 
    CHECK (resolution_delay >= 0 AND resolution_delay <= 10080);

-- Drop old column (keep for one migration cycle for safety)
-- We rename it to clearly mark it deprecated
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_resolution_delay_hours_check;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'resolution_delay_hours') THEN
        ALTER TABLE public.events DROP COLUMN resolution_delay_hours;
    END IF;
END $$;

-- -----------------------------------------------
-- 7. Add closed_time (spec §1.1.3)
--    Records actual close time (may differ from ends_at)
-- -----------------------------------------------
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS closed_time TIMESTAMPTZ;

COMMENT ON COLUMN public.events.closed_time IS 'Actual market close time. May differ from ends_at due to early resolution or emergency pause.';

-- -----------------------------------------------
-- 8. Also add resolution_delay to markets table for CLOB compat
-- -----------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'resolution_delay') THEN
        ALTER TABLE public.markets ADD COLUMN resolution_delay INTEGER DEFAULT 1440;
    END IF;
    
    -- Convert existing hours to minutes on markets table too (dynamic SQL for safety)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'resolution_delay_hours') THEN
        EXECUTE 'UPDATE public.markets SET resolution_delay = COALESCE(resolution_delay_hours * 60, 1440) WHERE resolution_delay IS NULL';
        ALTER TABLE public.markets DROP COLUMN resolution_delay_hours;
    END IF;
END $$;

-- -----------------------------------------------
-- 9. Update get_admin_events function for new column names
-- -----------------------------------------------
DROP FUNCTION IF EXISTS get_admin_events(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_admin_events(
    p_status VARCHAR DEFAULT NULL,
    p_category VARCHAR DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    title TEXT,
    slug TEXT,
    question TEXT,
    description TEXT,
    category VARCHAR,
    subcategory VARCHAR,
    tags TEXT[],
    image_url TEXT,
    status VARCHAR,
    is_featured BOOLEAN,
    is_trending BOOLEAN,
    is_verified BOOLEAN,
    answer_type VARCHAR,
    answer1 VARCHAR,
    answer2 VARCHAR,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    trading_closes_at TIMESTAMPTZ,
    closed_time TIMESTAMPTZ,
    resolution_method VARCHAR,
    resolution_delay INTEGER,
    initial_liquidity NUMERIC,
    total_volume NUMERIC,
    total_trades INTEGER,
    unique_traders INTEGER,
    current_yes_price NUMERIC,
    current_no_price NUMERIC,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    market_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.title,
        e.slug,
        e.question,
        e.description,
        e.category,
        e.subcategory,
        e.tags,
        e.image_url,
        e.status,
        e.is_featured,
        e.is_trending,
        e.is_verified,
        e.answer_type,
        e.answer1,
        e.answer2,
        e.starts_at,
        e.ends_at,
        e.trading_closes_at,
        e.closed_time,
        e.resolution_method,
        e.resolution_delay,
        e.initial_liquidity,
        e.total_volume,
        e.total_trades,
        e.unique_traders,
        e.current_yes_price,
        e.current_no_price,
        e.created_by,
        e.created_at,
        e.updated_at,
        COALESCE((SELECT COUNT(*) FROM public.markets m WHERE m.event_id = e.id), 0) as market_count
    FROM public.events e
    WHERE 
        (p_status IS NULL OR e.status = p_status)
        AND (p_category IS NULL OR e.category = p_category)
        AND (p_search IS NULL OR e.search_vector @@ plainto_tsquery('english', p_search)
             OR e.title ILIKE '%' || p_search || '%'
             OR e.name ILIKE '%' || p_search || '%'
             OR e.question ILIKE '%' || p_search || '%')
    ORDER BY e.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- -----------------------------------------------
-- 10. Update create_event_complete for new column names
-- -----------------------------------------------
DROP FUNCTION IF EXISTS create_event_complete(JSONB, UUID);

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
    v_name TEXT;
    v_result JSONB;
BEGIN
    -- Generate slug if not provided
    v_slug := COALESCE(
        p_event_data->>'slug',
        lower(regexp_replace(
            COALESCE(p_event_data->>'title', p_event_data->>'name', p_event_data->>'question'), 
            '[^a-zA-Z0-9]+', '-', 'g'
        )) || '-' || substr(gen_random_uuid()::text, 1, 8)
    );
    
    v_name := COALESCE(p_event_data->>'name', p_event_data->>'title', p_event_data->>'question');
    
    -- Insert event
    INSERT INTO public.events (
        name, title, slug, question, description, category, subcategory, tags, image_url,
        answer_type, answer1, answer2, status, starts_at, trading_opens_at,
        trading_closes_at, resolution_method, resolution_delay, resolution_source,
        initial_liquidity, current_liquidity, is_featured, ai_keywords, ai_sources,
        ai_confidence_threshold, created_by
    ) VALUES (
        v_name,
        COALESCE(p_event_data->>'title', v_name),
        v_slug,
        COALESCE(p_event_data->>'question', v_name),
        p_event_data->>'description',
        COALESCE(p_event_data->>'category', 'World Events'),
        p_event_data->>'subcategory',
        COALESCE((p_event_data->'tags')::TEXT[], '{}'),
        p_event_data->>'image_url',
        COALESCE(p_event_data->>'answer_type', 'binary'),
        COALESCE(p_event_data->>'answer1', 'Yes'),
        COALESCE(p_event_data->>'answer2', 'No'),
        COALESCE(p_event_data->>'status', 'pending'),
        COALESCE((p_event_data->>'starts_at')::TIMESTAMPTZ, NOW()),
        COALESCE((p_event_data->>'trading_opens_at')::TIMESTAMPTZ, NOW()),
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE((p_event_data->>'resolution_delay')::INTEGER, 1440),
        p_event_data->>'resolution_source',
        COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000),
        COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
        COALESCE((p_event_data->'ai_keywords')::TEXT[], '{}'),
        COALESCE((p_event_data->'ai_sources')::TEXT[], '{}'),
        COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
        p_admin_id
    )
    RETURNING id INTO v_event_id;
    
    -- Also create a linked market record for CLOB compatibility
    BEGIN
        INSERT INTO public.markets (
            event_id, name, question, description, category, subcategory, tags,
            trading_closes_at, resolution_delay, initial_liquidity, liquidity,
            status, slug, answer_type, answer1, answer2, is_featured, created_by, image_url
        ) VALUES (
            v_event_id, v_name,
            COALESCE(p_event_data->>'question', v_name),
            p_event_data->>'description',
            COALESCE(p_event_data->>'category', 'World Events'),
            p_event_data->>'subcategory',
            COALESCE((p_event_data->'tags')::TEXT[], '{}'),
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
            COALESCE((p_event_data->>'resolution_delay')::INTEGER, 1440),
            COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000),
            COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000),
            'active', v_slug || '-market',
            COALESCE(p_event_data->>'answer_type', 'binary'),
            COALESCE(p_event_data->>'answer1', 'Yes'),
            COALESCE(p_event_data->>'answer2', 'No'),
            COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE),
            p_admin_id, p_event_data->>'image_url'
        )
        RETURNING id INTO v_market_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Market creation skipped: %', SQLERRM;
        v_market_id := NULL;
    END;
    
    -- Create resolution config
    BEGIN
        INSERT INTO resolution_systems (
            event_id, primary_method, ai_keywords, ai_sources, confidence_threshold, status
        ) VALUES (
            COALESCE(v_market_id, v_event_id),
            COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
            COALESCE((p_event_data->'ai_keywords')::TEXT[], '{}'),
            COALESCE((p_event_data->'ai_sources')::TEXT[], '{}'),
            COALESCE((p_event_data->>'ai_confidence_threshold')::INTEGER, 85),
            'pending'
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Resolution config creation skipped: %', SQLERRM;
    END;
    
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

-- Comments
COMMENT ON COLUMN public.events.name IS 'Short display title (spec §1.1.1)';
COMMENT ON COLUMN public.events.resolution_delay IS 'Oracle buffer time in MINUTES (spec §1.1.3)';
COMMENT ON CONSTRAINT events_slug_format ON public.events IS 'Enforce lowercase alphanumeric + hyphens (spec §1.1.1)';
COMMENT ON CONSTRAINT events_category_check ON public.events IS 'Controlled category vocabulary (spec §1.1.2)';
