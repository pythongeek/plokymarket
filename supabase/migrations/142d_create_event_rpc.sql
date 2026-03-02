-- ============================================================
-- Migration 142d: Create create_event_with_markets RPC Function
-- CRITICAL: Required for event creation form to work
-- ============================================================

BEGIN;

-- Drop existing function if exists (to allow updates)
DROP FUNCTION IF EXISTS create_event_with_markets(JSONB, JSONB, UUID);

-- Create the RPC function
CREATE OR REPLACE FUNCTION create_event_with_markets(
  event_data JSONB,
  markets_data JSONB DEFAULT '[]'::JSONB,
  p_created_by UUID DEFAULT NULL
) 
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  v_event_id UUID;
  v_market_id UUID;
  v_slug TEXT;
  v_title TEXT;
  v_question TEXT;
BEGIN
  -- Extract title and question with fallbacks
  v_title := COALESCE(
    NULLIF(TRIM(event_data->>'title'), ''),
    NULLIF(TRIM(event_data->>'question'), ''),
    'Untitled Event'
  );
  
  v_question := COALESCE(
    NULLIF(TRIM(event_data->>'question'), ''),
    NULLIF(TRIM(event_data->>'title'), ''),
    'No question provided'
  );
  
  -- Generate slug from title
  v_slug := COALESCE(
    NULLIF(TRIM(event_data->>'slug'), ''),
    LOWER(REGEXP_REPLACE(v_title, '[^a-zA-Z0-9\\u0980-\\u09FF]+', '-', 'g'))
    || '-' || EXTRACT(EPOCH FROM NOW())::INT
  );
  
  -- Truncate slug if too long
  v_slug := LEFT(v_slug, 100);
  
  -- Insert event
  INSERT INTO events (
    title,
    question,
    slug,
    category,
    status,
    trading_closes_at,
    created_by,
    description,
    resolution_method,
    initial_liquidity,
    current_liquidity,
    is_featured,
    created_at,
    updated_at
  )
  VALUES (
    v_title,
    v_question,
    v_slug,
    COALESCE(NULLIF(event_data->>'category', ''), 'sports'),
    'active',
    COALESCE((event_data->>'trading_closes_at')::TIMESTAMPTZ, NOW() + INTERVAL '7 days'),
    COALESCE(p_created_by, auth.uid()),
    COALESCE(event_data->>'description', ''),
    COALESCE(event_data->>'resolution_method', 'manual_admin'),
    COALESCE((event_data->>'initial_liquidity')::NUMERIC, 1000),
    COALESCE((event_data->>'initial_liquidity')::NUMERIC, 1000),
    COALESCE((event_data->>'is_featured')::BOOLEAN, FALSE),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  -- Insert linked market
  INSERT INTO markets (
    event_id,
    question,
    category,
    status,
    trading_closes_at,
    creator_id,
    slug,
    min_price,
    max_price,
    tick_size,
    created_at
  )
  VALUES (
    v_event_id,
    v_question,
    COALESCE(NULLIF(event_data->>'category', ''), 'sports'),
    'active',
    COALESCE((event_data->>'trading_closes_at')::TIMESTAMPTZ, NOW() + INTERVAL '7 days'),
    COALESCE(p_created_by, auth.uid()),
    v_slug || '-market',
    0.01,
    0.99,
    0.01,
    NOW()
  )
  RETURNING id INTO v_market_id;
  
  -- Create resolution system config (optional, non-critical)
  BEGIN
    INSERT INTO resolution_systems (
      event_id,
      primary_method,
      confidence_threshold,
      created_at
    )
    VALUES (
      v_event_id,
      COALESCE(event_data->>'resolution_method', 'manual_admin'),
      85,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Resolution system creation is non-critical
    NULL;
  END;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_event_id,
    'market_id', v_market_id,
    'slug', v_slug,
    'title', v_title,
    'message', 'Event and market created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE,
    'hint', 'Check that all required fields are provided'
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_event_with_markets(JSONB, JSONB, UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION create_event_with_markets IS 'Creates an event and its linked market in a single transaction';

COMMIT;

-- ===================================
-- VERIFICATION: Test the function
-- ===================================
-- Uncomment to test:
/*
SELECT create_event_with_markets(
  '{
    "title": "Test Event",
    "question": "Will this test pass?",
    "category": "sports",
    "trading_closes_at": "2026-12-31T23:59:00Z",
    "description": "Test description"
  }'::JSONB,
  '[]'::JSONB,
  NULL
);
*/
