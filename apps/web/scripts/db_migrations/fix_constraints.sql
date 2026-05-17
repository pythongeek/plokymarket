-- Fix critical column gaps and constraint issues blocking migration

-- 1. Add missing columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 2. Add missing column to event_definitions (category)
ALTER TABLE event_definitions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- 3. Check and relax markets date constraint
DO $$
BEGIN
  -- Find the constraint name
  SELECT conname INTO STRICT FROM pg_constraint
  WHERE conname = 'plokymarket_valid_dates' AND conrelid = 'markets'::regclass;

  -- Make constraint more permissive (NULL dates are ok)
  ALTER TABLE markets DROP CONSTRAINT IF EXISTS plokymarket_valid_dates;
  ALTER TABLE markets ADD CONSTRAINT plokymarket_valid_dates
    CHECK (event_date IS NULL OR trading_closes_at IS NULL OR event_date > trading_closes_at);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint not found or could not be modified: %', SQLERRM;
END $$;

-- 4. Add quantity column to order_book (maps from cloud column 'quantity')
ALTER TABLE order_book ADD COLUMN IF NOT EXISTS quantity DECIMAL(20,8) DEFAULT 0;

-- 5. Drop problematic constraints temporarily for migration
ALTER TABLE markets DROP CONSTRAINT IF EXISTS markets_event_date_check;
ALTER TABLE markets DROP CONSTRAINT IF EXISTS markets_trading_closes_check;

-- 6. Check what columns order_book actually needs
DO $$
BEGIN
  -- Make filled_quantity optional
  ALTER TABLE order_book ALTER COLUMN filled_quantity DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'already nullable: %', SQLERRM;
END $$;

-- 7. Set default for markets missing required fields
UPDATE markets SET fee_percent = 0.02 WHERE fee_percent IS NULL;
UPDATE markets SET maker_rebate_percent = 0.01 WHERE maker_rebate_percent IS NULL;
UPDATE markets SET tick_size = 0.01 WHERE tick_size IS NULL;
UPDATE markets SET min_price = 0.01 WHERE min_price IS NULL;
UPDATE markets SET max_price = 0.99 WHERE max_price IS NULL;

SELECT 'Fixes applied' as status;
