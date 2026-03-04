-- Migration: Fix cron job column errors
-- This migration adds missing columns used by workflow cron jobs

-- ============================================
-- 1. Add name_bn column to markets table
-- ============================================
ALTER TABLE IF EXISTS markets 
ADD COLUMN IF NOT EXISTS name_bn TEXT;

COMMENT ON COLUMN markets.name_bn IS 'Bengali name for the market (used by market-close-check workflow)';

-- ============================================
-- 2. Add trading_ends column to markets table
-- ============================================
ALTER TABLE IF EXISTS markets 
ADD COLUMN IF NOT EXISTS trading_ends TIMESTAMPTZ;

COMMENT ON COLUMN markets.trading_ends IS 'Timestamp when trading ends for this market (used by execute-sports, execute-crypto, execute-news workflows)';

-- ============================================
-- 3. Add outcome column to workflow_executions table
-- ============================================
ALTER TABLE IF EXISTS workflow_executions 
ADD COLUMN IF NOT EXISTS outcome JSONB;

COMMENT ON COLUMN workflow_executions.outcome IS 'Outcome data for workflow execution results';

-- ============================================
-- 4. Fix RLS on exchange_rates table
-- ============================================

-- First, check if RLS is enabled
-- If RLS is blocking service role inserts, we need to create a policy

-- Drop existing restrictive policies that might block service role
DROP POLICY IF EXISTS "Service role can insert" ON exchange_rates;
DROP POLICY IF EXISTS "Allow all inserts" ON exchange_rates;

-- Create a policy that allows service role to insert
CREATE POLICY "Service role full access on exchange_rates" 
ON exchange_rates 
FOR ALL 
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Alternatively, create a policy for authenticated users to insert their own
CREATE POLICY "Authenticated users can insert exchange rates" 
ON exchange_rates 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ============================================
-- 5. Create index for trading_ends queries (performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_markets_trading_ends 
ON markets(trading_ends) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_markets_trading_ends_category 
ON markets(trading_ends, category) 
WHERE status = 'active';

-- ============================================
-- 6. Verify columns exist
-- ============================================
DO $$
BEGIN
  -- Check markets columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'name_bn') THEN
    RAISE NOTICE 'Column markets.name_bn exists';
  ELSE
    RAISE WARNING 'Column markets.name_bn does NOT exist after migration';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'markets' AND column_name = 'trading_ends') THEN
    RAISE NOTICE 'Column markets.trading_ends exists';
  ELSE
    RAISE WARNING 'Column markets.trading_ends does NOT exist after migration';
  END IF;

  -- Check workflow_executions column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_executions' AND column_name = 'outcome') THEN
    RAISE NOTICE 'Column workflow_executions.outcome exists';
  ELSE
    RAISE WARNING 'Column workflow_executions.outcome does NOT exist after migration';
  END IF;
END $$;
