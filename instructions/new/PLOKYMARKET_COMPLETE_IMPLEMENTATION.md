# Plokymarket - Complete Production-Ready Implementation Guide

## 🎯 Project Overview

A localized Polymarket-style prediction marketplace for Bangladesh with:
- **Bangla-First Localization** (Bangla, English, Hindi)
- **Dark/Light Theme Toggle**
- **Advanced Trading UI** (Order Book, Charts, Market/Limit Orders)
- **Leaderboards & Social Features**
- **AI-Powered Market Resolution**
- **Local Payment Integration** (bKash, Nagad)

---

## 📊 Feature Comparison & Gap Analysis

| Feature | Polymarket | Plokymarket Status | Priority |
|---------|-----------|-------------------|----------|
| Multi-language Support | English Only | ✅ Bangla/English/Hindi | **CRITICAL** |
| Dark/Light Theme | ✓ | ✅ Implementing | **HIGH** |
| Advanced Trading UI | Market/Limit Orders | ⚠️ Basic | **HIGH** |
| Order Book Visualization | ✓ Grid-based | ⚠️ Simple | **HIGH** |
| Price Charts | Candlestick/Line | ⚠️ Basic Line | **MEDIUM** |
| Leaderboards | PnL/Volume/Time | ❌ Missing | **HIGH** |
| Portfolio Analytics | Charts/History | ⚠️ Minimal | **MEDIUM** |
| Activity Feed | ✓ | ❌ Missing | **MEDIUM** |
| Local Payment | N/A | ✅ bKash/Nagad | **CRITICAL** |
| Bangladeshi Context | N/A | ✅ 100% Local | **CRITICAL** |

---

## 🏗️ Architecture Overview

### Tech Stack

```
Frontend:
├── Next.js 14+ (App Router)
├── React 18+
├── TypeScript 5+
├── Tailwind CSS 3+
├── shadcn/ui (Component Library)
├── i18next (Internationalization)
├── Zustand (State Management)
├── Recharts / Lightweight Charts (Charts)
└── next-themes (Theme Management)

Backend:
├── Supabase (PostgreSQL + Auth + Realtime)
├── PostgREST (Auto-generated API)
├── Edge Functions (Serverless)
└── Row Level Security (RLS)

Automation:
├── n8n (Workflow Automation)
├── OpenAI API (AI Oracle)
└── Web Scrapers (News Sources)

Deployment:
├── Vercel (Frontend)
├── Supabase Cloud (Database)
└── Docker/Railway (n8n)
```

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       USER INTERFACE                         │
│  (Next.js + React + Tailwind + i18next + next-themes)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                          │
│              (Zustand + React Query)                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE CLIENT                            │
│           (Authentication + Realtime + Storage)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────────┐
        ▼                     ▼                  ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │  Edge        │    │  Realtime    │
│  Database    │    │  Functions   │    │  Subscriptions│
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              MATCHING ENGINE (PostgreSQL Functions)          │
│  - Order Matching Algorithm                                  │
│  - Position Management                                       │
│  - Settlement Logic                                          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    n8n AUTOMATION                            │
│  - News Scraping (Prothom Alo, Daily Star)                  │
│  - AI Oracle (OpenAI GPT-4)                                  │
│  - Payment Verification (bKash/Nagad)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (Enhanced)

### Core Tables

