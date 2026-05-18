-- PLOKY SIMULATOR CLEANUP
-- Run this in Supabase SQL Editor to remove all simulation artifacts
-- ⚠️ Review before executing in production!

BEGIN;

-- 1. Delete simulation users (and cascade to wallets, orders, etc.)
-- Note: This requires ON DELETE CASCADE on foreign keys
DELETE FROM auth.users 
WHERE raw_user_meta_data->>'is_simulation' = 'true';

-- 2. Delete simulation markets
DELETE FROM markets 
WHERE is_simulation = true 
   OR slug LIKE 'sim-%' 
   OR name LIKE 'SIMULATION:%';

-- 3. Delete orphaned wallets (if no cascade)
DELETE FROM wallets 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 4. Delete orphaned orders
DELETE FROM orders 
WHERE user_id NOT IN (SELECT id FROM auth.users) 
   OR market_id NOT IN (SELECT id FROM markets);

-- 5. Delete orphaned trades
DELETE FROM trades 
WHERE buyer_id NOT IN (SELECT id FROM auth.users) 
   OR seller_id NOT IN (SELECT id FROM auth.users);

-- 6. Delete orphaned positions
DELETE FROM positions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

COMMIT;
