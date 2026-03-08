-- Migration: Adaptive Tick Sizing Configuration
-- Adds columns to markets table to support dynamic tick sizes based on volatility.
-- Values are stored as BIGINT with a scale of 1,000,000 (6 decimal places).
-- Example: 100n = 0.000100, 1,000,000n = 1.000000

BEGIN;

-- 1. Add columns to markets table
ALTER TABLE markets 
ADD COLUMN IF NOT EXISTS market_category VARCHAR(50) DEFAULT 'binary',
ADD COLUMN IF NOT EXISTS min_tick BIGINT DEFAULT 100, -- 0.0001
ADD COLUMN IF NOT EXISTS max_tick BIGINT DEFAULT 10000, -- 0.01
ADD COLUMN IF NOT EXISTS current_tick BIGINT DEFAULT 100,
ADD COLUMN IF NOT EXISTS realized_volatility_24h DECIMAL(10, 6) DEFAULT 0.02, -- 0.02 = 2% annualized volatility
ADD COLUMN IF NOT EXISTS pending_tick_change JSONB DEFAULT '{}'::jsonb;

-- 2. Fixed categorization logic
-- Standardize existing markets. Since all current markets are binary, we set them as such.
UPDATE markets 
SET market_category = 'binary' 
WHERE market_category IS NULL OR market_category = '';

-- Optional: If you ever add market_type, you can re-run this logic
-- UPDATE markets SET market_category = 'binary' WHERE market_type = 'binary';

COMMIT;
