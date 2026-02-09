-- 035_leaderboard_data_robust.sql
-- ROBUST VERSION with explicit verification and error handling
-- Run this in Supabase SQL Editor

-- ===================================
-- STEP 0: Clean up any existing seed data
-- ===================================

DELETE FROM public.user_badges WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.user_leagues WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.leaderboard_cache WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.trades WHERE buyer_id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
) OR seller_id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.positions WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.wallets WHERE user_id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
);

DELETE FROM public.users WHERE id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
);

-- ===================================
-- STEP 1: Insert 5 seed users with explicit values
-- ===================================

INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at) 
VALUES 
    ('a1111111-1111-1111-1111-111111111111', 'rahim.trader@email.com', '+8801711111111', 'Rahim Ahmed', false, true, NOW() - INTERVAL '90 days'),
    ('a2222222-2222-2222-2222-222222222222', 'karim.bhai@email.com', '+8801722222222', 'Abdul Karim', false, true, NOW() - INTERVAL '85 days'),
    ('a3333333-3333-3333-3333-333333333333', 'fatima.begum@email.com', '+8801733333333', 'Fatima Begum', false, true, NOW() - INTERVAL '80 days'),
    ('a4444444-4444-4444-4444-444444444444', 'hasan.mia@email.com', '+8801744444444', 'Hasan Mia', false, false, NOW() - INTERVAL '75 days'),
    ('a5555555-5555-5555-5555-555555555555', 'nasrin.aktar@email.com', '+8801755555555', 'Nasrin Aktar', false, true, NOW() - INTERVAL '70 days')
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- STEP 2: VERIFY users were created - FAIL LOUDLY if not
-- ===================================

DO $$
DECLARE
    v_count int;
BEGIN
    SELECT COUNT(*) INTO v_count 
    FROM public.users 
    WHERE id IN (
        'a1111111-1111-1111-1111-111111111111',
        'a2222222-2222-2222-2222-222222222222',
        'a3333333-3333-3333-3333-333333333333',
        'a4444444-4444-4444-4444-444444444444',
        'a5555555-5555-5555-5555-555555555555'
    );
    
    IF v_count < 5 THEN
        RAISE EXCEPTION 'CRITICAL: Expected 5 seed users, found only %. Check trigger errors above.', v_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: All 5 seed users created.';
END $$;

-- ===================================
-- STEP 3: Verify wallets were auto-created by trigger
-- ===================================

DO $$
DECLARE
    v_wallet_count int;
BEGIN
    SELECT COUNT(*) INTO v_wallet_count
    FROM public.wallets
    WHERE user_id IN (
        'a1111111-1111-1111-1111-111111111111',
        'a2222222-2222-2222-2222-222222222222',
        'a3333333-3333-3333-3333-333333333333',
        'a4444444-4444-4444-4444-444444444444',
        'a5555555-5555-5555-5555-555555555555'
    );
    
    IF v_wallet_count < 5 THEN
        RAISE NOTICE 'WARNING: Only % of 5 wallets found. Creating missing wallets...', v_wallet_count;
        
        -- Create missing wallets manually
        INSERT INTO public.wallets (user_id, balance, locked_balance)
        SELECT id, 25000, 0
        FROM public.users
        WHERE id IN (
            'a1111111-1111-1111-1111-111111111111',
            'a2222222-2222-2222-2222-222222222222',
            'a3333333-3333-3333-3333-333333333333',
            'a4444444-4444-4444-4444-444444444444',
            'a5555555-5555-5555-5555-555555555555'
        )
        AND NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = users.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END $$;

-- Update wallets with realistic balances
UPDATE public.wallets SET balance = 50000, locked_balance = 5000 WHERE user_id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.wallets SET balance = 35000, locked_balance = 3000 WHERE user_id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 42000, locked_balance = 2000 WHERE user_id = 'a3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 28000, locked_balance = 4000 WHERE user_id = 'a4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 55000, locked_balance = 6000 WHERE user_id = 'a5555555-5555-5555-5555-555555555555';

