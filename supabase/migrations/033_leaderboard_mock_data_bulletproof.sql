-- 033_leaderboard_mock_data_bulletproof.sql
-- BULLETPROOF VERSION - ensures proper insert order
-- Run this in Supabase SQL Editor

-- ===================================
-- STEP 1: Create EXACTLY 50 users with fixed UUIDs (no random generation)
-- ===================================

-- First, ensure we have our 5 named traders
INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'rahim.trader@email.com', '+8801711111111', 'Rahim Ahmed', false, true, NOW() - INTERVAL '90 days'),
    ('a2222222-2222-2222-2222-222222222222', 'karim.bhai@email.com', '+8801722222222', 'Abdul Karim', false, true, NOW() - INTERVAL '85 days'),
    ('a3333333-3333-3333-3333-333333333333', 'fatima.begum@email.com', '+8801733333333', 'Fatima Begum', false, true, NOW() - INTERVAL '80 days'),
    ('a4444444-4444-4444-4444-444444444444', 'hasan.mia@email.com', '+8801744444444', 'Hasan Mia', false, false, NOW() - INTERVAL '75 days'),
    ('a5555555-5555-5555-5555-555555555555', 'nasrin.aktar@email.com', '+8801755555555', 'Nasrin Aktar', false, true, NOW() - INTERVAL '70 days')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, kyc_verified = EXCLUDED.kyc_verified;

