-- 032_leaderboard_mock_data_final.sql
-- FINAL WORKING VERSION with valid UUIDs
-- Run this in Supabase SQL Editor

-- ===================================
-- STEP 1: Create users with exception handling
-- ===================================

DO $$
BEGIN
    -- User 1
    BEGIN
        INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at)
        VALUES ('a1111111-1111-1111-1111-111111111111', 'rahim.trader@email.com', '+8801711111111', 'Rahim Ahmed', false, true, NOW() - INTERVAL '90 days')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, kyc_verified = EXCLUDED.kyc_verified;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'User 1 error: %', SQLERRM;
    END;

    -- User 2
    BEGIN
        INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at)
        VALUES ('a2222222-2222-2222-2222-222222222222', 'karim.bhai@email.com', '+8801722222222', 'Abdul Karim', false, true, NOW() - INTERVAL '85 days')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, kyc_verified = EXCLUDED.kyc_verified;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'User 2 error: %', SQLERRM;
    END;

    -- User 3
    BEGIN
        INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at)
        VALUES ('a3333333-3333-3333-3333-333333333333', 'fatima.begum@email.com', '+8801733333333', 'Fatima Begum', false, true, NOW() - INTERVAL '80 days')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, kyc_verified = EXCLUDED.kyc_verified;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'User 3 error: %', SQLERRM;
    END;

    -- User 4
    BEGIN
        INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at)
        VALUES ('a4444444-4444-4444-4444-444444444444', 'hasan.mia@email.com', '+8801744444444', 'Hasan Mia', false, false, NOW() - INTERVAL '75 days')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, kyc_verified = EXCLUDED.kyc_verified;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'User 4 error: %', SQLERRM;
    END;

    -- User 5
    BEGIN
        INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at)
        VALUES ('a5555555-5555-5555-5555-555555555555', 'nasrin.aktar@email.com', '+8801755555555', 'Nasrin Aktar', false, true, NOW() - INTERVAL '70 days')
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, kyc_verified = EXCLUDED.kyc_verified;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'User 5 error: %', SQLERRM;
    END;
END $$;

-- Insert remaining users (45 more)
INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at)
SELECT 
    gen_random_uuid(),
    'trader' || n || '@email.com',
    '+8801' || LPAD((n + 10)::text, 9, '0'),
    CASE n % 10
        WHEN 0 THEN 'Kamal' || n
        WHEN 1 THEN 'Jamal' || n  
        WHEN 2 THEN 'Rahim' || n
        WHEN 3 THEN 'Karim' || n
        WHEN 4 THEN 'Abdul' || n
        WHEN 5 THEN 'Sultana' || n
        WHEN 6 THEN 'Begum' || n
        WHEN 7 THEN 'Ahmed' || n
        WHEN 8 THEN 'Hossain' || n
        ELSE 'Khatun' || n
    END,
    false,
    n % 3 = 0,
    NOW() - INTERVAL '1 day' * (20 + n)
FROM generate_series(1, 45) AS n
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'trader' || n || '@email.com')
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- STEP 2: Create wallets for all users
-- ===================================

INSERT INTO public.wallets (user_id, balance, locked_balance)
SELECT id, 25000 + (random() * 30000)::numeric(12,2), (random() * 5000)::numeric(12,2)
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Update top traders with specific balances
UPDATE public.wallets SET balance = 50000, locked_balance = 5000 WHERE user_id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.wallets SET balance = 35000, locked_balance = 3000 WHERE user_id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 42000, locked_balance = 2000 WHERE user_id = 'a3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 28000, locked_balance = 4000 WHERE user_id = 'a4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 55000, locked_balance = 6000 WHERE user_id = 'a5555555-5555-5555-5555-555555555555';

-- ===================================
-- STEP 3: Insert resolved markets (VALID UUIDs - no 'm' prefix)
-- ===================================

