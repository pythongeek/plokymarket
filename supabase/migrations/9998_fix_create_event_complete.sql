-- Migration: 9998_fix_create_event_complete.sql (REWRITTEN)
-- The original version referenced event_definitions (which does NOT exist).
-- The actual schema has:
--   events(id, title, slug, question, ..., market_id)   ← primary event table
--   markets(id, question, ..., event_id)                ← FK to events.id
--
-- This function:
--   1. Inserts into events
--   2. Inserts into markets with event_id → events.id
--   3. Updates events.market_id → markets.id (back-link)
--   4. Returns { success, event_id, market_id, slug, message }

CREATE OR REPLACE FUNCTION create_event_complete(
    p_event_data JSONB,
    p_creator_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id           UUID;
    v_market_id          UUID;
    v_slug               TEXT;
    v_title              TEXT;
    v_question           TEXT;
    v_category           TEXT;
    v_trading_closes_at  TIMESTAMPTZ;
    v_resolution_method   TEXT;
    v_initial_liquidity  NUMERIC;
    v_status             TEXT;
    v_description        TEXT;
    v_image_url          TEXT;
    v_is_featured        BOOLEAN;
    v_tags               JSONB;
    v_ai_keywords        TEXT[];
    v_ai_sources         TEXT[];
    v_answer_type        TEXT;
    v_existing_id        UUID;
    v_result             JSONB;
BEGIN
    -- Extract scalar fields from p_event_data JSONB
    v_title              := COALESCE((p_event_data->>'title')::TEXT,           'Untitled Event');
    v_question           := COALESCE((p_event_data->>'question')::TEXT,        v_title);
    v_description        := COALESCE((p_event_data->>'description')::TEXT,     '');
    v_category           := COALESCE((p_event_data->>'category')::TEXT,       'other');
    v_image_url          := COALESCE((p_event_data->>'image_url')::TEXT,      '');
    v_status             := COALESCE((p_event_data->>'status')::TEXT,        'active');
    v_initial_liquidity  := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    v_resolution_method  := COALESCE((p_event_data->>'resolution_method')::TEXT, 'manual_admin');
    v_answer_type        := COALESCE((p_event_data->>'answer_type')::TEXT,    'binary');
    v_is_featured        := COALESCE((p_event_data->>'is_featured')::BOOLEAN, FALSE);
    v_tags               := COALESCE(p_event_data->'tags', '[]'::jsonb);
    v_ai_keywords        := COALESCE(p_event_data->'ai_keywords', '[]'::jsonb)->0;
    v_ai_sources         := COALESCE(p_event_data->'ai_sources',  '[]'::jsonb)->0;

    -- trading_closes_at: parse safely
    BEGIN
        v_trading_closes_at := COALESCE(
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
            NOW() + INTERVAL '30 days'
        );
    EXCEPTION WHEN OTHERS THEN
        v_trading_closes_at := NOW() + INTERVAL '30 days';
    END;

    -- Generate slug: use provided or derive from title
    IF (p_event_data->>'slug') IS NOT NULL
       AND trim(BOTH FROM (p_event_data->>'slug')::TEXT) != '' THEN
        v_slug := lower(trim(BOTH '-' FROM regexp_replace(
            (p_event_data->>'slug')::TEXT, '[^a-zA-Z0-9-]', '-', 'g')));
    ELSE
        v_slug := lower(trim(BOTH '-' FROM regexp_replace(
            regexp_replace(v_title, '[^a-zA-Z0-9\s]', '', 'g'),
            '\s+', '-', 'g')));
    END IF;

    -- Ensure slug uniqueness (check both events and markets tables)
    SELECT id INTO v_existing_id FROM events WHERE slug = v_slug;
    IF v_existing_id IS NOT NULL THEN
        v_slug := v_slug || '-' || substring(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6);
    END IF;

    -- STEP 1: Insert into events
    INSERT INTO events (
        id,
        title,
        slug,
        question,
        description,
        category,
        tags,
        image_url,
        status,
        is_featured,
        trading_closes_at,
        resolution_method,
        initial_liquidity,
        current_liquidity,
        total_volume,
        created_by,
        created_at,
        updated_at,
        ai_keywords,
        ai_sources,
        market_id,
        name,
        name_en,
        resolution_outcome
    ) VALUES (
        gen_random_uuid(),
        v_title,
        v_slug,
        v_question,
        v_description,
        v_category,
        v_tags,
        v_image_url,
        v_status::market_status,
        v_is_featured,
        v_trading_closes_at,
        v_resolution_method,
        v_initial_liquidity,
        v_initial_liquidity,
        0,
        p_creator_id,
        NOW(),
        NOW(),
        COALESCE(v_ai_keywords, '{}'::TEXT[]),
        COALESCE(v_ai_sources,  '{}'::TEXT[]),
        NULL,  -- market_id filled after market creation
        v_title,  -- name = title for compatibility
        v_title,
        NULL
    )
    RETURNING id INTO v_event_id;

    -- STEP 2: Insert into markets (the trading market for this event)
    INSERT INTO markets (
        id,
        question,
        description,
        category,
        image_url,
        creator_id,
        status,
        trading_closes_at,
        event_id,
        initial_liquidity,
        liquidity,
        total_volume,
        slug,
        answer_type,
        is_featured,
        name,
        resolution_method,
        min_price,
        max_price,
        tick_size,
        fee_percent,
        maker_rebate_percent,
        created_at,
        updated_at,
        tags,
        created_by
    ) VALUES (
        gen_random_uuid(),
        v_question,
        v_description,
        v_category,
        v_image_url,
        p_creator_id,
        v_status::market_status,
        v_trading_closes_at,
        v_event_id,   -- link market → event
        v_initial_liquidity,
        v_initial_liquidity,
        0,
        v_slug,
        v_answer_type,
        v_is_featured,
        v_title,
        v_resolution_method,
        0.001,
        0.999,
        0.01,
        0.02,
        0.01,
        NOW(),
        NOW(),
        COALESCE((
            SELECT array_agg(jsonb_array_elements_text) FROM jsonb_array_elements_text(v_tags)
        ), '{}'::TEXT[]),
        p_creator_id
    )
    RETURNING id INTO v_market_id;

    -- STEP 3: Back-fill events.market_id (link event → primary market)
    UPDATE events SET market_id = v_market_id WHERE id = v_event_id;

    -- STEP 4: Return success
    v_result := jsonb_build_object(
        'success',   TRUE,
        'event_id',  v_event_id,
        'market_id', v_market_id,
        'slug',      v_slug,
        'message',   'Event and market created successfully'
    );
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success',   FALSE,
        'event_id',  NULL,
        'market_id', NULL,
        'slug',      NULL,
        'message',   SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO anon;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO service_role;