-- Now add 45 more users with deterministic UUIDs (not random)
INSERT INTO public.users (id, email, phone, full_name, is_admin, kyc_verified, created_at) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'trader06@email.com', '+8801800000006', 'Kamal Hossain', false, true, NOW() - INTERVAL '65 days'),
    ('b2222222-2222-2222-2222-222222222222', 'trader07@email.com', '+8801800000007', 'Nusrat Jahan', false, true, NOW() - INTERVAL '60 days'),
    ('b3333333-3333-3333-3333-333333333333', 'trader08@email.com', '+8801800000008', 'Abdus Salam', false, false, NOW() - INTERVAL '55 days'),
    ('b4444444-4444-4444-4444-444444444444', 'trader09@email.com', '+8801800000009', 'Mina Akter', false, true, NOW() - INTERVAL '50 days'),
    ('b5555555-5555-5555-5555-555555555555', 'trader10@email.com', '+8801800000010', 'Jalal Uddin', false, true, NOW() - INTERVAL '45 days'),
    ('c1111111-1111-1111-1111-111111111111', 'trader11@email.com', '+8801800000011', 'Shirin Alam', false, true, NOW() - INTERVAL '88 days'),
    ('c2222222-2222-2222-2222-222222222222', 'trader12@email.com', '+8801800000012', 'Tariq Anwar', false, false, NOW() - INTERVAL '82 days'),
    ('c3333333-3333-3333-3333-333333333333', 'trader13@email.com', '+8801800000013', 'Rumana Islam', false, true, NOW() - INTERVAL '78 days'),
    ('c4444444-4444-4444-4444-444444444444', 'trader14@email.com', '+8801800000014', 'Shahin Rahman', false, true, NOW() - INTERVAL '72 days'),
    ('c5555555-5555-5555-5555-555555555555', 'trader15@email.com', '+8801800000015', 'Jannatul Ferdous', false, true, NOW() - INTERVAL '68 days'),
    ('d1111111-1111-1111-1111-111111111111', 'trader16@email.com', '+8801800000016', 'Imran Hossain', false, false, NOW() - INTERVAL '63 days'),
    ('d2222222-2222-2222-2222-222222222222', 'trader17@email.com', '+8801800000017', 'Parvin Sultana', false, true, NOW() - INTERVAL '58 days'),
    ('d3333333-3333-3333-3333-333333333333', 'trader18@email.com', '+8801800000018', 'Rafique Ahmed', false, true, NOW() - INTERVAL '52 days'),
    ('d4444444-4444-4444-4444-444444444444', 'trader19@email.com', '+8801800000019', 'Shahnaz Parvin', false, true, NOW() - INTERVAL '48 days'),
    ('d5555555-5555-5555-5555-555555555555', 'trader20@email.com', '+8801800000020', 'Monir Hossain', false, false, NOW() - INTERVAL '95 days'),
    ('e1111111-1111-1111-1111-111111111111', 'trader21@email.com', '+8801800000021', 'Laila Arjumand', false, true, NOW() - INTERVAL '91 days'),
    ('e2222222-2222-2222-2222-222222222222', 'trader22@email.com', '+8801800000022', 'Faruk Ahmed', false, true, NOW() - INTERVAL '87 days'),
    ('e3333333-3333-3333-3333-333333333333', 'trader23@email.com', '+8801800000023', 'Sabina Yasmin', false, true, NOW() - INTERVAL '83 days'),
    ('e4444444-4444-4444-4444-444444444444', 'trader24@email.com', '+8801800000024', 'Azizur Rahman', false, true, NOW() - INTERVAL '79 days'),
    ('e5555555-5555-5555-5555-555555555555', 'trader25@email.com', '+8801800000025', 'Sharmin Akter', false, false, NOW() - INTERVAL '74 days'),
    ('f1111111-1111-1111-1111-111111111111', 'trader26@email.com', '+8801800000026', 'Habib Ullah', false, true, NOW() - INTERVAL '69 days'),
    ('f2222222-2222-2222-2222-222222222222', 'trader27@email.com', '+8801800000027', 'Mahmuda Khatun', false, true, NOW() - INTERVAL '64 days'),
    ('f3333333-3333-3333-3333-333333333333', 'trader28@email.com', '+8801800000028', 'Sujon Ali', false, true, NOW() - INTERVAL '59 days'),
    ('f4444444-4444-4444-4444-444444444444', 'trader29@email.com', '+8801800000029', 'Rokeya Begum', false, true, NOW() - INTERVAL '54 days'),
    ('f5555555-5555-5555-5555-555555555555', 'trader30@email.com', '+8801800000030', 'Anwar Hossain', false, false, NOW() - INTERVAL '49 days'),
    ('a6666666-6666-6666-6666-666666666666', 'trader31@email.com', '+8801800000031', 'Runa Laila', false, true, NOW() - INTERVAL '96 days'),
    ('a7777777-7777-7777-7777-777777777777', 'trader32@email.com', '+8801800000032', 'Babul Akhter', false, true, NOW() - INTERVAL '92 days'),
    ('a8888888-8888-8888-8888-888888888888', 'trader33@email.com', '+8801800000033', 'Moushumi Aktar', false, true, NOW() - INTERVAL '89 days'),
    ('a9999999-9999-9999-9999-999999999999', 'trader34@email.com', '+8801800000034', 'Iqbal Hasan', false, true, NOW() - INTERVAL '84 days'),
    ('b6666666-6666-6666-6666-666666666666', 'trader35@email.com', '+8801800000035', 'Sathi Nasrin', false, false, NOW() - INTERVAL '80 days'),
    ('b7777777-7777-7777-7777-777777777777', 'trader36@email.com', '+8801800000036', 'Masud Rana', false, true, NOW() - INTERVAL '76 days'),
    ('b8888888-8888-8888-8888-888888888888', 'trader37@email.com', '+8801800000037', 'Tania Akhter', false, true, NOW() - INTERVAL '71 days'),
    ('b9999999-9999-9999-9999-999999999999', 'trader38@email.com', '+8801800000038', 'Kabir Hossain', false, true, NOW() - INTERVAL '67 days'),
    ('c6666666-6666-6666-6666-666666666666', 'trader39@email.com', '+8801800000039', 'Rumi Akhtar', false, true, NOW() - INTERVAL '62 days'),
    ('c7777777-7777-7777-7777-777777777777', 'trader40@email.com', '+8801800000040', 'Shuvo Ahmed', false, false, NOW() - INTERVAL '57 days'),
    ('c8888888-8888-8888-8888-888888888888', 'trader41@email.com', '+8801800000041', 'Mim Rahman', false, true, NOW() - INTERVAL '53 days'),
    ('c9999999-9999-9999-9999-999999999999', 'trader42@email.com', '+8801800000042', 'Tanvir Islam', false, true, NOW() - INTERVAL '47 days'),
    ('d6666666-6666-6666-6666-666666666666', 'trader43@email.com', '+8801800000043', 'Purnima Akter', false, true, NOW() - INTERVAL '44 days'),
    ('d7777777-7777-7777-7777-777777777777', 'trader44@email.com', '+8801800000044', 'Riad Mahmud', false, true, NOW() - INTERVAL '41 days'),
    ('d8888888-8888-8888-8888-888888888888', 'trader45@email.com', '+8801800000045', 'Nabila Haque', false, false, NOW() - INTERVAL '38 days'),
    ('d9999999-9999-9999-9999-999999999999', 'trader46@email.com', '+8801800000046', 'Fahim Ahmed', false, true, NOW() - INTERVAL '35 days'),
    ('e6666666-6666-6666-6666-666666666666', 'trader47@email.com', '+8801800000047', 'Trisha Islam', false, true, NOW() - INTERVAL '32 days'),
    ('e7777777-7777-7777-7777-777777777777', 'trader48@email.com', '+8801800000048', 'Arifin Shuvo', false, true, NOW() - INTERVAL '28 days'),
    ('e8888888-8888-8888-8888-888888888888', 'trader49@email.com', '+8801800000049', 'Porimoni Akter', false, true, NOW() - INTERVAL '25 days'),
    ('e9999999-9999-9999-9999-999999999999', 'trader50@email.com', '+8801800000050', 'Moushumi Hamid', false, true, NOW() - INTERVAL '22 days')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, kyc_verified = EXCLUDED.kyc_verified;

