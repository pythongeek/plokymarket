-- ============================================================
-- PLOKYMARKET DATABASE SCHEMA
-- Complete isolated database for Polymarket-style prediction marketplace
-- This database is standalone (without Supabase Auth)
-- ============================================================

-- ===================================
-- PART 1: EXTENSIONS
-- ===================================
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
-- PART 3: TABLES
-- ===================================

-- Users table (standalone - not linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
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
    no_shares_outstanding BIGINT DEFAULT 0,
    CONSTRAINT plokymarket_valid_dates CHECK (event_date > trading_closes_at)
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
    filled_quantity BIGINT DEFAULT 0 CHECK (filled_quantity <= quantity),
    status order_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT plokymarket_valid_fill CHECK (filled_quantity <= quantity)
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

CREATE INDEX IF NOT EXISTS plokymarket_idx_orders_matching ON public.orders(market_id, outcome, side, status, price, created_at)
    WHERE status IN ('open', 'partially_filled');

CREATE INDEX IF NOT EXISTS plokymarket_idx_orders_user ON public.orders(user_id, status);

CREATE INDEX IF NOT EXISTS plokymarket_idx_orders_market_user ON public.orders(market_id, user_id);

CREATE INDEX IF NOT EXISTS plokymarket_idx_trades_market ON public.trades(market_id, created_at DESC);

CREATE INDEX IF NOT EXISTS plokymarket_idx_trades_created ON public.trades(created_at DESC);

CREATE INDEX IF NOT EXISTS plokymarket_idx_transactions_user ON public.transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS plokymarket_idx_positions_user_market ON public.positions(user_id, market_id);

CREATE INDEX IF NOT EXISTS plokymarket_idx_markets_status ON public.markets(status, created_at DESC);

CREATE INDEX IF NOT EXISTS plokymarket_idx_markets_category ON public.markets(category);

CREATE INDEX IF NOT EXISTS plokymarket_idx_wallets_user ON public.wallets(user_id);

CREATE INDEX IF NOT EXISTS plokymarket_idx_users_email ON public.users(email);

-- ===================================
-- PART 5: FUNCTIONS
-- ===================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION plokymarket_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS plokymarket_update_users_updated_at ON public.users;
CREATE TRIGGER plokymarket_update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

DROP TRIGGER IF EXISTS plokymarket_update_wallets_updated_at ON public.wallets;
CREATE TRIGGER plokymarket_update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

DROP TRIGGER IF EXISTS plokymarket_update_orders_updated_at ON public.orders;
CREATE TRIGGER plokymarket_update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

DROP TRIGGER IF EXISTS plokymarket_update_positions_updated_at ON public.positions;
CREATE TRIGGER plokymarket_update_positions_updated_at BEFORE UPDATE ON public.positions
    FOR EACH ROW EXECUTE FUNCTION plokymarket_update_updated_at();

-- Auto-create wallet when user is created
CREATE OR REPLACE FUNCTION plokymarket_create_wallet_on_user()
RETURNS TRIGGER AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- Check if wallet already exists
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = NEW.id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO public.wallets (user_id, balance, locked_balance)
        VALUES (NEW.id, 0, 0);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plokymarket_wallet_on_user ON public.users;
CREATE TRIGGER plokymarket_wallet_on_user AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION plokymarket_create_wallet_on_user();

-- Calculate current YES/NO prices from order book
CREATE OR REPLACE FUNCTION plokymarket_get_market_prices(p_market_id UUID)
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
CREATE OR REPLACE FUNCTION plokymarket_get_orderbook(
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
        o.price ASC,
        o.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- PART 6: ROW LEVEL SECURITY (RLS)
-- ===================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.oracle_verifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY IF NOT EXISTS plokymarket_users_select ON public.users FOR SELECT
    USING (id IN (SELECT unnest(array_remove(ARRAY(SELECT id FROM public.users), auth.uid()::UUID))));
CREATE POLICY IF NOT EXISTS plokymarket_users_select_own ON public.users FOR SELECT
    USING (id = auth.uid()::UUID);
CREATE POLICY IF NOT EXISTS plokymarket_users_insert ON public.users FOR INSERT
    WITH CHECK (true);
CREATE POLICY IF NOT EXISTS plokymarket_users_update ON public.users FOR UPDATE
    USING (id = auth.uid()::UUID);

-- Wallets policies
CREATE POLICY IF NOT EXISTS plokymarket_wallets_select ON public.wallets FOR SELECT
    USING (user_id = auth.uid()::UUID);

-- Orders policies
CREATE POLICY IF NOT EXISTS plokymarket_orders_select ON public.orders FOR SELECT
    USING (user_id = auth.uid()::UUID);
CREATE POLICY IF NOT EXISTS plokymarket_orders_insert ON public.orders FOR INSERT
    WITH CHECK (user_id = auth.uid()::UUID);
CREATE POLICY IF NOT EXISTS plokymarket_orders_update ON public.orders FOR UPDATE
    USING (user_id = auth.uid()::UUID);

-- Positions policies
CREATE POLICY IF NOT EXISTS plokymarket_positions_select ON public.positions FOR SELECT
    USING (user_id = auth.uid()::UUID);

-- Transactions policies
CREATE POLICY IF NOT EXISTS plokymarket_transactions_select ON public.transactions FOR SELECT
    USING (user_id = auth.uid()::UUID);

-- Markets policies (public read, admin write)
CREATE POLICY IF NOT EXISTS plokymarket_markets_select ON public.markets FOR SELECT
    USING (true);
CREATE POLICY IF NOT EXISTS plokymarket_markets_insert ON public.markets FOR INSERT
    WITH CHECK (auth.uid()::UUID IS NOT NULL);
CREATE POLICY IF NOT EXISTS plokymarket_markets_admin ON public.markets FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));

