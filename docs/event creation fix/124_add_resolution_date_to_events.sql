-- ============================================================================
-- Add missing columns to events table
-- Fixes: "column resolution_date of relation events does not exist"
-- ============================================================================

-- Add resolution_date column (maps from end_date conceptually)
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS resolution_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_method TEXT DEFAULT 'manual_admin',
  ADD COLUMN IF NOT EXISTS resolution_config JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS question TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS trading_closes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS initial_liquidity DECIMAL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS b_parameter DECIMAL DEFAULT 100;

-- Backfill resolution_date from end_date where null
UPDATE public.events 
SET resolution_date = end_date 
WHERE resolution_date IS NULL AND end_date IS NOT NULL;

-- Index for resolution_date
CREATE INDEX IF NOT EXISTS idx_events_resolution_date ON public.events(resolution_date);
CREATE INDEX IF NOT EXISTS idx_events_trading_closes_at ON public.events(trading_closes_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- ============================================================================
-- Update the RPC to match actual schema
-- Drop and recreate with correct column mapping
-- ============================================================================

CREATE OR REPLACE FUNCTION create_event_with_markets(
    p_event_data JSONB,
    p_markets_data JSONB[]
) RETURNS JSONB AS $$
DECLARE
    new_event_id UUID;
    market_record JSONB;
    result JSONB;
    event_title TEXT;
    event_slug TEXT;
BEGIN
    event_title := p_event_data->>'title';
    event_slug  := p_event_data->>'slug';

    RAISE NOTICE 'Creating event: % with slug: %', event_title, event_slug;

    -- ========================================================================
    -- STEP 1: Insert Event (using actual column names)
    -- ========================================================================
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
        resolution_date,
        resolution_method,
        resolution_config,
        status,
        is_featured,
        created_by,
        initial_liquidity,
        b_parameter,
        -- Map to legacy columns for backwards compat
        start_date,
        end_date,
        is_active
    ) VALUES (
        event_title,
        COALESCE(p_event_data->>'question', event_title),
        COALESCE(p_event_data->>'description', ''),
        COALESCE(p_event_data->>'category', 'Other'),
        p_event_data->>'subcategory',
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')),
            ARRAY[]::TEXT[]
        ),
        event_slug,
        p_event_data->>'image_url',
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        COALESCE(
            (p_event_data->>'resolution_date')::TIMESTAMPTZ,
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ
        ),
        COALESCE(p_event_data->>'resolution_method', 'manual_admin'),
        COALESCE(p_event_data->'resolution_config', '{}'::JSONB),
        COALESCE(p_event_data->>'status', 'active'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
        (p_event_data->>'created_by')::UUID,
        COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
        COALESCE((p_event_data->>'b_parameter')::DECIMAL, 100),
        -- Legacy columns
        NOW(),
        COALESCE(
            (p_event_data->>'resolution_date')::TIMESTAMPTZ,
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ
        ),
        TRUE
    )
    RETURNING id INTO new_event_id;

    RAISE NOTICE 'Event created with ID: %', new_event_id;

    -- ========================================================================
    -- STEP 2: Insert Markets
    -- ========================================================================
    IF p_markets_data IS NOT NULL AND array_length(p_markets_data, 1) > 0 THEN
        FOREACH market_record IN ARRAY p_markets_data
        LOOP
            INSERT INTO markets (
                event_id,
                question,
                description,
                outcomes,
                initial_liquidity,
                trading_fee,
                min_trade_amount,
                max_trade_amount,
                status,
                trading_closes_at,
                resolution_date,
                created_by
            ) VALUES (
                new_event_id,
                COALESCE(market_record->>'question', event_title),
                COALESCE(market_record->>'description', ''),
                COALESCE(market_record->'outcomes', '["হ্যাঁ", "না"]'::JSONB),
                COALESCE((market_record->>'liquidity')::DECIMAL, 1000),
                COALESCE((market_record->>'trading_fee')::DECIMAL, 0.02),
                COALESCE((market_record->>'min_trade_amount')::DECIMAL, 10),
                COALESCE((market_record->>'max_trade_amount')::DECIMAL, 10000),
                'active',
                COALESCE(
                    (market_record->>'trading_closes_at')::TIMESTAMPTZ,
                    (p_event_data->>'trading_closes_at')::TIMESTAMPTZ
                ),
                COALESCE(
                    (market_record->>'resolution_date')::TIMESTAMPTZ,
                    (p_event_data->>'resolution_date')::TIMESTAMPTZ,
                    (p_event_data->>'trading_closes_at')::TIMESTAMPTZ
                ),
                (p_event_data->>'created_by')::UUID
            );
        END LOOP;

        RAISE NOTICE 'Created % markets for event: %', array_length(p_markets_data, 1), new_event_id;
    ELSE
        -- Default market
        INSERT INTO markets (
            event_id,
            question,
            description,
            outcomes,
            initial_liquidity,
            trading_fee,
            min_trade_amount,
            max_trade_amount,
            status,
            trading_closes_at,
            resolution_date,
            created_by
        ) VALUES (
            new_event_id,
            event_title,
            COALESCE(p_event_data->>'description', ''),
            '["হ্যাঁ", "না"]'::JSONB,
            COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
            0.02,
            10,
            10000,
            'active',
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
            COALESCE(
                (p_event_data->>'resolution_date')::TIMESTAMPTZ,
                (p_event_data->>'trading_closes_at')::TIMESTAMPTZ
            ),
            (p_event_data->>'created_by')::UUID
        );

        RAISE NOTICE 'Default market created for event: %', new_event_id;
    END IF;

    -- ========================================================================
    -- STEP 3: Liquidity pools (optional)
    -- ========================================================================
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liquidity_pools') THEN
            INSERT INTO liquidity_pools (event_id, market_id, b_parameter, total_liquidity, status)
            SELECT
                new_event_id,
                m.id,
                COALESCE((p_event_data->>'b_parameter')::DECIMAL, 100),
                COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
                'active'
            FROM markets m
            WHERE m.event_id = new_event_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Liquidity pool creation skipped: %', SQLERRM;
    END;

    -- ========================================================================
    -- STEP 4: Activity log (optional)
    -- ========================================================================
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
            INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
            VALUES (
                (p_event_data->>'created_by')::UUID,
                'EVENT_CREATED',
                'event',
                new_event_id,
                jsonb_build_object(
                    'title', event_title,
                    'slug', event_slug,
                    'category', p_event_data->>'category',
                    'markets_count', COALESCE(array_length(p_markets_data, 1), 1)
                )
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Activity log skipped: %', SQLERRM;
    END;

    -- ========================================================================
    -- SUCCESS
    -- ========================================================================
    result := jsonb_build_object(
        'success', true,
        'event_id', new_event_id,
        'slug', event_slug,
        'message', 'Event and markets created successfully'
    );

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Transaction failed: % | Event: % | Slug: %',
        SQLERRM, event_title, event_slug;
END;
$$ LANGUAGE plpgsql;

-- Grants
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB[]) TO service_role;

COMMENT ON FUNCTION create_event_with_markets IS
'Atomic event + markets creation. Fixed column mapping for resolution_date.
Updated: 2026-02-28';