-- ===================================
-- STEP 4: Create resolved markets
-- ===================================

INSERT INTO public.markets (id, question, description, category, status, winning_outcome, trading_closes_at, event_date, resolved_at, total_volume) 
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Will Bangladesh win the T20 series vs India 2024?', 'Bangladesh cricket team to win T20 series', 'Sports', 'resolved', 'YES', '2024-10-01', '2024-10-15', NOW() - INTERVAL '45 days', 250000),
    ('22222222-2222-2222-2222-222222222222', 'Will BDT hit 125 per USD by Nov 2024?', 'Bangladesh Taka exchange rate prediction', 'Finance', 'resolved', 'YES', '2024-10-31', '2024-11-30', NOW() - INTERVAL '30 days', 180000),
    ('33333333-3333-3333-3333-333333333333', 'Will Dhaka Metro open Line 6 by Oct 2024?', 'Metro rail expansion in Dhaka', 'Politics', 'resolved', 'YES', '2024-09-30', '2024-10-15', NOW() - INTERVAL '60 days', 320000),
    ('44444444-4444-4444-4444-444444444444', 'Will India win more than 7 medals at Paris Olympics?', 'Olympic medal tally prediction', 'Sports', 'resolved', 'NO', '2024-07-25', '2024-08-11', NOW() - INTERVAL '90 days', 150000),
    ('55555555-5555-5555-5555-555555555555', 'Will Bitcoin reach $70K by end of 2024?', 'Cryptocurrency price milestone', 'Crypto', 'resolved', 'NO', '2024-12-01', '2024-12-31', NOW() - INTERVAL '15 days', 450000),
    ('66666666-6666-6666-6666-666666666666', 'Will Padma Bridge 2nd phase complete by Dec 2024?', 'Infrastructure project completion', 'Politics', 'resolved', 'YES', '2024-11-30', '2024-12-31', NOW() - INTERVAL '10 days', 280000),
    ('77777777-7777-7777-7777-777777777777', 'Will Bangladesh reach $55B exports in 2024?', 'Export milestone prediction', 'Economy', 'resolved', 'YES', '2024-12-01', '2024-12-31', NOW() - INTERVAL '12 days', 200000)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- STEP 5: Create positions (safely with explicit values)
-- ===================================

INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at)
VALUES
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'YES', 1000, 0.52, 480.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '45 days'),
    ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'YES', 800, 0.65, 280.00, NOW() - INTERVAL '70 days', NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'YES', 1200, 0.48, 624.00, NOW() - INTERVAL '85 days', NOW() - INTERVAL '60 days'),
    ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'NO', 600, 0.55, 330.00, NOW() - INTERVAL '100 days', NOW() - INTERVAL '90 days'),
    ('a1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'YES', 1500, 0.42, 870.00, NOW() - INTERVAL '75 days', NOW() - INTERVAL '10 days'),
    ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'YES', 800, 0.55, 360.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '45 days'),
    ('a2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'YES', 1000, 0.50, 500.00, NOW() - INTERVAL '82 days', NOW() - INTERVAL '60 days'),
    ('a2222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'YES', 900, 0.45, 495.00, NOW() - INTERVAL '65 days', NOW() - INTERVAL '12 days'),
    ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'YES', 1200, 0.60, 480.00, NOW() - INTERVAL '72 days', NOW() - INTERVAL '30 days'),
    ('a3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'NO', 2000, 0.35, 700.00, NOW() - INTERVAL '50 days', NOW() - INTERVAL '15 days'),
    ('a3333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'YES', 1100, 0.44, 616.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '10 days'),
    ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'NO', 800, 0.48, -384.00, NOW() - INTERVAL '77 days', NOW() - INTERVAL '45 days'),
    ('a4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'NO', 600, 0.40, -240.00, NOW() - INTERVAL '69 days', NOW() - INTERVAL '30 days'),
    ('a4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'NO', 500, 0.52, -260.00, NOW() - INTERVAL '86 days', NOW() - INTERVAL '60 days'),
    ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'YES', 1500, 0.50, 750.00, NOW() - INTERVAL '85 days', NOW() - INTERVAL '45 days'),
    ('a5555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'YES', 1300, 0.40, 780.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '10 days')
ON CONFLICT (market_id, user_id, outcome) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    average_price = EXCLUDED.average_price,
    realized_pnl = EXCLUDED.realized_pnl,
    updated_at = NOW();

-- ===================================
-- STEP 6: Create trades (safely with JOINs to ensure users exist)
-- ===================================

INSERT INTO public.trades (market_id, outcome, price, quantity, buyer_id, seller_id, created_at)
SELECT v.market_id, v.outcome::outcome_type, v.price, v.quantity, v.buyer_id, v.seller_id, v.created_at
FROM (
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'YES', 0.52, 1000, 'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '80 days'),
        ('22222222-2222-2222-2222-222222222222', 'YES', 0.65, 800, 'a1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '70 days'),
        ('33333333-3333-3333-3333-333333333333', 'YES', 0.48, 1200, 'a1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '85 days'),
        ('44444444-4444-4444-4444-444444444444', 'NO', 0.55, 600, 'a1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '100 days'),
        ('66666666-6666-6666-6666-666666666666', 'YES', 0.42, 1500, 'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '75 days'),
        ('11111111-1111-1111-1111-111111111111', 'YES', 0.48, 2000, 'a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '90 days'),
        ('33333333-3333-3333-3333-333333333333', 'YES', 0.46, 1500, 'a2222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '87 days'),
        ('55555555-5555-5555-5555-555555555555', 'NO', 0.32, 3000, 'a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '52 days'),
        ('77777777-7777-7777-7777-777777777777', 'YES', 0.43, 1800, 'a3333333-3333-3333-3333-333333333333', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '68 days'),
        ('22222222-2222-2222-2222-222222222222', 'YES', 0.55, 1500, 'a4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '74 days')
) AS v(market_id, outcome, price, quantity, buyer_id, seller_id, created_at)
JOIN public.users b ON b.id = v.buyer_id
JOIN public.users s ON s.id = v.seller_id
JOIN public.markets m ON m.id = v.market_id;

-- ===================================
-- STEP 7: Populate leaderboard cache
-- ===================================

INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, current_streak, best_streak, period_start, period_end, updated_at)
SELECT 
    u.id,
    'all_time',
    COALESCE((SELECT SUM(quantity * average_price)::bigint * 100 FROM public.positions WHERE user_id = u.id), 500000),
    COALESCE((SELECT SUM(realized_pnl)::bigint * 100 FROM public.positions WHERE user_id = u.id), 20000),
    (SELECT COALESCE(SUM(realized_pnl), 0)::bigint * 100 FROM public.positions WHERE user_id = u.id),
    CASE u.id
        WHEN 'a1111111-1111-1111-1111-111111111111' THEN 85.50
        WHEN 'a2222222-2222-2222-2222-222222222222' THEN 72.30
        WHEN 'a3333333-3333-3333-3333-333333333333' THEN 68.75
        WHEN 'a4444444-4444-4444-4444-444444444444' THEN 45.20
        ELSE 38.90
    END,
    CASE u.id
        WHEN 'a1111111-1111-1111-1111-111111111111' THEN 7
        WHEN 'a2222222-2222-2222-2222-222222222222' THEN 5
        ELSE 3
    END,
    CASE u.id
        WHEN 'a1111111-1111-1111-1111-111111111111' THEN 12
        WHEN 'a2222222-2222-2222-2222-222222222222' THEN 8
        ELSE 5
    END,
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    NOW()
FROM public.users u
WHERE u.id IN (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
)
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
ON CONFLICT (user_id, timeframe) DO UPDATE SET updated_at = NOW();

-- Monthly
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'monthly', trading_volume/2, realized_pnl/2, score/2, roi*0.95, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NOW()
FROM public.leaderboard_cache WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO UPDATE SET updated_at = NOW();

-- ===================================
-- STEP 8: Assign leagues
-- ===================================

INSERT INTO public.user_leagues (user_id, league_id, current_points, last_updated_at)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 5, 2850.00, NOW()),  -- Diamond
    ('a2222222-2222-2222-2222-222222222222', 4, 2420.00, NOW()),  -- Platinum
    ('a3333333-3333-3333-3333-333333333333', 3, 1980.00, NOW()),  -- Gold
    ('a4444444-4444-4444-4444-444444444444', 2, 1650.00, NOW()),  -- Silver
    ('a5555555-5555-5555-5555-555555555555', 1, 1200.00, NOW())   -- Bronze
ON CONFLICT (user_id) DO UPDATE SET
    league_id = EXCLUDED.league_id,
    current_points = EXCLUDED.current_points;

-- ===================================
-- STEP 9: Create badges and assign them
-- ===================================

INSERT INTO public.badges (id, name, description, condition_type, condition_value, rarity) VALUES
    ('first_trade', 'Rookie Trader', 'Completed first trade', 'trades_count', 1, 'COMMON'),
    ('getting_serious', 'Pro Trader', 'Completed 50 trades', 'trades_count', 50, 'RARE'),
    ('whale', 'The Whale', 'Traded over 100k volume', 'volume', 100000, 'EPIC'),
    ('sniper', 'The Sniper', 'Win rate > 80%', 'win_rate', 80, 'RARE'),
    ('streak_master', 'On Fire', 'Won 5 trades in a row', 'streak', 5, 'RARE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_badges (user_id, badge_id, awarded_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '89 days'),
    ('a1111111-1111-1111-1111-111111111111', 'whale', NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', 'sniper', NOW() - INTERVAL '15 days'),
    ('a2222222-2222-2222-2222-222222222222', 'first_trade', NOW() - INTERVAL '87 days'),
    ('a2222222-2222-2222-2222-222222222222', 'getting_serious', NOW() - INTERVAL '55 days'),
    ('a3333333-3333-3333-3333-333333333333', 'first_trade', NOW() - INTERVAL '85 days'),
    ('a3333333-3333-3333-3333-333333333333', 'sniper', NOW() - INTERVAL '40 days'),
    ('a4444444-4444-4444-4444-444444444444', 'first_trade', NOW() - INTERVAL '83 days'),
    ('a5555555-5555-5555-5555-555555555555', 'first_trade', NOW() - INTERVAL '81 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ===================================
-- FINAL VERIFICATION
-- ===================================

SELECT '=== FINAL COUNTS ===' as section, '' as value
UNION ALL
SELECT 'Total Users', COUNT(*)::text FROM users WHERE id LIKE 'a1111%' OR id LIKE 'a2222%' OR id LIKE 'a3333%' OR id LIKE 'a4444%' OR id LIKE 'a5555%'
UNION ALL
SELECT 'Total Wallets', COUNT(*)::text FROM wallets WHERE user_id LIKE 'a1111%' OR user_id LIKE 'a2222%' OR user_id LIKE 'a3333%' OR user_id LIKE 'a4444%' OR user_id LIKE 'a5555%'
UNION ALL
SELECT 'Total Positions', COUNT(*)::text FROM positions
UNION ALL
SELECT 'Total Trades', COUNT(*)::text FROM trades
UNION ALL
SELECT 'Leaderboard (All Time)', COUNT(*)::text FROM leaderboard_cache WHERE timeframe = 'all_time'
UNION ALL
SELECT 'League Assignments', COUNT(*)::text FROM user_leagues
UNION ALL
SELECT 'Badges Awarded', COUNT(*)::text FROM user_badges;