-- ===================================
-- STEP 2: Create wallets for ALL 50 users (only for users that exist)
-- ===================================

INSERT INTO public.wallets (user_id, balance, locked_balance)
SELECT id, 25000 + (random() * 30000)::numeric(12,2), (random() * 5000)::numeric(12,2)
FROM public.users
WHERE id IN (
    'a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 'b1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444',
    'b5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555',
    'd1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'd3333333-3333-3333-3333-333333333333',
    'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'e1111111-1111-1111-1111-111111111111',
    'e2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333', 'e4444444-4444-4444-4444-444444444444',
    'e5555555-5555-5555-5555-555555555555', 'f1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222',
    'f3333333-3333-3333-3333-333333333333', 'f4444444-4444-4444-4444-444444444444', 'f5555555-5555-5555-5555-555555555555',
    'a6666666-6666-6666-6666-666666666666', 'a7777777-7777-7777-7777-777777777777', 'a8888888-8888-8888-8888-888888888888',
    'a9999999-9999-9999-9999-999999999999', 'b6666666-6666-6666-6666-666666666666', 'b7777777-7777-7777-7777-777777777777',
    'b8888888-8888-8888-8888-888888888888', 'b9999999-9999-9999-9999-999999999999', 'c6666666-6666-6666-6666-666666666666',
    'c7777777-7777-7777-7777-777777777777', 'c8888888-8888-8888-8888-888888888888', 'c9999999-9999-9999-9999-999999999999',
    'd6666666-6666-6666-6666-666666666666', 'd7777777-7777-7777-7777-777777777777', 'd8888888-8888-8888-8888-888888888888',
    'd9999999-9999-9999-9999-999999999999', 'e6666666-6666-6666-6666-666666666666', 'e7777777-7777-7777-7777-777777777777',
    'e8888888-8888-8888-8888-888888888888', 'e9999999-9999-9999-9999-999999999999'
)
ON CONFLICT (user_id) DO NOTHING;

-- Update top 5 traders with specific balances
UPDATE public.wallets SET balance = 50000, locked_balance = 5000 WHERE user_id = 'a1111111-1111-1111-1111-111111111111';
UPDATE public.wallets SET balance = 35000, locked_balance = 3000 WHERE user_id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 42000, locked_balance = 2000 WHERE user_id = 'a3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 28000, locked_balance = 4000 WHERE user_id = 'a4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 55000, locked_balance = 6000 WHERE user_id = 'a5555555-5555-5555-5555-555555555555';