INSERT INTO public.markets (id, question, description, category, status, winning_outcome, trading_closes_at, event_date, resolved_at, total_volume) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Will Bangladesh win the T20 series vs India 2024?', 'Bangladesh cricket team to win T20 series', 'Sports', 'resolved', 'YES', '2024-10-01', '2024-10-15', NOW() - INTERVAL '45 days', 250000),
    ('22222222-2222-2222-2222-222222222222', 'Will BDT hit 125 per USD by Nov 2024?', 'Bangladesh Taka exchange rate prediction', 'Finance', 'resolved', 'YES', '2024-10-31', '2024-11-30', NOW() - INTERVAL '30 days', 180000),
    ('33333333-3333-3333-3333-333333333333', 'Will Dhaka Metro open Line 6 by Oct 2024?', 'Metro rail expansion in Dhaka', 'Politics', 'resolved', 'YES', '2024-09-30', '2024-10-15', NOW() - INTERVAL '60 days', 320000),
    ('44444444-4444-4444-4444-444444444444', 'Will India win more than 7 medals at Paris Olympics?', 'Olympic medal tally prediction', 'Sports', 'resolved', 'NO', '2024-07-25', '2024-08-11', NOW() - INTERVAL '90 days', 150000),
    ('55555555-5555-5555-5555-555555555555', 'Will Bitcoin reach $70K by end of 2024?', 'Cryptocurrency price milestone', 'Crypto', 'resolved', 'NO', '2024-12-01', '2024-12-31', NOW() - INTERVAL '15 days', 450000),
    ('66666666-6666-6666-6666-666666666666', 'Will Padma Bridge 2nd phase complete by Dec 2024?', 'Infrastructure project completion', 'Politics', 'resolved', 'YES', '2024-11-30', '2024-12-31', NOW() - INTERVAL '10 days', 280000),
    ('77777777-7777-7777-7777-777777777777', 'Will Bangladesh reach $55B exports in 2024?', 'Export milestone prediction', 'Economy', 'resolved', 'YES', '2024-12-01', '2024-12-31', NOW() - INTERVAL '12 days', 200000)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- STEP 4: Create positions with P&L
-- ===================================

DO $$
DECLARE
    v_user_id uuid;
    v_market_id uuid;
    v_outcome outcome_type;
    v_pnl numeric;
    v_counter int := 0;
BEGIN
    FOR v_user_id IN (SELECT id FROM public.users LIMIT 50) LOOP
        v_counter := v_counter + 1;
        
        -- Assign a market (cycle through 7 markets)
        v_market_id := CASE (v_counter % 7)
            WHEN 0 THEN '11111111-1111-1111-1111-111111111111'::uuid
            WHEN 1 THEN '22222222-2222-2222-2222-222222222222'::uuid
            WHEN 2 THEN '33333333-3333-3333-3333-333333333333'::uuid
            WHEN 3 THEN '44444444-4444-4444-4444-444444444444'::uuid
            WHEN 4 THEN '55555555-5555-5555-5555-555555555555'::uuid
            WHEN 5 THEN '66666666-6666-6666-6666-666666666666'::uuid
            ELSE '77777777-7777-7777-7777-777777777777'::uuid
        END;
        
        v_outcome := CASE WHEN v_counter % 2 = 0 THEN 'YES'::outcome_type ELSE 'NO'::outcome_type END;
        
        -- Random P&L between -500 and +1000
        v_pnl := (random() * 1500 - 500)::numeric(12,2);
        
        BEGIN
            INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at)
            VALUES (
                v_user_id,
                v_market_id,
                v_outcome,
                500 + (random() * 1500)::bigint,
                0.40 + (random() * 0.30),
                v_pnl,
                NOW() - INTERVAL '90 days',
                NOW() - INTERVAL '10 days'
            )
            ON CONFLICT (market_id, user_id, outcome) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Position error: %', SQLERRM;
        END;
    END LOOP;
END $$;

-- ===================================
-- STEP 5: Create trades
-- ===================================

INSERT INTO public.trades (market_id, outcome, price, quantity, buyer_id, seller_id, created_at)
SELECT 
    m.id,
    'YES'::outcome_type,
    0.50,
    (100 + random() * 900)::bigint,
    u1.id,
    u2.id,
    NOW() - INTERVAL '1 day' * (10 + random() * 80)
FROM public.markets m
CROSS JOIN public.users u1
CROSS JOIN public.users u2
WHERE m.status = 'resolved'
  AND u1.id != u2.id
  AND random() < 0.02  -- Only insert ~2% of combinations to keep it reasonable
LIMIT 50
ON CONFLICT DO NOTHING;

-- ===================================
-- STEP 6: Populate leaderboard cache
-- ===================================

-- All time
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, unrealized_pnl, score, roi, current_streak, best_streak, risk_score, period_start, period_end, updated_at)
SELECT 
    u.id,
    'all_time',
    COALESCE((SELECT SUM(quantity * average_price)::bigint * 100 FROM public.positions WHERE user_id = u.id), (random() * 100000)::bigint),
    COALESCE((SELECT SUM(realized_pnl)::bigint * 100 FROM public.positions WHERE user_id = u.id), (random() * 50000)::bigint),
    0,
    (random() * 100000)::bigint,
    10 + (random() * 80),
    floor(random() * 8)::int,
    floor(random() * 12)::int,
    2.0 + (random() * 6),
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    NOW()
FROM public.users u
ON CONFLICT (user_id, timeframe) DO UPDATE SET
    trading_volume = EXCLUDED.trading_volume,
    realized_pnl = EXCLUDED.realized_pnl,
    score = EXCLUDED.score,
    roi = EXCLUDED.roi,
    updated_at = NOW();

