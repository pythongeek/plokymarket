-- ============================================================================
-- Migration: Add Missing Market Columns and Fix Event-Market Link
-- Fixes: Market columns missing, event-market relationship issues
-- ============================================================================

-- STEP 1: Add missing columns to markets table if they don't exist

-- Add market_type column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'market_type') THEN
    ALTER TABLE markets ADD COLUMN market_type VARCHAR(50) DEFAULT 'binary';
    RAISE NOTICE 'Added market_type column to markets table';
  ELSE
    RAISE NOTICE 'market_type column already exists';
  END IF;
END $$;

-- Add yes_price_change_24h column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'yes_price_change_24h') THEN
    ALTER TABLE markets ADD COLUMN yes_price_change_24h DECIMAL(5,2) DEFAULT 0;
    RAISE NOTICE 'Added yes_price_change_24h column to markets table';
  ELSE
    RAISE NOTICE 'yes_price_change_24h column already exists';
  END IF;
END $$;

-- Add risk_score column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'risk_score') THEN
    ALTER TABLE markets ADD COLUMN risk_score INT DEFAULT 0;
    RAISE NOTICE 'Added risk_score column to markets table';
  ELSE
    RAISE NOTICE 'risk_score column already exists';
  END IF;
END $$;

-- Add stages_completed column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'stages_completed') THEN
    ALTER TABLE markets ADD COLUMN stages_completed TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added stages_completed column to markets table';
  ELSE
    RAISE NOTICE 'stages_completed column already exists';
  END IF;
END $$;

-- Add current_stage column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'current_stage') THEN
    ALTER TABLE markets ADD COLUMN current_stage VARCHAR(50) DEFAULT 'template_selection';
    RAISE NOTICE 'Added current_stage column to markets table';
  ELSE
    RAISE NOTICE 'current_stage column already exists';
  END IF;
END $$;

-- STEP 2: Ensure all required columns exist for market creation

-- Add trading_closes_at if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'trading_closes_at') THEN
    ALTER TABLE markets ADD COLUMN trading_closes_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added trading_closes_at column';
  END IF;
END $$;

-- Add initial_liquidity if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'initial_liquidity') THEN
    ALTER TABLE markets ADD COLUMN initial_liquidity DECIMAL(18,2) DEFAULT 0;
    RAISE NOTICE 'Added initial_liquidity column';
  END IF;
END $$;

-- Add liquidity if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'liquidity') THEN
    ALTER TABLE markets ADD COLUMN liquidity DECIMAL(18,2) DEFAULT 0;
    RAISE NOTICE 'Added liquidity column';
  END IF;
END $$;

-- Add total_volume if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'total_volume') THEN
    ALTER TABLE markets ADD COLUMN total_volume DECIMAL(18,2) DEFAULT 0;
    RAISE NOTICE 'Added total_volume column';
  END IF;
END $$;

-- Add trader_count if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'trader_count') THEN
    ALTER TABLE markets ADD COLUMN trader_count INT DEFAULT 0;
    RAISE NOTICE 'Added trader_count column';
  END IF;
END $$;

-- Add event_date if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'event_date') THEN
    ALTER TABLE markets ADD COLUMN event_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added event_date column';
  END IF;
END $$;

-- Add event_id if missing (critical for linking to events)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'event_id') THEN
    ALTER TABLE markets ADD COLUMN event_id UUID;
    RAISE NOTICE 'Added event_id column to markets table';
  ELSE
    RAISE NOTICE 'event_id column already exists';
  END IF;
END $$;

-- Add created_by if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'created_by') THEN
    ALTER TABLE markets ADD COLUMN created_by UUID;
    RAISE NOTICE 'Added created_by column';
  END IF;
END $$;

-- Add resolution_delay_hours if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'resolution_delay_hours') THEN
    ALTER TABLE markets ADD COLUMN resolution_delay_hours INT DEFAULT 24;
    RAISE NOTICE 'Added resolution_delay_hours column';
  END IF;
END $$;

-- STEP 3: Add foreign key for event_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'markets_event_id_fkey' 
    AND table_name = 'markets'
  ) THEN
    ALTER TABLE markets ADD CONSTRAINT markets_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added markets_event_id_fkey foreign key';
  END IF;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

-- STEP 4: Grant permissions
GRANT SELECT ON markets TO anon, authenticated;
GRANT UPDATE ON markets TO authenticated;
GRANT INSERT ON markets TO authenticated;

-- STEP 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_event_id ON markets(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);

-- Final notice
DO $$
BEGIN
  RAISE NOTICE 'Migration 999 completed: Added missing market columns and indexes';
END $$;