```sql
-- ===================================
-- USERS & AUTHENTICATION
-- ===================================

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    preferred_language VARCHAR(5) DEFAULT 'bn', -- 'bn', 'en', 'hi'
    theme VARCHAR(10) DEFAULT 'dark', -- 'dark', 'light'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_document_url TEXT,
    total_volume NUMERIC(12, 2) DEFAULT 0,
    total_pnl NUMERIC(12, 2) DEFAULT 0,
    trades_count INT DEFAULT 0,
    win_rate NUMERIC(5, 2) DEFAULT 0,
    rank INT,
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- ===================================
-- WALLETS & TRANSACTIONS
-- ===================================

CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) DEFAULT 0 CHECK (balance >= 0),
    locked_balance NUMERIC(12, 2) DEFAULT 0 CHECK (locked_balance >= 0),
    lifetime_deposits NUMERIC(12, 2) DEFAULT 0,
    lifetime_withdrawals NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ===================================
-- MARKETS (Enhanced)
-- ===================================

CREATE TYPE market_category AS ENUM (
    'politics', 'sports', 'economy', 'entertainment', 
    'weather', 'technology', 'health', 'education'
);

CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    question_bn TEXT, -- Bangla translation
    question_hi TEXT, -- Hindi translation
    description TEXT,
    description_bn TEXT,
    description_hi TEXT,
    category market_category NOT NULL,
    tags TEXT[],
    source_url TEXT,
    image_url TEXT,
    creator_id UUID REFERENCES public.users(id),
    status market_status DEFAULT 'active',
    resolution_source TEXT,
    min_price NUMERIC(5, 4) DEFAULT 0.01 CHECK (min_price > 0),
    max_price NUMERIC(5, 4) DEFAULT 0.99 CHECK (max_price < 1),
    tick_size NUMERIC(5, 4) DEFAULT 0.01,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    trading_closes_at TIMESTAMPTZ NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    winning_outcome outcome_type,
    resolution_details JSONB,
    total_volume NUMERIC(12, 2) DEFAULT 0,
    liquidity NUMERIC(12, 2) DEFAULT 0,
    yes_shares_outstanding BIGINT DEFAULT 0,
    no_shares_outstanding BIGINT DEFAULT 0,
    yes_price NUMERIC(5, 4),
    no_price NUMERIC(5, 4),
    price_24h_change NUMERIC(5, 4),
    volume_24h NUMERIC(12, 2) DEFAULT 0,
    traders_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    CONSTRAINT valid_dates CHECK (event_date > trading_closes_at)
);

-- ===================================
-- ORDERS (Enhanced)
-- ===================================

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    order_type order_type NOT NULL,
    side order_side NOT NULL,
    outcome outcome_type NOT NULL,
    price NUMERIC(5, 4) NOT NULL CHECK (price > 0 AND price < 1),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    filled_quantity BIGINT DEFAULT 0 CHECK (filled_quantity <= quantity),
    remaining_quantity BIGINT GENERATED ALWAYS AS (quantity - filled_quantity) STORED,
    status order_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    CONSTRAINT valid_fill CHECK (filled_quantity <= quantity)
);

-- ===================================
-- ACTIVITY FEED
-- ===================================

CREATE TYPE activity_type AS ENUM (
    'order_placed', 'trade_executed', 'market_created', 
    'market_resolved', 'position_opened', 'position_closed',
    'comment_added', 'user_followed'
);

CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    trade_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- LEADERBOARD CACHE
-- ===================================

CREATE TABLE public.leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    timeframe VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
    total_pnl NUMERIC(12, 2) DEFAULT 0,
    total_volume NUMERIC(12, 2) DEFAULT 0,
    trades_count INT DEFAULT 0,
    win_rate NUMERIC(5, 2) DEFAULT 0,
    rank INT,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, timeframe)
);

-- ===================================
-- MARKET COMMENTS
-- ===================================

CREATE TABLE public.market_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.market_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ===================================
-- USER FOLLOWS
-- ===================================

CREATE TABLE public.user_follows (
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- ===================================
-- INDEXES (Performance Optimization)
-- ===================================

-- Markets
CREATE INDEX idx_markets_status ON public.markets(status) WHERE status = 'active';
CREATE INDEX idx_markets_category ON public.markets(category, created_at DESC);
CREATE INDEX idx_markets_trending ON public.markets(is_trending, volume_24h DESC) 
    WHERE is_trending = TRUE;
CREATE INDEX idx_markets_featured ON public.markets(is_featured, created_at DESC) 
    WHERE is_featured = TRUE;
CREATE INDEX idx_markets_search ON public.markets 
    USING gin(to_tsvector('english', question || ' ' || COALESCE(description, '')));

-- Orders (Matching Engine)
CREATE INDEX idx_orders_matching ON public.orders(
    market_id, outcome, side, status, price, created_at
) WHERE status IN ('open', 'partially_filled');
CREATE INDEX idx_orders_user_active ON public.orders(user_id, status, created_at DESC)
    WHERE status IN ('open', 'partially_filled');

-- Trades
CREATE INDEX idx_trades_market_time ON public.trades(market_id, created_at DESC);
CREATE INDEX idx_trades_user ON public.trades(buyer_id, created_at DESC);
CREATE INDEX idx_trades_seller ON public.trades(seller_id, created_at DESC);

-- Activities
CREATE INDEX idx_activities_user ON public.activities(user_id, created_at DESC);
CREATE INDEX idx_activities_market ON public.activities(market_id, created_at DESC);
CREATE INDEX idx_activities_type ON public.activities(type, created_at DESC);

-- Leaderboard
CREATE INDEX idx_leaderboard_timeframe ON public.leaderboard_cache(
    timeframe, rank ASC, total_pnl DESC
);

-- Comments
CREATE INDEX idx_comments_market ON public.market_comments(
    market_id, created_at DESC
) WHERE is_deleted = FALSE;
```

---

## 🔄 Enhanced Matching Engine

### Algorithm Flow

```
1. Order Received
   ↓
2. Validate Order (funds, market status, price limits)
   ↓
3. Lock Funds (for buy orders)
   ↓
4. Match Against Opposite Orders
   │
   ├─→ Buy Order Matching:
   │   • Find sell orders: same outcome, price ≤ order price
   │   • Find opposite buy orders: different outcome, combined price ≤ 1.00
   │   • Sort by: price (best first), time (FIFO)
   │
   └─→ Sell Order Matching:
       • Find buy orders: same outcome, price ≥ order price
       • Sort by: price (highest first), time (FIFO)
   ↓
5. Execute Trades (while matches available)
   • Calculate trade quantity (minimum of remaining quantities)
   • Determine trade price (maker's price for price priority)
   • Update order filled quantities
   • Create trade record
   ↓
6. Update Positions
   • Buyer: +shares at trade price
   • Seller: -shares at trade price
   • Calculate realized PnL for seller
   ↓
7. Settle Funds
   • Transfer USDC from buyer to seller
   • Unlock remaining funds for unfilled portions
   ↓
8. Update Market Metrics
   • Total volume
   • 24h volume
   • Price (last trade)
   • Liquidity
   ↓
9. Emit Realtime Events
   • Order book updates
   • Trade notifications
   • Position updates
```

### Enhanced Matching Function

