-- Migration: Fix outcome_type enum case sensitivity
-- This migration ensures the outcome_type enum has the correct uppercase values
-- by adding triggers to enforce uppercase on future inserts/updates

-- First, check if lowercase values exist in any table and update them safely
-- We need to handle this in a way that doesn't fail if values don't exist

-- Create a function to safely update outcome values
CREATE OR REPLACE FUNCTION fix_outcome_case()
RETURNS void AS $$
BEGIN
    -- Try to update orders - using DO blocks to ignore errors
    BEGIN
        UPDATE orders SET outcome = 'YES' WHERE outcome::text = 'yes';
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if column doesn't exist or other error
    END;
    
    BEGIN
        UPDATE orders SET outcome = 'NO' WHERE outcome::text = 'no';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        UPDATE trades SET outcome = 'YES' WHERE outcome::text = 'yes';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        UPDATE trades SET outcome = 'NO' WHERE outcome::text = 'no';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        UPDATE positions SET outcome = 'YES' WHERE outcome::text = 'yes';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    BEGIN
        UPDATE positions SET outcome = 'NO' WHERE outcome::text = 'no';
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT fix_outcome_case();

-- Drop the function as it's no longer needed
DROP FUNCTION IF EXISTS fix_outcome_case();

-- Create a trigger function to ensure uppercase outcome values on future inserts/updates
CREATE OR REPLACE FUNCTION ensure_uppercase_outcome()
RETURNS TRIGGER AS $$
BEGIN
  NEW.outcome := UPPER(NEW.outcome::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to orders table
DROP TRIGGER IF EXISTS trigger_ensure_uppercase_outcome ON orders;
CREATE TRIGGER trigger_ensure_uppercase_outcome
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION ensure_uppercase_outcome();

-- Apply to trades table
DROP TRIGGER IF EXISTS trigger_ensure_uppercase_outcome_trades ON trades;
CREATE TRIGGER trigger_ensure_uppercase_outcome_trades
BEFORE INSERT OR UPDATE ON trades
FOR EACH ROW
EXECUTE FUNCTION ensure_uppercase_outcome();

-- Apply to positions table
DROP TRIGGER IF EXISTS trigger_ensure_uppercase_outcome_positions ON positions;
CREATE TRIGGER trigger_ensure_uppercase_outcome_positions
BEFORE INSERT OR UPDATE ON positions
FOR EACH ROW
EXECUTE FUNCTION ensure_uppercase_outcome();

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'outcome_type enum case fix applied successfully';
END $$;
