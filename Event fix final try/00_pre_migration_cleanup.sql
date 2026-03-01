-- ============================================================================
-- Pre-Migration Cleanup Script (Optional but Recommended)
-- Run this BEFORE migration 141 to ensure clean state
-- ============================================================================

-- This script drops conflicting objects that migration 141 will recreate
-- It's optional because migration 141 handles conflicts anyway,
-- but running this first ensures a completely clean state

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: Drop conflicting functions
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS create_event_complete(JSONB, UUID);
DROP FUNCTION IF EXISTS get_admin_events(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_admin_events(VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS create_event_with_resolution(JSONB, JSONB, UUID);
DROP FUNCTION IF EXISTS create_event_with_markets(JSONB, JSONB[]);
DROP FUNCTION IF EXISTS get_events_with_resolution(VARCHAR, VARCHAR, INTEGER);

RAISE NOTICE 'Dropped conflicting functions';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: Drop conflicting constraints
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.events 
  DROP CONSTRAINT IF EXISTS events_resolution_method_check,
  DROP CONSTRAINT IF EXISTS chk_events_resolution_delay;

ALTER TABLE public.markets 
  DROP CONSTRAINT IF EXISTS markets_resolution_method_check,
  DROP CONSTRAINT IF EXISTS valid_market_resolution_method;

RAISE NOTICE 'Dropped conflicting constraints';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: Drop resolution_systems table and related objects
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop indexes first
DROP INDEX IF EXISTS idx_resolution_systems_event;
DROP INDEX IF EXISTS idx_resolution_systems_status;
DROP INDEX IF EXISTS idx_resolution_systems_method;

-- Drop policies
DROP POLICY IF EXISTS "resolution_systems_admin" ON resolution_systems;
DROP POLICY IF EXISTS "Everyone can view resolution systems" ON resolution_systems;
DROP POLICY IF EXISTS "Only admins can modify resolution systems" ON resolution_systems;
DROP POLICY IF EXISTS "Public can view resolution systems" ON resolution_systems;
DROP POLICY IF EXISTS "Admins can manage resolution systems" ON resolution_systems;

-- Drop the table
DROP TABLE IF EXISTS public.resolution_systems CASCADE;

RAISE NOTICE 'Dropped resolution_systems table and related objects';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: Clean up any orphaned expert panel or related tables
-- (These are not recreated by migration 141)
-- ─────────────────────────────────────────────────────────────────────────────

-- These tables from migration 081 are NOT recreated by 141
-- If you want to keep them, comment these lines out
DROP TABLE IF EXISTS public.expert_panel CASCADE;
DROP TABLE IF EXISTS public.news_sources CASCADE;
DROP TABLE IF EXISTS public.dispute_records CASCADE;
DROP TABLE IF EXISTS public.ai_daily_topics CASCADE;
DROP TABLE IF EXISTS public.ai_resolution_pipelines CASCADE;

RAISE NOTICE 'Cleaned up expert panel and AI-related tables';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5: Verify cleanup
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  func_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count remaining conflicting functions
  SELECT COUNT(*) INTO func_count
  FROM pg_proc
  WHERE proname IN ('create_event_complete', 'create_event_with_resolution', 'create_event_with_markets');
  
  -- Count resolution-related tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('resolution_systems', 'expert_panel', 'dispute_records');
  
  RAISE NOTICE 'Cleanup complete:';
  RAISE NOTICE '  - Remaining conflicting functions: %', func_count;
  RAISE NOTICE '  - Remaining resolution tables: %', table_count;
  
  IF func_count = 0 AND table_count = 0 THEN
    RAISE NOTICE '✅ Clean state achieved. Ready for migration 141!';
  ELSE
    RAISE NOTICE '⚠️ Some objects remain, but migration 141 should handle them';
  END IF;
END $$;

COMMIT;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
