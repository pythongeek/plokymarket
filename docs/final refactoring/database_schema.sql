-- PlokyMarket BD - Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    nid_number TEXT, -- Bangladesh National ID
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_senior_counsel BOOLEAN DEFAULT FALSE,
    current_level_id TEXT,
    current_level_name TEXT,
    trading_volume DECIMAL(18, 8) DEFAULT 0,
    profit_loss DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    balance DECIMAL(18, 8) DEFAULT 0,
    locked_balance DECIMAL(18, 8) DEFAULT 0,
    currency TEXT DEFAULT 'BDT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Events table (for grouping markets)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'upcoming', -- upcoming, active, closed, resolved
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    question TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    tags TEXT[],
    
    -- Market status
    status TEXT DEFAULT 'active', -- active, closed, resolved, cancelled
    is_verified BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    
    -- Resolution
    resolution_criteria TEXT,
    resolution_source TEXT,
    winning_outcome TEXT, -- 'yes', 'no', or NULL if not resolved
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES user_profiles(id),
    
    -- Trading parameters
    trading_closes_at TIMESTAMPTZ NOT NULL,
    resolution_date TIMESTAMPTZ,
    min_order_size DECIMAL(18, 8) DEFAULT 10,
    max_order_size DECIMAL(18, 8) DEFAULT 100000,
    
    -- Statistics
    volume DECIMAL(18, 8) DEFAULT 0,
    liquidity DECIMAL(18, 8) DEFAULT 0,
    yes_price DECIMAL(5, 4) DEFAULT 0.5,
    no_price DECIMAL(5, 4) DEFAULT 0.5,
    
    -- Media
    image_url TEXT,
    icon_url TEXT,
    
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table (CLOB)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    
    -- Order details
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    outcome TEXT NOT NULL CHECK (outcome IN ('yes', 'no')),
    order_type TEXT DEFAULT 'limit' CHECK (order_type IN ('market', 'limit')),
    
    -- Pricing
    price DECIMAL(5, 4) NOT NULL CHECK (price >= 0.01 AND price <= 0.99),
    size DECIMAL(18, 8) NOT NULL CHECK (size > 0),
    filled_size DECIMAL(18, 8) DEFAULT 0,
    remaining_size DECIMAL(18, 8) GENERATED ALWAYS AS (size - filled_size) STORED,
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'partially_filled', 'cancelling', 'cancelled', 'expired')),
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    client_order_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades table (executed orders)
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buy_order_id UUID NOT NULL REFERENCES orders(id),
    sell_order_id UUID NOT NULL REFERENCES orders(id),
    market_id UUID NOT NULL REFERENCES markets(id),
    
    -- Trade details
    buyer_id UUID NOT NULL REFERENCES user_profiles(id),
    seller_id UUID NOT NULL REFERENCES user_profiles(id),
    outcome TEXT NOT NULL CHECK (outcome IN ('yes', 'no')),
    
    -- Pricing
    price DECIMAL(5, 4) NOT NULL,
    size DECIMAL(18, 8) NOT NULL,
    total DECIMAL(18, 8) GENERATED ALWAYS AS (price * size) STORED,
    
    -- Fees
    buyer_fee DECIMAL(18, 8) DEFAULT 0,
    seller_fee DECIMAL(18, 8) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table (user holdings)
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    outcome TEXT NOT NULL CHECK (outcome IN ('yes', 'no')),
    
    -- Position details
    size DECIMAL(18, 8) NOT NULL DEFAULT 0,
    avg_price DECIMAL(5, 4) NOT NULL DEFAULT 0,
    
    -- P&L
    realized_pnl DECIMAL(18, 8) DEFAULT 0,
    unrealized_pnl DECIMAL(18, 8) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, market_id, outcome)
);