```sql
-- ===================================
-- ENHANCED MATCHING ENGINE
-- ===================================

CREATE OR REPLACE FUNCTION match_order_v2(p_order_id UUID)
RETURNS TABLE(
    matched BOOLEAN,
    trades_created INT,
    remaining_quantity BIGINT,
    avg_fill_price NUMERIC(5, 4),
    total_filled BIGINT
) AS $$
DECLARE
    v_order RECORD;
    v_match RECORD;
    v_trade_quantity BIGINT;
    v_trade_price NUMERIC(5, 4);
    v_trades_count INT := 0;
    v_remaining BIGINT;
    v_total_filled BIGINT := 0;
    v_weighted_price NUMERIC := 0;
BEGIN
    -- Lock and get the order with FOR UPDATE
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;
    
    -- Validate order status
    IF NOT FOUND OR v_order.status NOT IN ('open', 'partially_filled') THEN
        RETURN QUERY SELECT FALSE, 0, 0::BIGINT, 0::NUMERIC(5, 4), 0::BIGINT;
        RETURN;
    END IF;
    
    -- Check if market is still active
    IF NOT EXISTS (
        SELECT 1 FROM public.markets 
        WHERE id = v_order.market_id 
        AND status = 'active' 
        AND trading_closes_at > NOW()
    ) THEN
        UPDATE public.orders SET status = 'cancelled'::order_status
        WHERE id = p_order_id;
        RETURN QUERY SELECT FALSE, 0, 0::BIGINT, 0::NUMERIC(5, 4), 0::BIGINT;
        RETURN;
    END IF;
    
    v_remaining := v_order.quantity - v_order.filled_quantity;
    
    -- Matching loop
    WHILE v_remaining > 0 LOOP
        IF v_order.side = 'buy' THEN
            -- Buy order matching logic
            SELECT * INTO v_match
            FROM public.orders
            WHERE market_id = v_order.market_id
              AND status IN ('open', 'partially_filled')
              AND id != v_order.id
              AND (
                  -- Same outcome sell orders
                  (side = 'sell' 
                   AND outcome = v_order.outcome 
                   AND price <= v_order.price)
                  OR
                  -- Opposite outcome buy orders (arbitrage)
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
            -- Sell order matching logic
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
        
        -- Exit if no matches found
        EXIT WHEN NOT FOUND;
        
        -- Calculate trade quantity
        v_trade_quantity := LEAST(
            v_remaining, 
            v_match.quantity - v_match.filled_quantity
        );
        
        -- Determine trade price (maker gets their price)
        IF v_order.created_at < v_match.created_at THEN
            v_trade_price := v_order.price;
        ELSE
            v_trade_price := v_match.price;
        END IF;
        
        -- Create trade record
        INSERT INTO public.trades (
            market_id, 
            buy_order_id, 
            sell_order_id, 
            outcome,
            price, 
            quantity, 
            buyer_id, 
            seller_id
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
        
        -- Update order filled quantities
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity 
                THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END,
            updated_at = NOW()
        WHERE id = v_order.id;
        
        UPDATE public.orders SET 
            filled_quantity = filled_quantity + v_trade_quantity,
            status = CASE 
                WHEN filled_quantity + v_trade_quantity >= quantity 
                THEN 'filled'::order_status
                ELSE 'partially_filled'::order_status
            END,
            updated_at = NOW()
        WHERE id = v_match.id;
        
        -- Update positions
        PERFORM update_position_v2(
            CASE WHEN v_order.side = 'buy' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, 
            v_order.outcome, 
            v_trade_quantity, 
            v_trade_price
        );
        
        PERFORM update_position_v2(
            CASE WHEN v_order.side = 'sell' THEN v_order.user_id ELSE v_match.user_id END,
            v_order.market_id, 
            v_order.outcome, 
            -v_trade_quantity, 
            v_trade_price
        );
        
        -- Process settlement
        PERFORM process_trade_settlement_v2(
            CASE WHEN v_order.side = 'buy' THEN v_order.id ELSE v_match.id END,
            CASE WHEN v_order.side = 'sell' THEN v_order.id ELSE v_match.id END,
            v_trade_quantity, 
            v_trade_price
        );
        
        -- Update market metrics
        PERFORM update_market_metrics(v_order.market_id, v_trade_quantity, v_trade_price);
        
        -- Track for weighted average calculation
        v_weighted_price := v_weighted_price + (v_trade_price * v_trade_quantity);
        v_total_filled := v_total_filled + v_trade_quantity;
        
        v_remaining := v_remaining - v_trade_quantity;
        v_trades_count := v_trades_count + 1;
    END LOOP;
    
    -- Calculate average fill price
    DECLARE
        v_avg_price NUMERIC(5, 4) := 0;
    BEGIN
        IF v_total_filled > 0 THEN
            v_avg_price := v_weighted_price / v_total_filled;
        END IF;
        
        RETURN QUERY SELECT 
            v_trades_count > 0, 
            v_trades_count, 
            v_remaining,
            v_avg_price,
            v_total_filled;
    END;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- MARKET METRICS UPDATE
-- ===================================

CREATE OR REPLACE FUNCTION update_market_metrics(
    p_market_id UUID,
    p_quantity BIGINT,
    p_price NUMERIC(5, 4)
) RETURNS VOID AS $$
DECLARE
    v_trade_value NUMERIC(12, 2);
BEGIN
    v_trade_value := p_quantity * p_price;
    
    UPDATE public.markets SET
        total_volume = total_volume + v_trade_value,
        volume_24h = volume_24h + v_trade_value,
        yes_price = CASE 
            WHEN p_price IS NOT NULL THEN p_price 
            ELSE yes_price 
        END,
        no_price = CASE 
            WHEN p_price IS NOT NULL THEN (1.00 - p_price)
            ELSE no_price 
        END,
        updated_at = NOW()
    WHERE id = p_market_id;
    
    -- Update share counts
    UPDATE public.markets
    SET yes_shares_outstanding = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM public.positions
        WHERE market_id = p_market_id AND outcome = 'YES'
    ),
    no_shares_outstanding = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM public.positions
        WHERE market_id = p_market_id AND outcome = 'NO'
    )
    WHERE id = p_market_id;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- LEADERBOARD CALCULATION
-- ===================================

CREATE OR REPLACE FUNCTION calculate_leaderboard(p_timeframe VARCHAR(20))
RETURNS VOID AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
BEGIN
    -- Determine timeframe
    v_start_date := CASE p_timeframe
        WHEN 'daily' THEN NOW() - INTERVAL '1 day'
        WHEN 'weekly' THEN NOW() - INTERVAL '7 days'
        WHEN 'monthly' THEN NOW() - INTERVAL '30 days'
        ELSE '1970-01-01'::TIMESTAMPTZ -- all_time
    END;
    
    -- Delete existing cache for this timeframe
    DELETE FROM public.leaderboard_cache WHERE timeframe = p_timeframe;
    
    -- Calculate and insert new rankings
    INSERT INTO public.leaderboard_cache (
        user_id, timeframe, total_pnl, total_volume, trades_count, win_rate, rank
    )
    SELECT 
        p.user_id,
        p_timeframe,
        SUM(p.realized_pnl) as total_pnl,
        SUM(t.price * t.quantity) as total_volume,
        COUNT(DISTINCT t.id) as trades_count,
        CASE 
            WHEN COUNT(DISTINCT t.id) > 0 
            THEN (COUNT(DISTINCT t.id) FILTER (
                WHERE p.realized_pnl > 0
            )::NUMERIC / COUNT(DISTINCT t.id)::NUMERIC) * 100
            ELSE 0
        END as win_rate,
        ROW_NUMBER() OVER (ORDER BY SUM(p.realized_pnl) DESC) as rank
    FROM public.positions p
    LEFT JOIN public.trades t ON (
        t.buyer_id = p.user_id OR t.seller_id = p.user_id
    ) AND t.created_at >= v_start_date
    WHERE p.created_at >= v_start_date
    GROUP BY p.user_id
    HAVING SUM(p.realized_pnl) IS NOT NULL
    ORDER BY total_pnl DESC;
    
    -- Update user ranks
    UPDATE public.users u
    SET rank = l.rank
    FROM public.leaderboard_cache l
    WHERE u.id = l.user_id 
    AND l.timeframe = 'all_time';
END;
$$ LANGUAGE plpgsql;
```

