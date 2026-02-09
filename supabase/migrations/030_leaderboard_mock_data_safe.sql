-- 030_leaderboard_mock_data_safe.sql
-- Safe version that handles FK constraints properly
-- Run this in Supabase SQL Editor

-- ===================================
-- STEP 1: Create a temporary function to safely insert users
-- ===================================

CREATE OR REPLACE FUNCTION safe_insert_mock_users()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Temporarily disable triggers on users table
    ALTER TABLE public.users DISABLE TRIGGER ALL;
    
    -- Insert users
    FOR user_record IN 
        SELECT * FROM (VALUES
            ('a1111111-1111-1111-1111-111111111111'::uuid, 'rahim.trader@email.com', '$2a$10$hash', '+8801711111111', 'Rahim Ahmed', false, true, NOW() - INTERVAL '90 days'),
            ('a2222222-2222-2222-2222-222222222222'::uuid, 'karim.bhai@email.com', '$2a$10$hash', '+8801722222222', 'Abdul Karim', false, true, NOW() - INTERVAL '85 days'),
            ('a3333333-3333-3333-3333-333333333333'::uuid, 'fatima.begum@email.com', '$2a$10$hash', '+8801733333333', 'Fatima Begum', false, true, NOW() - INTERVAL '80 days'),
            ('a4444444-4444-4444-4444-444444444444'::uuid, 'hasan.mia@email.com', '$2a$10$hash', '+8801744444444', 'Hasan Mia', false, false, NOW() - INTERVAL '75 days'),
            ('a5555555-5555-5555-5555-555555555555'::uuid, 'nasrin.aktar@email.com', '$2a$10$hash', '+8801755555555', 'Nasrin Aktar', false, true, NOW() - INTERVAL '70 days'),
            ('a6666666-6666-6666-6666-666666666666'::uuid, 'kamal.hossain@email.com', '$2a$10$hash', '+8801766666666', 'Kamal Hossain', false, true, NOW() - INTERVAL '65 days'),
            ('a7777777-7777-7777-7777-777777777777'::uuid, 'nusrat.jahan@email.com', '$2a$10$hash', '+8801777777777', 'Nusrat Jahan', false, true, NOW() - INTERVAL '60 days'),
            ('a8888888-8888-8888-8888-888888888888'::uuid, 'salam.sheikh@email.com', '$2a$10$hash', '+8801788888888', 'Abdus Salam', false, false, NOW() - INTERVAL '55 days'),
            ('a9999999-9999-9999-9999-999999999999'::uuid, 'mina.akter@email.com', '$2a$10$hash', '+8801799999999', 'Mina Akter', false, true, NOW() - INTERVAL '50 days'),
            ('b0000000-0000-0000-0000-000000000000'::uuid, 'jalal.uddin@email.com', '$2a$10$hash', '+8801700000000', 'Jalal Uddin', false, true, NOW() - INTERVAL '45 days'),
            ('b1111111-1111-1111-1111-111111111111'::uuid, 'shirin.alam@email.com', '$2a$10$hash', '+8801811111111', 'Shirin Alam', false, true, NOW() - INTERVAL '88 days'),
            ('b2222222-2222-2222-2222-222222222222'::uuid, 'tariq.anwar@email.com', '$2a$10$hash', '+8801822222222', 'Tariq Anwar', false, false, NOW() - INTERVAL '82 days'),
            ('b3333333-3333-3333-3333-333333333333'::uuid, 'rumana.islam@email.com', '$2a$10$hash', '+8801833333333', 'Rumana Islam', false, true, NOW() - INTERVAL '78 days'),
            ('b4444444-4444-4444-4444-444444444444'::uuid, 'shahin.rahman@email.com', '$2a$10$hash', '+8801844444444', 'Shahin Rahman', false, true, NOW() - INTERVAL '72 days'),
            ('b5555555-5555-5555-5555-555555555555'::uuid, 'jannatul.ferdous@email.com', '$2a$10$hash', '+8801855555555', 'Jannatul Ferdous', false, true, NOW() - INTERVAL '68 days'),
            ('b6666666-6666-6666-6666-666666666666'::uuid, 'imran.hossain@email.com', '$2a$10$hash', '+8801866666666', 'Imran Hossain', false, false, NOW() - INTERVAL '63 days'),
            ('b7777777-7777-7777-7777-777777777777'::uuid, 'parvin.sultana@email.com', '$2a$10$hash', '+8801877777777', 'Parvin Sultana', false, true, NOW() - INTERVAL '58 days'),
            ('b8888888-8888-8888-8888-888888888888'::uuid, 'rafique.ahmed@email.com', '$2a$10$hash', '+8801888888888', 'Rafique Ahmed', false, true, NOW() - INTERVAL '52 days'),
            ('b9999999-9999-9999-9999-999999999999'::uuid, 'shahnaz.parvin@email.com', '$2a$10$hash', '+8801899999999', 'Shahnaz Parvin', false, true, NOW() - INTERVAL '48 days'),
            ('c0000000-0000-0000-0000-000000000000'::uuid, 'monir.hossain@email.com', '$2a$10$hash', '+8801911111111', 'Monir Hossain', false, false, NOW() - INTERVAL '95 days'),
            ('c1111111-1111-1111-1111-111111111111'::uuid, 'laila.arjumand@email.com', '$2a$10$hash', '+8801922222222', 'Laila Arjumand', false, true, NOW() - INTERVAL '91 days'),
            ('c2222222-2222-2222-2222-222222222222'::uuid, 'faruk.ahmed@email.com', '$2a$10$hash', '+8801933333333', 'Faruk Ahmed', false, true, NOW() - INTERVAL '87 days'),
            ('c3333333-3333-3333-3333-333333333333'::uuid, 'sabina.yasmin@email.com', '$2a$10$hash', '+8801944444444', 'Sabina Yasmin', false, true, NOW() - INTERVAL '83 days'),
            ('c4444444-4444-4444-4444-444444444444'::uuid, 'azizur.rahman@email.com', '$2a$10$hash', '+8801955555555', 'Azizur Rahman', false, true, NOW() - INTERVAL '79 days'),
            ('c5555555-5555-5555-5555-555555555555'::uuid, 'sharmin.akter@email.com', '$2a$10$hash', '+8801966666666', 'Sharmin Akter', false, false, NOW() - INTERVAL '74 days'),
            ('c6666666-6666-6666-6666-666666666666'::uuid, 'habib.ullah@email.com', '$2a$10$hash', '+8801977777777', 'Habib Ullah', false, true, NOW() - INTERVAL '69 days'),
            ('c7777777-7777-7777-7777-777777777777'::uuid, 'mahmuda.khatun@email.com', '$2a$10$hash', '+8801988888888', 'Mahmuda Khatun', false, true, NOW() - INTERVAL '64 days'),
            ('c8888888-8888-8888-8888-888888888888'::uuid, 'sujon.ali@email.com', '$2a$10$hash', '+8801999999999', 'Sujon Ali', false, true, NOW() - INTERVAL '59 days'),
            ('c9999999-9999-9999-9999-999999999999'::uuid, 'rokeya.begum@email.com', '$2a$10$hash', '+8801611111111', 'Rokeya Begum', false, true, NOW() - INTERVAL '54 days'),
            ('d0000000-0000-0000-0000-000000000000'::uuid, 'anwar.hossain@email.com', '$2a$10$hash', '+8801622222222', 'Anwar Hossain', false, false, NOW() - INTERVAL '49 days'),
            ('d1111111-1111-1111-1111-111111111111'::uuid, 'runa.laila@email.com', '$2a$10$hash', '+8801633333333', 'Runa Laila', false, true, NOW() - INTERVAL '96 days'),
            ('d2222222-2222-2222-2222-222222222222'::uuid, 'babul.akhter@email.com', '$2a$10$hash', '+8801644444444', 'Babul Akhter', false, true, NOW() - INTERVAL '92 days'),
            ('d3333333-3333-3333-3333-333333333333'::uuid, 'moushumi.aktar@email.com', '$2a$10$hash', '+8801655555555', 'Moushumi Aktar', false, true, NOW() - INTERVAL '89 days'),
            ('d4444444-4444-4444-4444-444444444444'::uuid, 'iqbal.hasan@email.com', '$2a$10$hash', '+8801666666666', 'Iqbal Hasan', false, true, NOW() - INTERVAL '84 days'),
            ('d5555555-5555-5555-5555-555555555555'::uuid, 'sathi.nasrin@email.com', '$2a$10$hash', '+8801677777777', 'Sathi Nasrin', false, false, NOW() - INTERVAL '80 days'),
            ('d6666666-6666-6666-6666-666666666666'::uuid, 'masud.rana@email.com', '$2a$10$hash', '+8801688888888', 'Masud Rana', false, true, NOW() - INTERVAL '76 days'),
            ('d7777777-7777-7777-7777-777777777777'::uuid, 'tania.akhter@email.com', '$2a$10$hash', '+8801699999999', 'Tania Akhter', false, true, NOW() - INTERVAL '71 days'),
            ('d8888888-8888-8888-8888-888888888888'::uuid, 'kabir.hossain@email.com', '$2a$10$hash', '+8801511111111', 'Kabir Hossain', false, true, NOW() - INTERVAL '67 days'),
            ('d9999999-9999-9999-9999-999999999999'::uuid, 'rumi.akhtar@email.com', '$2a$10$hash', '+8801522222222', 'Rumi Akhtar', false, true, NOW() - INTERVAL '62 days'),
            ('e0000000-0000-0000-0000-000000000000'::uuid, 'shuvo.ahmed@email.com', '$2a$10$hash', '+8801533333333', 'Shuvo Ahmed', false, false, NOW() - INTERVAL '57 days'),
            ('e1111111-1111-1111-1111-111111111111'::uuid, 'mim.rahman@email.com', '$2a$10$hash', '+8801544444444', 'Mim Rahman', false, true, NOW() - INTERVAL '53 days'),
            ('e2222222-2222-2222-2222-222222222222'::uuid, 'tanvir.islam@email.com', '$2a$10$hash', '+8801555555555', 'Tanvir Islam', false, true, NOW() - INTERVAL '47 days'),
            ('e3333333-3333-3333-3333-333333333333'::uuid, 'purnima.akter@email.com', '$2a$10$hash', '+8801566666666', 'Purnima Akter', false, true, NOW() - INTERVAL '44 days'),
            ('e4444444-4444-4444-4444-444444444444'::uuid, 'riad.mahmud@email.com', '$2a$10$hash', '+8801577777777', 'Riad Mahmud', false, true, NOW() - INTERVAL '41 days'),
            ('e5555555-5555-5555-5555-555555555555'::uuid, 'nabila.haque@email.com', '$2a$10$hash', '+8801588888888', 'Nabila Haque', false, false, NOW() - INTERVAL '38 days'),
            ('e6666666-6666-6666-6666-666666666666'::uuid, 'fahim.ahmed@email.com', '$2a$10$hash', '+8801599999999', 'Fahim Ahmed', false, true, NOW() - INTERVAL '35 days'),
            ('e7777777-7777-7777-7777-777777777777'::uuid, 'trisha.islam@email.com', '$2a$10$hash', '+8801411111111', 'Trisha Islam', false, true, NOW() - INTERVAL '32 days'),
            ('e8888888-8888-8888-8888-888888888888'::uuid, 'arifin.shuvo@email.com', '$2a$10$hash', '+8801422222222', 'Arifin Shuvo', false, true, NOW() - INTERVAL '28 days'),
            ('e9999999-9999-9999-9999-999999999999'::uuid, 'porimoni.akter@email.com', '$2a$10$hash', '+8801433333333', 'Porimoni Akter', false, true, NOW() - INTERVAL '25 days')
        ) AS t(id, email, password_hash, phone, full_name, is_admin, kyc_verified, created_at)
    LOOP
        BEGIN
            INSERT INTO public.users (id, email, password_hash, phone, full_name, is_admin, kyc_verified, created_at)
            VALUES (user_record.id, user_record.email, user_record.password_hash, user_record.phone, user_record.full_name, user_record.is_admin, user_record.kyc_verified, user_record.created_at)
            ON CONFLICT (id) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                phone = EXCLUDED.phone,
                kyc_verified = EXCLUDED.kyc_verified,
                updated_at = NOW();
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error inserting user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    -- Re-enable triggers
    ALTER TABLE public.users ENABLE TRIGGER ALL;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT safe_insert_mock_users();

