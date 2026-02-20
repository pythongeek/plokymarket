-- Migration 100: Fix Event Schema and Visibility
-- =============================================

-- 1. Markets Table Cleanup & Robustness
DO $$
BEGIN
    -- Ensure columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'is_featured') THEN
        ALTER TABLE public.markets ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'name') THEN
        ALTER TABLE public.markets ADD COLUMN name TEXT;
    END IF;
END $$;

-- 2. Backfill name and question if they are mismatched or missing
UPDATE public.markets 
SET name = COALESCE(name, question) 
WHERE name IS NULL;

UPDATE public.markets 
SET question = COALESCE(question, name) 
WHERE question IS NULL;

-- 3. Fix Markets RLS Policy
-- Drop restrictive policies and ensure public can view ALL markets (active, pending, resolved)
DROP POLICY IF EXISTS "Public can view markets" ON public.markets;
DROP POLICY IF EXISTS "Public can view active markets" ON public.markets;
DROP POLICY IF EXISTS "Public read access to active events" ON public.events;

CREATE POLICY "Public can view markets" 
ON public.markets FOR SELECT 
USING (true);

-- Ensure Events table also allows viewing pending/inactive for public if needed, 
-- but usually public only needs active events. Let's keep it consistent.
DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events" 
ON public.events FOR SELECT 
USING (true);

-- 4. Fix get_events_with_resolution Function
-- Drop the old function first because the return type (OUT params) changed
-- and PostgreSQL doesn't allow changing return types with CREATE OR REPLACE.
DROP FUNCTION IF EXISTS get_events_with_resolution(VARCHAR, VARCHAR, INTEGER);

CREATE OR REPLACE FUNCTION get_events_with_resolution(
  p_status VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
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
    m.name,
    m.question,
    m.category,
    m.subcategory,
    m.tags,
    m.trading_closes_at,
    m.status,
    COALESCE(rs.primary_method, 'manual_admin') as resolution_method,
    COALESCE(rs.status, 'pending') as resolution_status,
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