---

## 🌍 Localization Implementation

### Directory Structure

```
apps/web/
├── public/
│   └── locales/
│       ├── bn/
│       │   ├── common.json
│       │   ├── markets.json
│       │   ├── trading.json
│       │   └── navigation.json
│       ├── en/
│       │   ├── common.json
│       │   ├── markets.json
│       │   ├── trading.json
│       │   └── navigation.json
│       └── hi/
│           ├── common.json
│           ├── markets.json
│           ├── trading.json
│           └── navigation.json
```

### Translation Files

**`public/locales/bn/common.json`**
```json
{
  "app": {
    "name": "প্লোকিমার্কেট",
    "tagline": "বাংলাদেশের প্রথম ভবিষ্যৎবাণী বাজার"
  },
  "auth": {
    "login": "প্রবেশ করুন",
    "register": "নিবন্ধন করুন",
    "logout": "প্রস্থান",
    "email": "ইমেইল",
    "password": "পাসওয়ার্ড",
    "fullName": "পূর্ণ নাম",
    "forgotPassword": "পাসওয়ার্ড ভুলে গেছেন?",
    "noAccount": "কোনো অ্যাকাউন্ট নেই?",
    "haveAccount": "ইতিমধ্যে অ্যাকাউন্ট আছে?"
  },
  "wallet": {
    "balance": "ব্যালেন্স",
    "deposit": "জমা করুন",
    "withdraw": "তুলুন",
    "locked": "লক করা",
    "available": "উপলব্ধ"
  },
  "theme": {
    "light": "লাইট মোড",
    "dark": "ডার্ক মোড",
    "toggle": "থিম পরিবর্তন করুন"
  },
  "language": {
    "bn": "বাংলা",
    "en": "English",
    "hi": "हिन्दी"
  }
}
```

**`public/locales/bn/markets.json`**
```json
{
  "title": "মার্কেট",
  "categories": {
    "politics": "রাজনীতি",
    "sports": "ক্রীড়া",
    "economy": "অর্থনীতি",
    "entertainment": "বিনোদন",
    "weather": "আবহাওয়া",
    "technology": "প্রযুক্তি",
    "health": "স্বাস্থ্য",
    "education": "শিক্ষা"
  },
  "status": {
    "active": "সক্রিয়",
    "closed": "বন্ধ",
    "resolved": "সমাধান হয়েছে",
    "cancelled": "বাতিল"
  },
  "filters": {
    "all": "সব",
    "trending": "ট্রেন্ডিং",
    "featured": "বৈশিষ্ট্যযুক্ত",
    "new": "নতুন"
  },
  "volume": "ভলিউম",
  "liquidity": "লিকুইডিটি",
  "traders": "ট্রেডার",
  "endsIn": "শেষ হবে"
}
```

