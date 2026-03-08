-- 039_workaround_no_user_insert.sql
-- COMPLETE WORKAROUND - Only uses EXISTING users, never touches users table
-- This should work regardless of trigger issues

-- ===================================
-- STEP 1: Get existing user IDs into a temp table
-- ===================================

-- Create temp table with existing user IDs
DROP TABLE IF EXISTS temp_existing_users;
CREATE TEMP TABLE temp_existing_users AS
SELECT id, email, full_name, created_at
FROM public.users
ORDER BY created_at
LIMIT 50;

-- Show what we have
SELECT '=== USING EXISTING USERS ===' as section;
SELECT COUNT(*) as user_count FROM temp_existing_users;

-- ===================================
-- STEP 2: Create markets (if not exist)
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
-- STEP 3: Create positions for existing users ONLY
-- ===================================

INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at)
SELECT 
    u.id,
    m.id,
    CASE WHEN (row_number() OVER (PARTITION BY u.id ORDER BY m.id)) % 2 = 1 THEN 'YES'::outcome_type ELSE 'NO'::outcome_type END,
    (500 + (random() * 1500)::int)::bigint,
    (0.40 + random() * 0.30)::numeric(5,4),
    ((random() * 1000 - 300)::numeric(12,2)),
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '10 days'
FROM temp_existing_users u
CROSS JOIN (SELECT id FROM public.markets WHERE status = 'resolved' LIMIT 7) m
WHERE NOT EXISTS (
    SELECT 1 FROM public.positions p 
    WHERE p.user_id = u.id AND p.market_id = m.id
)
ON CONFLICT (market_id, user_id, outcome) DO NOTHING;

-- ===================================
-- STEP 4: Create trades between existing users ONLY
-- ===================================

-- Get pairs of existing users
INSERT INTO public.trades (market_id, outcome, price, quantity, buyer_id, seller_id, created_at)
SELECT 
    m.id,
    'YES'::outcome_type,
    0.50::numeric(5,4),
    (100 + (random() * 900)::int)::bigint,
    u1.id,
    u2.id,
    NOW() - INTERVAL '1 day' * (10 + (random() * 80)::int)
FROM public.markets m
JOIN temp_existing_users u1 ON true
JOIN temp_existing_users u2 ON u1.id < u2.id  -- Different users, avoid duplicates
WHERE m.status = 'resolved'
AND random() < 0.1  -- Sample only 10% of combinations
LIMIT 50
ON CONFLICT DO NOTHING;

-- ===================================
-- STEP 5: Populate leaderboard for existing users
-- ===================================

-- All time
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, current_streak, best_streak, period_start, period_end, updated_at)
SELECT 
    u.id,
    'all_time',
    COALESCE(pos.vol, (random() * 50000 + 50000)::bigint),
    COALESCE(pos.pnl, (random() * 30000)::bigint),
    COALESCE(pos.pnl, (random() * 50000)::bigint),
    (10 + random() * 80)::numeric(10,2),
    floor(random() * 8)::int,
    floor(random() * 12)::int,
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    NOW()
FROM temp_existing_users u
LEFT JOIN (
    SELECT user_id, 
           SUM(quantity * average_price)::bigint * 100 as vol,
           SUM(realized_pnl)::bigint * 100 as pnl
    FROM public.positions 
    GROUP BY user_id
) pos ON pos.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.leaderboard_cache lc 
    WHERE lc.user_id = u.id AND lc.timeframe = 'all_time'
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
FROM public.leaderboard_cache 
WHERE timeframe = 'all_time' 
AND user_id IN (SELECT id FROM temp_existing_users)
ON CONFLICT (user_id, timeframe) DO UPDATE SET updated_at = NOW();

-- Monthly
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'monthly', trading_volume/2, realized_pnl/2, score/2, roi*0.95, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NOW()
FROM public.leaderboard_cache 
WHERE timeframe = 'all_time'
AND user_id IN (SELECT id FROM temp_existing_users)
ON CONFLICT (user_id, timeframe) DO UPDATE SET updated_at = NOW();

