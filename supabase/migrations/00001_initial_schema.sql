-- Migration 00001: Initial Schema
-- Generated 2026-04-30 from live cx33 database
-- Tables: users, wallets, markets, orders, trades, positions, transactions, oracle_verifications, payment_transactions

-- ENUM Types
CREATE TYPE market_status AS ENUM ('active', 'closed', 'resolved', 'cancelled');
CREATE TYPE oracle_status AS ENUM ('pending', 'verified', 'disputed', 'finalized');
CREATE TYPE order_side AS ENUM ('buy', 'sell');
CREATE TYPE order_status AS ENUM ('open', 'partially_filled', 'filled', 'cancelled');
CREATE TYPE order_type AS ENUM ('limit', 'market');
CREATE TYPE outcome_type AS ENUM ('YES', 'NO');
CREATE TYPE payment_method AS ENUM ('bkash', 'nagad', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'settlement', 'refund');

-- Tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance NUMERIC DEFAULT 0,
    locked_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    source_url TEXT,
    image_url TEXT,
    creator_id UUID REFERENCES users(id),
    status market_status DEFAULT 'active',
    resolution_source TEXT,
    min_price NUMERIC DEFAULT 0.0001,
    max_price NUMERIC DEFAULT 0.9999,
    tick_size NUMERIC DEFAULT 0.01,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    trading_closes_at TIMESTAMPTZ NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    winning_outcome outcome_type,
    resolution_details JSONB,
    total_volume NUMERIC DEFAULT 0,
    yes_shares_outstanding BIGINT DEFAULT 0,
    no_shares_outstanding BIGINT DEFAULT 0
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id),
    user_id UUID REFERENCES users(id),
    order_type order_type NOT NULL,
    side order_side NOT NULL,
    outcome outcome_type NOT NULL,
    price NUMERIC NOT NULL,
    quantity BIGINT NOT NULL,
    filled_quantity BIGINT DEFAULT 0,
    status order_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id),
    buy_order_id UUID REFERENCES orders(id),
    sell_order_id UUID REFERENCES orders(id),
    outcome outcome_type NOT NULL,
    price NUMERIC NOT NULL,
    quantity BIGINT NOT NULL,
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id),
    user_id UUID REFERENCES users(id),
    outcome outcome_type NOT NULL,
    quantity BIGINT DEFAULT 0,
    average_price NUMERIC,
    realized_pnl NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type transaction_type NOT NULL,
    amount NUMERIC NOT NULL,
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    order_id UUID REFERENCES orders(id),
    trade_id UUID REFERENCES trades(id),
    market_id UUID REFERENCES markets(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE oracle_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id),
    ai_result outcome_type,
    ai_confidence NUMERIC,
    ai_reasoning TEXT,
    scraped_data JSONB,
    admin_id UUID REFERENCES users(id),
    admin_decision outcome_type,
    admin_notes TEXT,
    status oracle_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    method payment_method NOT NULL,
    amount NUMERIC NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id TEXT,
    sender_number TEXT,
    receiver_number TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