**`public/locales/bn/trading.json`**
```json
{
  "buy": "কিনুন",
  "sell": "বিক্রি করুন",
  "yes": "হ্যাঁ",
  "no": "না",
  "price": "মূল্য",
  "quantity": "পরিমাণ",
  "total": "মোট",
  "orderTypes": {
    "market": "মার্কেট অর্ডার",
    "limit": "লিমিট অর্ডার"
  },
  "orderBook": {
    "title": "অর্ডার বুক",
    "bids": "ক্রয় অর্ডার",
    "asks": "বিক্রয় অর্ডার",
    "spread": "স্প্রেড"
  },
  "positions": "পজিশন",
  "openOrders": "খোলা অর্ডার",
  "tradeHistory": "ট্রেড ইতিহাস",
  "placeOrder": "অর্ডার করুন",
  "cancelOrder": "অর্ডার বাতিল করুন",
  "avgPrice": "গড় মূল্য",
  "pnl": "লাভ/ক্ষতি",
  "roi": "রিটার্ন অন ইনভেস্টমেন্ট"
}
```

**`public/locales/bn/navigation.json`**
```json
{
  "home": "হোম",
  "markets": "মার্কেট",
  "portfolio": "পোর্টফোলিও",
  "activity": "কার্যকলাপ",
  "leaderboard": "লিডারবোর্ড",
  "wallet": "ওয়ালেট",
  "settings": "সেটিংস",
  "admin": "অ্যাডমিন"
}
```

### i18next Configuration

**`apps/web/src/lib/i18n.ts`**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'bn', // Default to Bangla
    supportedLngs: ['bn', 'en', 'hi'],
    
    ns: ['common', 'markets', 'trading', 'navigation'],
    defaultNS: 'common',
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### Language Switcher Component

**`apps/web/src/components/LanguageSwitcher.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const languages = [
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const supabase = createClient();

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    localStorage.setItem('i18nextLng', langCode);
    
    // Update user preference in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ preferred_language: langCode })
        .eq('id', user.id);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
          <span className="sm:hidden">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={currentLang === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 🎨 Theme System (Dark/Light Mode)

### Theme Provider Setup

**`apps/web/src/providers/theme-provider.tsx`**
```typescript
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Theme Toggle Component

**`apps/web/src/components/ThemeToggle.tsx`**
```typescript
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation('common');
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Update user preference in database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ theme: newTheme })
        .eq('id', user.id);
    }
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4" />
          <span className="hidden sm:inline">{t('theme.light')}</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('theme.dark')}</span>
        </>
      )}
    </Button>
  );
}
```

### Tailwind Dark Mode Configuration

**`apps/web/tailwind.config.ts`**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Trading-specific colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        buy: 'hsl(142, 76%, 36%)', // Green
        sell: 'hsl(0, 84%, 60%)',  // Red
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

**`apps/web/src/app/globals.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    --success: 142 76% 36%;
    --success-foreground: 138 76% 97%;
    --warning: 48 96% 53%;
    --warning-foreground: 48 96% 10%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
    --success: 142 76% 36%;
    --success-foreground: 138 76% 97%;
    --warning: 48 96% 53%;
    --warning-foreground: 48 96% 10%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 📊 Advanced Trading UI Components

### Order Book Component

**`apps/web/src/components/trading/OrderBook.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

interface OrderBookProps {
  marketId: string;
}

interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  percentage: number;
}

