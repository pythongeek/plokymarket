# PLOKYMARKET: Complete Implementation Guide - Part 1
## Full-Stack Prediction Market Platform for Bangladesh

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Feature Gap Analysis](#2-feature-gap-analysis)
3. [System Architecture](#3-system-architecture)
4. [Database Schema (Complete)](#4-database-schema-complete)
5. [Backend Implementation](#5-backend-implementation)

---

## 1. EXECUTIVE SUMMARY

### What We're Building
A full-featured prediction market platform tailored for Bangladesh, combining Polymarket's proven mechanics with local context, language support, and payment integration.

### Core Philosophy
- **Bangla-First**: Default language is Bangla (Bengali)
- **Mobile-First**: 80% of Bangladesh users access via mobile
- **bKash/Nagad Native**: Local payment integration
- **Community-Driven**: Social features for Bangladeshi users

---

## 2. FEATURE GAP ANALYSIS

### Current Implementation Status

| Feature Category | Polymarket | Plokymarket Status | Priority |
|-----------------|------------|-------------------|----------|
| **Authentication** | Google, Email, Web3 | ✅ Email/Password | Done |
| **Localization** | English Only | ✅ Bangla/English/Hindi | Done |
| **Theme** | Dark Only | ✅ Dark/Light Toggle | Done |
| **Basic Trading** | Buy/Sell | ✅ Simple Buy/Sell | Done |
| **Order Book** | Full CLOB | 🟡 Basic Visual | High |
| **Price Charts** | Advanced | 🟡 Basic Line Chart | High |
| **Market Types** | Binary, Categorical, Scalar | 🔴 Binary Only | High |
| **Limit Orders** | Full Support | 🔴 Missing | Critical |
| **Portfolio** | Advanced Analytics | 🟡 Basic UI | Medium |
| **Leaderboard** | PnL, Volume, Timeframes | 🔴 Missing | High |
| **Liquidity Rewards** | Daily Rewards | 🔴 Missing | Medium |
| **Comments** | Full Threading | 🟡 Basic | Medium |
| **Activity Feed** | Real-time | 🔴 Missing | Medium |
| **Notifications** | Multi-channel | 🔴 Missing | Medium |
| **Admin Dashboard** | Comprehensive | 🔴 Missing | High |
| **Oracle System** | UMA Optimistic | 🔴 Missing | Critical |
| **Market Resolution** | Automated | 🔴 Manual | Critical |
| **Dispute Mechanism** | 7-day Challenge | 🔴 Missing | High |
| **KYC/AML** | Basic | 🔴 Missing | Medium |
| **Risk Management** | Advanced | 🔴 Missing | High |

### What's Still Missing (Critical Path)

#### Phase 1: Trading Infrastructure (CRITICAL)
1. **Full CLOB Order Book** - Bid/ask depth visualization, Price ladder, Order inversion
2. **Limit Order System** - Order placement with price, Order cancellation, Partial fills
3. **Advanced Matching Engine** - Price-time priority, Partial fill handling, Self-trade prevention

#### Phase 2: Market Infrastructure (CRITICAL)
4. **Oracle Integration** - AI-powered resolution, Multi-source verification, Dispute mechanism
5. **Market Resolution** - Automated settlement, Winner payout, Loser token burn
6. **Multi-Outcome Markets** - Categorical markets, Scalar markets

#### Phase 3: User Experience (HIGH)
7. **Portfolio Analytics** - PnL tracking, Position history, Performance charts
8. **Leaderboard System** - Daily/Weekly/Monthly/All-time rankings
9. **Social Features** - Comments with threading, Activity feed, User follows

#### Phase 4: Platform Features (MEDIUM)
10. **Liquidity Rewards** - Maker rebates, Spread-based rewards
11. **Notification System** - Order fills, Market resolutions, Price alerts
12. **Admin Dashboard** - Market creation, User management, Analytics

---

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web App   │  │  Mobile App │  │   PWA       │  │  Admin Panel │        │
│  │  (Next.js)  │  │  (React Native)│  │             │  (Next.js)   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Next.js API Routes / Edge Functions               │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │   Auth API  │ │ Market API  │ │  Order API  │ │  User API   │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Matching  │  │   Oracle    │  │   Wallet    │  │ Notification│        │
│  │   Engine    │  │   Service   │  │   Service   │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Supabase   │  │    Redis    │  │  ClickHouse │  │   IPFS      │        │
│  │  (Primary)  │  │   (Cache)   │  │ (Analytics) │  │  (Files)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  bKash API  │  │  Nagad API  │  │  News API   │  │   n8n       │        │
│  │             │  │             │  │             │  │ Workflows   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Tech Stack

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Charts**: Lightweight Charts (TradingView)
- **i18n**: i18next + react-i18next
- **Theme**: next-themes

#### Backend
- **API**: Next.js API Routes + Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis (Upstash)
- **Realtime**: Supabase Realtime
- **Queue**: Bull MQ (Redis)

#### Services
- **Matching Engine**: Node.js + WebSocket
- **Oracle**: n8n + AI (Gemini/Claude)
- **Notifications**: Novu / OneSignal

#### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **Storage**: Supabase Storage
- **CDN**: Cloudflare
- **Monitoring**: Sentry

---

## 4. DATABASE SCHEMA (COMPLETE)

### Core Tables

```sql
-- ============================================
-- USERS & AUTHENTICATION
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    preferred_language VARCHAR(10) DEFAULT 'bn',
    theme VARCHAR(20) DEFAULT 'dark',
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    kyc_status VARCHAR(20) DEFAULT 'unverified',
    kyc_submitted_at TIMESTAMPTZ,
    kyc_verified_at TIMESTAMPTZ,
    nid_front_url TEXT,
    nid_back_url TEXT,
    selfie_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID REFERENCES users(id)
);

-- ============================================
-- WALLETS & BALANCES
-- ============================================
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_balance BIGINT DEFAULT 0,
    locked_balance BIGINT DEFAULT 0,
    total_deposited BIGINT DEFAULT 0,
    total_withdrawn BIGINT DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'BDT',
    daily_deposit_limit BIGINT DEFAULT 5000000,
    daily_withdrawal_limit BIGINT DEFAULT 5000000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    amount BIGINT NOT NULL,
    fee BIGINT DEFAULT 0,
    net_amount BIGINT NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    payment_method VARCHAR(30),
    payment_provider_id VARCHAR(100),
    order_id UUID,
    trade_id UUID,
    market_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- ============================================
-- MARKETS
-- ============================================
CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    title_bn VARCHAR(500),
    description TEXT,
    description_bn TEXT,
    category_id UUID REFERENCES categories(id),
    subcategory_id UUID REFERENCES categories(id),
    tags TEXT[],
    market_type VARCHAR(20) NOT NULL DEFAULT 'binary',
    outcomes JSONB,
    scalar_min DECIMAL(20, 8),
    scalar_max DECIMAL(20, 8),
    scalar_unit VARCHAR(50),
    resolution_source TEXT,
    resolution_criteria TEXT,
    resolution_criteria_bn TEXT,
    resolver_address VARCHAR(100),
    trading_end_at TIMESTAMPTZ NOT NULL,
    resolution_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active',
    liquidity BIGINT DEFAULT 0,
    volume BIGINT DEFAULT 0,
    yes_price INTEGER DEFAULT 50,
    no_price INTEGER DEFAULT 50,
    spread INTEGER DEFAULT 2,
    maker_fee_rate DECIMAL(5, 4) DEFAULT 0.000,
    taker_fee_rate DECIMAL(5, 4) DEFAULT 0.020,
    reward_pool BIGINT DEFAULT 0,
    daily_reward BIGINT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    winning_outcome_id VARCHAR(50),
    resolution_proof TEXT,
    is_verified BOOLEAN DEFAULT false,
    featured_order INTEGER,
    search_vector TSVECTOR
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_bn VARCHAR(100),
    icon VARCHAR(50),
    color VARCHAR(20),
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- ORDERS & TRADING
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    market_id UUID NOT NULL REFERENCES markets(id),
    outcome_id VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    order_type VARCHAR(20) NOT NULL DEFAULT 'limit',
    price INTEGER NOT NULL,
    original_size INTEGER NOT NULL,
    remaining_size INTEGER NOT NULL,
    filled_size INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open',
    time_in_force VARCHAR(20) DEFAULT 'gtc',
    expires_at TIMESTAMPTZ,
    total BIGINT NOT NULL,
    fee BIGINT DEFAULT 0,
    is_maker BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT valid_price CHECK (price >= 1 AND price <= 99),
    CONSTRAINT valid_size CHECK (original_size > 0)
);

CREATE MATERIALIZED VIEW order_book AS
SELECT 
    market_id,
    outcome_id,
    side,
    price,
    SUM(remaining_size) as total_size,
    COUNT(*) as order_count
FROM orders
WHERE status IN ('open', 'partially_filled')
GROUP BY market_id, outcome_id, side, price
ORDER BY market_id, outcome_id, side, 
    CASE WHEN side = 'buy' THEN price END DESC,
    CASE WHEN side = 'sell' THEN price END ASC;

CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id),
    outcome_id VARCHAR(50) NOT NULL,
    taker_order_id UUID NOT NULL REFERENCES orders(id),
    taker_user_id UUID NOT NULL REFERENCES users(id),
    taker_side VARCHAR(10) NOT NULL,
    maker_order_id UUID NOT NULL REFERENCES orders(id),
    maker_user_id UUID NOT NULL REFERENCES users(id),
    price INTEGER NOT NULL,
    size INTEGER NOT NULL,
    total BIGINT NOT NULL,
    taker_fee BIGINT NOT NULL,
    maker_fee BIGINT NOT NULL,
    maker_rebate BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT positive_trade CHECK (size > 0 AND price > 0)
);

-- ============================================
-- POSITIONS
-- ============================================
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    market_id UUID NOT NULL REFERENCES markets(id),
    outcome_id VARCHAR(50) NOT NULL,
    total_shares INTEGER DEFAULT 0,
    avg_entry_price INTEGER,
    total_invested BIGINT DEFAULT 0,
    total_sold BIGINT DEFAULT 0,
    realized_pnl BIGINT DEFAULT 0,
    unrealized_pnl BIGINT DEFAULT 0,
    current_price INTEGER,
    current_value BIGINT,
    is_open BOOLEAN DEFAULT true,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, market_id, outcome_id)
);

CREATE TABLE position_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id),
    action VARCHAR(20) NOT NULL,
    shares INTEGER NOT NULL,
    price INTEGER NOT NULL,
    total BIGINT NOT NULL,
    fee BIGINT DEFAULT 0,
    pnl BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORACLE & RESOLUTION
-- ============================================
CREATE TABLE oracle_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id),
    request_type VARCHAR(30) NOT NULL,
    requested_by UUID REFERENCES users(id),
    proposed_outcome_id VARCHAR(50),
    proposed_outcome_text TEXT,
    confidence_score DECIMAL(5, 4),
    evidence_urls TEXT[],
    evidence_text TEXT,
    ai_analysis JSONB,
    ai_recommendation VARCHAR(50),
    ai_confidence DECIMAL(5, 4),
    status VARCHAR(20) DEFAULT 'pending',
    challenge_period_start TIMESTAMPTZ,
    challenge_period_end TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    final_outcome_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE oracle_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES oracle_requests(id),
    disputer_id UUID NOT NULL REFERENCES users(id),
    dispute_reason TEXT NOT NULL,
    counter_evidence TEXT[],
    bond_amount BIGINT NOT NULL,
    bond_status VARCHAR(20) DEFAULT 'locked',
    status VARCHAR(20) DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    content_bn TEXT,
    parent_id UUID REFERENCES comments(id),
    depth INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    user_position VARCHAR(10),
    shares_held INTEGER,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id),
    following_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    market_id UUID REFERENCES markets(id),
    order_id UUID REFERENCES orders(id),
    trade_id UUID REFERENCES trades(id),
    comment_id UUID REFERENCES comments(id),
    title TEXT,
    title_bn TEXT,
    description TEXT,
    description_bn TEXT,
    metadata JSONB,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LEADERBOARD
-- ============================================
CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    timeframe VARCHAR(20) NOT NULL,
    rank INTEGER,
    trading_volume BIGINT DEFAULT 0,
    trades_count INTEGER DEFAULT 0,
    realized_pnl BIGINT DEFAULT 0,
    unrealized_pnl BIGINT DEFAULT 0,
    total_pnl BIGINT DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 4),
    score BIGINT DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, timeframe, period_start)
);

-- ============================================
-- REWARDS & NOTIFICATIONS
-- ============================================
CREATE TABLE reward_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    market_id UUID REFERENCES markets(id),
    reward_type VARCHAR(30) NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    calculation_basis JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    distributed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    title_bn TEXT,
    body TEXT,
    body_bn TEXT,
    action_url TEXT,
    action_text TEXT,
    market_id UUID,
    order_id UUID,
    trade_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    delivered_via TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRICE HISTORY
-- ============================================
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id),
    outcome_id VARCHAR(50) NOT NULL,
    open_price INTEGER NOT NULL,
    high_price INTEGER NOT NULL,
    low_price INTEGER NOT NULL,
    close_price INTEGER NOT NULL,
    volume BIGINT DEFAULT 0,
    bucket_time TIMESTAMPTZ NOT NULL,
    interval VARCHAR(10) NOT NULL,
    UNIQUE(market_id, outcome_id, bucket_time, interval)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_orders_market ON orders(market_id, status);
CREATE INDEX idx_orders_user ON orders(user_id, status);
CREATE INDEX idx_orders_price ON orders(market_id, outcome_id, side, price);
CREATE INDEX idx_trades_market ON trades(market_id, created_at);
CREATE INDEX idx_trades_user ON trades(taker_user_id, created_at);
CREATE INDEX idx_positions_user ON positions(user_id, is_open);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_comments_market ON comments(market_id, created_at DESC);
CREATE INDEX idx_activity_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_price_history ON price_history(market_id, outcome_id, interval, bucket_time DESC);
```

---

## 5. BACKEND IMPLEMENTATION

### 5.1 Project Structure

```
/src
├── /app
│   ├── /api
│   │   ├── /auth
│   │   ├── /markets
│   │   ├── /orders
│   │   ├── /trades
│   │   ├── /portfolio
│   │   ├── /wallet
│   │   ├── /leaderboard
│   │   ├── /notifications
│   │   └── /webhooks
│   ├── /(routes)
│   └── layout.tsx
├── /lib
│   ├── /supabase
│   ├── /redis
│   ├── /matching-engine
│   ├── /oracle
│   ├── /notifications
│   ├── /payments
│   └── /utils
├── /types
├── /hooks
└── /services
```

### 5.2 Core Services

#### Matching Engine Service

```typescript
// /src/lib/matching-engine/engine.ts

interface Order {
  id: string;
  userId: string;
  marketId: string;
  outcomeId: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  price: number;
  originalSize: number;
  remainingSize: number;
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled';
  createdAt: Date;
}

interface Trade {
  id: string;
  marketId: string;
  outcomeId: string;
  takerOrderId: string;
  takerUserId: string;
  takerSide: 'buy' | 'sell';
  makerOrderId: string;
  makerUserId: string;
  price: number;
  size: number;
  total: number;
  takerFee: number;
  makerFee: number;
  createdAt: Date;
}

export class MatchingEngine {
  private orderBooks: Map<string, OrderBook> = new Map();
  
  private getOrderBook(marketId: string, outcomeId: string): OrderBook {
    const key = `${marketId}:${outcomeId}`;
    if (!this.orderBooks.has(key)) {
      this.orderBooks.set(key, new OrderBook());
    }
    return this.orderBooks.get(key)!;
  }
  
  async submitOrder(order: Order): Promise<Trade[]> {
    const trades: Trade[] = [];
    const orderBook = this.getOrderBook(order.marketId, order.outcomeId);
    
    await this.lockFunds(order);
    
    if (order.orderType === 'market') {
      trades.push(...await this.executeMarketOrder(order, orderBook));
    } else {
      const matched = await this.matchLimitOrder(order, orderBook);
      trades.push(...matched.trades);
      
      if (order.remainingSize > 0) {
        orderBook.addOrder(order);
        await this.updateOrderStatus(order);
      }
    }
    
    await this.updateMarketPrice(order.marketId, order.outcomeId);
    await this.broadcastOrderBook(order.marketId, order.outcomeId);
    
    return trades;
  }
  
  private async matchLimitOrder(
    order: Order, 
    orderBook: OrderBook
  ): Promise<{ trades: Trade[]; filled: boolean }> {
    const trades: Trade[] = [];
    const oppositeSide = order.side === 'buy' ? 'sell' : 'buy';
    
    while (order.remainingSize > 0) {
      const bestOrder = orderBook.getBestOrder(oppositeSide);
      if (!bestOrder) break;
      
      const canMatch = order.side === 'buy' 
        ? bestOrder.price <= order.price
        : bestOrder.price >= order.price;
      
      if (!canMatch) break;
      
      const tradeSize = Math.min(order.remainingSize, bestOrder.remainingSize);
      const trade = await this.createTrade(order, bestOrder, tradeSize);
      trades.push(trade);
      
      order.remainingSize -= tradeSize;
      bestOrder.remainingSize -= tradeSize;
      
      if (bestOrder.remainingSize === 0) {
        bestOrder.status = 'filled';
        orderBook.removeOrder(bestOrder);
      } else {
        bestOrder.status = 'partially_filled';
      }
      
      await this.updateOrderStatus(bestOrder);
      await this.updatePosition(order, bestOrder, trade);
    }
    
    if (order.remainingSize === 0) {
      order.status = 'filled';
    } else if (trades.length > 0) {
      order.status = 'partially_filled';
    }
    
    return { trades, filled: order.remainingSize === 0 };
  }
  
  private async createTrade(taker: Order, maker: Order, size: number): Promise<Trade> {
    const price = maker.price;
    const total = size * price;
    
    const takerFee = Math.floor(total * TAKER_FEE_RATE);
    const makerFee = Math.floor(total * MAKER_FEE_RATE);
    const makerRebate = Math.floor(total * MAKER_REBATE_RATE);
    
    const trade: Trade = {
      id: generateUUID(),
      marketId: taker.marketId,
      outcomeId: taker.outcomeId,
      takerOrderId: taker.id,
      takerUserId: taker.userId,
      takerSide: taker.side,
      makerOrderId: maker.id,
      makerUserId: maker.userId,
      price,
      size,
      total,
      takerFee,
      makerFee: makerFee - makerRebate,
      createdAt: new Date()
    };
    
    await supabase.from('trades').insert(trade);
    await this.processTradeSettlement(trade);
    await this.recordTradeActivity(trade);
    
    return trade;
  }
  
  async cancelOrder(orderId: string, userId: string): Promise<boolean> {
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (!order || !['open', 'partially_filled'].includes(order.status)) {
      return false;
    }
    
    const orderBook = this.getOrderBook(order.market_id, order.outcome_id);
    orderBook.removeOrder(order);
    
    await this.releaseLockedFunds(order);
    
    await supabase
      .from('orders')
      .update({ 
        status: 'cancelled', 
        cancelled_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', orderId);
    
    await this.broadcastOrderBook(order.market_id, order.outcome_id);
    
    return true;
  }
}

class OrderBook {
  private bids: Map<number, Order[]> = new Map();
  private asks: Map<number, Order[]> = new Map();
  private ordersById: Map<string, Order> = new Map();
  
  addOrder(order: Order): void {
    const sideMap = order.side === 'buy' ? this.bids : this.asks;
    
    if (!sideMap.has(order.price)) {
      sideMap.set(order.price, []);
    }
    
    sideMap.get(order.price)!.push(order);
    this.ordersById.set(order.id, order);
    
    sideMap.get(order.price)!.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
  }
  
  removeOrder(order: Order): void {
    const sideMap = order.side === 'buy' ? this.bids : this.asks;
    const orders = sideMap.get(order.price);
    
    if (orders) {
      const index = orders.findIndex(o => o.id === order.id);
      if (index > -1) {
        orders.splice(index, 1);
        if (orders.length === 0) {
          sideMap.delete(order.price);
        }
      }
    }
    
    this.ordersById.delete(order.id);
  }
  
  getBestOrder(side: 'buy' | 'sell'): Order | null {
    const sideMap = side === 'buy' ? this.bids : this.asks;
    
    if (sideMap.size === 0) return null;
    
    const prices = Array.from(sideMap.keys());
    const bestPrice = side === 'buy' 
      ? Math.max(...prices)
      : Math.min(...prices);
    
    const orders = sideMap.get(bestPrice);
    return orders && orders.length > 0 ? orders[0] : null;
  }
  
  getDepth(side: 'buy' | 'sell', levels: number = 10): { price: number; size: number }[] {
    const sideMap = side === 'buy' ? this.bids : this.asks;
    const prices = Array.from(sideMap.keys()).sort((a, b) => 
      side === 'buy' ? b - a : a - b
    );
    
    return prices.slice(0, levels).map(price => ({
      price,
      size: sideMap.get(price)!.reduce((sum, o) => sum + o.remainingSize, 0)
    }));
  }
}
```

---

See Part 2 for Oracle Service, Payment Integration, Frontend Implementation, Trading Engine details, Security Implementation, Bangladesh-Specific Features, AI Agent Coding Instructions, and Deployment Guide.
