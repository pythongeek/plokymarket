-- ============================================================
-- Migration 123: Multi-Outcome Market Support (Phase 2)
-- Apply in Supabase SQL Editor
-- ============================================================
-- This migration extends the existing binary (YES/NO) system to support
-- multiple outcomes per market (e.g., "Who will win? A, B, or C")
-- 
-- Industry Standard Logic:
-- - Probability Sync: Each outcome's current_price represents its probability (0-1)
-- - Sum of all outcome probabilities should equal 1.0 (excluding order book spread)
-- - Uses existing CLOB Matching Engine for order matching
-- ============================================================

-- Market type enum (extend existing markets table)
DO $$ BEGIN
  CREATE TYPE market_type_enum AS ENUM ('binary', 'multi_outcome', 'scalar');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Extend markets table with new columns (additive only)
ALTER TABLE markets
  ADD COLUMN IF NOT EXISTS market_type market_type_enum DEFAULT 'binary',
  ADD COLUMN IF NOT EXISTS min_value DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS max_value DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS scalar_unit TEXT;

-- Outcomes table for multi-outcome markets
CREATE TABLE IF NOT EXISTS outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  label_bn TEXT,                          -- Bengali label for local UX
  image_url TEXT,
  current_price DECIMAL(10,4) DEFAULT 0.5 CHECK (current_price BETWEEN 0 AND 1),
  total_volume DECIMAL(18,2) DEFAULT 0,
  price_change_24h DECIMAL(10,4) DEFAULT 0,
  display_order INT DEFAULT 0,
  is_winning BOOLEAN,                     -- Set during resolution
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast outcome lookups by market
CREATE INDEX IF NOT EXISTS idx_outcomes_market_id ON outcomes(market_id);

-- RLS policies for outcomes
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

-- Everyone can read outcomes
DO $$ BEGIN
  CREATE POLICY "outcomes_read_all" ON outcomes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Only admins can insert outcomes
DO $$ BEGIN
  CREATE POLICY "outcomes_insert_admin" 
    ON outcomes FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND (user_profiles.is_admin = true OR user_profiles.is_super_admin = true)
      )
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Only admins can update outcomes
DO $$ BEGIN
  CREATE POLICY "outcomes_update_admin" 
    ON outcomes FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND (user_profiles.is_admin = true OR user_profiles.is_super_admin = true)
      )
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Function to validate outcome probability sum (should be ~1.0)
CREATE OR REPLACE FUNCTION validate_outcome_probabilities()
RETURNS TRIGGER AS $$
DECLARE
  total_prob DECIMAL(10,4);
  market_type_val market_type_enum;
BEGIN
  -- Get market type
  SELECT market_type INTO market_type_val
  FROM markets WHERE id = NEW.market_id;
  
  -- Only validate for multi_outcome markets
  IF market_type_val = 'multi_outcome' THEN
    SELECT COALESCE(SUM(current_price), 0) INTO total_prob
    FROM outcomes
    WHERE market_id = NEW.market_id;
    
    -- Allow some tolerance for floating point (0.95 to 1.05)
    IF total_prob > 1.05 THEN
      RAISE WARNING 'Outcome probabilities sum to %, expected ~1.0 for market %', total_prob, NEW.market_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to validate probabilities on outcome update
DROP TRIGGER IF EXISTS trg_validate_outcome_probabilities ON outcomes;
CREATE TRIGGER trg_validate_outcome_probabilities
  AFTER INSERT OR UPDATE OF current_price ON outcomes
  FOR EACH ROW EXECUTE FUNCTION validate_outcome_probabilities();

-- Function to auto-create binary outcomes for existing markets
CREATE OR REPLACE FUNCTION migrate_binary_market_outcomes()
RETURNS void AS $$
DECLARE
  m RECORD;
BEGIN
  FOR m IN SELECT id, name, yes_price, no_price, total_volume 
           FROM markets 
           WHERE market_type = 'binary' 
           OR market_type IS NULL
  LOOP
    -- Check if outcomes already exist for this market
    IF NOT EXISTS (SELECT 1 FROM outcomes WHERE market_id = m.id) THEN
      -- Create YES outcome
      INSERT INTO outcomes (market_id, label, label_bn, current_price, total_volume, display_order)
      VALUES (m.id, 'YES', 'হ্যাঁ', COALESCE(m.yes_price, 0.5), COALESCE(m.total_volume, 0) / 2, 0);
      
      -- Create NO outcome
      INSERT INTO outcomes (market_id, label, label_bn, current_price, total_volume, display_order)
      VALUES (m.id, 'NO', 'না', COALESCE(m.no_price, 0.5), COALESCE(m.total_volume, 0) / 2, 1);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run migration for existing markets (optional - run manually if needed)
-- SELECT migrate_binary_market_outcomes();

COMMENT ON TABLE outcomes IS 'Multi-outcome support for prediction markets. Each outcome represents a possible result.';
COMMENT ON COLUMN outcomes.current_price IS 'Probability of this outcome (0.0 to 1.0). Sum of all outcomes for a market should be ~1.0';
COMMENT ON COLUMN outcomes.label_bn IS 'Bengali label for Bangladesh market localization';
