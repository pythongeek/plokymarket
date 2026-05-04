-- Migration: 9998_fix_create_event_complete.sql
-- KEY FIX: events is a VIEW over event_definitions+markets.
-- Original function tried INSERT INTO events (VIEW) → "cannot insert into view"
-- Fixed: INSERT into event_definitions (base table) + markets, then cross-link.
--
-- Verified column types on polymarket-prod (127.0.0.1:5433):
--   event_definitions: id=uuid, title=varchar, answer_type=answer_type(custom enum),
--                      description=text, slug=text, category=text, tags=jsonb,
--                      creator_id=uuid, event_id=uuid (nullable)
--   markets:           id=uuid, question=text, creator_id=uuid, event_id=uuid,
--                      trading_closes_at=timestamptz, status=market_status,
--                      initial_liquidity=numeric
--
-- Also fixes:
--   - JSONB tags/ai_keywords/ai_sources (not TEXT[])
--   - Removed non-existent slug_generate() call
--   - Added market_id to return object

CREATE OR REPLACE FUNCTION create_event_complete(
    p_event_data JSONB,
    p_creator_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_def_id  UUID;
    v_market_id      UUID;
    v_slug           TEXT;
    v_title          TEXT;
    v_question       TEXT;
    v_category       TEXT;
    v_trading_closes_at TIMESTAMPTZ;
    v_resolution_method TEXT;
    v_initial_liquidity NUMERIC;
    v_status         TEXT;
    v_description    TEXT;
    v_image_url      TEXT;
    v_answer_type    TEXT;
    v_existing_id    UUID;
    v_result         JSONB;
BEGIN
    -- Extract scalar fields from p_event_data JSONB
    v_title          := COALESCE((p_event_data->>'title')::TEXT,         'Untitled Event');
    v_question       := COALESCE((p_event_data->>'question')::TEXT,      v_title);
    v_description    := COALESCE((p_event_data->>'description')::TEXT,  '');
    v_category       := COALESCE((p_event_data->>'category')::TEXT,     'Other');
    v_image_url      := COALESCE((p_event_data->>'image_url')::TEXT,   '');
    v_status         := COALESCE((p_event_data->>'status')::TEXT,      'active');
    v_initial_liquidity := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
    v_resolution_method := COALESCE((p_event_data->>'resolution_method')::TEXT, 'manual_admin');
    v_answer_type    := COALESCE((p_event_data->>'answer_type')::TEXT,  'binary');

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

    -- Ensure slug uniqueness
    SELECT id INTO v_existing_id FROM event_definitions WHERE slug = v_slug;
    IF v_existing_id IS NOT NULL THEN
        v_slug := v_slug || '-' || substring(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6);
    END IF;

    -- STEP 1: Insert into event_definitions (the real base table)
    INSERT INTO event_definitions (
        id, title, answer_type, description, slug, category, tags,
        image_url, status, creator_id, event_id,
        starts_at, ends_at, resolves_at,
        created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        v_title,
        v_answer_type::answer_type,
        v_description,
        v_slug,
        v_category,
        COALESCE(p_event_data->'tags', '[]'::jsonb),
        v_image_url,
        v_status::market_status,
        p_creator_id,
        NULL,  -- event_id filled after market creation
        NOW(),
        v_trading_closes_at,
        v_trading_closes_at,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_event_def_id;

    -- STEP 2: Insert into markets (the market for this event)
    INSERT INTO markets (
        id, question, description, category, image_url,
        creator_id, status,
        trading_closes_at, event_date,
        resolved_at, winning_outcome,
        resolution_source, resolution_details,
        min_price, max_price, tick_size,
        fee_percent, initial_liquidity, maker_rebate_percent,
        event_id,
        total_volume,
        created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        v_question,
        v_description,
        v_category,
        v_image_url,
        p_creator_id,
        v_status::market_status,
        v_trading_closes_at,
        NULL,
        NULL,
        NULL,
        v_resolution_method,
        '{}'::jsonb,
        0.001,
        0.999,
        0.01,
        0.02,
        v_initial_liquidity,
        0.01,
        v_event_def_id,   -- link market → event_definition
        0,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_market_id;

    -- STEP 3: Back-fill cross-links
    UPDATE event_definitions SET event_id = v_market_id WHERE id = v_event_def_id;

    -- STEP 4: Return success
    v_result := jsonb_build_object(
        'success',   TRUE,
        'event_id',  v_event_def_id,
        'market_id', v_market_id,
        'slug',      v_slug,
        'message',   'Event and market created successfully'
    );
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success',  FALSE,
        'event_id', NULL,
        'market_id', NULL,
        'slug',     NULL,
        'message',  SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO anon;
