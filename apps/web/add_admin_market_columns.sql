-- Migration: Add Admin Market Dashboard Columns
-- Required for market progress tracking and risk scoring

-- Add risk_score column if missing
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

-- Add stages_completed column if missing (array of completed stage IDs)
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

-- Add current_stage column if missing
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

-- Add trading_closes_at column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'trading_closes_at') THEN
    ALTER TABLE markets ADD COLUMN trading_closes_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added trading_closes_at column to markets table';
  ELSE
    RAISE NOTICE 'trading_closes_at column already exists';
  END IF;
END $$;

-- Add initial_liquidity column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'initial_liquidity') THEN
    ALTER TABLE markets ADD COLUMN initial_liquidity DECIMAL(18,2) DEFAULT 0;
    RAISE NOTICE 'Added initial_liquidity column to markets table';
  ELSE
    RAISE NOTICE 'initial_liquidity column already exists';
  END IF;
END $$;

-- Add trading_fee_percent column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'trading_fee_percent') THEN
    ALTER TABLE markets ADD COLUMN trading_fee_percent DECIMAL(5,2) DEFAULT 2.0;
    RAISE NOTICE 'Added trading_fee_percent column to markets table';
  ELSE
    RAISE NOTICE 'trading_fee_percent column already exists';
  END IF;
END $$;

-- Add liquidity column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'liquidity') THEN
    ALTER TABLE markets ADD COLUMN liquidity DECIMAL(18,2) DEFAULT 0;
    RAISE NOTICE 'Added liquidity column to markets table';
  ELSE
    RAISE NOTICE 'liquidity column already exists';
  END IF;
END $$;

-- Add total_volume column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'total_volume') THEN
    ALTER TABLE markets ADD COLUMN total_volume DECIMAL(18,2) DEFAULT 0;
    RAISE NOTICE 'Added total_volume column to markets table';
  ELSE
    RAISE NOTICE 'total_volume column already exists';
  END IF;
END $$;

-- Add winning_outcome column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'winning_outcome') THEN
    ALTER TABLE markets ADD COLUMN winning_outcome VARCHAR(50);
    RAISE NOTICE 'Added winning_outcome column to markets table';
  ELSE
    RAISE NOTICE 'winning_outcome column already exists';
  END IF;
END $$;

-- Add confidence column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'confidence') THEN
    ALTER TABLE markets ADD COLUMN confidence INT DEFAULT 0;
    RAISE NOTICE 'Added confidence column to markets table';
  ELSE
    RAISE NOTICE 'confidence column already exists';
  END IF;
END $$;

-- Add trader_count column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'trader_count') THEN
    ALTER TABLE markets ADD COLUMN trader_count INT DEFAULT 0;
    RAISE NOTICE 'Added trader_count column to markets table';
  ELSE
    RAISE NOTICE 'trader_count column already exists';
  END IF;
END $$;

-- Add event_date column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'markets' AND column_name = 'event_date') THEN
    ALTER TABLE markets ADD COLUMN event_date DATE;
    RAISE NOTICE 'Added event_date column to markets table';
  ELSE
    RAISE NOTICE 'event_date column already exists';
  END IF;
END $$;

-- Grant permissions
GRANT SELECT ON markets TO anon, authenticated;
GRANT UPDATE ON markets TO authenticated;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'markets' 
AND column_name IN ('risk_score', 'stages_completed', 'current_stage', 'trading_closes_at', 'initial_liquidity', 'trading_fee_percent', 'liquidity', 'total_volume', 'winning_outcome', 'confidence', 'trader_count', 'event_date', 'market_type', 'yes_price_change_24h')
ORDER BY column_name;
