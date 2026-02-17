-- Migration 094: Fix Events System Bugs
-- 1. Fix get_events_with_resolution function (market_id -> event_id)
-- 2. Ensure name column exists or handle it via question

-- Fix get_events_with_resolution
CREATE OR REPLACE FUNCTION get_events_with_resolution(
  p_status VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  question TEXT,
  category VARCHAR,
  subcategory VARCHAR,
  tags TEXT[],
  trading_closes_at TIMESTAMPTZ,
  status VARCHAR,
  resolution_method VARCHAR,
  resolution_status VARCHAR,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.question,
    m.category,
    m.subcategory,
    m.tags,
    m.trading_closes_at,
    m.status,
    rs.primary_method as resolution_method,
    rs.status as resolution_status,
    m.created_at
  FROM markets m
  LEFT JOIN resolution_systems rs ON rs.event_id = m.id
  WHERE 
    (p_status IS NULL OR m.status = p_status)
    AND (p_category IS NULL OR m.category = p_category)
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Ensure resolution_systems can be joined correctly
-- Some places might have used market_id by mistake in code, but schema has event_id.
-- Let's double check if we need to add an alias or column. 
-- Schema says event_id. We'll stick with that.

-- Add name column to markets if it's missing (to avoid UI crashes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'name') THEN
    ALTER TABLE markets ADD COLUMN name VARCHAR(255);
    -- Backfill name from question
    UPDATE markets SET name = LEFT(question, 255) WHERE name IS NULL;
  END IF;
END $$;