-- Weekly
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'weekly', trading_volume/4, realized_pnl/4, score/4, roi*0.9, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, NOW()
FROM public.leaderboard_cache WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO UPDATE SET
    trading_volume = EXCLUDED.trading_volume,
    realized_pnl = EXCLUDED.realized_pnl,
    updated_at = NOW();

-- Monthly
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'monthly', trading_volume/2, realized_pnl/2, score/2, roi*0.95, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NOW()
FROM public.leaderboard_cache WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO UPDATE SET
    trading_volume = EXCLUDED.trading_volume,
    realized_pnl = EXCLUDED.realized_pnl,
    updated_at = NOW();

-- Daily
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'daily', trading_volume/20, realized_pnl/20, score/20, roi*0.8, CURRENT_DATE, CURRENT_DATE, NOW()
FROM public.leaderboard_cache WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO UPDATE SET
    trading_volume = EXCLUDED.trading_volume,
    realized_pnl = EXCLUDED.realized_pnl,
    updated_at = NOW();

-- ===================================
-- STEP 7: Assign leagues
-- ===================================

INSERT INTO public.user_leagues (user_id, league_id, current_points, last_updated_at)
SELECT 
    id,
    CASE 
        WHEN random() > 0.8 THEN 5  -- Diamond
        WHEN random() > 0.6 THEN 4  -- Platinum
        WHEN random() > 0.4 THEN 3  -- Gold
        WHEN random() > 0.2 THEN 2  -- Silver
        ELSE 1                      -- Bronze
    END::int,
    100 + (random() * 2900),
    NOW()
FROM public.users
ON CONFLICT (user_id) DO UPDATE SET
    league_id = EXCLUDED.league_id,
    current_points = EXCLUDED.current_points;

-- ===================================
-- STEP 8: Ensure badges exist and assign them
-- ===================================

INSERT INTO public.badges (id, name, description, condition_type, condition_value, rarity) VALUES
    ('first_trade', 'Rookie Trader', 'Completed first trade', 'trades_count', 1, 'COMMON'),
    ('getting_serious', 'Pro Trader', 'Completed 50 trades', 'trades_count', 50, 'RARE'),
    ('whale', 'The Whale', 'Traded over 100k volume', 'volume', 100000, 'EPIC'),
    ('sniper', 'The Sniper', 'Win rate > 80%', 'win_rate', 80, 'RARE'),
    ('streak_master', 'On Fire', 'Won 5 trades in a row', 'streak', 5, 'RARE')
ON CONFLICT (id) DO NOTHING;

-- Assign badges to users
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT 
    u.id,
    CASE 
        WHEN random() > 0.9 THEN 'whale'
        WHEN random() > 0.7 THEN 'sniper'
        WHEN random() > 0.5 THEN 'streak_master'
        WHEN random() > 0.3 THEN 'getting_serious'
        ELSE 'first_trade'
    END,
    NOW() - INTERVAL '1 day' * (random() * 90)
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_badges ub WHERE ub.user_id = u.id)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Ensure everyone has first_trade badge
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT id, 'first_trade', created_at + INTERVAL '1 day'
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_badges WHERE badge_id = 'first_trade')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ===================================
-- VERIFICATION
-- ===================================

SELECT 
    'Total Users' as metric, 
    COUNT(*)::text as value 
FROM users
UNION ALL
SELECT 'Total Wallets', COUNT(*)::text FROM wallets
UNION ALL
SELECT 'Total Positions', COUNT(*)::text FROM positions
UNION ALL
SELECT 'Total Trades', COUNT(*)::text FROM trades
UNION ALL
SELECT 'Leaderboard (All Time)', COUNT(*)::text FROM leaderboard_cache WHERE timeframe = 'all_time'
UNION ALL
SELECT 'Leaderboard (Weekly)', COUNT(*)::text FROM leaderboard_cache WHERE timeframe = 'weekly'
UNION ALL
SELECT 'League Assignments', COUNT(*)::text FROM user_leagues
UNION ALL
SELECT 'Badges Awarded', COUNT(*)::text FROM user_badges;