-- Drop the function after use
DROP FUNCTION IF EXISTS safe_insert_mock_users();

-- ===================================
-- STEP 2: Update wallets with realistic balances
-- ===================================

UPDATE public.wallets SET balance = 50000, locked_balance = 5000 WHERE user_id = 'a1111111-1111-1111-1111-111111111111';
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
-- STEP 3: Insert resolved markets
-- ===================================

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
-- STEP 4: Create positions with P&L
-- ===================================

INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl, created_at, updated_at) VALUES
    -- Top performers
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
    ('a3333333-3333-3333-3333-333333333333', 'm6666666-6666-6666-6666-666666666666', 'YES', 1100, 0.44, 616.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '10 days'),
    ('a5555555-5555-5555-5555-555555555555', 'm1111111-1111-1111-1111-111111111111', 'YES', 1500, 0.50, 750.00, NOW() - INTERVAL '85 days', NOW() - INTERVAL '45 days'),
    ('a5555555-5555-5555-5555-555555555555', 'm6666666-6666-6666-6666-666666666666', 'YES', 1300, 0.40, 780.00, NOW() - INTERVAL '80 days', NOW() - INTERVAL '10 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 'YES', 2000, 0.48, 1040.00, NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm3333333-3333-3333-3333-333333333333', 'YES', 1500, 0.46, 810.00, NOW() - INTERVAL '87 days', NOW() - INTERVAL '60 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm5555555-5555-5555-5555-555555555555', 'NO', 3000, 0.32, 1050.00, NOW() - INTERVAL '52 days', NOW() - INTERVAL '15 days'),
    ('b1111111-1111-1111-1111-111111111111', 'm7777777-7777-7777-7777-777777777777', 'YES', 1800, 0.43, 1026.00, NOW() - INTERVAL '68 days', NOW() - INTERVAL '12 days'),
    ('b4444444-4444-4444-4444-444444444444', 'm2222222-2222-2222-2222-222222222222', 'YES', 900, 0.58, 378.00, NOW() - INTERVAL '73 days', NOW() - INTERVAL '30 days'),
    ('b4444444-4444-4444-4444-444444444444', 'm4444444-4444-4444-4444-444444444444', 'NO', 1200, 0.52, 624.00, NOW() - INTERVAL '98 days', NOW() - INTERVAL '90 days'),
    ('b4444444-4444-4444-4444-444444444444', 'm6666666-6666-6666-6666-666666666666', 'YES', 1000, 0.41, 590.00, NOW() - INTERVAL '77 days', NOW() - INTERVAL '10 days'),
    ('c2222222-2222-2222-2222-222222222222', 'm2222222-2222-2222-2222-222222222222', 'YES', 1500, 0.55, 675.00, NOW() - INTERVAL '74 days', NOW() - INTERVAL '30 days'),
    ('c2222222-2222-2222-2222-222222222222', 'm6666666-6666-6666-6666-666666666666', 'YES', 1200, 0.39, 732.00, NOW() - INTERVAL '76 days', NOW() - INTERVAL '10 days'),
    ('c6666666-6666-6666-6666-666666666666', 'm1111111-1111-1111-1111-111111111111', 'YES', 900, 0.51, 441.00, NOW() - INTERVAL '86 days', NOW() - INTERVAL '45 days'),
    ('c6666666-6666-6666-6666-666666666666', 'm6666666-6666-6666-6666-666666666666', 'YES', 1100, 0.40, 660.00, NOW() - INTERVAL '78 days', NOW() - INTERVAL '10 days'),
    ('c8888888-8888-8888-8888-888888888888', 'm2222222-2222-2222-2222-222222222222', 'YES', 1300, 0.57, 559.00, NOW() - INTERVAL '71 days', NOW() - INTERVAL '30 days'),
    ('c8888888-8888-8888-8888-888888888888', 'm5555555-5555-5555-5555-555555555555', 'NO', 1500, 0.36, 525.00, NOW() - INTERVAL '53 days', NOW() - INTERVAL '15 days'),
    ('d2222222-2222-2222-2222-222222222222', 'm1111111-1111-1111-1111-111111111111', 'YES', 1100, 0.49, 561.00, NOW() - INTERVAL '88 days', NOW() - INTERVAL '45 days'),
    ('d2222222-2222-2222-2222-222222222222', 'm6666666-6666-6666-6666-666666666666', 'YES', 900, 0.43, 513.00, NOW() - INTERVAL '74 days', NOW() - INTERVAL '10 days'),
    ('m4444444-4444-4444-4444-444444444444', 'NO', 0.54, 600, 'd4444444-4444-4444-4444-444444444444', 'e0000000-0000-0000-0000-000000000000', NOW() - INTERVAL '95 days'),
    ('d4444444-4444-4444-4444-444444444444', 'm5555555-5555-5555-5555-555555555555', 'NO', 2500, 0.33, 875.00, NOW() - INTERVAL '51 days', NOW() - INTERVAL '15 days'),
    ('d4444444-4444-4444-4444-444444444444', 'm7777777-7777-7777-7777-777777777777', 'YES', 1600, 0.42, 928.00, NOW() - INTERVAL '67 days', NOW() - INTERVAL '12 days')
