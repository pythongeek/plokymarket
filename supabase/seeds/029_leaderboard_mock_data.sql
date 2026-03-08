-- 029_leaderboard_mock_data.sql
-- Comprehensive mock data for leaderboard testing
-- Populates users, trades, positions, and leaderboard cache with realistic Bangladesh market data

BEGIN;

-- ===================================
-- PART 1: CREATE REALISTIC USERS (50 traders)
-- ===================================

DO $$
DECLARE
    v_user_id UUID;
    v_market_id UUID;
    v_order_id UUID;
    v_trade_id UUID;
    v_position_id UUID;
    v_counter_user_id UUID;
    i INT;
    j INT;
    v_base_price NUMERIC;
    v_quantity BIGINT;
    v_outcome outcome_type;
    v_profit NUMERIC;
BEGIN

-- Insert 50 realistic Bangladeshi traders
INSERT INTO public.users (id, email, password_hash, phone, full_name, is_admin, kyc_verified, created_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'rahim.trader@email.com', '$2a$10$hash', '+8801711111111', 'Rahim Ahmed', false, true, NOW() - INTERVAL '90 days'),
    ('a2222222-2222-2222-2222-222222222222', 'karim.bhai@email.com', '$2a$10$hash', '+8801722222222', 'Abdul Karim', false, true, NOW() - INTERVAL '85 days'),
    ('a3333333-3333-3333-3333-333333333333', 'fatima.begum@email.com', '$2a$10$hash', '+8801733333333', 'Fatima Begum', false, true, NOW() - INTERVAL '80 days'),
    ('a4444444-4444-4444-4444-444444444444', 'hasan.mia@email.com', '$2a$10$hash', '+8801744444444', 'Hasan Mia', false, false, NOW() - INTERVAL '75 days'),
    ('a5555555-5555-5555-5555-555555555555', 'nasrin.aktar@email.com', '$2a$10$hash', '+8801755555555', 'Nasrin Aktar', false, true, NOW() - INTERVAL '70 days'),
    ('a6666666-6666-6666-6666-666666666666', 'kamal.hossain@email.com', '$2a$10$hash', '+8801766666666', 'Kamal Hossain', false, true, NOW() - INTERVAL '65 days'),
    ('a7777777-7777-7777-7777-777777777777', 'nusrat.jahan@email.com', '$2a$10$hash', '+8801777777777', 'Nusrat Jahan', false, true, NOW() - INTERVAL '60 days'),
    ('a8888888-8888-8888-8888-888888888888', 'salam.sheikh@email.com', '$2a$10$hash', '+8801788888888', 'Abdus Salam', false, false, NOW() - INTERVAL '55 days'),
    ('a9999999-9999-9999-9999-999999999999', 'mina.akter@email.com', '$2a$10$hash', '+8801799999999', 'Mina Akter', false, true, NOW() - INTERVAL '50 days'),
    ('b0000000-0000-0000-0000-000000000000', 'jalal.uddin@email.com', '$2a$10$hash', '+8801700000000', 'Jalal Uddin', false, true, NOW() - INTERVAL '45 days'),
    ('b1111111-1111-1111-1111-111111111111', 'shirin.alam@email.com', '$2a$10$hash', '+8801811111111', 'Shirin Alam', false, true, NOW() - INTERVAL '88 days'),
    ('b2222222-2222-2222-2222-222222222222', 'tariq.anwar@email.com', '$2a$10$hash', '+8801822222222', 'Tariq Anwar', false, false, NOW() - INTERVAL '82 days'),
    ('b3333333-3333-3333-3333-333333333333', 'rumana.islam@email.com', '$2a$10$hash', '+8801833333333', 'Rumana Islam', false, true, NOW() - INTERVAL '78 days'),
    ('b4444444-4444-4444-4444-444444444444', 'shahin.rahman@email.com', '$2a$10$hash', '+8801844444444', 'Shahin Rahman', false, true, NOW() - INTERVAL '72 days'),
    ('b5555555-5555-5555-5555-555555555555', 'jannatul.ferdous@email.com', '$2a$10$hash', '+8801855555555', 'Jannatul Ferdous', false, true, NOW() - INTERVAL '68 days'),
    ('b6666666-6666-6666-6666-666666666666', 'imran.hossain@email.com', '$2a$10$hash', '+8801866666666', 'Imran Hossain', false, false, NOW() - INTERVAL '63 days'),
    ('b7777777-7777-7777-7777-777777777777', 'parvin.sultana@email.com', '$2a$10$hash', '+8801877777777', 'Parvin Sultana', false, true, NOW() - INTERVAL '58 days'),
    ('b8888888-8888-8888-8888-888888888888', 'rafique.ahmed@email.com', '$2a$10$hash', '+8801888888888', 'Rafique Ahmed', false, true, NOW() - INTERVAL '52 days'),
    ('b9999999-9999-9999-9999-999999999999', 'shahnaz.parvin@email.com', '$2a$10$hash', '+8801899999999', 'Shahnaz Parvin', false, true, NOW() - INTERVAL '48 days'),
    ('c0000000-0000-0000-0000-000000000000', 'monir.hossain@email.com', '$2a$10$hash', '+8801911111111', 'Monir Hossain', false, false, NOW() - INTERVAL '95 days'),
    ('c1111111-1111-1111-1111-111111111111', 'laila.arjumand@email.com', '$2a$10$hash', '+8801922222222', 'Laila Arjumand', false, true, NOW() - INTERVAL '91 days'),
    ('c2222222-2222-2222-2222-222222222222', 'faruk.ahmed@email.com', '$2a$10$hash', '+8801933333333', 'Faruk Ahmed', false, true, NOW() - INTERVAL '87 days'),
    ('c3333333-3333-3333-3333-333333333333', 'sabina.yasmin@email.com', '$2a$10$hash', '+8801944444444', 'Sabina Yasmin', false, true, NOW() - INTERVAL '83 days'),
    ('c4444444-4444-4444-4444-444444444444', 'azizur.rahman@email.com', '$2a$10$hash', '+8801955555555', 'Azizur Rahman', false, true, NOW() - INTERVAL '79 days'),
    ('c5555555-5555-5555-5555-555555555555', 'sharmin.akter@email.com', '$2a$10$hash', '+8801966666666', 'Sharmin Akter', false, false, NOW() - INTERVAL '74 days'),
    ('c6666666-6666-6666-6666-666666666666', 'habib.ullah@email.com', '$2a$10$hash', '+8801977777777', 'Habib Ullah', false, true, NOW() - INTERVAL '69 days'),
    ('c7777777-7777-7777-7777-777777777777', 'mahmuda.khatun@email.com', '$2a$10$hash', '+8801988888888', 'Mahmuda Khatun', false, true, NOW() - INTERVAL '64 days'),
    ('c8888888-8888-8888-8888-888888888888', 'sujon.ali@email.com', '$2a$10$hash', '+8801999999999', 'Sujon Ali', false, true, NOW() - INTERVAL '59 days'),
    ('c9999999-9999-9999-9999-999999999999', 'rokeya.begum@email.com', '$2a$10$hash', '+8801611111111', 'Rokeya Begum', false, true, NOW() - INTERVAL '54 days'),
    ('d0000000-0000-0000-0000-000000000000', 'anwar.hossain@email.com', '$2a$10$hash', '+8801622222222', 'Anwar Hossain', false, false, NOW() - INTERVAL '49 days'),
    ('d1111111-1111-1111-1111-111111111111', 'runa.laila@email.com', '$2a$10$hash', '+8801633333333', 'Runa Laila', false, true, NOW() - INTERVAL '96 days'),
    ('d2222222-2222-2222-2222-222222222222', 'babul.akhter@email.com', '$2a$10$hash', '+8801644444444', 'Babul Akhter', false, true, NOW() - INTERVAL '92 days'),
    ('d3333333-3333-3333-3333-333333333333', 'moushumi.aktar@email.com', '$2a$10$hash', '+8801655555555', 'Moushumi Aktar', false, true, NOW() - INTERVAL '89 days'),
    ('d4444444-4444-4444-4444-444444444444', 'iqbal.hasan@email.com', '$2a$10$hash', '+8801666666666', 'Iqbal Hasan', false, true, NOW() - INTERVAL '84 days'),
    ('d5555555-5555-5555-5555-555555555555', 'sathi.nasrin@email.com', '$2a$10$hash', '+8801677777777', 'Sathi Nasrin', false, false, NOW() - INTERVAL '80 days'),
    ('d6666666-6666-6666-6666-666666666666', 'masud.rana@email.com', '$2a$10$hash', '+8801688888888', 'Masud Rana', false, true, NOW() - INTERVAL '76 days'),
    ('d7777777-7777-7777-7777-777777777777', 'tania.akhter@email.com', '$2a$10$hash', '+8801699999999', 'Tania Akhter', false, true, NOW() - INTERVAL '71 days'),
    ('d8888888-8888-8888-8888-888888888888', 'kabir.hossain@email.com', '$2a$10$hash', '+8801511111111', 'Kabir Hossain', false, true, NOW() - INTERVAL '67 days'),
    ('d9999999-9999-9999-9999-999999999999', 'rumi.akhtar@email.com', '$2a$10$hash', '+8801522222222', 'Rumi Akhtar', false, true, NOW() - INTERVAL '62 days'),
    ('e0000000-0000-0000-0000-000000000000', 'shuvo.ahmed@email.com', '$2a$10$hash', '+8801533333333', 'Shuvo Ahmed', false, false, NOW() - INTERVAL '57 days'),
    ('e1111111-1111-1111-1111-111111111111', 'mim.rahman@email.com', '$2a$10$hash', '+8801544444444', 'Mim Rahman', false, true, NOW() - INTERVAL '53 days'),
    ('e2222222-2222-2222-2222-222222222222', 'tanvir.islam@email.com', '$2a$10$hash', '+8801555555555', 'Tanvir Islam', false, true, NOW() - INTERVAL '47 days'),
    ('e3333333-3333-3333-3333-333333333333', 'purnima.akter@email.com', '$2a$10$hash', '+8801566666666', 'Purnima Akter', false, true, NOW() - INTERVAL '44 days'),
    ('e4444444-4444-4444-4444-444444444444', 'riad.mahmud@email.com', '$2a$10$hash', '+8801577777777', 'Riad Mahmud', false, true, NOW() - INTERVAL '41 days'),
    ('e5555555-5555-5555-5555-555555555555', 'nabila.haque@email.com', '$2a$10$hash', '+8801588888888', 'Nabila Haque', false, false, NOW() - INTERVAL '38 days'),
    ('e6666666-6666-6666-6666-666666666666', 'fahim.ahmed@email.com', '$2a$10$hash', '+8801599999999', 'Fahim Ahmed', false, true, NOW() - INTERVAL '35 days'),
    ('e7777777-7777-7777-7777-777777777777', 'trisha.islam@email.com', '$2a$10$hash', '+8801411111111', 'Trisha Islam', false, true, NOW() - INTERVAL '32 days'),
    ('e8888888-8888-8888-8888-888888888888', 'arifin.shuvo@email.com', '$2a$10$hash', '+8801422222222', 'Arifin Shuvo', false, true, NOW() - INTERVAL '28 days'),
    ('e9999999-9999-9999-9999-999999999999', 'porimoni.akter@email.com', '$2a$10$hash', '+8801433333333', 'Porimoni Akter', false, true, NOW() - INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- PART 2: CREATE WALLETS WITH VARIOUS BALANCES
-- ===================================

-- Wallets will be auto-created by trigger, update them with realistic balances
UPDATE public.wallets SET balance = 50000, locked_balance = 5000 WHERE user_id = 'a1111111-1111-1111-1111-111111111111'; -- Top trader
UPDATE public.wallets SET balance = 35000, locked_balance = 3000 WHERE user_id = 'a2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 42000, locked_balance = 2000 WHERE user_id = 'a3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 28000, locked_balance = 4000 WHERE user_id = 'a4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 55000, locked_balance = 6000 WHERE user_id = 'a5555555-5555-5555-5555-555555555555';
UPDATE public.wallets SET balance = 15000, locked_balance = 1000 WHERE user_id = 'a6666666-6666-6666-6666-666666666666';
UPDATE public.wallets SET balance = 38000, locked_balance = 2500 WHERE user_id = 'a7777777-7777-7777-7777-777777777777';
UPDATE public.wallets SET balance = 22000, locked_balance = 1500 WHERE user_id = 'a8888888-8888-8888-8888-888888888888';
UPDATE public.wallets SET balance = 45000, locked_balance = 4500 WHERE user_id = 'a9999999-9999-9999-9999-999999999999';
UPDATE public.wallets SET balance = 32000, locked_balance = 2000 WHERE user_id = 'b0000000-0000-0000-0000-000000000000';
UPDATE public.wallets SET balance = 60000, locked_balance = 8000 WHERE user_id = 'b1111111-1111-1111-1111-111111111111';
UPDATE public.wallets SET balance = 18000, locked_balance = 1200 WHERE user_id = 'b2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 41000, locked_balance = 3000 WHERE user_id = 'b3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 29000, locked_balance = 1800 WHERE user_id = 'b4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 52000, locked_balance = 5000 WHERE user_id = 'b5555555-5555-5555-5555-555555555555';
UPDATE public.wallets SET balance = 25000, locked_balance = 2000 WHERE user_id = 'b6666666-6666-6666-6666-666666666666';
UPDATE public.wallets SET balance = 37000, locked_balance = 2800 WHERE user_id = 'b7777777-7777-7777-7777-777777777777';
UPDATE public.wallets SET balance = 44000, locked_balance = 3500 WHERE user_id = 'b8888888-8888-8888-8888-888888888888';
UPDATE public.wallets SET balance = 31000, locked_balance = 2200 WHERE user_id = 'b9999999-9999-9999-9999-999999999999';
UPDATE public.wallets SET balance = 48000, locked_balance = 4000 WHERE user_id = 'c0000000-0000-0000-0000-000000000000';
UPDATE public.wallets SET balance = 21000, locked_balance = 1500 WHERE user_id = 'c1111111-1111-1111-1111-111111111111';
UPDATE public.wallets SET balance = 53000, locked_balance = 5500 WHERE user_id = 'c2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 27000, locked_balance = 1800 WHERE user_id = 'c3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 39000, locked_balance = 3200 WHERE user_id = 'c4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 34000, locked_balance = 2500 WHERE user_id = 'c5555555-5555-5555-5555-555555555555';
UPDATE public.wallets SET balance = 46000, locked_balance = 4200 WHERE user_id = 'c6666666-6666-6666-6666-666666666666';
UPDATE public.wallets SET balance = 20000, locked_balance = 1000 WHERE user_id = 'c7777777-7777-7777-7777-777777777777';
UPDATE public.wallets SET balance = 51000, locked_balance = 4800 WHERE user_id = 'c8888888-8888-8888-8888-888888888888';
UPDATE public.wallets SET balance = 36000, locked_balance = 2800 WHERE user_id = 'c9999999-9999-9999-9999-999999999999';
UPDATE public.wallets SET balance = 43000, locked_balance = 3500 WHERE user_id = 'd0000000-0000-0000-0000-000000000000';
UPDATE public.wallets SET balance = 24000, locked_balance = 1600 WHERE user_id = 'd1111111-1111-1111-1111-111111111111';
UPDATE public.wallets SET balance = 47000, locked_balance = 3800 WHERE user_id = 'd2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 33000, locked_balance = 2400 WHERE user_id = 'd3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 56000, locked_balance = 6000 WHERE user_id = 'd4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 19000, locked_balance = 1200 WHERE user_id = 'd5555555-5555-5555-5555-555555555555';
UPDATE public.wallets SET balance = 40000, locked_balance = 3000 WHERE user_id = 'd6666666-6666-6666-6666-666666666666';
UPDATE public.wallets SET balance = 26000, locked_balance = 1700 WHERE user_id = 'd7777777-7777-7777-7777-777777777777';
UPDATE public.wallets SET balance = 49000, locked_balance = 4500 WHERE user_id = 'd8888888-8888-8888-8888-888888888888';
UPDATE public.wallets SET balance = 30000, locked_balance = 2000 WHERE user_id = 'd9999999-9999-9999-9999-999999999999';
UPDATE public.wallets SET balance = 54000, locked_balance = 5200 WHERE user_id = 'e0000000-0000-0000-0000-000000000000';
UPDATE public.wallets SET balance = 23000, locked_balance = 1400 WHERE user_id = 'e1111111-1111-1111-1111-111111111111';
UPDATE public.wallets SET balance = 41000, locked_balance = 3300 WHERE user_id = 'e2222222-2222-2222-2222-222222222222';
UPDATE public.wallets SET balance = 35000, locked_balance = 2600 WHERE user_id = 'e3333333-3333-3333-3333-333333333333';
UPDATE public.wallets SET balance = 42000, locked_balance = 3100 WHERE user_id = 'e4444444-4444-4444-4444-444444444444';
UPDATE public.wallets SET balance = 28000, locked_balance = 1900 WHERE user_id = 'e5555555-5555-5555-5555-555555555555';
UPDATE public.wallets SET balance = 50000, locked_balance = 4800 WHERE user_id = 'e6666666-6666-6666-6666-666666666666';
UPDATE public.wallets SET balance = 32000, locked_balance = 2100 WHERE user_id = 'e7777777-7777-7777-7777-777777777777';
UPDATE public.wallets SET balance = 45000, locked_balance = 3600 WHERE user_id = 'e8888888-8888-8888-8888-888888888888';
UPDATE public.wallets SET balance = 38000, locked_balance = 2900 WHERE user_id = 'e9999999-9999-9999-9999-999999999999';

-- ===================================
-- PART 3: CREATE RESOLVED MARKETS FOR P&L CALCULATION
-- ===================================

-- Insert resolved markets with winning outcomes
INSERT INTO public.markets (id, question, description, category, status, winning_outcome, trading_closes_at, event_date, resolved_at, total_volume) VALUES
    ('m1111111-1111-1111-1111-111111111111', 'Will Bangladesh win the T20 series vs India 2024?', 'Bangladesh cricket team to win T20 series', 'Sports', 'resolved', 'YES', '2024-10-01', '2024-10-15', NOW() - INTERVAL '45 days', 250000),
    ('m2222222-2222-2222-2222-222222222222', 'Will BDT hit 125 per USD by Nov 2024?', 'Bangladesh Taka exchange rate prediction', 'Finance', 'resolved', 'YES', '2024-10-31', '2024-11-30', NOW() - INTERVAL '30 days', 180000),
    ('m3333333-3333-3333-3333-333333333333', 'Will Dhaka Metro open Line 6 by Oct 2024?', 'Metro rail expansion in Dhaka', 'Politics', 'resolved', 'YES', '2024-09-30', '2024-10-15', NOW() - INTERVAL '60 days', 320000),
    ('m4444444-4444-4444-4444-444444444444', 'Will India win more than 7 medals at Paris Olympics?', 'Olympic medal tally prediction', 'Sports', 'resolved', 'NO', '2024-07-25', '2024-08-11', NOW() - INTERVAL '90 days', 150000),
    ('m5555555-5555-5555-5555-555555555555', 'Will Bitcoin reach $70K by end of 2024?', 'Cryptocurrency price milestone', 'Crypto', 'resolved', 'NO', '2024-12-01', '2024-12-31', NOW() - INTERVAL '15 days', 450000),
    ('m6666666-6666-6666-6666-666666666666', 'Will Padma Bridge 2nd phase complete by Dec 2024?', 'Infrastructure project completion', 'Politics', 'resolved', 'YES', '2024-11-30', '2024-12-31', NOW() - INTERVAL '10 days', 280000),
    ('m7777777-7777-7777-7777-777777777777', 'Will Bangladesh reach $55B exports in 2024?', 'Export milestone prediction', 'Economy', 'resolved', 'YES', '2024-12-01', '2024-12-31', NOW() - INTERVAL '12 days', 200000)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- PART 4: CREATE POSITIONS WITH REALISTIC P&L FOR EACH USER
-- ===================================

-- Create positions for each user across resolved markets with varied performance
-- Top performers (high win rate, high P&L)
INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 'YES', 1000, 0.52, 480.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '45 days'),
    ('a1111111-1111-1111-1111-111111111111', 'm2222222-2222-2222-2222-222222222222', 'YES', 800, 0.65, 280.00, NOW() - INTERVAL '70 days', NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', 'm3333333-3333-3333-3333-333333333333', 'YES', 1200, 0.48, 624.00, NOW() - INTERVAL '85 days', NOW() - INTERVAL '60 days'),
    ('a1111111-1111-1111-1111-111111111111', 'm4444444-4444-4444-4444-444444444444', 'NO', 600, 0.55, 330.00, NOW() - INTERVAL '100 days', NOW() - INTERVAL '90 days'),
    ('a1111111-1111-1111-1111-111111111111', 'm6666666-6666-6666-6666-666666666666', 'YES', 1500, 0.42, 870.00, NOW() - INTERVAL '75 days', NOW() - INTERVAL '10 days'),
    ('a2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'YES', 800, 0.55, 360.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '45 days'),
    ('a2222222-2222-2222-2222-222222222222', 'm3333333-3333-3333-3333-333333333333', 'YES', 1000, 0.50, 500.00, NOW() - INTERVAL '82 days', NOW() - INTERVAL '60 days'),
    ('a2222222-2222-2222-2222-222222222222', 'm7777777-7777-7777-7777-777777777777', 'YES', 900, 0.45, 495.00, NOW() - INTERVAL '65 days', NOW() - INTERVAL '12 days'),
    ('a3333333-3333-3333-3333-333333333333', 'm2222222-2222-2222-2222-222222222222', 'YES', 1200, 0.60, 480.00, NOW() - INTERVAL '72 days', NOW() - INTERVAL '30 days'),
    ('a3333333-3333-3333-3333-333333333333', 'm5555555-5555-5555-5555-555555555555', 'NO', 2000, 0.35, 700.00, NOW() - INTERVAL '50 days', NOW() - INTERVAL '15 days'),
    ('a3333333-3333-3333-3333-333333333333', 'm6666666-6666-6666-6666-666666666666', 'YES', 1100, 0.44, 616.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '10 days');

-- More users with mixed performance
INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at) VALUES
    ('a5555555-5555-5555-5555-555555555555', 'm1111111-1111-1111-1111-111111111111', 'YES', 1500, 0.50, 750.00, NOW() - INTERVAL '85 days', NOW() - INTERVAL '45 days'),
    ('a5555555-5555-5555-5555-555555555555', 'm2222222-2222-2222-2222-222222222222', 'YES', 1000, 0.62, 380.00, NOW() - INTERVAL '75 days', NOW() - INTERVAL '30 days'),
    ('a5555555-5555-5555-5555-555555555555', 'm3333333-3333-3333-3333-333333333333', 'YES', 800, 0.51, 392.00, NOW() - INTERVAL '88 days', NOW() - INTERVAL '60 days'),
    ('a5555555-5555-5555-5555-555555555555', 'm4444444-4444-4444-4444-444444444444', 'YES', 500, 0.60, -300.00, NOW() - INTERVAL '95 days', NOW() - INTERVAL '90 days'),
    ('a5555555-5555-5555-5555-555555555555', 'm5555555-5555-5555-5555-555555555555', 'YES', 600, 0.68, -408.00, NOW() - INTERVAL '55 days', NOW() - INTERVAL '15 days'),
    ('a5555555-5555-5555-5555-555555555555', 'm6666666-6666-6666-6666-666666666666', 'YES', 1300, 0.40, 780.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '10 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 'YES', 2000, 0.48, 1040.00, NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm3333333-3333-3333-3333-333333333333', 'YES', 1500, 0.46, 810.00, NOW() - INTERVAL '87 days', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm5555555-5555-5555-5555-555555555555', 'NO', 3000, 0.32, 1050.00, NOW() - INTERVAL '52 days', NOW() - INTERVAL '15 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm7777777-7777-7777-7777-777777777777', 'YES', 1800, 0.43, 1026.00, NOW() - INTERVAL '68 days', NOW() - INTERVAL '12 days'),
    ('b4444444-4444-4444-4444-444444444444', 'm2222222-2222-2222-2222-222222222222', 'YES', 900, 0.58, 378.00, NOW() - INTERVAL '73 days', NOW() - INTERVAL '30 days'),
    ('b4444444-4444-4444-4444-444444444444', 'm4444444-4444-4444-4444-444444444444', 'NO', 1200, 0.52, 624.00, NOW() - INTERVAL '98 days', NOW() - INTERVAL '90 days'),
    ('b4444444-4444-4444-4444-444444444444', 'm6666666-6666-6666-6666-666666666666', 'YES', 1000, 0.41, 590.00, NOW() - INTERVAL '77 days', NOW() - INTERVAL '10 days');

-- Add more positions for remaining users (simplified loop-like inserts)
FOR i IN 1..50 LOOP
    -- Generate varied positions for each user based on their "trader profile"
    CONTINUE;
END LOOP;

-- Manual batch inserts for remaining users
INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at) VALUES
    -- Medium performers
    ('b7777777-7777-7777-7777-777777777777', 'm1111111-1111-1111-1111-111111111111', 'YES', 600, 0.54, 276.00, NOW() - INTERVAL '79 days', NOW() - INTERVAL '45 days'),
    ('b7777777-7777-7777-7777-777777777777', 'm3333333-3333-3333-3333-333333333333', 'YES', 500, 0.52, 240.00, NOW() - INTERVAL '83 days', NOW() - INTERVAL '60 days'),
    ('b7777777-7777-7777-7777-777777777777', 'm5555555-5555-5555-5555-555555555555', 'YES', 400, 0.70, -280.00, NOW() - INTERVAL '54 days', NOW() - INTERVAL '15 days'),
    ('c2222222-2222-2222-2222-222222222222', 'm2222222-2222-2222-2222-222222222222', 'YES', 1500, 0.55, 675.00, NOW() - INTERVAL '74 days', NOW() - INTERVAL '30 days'),
    ('c2222222-2222-2222-2222-222222222222', 'm6666666-6666-6666-6666-666666666666', 'YES', 1200, 0.39, 732.00, NOW() - INTERVAL '76 days', NOW() - INTERVAL '10 days'),
    ('c4444444-4444-4444-4444-444444444444', 'm1111111-1111-1111-1111-111111111111', 'YES', 700, 0.56, 308.00, NOW() - INTERVAL '81 days', NOW() - INTERVAL '45 days'),
    ('c4444444-4444-4444-4444-444444444444', 'm3333333-3333-3333-3333-333333333333', 'YES', 600, 0.53, 282.00, NOW() - INTERVAL '84 days', NOW() - INTERVAL '60 days'),
    ('c4444444-4444-4444-4444-444444444444', 'm7777777-7777-7777-7777-777777777777', 'YES', 800, 0.44, 448.00, NOW() - INTERVAL '66 days', NOW() - INTERVAL '12 days'),
    ('c6666666-6666-6666-6666-666666666666', 'm1111111-1111-1111-1111-111111111111', 'YES', 900, 0.51, 441.00, NOW() - INTERVAL '86 days', NOW() - INTERVAL '45 days'),
    ('c6666666-6666-6666-6666-666666666666', 'm4444444-4444-4444-4444-444444444444', 'NO', 1000, 0.54, 540.00, NOW() - INTERVAL '99 days', NOW() - INTERVAL '90 days'),
    ('c6666666-6666-6666-6666-666666666666', 'm6666666-6666-6666-6666-666666666666', 'YES', 1100, 0.40, 660.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '10 days'),
    ('c8888888-8888-8888-8888-888888888888', 'm2222222-2222-2222-2222-222222222222', 'YES', 1300, 0.57, 559.00, NOW() - INTERVAL '71 days', NOW() - INTERVAL '30 days'),
    ('c8888888-8888-8888-8888-888888888888', 'm3333333-3333-3333-3333-333333333333', 'YES', 1000, 0.47, 530.00, NOW() - INTERVAL '89 days', NOW() - INTERVAL '60 days'),
    ('c8888888-8888-8888-8888-888888888888', 'm5555555-5555-5555-5555-555555555555', 'NO', 1500, 0.36, 525.00, NOW() - INTERVAL '53 days', NOW() - INTERVAL '15 days'),
    ('d2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'YES', 1100, 0.49, 561.00, NOW() - INTERVAL '88 days', NOW() - INTERVAL '45 days'),
    ('d2222222-2222-2222-2222-222222222222', 'm6666666-6666-6666-6666-666666666666', 'YES', 900, 0.43, 513.00, NOW() - INTERVAL '74 days', NOW() - INTERVAL '10 days'),
    ('d4444444-4444-4444-4444-444444444444', 'm3333333-3333-3333-3333-333333333333', 'YES', 1400, 0.45, 770.00, NOW() - INTERVAL '91 days', NOW() - INTERVAL '60 days'),
    ('d4444444-4444-4444-4444-444444444444', 'm5555555-5555-5555-5555-555555555555', 'NO', 2500, 0.33, 875.00, NOW() - INTERVAL '51 days', NOW() - INTERVAL '15 days'),
    ('d4444444-4444-4444-4444-444444444444', 'm7777777-7777-7777-7777-777777777777', 'YES', 1600, 0.42, 928.00, NOW() - INTERVAL '67 days', NOW() - INTERVAL '12 days');

-- Lower performers (some losses)
INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at) VALUES
    ('a4444444-4444-4444-4444-444444444444', 'm1111111-1111-1111-1111-111111111111', 'NO', 800, 0.48, -384.00, NOW() - INTERVAL '77 days', NOW() - INTERVAL '45 days'),
    ('a4444444-4444-4444-4444-444444444444', 'm2222222-2222-2222-2222-222222222222', 'NO', 600, 0.40, -240.00, NOW() - INTERVAL '69 days', NOW() - INTERVAL '30 days'),
    ('a4444444-4444-4444-4444-444444444444', 'm3333333-3333-3333-3333-333333333333', 'NO', 500, 0.52, -260.00, NOW() - INTERVAL '86 days', NOW() - INTERVAL '60 days'),
    ('a6666666-6666-6666-6666-666666666666', 'm4444444-4444-4444-4444-444444444444', 'YES', 400, 0.65, -260.00, NOW() - INTERVAL '97 days', NOW() - INTERVAL '90 days'),
    ('a6666666-6666-6666-6666-666666666666', 'm5555555-5555-5555-5555-555555555555', 'YES', 500, 0.72, -360.00, NOW() - INTERVAL '56 days', NOW() - INTERVAL '15 days'),
    ('b2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'NO', 700, 0.50, -350.00, NOW() - INTERVAL '76 days', NOW() - INTERVAL '45 days'),
    ('b2222222-2222-2222-2222-222222222222', 'm3333333-3333-3333-3333-333333333333', 'NO', 600, 0.49, -294.00, NOW() - INTERVAL '85 days', NOW() - INTERVAL '60 days'),
    ('b6666666-6666-6666-6666-666666666666', 'm2222222-2222-2222-2222-222222222222', 'NO', 500, 0.38, -190.00, NOW() - INTERVAL '68 days', NOW() - INTERVAL '30 days'),
    ('c0000000-0000-0000-0000-000000000000', 'm4444444-4444-4444-4444-444444444444', 'YES', 600, 0.62, -372.00, NOW() - INTERVAL '96 days', NOW() - INTERVAL '90 days'),
    ('c0000000-0000-0000-0000-000000000000', 'm5555555-5555-5555-5555-555555555555', 'YES', 800, 0.68, -544.00, NOW() - INTERVAL '55 days', NOW() - INTERVAL '15 days'),
    ('c5555555-5555-5555-5555-555555555555', 'm1111111-1111-1111-1111-111111111111', 'NO', 500, 0.51, -255.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '45 days');

-- ===================================
-- PART 5: CREATE TRADES FOR VOLUME CALCULATIONS
-- ===================================

-- Generate trades for each position (simplified representation)
-- Trade records for top volume users
INSERT INTO public.trades (market_id, outcome, price, quantity, buyer_id, seller_id, created_at) VALUES
    ('m1111111-1111-1111-1111-111111111111', 'YES', 0.52, 1000, 'a1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000000', NOW() - INTERVAL '80 days'),
    ('m2222222-2222-2222-2222-222222222222', 'YES', 0.65, 800, 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '70 days'),
    ('m3333333-3333-3333-3333-333333333333', 'YES', 0.48, 1200, 'a1111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000000', NOW() - INTERVAL '85 days'),
    ('m4444444-4444-4444-4444-444444444444', 'NO', 0.55, 600, 'a1111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000000', NOW() - INTERVAL '100 days'),
    ('m6666666-6666-6666-6666-666666666666', 'YES', 0.42, 1500, 'a1111111-1111-1111-1111-111111111111', 'e0000000-0000-0000-0000-000000000000', NOW() - INTERVAL '75 days'),
    ('m1111111-1111-1111-1111-111111111111', 'YES', 0.48, 2000, 'b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '90 days'),
    ('m3333333-3333-3333-3333-333333333333', 'YES', 0.46, 1500, 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '87 days'),
    ('m5555555-5555-5555-5555-555555555555', 'NO', 0.32, 3000, 'b1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '52 days'),
    ('m7777777-7777-7777-7777-777777777777', 'YES', 0.43, 1800, 'b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '68 days'),
    ('m2222222-2222-2222-2222-222222222222', 'YES', 0.55, 1500, 'c2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', NOW() - INTERVAL '74 days'),
    ('m6666666-6666-6666-6666-666666666666', 'YES', 0.39, 1200, 'c2222222-2222-2222-2222-222222222222', 'a7777777-7777-7777-7777-777777777777', NOW() - INTERVAL '76 days');

-- Add more trades for volume diversity
INSERT INTO public.trades (market_id, outcome, price, quantity, buyer_id, seller_id, created_at)
SELECT 
    'm1111111-1111-1111-1111-111111111111',
    'YES',
    0.50 + (random() * 0.10),
    (100 + (random() * 900))::bigint,
    u1.id,
    u2.id,
    NOW() - INTERVAL '1 day' * (10 + (random() * 80))
FROM public.users u1
CROSS JOIN public.users u2
WHERE u1.id != u2.id
  AND u1.id IN (SELECT id FROM public.users ORDER BY random() LIMIT 20)
  AND u2.id IN (SELECT id FROM public.users ORDER BY random() LIMIT 20)
LIMIT 100;

-- ===================================
-- PART 6: POPULATE LEADERBOARD CACHE
-- ===================================

-- Insert leaderboard entries for different timeframes
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, unrealized_pnl, score, roi, current_streak, best_streak, risk_score, period_start, period_end, updated_at)
SELECT 
    u.id,
    'all_time',
    COALESCE((SELECT SUM(quantity * average_price) FROM public.positions WHERE user_id = u.id), 0)::bigint * 100,
    COALESCE((SELECT SUM(realized_pnl) FROM public.positions WHERE user_id = u.id), 0)::bigint * 100,
    0,
    COALESCE((SELECT SUM(realized_pnl) FROM public.positions WHERE user_id = u.id), 0)::bigint * 100,
    CASE 
        WHEN u.id IN ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444') THEN 85.50
        WHEN u.id IN ('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222') THEN 65.25
        WHEN u.id IN ('a5555555-5555-5555-5555-555555555555', 'c6666666-6666-6666-6666-666666666666', 'b4444444-4444-4444-4444-444444444444') THEN 45.80
        ELSE 15.30 + (random() * 20)
    END,
    CASE 
        WHEN u.id IN ('a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222') THEN 7
        WHEN u.id IN ('b1111111-1111-1111-1111-111111111111', 'c8888888-8888-8888-8888-888888888888') THEN 5
        WHEN u.id IN ('d4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444') THEN 4
        ELSE floor(random() * 3)::int
    END,
    CASE 
        WHEN u.id IN ('a1111111-1111-1111-1111-111111111111') THEN 12
        WHEN u.id IN ('b1111111-1111-1111-1111-111111111111') THEN 8
        ELSE floor(random() * 6)::int
    END,
    3.50 + (random() * 4),
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    NOW()
FROM public.users u
WHERE u.id LIKE 'a%' OR u.id LIKE 'b%' OR u.id LIKE 'c%' OR u.id LIKE 'd%' OR u.id LIKE 'e%'
ON CONFLICT (user_id, timeframe) DO NOTHING;

-- Weekly leaderboard
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, unrealized_pnl, score, roi, current_streak, best_streak, risk_score, period_start, period_end, updated_at)
SELECT 
    user_id,
    'weekly',
    trading_volume / 4,
    realized_pnl / 4,
    unrealized_pnl,
    score / 4,
    roi * 0.9,
    current_streak,
    best_streak,
    risk_score,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE,
    NOW()
FROM public.leaderboard_cache
WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO NOTHING;

-- Monthly leaderboard
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, unrealized_pnl, score, roi, current_streak, best_streak, risk_score, period_start, period_end, updated_at)
SELECT 
    user_id,
    'monthly',
    trading_volume / 2,
    realized_pnl / 2,
    unrealized_pnl,
    score / 2,
    roi * 0.95,
    current_streak,
    best_streak,
    risk_score,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    NOW()
FROM public.leaderboard_cache
WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO NOTHING;

-- Daily leaderboard
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, unrealized_pnl, score, roi, current_streak, best_streak, risk_score, period_start, period_end, updated_at)
SELECT 
    user_id,
    'daily',
    trading_volume / 20,
    realized_pnl / 20,
    unrealized_pnl,
    score / 20,
    roi * 0.8,
    CASE WHEN random() > 0.7 THEN 1 ELSE 0 END,
    best_streak,
    risk_score,
    CURRENT_DATE,
    CURRENT_DATE,
    NOW()
FROM public.leaderboard_cache
WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO NOTHING;

-- ===================================
-- PART 7: ASSIGN USERS TO LEAGUES
-- ===================================

INSERT INTO public.user_leagues (user_id, league_id, current_points, is_promoted, is_relegated, last_updated_at)
SELECT 
    u.id,
    CASE 
        WHEN u.id IN ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444') THEN 5 -- Diamond
        WHEN u.id IN ('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444') THEN 4 -- Platinum
        WHEN u.id IN ('a5555555-5555-5555-5555-555555555555', 'c6666666-6666-6666-6666-666666666666', 'c8888888-8888-8888-8888-888888888888', 'd2222222-2222-2222-2222-222222222222') THEN 3 -- Gold
        WHEN u.id IN ('b7777777-7777-7777-7777-777777777777', 'c4444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555') THEN 2 -- Silver
        ELSE 1 -- Bronze
    END,
    CASE 
        WHEN u.id IN ('a1111111-1111-1111-1111-111111111111') THEN 2850.00
        WHEN u.id IN ('b1111111-1111-1111-1111-111111111111') THEN 2420.00
        WHEN u.id IN ('d4444444-4444-4444-4444-444444444444') THEN 2150.00
        ELSE 500.00 + (random() * 1500)
    END,
    false,
    false,
    NOW()
FROM public.users u
WHERE u.id LIKE 'a%' OR u.id LIKE 'b%' OR u.id LIKE 'c%' OR u.id LIKE 'd%' OR u.id LIKE 'e%'
ON CONFLICT (user_id) DO NOTHING;

-- ===================================
-- PART 8: ASSIGN BADGES TO USERS
-- ===================================

-- Top traders get special badges
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
VALUES
    ('a1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '89 days'),
    ('a1111111-1111-1111-1111-111111111111', 'getting_serious', NOW() - INTERVAL '60 days'),
    ('a1111111-1111-1111-1111-111111111111', 'whale', NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', 'sniper', NOW() - INTERVAL '15 days'),
    ('a1111111-1111-1111-1111-111111111111', 'streak_master', NOW() - INTERVAL '20 days'),
    ('b1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '87 days'),
    ('b1111111-1111-1111-1111-111111111111', 'getting_serious', NOW() - INTERVAL '55 days'),
    ('b1111111-1111-1111-1111-111111111111', 'whale', NOW() - INTERVAL '25 days'),
    ('d4444444-4444-4444-4444-444444444444', 'first_trade', NOW() - INTERVAL '84 days'),
    ('d4444444-4444-4444-4444-444444444444', 'getting_serious', NOW() - INTERVAL '50 days'),
    ('a2222222-2222-2222-2222-222222222222', 'first_trade', NOW() - INTERVAL '83 days'),
    ('a2222222-2222-2222-2222-222222222222', 'sniper', NOW() - INTERVAL '40 days'),
    ('c8888888-8888-8888-8888-888888888888', 'first_trade', NOW() - INTERVAL '86 days'),
    ('c8888888-8888-8888-8888-888888888888', 'getting_serious', NOW() - INTERVAL '52 days'),
    ('c8888888-8888-8888-8888-888888888888', 'streak_master', NOW() - INTERVAL '22 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Assign first_trade badge to all users
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT u.id, 'first_trade', u.created_at + INTERVAL '1 day'
FROM public.users u
WHERE u.id NOT IN (SELECT user_id FROM public.user_badges)
ON CONFLICT (user_id, badge_id) DO NOTHING;

END $$;

COMMIT;
