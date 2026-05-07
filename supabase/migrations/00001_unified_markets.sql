-- =============================================================================
-- MIGRATION: Unified Markets Architecture
-- Replaces broken events + markets 1:1 split with industry-standard single-table
-- Date: 2026-05-04
-- =============================================================================
-- What this does:
--  1. Add event-metadata columns to markets (title, description, tags, answer_type, event_date, source_url)
--  2. Backfill: 18 standalone markets → create event_definitions for each, link via event_id
--  3. Backfill: 12 orphaned event_definitions → create markets for each, link
--  4. Remove circular event_definitions.event_id column (was: markets.id, creates circular FK)
--  5. Make markets.event_id the ONE-WAY link to event_definitions (event is parent, market is child)
--  6. Update create_event_complete RPC to single-table insert
--  7. Replace events VIEW with a simple markets-derived view (backwards compat)
--  8. Add RLS policies for new columns
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: Add event metadata columns to markets
-- These store the "event" data directly on the market (industry standard)
-- =============================================================================

ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS event_title TEXT,
  ADD COLUMN IF NOT EXISTS event_description TEXT,
  ADD COLUMN IF NOT EXISTS event_tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS event_answer_type TEXT DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS event_source_url TEXT,
  ADD COLUMN IF NOT EXISTS event_slug TEXT,
  ADD COLUMN IF NOT EXISTS event_category TEXT;

COMMENT ON COLUMN markets.event_title       IS 'Display title for the event (often = question for single-market events)';
COMMENT ON COLUMN markets.event_description IS 'Event description/background context';
COMMENT ON COLUMN markets.event_tags        IS 'AI-generated and admin tags for the event';
COMMENT ON COLUMN markets.event_answer_type IS 'binary | scalar | multiple_choice';
COMMENT ON COLUMN markets.event_date        IS 'When the event question resolves (date of the real-world outcome)';
COMMENT ON COLUMN markets.event_source_url  IS 'URL source for the event (news article, etc.)';
COMMENT ON COLUMN markets.event_slug        IS 'URL slug for the event page (separate from market slug)';
COMMENT ON COLUMN markets.event_category    IS 'Event category (mirrors market category but for parent event)';

-- =============================================================================
-- STEP 2: Backfill event metadata into markets from event_definitions
-- For the 5 markets that ARE linked to event_definitions
-- =============================================================================

UPDATE markets m
SET
  event_title       = COALESCE(e.title, m.question),
  event_description = e.description,
  event_tags        = e.tags,
  event_answer_type = e.answer_type::TEXT,
  event_date        = e.event_date,
  event_source_url  = e.source_url,
  event_slug        = e.slug,
  event_category    = e.category
FROM event_definitions e
WHERE m.event_id = e.id;

-- =============================================================================
-- STEP 3: Backfill event metadata for 18 STANDALONE markets (no event_id)
-- Create an event_definitions entry for each, then link
-- =============================================================================

-- 3a: Insert event_definitions for each standalone market (WHERE event_id IS NULL)
INSERT INTO event_definitions (
  id, title, answer_type, description, slug, category, tags,
  image_url, source_url, status, event_date, creator_id,
  starts_at, ends_at, resolves_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  COALESCE(m.question, m.name) AS title,           -- use market question as event title
  (CASE WHEN m.answer_type IN ('YES_NO', 'yes_no', 'YES', 'NO') THEN 'binary' ELSE COALESCE(m.answer_type, 'binary') END)::answer_type, -- default to binary
  m.description,
  COALESCE(m.slug, 'event-' || substring(m.id::TEXT, 1, 8)) AS slug,
  COALESCE(m.category, 'General')::TEXT,
  COALESCE(to_jsonb(m.tags), '[]'::jsonb),
  m.image_url,
  NULL,
  'active'::market_status,
  m.event_date,
  m.creator_id,
  m.created_at,
  m.trading_closes_at,
  m.trading_closes_at,
  m.created_at,
  m.updated_at
FROM markets m
WHERE m.event_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM event_definitions ed
    WHERE ed.title = COALESCE(m.question, m.name)
      AND ed.category = COALESCE(m.category, 'General')::TEXT
  );

