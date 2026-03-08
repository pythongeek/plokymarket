-- 037_use_existing_users.sql
-- FALLBACK: Populate leaderboard using ONLY existing users
-- Use this if user creation triggers keep failing

-- ===================================
-- STRATEGY: Don't create new users, use existing ones
-- ===================================

-- First, let's see what users already exist
SELECT '=== EXISTING USERS ===' as info;
SELECT id, email, full_name, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 20;

-- ===================================
-- Create resolved markets (if not exist)
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
-- Create positions for EXISTING users
-- ===================================

INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at)
SELECT 
    u.id,
    m.id,
    CASE WHEN row_number() OVER (PARTITION BY u.id) % 2 = 1 THEN 'YES'::outcome_type ELSE 'NO'::outcome_type END,
    (500 + random() * 1500)::bigint,
    0.40 + (random() * 0.30),
    (random() * 1000 - 300)::numeric(12,2),
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '10 days'
FROM (
    SELECT id, row_number() OVER (ORDER BY created_at) as rn 
    FROM public.users 
    LIMIT 50
) u
CROSS JOIN (
    SELECT id FROM public.markets WHERE status = 'resolved' LIMIT 7
) m
WHERE NOT EXISTS (
    SELECT 1 FROM public.positions p 
    WHERE p.user_id = u.id AND p.market_id = m.id
)
ON CONFLICT (market_id, user_id, outcome) DO NOTHING;

-- ===================================
-- Create trades between EXISTING users
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
  AND u1.id < u2.id  -- Ensure different users, avoid self-trades
  AND random() < 0.01  -- Small sample
LIMIT 100
ON CONFLICT DO NOTHING;

-- ===================================
-- Populate leaderboard for ALL existing users
-- ===================================

-- All time
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, current_streak, best_streak, period_start, period_end, updated_at)
SELECT 
    u.id,
    'all_time',
    COALESCE((SELECT SUM(quantity * average_price)::bigint * 100 FROM public.positions WHERE user_id = u.id), (random() * 50000 + 10000)::bigint),
    COALESCE((SELECT SUM(realized_pnl)::bigint * 100 FROM public.positions WHERE user_id = u.id), (random() * 30000)::bigint),
    (random() * 50000)::bigint,
    10 + (random() * 80),
    floor(random() * 8)::int,
    floor(random() * 12)::int,
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    NOW()
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.leaderboard_cache lc WHERE lc.user_id = u.id AND lc.timeframe = 'all_time')
ON CONFLICT (user_id, timeframe) DO UPDATE SET updated_at = NOW();

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
-- Assign leagues to existing users
-- ===================================

INSERT INTO public.user_leagues (user_id, league_id, current_points, last_updated_at)
SELECT 
    u.id,
    CASE 
        WHEN row_number() OVER (ORDER BY random()) <= (SELECT COUNT(*) * 0.2 FROM public.users) THEN 5  -- Top 20% Diamond
        WHEN row_number() OVER (ORDER BY random()) <= (SELECT COUNT(*) * 0.4 FROM public.users) THEN 4  -- Next 20% Platinum
        WHEN row_number() OVER (ORDER BY random()) <= (SELECT COUNT(*) * 0.6 FROM public.users) THEN 3  -- Next 20% Gold
        WHEN row_number() OVER (ORDER BY random()) <= (SELECT COUNT(*) * 0.8 FROM public.users) THEN 2  -- Next 20% Silver
        ELSE 1                                                                                           -- Bottom 20% Bronze
    END,
    100 + (random() * 2900),
    NOW()
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_leagues ul WHERE ul.user_id = u.id)
ON CONFLICT (user_id) DO UPDATE SET league_id = EXCLUDED.league_id;

-- ===================================
-- Create badges and assign
-- ===================================

INSERT INTO public.badges (id, name, description, condition_type, condition_value, rarity) VALUES
    ('first_trade', 'Rookie Trader', 'Completed first trade', 'trades_count', 1, 'COMMON'),
    ('getting_serious', 'Pro Trader', 'Completed 50 trades', 'trades_count', 50, 'RARE'),
    ('whale', 'The Whale', 'Traded over 100k volume', 'volume', 100000, 'EPIC'),
    ('sniper', 'The Sniper', 'Win rate > 80%', 'win_rate', 80, 'RARE')
ON CONFLICT (id) DO NOTHING;

-- Assign first_trade badge to all users
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT u.id, 'first_trade', u.created_at + INTERVAL '1 day'
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_badges ub WHERE ub.user_id = u.id AND ub.badge_id = 'first_trade')
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
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_badges ub WHERE ub.user_id = u.id)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ===================================
-- VERIFICATION
-- ===================================

SELECT '=== FINAL COUNTS ===' as info;
SELECT 'Total Users' as metric, COUNT(*)::text as value FROM users
UNION ALL SELECT 'Total Wallets', COUNT(*)::text FROM wallets
UNION ALL SELECT 'Total Positions', COUNT(*)::text FROM positions
UNION ALL SELECT 'Total Trades', COUNT(*)::text FROM trades
UNION ALL SELECT 'Leaderboard (All Time)', COUNT(*)::text FROM leaderboard_cache WHERE timeframe = 'all_time'
UNION ALL SELECT 'League Assignments', COUNT(*)::text FROM user_leagues
UNION ALL SELECT 'Badges Awarded', COUNT(*)::text FROM user_badges;
