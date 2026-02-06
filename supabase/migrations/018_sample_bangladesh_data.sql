-- 018_sample_bangladesh_data.sql
-- Seed Bangladeshi-relevant markets and simulated user history

DO $$
DECLARE
    v_user_id UUID;
    v_market_id UUID;
    v_hist_market_id UUID;
BEGIN
    -- 1. Get the first user for seeding (Generic approach for demo)
    SELECT id INTO v_user_id FROM public.users LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No users found for seeding history.';
    ELSE
        -- 2. Insert Bangladeshi Markets
        
        -- Politics
        INSERT INTO public.markets (question, description, category, trading_closes_at, event_date, image_url)
        VALUES (
            'Will Bangladesh hold National Elections by January 2027?',
            'Prediction on the timing of the next general election in Bangladesh.',
            'Politics',
            '2026-12-31 23:59:59+00',
            '2027-01-31 23:59:59+00',
            'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400'
        ) RETURNING id INTO v_market_id;

        -- Infrastructure
        INSERT INTO public.markets (question, description, category, trading_closes_at, event_date, image_url)
        VALUES (
            'Will the Matarbari Deep Sea Port handle 1M+ TEUs by end of 2026?',
            'Performance prediction for the new deep-sea port in Maheshkhali.',
            'Economy',
            '2026-12-15 23:59:59+00',
            '2026-12-31 23:59:59+00',
            'https://images.unsplash.com/photo-1520641328082-9076dc77cd39?w=400'
        );

        -- Sports (Cricket)
        INSERT INTO public.markets (question, description, category, trading_closes_at, event_date, image_url)
        VALUES (
            'Will Bangladesh win the 2026 T20 World Cup Group Stage?',
            'Prediction on the Tigers performance in the group stage.',
            'Sports',
            '2026-06-01 23:59:59+00',
            '2026-06-15 23:59:59+00',
            'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'
        );

        -- Economy (Exchange Rate)
        INSERT INTO public.markets (question, description, category, trading_closes_at, event_date, image_url)
        VALUES (
            'Will USD/BDT exchange rate exceed 130 by June 2026?',
            'Forex market prediction for the Bangladeshi Taka.',
            'Economy',
            '2026-05-31 23:59:59+00',
            '2026-06-30 23:59:59+00',
            'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400'
        );

        -- 3. Seed Realistic Historical Winning Data
        -- Insert a resolved market "Will Padma Bridge 2nd phase complete by 2025?" (Resolved YES)
        INSERT INTO public.markets (question, description, category, status, winning_outcome, trading_closes_at, event_date, resolved_at)
        VALUES (
            'Will Bangladesh reach $50B in exports by 2025?',
            'Historical prediction for export milestones.',
            'Economy',
            'resolved',
            'YES',
            '2025-12-31 00:00:00+00',
            '2025-12-31 00:00:00+00',
            NOW() - INTERVAL '1 month'
        ) RETURNING id INTO v_hist_market_id;

        -- Create a "Winning" position for the user
        INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price, realized_pnl)
        VALUES (v_user_id, v_hist_market_id, 'YES', 500, 0.45, 275.00) -- Cost = 500*0.45=225, Payout=500, PnL=275
        ON CONFLICT DO NOTHING;

        -- Insert Transactions (simulate cleared payments)
        INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, market_id)
        VALUES 
            (v_user_id, 'deposit', 5000.00, 0, 5000.00, NULL),
            (v_user_id, 'settlement', 500.00, 5000.00, 5500.00, v_hist_market_id);

        -- Update Wallet
        UPDATE public.wallets 
        SET balance = 5500.00, locked_balance = 0
        WHERE user_id = v_user_id;

        -- 4. Activity Feed
        INSERT INTO public.activities (user_id, type, data)
        VALUES 
            (v_user_id, 'USER_JOIN', '{"message": "Welcome to Plokymarket!"}'),
            (v_user_id, 'MARKET_RESOLVE', jsonb_build_object('marketId', v_hist_market_id, 'outcome', 'YES', 'message', 'You won 500 BDT in Export Milestone market!'));

    END IF;
END $$;