-- Payment transactions (deposits/withdrawals)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Transaction details
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount DECIMAL(18, 8) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL CHECK (method IN ('bkash', 'nagad', 'rocket', 'bank', 'crypto')),
    currency TEXT DEFAULT 'BDT',
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Provider details
    transaction_id TEXT,
    verification_code TEXT,
    provider_response JSONB,
    
    -- Timestamps
    expires_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    processed_by UUID REFERENCES user_profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions (internal ledger)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    
    -- Transaction details
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'fee', 'settlement', 'bonus')),
    amount DECIMAL(18, 8) NOT NULL,
    balance_before DECIMAL(18, 8) NOT NULL,
    balance_after DECIMAL(18, 8) NOT NULL,
    
    -- References
    order_id UUID REFERENCES orders(id),
    trade_id UUID REFERENCES trades(id),
    payment_tx_id UUID REFERENCES payment_transactions(id),
    
    -- Metadata
    description TEXT,
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity feed
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Activity details
    type TEXT NOT NULL CHECK (type IN ('trade', 'order', 'deposit', 'withdrawal', 'market_created', 'market_resolved', 'achievement')),
    
    -- References
    market_id UUID REFERENCES markets(id),
    order_id UUID REFERENCES orders(id),
    trade_id UUID REFERENCES trades(id),
    
    -- Data
    data JSONB,
    
    -- Visibility
    is_public BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follows (social feature)
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Notification details
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- References
    market_id UUID REFERENCES markets(id),
    order_id UUID REFERENCES orders(id),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Actions
    action_url TEXT,
    action_text TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES user_profiles(id),
    
    -- Action details
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    
    -- Data
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard cache
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Stats
    total_trades INTEGER DEFAULT 0,
    total_volume DECIMAL(18, 8) DEFAULT 0,
    profit_loss DECIMAL(18, 8) DEFAULT 0,
    win_rate DECIMAL(5, 4) DEFAULT 0,
    rank INTEGER,
    
    -- Time period
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    
    -- Cache timestamp
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period)
);