-- ===================================
-- STEP 3: Insert resolved markets (VALID UUIDs)
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
-- STEP 4: Create positions with P&L (only for existing users)
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
    ('a5555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'YES', 1300, 0.40, 780.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '10 days'),
    ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'YES', 2000, 0.48, 1040.00, NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),
    ('b1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'YES', 1500, 0.46, 810.00, NOW() - INTERVAL '87 days', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'NO', 3000, 0.32, 1050.00, NOW() - INTERVAL '52 days', NOW() - INTERVAL '15 days'),
    ('b1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'YES', 1800, 0.43, 1026.00, NOW() - INTERVAL '68 days', NOW() - INTERVAL '12 days'),
    ('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'NO', 700, 0.50, -350.00, NOW() - INTERVAL '76 days', NOW() - INTERVAL '45 days'),
    ('b2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'NO', 600, 0.49, -294.00, NOW() - INTERVAL '85 days', NOW() - INTERVAL '60 days'),
    ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'YES', 900, 0.58, 378.00, NOW() - INTERVAL '73 days', NOW() - INTERVAL '30 days'),
    ('b3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'NO', 1200, 0.52, 624.00, NOW() - INTERVAL '98 days', NOW() - INTERVAL '90 days'),
    ('b3333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'YES', 1000, 0.41, 590.00, NOW() - INTERVAL '77 days', NOW() - INTERVAL '10 days'),
    ('b4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'YES', 1300, 0.57, 559.00, NOW() - INTERVAL '71 days', NOW() - INTERVAL '30 days'),
    ('b4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'NO', 1500, 0.36, 525.00, NOW() - INTERVAL '53 days', NOW() - INTERVAL '15 days'),
    ('b5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'NO', 500, 0.51, -255.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '45 days'),
    ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'YES', 1500, 0.55, 675.00, NOW() - INTERVAL '74 days', NOW() - INTERVAL '30 days'),
    ('c1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'YES', 1200, 0.39, 732.00, NOW() - INTERVAL '76 days', NOW() - INTERVAL '10 days'),
    ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'NO', 500, 0.38, -190.00, NOW() - INTERVAL '68 days', NOW() - INTERVAL '30 days'),
    ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'YES', 700, 0.56, 308.00, NOW() - INTERVAL '81 days', NOW() - INTERVAL '45 days'),
    ('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'YES', 600, 0.53, 282.00, NOW() - INTERVAL '84 days', NOW() - INTERVAL '60 days'),
    ('c3333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777', 'YES', 800, 0.44, 448.00, NOW() - INTERVAL '66 days', NOW() - INTERVAL '12 days'),
    ('c4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'YES', 900, 0.51, 441.00, NOW() - INTERVAL '86 days', NOW() - INTERVAL '45 days'),
    ('c4444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'YES', 1100, 0.40, 660.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '10 days'),
    ('c5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'YES', 600, 0.62, -372.00, NOW() - INTERVAL '96 days', NOW() - INTERVAL '90 days'),
    ('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'YES', 800, 0.68, -544.00, NOW() - INTERVAL '55 days', NOW() - INTERVAL '15 days'),
    ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'YES', 1100, 0.49, 561.00, NOW() - INTERVAL '88 days', NOW() - INTERVAL '45 days'),
    ('d1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'YES', 900, 0.43, 513.00, NOW() - INTERVAL '74 days', NOW() - INTERVAL '10 days'),
    ('d2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'YES', 1400, 0.45, 770.00, NOW() - INTERVAL '91 days', NOW() - INTERVAL '60 days'),
    ('d2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'NO', 2500, 0.33, 875.00, NOW() - INTERVAL '51 days', NOW() - INTERVAL '15 days'),
    ('d2222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'YES', 1600, 0.42, 928.00, NOW() - INTERVAL '67 days', NOW() - INTERVAL '12 days'),
    ('d3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'YES', 400, 0.65, -260.00, NOW() - INTERVAL '97 days', NOW() - INTERVAL '90 days'),
    ('d3333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'YES', 500, 0.72, -360.00, NOW() - INTERVAL '56 days', NOW() - INTERVAL '15 days'),
    ('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'YES', 1500, 0.46, 810.00, NOW() - INTERVAL '87 days', NOW() - INTERVAL '60 days')
ON CONFLICT (market_id, user_id, outcome) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    average_price = EXCLUDED.average_price,
    realized_pnl = EXCLUDED.realized_pnl,
    updated_at = NOW();

-- ===================================
-- STEP 5: Create trades (only between existing users)
-- ===================================

INSERT INTO public.trades (market_id, outcome, price, quantity, buyer_id, seller_id, created_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'YES', 0.52, 1000, 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '80 days'),
    ('22222222-2222-2222-2222-222222222222', 'YES', 0.65, 800, 'a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '70 days'),
    ('33333333-3333-3333-3333-333333333333', 'YES', 0.48, 1200, 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '85 days'),
    ('44444444-4444-4444-4444-444444444444', 'NO', 0.55, 600, 'a1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '100 days'),
    ('66666666-6666-6666-6666-666666666666', 'YES', 0.42, 1500, 'a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '75 days'),
    ('11111111-1111-1111-1111-111111111111', 'YES', 0.48, 2000, 'b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '90 days'),
    ('33333333-3333-3333-3333-333333333333', 'YES', 0.46, 1500, 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '87 days'),
    ('55555555-5555-5555-5555-555555555555', 'NO', 0.32, 3000, 'b1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '52 days'),
    ('77777777-7777-7777-7777-777777777777', 'YES', 0.43, 1800, 'b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '68 days'),
    ('22222222-2222-2222-2222-222222222222', 'YES', 0.55, 1500, 'c1111111-1111-1111-1111-111111111111', 'a6666666-6666-6666-6666-666666666666', NOW() - INTERVAL '74 days'),
    ('66666666-6666-6666-6666-666666666666', 'YES', 0.39, 1200, 'c1111111-1111-1111-1111-111111111111', 'a7777777-7777-7777-7777-777777777777', NOW() - INTERVAL '76 days'),
    ('44444444-4444-4444-4444-444444444444', 'NO', 0.54, 600, 'd1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '95 days')
ON CONFLICT DO NOTHING;

-- ===================================
-- STEP 6: Populate leaderboard cache (only for existing users)
-- ===================================

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

-- Daily
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'daily', trading_volume/20, realized_pnl/20, score/20, roi*0.8, CURRENT_DATE, CURRENT_DATE, NOW()
FROM public.leaderboard_cache WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO UPDATE SET updated_at = NOW();

-- ===================================
-- STEP 7: Assign leagues (only for existing users)
-- ===================================

INSERT INTO public.user_leagues (user_id, league_id, current_points, last_updated_at)
SELECT 
    id,
    CASE 
        WHEN id IN ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222') THEN 5  -- Diamond
        WHEN id IN ('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111') THEN 4  -- Platinum
        WHEN id IN ('a5555555-5555-5555-5555-555555555555', 'b3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444') THEN 3  -- Gold
        WHEN id IN ('b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111') THEN 2  -- Silver
        ELSE 1  -- Bronze
    END,
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

-- Assign badges to top traders
INSERT INTO public.user_badges (user_id, badge_id, awarded_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '89 days'),
    ('a1111111-1111-1111-1111-111111111111', 'whale', NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', 'sniper', NOW() - INTERVAL '15 days'),
    ('b1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '87 days'),
    ('b1111111-1111-1111-1111-111111111111', 'whale', NOW() - INTERVAL '25 days'),
    ('d2222222-2222-2222-2222-222222222222', 'first_trade', NOW() - INTERVAL '84 days'),
    ('d2222222-2222-2222-2222-222222222222', 'getting_serious', NOW() - INTERVAL '50 days'),
    ('a2222222-2222-2222-2222-222222222222', 'first_trade', NOW() - INTERVAL '83 days'),
    ('a2222222-2222-2222-2222-222222222222', 'sniper', NOW() - INTERVAL '40 days'),
    ('c1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '86 days'),
    ('c1111111-1111-1111-1111-111111111111', 'getting_serious', NOW() - INTERVAL '52 days'),
    ('c1111111-1111-1111-1111-111111111111', 'streak_master', NOW() - INTERVAL '22 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Ensure all remaining users have first_trade badge
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT id, 'first_trade', created_at + INTERVAL '1 day'
FROM public.users
WHERE id NOT IN (SELECT user_id FROM public.user_badges)
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
