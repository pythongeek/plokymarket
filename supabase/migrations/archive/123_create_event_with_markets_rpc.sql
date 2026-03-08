-- ============================================================================
-- Atomic Event and Market Creation Function
-- Ensures data consistency by creating both event and markets in a single transaction
-- If market creation fails, event is also rolled back
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
    -- Extract event details for logging
    event_title := p_event_data->>'title';
    event_slug := p_event_data->>'slug';
    
    RAISE NOTICE 'Creating event: % with slug: %', event_title, event_slug;

    -- ============================================================================
    -- STEP 1: Insert Event
    -- ============================================================================
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
        initial_liquidity
    ) VALUES (
        event_title,
        p_event_data->>'question',
        p_event_data->>'description',
        p_event_data->>'category',
        p_event_data->>'subcategory',
        COALESCE((p_event_data->>'tags')::TEXT[], ARRAY[]::TEXT[]),
        event_slug,
        p_event_data->>'image_url',
        (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
        (p_event_data->>'resolution_date')::TIMESTAMPTZ,
        COALESCE(p_event_data->>'resolution_method', 'MANUAL'),
        COALESCE(p_event_data->'resolution_config', '{}'::JSONB),
        COALESCE(p_event_data->>'status', 'active'),
        COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
        (p_event_data->>'created_by')::UUID,
        COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000)
    )
    RETURNING id INTO new_event_id;

    RAISE NOTICE 'Event created with ID: %', new_event_id;

    -- ============================================================================
    -- STEP 2: Insert Markets (Loop through array)
    -- ============================================================================
    IF p_markets_data IS NOT NULL AND array_length(p_markets_data, 1) > 0 THEN
        FOREACH market_record IN ARRAY p_markets_data
        LOOP
            RAISE NOTICE 'Creating market: % for event: %', market_record->>'question', new_event_id;
            
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
                market_record->>'question',
                COALESCE(market_record->>'description', ''),
                COALESCE(market_record->'outcomes', '["Yes", "No"]'::JSONB),
                COALESCE((market_record->>'liquidity')::DECIMAL, 1000),
                COALESCE((market_record->>'trading_fee')::DECIMAL, 0.02),
                COALESCE((market_record->>'min_trade_amount')::DECIMAL, 10),
                COALESCE((market_record->>'max_trade_amount')::DECIMAL, 10000),
                'active'::market_status,
                (market_record->>'trading_closes_at')::TIMESTAMPTZ,
                (market_record->>'resolution_date')::TIMESTAMPTZ,
                (p_event_data->>'created_by')::UUID
            );
        END LOOP;
        
        RAISE NOTICE 'Created % markets for event: %', array_length(p_markets_data, 1), new_event_id;
    ELSE
        -- Create default market if no markets provided
        RAISE NOTICE 'Creating default market for event: %', new_event_id;
        
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
            p_event_data->>'description',
            '["হ্যাঁ", "না"]'::JSONB,
            COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
            0.02,
            10,
            10000,
            'active'::market_status,
            (p_event_data->>'trading_closes_at')::TIMESTAMPTZ,
            (p_event_data->>'resolution_date')::TIMESTAMPTZ,
            (p_event_data->>'created_by')::UUID
        );
    END IF;

    -- ============================================================================
    -- STEP 3: Create initial liquidity pool (if using LMSR)
    -- ============================================================================
    BEGIN
        -- Check if liquidity_pools table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'liquidity_pools') THEN
            INSERT INTO liquidity_pools (
                event_id,
                market_id,
                b_parameter,
                total_liquidity,
                status
            )
            SELECT 
                new_event_id,
                m.id,
                COALESCE((p_event_data->>'b_parameter')::DECIMAL, 100),
                COALESCE((p_event_data->>'initial_liquidity')::DECIMAL, 1000),
                'active'::market_status
            FROM markets m
            WHERE m.event_id = new_event_id;
            
            RAISE NOTICE 'Liquidity pools created for event: %', new_event_id;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Liquidity pool creation is optional, don't fail transaction
        RAISE WARNING 'Could not create liquidity pools: %', SQLERRM;
    END;

    -- ============================================================================
    -- STEP 4: Log activity
    -- ============================================================================
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_log') THEN
            INSERT INTO activity_log (
                user_id,
                action,
                entity_type,
                entity_id,
                details
            ) VALUES (
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
        -- Activity logging is optional
        RAISE WARNING 'Could not log activity: %', SQLERRM;
    END;

    -- ============================================================================
    -- SUCCESS: Build result
    -- ============================================================================
    result := jsonb_build_object(
        'success', true,
        'event_id', new_event_id,
        'slug', event_slug,
        'message', 'Event and markets created successfully'
    );

    RAISE NOTICE 'Transaction completed successfully for event: %', new_event_id;
    
    RETURN result;

EXCEPTION WHEN OTHERS THEN
    -- ============================================================================
    -- FAILURE: Rollback happens automatically
    -- ============================================================================
    RAISE EXCEPTION 'Transaction failed: % | Event: % | Slug: %', 
        SQLERRM, event_title, event_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant execute permission to authenticated users
-- ============================================================================
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB[]) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB[]) TO service_role;

-- ============================================================================
-- Add comment for documentation
-- ============================================================================
COMMENT ON FUNCTION create_event_with_markets(JSONB, JSONB[]) IS 
'Atomic function to create an event with its associated markets.
Ensures data consistency by using a single transaction.
If any part fails, the entire operation is rolled back.

Parameters:
- p_event_data: JSONB containing event details (title, slug, category, etc.)
- p_markets_data: Array of JSONB objects containing market details

Returns:
- JSONB with success status, event_id, slug, and message';