-- ============================================
-- INDEXES
-- ============================================

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_market_id ON orders(market_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_market_status ON orders(market_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_side_outcome ON orders(side, outcome);
CREATE INDEX IF NOT EXISTS idx_orders_price ON orders(price);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);
CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON trades(buyer_id);
CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON trades(seller_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);

-- Positions indexes
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_market_id ON positions(market_id);

-- Markets indexes
CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_event_id ON markets(event_id);
CREATE INDEX IF NOT EXISTS idx_markets_trading_closes ON markets(trading_closes_at);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_tx_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON payment_transactions(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_tx_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create wallet on user signup
CREATE OR REPLACE FUNCTION create_wallet_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id, currency, balance)
    VALUES (NEW.id, 'BDT', 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_wallet_on_signup();

-- Create user profile on signup
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

-- Match order function
CREATE OR REPLACE FUNCTION match_order(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_counter_order RECORD;
    v_trade_size DECIMAL;
    v_trades JSONB := '[]'::JSONB;
    v_remaining_size DECIMAL;
BEGIN
    -- Get order details
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    
    IF v_order IS NULL OR v_order.status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found or not open');
    END IF;
    
    v_remaining_size := v_order.remaining_size;
    
    -- Find matching orders
    FOR v_counter_order IN
        SELECT * FROM orders
        WHERE market_id = v_order.market_id
          AND status = 'open'
          AND side != v_order.side
          AND outcome = v_order.outcome
          AND user_id != v_order.user_id
          AND (
              (v_order.side = 'buy' AND price <= v_order.price) OR
              (v_order.side = 'sell' AND price >= v_order.price)
          )
        ORDER BY 
            CASE WHEN v_order.side = 'buy' THEN price END ASC,
            CASE WHEN v_order.side = 'sell' THEN price END DESC,
            created_at ASC
    LOOP
        EXIT WHEN v_remaining_size <= 0;
        
        v_trade_size := LEAST(v_remaining_size, v_counter_order.remaining_size);
        
        -- Create trade
        INSERT INTO trades (
            buy_order_id,
            sell_order_id,
            market_id,
            buyer_id,
            seller_id,
            outcome,
            price,
            size
        ) VALUES (
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_counter_order.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_counter_order.id END,
            v_order.market_id,
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_counter_order.user_id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_counter_order.user_id END,
            v_order.outcome,
            v_counter_order.price,
            v_trade_size
        );
        
        -- Update orders
        UPDATE orders 
        SET filled_size = filled_size + v_trade_size,
            status = CASE 
                WHEN filled_size + v_trade_size >= size THEN 'filled'
                ELSE 'partially_filled'
            END
        WHERE id IN (v_order.id, v_counter_order.id);
        
        v_remaining_size := v_remaining_size - v_trade_size;
        
        v_trades := v_trades || jsonb_build_object(
            'trade_id', currval('trades_id_seq'),
            'size', v_trade_size,
            'price', v_counter_order.price
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'trades', v_trades,
        'remaining_size', v_remaining_size,
        'filled', v_remaining_size <= 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process deposit function
CREATE OR REPLACE FUNCTION process_deposit(p_tx_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_wallet RECORD;
BEGIN
    -- Get transaction
    SELECT * INTO v_tx FROM payment_transactions WHERE id = p_tx_id;
    
    IF v_tx IS NULL OR v_tx.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid transaction');
    END IF;
    
    -- Get wallet
    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_tx.user_id AND currency = v_tx.currency;
    
    IF v_wallet IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;
    
    -- Update wallet
    UPDATE wallets 
    SET balance = balance + v_tx.amount,
        updated_at = NOW()
    WHERE id = v_wallet.id;
    
    -- Update transaction
    UPDATE payment_transactions 
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = p_tx_id;
    
    -- Create wallet transaction
    INSERT INTO wallet_transactions (
        user_id,
        wallet_id,
        type,
        amount,
        balance_before,
        balance_after,
        payment_tx_id,
        description
    ) VALUES (
        v_tx.user_id,
        v_wallet.id,
        'deposit',
        v_tx.amount,
        v_wallet.balance,
        v_wallet.balance + v_tx.amount,
        p_tx_id,
        'Deposit via ' || v_tx.method
    );
    
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settle market function
CREATE OR REPLACE FUNCTION settle_market(
    p_market_id UUID,
    p_winning_outcome TEXT,
    p_resolved_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_position RECORD;
    v_payout DECIMAL;
BEGIN
    -- Update market
    UPDATE markets 
    SET status = 'resolved',
        winning_outcome = p_winning_outcome,
        resolved_at = NOW(),
        resolved_by = p_resolved_by
    WHERE id = p_market_id;
    
    -- Process payouts for winning positions
    FOR v_position IN
        SELECT * FROM positions 
        WHERE market_id = p_market_id 
          AND outcome = p_winning_outcome
          AND size > 0
    LOOP
        v_payout := v_position.size; -- Each share pays 1 BDT
        
        -- Update wallet
        UPDATE wallets 
        SET balance = balance + v_payout
        WHERE user_id = v_position.user_id;
        
        -- Create wallet transaction
        INSERT INTO wallet_transactions (
            user_id,
            type,
            amount,
            description
        ) VALUES (
            v_position.user_id,
            'settlement',
            v_payout,
            'Market settlement: ' || p_market_id
        );
    END LOOP;
    
    RETURN jsonb_build_object('success', true, 'market_id', p_market_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Users can view their own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only system can modify wallets"
    ON wallets FOR ALL
    USING (false)
    WITH CHECK (false);

-- Markets policies
CREATE POLICY "Anyone can view active markets"
    ON markets FOR SELECT
    USING (status = 'active' OR status = 'closed' OR status = 'resolved');

CREATE POLICY "Admins can create markets"
    ON markets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND is_admin = true
    ));

CREATE POLICY "Admins can update markets"
    ON markets FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND is_admin = true
    ));

-- Orders policies
CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own orders"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Trades policies (read-only for users)
CREATE POLICY "Users can view their own trades"
    ON trades FOR SELECT
    USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Positions policies
CREATE POLICY "Users can view their own positions"
    ON positions FOR SELECT
    USING (auth.uid() = user_id);

-- Payment transactions policies
CREATE POLICY "Users can view their own payment transactions"
    ON payment_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposit requests"
    ON payment_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id AND type = 'deposit');

-- Wallet transactions policies
CREATE POLICY "Users can view their own wallet transactions"
    ON wallet_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view public activities"
    ON activities FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can view their own activities"
    ON activities FOR SELECT
    USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view their own follows"
    ON follows FOR SELECT
    USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow/unfollow"
    ON follows FOR ALL
    USING (auth.uid() = follower_id)
    WITH CHECK (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE markets;
ALTER PUBLICATION supabase_realtime ADD TABLE positions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- SEED DATA
-- ============================================

-- Sample categories
INSERT INTO markets (name, question, description, category, status, trading_closes_at, created_at)
VALUES 
    ('Bangladesh Election 2029', 'Will Awami League win the 2029 Bangladesh general election?', 'Predict the outcome of the next general election in Bangladesh', 'politics', 'active', NOW() + INTERVAL '3 years', NOW()),
    ('BPL 2025 Champion', 'Which team will win Bangladesh Premier League 2025?', 'Predict the champion of BPL 2025 season', 'cricket', 'active', NOW() + INTERVAL '6 months', NOW()),
    ('Bangladesh GDP Growth', 'Will Bangladesh GDP growth exceed 6% in FY2025?', 'Predict Bangladesh economic growth for fiscal year 2025', 'economics', 'active', NOW() + INTERVAL '1 year', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- COMPLETION
-- ============================================

SELECT 'Database schema created successfully!' AS status;
