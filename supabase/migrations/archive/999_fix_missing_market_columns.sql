-- Migration: Fix missing market columns
-- Adds resolution_deadline and other missing columns referenced in types but not in DB

-- Add resolution_deadline column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'resolution_deadline') THEN
    ALTER TABLE markets ADD COLUMN resolution_deadline TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added resolution_deadline column to markets table';
  ELSE
    RAISE NOTICE 'resolution_deadline column already exists';
  END IF;
END $$;

-- Add resolution_criteria column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'resolution_criteria') THEN
    ALTER TABLE markets ADD COLUMN resolution_criteria TEXT;
    RAISE NOTICE 'Added resolution_criteria column to markets table';
  ELSE
    RAISE NOTICE 'resolution_criteria column already exists';
  END IF;
END $$;

-- Add oracle_type column if missing (maps to resolution_source_type in some places)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'oracle_type') THEN
    ALTER TABLE markets ADD COLUMN oracle_type VARCHAR(50) DEFAULT 'MANUAL';
    RAISE NOTICE 'Added oracle_type column to markets table';
  ELSE
    RAISE NOTICE 'oracle_type column already exists';
  END IF;
END $$;

-- Add market_type enum if not exists
DO $$ 
BEGIN
  CREATE TYPE market_type_enum AS ENUM ('binary', 'multi_outcome', 'scalar');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add market_type column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'market_type') THEN
    ALTER TABLE markets ADD COLUMN market_type market_type_enum DEFAULT 'binary';
    RAISE NOTICE 'Added market_type column to markets table';
  ELSE
    RAISE NOTICE 'market_type column already exists';
  END IF;
END $$;

-- Add price change tracking columns if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'yes_price_change_24h') THEN
    ALTER TABLE markets ADD COLUMN yes_price_change_24h DECIMAL(10,4) DEFAULT 0;
    RAISE NOTICE 'Added yes_price_change_24h column to markets table';
  ELSE
    RAISE NOTICE 'yes_price_change_24h column already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'no_price_change_24h') THEN
    ALTER TABLE markets ADD COLUMN no_price_change_24h DECIMAL(10,4) DEFAULT 0;
    RAISE NOTICE 'Added no_price_change_24h column to markets table';
  ELSE
    RAISE NOTICE 'no_price_change_24h column already exists';
  END IF;
END $$;

-- Add unique_traders column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'unique_traders') THEN
    ALTER TABLE markets ADD COLUMN unique_traders INT DEFAULT 0;
    RAISE NOTICE 'Added unique_traders column to markets table';
  ELSE
    RAISE NOTICE 'unique_traders column already exists';
  END IF;
END $$;

-- Add scalar range columns if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'min_value') THEN
    ALTER TABLE markets ADD COLUMN min_value DECIMAL(18,4);
    RAISE NOTICE 'Added min_value column to markets table';
  ELSE
    RAISE NOTICE 'min_value column already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'max_value') THEN
    ALTER TABLE markets ADD COLUMN max_value DECIMAL(18,4);
    RAISE NOTICE 'Added max_value column to markets table';
  ELSE
    RAISE NOTICE 'max_value column already exists';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'scalar_unit') THEN
    ALTER TABLE markets ADD COLUMN scalar_unit TEXT;
    RAISE NOTICE 'Added scalar_unit column to markets table';
  ELSE
    RAISE NOTICE 'scalar_unit column already exists';
  END IF;
END $$;

-- Create index on event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_markets_event_id ON markets(event_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);

-- Grant permissions
GRANT SELECT ON markets TO anon, authenticated;
GRANT UPDATE ON markets TO anon, authenticated;

-- Note: This migration is safe to run multiple times (all columns use IF NOT EXISTS)
