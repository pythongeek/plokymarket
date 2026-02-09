-- 036_diagnose_and_fix.sql
-- DIAGNOSTIC + MINIMAL FIX
-- Run this to identify and work around trigger issues

-- ===================================
-- PART 1: DIAGNOSTICS (Run this first to see what we're dealing with)
-- ===================================

-- Check triggers on users table
SELECT '=== TRIGGERS ON users TABLE ===' as info;
SELECT 
    tgname as trigger_name,
    CASE tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE tgtype & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 20 THEN 'INSERT OR UPDATE'
        WHEN 24 THEN 'UPDATE OR DELETE'
        WHEN 28 THEN 'INSERT OR UPDATE OR DELETE'
        ELSE 'UNKNOWN'
    END as event,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'public.users'::regclass 
AND NOT tgisinternal;

-- Check FK constraints pointing TO users
SELECT '=== FK CONSTRAINTS REFERENCING users ===' as info;
SELECT 
    conrelid::regclass as child_table,
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE contype = 'f' 
AND confrelid = 'public.users'::regclass;

-- Check FK constraints ON users (self-referential)
SELECT '=== FK CONSTRAINTS ON users TABLE ===' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE contype = 'f' 
AND conrelid = 'public.users'::regclass;

-- Check columns in users table
SELECT '=== users TABLE COLUMNS ===' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';

-- ===================================
-- PART 2: MINIMAL INSERT TEST
-- Try the simplest possible insert
-- ===================================

-- First, check if our user already exists
SELECT '=== CHECKING IF USER EXISTS ===' as info;
SELECT id, email, full_name FROM public.users WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- Try minimal insert with ONLY required columns
-- (Let defaults handle the rest)
SELECT '=== ATTEMPTING MINIMAL INSERT ===' as info;

INSERT INTO public.users (id, email, full_name)
VALUES ('a1111111-1111-1111-1111-111111111111', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING
RETURNING id, email, full_name, created_at;

-- ===================================
-- PART 3: IF MINIMAL INSERT WORKS, ADD REST OF DATA
-- ===================================

-- Update the test user with full details
UPDATE public.users SET
    phone = '+8801711111111',
    full_name = 'Rahim Ahmed',
    kyc_verified = true,
    created_at = NOW() - INTERVAL '90 days'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- ===================================
-- PART 4: ALTERNATIVE APPROACH - USE EXISTING USERS
-- If insert fails, create leaderboard data for EXISTING users only
-- ===================================

-- Check existing users
SELECT '=== EXISTING USERS ===' as info;
SELECT id, email, full_name FROM public.users LIMIT 10;

-- Create leaderboard data for EXISTING users only
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, current_streak, best_streak, period_start, period_end, updated_at)
SELECT 
    u.id,
    'all_time',
    (random() * 100000 + 50000)::bigint,
    (random() * 50000)::bigint,
    (random() * 100000)::bigint,
    10 + (random() * 80),
    floor(random() * 8)::int,
    floor(random() * 12)::int,
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    NOW()
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.leaderboard_cache lc WHERE lc.user_id = u.id AND lc.timeframe = 'all_time')
ON CONFLICT (user_id, timeframe) DO NOTHING;

-- Weekly
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'weekly', trading_volume/4, realized_pnl/4, score/4, roi*0.9, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, NOW()
FROM public.leaderboard_cache WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO NOTHING;

-- ===================================
-- FINAL VERIFICATION
-- ===================================

SELECT '=== FINAL LEADERBOARD COUNT ===' as info;
SELECT timeframe, COUNT(*) as entries 
FROM public.leaderboard_cache 
GROUP BY timeframe;