-- 3b: Link those markets to their new event_definitions (by matching title + category)
UPDATE markets m
SET event_id = (
  SELECT ed.id FROM event_definitions ed
  WHERE ed.title = COALESCE(m.question, m.name)
    AND ed.category = COALESCE(m.category, 'General')::TEXT
  ORDER BY ed.created_at DESC
  LIMIT 1
)
WHERE m.event_id IS NULL
  AND EXISTS (
    SELECT 1 FROM event_definitions ed
    WHERE ed.title = COALESCE(m.question, m.name)
  );

-- 3c: For remaining unlinked markets (title mismatch), backfill metadata directly into markets
-- (no event_definitions link needed — market IS the event)
UPDATE markets m
SET
  event_title       = COALESCE(m.question, m.name),
  event_description = m.description,
  event_tags        = to_jsonb(COALESCE(m.tags, '{}')),
  event_answer_type = COALESCE(m.answer_type, 'binary')::TEXT,
  event_date        = m.event_date,
  event_source_url  = m.source_url,
  event_slug        = m.slug,
  event_category    = m.category
WHERE m.event_id IS NULL;

-- =============================================================================
-- STEP 4: Backfill markets for 12 ORPHANED event_definitions (no market)
-- Create a market entry for each event that has no linked market
-- =============================================================================