ON CONFLICT (market_id, user_id, outcome) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    average_price = EXCLUDED.average_price,
    realized_pnl = EXCLUDED.realized_pnl,
    updated_at = NOW();

-- ===================================
-- STEP 5: Create trades for volume
-- ===================================

INSERT INTO public.trades (market_id, outcome, price, quantity, buyer_id, seller_id, created_at) VALUES
    ('m1111111-1111-1111-1111-111111111111', 'YES', 0.52, 1000, 'a1111111-1111-1111-1111-111111111111', 'b0000000-0000-0000-0000-000000000000', NOW() - INTERVAL '80 days'),
    ('m2222222-2222-2222-2222-222222222222', 'YES', 0.65, 800, 'a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '70 days'),
    ('m3333333-3333-3333-3333-333333333333', 'YES', 0.48, 1200, 'a1111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000000', NOW() - INTERVAL '85 days'),
    ('m1111111-1111-1111-1111-111111111111', 'YES', 0.48, 2000, 'b1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '90 days'),
    ('m3333333-3333-3333-3333-333333333333', 'YES', 0.46, 1500, 'b1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '87 days'),
    ('m5555555-5555-5555-5555-555555555555', 'NO', 0.32, 3000, 'b1111111-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444', NOW() - INTERVAL '52 days'),
    ('m7777777-7777-7777-7777-777777777777', 'YES', 0.43, 1800, 'b1111111-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555', NOW() - INTERVAL '68 days'),
    ('m2222222-2222-2222-2222-222222222222', 'YES', 0.55, 1500, 'c2222222-2222-2222-2222-222222222222', 'a6666666-6666-6666-6666-666666666666', NOW() - INTERVAL '74 days'),
    ('m6666666-6666-6666-6666-666666666666', 'YES', 0.39, 1200, 'c2222222-2222-2222-2222-222222222222', 'a7777777-7777-7777-7777-777777777777', NOW() - INTERVAL '76 days'),
    ('d4444444-4444-4444-4444-444444444444', 'm3333333-3333-3333-3333-333333333333', 'YES', 1400, 0.45, 770.00, NOW() - INTERVAL '91 days', NOW() - INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- ===================================
-- STEP 6: Populate leaderboard cache
-- ===================================

INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, current_streak, best_streak, period_start, period_end, updated_at)
SELECT 
    u.id,
    'all_time',
    COALESCE((SELECT SUM(quantity * average_price)::bigint * 100 FROM public.positions WHERE user_id = u.id), 0),
    COALESCE((SELECT SUM(realized_pnl)::bigint * 100 FROM public.positions WHERE user_id = u.id), 0),
    COALESCE((SELECT SUM(realized_pnl)::bigint * 100 FROM public.positions WHERE user_id = u.id), 0),
    CASE 
        WHEN u.id IN ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'd4444444-4444-4444-4444-444444444444') THEN 85.50
        WHEN u.id IN ('a2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333') THEN 65.25
        ELSE 25.0 + (random() * 30)
    END,
    CASE WHEN u.id IN ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111') THEN 7 ELSE floor(random() * 5)::int END,
    CASE WHEN u.id IN ('a1111111-1111-1111-1111-111111111111') THEN 12 ELSE floor(random() * 8)::int END,
    CURRENT_DATE - INTERVAL '365 days',
    CURRENT_DATE,
    NOW()
FROM public.users u
WHERE u.id LIKE 'a%' OR u.id LIKE 'b%' OR u.id LIKE 'c%' OR u.id LIKE 'd%' OR u.id LIKE 'e%'
ON CONFLICT (user_id, timeframe) DO UPDATE SET
    trading_volume = EXCLUDED.trading_volume,
    realized_pnl = EXCLUDED.realized_pnl,
    score = EXCLUDED.score,
    roi = EXCLUDED.roi,
    updated_at = NOW();

-- Insert weekly entries
INSERT INTO public.leaderboard_cache (user_id, timeframe, trading_volume, realized_pnl, score, roi, period_start, period_end, updated_at)
SELECT user_id, 'weekly', trading_volume/4, realized_pnl/4, score/4, roi*0.9, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE, NOW()
FROM public.leaderboard_cache WHERE timeframe = 'all_time'
ON CONFLICT (user_id, timeframe) DO UPDATE SET
    trading_volume = EXCLUDED.trading_volume,
    realized_pnl = EXCLUDED.realized_pnl,
    score = EXCLUDED.score,
    updated_at = NOW();

-- ===================================
-- STEP 7: Assign leagues
-- ===================================

INSERT INTO public.user_leagues (user_id, league_id, current_points, last_updated_at)
SELECT 
    u.id,
    CASE 
        WHEN u.id IN ('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111') THEN 5
        WHEN u.id IN ('a2222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444') THEN 4
        WHEN u.id IN ('a3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222') THEN 3
        WHEN u.id IN ('b4444444-4444-4444-4444-444444444444', 'c6666666-6666-6666-6666-666666666666') THEN 2
        ELSE 1
    END,
    500 + (random() * 2000),
    NOW()
FROM public.users u
WHERE u.id LIKE 'a%' OR u.id LIKE 'b%' OR u.id LIKE 'c%' OR u.id LIKE 'd%' OR u.id LIKE 'e%'
ON CONFLICT (user_id) DO UPDATE SET
    league_id = EXCLUDED.league_id,
    current_points = EXCLUDED.current_points;

-- ===================================
-- STEP 8: Assign badges
-- ===================================

INSERT INTO public.user_badges (user_id, badge_id, awarded_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '89 days'),
    ('a1111111-1111-1111-1111-111111111111', 'whale', NOW() - INTERVAL '30 days'),
    ('a1111111-1111-1111-1111-111111111111', 'sniper', NOW() - INTERVAL '15 days'),
    ('b1111111-1111-1111-1111-111111111111', 'first_trade', NOW() - INTERVAL '87 days'),
    ('b1111111-1111-1111-1111-111111111111', 'whale', NOW() - INTERVAL '25 days'),
    ('d4444444-4444-4444-4444-444444444444', 'first_trade', NOW() - INTERVAL '84 days'),
    ('d4444444-4444-4444-4444-444444444444', 'getting_serious', NOW() - INTERVAL '50 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- Assign first_trade to remaining users
INSERT INTO public.user_badges (user_id, badge_id, awarded_at)
SELECT u.id, 'first_trade', u.created_at + INTERVAL '1 day'
FROM public.users u
WHERE u.id NOT IN (SELECT user_id FROM public.user_badges)
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ===================================
-- VERIFICATION
-- ===================================

SELECT 
    'Users' as metric, COUNT(*) as count FROM users WHERE id LIKE 'a%' OR id LIKE 'b%' OR id LIKE 'c%' OR id LIKE 'd%' OR id LIKE 'e%'
UNION ALL
SELECT 'Positions', COUNT(*) FROM positions WHERE user_id LIKE 'a%' OR user_id LIKE 'b%' OR user_id LIKE 'c%' OR user_id LIKE 'd%' OR user_id LIKE 'e%'
UNION ALL
SELECT 'Leaderboard Entries', COUNT(*) FROM leaderboard_cache
UNION ALL
SELECT 'League Assignments', COUNT(*) FROM user_leagues
UNION ALL
SELECT 'Badges Awarded', COUNT(*) FROM user_badges;