-- Trades policies (public read)
CREATE POLICY IF NOT EXISTS plokymarket_trades_select ON public.trades FOR SELECT
    USING (true);

-- Payment transactions
CREATE POLICY IF NOT EXISTS plokymarket_payments_select ON public.payment_transactions FOR SELECT
    USING (user_id = auth.uid()::UUID);
CREATE POLICY IF NOT EXISTS plokymarket_payments_insert ON public.payment_transactions FOR INSERT
    WITH CHECK (user_id = auth.uid()::UUID);
CREATE POLICY IF NOT EXISTS plokymarket_payments_update ON public.payment_transactions FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));

-- Oracle verifications
CREATE POLICY IF NOT EXISTS plokymarket_oracle_select ON public.oracle_verifications FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));
CREATE POLICY IF NOT EXISTS plokymarket_oracle_insert ON public.oracle_verifications FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));
CREATE POLICY IF NOT EXISTS plokymarket_oracle_update ON public.oracle_verifications FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::UUID AND is_admin = true));

-- ===================================
-- PART 7: SEED DATA (Optional - for testing)
-- ===================================

-- Insert sample admin user (password: admin123 - hash with bcrypt)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@plokymarket.com') THEN
        INSERT INTO public.users (id, email, password_hash, full_name, is_admin)
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            'admin@plokymarket.com',
            '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'Admin User',
            TRUE
        );
        
        INSERT INTO public.wallets (user_id, balance)
        VALUES ('11111111-1111-1111-1111-111111111111', 10000);
    END IF;
END $$;

-- Insert sample markets (comment out for production)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.markets) THEN
        INSERT INTO public.markets (question, description, category, trading_closes_at, event_date)
        VALUES 
            ('Will Bitcoin exceed $100,000 by end of 2024?', 'Prediction market for Bitcoin price', 'Crypto', NOW() + INTERVAL '30 days', NOW() + INTERVAL '60 days'),
            ('Will India win the 2024 T20 World Cup?', 'Cricket world cup winner prediction', 'Sports', NOW() + INTERVAL '60 days', NOW() + INTERVAL '90 days'),
            ('Will AI pass the Turing test by 2025?', 'AI capability prediction', 'Technology', NOW() + INTERVAL '180 days', NOW() + INTERVAL '365 days');
    END IF;
END $$;
