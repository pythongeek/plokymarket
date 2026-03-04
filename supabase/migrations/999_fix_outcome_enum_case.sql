-- Migration: Fix outcome_type enum case sensitivity
-- This migration ensures the outcome_type enum has the correct uppercase values

-- First, check if there are any lowercase values in the database
-- If found, they need to be updated to uppercase

-- Update any lowercase values to uppercase (if they exist)
UPDATE orders 
SET outcome = 'YES' 
WHERE outcome = 'yes';

UPDATE orders 
SET outcome = 'NO' 
WHERE outcome = 'no';

-- Update trades table if it has the same issue
UPDATE trades 
SET outcome = 'YES' 
WHERE outcome = 'yes';

UPDATE trades 
SET outcome = 'NO' 
WHERE outcome = 'no';

-- Update positions table if it has the same issue  
UPDATE positions 
SET outcome = 'YES' 
WHERE outcome = 'yes';

UPDATE positions 
SET outcome = 'NO' 
WHERE outcome = 'no';

-- Create a function to ensure uppercase outcome values
CREATE OR REPLACE FUNCTION ensure_uppercase_outcome()
RETURNS TRIGGER AS $$
BEGIN
  NEW.outcome = UPPER(NEW.outcome);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_ensure_uppercase_outcome ON orders;
CREATE TRIGGER trigger_ensure_uppercase_outcome
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION ensure_uppercase_outcome();

-- Also apply to trades table
DROP TRIGGER IF EXISTS trigger_ensure_uppercase_outcome_trades ON trades;
CREATE TRIGGER trigger_ensure_uppercase_outcome_trades
BEFORE INSERT OR UPDATE ON trades
FOR EACH ROW
EXECUTE FUNCTION ensure_uppercase_outcome();

-- Also apply to positions table
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
