-- ============================================================
-- PLOKYMARKET DATABASE SCHEMA - SUPABASE AUTH INTEGRATED
-- Production-ready for Supabase hosted PostgreSQL
-- ============================================================

-- ===================================
-- PART 1: EXTENSIONS
-- ===================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- PART 2: ENUMS
-- ===================================
DO $$ BEGIN
    CREATE TYPE market_status AS ENUM ('active', 'closed', 'resolved', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE outcome_type AS ENUM ('YES', 'NO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('limit', 'market');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_side AS ENUM ('buy', 'sell');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('open', 'partially_filled', 'filled', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'settlement', 'refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE oracle_status AS ENUM ('pending', 'verified', 'disputed', 'finalized');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('bkash', 'nagad', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===================================
-- PART 3: TABLES (Supabase Auth Integrated)
-- ===================================

-- Users table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) DEFAULT 0 CHECK (balance >= 0),
    locked_balance NUMERIC(12, 2) DEFAULT 0 CHECK (locked_balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Markets table
CREATE TABLE IF NOT EXISTS public.markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    source_url TEXT,
    image_url TEXT,
    creator_id UUID REFERENCES public.users(id),
    status market_status DEFAULT 'active',
    resolution_source TEXT,
    min_price NUMERIC(5, 4) DEFAULT 0.0001 CHECK (min_price > 0),
    max_price NUMERIC(5, 4) DEFAULT 0.9999 CHECK (max_price < 1),
    tick_size NUMERIC(5, 4) DEFAULT 0.01,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    trading_closes_at TIMESTAMPTZ NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    winning_outcome outcome_type,
    resolution_details JSONB DEFAULT '{}',
    total_volume NUMERIC(12, 2) DEFAULT 0,
    yes_shares_outstanding BIGINT DEFAULT 0,
    no_shares_outstanding BIGINT DEFAULT 0
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_type order_type NOT NULL,
    side order_side NOT NULL,
    outcome outcome_type NOT NULL,
    price NUMERIC(5, 4) NOT NULL CHECK (price > 0 AND price < 1),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    filled_quantity BIGINT DEFAULT 0,
    status order_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    buy_order_id UUID REFERENCES public.orders(id),
    sell_order_id UUID REFERENCES public.orders(id),
    outcome outcome_type NOT NULL,
    price NUMERIC(5, 4) NOT NULL,
    quantity BIGINT NOT NULL,
    buyer_id UUID REFERENCES public.users(id),
    seller_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    outcome outcome_type NOT NULL,
    quantity BIGINT DEFAULT 0 CHECK (quantity >= 0),
    average_price NUMERIC(5, 4),
    realized_pnl NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(market_id, user_id, outcome)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    trade_id UUID REFERENCES public.trades(id),
    market_id UUID REFERENCES public.markets(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oracle Verifications table
CREATE TABLE IF NOT EXISTS public.oracle_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    ai_result outcome_type,
    ai_confidence NUMERIC(3, 2),
    ai_reasoning TEXT,
    scraped_data JSONB DEFAULT '{}',
    admin_id UUID REFERENCES public.users(id),
    admin_decision outcome_type,
    admin_notes TEXT,
    status oracle_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ
);

-- Payment Transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    method payment_method NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status payment_status DEFAULT 'pending',
    transaction_id TEXT UNIQUE,
    sender_number TEXT,
    receiver_number TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ===================================
-- PART 4: INDEXES
-- ===================================
CREATE INDEX IF NOT EXISTS idx_orders_matching ON public.orders(market_id, outcome, side, status, price, created_at)
    WHERE status IN ('open', 'partially_filled');
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_market_user ON public.orders(market_id, user_id);
CREATE INDEX IF NOT EXISTS idx_trades_market ON public.trades(market_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_created ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_user_market ON public.positions(user_id, market_id);
CREATE INDEX IF NOT EXISTS idx_markets_status ON public.markets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_category ON public.markets(category);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ===================================
-- PART 5: UTILITY FUNCTIONS
-- ===================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON public.positions;
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Handle new user from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.wallets (user_id, balance, locked_balance)
    VALUES (NEW.id, 1000, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Calculate current YES/NO prices from order book
CREATE OR REPLACE FUNCTION get_market_prices(p_market_id UUID)
RETURNS TABLE(yes_price NUMERIC, no_price NUMERIC, yes_volume BIGINT, no_volume BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH yes_orders AS (
        SELECT 
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_yes_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_yes_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as yes_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id 
            AND outcome = 'YES'
            AND status IN ('open', 'partially_filled')
    ),
    no_orders AS (
        SELECT 
            COALESCE(MAX(CASE WHEN side = 'buy' THEN price END), 0) as best_no_bid,
            COALESCE(MIN(CASE WHEN side = 'sell' THEN price END), 1) as best_no_ask,
            COALESCE(SUM(CASE WHEN side = 'buy' THEN quantity - filled_quantity ELSE 0 END), 0) as no_buy_volume,
            COALESCE(SUM(CASE WHEN side = 'sell' THEN quantity - filled_quantity ELSE 0 END), 0) as no_sell_volume
        FROM public.orders
        WHERE market_id = p_market_id 
            AND outcome = 'NO'
            AND status IN ('open', 'partially_filled')
    )
    SELECT 
        CASE 
            WHEN y.best_yes_ask > 0 THEN LEAST(y.best_yes_ask, 1 - COALESCE(n.best_no_bid, 0))
            ELSE 0.5
        END as yes_price,
        CASE 
            WHEN n.best_no_ask > 0 THEN LEAST(n.best_no_ask, 1 - COALESCE(y.best_yes_bid, 0))
            ELSE 0.5
        END as no_price,
        COALESCE(y.yes_buy_volume, 0) + COALESCE(y.yes_sell_volume, 0) as yes_volume,
        COALESCE(n.no_buy_volume, 0) + COALESCE(n.no_sell_volume, 0) as no_volume
    FROM yes_orders y, no_orders n;
END;
$$ LANGUAGE plpgsql;

-- Get order book for a market
CREATE OR REPLACE FUNCTION get_orderbook(
    p_market_id UUID, 
    p_outcome outcome_type,
    p_side order_side
)
RETURNS TABLE(price NUMERIC, quantity BIGINT, total BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.price,
        SUM(o.quantity - o.filled_quantity)::BIGINT as quantity,
        SUM((o.quantity - o.filled_quantity) * o.price)::BIGINT as total
    FROM public.orders o
    WHERE o.market_id = p_market_id
        AND o.outcome = p_outcome
        AND o.side = p_side
        AND o.status IN ('open', 'partially_filled')
    GROUP BY o.price
    ORDER BY 
        CASE WHEN p_side = 'buy' THEN o.price END DESC,
        CASE WHEN p_side = 'sell' THEN o.price END ASC;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- PART 6: MATCHING ENGINE
-- ===================================

-- Match Order Function
CREATE OR REPLACE FUNCTION match_order(p_order_id UUID)
RETURNS TABLE(matched BOOLEAN, trades_created INT, remaining_quantity BIGINT) AS $$
DECLARE
    v_order RECORD;
    v_match RECORD;
    v_trade_quantity BIGINT;
    v_trade_price NUMERIC(5, 4);
    v_trades_count INT := 0;
    v_remaining BIGINT;
BEGIN
    -- Lock and get the order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;
    
    IF NOT FOUND OR v_order.status NOT IN ('open', 'partially_filled') THEN
        RETURN QUERY SELECT FALSE, 0, 0::BIGINT;
        RETURN;
    END IF;
    
    v_remaining := v_order.quantity - v_order.filled_quantity;
    
    WHILE v_remaining > 0 LOOP
        IF v_order.side = 'buy' THEN
            SELECT * INTO v_match
            FROM public.orders
            WHERE market_id = v_order.market_id
              AND status IN ('open', 'partially_filled')
              AND id != v_order.id
              AND (
                  (side = 'sell' AND outcome = v_order.outcome AND price <= v_order.price)
                  OR
                  (side = 'buy' 
                   AND outcome != v_order.outcome 
                   AND (price + v_order.price) <= 1.00)
              )
            ORDER BY 
              CASE 
                WHEN side = 'sell' THEN price
                ELSE (1.00 - price)
              END ASC,
              created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;
        ELSE
            SELECT * INTO v_match
            FROM public.orders
            WHERE market_id = v_order.market_id
              AND status IN ('open', 'partially_filled')
              AND id != v_order.id
              AND side = 'buy'
              AND outcome = v_order.outcome
              AND price >= v_order.price
            ORDER BY price DESC, created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED;
        END IF;
        
        EXIT WHEN NOT FOUND;
        
        v_trade_quantity := LEAST(v_remaining, v_match.quantity - v_match.filled_quantity);
        
        IF v_order.created_at < v_match.created_at THEN
            v_trade_price := v_order.price;
        ELSE
            v_trade_price := v_match.price;
        END IF;
        
        -- Create trade
        INSERT INTO public.trades (
            market_id, buy_order_id, sell_order_id, outcome,
            price, quantity, buyer_id, seller_id
        ) VALUES (
            v_order.market_id,
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_order.outcome,
            v_trade_price,
            v_trade_quantity,
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END
        );
        
        -- Update orders
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END
        WHERE id = v_order.id;
        
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END
        WHERE id = v_match.id;
        
        -- Update positions
        PERFORM update_position(
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, v_order.outcome, v_trade_quantity, v_trade_price
        );
        
        PERFORM update_position(
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, v_order.outcome, -v_trade_quantity, v_trade_price
        );
        
        -- Process settlement
        PERFORM process_trade_settlement(
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_trade_quantity, v_trade_price
        );
        
        v_remaining := v_remaining - v_trade_quantity;
        v_trades_count := v_trades_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_trades_count > 0, v_trades_count, v_remaining;
END;
$$ LANGUAGE plpgsql;

-- Position update helper
CREATE OR REPLACE FUNCTION update_position(
    p_user_id UUID, p_market_id UUID, p_outcome outcome_type,
    p_quantity_delta BIGINT, p_price NUMERIC(5, 4)
) RETURNS VOID AS $$
DECLARE
    v_position RECORD;
BEGIN
    SELECT * INTO v_position
    FROM public.positions
    WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome
    FOR UPDATE;
    
    IF NOT FOUND THEN
        INSERT INTO public.positions (user_id, market_id, outcome, quantity, average_price)
        VALUES (p_user_id, p_market_id, p_outcome, p_quantity_delta, p_price);
    ELSE
        UPDATE public.positions SET 
            quantity = quantity + p_quantity_delta,
            average_price = CASE 
                WHEN p_quantity_delta > 0 THEN
                    (average_price * quantity + p_price * p_quantity_delta) / (quantity + p_quantity_delta)
                ELSE average_price
            END
        WHERE user_id = p_user_id AND market_id = p_market_id AND outcome = p_outcome;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trade settlement
CREATE OR REPLACE FUNCTION process_trade_settlement(
    p_buy_order_id UUID, p_sell_order_id UUID,
    p_quantity BIGINT, p_price NUMERIC(5, 4)
) RETURNS VOID AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_total_cost NUMERIC(12, 2);
BEGIN
    SELECT user_id INTO v_buyer_id FROM public.orders WHERE id = p_buy_order_id;
    SELECT user_id INTO v_seller_id FROM public.orders WHERE id = p_sell_order_id;
    
    v_total_cost := p_quantity * p_price;
    
    -- Update buyer wallet
    UPDATE public.wallets SET 
        balance = balance - v_total_cost
    WHERE user_id = v_buyer_id;
    
    -- Update seller wallet
    UPDATE public.wallets SET 
        balance = balance + v_total_cost
    WHERE user_id = v_seller_id;
    
    -- Log transactions
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, order_id)
    SELECT user_id, 'trade_buy'::transaction_type, -v_total_cost, 
           balance + v_total_cost, balance, p_buy_order_id
    FROM public.wallets WHERE user_id = v_buyer_id;
    
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, order_id)
    SELECT user_id, 'trade_sell'::transaction_type, v_total_cost, 
           balance - v_total_cost, balance, p_sell_order_id
    FROM public.wallets WHERE user_id = v_seller_id;
END;
$$ LANGUAGE plpgsql;

-- Market settlement
CREATE OR REPLACE FUNCTION settle_market(p_market_id UUID, p_winning_outcome outcome_type)
RETURNS TABLE(users_settled INT, total_payout NUMERIC(12, 2)) AS $$
DECLARE
    v_position RECORD;
    v_payout NUMERIC(12, 2);
    v_count INT := 0;
    v_total NUMERIC(12, 2) := 0;
BEGIN
    UPDATE public.markets SET 
        status = 'resolved'::market_status,
        winning_outcome = p_winning_outcome,
        resolved_at = NOW()
    WHERE id = p_market_id;
    
    FOR v_position IN
        SELECT user_id, outcome, quantity
        FROM public.positions
        WHERE market_id = p_market_id AND quantity > 0
    LOOP
        IF v_position.outcome = p_winning_outcome THEN
            v_payout := v_position.quantity * 1.00;
            
            UPDATE public.wallets SET balance = balance + v_payout
            WHERE user_id = v_position.user_id;
            
            INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, market_id)
            SELECT user_id, 'settlement'::transaction_type, v_payout,
                   balance - v_payout, balance, p_market_id
            FROM public.wallets WHERE user_id = v_position.user_id;
            
            v_total := v_total + v_payout;
        END IF;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_count, v_total;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- PART 7: ROW LEVEL SECURITY (RLS)
-- ===================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_verifications ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT
    USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own data" ON public.users;  
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Wallets policies
DROP POLICY IF EXISTS "Users can read own wallet" ON public.wallets;
CREATE POLICY "Users can read own wallet" ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT
    USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can cancel own orders" ON public.orders;
CREATE POLICY "Users can cancel own orders" ON public.orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Positions policies
DROP POLICY IF EXISTS "Users can view own positions" ON public.positions;
CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT
    USING (auth.uid() = user_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Markets policies (public read, admin write)
DROP POLICY IF EXISTS "Anyone can read markets" ON public.markets;
CREATE POLICY "Anyone can read markets" ON public.markets FOR SELECT
    USING (true);
DROP POLICY IF EXISTS "Admins can manage markets" ON public.markets;   
CREATE POLICY "Admins can manage markets" ON public.markets FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Trades policies (public read)
DROP POLICY IF EXISTS "Anyone can read trades" ON public.trades;
CREATE POLICY "Anyone can read trades" ON public.trades FOR SELECT
    USING (true);

-- Payment transactions policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_transactions;
CREATE POLICY "Users can view own payments" ON public.payment_transactions FOR SELECT
    USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create payments" ON public.payment_transactions;
CREATE POLICY "Users can create payments" ON public.payment_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Oracle verifications policies
DROP POLICY IF EXISTS "Admins can manage oracle" ON public.oracle_verifications;
CREATE POLICY "Admins can manage oracle" ON public.oracle_verifications FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- ===================================
-- PART 8: SAMPLE DATA FOR PRODUCTION
-- ===================================

-- Insert sample markets
INSERT INTO public.markets (question, description, category, trading_closes_at, event_date, image_url)
VALUES 
    ('Will Bitcoin exceed $100,000 by end of 2026?', 'Prediction market for Bitcoin price reaching $100,000 USD before December 31, 2026', 'Crypto', NOW() + INTERVAL '180 days', NOW() + INTERVAL '365 days', 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400'),
    ('Will India win the 2026 T20 World Cup?', 'Cricket T20 World Cup winner prediction for 2026 tournament', 'Sports', NOW() + INTERVAL '60 days', NOW() + INTERVAL '90 days', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400'),
    ('Will AI pass the Turing test by 2027?', 'Prediction on AI capability to convincingly pass the Turing test', 'Technology', NOW() + INTERVAL '180 days', NOW() + INTERVAL '365 days', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400'),
    ('Will SpaceX land humans on Mars by 2030?', 'Manned Mars mission prediction for SpaceX', 'Space', NOW() + INTERVAL '365 days', NOW() + INTERVAL '730 days', 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400'),
    ('Will electric vehicles exceed 50% of new car sales by 2028?', 'EV market adoption prediction', 'Automotive', NOW() + INTERVAL '180 days', NOW() + INTERVAL '365 days', 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400')
ON CONFLICT DO NOTHING;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION match_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_market_prices(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_orderbook(UUID, outcome_type, order_side) TO authenticated, anon;