INSERT INTO markets (
  id, question, description, category, image_url, creator_id, status,
  trading_closes_at, event_date, source_url, slug, answer_type, tags,
  name, name_bn, question_bn,
  min_price, max_price, tick_size, fee_percent, initial_liquidity,
  maker_rebate_percent, event_id,
  total_volume, volume_24h, liquidity, is_featured, market_type,
  resolution_method, resolution_delay_hours,
  event_title, event_description, event_tags, event_answer_type,
  event_source_url, event_slug, event_category,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  e.title,                  -- question = event title
  e.description,
  COALESCE(e.category, 'General')::TEXT,
  e.image_url,
  e.creator_id,
  e.status::market_status,
  COALESCE(e.resolves_at, e.ends_at, NOW() + INTERVAL '30 days'), -- trading_closes_at
  NULL,                     -- event_date: leave NULL for orphaned events (constraint: event_date>trading_closes_at OR NULL)
  e.source_url,
  e.slug,
  COALESCE(e.answer_type, 'binary')::TEXT,
  NULL,                     -- tags: text[] on markets, not needed (event_tags is canonical JSONB)
  e.title AS name,          -- name = title
  NULL,                     -- name_bn
  NULL,                     -- question_bn
  0.0001,                   -- min_price
  0.9999,                   -- max_price
  0.01,                     -- tick_size
  0.02,                     -- fee_percent
  1000,                     -- initial_liquidity
  0.01,                     -- maker_rebate_percent
  e.id,                     -- link back to event_definitions
  0,                        -- total_volume
  0,                        -- volume_24h
  0,                        -- liquidity
  false,                    -- is_featured
  'binary',                 -- market_type
  'manual_admin',           -- resolution_method
  24,                       -- resolution_delay_hours
  e.title,                  -- event_title = title
  e.description,            -- event_description
  e.tags,                   -- event_tags
  COALESCE(e.answer_type, 'binary')::TEXT, -- event_answer_type
  e.source_url,             -- event_source_url
  e.slug,                   -- event_slug
  COALESCE(e.category, 'General')::TEXT,  -- event_category
  e.created_at,
  e.updated_at
FROM event_definitions e
WHERE NOT EXISTS (
  SELECT 1 FROM markets m WHERE m.event_id = e.id
);

-- =============================================================================
-- STEP 5: Remove circular event_definitions.event_id column
-- This column was a mistake: it pointed from event → market
-- In industry standard, only market → event (not both ways)
-- =============================================================================

-- First drop FK that references markets.id
ALTER TABLE event_definitions DROP CONSTRAINT IF EXISTS event_definitions_event_id_fkey;

-- Drop the circular column
ALTER TABLE event_definitions DROP COLUMN IF EXISTS event_id;

-- =============================================================================
-- STEP 6: Add proper RLS policies for new event metadata columns
-- (RLS already enabled on markets, just need policies for new columns)
-- =============================================================================

-- New columns inherit SELECT policies (public can read active, authenticated reads all)
-- INSERT/UPDATE only via admin (already enforced by admin policies)

-- =============================================================================
-- STEP 7: Update create_event_complete RPC
-- OLD: inserted into BOTH event_definitions AND markets
-- NEW: inserts into markets ONLY (single table — industry standard)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_event_complete(
  p_event_data JSONB,
  p_creator_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_market_id        UUID;
  v_slug             TEXT;
  v_question         TEXT;
  v_title            TEXT;
  v_description      TEXT;
  v_category         TEXT;
  v_event_date       TIMESTAMPTZ;
  v_trading_closes   TIMESTAMPTZ;
  v_initial_liq      NUMERIC;
  v_resolution_method TEXT;
  v_answer_type      TEXT;
  v_tags             JSONB;
  v_source_url       TEXT;
  v_image_url        TEXT;
  v_existing_id      UUID;
  v_result           JSONB;
BEGIN
  -- Extract fields safely
  v_title            := COALESCE(TRIM(p_event_data->>'title'), 'Untitled Event');
  v_question         := COALESCE(TRIM(p_event_data->>'question'), v_title);
  v_description      := COALESCE(TRIM(p_event_data->>'description')::TEXT, '');
  v_category         := COALESCE(LOWER(TRIM(p_event_data->>'category')), 'general');
  v_tags             := COALESCE(p_event_data->'tags', '[]'::jsonb);
  v_source_url       := COALESCE(TRIM(p_event_data->>'source_url')::TEXT, '');
  v_image_url        := COALESCE(TRIM(p_event_data->>'image_url')::TEXT, '');
  v_answer_type      := COALESCE(LOWER(TRIM(p_event_data->>'answer_type')), 'binary');
  v_initial_liq      := COALESCE((p_event_data->>'initial_liquidity')::NUMERIC, 1000);
  v_resolution_method := COALESCE(TRIM(p_event_data->>'resolution_method'), 'manual_admin');

  -- Parse dates safely
  BEGIN
    v_event_date := (p_event_data->>'event_date')::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN v_event_date := NULL; END;

  BEGIN
    v_trading_closes := (p_event_data->>'trading_closes_at')::TIMESTAMPTZ;
    IF v_trading_closes IS NULL THEN
      v_trading_closes := NOW() + INTERVAL '30 days';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_trading_closes := NOW() + INTERVAL '30 days';
  END;

  -- Generate unique slug
  IF TRIM(COALESCE(p_event_data->>'slug', '')) != '' THEN
    v_slug := LOWER(TRIM(BOTH '-' FROM regexp_replace(
      p_event_data->>'slug', '[^a-zA-Z0-9-]', '-', 'g')));
  ELSE
    v_slug := LOWER(TRIM(BOTH '-' FROM regexp_replace(
      regexp_replace(v_title, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g')));
  END IF;

  -- Ensure slug uniqueness
  SELECT id INTO v_existing_id FROM markets WHERE slug = v_slug;
  IF v_existing_id IS NOT NULL THEN
    v_slug := v_slug || '-' || SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6);
  END IF;

  -- ==========================================================
  -- INDUSTRY STANDARD: Single-table insert into markets ONLY
  -- event_definitions is DEPRECATED for single-market events
  -- ==========================================================
  INSERT INTO markets (
    id, question, name, name_bn, question_bn,
    description, category, image_url, source_url,
    creator_id, status,
    trading_closes_at, event_date,
    slug, tags, answer_type,
    event_title, event_description, event_tags, event_answer_type,
    event_date, event_source_url, event_slug, event_category,
    min_price, max_price, tick_size,
    fee_percent, initial_liquidity, maker_rebate_percent,
    total_volume, volume_24h, liquidity,
    is_featured, market_type, resolution_method, resolution_delay_hours,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_question,
    v_title, NULL, NULL,
    v_description,
    v_category,
    v_image_url,
    v_source_url,
    p_creator_id,
    COALESCE((p_event_data->>'status')::market_status, 'active'::market_status),
    v_trading_closes,
    v_event_date,
    v_slug,
    v_tags,
    v_answer_type,
    v_title,                   -- event_title = title for single-market
    v_description,             -- event_description
    v_tags,                    -- event_tags
    v_answer_type,             -- event_answer_type
    v_event_date,
    v_source_url,
    v_slug,                    -- event_slug
    v_category,                -- event_category
    0.0001,
    0.9999,
    0.01,
    0.02,
    v_initial_liq,
    0.01,
    0,
    0,
    v_initial_liq,
    COALESCE((p_event_data->>'is_featured')::BOOLEAN, false),
    'binary',
    v_resolution_method,
    24,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_market_id;

  -- Return success
  v_result := JSONB_BUILD_OBJECT(
    'success',   TRUE,
    'market_id', v_market_id,
    'slug',      v_slug,
    'message',   'Market created successfully (unified single-table architecture)'
  );
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN JSONB_BUILD_OBJECT(
    'success',  FALSE,
    'market_id', NULL,
    'slug',     NULL,
    'message',  SQLERRM
  );
END;
$$;

-- =============================================================================
-- STEP 8: Update get_admin_events RPC to query markets (not the VIEW)
-- This replaces the broken events VIEW
-- =============================================================================

CREATE OR REPLACE FUNCTION get_admin_events(
  p_status    TEXT,
  p_category  TEXT,
  p_search    TEXT,
  p_limit     INT,
  p_offset    INT
)
RETURNS TABLE (
  id                    UUID,
  title                 TEXT,
  question              TEXT,
  description           TEXT,
  category              TEXT,
  subcategory           TEXT,
  tags                  JSONB,
  image_url             TEXT,
  slug                  TEXT,
  status                market_status,
  is_featured           BOOLEAN,
  trading_closes_at     TIMESTAMPTZ,
  starts_at             TIMESTAMPTZ,
  ends_at               TIMESTAMPTZ,
  total_volume          NUMERIC,
  created_at            TIMESTAMPTZ,
  event_id              UUID,
  creator_id            UUID,
  event_title           TEXT,
  event_slug            TEXT,
  event_category        TEXT,
  event_answer_type     TEXT,
  resolution_method     TEXT,
  current_yes_price     NUMERIC,
  current_no_price      NUMERIC,
  liquidity             NUMERIC,
  market_count          BIGINT,
  resolver_reference     TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    COALESCE(m.event_title, m.question, m.name)::TEXT          AS title,
    m.question,
    COALESCE(m.event_description, m.description)::TEXT          AS description,
    COALESCE(m.event_category, m.category)::TEXT                 AS category,
    m.subcategory,
    COALESCE(m.event_tags, m.tags, '[]'::jsonb)::JSONB           AS tags,
    m.image_url,
    m.slug,
    m.status,
    m.is_featured,
    m.trading_closes_at,
    m.starts_at,
    m.ends_at,
    COALESCE(m.total_volume, 0)::NUMERIC                         AS total_volume,
    m.created_at,
    m.event_id,
    m.creator_id,
    m.event_title,
    m.event_slug,
    m.event_category,
    m.event_answer_type,
    m.resolution_method,
    COALESCE(m.current_price_yes, m.yes_price, 0.5)::NUMERIC    AS current_yes_price,
    COALESCE(m.current_price_no, m.no_price, 0.5)::NUMERIC      AS current_no_price,
    COALESCE(m.liquidity, m.initial_liquidity, 0)::NUMERIC      AS liquidity,
    1::BIGINT                                                   AS market_count,
    m.resolver_reference
  FROM markets m
  WHERE
    (p_status IS NULL OR m.status = p_status::market_status)
    AND (p_category IS NULL OR COALESCE(m.event_category, m.category) = p_category)
    AND (p_search IS NULL OR
         m.question ILIKE '%' || p_search || '%' OR
         COALESCE(m.event_title, m.name) ILIKE '%' || p_search || '%' OR
         m.slug ILIKE '%' || p_search || '%')
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 9: Replace the events VIEW with a backwards-compatible markets view
-- This keeps old code working while using the new single-table structure
-- =============================================================================

DROP VIEW IF EXISTS events CASCADE;

-- =============================================================================
-- STEP 9: Replace the events VIEW with a backwards-compatible markets view
-- Columns only reference actual markets table columns.
-- Non-existent fields are returned as NULL for backwards compatibility.
-- =============================================================================

CREATE OR REPLACE VIEW events AS
SELECT
  -- Market identity
  m.id,
  m.slug,
  m.status::TEXT,

  -- Event title (= market question or explicit event_title)
  COALESCE(m.event_title, m.question, m.name)    AS title,
  m.question,
  m.event_title,

  -- Description
  COALESCE(m.event_description, m.description)  AS description,

  -- Category
  COALESCE(m.event_category, m.category)       AS category,
  m.subcategory,

  -- Dates
  m.starts_at,
  m.ends_at,
  m.trading_closes_at,
  m.event_date,
  m.resolved_at,

  -- Event metadata
  COALESCE(m.event_tags, to_jsonb(COALESCE(m.tags, '{}'::text[])), '[]'::jsonb) AS tags,
  m.event_answer_type                           AS answer_type,
  m.event_source_url                            AS source_url,
  m.event_slug                                  AS event_slug,

  -- Image (only image_url exists — thumbnail_url and banner_url do not exist)
  m.image_url,
  NULL::TEXT                                    AS thumbnail_url,
  NULL::TEXT                                    AS banner_url,

  -- Creator
  m.creator_id,
  m.created_at,
  m.updated_at,

  -- Market trading data (live from markets table)
  m.question                                   AS market_question,
  COALESCE(m.current_price_yes, m.yes_price, 0.5) AS current_yes_price,
  COALESCE(m.current_price_no, m.no_price, 0.5)   AS current_no_price,
  COALESCE(m.total_volume, 0)                   AS total_volume,
  COALESCE(m.volume_24h, 0)                    AS volume_24h,
  COALESCE(m.liquidity, m.initial_liquidity, 0) AS liquidity,
  COALESCE(m.initial_liquidity, 1000)           AS initial_liquidity,
  0::BIGINT                                     AS total_trades,  -- not a real column, use 0
  COALESCE(m.unique_traders, 0)::BIGINT         AS unique_traders,

  -- Resolution
  m.resolution_method,
  m.resolved_at,
  m.winning_outcome,
  m.resolution_source,
  m.resolution_details,

  -- Market properties
  m.is_featured,
  m.answer1,
  m.answer2,
  m.answer_type                                AS market_answer_type,
  m.tick_size,
  m.min_price,
  m.max_price,

  -- Link to parent event_definitions (NULL for standalone markets)
  m.event_id,

  -- Polymarket compatibility fields
  m.condition_id,
  m.token1,
  m.token2,
  m.neg_risk,
  m.market_type,
  m.fee_percent,
  m.maker_rebate_percent,
  m.resolver_reference,

  -- Price changes (price_change_24h does not exist; individual changes do)
  m.yes_price_change_24h,
  m.no_price_change_24h,
  NULL::NUMERIC                                AS price_change_24h,

  -- Misc
  m.current_stage,
  m.trading_phase,
  m.close_warned,
  NULL::BOOLEAN                               AS is_verified,
  NULL::BOOLEAN                               AS is_trending,
  m.resolution_delay_hours,
  NULL::JSONB                                 AS ai_keywords,
  NULL::JSONB                                 AS ai_sources,
  NULL::NUMERIC                               AS ai_confidence_threshold
FROM markets m;

-- =============================================================================
-- STEP 10: Add event_category index (heavily filtered in admin queries)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_markets_event_category ON markets(COALESCE(event_category, category));

-- =============================================================================
-- STEP 11: Seed market_categories from existing distinct categories
-- =============================================================================

INSERT INTO market_categories (id, name, slug, icon, color, sort_order, created_at)
SELECT
  gen_random_uuid(),
  INITCAP(LOWER(COALESCE(event_category, category))),
  LOWER(COALESCE(event_category, category)),
  '📊',
  '#6366f1',
  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::INT,
  NOW()
FROM markets
WHERE COALESCE(event_category, category) IS NOT NULL
GROUP BY COALESCE(event_category, category)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run these after migration)
-- =============================================================================
-- SELECT 'markets with event_id' AS check, count(*) FROM markets WHERE event_id IS NOT NULL;
-- SELECT 'markets without event_id' AS check, count(*) FROM markets WHERE event_id IS NULL;
-- SELECT 'event_definitions without markets' AS check, count(*) FROM event_definitions e WHERE NOT EXISTS (SELECT 1 FROM markets m WHERE m.event_id = e.id);
-- SELECT 'events view row count' AS check, count(*) FROM events;
-- SELECT 'active markets with prices' AS check, count(*) FROM markets WHERE status='active';