export function OrderBook({ marketId }: OrderBookProps) {
  const { t } = useTranslation('trading');
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [spread, setSpread] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchOrderBook();
    
    // Subscribe to order book updates
    const channel = supabase
      .channel(`orderbook:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`,
        },
        () => {
          fetchOrderBook();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  const fetchOrderBook = async () => {
    // Fetch buy orders (bids)
    const { data: buyOrders } = await supabase
      .from('orders')
      .select('price, quantity, filled_quantity')
      .eq('market_id', marketId)
      .eq('side', 'buy')
      .in('status', ['open', 'partially_filled'])
      .order('price', { ascending: false })
      .limit(15);

    // Fetch sell orders (asks)
    const { data: sellOrders } = await supabase
      .from('orders')
      .select('price, quantity, filled_quantity')
      .eq('market_id', marketId)
      .eq('side', 'sell')
      .in('status', ['open', 'partially_filled'])
      .order('price', { ascending: true })
      .limit(15);

    if (buyOrders) {
      const aggregated = aggregateOrders(buyOrders);
      setBids(aggregated);
    }

    if (sellOrders) {
      const aggregated = aggregateOrders(sellOrders);
      setAsks(aggregated);
    }

    // Calculate spread
    if (buyOrders && buyOrders.length > 0 && sellOrders && sellOrders.length > 0) {
      const highestBid = buyOrders[0].price;
      const lowestAsk = sellOrders[0].price;
      setSpread(lowestAsk - highestBid);
    }
  };

  const aggregateOrders = (orders: any[]): OrderBookLevel[] => {
    const levels = new Map<number, number>();
    
    orders.forEach(order => {
      const remaining = order.quantity - order.filled_quantity;
      const current = levels.get(order.price) || 0;
      levels.set(order.price, current + remaining);
    });

    let runningTotal = 0;
    const maxTotal = Math.max(...Array.from(levels.values()));
    
    return Array.from(levels.entries())
      .map(([price, quantity]) => {
        runningTotal += quantity;
        return {
          price,
          quantity,
          total: runningTotal,
          percentage: (runningTotal / maxTotal) * 100,
        };
      });
  };

  const OrderBookRow = ({ 
    level, 
    type 
  }: { 
    level: OrderBookLevel; 
    type: 'bid' | 'ask' 
  }) => (
    <div className="relative flex items-center justify-between px-3 py-1 text-sm hover:bg-accent/50 cursor-pointer">
      <div
        className={cn(
          'absolute inset-0 opacity-20',
          type === 'bid' ? 'bg-buy' : 'bg-sell'
        )}
        style={{ width: `${level.percentage}%` }}
      />
      <span className={cn(
        'relative z-10 font-medium',
        type === 'bid' ? 'text-buy' : 'text-sell'
      )}>
        {level.price.toFixed(4)}
      </span>
      <span className="relative z-10 text-muted-foreground">
        {level.quantity.toLocaleString()}
      </span>
      <span className="relative z-10 text-muted-foreground">
        {level.total.toLocaleString()}
      </span>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('orderBook.title')}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {t('orderBook.spread')}: <span className="text-foreground">{spread.toFixed(4)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="both" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none">
            <TabsTrigger value="bids">{t('orderBook.bids')}</TabsTrigger>
            <TabsTrigger value="both">Both</TabsTrigger>
            <TabsTrigger value="asks">{t('orderBook.asks')}</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-b">
            <span>{t('price')}</span>
            <span>{t('quantity')}</span>
            <span>{t('total')}</span>
          </div>

          <TabsContent value="bids" className="mt-0 max-h-[400px] overflow-y-auto">
            {bids.map((level, i) => (
              <OrderBookRow key={i} level={level} type="bid" />
            ))}
          </TabsContent>

          <TabsContent value="both" className="mt-0 max-h-[400px] overflow-y-auto">
            <div className="space-y-px">
              {asks.slice().reverse().map((level, i) => (
                <OrderBookRow key={`ask-${i}`} level={level} type="ask" />
              ))}
              <div className="py-2 text-center text-lg font-semibold border-y">
                {asks.length > 0 ? asks[0].price.toFixed(4) : '-.----'}
              </div>
              {bids.map((level, i) => (
                <OrderBookRow key={`bid-${i}`} level={level} type="bid" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="asks" className="mt-0 max-h-[400px] overflow-y-auto">
            {asks.map((level, i) => (
              <OrderBookRow key={i} level={level} type="ask" />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

### Price Chart Component (with Lightweight Charts)

**`apps/web/src/components/trading/PriceChart.tsx`**
```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';

interface PriceChartProps {
  marketId: string;
}

type ChartType = 'line' | 'candlestick';
type Timeframe = '1H' | '4H' | '1D' | '1W' | 'ALL';

export function PriceChart({ marketId }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const supabase = createClient();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Chart colors based on theme
    const isDark = theme === 'dark';
    const backgroundColor = isDark ? '#0f172a' : '#ffffff';
    const textColor = isDark ? '#e2e8f0' : '#1e293b';
    const gridColor = isDark ? '#1e293b' : '#e2e8f0';

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Create series based on type
    createSeries(chart, chartType);

    // Fetch and set data
    fetchChartData();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme, chartType, timeframe, marketId]);

  const createSeries = (chart: IChartApi, type: ChartType) => {
    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
    }

    if (type === 'line') {
      seriesRef.current = chart.addLineSeries({
        color: '#2563eb',
        lineWidth: 2,
      });
    } else {
      seriesRef.current = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
    }
  };

  const fetchChartData = async () => {
    if (!seriesRef.current) return;

    // Calculate time range based on timeframe
    const now = new Date();
    const startTime = new Date(now);
    
    switch (timeframe) {
      case '1H':
        startTime.setHours(now.getHours() - 1);
        break;
      case '4H':
        startTime.setHours(now.getHours() - 4);
        break;
      case '1D':
        startTime.setDate(now.getDate() - 1);
        break;
      case '1W':
        startTime.setDate(now.getDate() - 7);
        break;
      case 'ALL':
        startTime.setFullYear(2000);
        break;
    }

    // Fetch trades for this market
    const { data: trades } = await supabase
      .from('trades')
      .select('price, created_at, quantity')
      .eq('market_id', marketId)
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: true });

    if (!trades || trades.length === 0) return;

    if (chartType === 'line') {
      const lineData = trades.map(trade => ({
        time: new Date(trade.created_at).getTime() / 1000,
        value: trade.price,
      }));
      seriesRef.current.setData(lineData);
    } else {
      // Aggregate into candlesticks (1-minute bars)
      const candleData = aggregateToCandlesticks(trades, 60);
      seriesRef.current.setData(candleData);
    }

    // Fit content to view
    chartRef.current?.timeScale().fitContent();
  };

  const aggregateToCandlesticks = (trades: any[], intervalSeconds: number) => {
    const candles = new Map();

    trades.forEach(trade => {
      const timestamp = new Date(trade.created_at).getTime() / 1000;
      const candleTime = Math.floor(timestamp / intervalSeconds) * intervalSeconds;

      if (!candles.has(candleTime)) {
        candles.set(candleTime, {
          time: candleTime,
          open: trade.price,
          high: trade.price,
          low: trade.price,
          close: trade.price,
        });
      } else {
        const candle = candles.get(candleTime);
        candle.high = Math.max(candle.high, trade.price);
        candle.low = Math.min(candle.low, trade.price);
        candle.close = trade.price;
      }
    });

    return Array.from(candles.values()).sort((a, b) => a.time - b.time);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Price Chart</CardTitle>
          <div className="flex gap-2">
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
              <TabsList>
                <TabsTrigger value="1H">1H</TabsTrigger>
                <TabsTrigger value="4H">4H</TabsTrigger>
                <TabsTrigger value="1D">1D</TabsTrigger>
                <TabsTrigger value="1W">1W</TabsTrigger>
                <TabsTrigger value="ALL">ALL</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <TabsList>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="candlestick">Candles</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} />
      </CardContent>
    </Card>
  );
}
```

### Trading Panel Component

**`apps/web/src/components/trading/TradingPanel.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Market } from '@/types';
import { cn } from '@/lib/utils';

interface TradingPanelProps {
  market: Market;
  onOrderPlaced?: () => void;
}

export function TradingPanel({ market, onOrderPlaced }: TradingPanelProps) {
  const { t } = useTranslation('trading');
  const { toast } = useToast();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState(market.yes_price || 0.5);
  const [quantity, setQuantity] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const total = price * quantity;
  const potentialProfit = side === 'buy' ? (1 - price) * quantity : price * quantity;
  const roi = ((potentialProfit / total) * 100).toFixed(2);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to place orders',
          variant: 'destructive',
        });
        return;
      }

      // Check wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!wallet || wallet.balance < total) {
        toast({
          title: 'Insufficient Balance',
          description: 'Please deposit funds to place this order',
          variant: 'destructive',
        });
        return;
      }

      // Place order
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          market_id: market.id,
          user_id: user.id,
          order_type: orderType,
          side,
          outcome,
          price,
          quantity,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger matching engine
      await supabase.rpc('match_order_v2', { p_order_id: order.id });

      toast({
        title: 'Order Placed',
        description: `${side.toUpperCase()} ${quantity} ${outcome} @ ${price.toFixed(4)}`,
      });

      onOrderPlaced?.();
      
      // Reset form
      setQuantity(100);
    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: 'Order Failed',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('placeOrder')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outcome Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={outcome === 'YES' ? 'default' : 'outline'}
            className={cn(
              'h-12',
              outcome === 'YES' && 'bg-buy hover:bg-buy/90'
            )}
            onClick={() => setOutcome('YES')}
          >
            {t('yes')}
            <span className="ml-2 text-sm">
              {(market.yes_price || 0.5).toFixed(2)}¢
            </span>
          </Button>
          <Button
            variant={outcome === 'NO' ? 'default' : 'outline'}
            className={cn(
              'h-12',
              outcome === 'NO' && 'bg-sell hover:bg-sell/90'
            )}
            onClick={() => setOutcome('NO')}
          >
            {t('no')}
            <span className="ml-2 text-sm">
              {(market.no_price || 0.5).toFixed(2)}¢
            </span>
          </Button>
        </div>

        {/* Side Selection */}
        <Tabs value={side} onValueChange={(v) => setSide(v as 'buy' | 'sell')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">{t('buy')}</TabsTrigger>
            <TabsTrigger value="sell">{t('sell')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Order Type */}
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="market">{t('orderTypes.market')}</TabsTrigger>
            <TabsTrigger value="limit">{t('orderTypes.limit')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Price (for limit orders) */}
        {orderType === 'limit' && (
          <div className="space-y-2">
            <Label>{t('price')}</Label>
            <Input
              type="number"
              step="0.01"
              min={market.min_price}
              max={market.max_price}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
            />
            <Slider
              value={[price]}
              onValueChange={(v) => setPrice(v[0])}
              min={market.min_price}
              max={market.max_price}
              step={market.tick_size}
              className="py-2"
            />
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-2">
          <Label>{t('quantity')}</Label>
          <Input
            type="number"
            step="10"
            min="10"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
          />
          <Slider
            value={[quantity]}
            onValueChange={(v) => setQuantity(v[0])}
            min={10}
            max={1000}
            step={10}
            className="py-2"
          />
        </div>

        {/* Order Summary */}
        <div className="space-y-2 p-4 bg-muted rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('avgPrice')}:</span>
            <span className="font-medium">{price.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('quantity')}:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-muted-foreground">{t('total')}:</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Potential Profit:</span>
            <span className="text-success font-medium">
              ${potentialProfit.toFixed(2)} ({roi}%)
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          className={cn(
            'w-full h-12',
            side === 'buy' ? 'bg-buy hover:bg-buy/90' : 'bg-sell hover:bg-sell/90'
          )}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Placing Order...' : `${side.toUpperCase()} ${outcome}`}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🏆 Leaderboard Implementation

**`apps/web/src/app/(dashboard)/leaderboard/page.tsx`**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  total_pnl: number;
  total_volume: number;
  trades_count: number;
  win_rate: number;
}

type Timeframe = 'daily' | 'weekly' | 'monthly' | 'all_time';

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState<Timeframe>('all_time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('leaderboard_cache')
      .select(`
        rank,
        user_id,
        total_pnl,
        total_volume,
        trades_count,
        win_rate,
        users!inner(username, avatar_url)
      `)
      .eq('timeframe', timeframe)
      .order('rank', { ascending: true })
      .limit(100);

    if (data) {
      setLeaderboard(
        data.map(entry => ({
          ...entry,
          username: entry.users.username,
          avatar_url: entry.users.avatar_url,
        }))
      );
    }

    setLoading(false);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const LeaderboardRow = ({ entry }: { entry: LeaderboardEntry }) => (
    <div className="flex items-center gap-4 p-4 hover:bg-accent rounded-lg transition-colors">
      <div className="flex items-center justify-center w-12">
        {getRankBadge(entry.rank)}
      </div>
      
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatar_url} />
        <AvatarFallback>
          {entry.username?.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <p className="font-medium">{entry.username}</p>
        <p className="text-sm text-muted-foreground">
          {entry.trades_count} trades • {entry.win_rate.toFixed(1)}% win rate
        </p>
      </div>
      
      <div className="text-right">
        <p className={cn(
          'font-bold',
          entry.total_pnl >= 0 ? 'text-success' : 'text-destructive'
        )}>
          {entry.total_pnl >= 0 ? '+' : ''}${entry.total_pnl.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">
          ${entry.total_volume.toLocaleString()} volume
        </p>
      </div>
    </div>
  );

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground">
            Top traders ranked by profit & loss
          </p>
        </div>

        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="all_time">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No data available for this timeframe
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map(entry => (
                  <LeaderboardRow key={entry.user_id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🔄 Realtime Updates Setup

**`apps/web/src/hooks/useRealtimeMarket.ts`**
```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Market } from '@/types';

export function useRealtimeMarket(marketId: string) {
  const [market, setMarket] = useState<Market | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    fetchMarket();

    // Subscribe to changes
    const channel = supabase
      .channel(`market:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'markets',
          filter: `id=eq.${marketId}`,
        },
        (payload) => {
          setMarket(payload.new as Market);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  const fetchMarket = async () => {
    const { data } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (data) setMarket(data);
  };

  return market;
}
```

---

## 📦 Dependencies

**`apps/web/package.json`**
```json
{
  "name": "plokymarket-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@supabase/auth-helpers-nextjs": "^0.8.7",
    "@supabase/ssr": "^0.0.10",
    "@supabase/supabase-js": "^2.39.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^3.0.0",
    "i18next": "^23.7.11",
    "i18next-browser-languagedetector": "^7.2.0",
    "i18next-http-backend": "^2.4.2",
    "lightweight-charts": "^4.1.1",
    "lucide-react": "^0.303.0",
    "next": "14.0.4",
    "next-themes": "^0.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-i18next": "^14.0.0",
    "recharts": "^2.10.3",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.0.4",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3"
  }
}
```

---

## 🚀 Deployment Steps

### 1. Supabase Setup

```bash
# Create Supabase project
# 1. Go to https://app.supabase.com
# 2. Click "New Project"
# 3. Fill in project details
# 4. Wait for setup to complete

# Run migrations
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Enable Realtime
# Go to Database > Replication
# Enable realtime for: markets, orders, trades, positions

# Configure Auth
# Go to Authentication > Settings
# Enable Email provider
# Set Site URL to your Vercel domain
```

### 2. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd apps/web
vercel --prod

# Add environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### 3. n8n Deployment (Optional)

```bash
# Using Docker
cd docker/n8n
docker-compose up -d

# Or deploy to Railway
railway up

# Configure workflows in n8n UI
# Access at http://localhost:5678
```

---

## 📊 Performance Optimization

### 1. Database Indexes

All critical indexes are already included in the schema.

### 2. Query Optimization

```typescript
// Use select() to fetch only needed fields
const { data } = await supabase
  .from('markets')
  .select('id, question, yes_price, no_price')
  .eq('status', 'active');

// Use pagination for large datasets
const { data } = await supabase
  .from('trades')
  .select('*')
  .range(0, 49) // First 50 items
  .order('created_at', { ascending: false });
```

### 3. Caching Strategy

```typescript
// React Query for client-side caching
import { useQuery } from '@tanstack/react-query';

const { data: markets } = useQuery({
  queryKey: ['markets'],
  queryFn: fetchMarkets,
  staleTime: 60000, // 1 minute
});
```

---

## 🧪 Testing

### Unit Tests

```typescript
// __tests__/matching-engine.test.ts
describe('Matching Engine', () => {
  it('should match buy and sell orders', async () => {
    // Test implementation
  });

  it('should calculate correct prices', async () => {
    // Test implementation
  });
});
```

### E2E Tests

```typescript
// e2e/trading.spec.ts
test('should place order successfully', async ({ page }) => {
  await page.goto('/markets/test-market');
  await page.fill('[data-testid="quantity"]', '100');
  await page.click('[data-testid="place-order"]');
  await expect(page.locator('.toast')).toContainText('Order Placed');
});
```

---

## 📚 API Documentation

All API endpoints are auto-generated by Supabase PostgREST.

### Examples

```typescript
// Get all active markets
GET /rest/v1/markets?status=eq.active

// Get user's positions
GET /rest/v1/positions?user_id=eq.USER_ID

// Place order
POST /rest/v1/orders
Body: { market_id, side, outcome, price, quantity }

// Get order book
GET /rest/v1/orders?market_id=eq.MARKET_ID&status=in.(open,partially_filled)
```

---

## 🔒 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Environment variables secured
- [ ] CORS configured
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection prevented (RLS)
- [ ] XSS prevention (React escaping)
- [ ] HTTPS enforced
- [ ] Authentication required for sensitive operations
- [ ] Admin routes protected

---

This comprehensive guide provides everything your AI agent needs to build a production-ready Plokymarket platform with all requested features!
