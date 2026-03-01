-- ============================================================================
-- Vercel Supabase Cleanup Script (Run This FIRST on Vercel Dashboard)
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to Vercel Dashboard → Your Project → Storage → Supabase
-- 2. Click "Open in Supabase Dashboard"
-- 3. Go to SQL Editor → New Query
-- 4. Copy and paste this entire script
-- 5. Click Run
--
-- ⚠️ WARNING: This deletes conflicting migrations. BACKUP YOUR DATA FIRST!
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete conflicting migrations
-- ============================================================================

-- These migrations conflict with the production CLOB system
DELETE FROM supabase_migrations.migrations 
WHERE name IN (
  -- Resolution system conflicts
  '132_fix_resolution_method_constraint',
  '131_add_resolution_date_to_events',
  '011_add_resolution_system_columns',
  '116_resolution_interface',
  '105_comments_and_resolvers',
  '083_production_resolution_system',
  '082_market_resolution_system',
  '20260225_add_resolution_delay_to_events',
  
  -- Event creation RPC conflicts (simple versions)
  '123_create_event_with_markets_rpc',
  '125_fix_event_creation_and_markets_fetch',
  '138_fix_events_constraints',
  '139_fix_create_event_function',
  
  -- Simple event system (not CLOB)
  '093_manual_event_system',
  '094_reimplemented_events_markets',
  
  -- Old resolution fix attempts
  '141_final_resolution_fix',
  '140_fix_events_constraints'
);

-- ============================================================================
-- STEP 2: Clean up old resolution_systems tables if they exist
-- ============================================================================

-- Drop old table with wrong FK (if exists)
DROP TABLE IF EXISTS resolution_systems CASCADE;

-- ============================================================================
-- STEP 3: Clean up old functions
-- ============================================================================

-- Drop old conflicting functions
DROP FUNCTION IF EXISTS create_event_complete(JSONB, UUID);
DROP FUNCTION IF EXISTS get_admin_events(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS validate_event_resolution(UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS resolve_market_with_system(UUID, TEXT);

-- ============================================================================
-- STEP 4: Add helper column to track migration status
-- ============================================================================

-- Add migration tracking to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'migration_version'
  ) THEN
    ALTER TABLE events ADD COLUMN migration_version INTEGER DEFAULT 141;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Migrations cleaned up successfully' AS status;
SELECT 'Ready to apply: 142_production_clob_system.sql' AS next_step;

-- Show remaining migrations count
SELECT COUNT(*) as remaining_migrations FROM supabase_migrations.migrations;