-- Daily
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'daily', trading_volume/20, realized_pnl/20, score/20, roi*0.8, CURRENT_DATE, CURRENT_DATE, NOW()
FROM public.leaderboard_cache 
WHERE timeframe = 'all_time'
AND user_id IN (SELECT id FROM temp_existing_users)
ON CONFLICT (user_id, timeframe) DO UPDATE SET updated_at = NOW();

-- ===================================
-- STEP 6: Assign leagues
-- ===================================

INSERT INTO public.user_leagues (user_id, league_id, current_points, last_updated_at)
SELECT 
    u.id,
    CASE 
        WHEN rn <= total * 0.2 THEN 5  -- Diamond (top 20%)
        WHEN rn <= total * 0.4 THEN 4  -- Platinum (next 20%)
        WHEN rn <= total * 0.6 THEN 3  -- Gold (next 20%)
        WHEN rn <= total * 0.8 THEN 2  -- Silver (next 20%)
        ELSE 1                          -- Bronze (bottom 20%)
    END,
    (100 + random() * 2900)::numeric(12,2),
    NOW()
FROM (
    SELECT id, row_number() OVER (ORDER BY random()) as rn, COUNT(*) OVER () as total
    FROM temp_existing_users
) u
WHERE NOT EXISTS (SELECT 1 FROM public.user_leagues ul WHERE ul.user_id = u.id)
ON CONFLICT (user_id) DO UPDATE SET
    league_id = EXCLUDED.league_id,
    current_points = EXCLUDED.current_points;

-- ===================================
-- STEP 7: Create badges and assign
-- ===================================

INSERT INTO public.badges (id, name, description, condition_type, condition_value, rarity) VALUES
    ('first_trade', 'Rookie Trader', 'Completed first trade', 'trades_count', 1, 'COMMON'),
    ('getting_serious', 'Pro Trader', 'Completed 50 trades', 'trades_count', 50, 'RARE'),
    ('whale', 'The Whale', 'Traded over 100k volume', 'volume', 100000, 'EPIC'),
    ('sniper', 'The Sniper', 'Win rate > 80%', 'win_rate', 80, 'RARE')
ON CONFLICT (id) DO NOTHING;

-- Assign first_trade badge to all existing users
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT u.id, 'first_trade', u.created_at + INTERVAL '1 day'
FROM temp_existing_users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_badges ub 
    WHERE ub.user_id = u.id AND ub.badge_id = 'first_trade'
)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Assign random additional badges
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT 
    u.id,
    CASE 
        WHEN random() > 0.9 THEN 'whale'
        WHEN random() > 0.7 THEN 'sniper'
        WHEN random() > 0.5 THEN 'getting_serious'
        ELSE 'first_trade'
    END,
    NOW() - INTERVAL '1 day' * (random() * 90)
FROM temp_existing_users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_badges ub WHERE ub.user_id = u.id)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ===================================
-- CLEANUP
-- ===================================

DROP TABLE IF EXISTS temp_existing_users;

-- ===================================
-- VERIFICATION
-- ===================================

SELECT '=== FINAL COUNTS ===' as section;
SELECT 
    'Total Users Processed' as metric, 
    (SELECT COUNT(*)::text FROM public.users) as value
UNION ALL
SELECT 'Total Positions', COUNT(*)::text FROM public.positions
UNION ALL
SELECT 'Total Trades', COUNT(*)::text FROM public.trades
UNION ALL
SELECT 'Leaderboard (All Time)', COUNT(*)::text FROM public.leaderboard_cache WHERE timeframe = 'all_time'
UNION ALL
SELECT 'Leaderboard (Weekly)', COUNT(*)::text FROM public.leaderboard_cache WHERE timeframe = 'weekly'
UNION ALL
SELECT 'League Assignments', COUNT(*)::text FROM public.user_leagues
UNION ALL
SELECT 'Badges Awarded', COUNT(*)::text FROM public.user_badges;
