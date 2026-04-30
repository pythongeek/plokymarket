# 🚀 PLOKYMARKET BD - PRODUCTION MASTER GUIDE
## Complete Step-by-Step Instructions for AI Agent

**Version:** 2.0  
**Date:** February 22, 2026  
**Goal:** Transform PlokyMarket into a flawless, production-ready platform better than Polymarket.com  
**Default Language:** Bangla (বাংলা)  
**Target Market:** Bangladesh  

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Critical Issues Found](#3-critical-issues-found)
4. [Phase 1: Foundation Fixes (Days 1-3)](#4-phase-1-foundation-fixes-days-1-3)
5. [Phase 2: Core Trading System (Days 4-6)](#5-phase-2-core-trading-system-days-4-6)
6. [Phase 3: Bangladesh Integration (Days 7-10)](#6-phase-3-bangladesh-integration-days-7-10)
7. [Phase 4: Advanced Features (Days 11-14)](#7-phase-4-advanced-features-days-11-14)
8. [Phase 5: Launch Preparation (Days 15-18)](#8-phase-5-launch-preparation-days-15-18)
9. [Production Checklist](#9-production-checklist)
10. [Post-Launch Monitoring](#10-post-launch-monitoring)

---

## 1. EXECUTIVE SUMMARY

### Project Vision
Build **PlokyMarket BD** - a Bangladesh-focused prediction market platform that:
- ✅ Exceeds Polymarket.com in features and UX
- ✅ Uses **Bangla as default language** (English secondary)
- ✅ Integrates local payment systems (bKash, Nagad, Rocket)
- ✅ Focuses on Bangladesh-specific markets (BPL, Elections, Cricket)
- ✅ Complies with Bangladesh regulations

### Current Status
| Component | Status | Completion |
|-----------|--------|------------|
| Database Schema | ✅ Working | 95% |
| Admin Portal | ✅ Working | 90% |
| Event Creation | ✅ Working | 100% |
| Matching Engine | ⚠️ Partial | 70% |
| Trading UI | ⚠️ Partial | 60% |
| Payment System | ❌ Missing | 0% |
| Bangla Localization | ⚠️ Partial | 50% |
| Mobile App | ❌ Missing | 0% |

### Timeline to Production
**Fast Track: 18 Days** (with parallel work streams)

---

## 2. CURRENT STATE ANALYSIS

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │  Auth Pages │ │ Market Pages│ │   Admin Portal      │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js API)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │  /api/auth  │ │ /api/orders │ │   /api/admin/*      │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase PG)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐    │
│  │  users  │ │ markets │ │ orders  │ │ payment_tx      │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 18, TypeScript 5.5 |
| Styling | Tailwind CSS 3.4, shadcn/ui |
| State | Zustand, TanStack Query v5 |
| Backend | Next.js API Routes, Supabase |
| Database | PostgreSQL 15 (Supabase) |
| Realtime | Supabase Realtime |
| Payments | bKash API, Nagad API |
| AI | Gemini AI (Google) |
| Hosting | Vercel |

---

## 3. CRITICAL ISSUES FOUND

### 🔴 CRITICAL (Must Fix Before Launch)

| # | Issue | Impact | Fix Time |
|---|-------|--------|----------|
| 1 | Supabase client `await` missing in 15+ API routes | All API calls fail | 1 hour |
| 2 | CLOB OrderStatus case mismatch ("BUY" vs "buy") | Trading broken | 2 hours |
| 3 | FeedService missing 5 methods | Social features broken | 3 hours |
| 4 | Mock wallet address in production | Fund loss risk | 2 hours |
| 5 | Admin withdrawal processing API missing | Can't process withdrawals | 4 hours |
| 6 | Missing 2FA for withdrawals | Security vulnerability | 6 hours |
| 7 | No real-time USDT/BDT rate API | Financial loss | 2 hours |

### 🟡 HIGH (Fix Before Public Beta)

| # | Issue | Impact | Fix Time |
|---|-------|--------|----------|
| 8 | Rate limiter uses in-memory Map | Resets on serverless restart | 2 hours |
| 9 | OrderBook API no caching | Performance issue | 3 hours |
| 10 | Missing composite DB indexes | Slow queries | 1 hour |
| 11 | No wallet optimistic locking | Race conditions possible | 2 hours |
| 12 | KYC admin panel missing | Can't verify users | 5 hours |

### 🟢 MEDIUM (Fix After Launch)

| # | Issue | Impact | Fix Time |
|---|-------|--------|----------|
| 13 | snoozeUntil variable undefined | Notification bug | 15 min |
| 14 | workflowStore selectStats missing | Dashboard error | 20 min |
| 15 | Cancellation status wrong comparison | Order cancel fails | 30 min |

---

## 4. PHASE 1: FOUNDATION FIXES (Days 1-3)

### Day 1: Critical Bug Fixes

#### Task 1.1: Fix Supabase Client `await` Issue (CRITICAL)

**Problem:** 15+ API routes have `const supabase = createClient()` without `await`

**Files to Fix:**
```
src/app/api/deposits/request/route.ts
src/app/api/wallet/balance/route.ts
src/app/api/p2p-sellers/route.ts
src/app/api/orders/route.ts
src/app/api/trades/route.ts
src/app/api/markets/route.ts
src/app/api/portfolio/route.ts
src/app/api/notifications/route.ts
src/app/api/follows/route.ts
src/app/api/admin/*/route.ts (all admin routes)
```

**Fix Pattern:**
```typescript
// ❌ WRONG - Current broken code
const supabase = createClient();
const { data } = await supabase.from('users').select('*');

// ✅ CORRECT - Fixed code
const supabase = await createClient();
const { data } = await supabase.from('users').select('*');
```

**Bash Command to Find All Broken Files:**
```bash
grep -r "= createClient()" src/app/api/ --include="*.ts" -l
```

**AI Agent Instructions:**
1. Find all files with `= createClient()` pattern
2. Add `await` before every `createClient()` call
3. Ensure the function is marked as `async`
4. Test each API route after fixing

---

#### Task 1.2: Fix CLOB Type Case Mismatch (CRITICAL)

**Problem:** Type definitions use uppercase ("BUY", "SELL", "OPEN") but database uses lowercase

**Files to Fix:**
```
src/lib/clob/types.ts
src/lib/clob/test-limit.ts
src/lib/clob/service.ts
src/lib/cancellation/service.ts
hooks/useTIF.ts
```

**Fix in `src/lib/clob/types.ts`:**
```typescript
// ❌ WRONG
export type Side = "BUY" | "SELL";
export type OrderStatus = "OPEN" | "FILLED" | "CANCELED";

// ✅ CORRECT
export type Side = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled" | "partially_filled" | "expired";
```

**Fix in `src/lib/cancellation/service.ts`:**
```typescript
// ❌ WRONG
if (order.status === "CANCELLING") { ... }

// ✅ CORRECT
if (order.status === "cancelling") { ... }
```

---

#### Task 1.3: Fix FeedService Missing Methods (CRITICAL)

**Problem:** `src/app/api/follows/route.ts` imports methods that don't exist in FeedService

**Create `src/lib/services/feedService.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';

export class FeedService {
  async getFollowStatus(followerId: string, followingId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    return !!data;
  }

  async getFollowers(userId: string): Promise<string[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);
    return data?.map(f => f.follower_id) || [];
  }

  async getFollowing(userId: string): Promise<string[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    return data?.map(f => f.following_id) || [];
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
  }
}

export const feedService = new FeedService();
```

---

### Day 2: Database & Security Fixes

#### Task 2.1: Add Critical Database Indexes

**Run in Supabase SQL Editor:**
```sql
-- Order book queries (most frequent)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_book
  ON orders (market_id, outcome, side, status, price)
  WHERE status IN ('open', 'partially_filled');

-- User orders lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_active
  ON orders (user_id, status, created_at DESC)
  WHERE status NOT IN ('filled', 'cancelled', 'expired');

-- Trades for portfolio
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_user
  ON trades (buyer_id, seller_id, created_at DESC);

-- Wallet balance version for optimistic locking
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;
```

---

#### Task 2.2: Fix Rate Limiter (Redis-backed)

**Replace `src/lib/security.ts`:**
```typescript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const loginRateLimiter = {
  isRateLimited: async (key: string): Promise<boolean> => {
    const count = await redis.get<number>(`ratelimit:login:${key}`);
    return (count ?? 0) >= 5;
  },
  
  recordAttempt: async (key: string): Promise<void> => {
    const k = `ratelimit:login:${key}`;
    await redis.incr(k);
    await redis.expire(k, 900); // 15 min TTL
  },
  
  reset: async (key: string): Promise<void> => {
    await redis.del(`ratelimit:login:${key}`);
  },
};

export const withdrawalRateLimiter = {
  isRateLimited: async (userId: string): Promise<boolean> => {
    const count = await redis.get<number>(`ratelimit:withdrawal:${userId}`);
    return (count ?? 0) >= 3; // Max 3 withdrawals per hour
  },
  
  recordAttempt: async (userId: string): Promise<void> => {
    const k = `ratelimit:withdrawal:${userId}`;
    await redis.incr(k);
    await redis.expire(k, 3600); // 1 hour TTL
  },
};
```

---

#### Task 2.3: Add Security Headers Middleware

**Update `src/middleware.ts`:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Security Headers
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // ... rest of middleware
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

### Day 3: Missing APIs & Services

#### Task 3.1: Create Admin Withdrawal Processing API

**Create `src/app/api/admin/withdrawals/process/route.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single();
      
    if (!profile?.is_admin && !profile?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { withdrawal_id, action, note } = await request.json();
    
    if (action === 'approve') {
      // 1. Get withdrawal details
      const { data: withdrawal } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('id', withdrawal_id)
        .single();
        
      if (!withdrawal || withdrawal.status !== 'pending') {
        return NextResponse.json({ error: 'Invalid withdrawal' }, { status: 400 });
      }
      
      // 2. Process bKash/Nagad payout
      const payoutResult = await processPayout(withdrawal);
      
      if (!payoutResult.success) {
        return NextResponse.json({ error: 'Payout failed' }, { status: 500 });
      }
      
      // 3. Update withdrawal status
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
          provider_response: payoutResult,
          note
        })
        .eq('id', withdrawal_id);
        
      // 4. Release balance hold
      await supabase.rpc('release_balance_hold', { p_id: withdrawal_id });
      
    } else if (action === 'reject') {
      // Reject: restore balance, notify user
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user.id,
          note
        })
        .eq('id', withdrawal_id);
        
      await supabase.rpc('reject_withdrawal', { 
        p_id: withdrawal_id, 
        p_note: note 
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Withdrawal processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processPayout(withdrawal: any) {
  // Integrate with bKash/Nagad payout API
  // Return success/failure with transaction details
  return { success: true, transactionId: 'TXN' + Date.now() };
}
```

---

#### Task 3.2: Create Real-Time Exchange Rate API

**Create `src/app/api/exchange-rate/route.ts`:**
```typescript
import { NextResponse } from 'next/server';

// Cache the rate for 5 minutes
let cachedRate: number | null = null;
let lastFetch: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (cachedRate && (now - lastFetch) < CACHE_TTL) {
      return NextResponse.json({
        rate: cachedRate,
        source: 'cache',
        updated_at: new Date(lastFetch).toISOString()
      });
    }
    
    // Fetch from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=bdt',
      { next: { revalidate: 300 } }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch rate');
    }
    
    const data = await response.json();
    const rate = data?.tether?.bdt ?? 120; // fallback to 120
    
    // Update cache
    cachedRate = rate;
    lastFetch = now;
    
    return NextResponse.json({
      rate,
      source: 'coingecko',
      updated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Exchange rate error:', error);
    // Return fallback rate on error
    return NextResponse.json({
      rate: 120,
      source: 'fallback',
      updated_at: new Date().toISOString()
    });
  }
}
```

---

## 5. PHASE 2: CORE TRADING SYSTEM (Days 4-6)

### Day 4: Order Book & Matching Engine

#### Task 4.1: Create OrderBook Service with Caching

**Create `src/lib/services/orderBookService.ts`:**
```typescript
import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase/server';

const redis = Redis.fromEnv();
const CACHE_TTL = 1; // 1 second for near real-time

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookSnapshot {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  lastPrice: number;
  timestamp: string;
}

export class OrderBookService {
  async getOrderBook(marketId: string): Promise<OrderBookSnapshot> {
    const cacheKey = `orderbook:${marketId}`;
    
    // Try cache first
    const cached = await redis.get<OrderBookSnapshot>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Reconstruct from database
    const supabase = await createClient();
    
    // Get YES outcome orders
    const { data: yesOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('outcome', 'yes')
      .in('status', ['open', 'partially_filled'])
      .order('price', { ascending: false });
    
    // Get NO outcome orders  
    const { data: noOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('outcome', 'no')
      .in('status', ['open', 'partially_filled'])
      .order('price', { ascending: false });
    
    // Aggregate bids (buy YES + sell NO)
    const bids = this.aggregateOrders(
      [
        ...(yesOrders?.filter(o => o.side === 'buy') || []),
        ...(noOrders?.filter(o => o.side === 'sell') || [])
      ],
      'desc'
    );
    
    // Aggregate asks (sell YES + buy NO)
    const asks = this.aggregateOrders(
      [
        ...(yesOrders?.filter(o => o.side === 'sell') || []),
        ...(noOrders?.filter(o => o.side === 'buy') || [])
      ],
      'asc'
    );
    
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 1;
    
    const snapshot: OrderBookSnapshot = {
      bids,
      asks,
      spread: bestAsk - bestBid,
      lastPrice: (bestBid + bestAsk) / 2,
      timestamp: new Date().toISOString()
    };
    
    // Cache for 1 second
    await redis.setex(cacheKey, CACHE_TTL, snapshot);
    
    return snapshot;
  }
  
  private aggregateOrders(
    orders: any[],
    sort: 'asc' | 'desc'
  ): OrderBookLevel[] {
    const aggregated = new Map<number, number>();
    
    for (const order of orders) {
      const remaining = order.size - order.filled_size;
      if (remaining > 0) {
        const current = aggregated.get(order.price) || 0;
        aggregated.set(order.price, current + remaining);
      }
    }
    
    const result = Array.from(aggregated.entries())
      .map(([price, size]) => ({ price, size, total: price * size }))
      .sort((a, b) => sort === 'desc' ? b.price - a.price : a.price - b.price);
    
    return result;
  }
  
  async invalidateCache(marketId: string): Promise<void> {
    await redis.del(`orderbook:${marketId}`);
  }
}

export const orderBookService = new OrderBookService();
```

---

#### Task 4.2: Create Order Placement API

**Create `src/app/api/orders/route.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { orderBookService } from '@/lib/services/orderBookService';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { market_id, side, outcome, price, size, order_type = 'limit' } = body;
    
    // Validation
    if (!market_id || !side || !outcome || !price || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    if (price < 0.01 || price > 0.99) {
      return NextResponse.json({ error: 'Price must be between 0.01 and 0.99' }, { status: 400 });
    }
    
    if (size < 10) {
      return NextResponse.json({ error: 'Minimum order size is ৳10' }, { status: 400 });
    }
    
    // Calculate required funds
    const requiredFunds = price * size;
    
    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (!wallet || wallet.balance < requiredFunds) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    
    // Lock funds for buy orders
    if (side === 'buy') {
      const { error: lockError } = await supabase.rpc('lock_funds', {
        p_user_id: user.id,
        p_amount: requiredFunds
      });
      
      if (lockError) {
        return NextResponse.json({ error: 'Failed to lock funds' }, { status: 500 });
      }
    }
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        market_id,
        side,
        outcome,
        order_type,
        price,
        size,
        filled_size: 0,
        status: 'open'
      })
      .select()
      .single();
      
    if (orderError) {
      // Unlock funds on error
      if (side === 'buy') {
        await supabase.rpc('unlock_funds', {
          p_user_id: user.id,
          p_amount: requiredFunds
        });
      }
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
    
    // Trigger matching engine
    await supabase.rpc('match_order', { p_order_id: order.id });
    
    // Invalidate order book cache
    await orderBookService.invalidateCache(market_id);
    
    return NextResponse.json({ success: true, order });
    
  } catch (error) {
    console.error('Order placement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const marketId = searchParams.get('market_id');
    const status = searchParams.get('status');
    
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (marketId) {
      query = query.eq('market_id', marketId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: orders, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
    
    return NextResponse.json({ orders });
    
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### Day 5: Portfolio & Wallet Services

#### Task 5.1: Create Portfolio Service

**Create `src/lib/services/portfolioService.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';

export interface Position {
  market_id: string;
  market_question: string;
  outcome: 'yes' | 'no';
  size: number;
  avg_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_invested: number;
  total_pnl: number;
  positions: Position[];
}

export class PortfolioService {
  async getPortfolio(userId: string): Promise<PortfolioSummary> {
    const supabase = await createClient();
    
    // Get all positions
    const { data: positions } = await supabase
      .from('positions')
      .select(`
        *,
        market:markets(id, question, yes_price, no_price)
      `)
      .eq('user_id', userId)
      .gt('size', 0);
    
    if (!positions || positions.length === 0) {
      return {
        total_value: 0,
        total_invested: 0,
        total_pnl: 0,
        positions: []
      };
    }
    
    const formattedPositions: Position[] = positions.map(p => {
      const currentPrice = p.outcome === 'yes' 
        ? p.market.yes_price 
        : p.market.no_price;
      
      const invested = p.size * p.avg_price;
      const currentValue = p.size * currentPrice;
      const unrealizedPnl = currentValue - invested;
      
      return {
        market_id: p.market_id,
        market_question: p.market.question,
        outcome: p.outcome,
        size: p.size,
        avg_price: p.avg_price,
        current_price: currentPrice,
        unrealized_pnl: unrealizedPnl,
        realized_pnl: p.realized_pnl || 0
      };
    });
    
    const totalInvested = formattedPositions.reduce((sum, p) => 
      sum + (p.size * p.avg_price), 0);
    const totalValue = formattedPositions.reduce((sum, p) => 
      sum + (p.size * p.current_price), 0);
    
    return {
      total_value: totalValue,
      total_invested: totalInvested,
      total_pnl: totalValue - totalInvested,
      positions: formattedPositions
    };
  }
  
  async getTradeHistory(userId: string, limit = 50): Promise<any[]> {
    const supabase = await createClient();
    
    const { data: trades } = await supabase
      .from('trades')
      .select(`
        *,
        market:markets(id, question)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    return trades || [];
  }
}

export const portfolioService = new PortfolioService();
```

---

#### Task 5.2: Create Wallet Service

**Create `src/lib/services/walletService.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  available_balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'settlement' | 'fee';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export class WalletService {
  async getWallet(userId: string): Promise<Wallet | null> {
    const supabase = await createClient();
    
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (!wallet) return null;
    
    return {
      ...wallet,
      available_balance: wallet.balance - wallet.locked_balance
    };
  }
  
  async getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const supabase = await createClient();
    
    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    return transactions || [];
  }
  
  async getBalance(userId: string): Promise<{ balance: number; locked: number; available: number }> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      return { balance: 0, locked: 0, available: 0 };
    }
    
    return {
      balance: wallet.balance,
      locked: wallet.locked_balance,
      available: wallet.available_balance
    };
  }
}

export const walletService = new WalletService();
```

---

### Day 6: Real-time Updates

#### Task 6.1: Create Real-time Hook

**Create `src/hooks/useRealtime.ts`:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeOrders(marketId: string) {
  const [orders, setOrders] = useState<any[]>([]);
  const supabase = createClient();
  
  useEffect(() => {
    // Initial fetch
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', marketId)
        .in('status', ['open', 'partially_filled'])
        .order('created_at', { ascending: false });
      setOrders(data || []);
    };
    
    fetchOrders();
    
    // Subscribe to changes
    const channel = supabase
      .channel(`orders:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `market_id=eq.${marketId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => 
              prev.map(o => o.id === payload.new.id ? payload.new : o)
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => 
              prev.filter(o => o.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);
  
  return orders;
}

export function useRealtimeTrades(marketId: string) {
  const [trades, setTrades] = useState<any[]>([]);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: false })
        .limit(50);
      setTrades(data || []);
    };
    
    fetchTrades();
    
    const channel = supabase
      .channel(`trades:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `market_id=eq.${marketId}`
        },
        (payload) => {
          setTrades(prev => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);
  
  return trades;
}
```

---

## 6. PHASE 3: BANGLADESH INTEGRATION (Days 7-10)

### Day 7: Bangla Localization

#### Task 7.1: Create i18n Configuration

**Create `src/i18n/config.ts`:**
```typescript
export const i18n = {
  defaultLocale: 'bn', // Bangla as default
  locales: ['bn', 'en'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const localeLabels: Record<Locale, string> = {
  bn: 'বাংলা',
  en: 'English',
};
```

---

#### Task 7.2: Create Bangla Translation File

**Create `src/i18n/messages/bn.json`:**
```json
{
  "nav": {
    "home": "হোম",
    "markets": "বাজারসমূহ",
    "portfolio": "পোর্টফোলিও",
    "leaderboard": "লিডারবোর্ড",
    "wallet": "ওয়ালেট",
    "admin": "অ্যাডমিন"
  },
  "auth": {
    "login": "লগইন",
    "register": "নিবন্ধন",
    "logout": "লগআউট",
    "email": "ইমেইল",
    "password": "পাসওয়ার্ড",
    "forgotPassword": "পাসওয়ার্ড ভুলে গেছেন?",
    "noAccount": "অ্যাকাউন্ট নেই?",
    "hasAccount": "অ্যাকাউন্ট আছে?",
    "loginSuccess": "সফলভাবে লগইন হয়েছে",
    "registerSuccess": "সফলভাবে নিবন্ধন হয়েছে"
  },
  "trade": {
    "buy": "কিনুন",
    "sell": "বিক্রি করুন",
    "yes": "হ্যাঁ",
    "no": "না",
    "price": "দাম",
    "shares": "শেয়ার",
    "total": "মোট",
    "placeOrder": "অর্ডার দিন",
    "marketOrder": "মার্কেট অর্ডার",
    "limitOrder": "লিমিট অর্ডার",
    "orderBook": "অর্ডার বুক",
    "recentTrades": "সাম্প্রতিক ট্রেডসমূহ",
    "yourOrders": "আপনার অর্ডারসমূহ",
    "cancelOrder": "অর্ডার বাতিল করুন",
    "orderPlaced": "অর্ডার সফলভাবে দেওয়া হয়েছে",
    "orderCancelled": "অর্ডার বাতিল করা হয়েছে",
    "insufficientBalance": "অপর্যাপ্ত ব্যালেন্স"
  },
  "wallet": {
    "deposit": "জমা করুন",
    "withdraw": "উত্তোলন করুন",
    "balance": "ব্যালেন্স",
    "available": "উপলব্ধ",
    "locked": "লক করা",
    "bdt": "৳ টাকা",
    "depositAmount": "জমার পরিমাণ",
    "withdrawAmount": "উত্তোলনের পরিমাণ",
    "paymentMethod": "পেমেন্ট পদ্ধতি",
    "bkash": "বিকাশ",
    "nagad": "নগদ",
    "rocket": "রকেট",
    "bank": "ব্যাংক ট্রান্সফার",
    "transactionHistory": "লেনদেনের ইতিহাস",
    "depositSuccess": "জমা সফল হয়েছে",
    "withdrawalSuccess": "উত্তোলন সফল হয়েছে"
  },
  "market": {
    "politics": "রাজনীতি",
    "sports": "খেলাধুলা",
    "entertainment": "বিনোদন",
    "cricket": "ক্রিকেট",
    "technology": "প্রযুক্তি",
    "economics": "অর্থনীতি",
    "crypto": "ক্রিপ্টো",
    "active": "সক্রিয়",
    "closed": "বন্ধ",
    "resolved": "সমাধান হয়েছে",
    "volume": "ভলিউম",
    "liquidity": "লিকুইডিটি",
    "tradingEnds": "ট্রেডিং শেষ",
    "resolutionDate": "সমাধানের তারিখ"
  },
  "portfolio": {
    "totalValue": "মোট মূল্য",
    "totalInvested": "মোট বিনিয়োগ",
    "totalPnl": "মোট লাভ/ক্ষতি",
    "unrealizedPnl": "অবাস্তব লাভ/ক্ষতি",
    "realizedPnl": "বাস্তব লাভ/ক্ষতি",
    "positions": "পজিশনসমূহ",
    "noPositions": "কোনো পজিশন নেই",
    "tradeHistory": "ট্রেড ইতিহাস"
  },
  "common": {
    "loading": "লোড হচ্ছে...",
    "error": "ত্রুটি",
    "success": "সফল",
    "cancel": "বাতিল",
    "confirm": "নিশ্চিত",
    "save": "সংরক্ষণ করুন",
    "delete": "মুছুন",
    "edit": "সম্পাদনা করুন",
    "search": "অনুসন্ধান",
    "filter": "ফিল্টার",
    "sort": "সাজান",
    "viewAll": "সব দেখুন",
    "loadMore": "আরো লোড করুন",
    "noData": "কোনো ডেটা নেই",
    "comingSoon": "শীঘ্রই আসছে"
  }
}
```

---

### Day 8: Payment Integration - bKash

#### Task 8.1: Create bKash Service

**Create `src/lib/payments/bkash.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';

interface bKashConfig {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
}

interface TokenResponse {
  token: string;
  expiresIn: number;
}

interface PaymentResponse {
  paymentID: string;
  paymentCreateTime: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
}

export class bKashService {
  private config: bKashConfig;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  
  constructor() {
    this.config = {
      baseUrl: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh',
      appKey: process.env.BKASH_APP_KEY!,
      appSecret: process.env.BKASH_APP_SECRET!,
      username: process.env.BKASH_USERNAME!,
      password: process.env.BKASH_PASSWORD!,
    };
  }
  
  private async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }
    
    const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': this.config.username,
        'password': this.config.password,
      },
      body: JSON.stringify({
        app_key: this.config.appKey,
        app_secret: this.config.appSecret,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get bKash token');
    }
    
    const data = await response.json();
    this.token = data.id_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    return this.token;
  }
  
  async createPayment(amount: number, invoiceNumber: string, callbackUrl: string): Promise<PaymentResponse> {
    const token = await this.getToken();
    
    const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'X-APP-Key': this.config.appKey,
      },
      body: JSON.stringify({
        mode: '0011',
        payerReference: invoiceNumber,
        callbackURL: callbackUrl,
        amount: amount.toString(),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: invoiceNumber,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create bKash payment');
    }
    
    return response.json();
  }
  
  async executePayment(paymentID: string): Promise<any> {
    const token = await this.getToken();
    
    const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'X-APP-Key': this.config.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to execute bKash payment');
    }
    
    return response.json();
  }
  
  async queryPayment(paymentID: string): Promise<any> {
    const token = await this.getToken();
    
    const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/payment/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'X-APP-Key': this.config.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to query bKash payment');
    }
    
    return response.json();
  }
  
  async payout(phoneNumber: string, amount: number, invoiceNumber: string): Promise<any> {
    const token = await this.getToken();
    
    const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'X-APP-Key': this.config.appKey,
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: 'BDT',
        merchantInvoiceNumber: invoiceNumber,
        receiverMSISDN: phoneNumber,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to process bKash payout');
    }
    
    return response.json();
  }
}

export const bkashService = new bKashService();
```

---

#### Task 8.2: Create Deposit API with bKash

**Create `src/app/api/wallet/deposit/route.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { bkashService } from '@/lib/payments/bkash';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { amount, method } = body;
    
    // Validation
    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum deposit is ৳100' }, { status: 400 });
    }
    
    if (!method || !['bkash', 'nagad', 'rocket'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    
    // Generate invoice number
    const invoiceNumber = `DEP${Date.now()}${user.id.slice(0, 8)}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/deposit/callback`;
    
    let paymentData: any;
    
    if (method === 'bkash') {
      // Create bKash payment
      paymentData = await bkashService.createPayment(amount, invoiceNumber, callbackUrl);
    } else {
      // Handle other methods similarly
      return NextResponse.json({ error: 'Method not yet implemented' }, { status: 400 });
    }
    
    // Create pending transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount,
        method,
        status: 'pending',
        transaction_id: paymentData.paymentID,
        provider_response: paymentData,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min expiry
      })
      .select()
      .single();
      
    if (txError) {
      console.error('Transaction creation error:', txError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      transaction,
      paymentUrl: paymentData.bkashURL,
    });
    
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### Day 9: Nagad Integration

#### Task 9.1: Create Nagad Service

**Create `src/lib/payments/nagad.ts`:**
```typescript
import crypto from 'crypto';

interface NagadConfig {
  baseUrl: string;
  merchantId: string;
  merchantPrivateKey: string;
  merchantPublicKey: string;
  nagadPublicKey: string;
}

export class NagadService {
  private config: NagadConfig;
  
  constructor() {
    this.config = {
      baseUrl: process.env.NAGAD_BASE_URL || 'https://sandbox.nagad.com',
      merchantId: process.env.NAGAD_MERCHANT_ID!,
      merchantPrivateKey: process.env.NAGAD_MERCHANT_PRIVATE_KEY!,
      merchantPublicKey: process.env.NAGAD_MERCHANT_PUBLIC_KEY!,
      nagadPublicKey: process.env.NAGAD_PUBLIC_KEY!,
    };
  }
  
  private generateSignature(data: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(this.config.merchantPrivateKey, 'base64');
  }
  
  private generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }
  
  async initializePayment(amount: number, orderId: string): Promise<any> {
    const timestamp = Date.now().toString();
    const random = this.generateRandomString(20);
    
    const sensitiveData = {
      merchantId: this.config.merchantId,
      datetime: timestamp,
      orderId,
      challenge: random,
    };
    
    const encryptedData = this.encryptData(JSON.stringify(sensitiveData));
    const signature = this.generateSignature(JSON.stringify(sensitiveData));
    
    const response = await fetch(`${this.config.baseUrl}/api/dfs/check-out/initialize/${this.config.merchantId}/${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateTime: timestamp,
        sensitiveData: encryptedData,
        signature,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize Nagad payment');
    }
    
    return response.json();
  }
  
  private encryptData(data: string): string {
    // Implement Nagad's specific encryption
    // This is a simplified version - use actual Nagad SDK
    return Buffer.from(data).toString('base64');
  }
  
  async verifyPayment(paymentRefId: string): Promise<any> {
    const response = await fetch(`${this.config.baseUrl}/api/dfs/verify/payment/${paymentRefId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify Nagad payment');
    }
    
    return response.json();
  }
}

export const nagadService = new NagadService();
```

---

### Day 10: Withdrawal System

#### Task 10.1: Create Withdrawal API

**Create `src/app/api/wallet/withdraw/route.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withdrawalRateLimiter } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Rate limiting
    const isLimited = await withdrawalRateLimiter.isRateLimited(user.id);
    if (isLimited) {
      return NextResponse.json(
        { error: 'Too many withdrawal requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { amount, method, phoneNumber, accountName } = body;
    
    // Validation
    if (!amount || amount < 500) {
      return NextResponse.json({ error: 'Minimum withdrawal is ৳500' }, { status: 400 });
    }
    
    if (!method || !['bkash', 'nagad', 'rocket', 'bank'].includes(method)) {
      return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 });
    }
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (!wallet || wallet.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    
    // Check KYC status for large withdrawals
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_verified, kyc_level')
      .eq('id', user.id)
      .single();
      
    const dailyLimit = profile?.kyc_verified ? 50000 : 10000;
    
    // Check daily withdrawal limit
    const today = new Date().toISOString().split('T')[0];
    const { data: todayWithdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', today)
      .in('status', ['pending', 'approved']);
      
    const todayTotal = todayWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
    
    if (todayTotal + amount > dailyLimit) {
      return NextResponse.json(
        { error: `Daily withdrawal limit exceeded. Limit: ৳${dailyLimit}` },
        { status: 400 }
      );
    }
    
    // Lock funds
    const { error: lockError } = await supabase.rpc('lock_withdrawal_funds', {
      p_user_id: user.id,
      p_amount: amount
    });
    
    if (lockError) {
      return NextResponse.json({ error: 'Failed to lock funds' }, { status: 500 });
    }
    
    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount,
        method,
        phone_number: phoneNumber,
        account_name: accountName,
        status: 'pending',
      })
      .select()
      .single();
      
    if (withdrawalError) {
      // Unlock funds on error
      await supabase.rpc('unlock_withdrawal_funds', {
        p_user_id: user.id,
        p_amount: amount
      });
      return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
    }
    
    // Record rate limit
    await withdrawalRateLimiter.recordAttempt(user.id);
    
    return NextResponse.json({
      success: true,
      withdrawal,
      message: 'Withdrawal request submitted. It will be processed within 24 hours.',
    });
    
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 7. PHASE 4: ADVANCED FEATURES (Days 11-14)

### Day 11: KYC System

#### Task 11.1: Create KYC API

**Create `src/app/api/kyc/submit/route.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const nidFront = formData.get('nidFront') as File;
    const nidBack = formData.get('nidBack') as File;
    const selfie = formData.get('selfie') as File;
    const nidNumber = formData.get('nidNumber') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    
    // Validation
    if (!nidFront || !nidBack || !selfie || !nidNumber || !dateOfBirth) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    // Validate NID number (Bangladesh NID is 10, 13, or 17 digits)
    const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/;
    if (!nidRegex.test(nidNumber)) {
      return NextResponse.json({ error: 'Invalid NID number' }, { status: 400 });
    }
    
    // Upload files to Supabase Storage
    const uploadFile = async (file: File, path: string) => {
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .upload(`${user.id}/${path}`, file, {
          contentType: file.type,
          upsert: true,
        });
      if (error) throw error;
      return data.path;
    };
    
    const [nidFrontPath, nidBackPath, selfiePath] = await Promise.all([
      uploadFile(nidFront, 'nid-front.jpg'),
      uploadFile(nidBack, 'nid-back.jpg'),
      uploadFile(selfie, 'selfie.jpg'),
    ]);
    
    // Create KYC submission
    const { data: kyc, error: kycError } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: user.id,
        nid_number: nidNumber,
        date_of_birth: dateOfBirth,
        nid_front_url: nidFrontPath,
        nid_back_url: nidBackPath,
        selfie_url: selfiePath,
        status: 'pending',
      })
      .select()
      .single();
      
    if (kycError) {
      return NextResponse.json({ error: 'Failed to submit KYC' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'KYC documents submitted successfully. Verification may take 1-2 business days.',
      kyc,
    });
    
  } catch (error) {
    console.error('KYC submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### Day 12: Admin KYC Panel

#### Task 12.1: Create Admin KYC Review Page

**Create `src/app/sys-cmd-7x9k2/kyc/page.tsx`:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface KYCSubmission {
  id: string;
  user_id: string;
  user_email: string;
  nid_number: string;
  date_of_birth: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  nid_front_url: string;
  nid_back_url: string;
  selfie_url: string;
}

export default function KYCAdminPage() {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    fetchSubmissions();
  }, []);
  
  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('kyc_submissions')
      .select(`
        *,
        user:user_profiles(email)
      `)
      .order('created_at', { ascending: false });
      
    setSubmissions(data || []);
    setLoading(false);
  };
  
  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('kyc_submissions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) {
      toast.error('Failed to approve KYC');
      return;
    }
    
    // Update user profile
    await supabase
      .from('user_profiles')
      .update({ kyc_verified: true, kyc_level: 1 })
      .eq('id', selectedSubmission?.user_id);
      
    toast.success('KYC approved successfully');
    fetchSubmissions();
    setSelectedSubmission(null);
  };
  
  const handleReject = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('kyc_submissions')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', id);
      
    if (error) {
      toast.error('Failed to reject KYC');
      return;
    }
    
    toast.success('KYC rejected');
    fetchSubmissions();
    setSelectedSubmission(null);
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">KYC Verification</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Submissions</h2>
          {submissions.filter(s => s.status === 'pending').map(submission => (
            <div
              key={submission.id}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{submission.user_email}</p>
                  <p className="text-sm text-gray-500">NID: {submission.nid_number}</p>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            </div>
          ))}
        </div>
        
        {selectedSubmission && (
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Review Documents</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">NID Front</p>
                <img
                  src={selectedSubmission.nid_front_url}
                  alt="NID Front"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">NID Back</p>
                <img
                  src={selectedSubmission.nid_back_url}
                  alt="NID Back"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Selfie</p>
                <img
                  src={selectedSubmission.selfie_url}
                  alt="Selfie"
                  className="w-full h-48 object-cover rounded"
                />
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => handleApprove(selectedSubmission.id)}
                  className="flex-1 bg-green-600"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(selectedSubmission.id, 'Documents unclear')}
                  variant="destructive"
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Day 13: 2FA for Withdrawals

#### Task 13.1: Create 2FA Service

**Create `src/lib/security/2fa.ts`:**
```typescript
import { Redis } from '@upstash/redis';
import { createClient } from '@/lib/supabase/server';

const redis = Redis.fromEnv();

export class TwoFactorService {
  async generateOTP(userId: string): Promise<string> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 5-minute expiry
    await redis.setex(`2fa:${userId}`, 300, otp);
    
    // TODO: Send OTP via SMS using Bangladesh SMS gateway
    // For now, we'll use email
    await this.sendOTPEmail(userId, otp);
    
    return otp;
  }
  
  async verifyOTP(userId: string, otp: string): Promise<boolean> {
    const storedOTP = await redis.get<string>(`2fa:${userId}`);
    
    if (!storedOTP || storedOTP !== otp) {
      return false;
    }
    
    // Delete OTP after successful verification
    await redis.del(`2fa:${userId}`);
    
    return true;
  }
  
  private async sendOTPEmail(userId: string, otp: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: user } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (!user) return;
    
    // Send email using your email service
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Your PlokyMarket Withdrawal OTP',
    //   body: `Your OTP is: ${otp}. Valid for 5 minutes.`,
    // });
  }
  
  async require2FA(userId: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { data: settings } = await supabase
      .from('user_security_settings')
      .select('withdrawal_2fa_enabled')
      .eq('user_id', userId)
      .single();
      
    return settings?.withdrawal_2fa_enabled ?? false;
  }
}

export const twoFactorService = new TwoFactorService();
```

---

### Day 14: Leaderboard & Analytics

#### Task 14.1: Create Leaderboard Service

**Create `src/lib/services/leaderboardService.ts`:**
```typescript
import { createClient } from '@/lib/supabase/server';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_trades: number;
  total_volume: number;
  profit_loss: number;
  win_rate: number;
}

export class LeaderboardService {
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time', limit = 100): Promise<LeaderboardEntry[]> {
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('leaderboard_cache')
      .select(`
        *,
        user:user_profiles(id, full_name, avatar_url)
      `)
      .eq('period', period)
      .order('rank', { ascending: true })
      .limit(limit);
      
    return (data || []).map((entry, index) => ({
      rank: entry.rank || index + 1,
      user_id: entry.user_id,
      full_name: entry.user?.full_name || 'Anonymous',
      avatar_url: entry.user?.avatar_url,
      total_trades: entry.total_trades,
      total_volume: entry.total_volume,
      profit_loss: entry.profit_loss,
      win_rate: entry.win_rate,
    }));
  }
  
  async getUserRank(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'): Promise<number | null> {
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('leaderboard_cache')
      .select('rank')
      .eq('user_id', userId)
      .eq('period', period)
      .single();
      
    return data?.rank || null;
  }
  
  async recalculateLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'all_time'): Promise<void> {
    const supabase = await createClient();
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'all_time':
        startDate = new Date(0);
        break;
    }
    
    // Calculate rankings
    const { data: rankings } = await supabase.rpc('calculate_leaderboard', {
      p_period: period,
      p_start_date: startDate.toISOString(),
    });
    
    // Update cache
    for (let i = 0; i < rankings.length; i++) {
      const entry = rankings[i];
      await supabase
        .from('leaderboard_cache')
        .upsert({
          user_id: entry.user_id,
          period,
          rank: i + 1,
          total_trades: entry.total_trades,
          total_volume: entry.total_volume,
          profit_loss: entry.profit_loss,
          win_rate: entry.win_rate,
          calculated_at: new Date().toISOString(),
        });
    }
  }
}

export const leaderboardService = new LeaderboardService();
```

---

## 8. PHASE 5: LAUNCH PREPARATION (Days 15-18)

### Day 15: Environment Variables

#### Task 15.1: Complete Environment Setup

**Required Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://plokymarket.bd
NEXT_PUBLIC_APP_NAME=PlokyMarket BD

# bKash Payment
BKASH_APP_KEY=your-bkash-app-key
BKASH_APP_SECRET=your-bkash-app-secret
BKASH_USERNAME=your-bkash-username
BKASH_PASSWORD=your-bkash-password
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh

# Nagad Payment
NAGAD_MERCHANT_ID=your-nagad-merchant-id
NAGAD_MERCHANT_PRIVATE_KEY=your-nagad-private-key
NAGAD_MERCHANT_PUBLIC_KEY=your-nagad-public-key
NAGAD_PUBLIC_KEY=nagad-public-key
NAGAD_BASE_URL=https://sandbox.nagad.com

# Upstash Redis (Rate Limiting & Caching)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Upstash QStash (Scheduled Tasks)
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key
UPSTASH_WORKFLOW_BASE_URL=https://your-app.vercel.app

# Security
NEXTAUTH_SECRET=your-32-char-random-secret
CRON_SECRET=your-cron-secret
MASTER_CRON_SECRET=your-master-cron-secret

# AI (Gemini)
GEMINI_API_KEY=your-gemini-api-key

# Notifications (Optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
```

---

### Day 16: Testing

#### Task 16.1: Create Test Suite

**Create `tests/integration.test.ts`:**
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@/lib/supabase/client';

describe('PlokyMarket Integration Tests', () => {
  let supabase: any;
  let testUser: any;
  
  beforeAll(async () => {
    supabase = createClient();
    
    // Create test user
    const { data } = await supabase.auth.signUp({
      email: 'test@plokymarket.bd',
      password: 'TestPassword123!',
    });
    testUser = data.user;
  });
  
  describe('Authentication', () => {
    it('should register a new user', async () => {
      expect(testUser).toBeDefined();
      expect(testUser.email).toBe('test@plokymarket.bd');
    });
    
    it('should create wallet on signup', async () => {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', testUser.id)
        .single();
        
      expect(wallet).toBeDefined();
      expect(wallet.balance).toBe(0);
    });
  });
  
  describe('Trading', () => {
    it('should place a buy order', async () => {
      // Add funds first
      await supabase.rpc('add_test_funds', {
        p_user_id: testUser.id,
        p_amount: 1000
      });
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: 'test-market-id',
          side: 'buy',
          outcome: 'yes',
          price: 0.5,
          size: 100,
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
    
    it('should get order book', async () => {
      const response = await fetch('/api/orderbook/test-market-id');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.bids).toBeDefined();
      expect(data.asks).toBeDefined();
    });
  });
  
  describe('Wallet', () => {
    it('should get wallet balance', async () => {
      const response = await fetch('/api/wallet/balance');
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.balance).toBeDefined();
      expect(data.available).toBeDefined();
    });
  });
});
```

---

### Day 17: Performance Optimization

#### Task 17.1: Add Database Connection Pooling

**Update `supabase/config.toml`:**
```toml
[db]
pool_size = 20
max_connections = 100
```

---

#### Task 17.2: Add API Response Caching

**Update `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  headers: async () => [
    {
      source: '/api/markets',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=60, stale-while-revalidate=300',
        },
      ],
    },
    {
      source: '/api/orderbook/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=1, stale-while-revalidate=5',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

---

### Day 18: Final Deployment

#### Task 18.1: Production Checklist

**Pre-Launch Checklist:**
- [ ] All TypeScript errors fixed (`npm run type-check`)
- [ ] All tests passing (`npm run test`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Payment APIs tested in sandbox
- [ ] Admin credentials secured
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (Mixpanel) configured

**Deploy Commands:**
```bash
# 1. Run type check
npm run type-check

# 2. Run tests
npm run test

# 3. Build locally
npm run build

# 4. Deploy to Vercel
vercel --prod

# 5. Verify deployment
vercel logs --follow
```

---

## 9. PRODUCTION CHECKLIST

### Code Quality
- [ ] All TypeScript errors resolved (0 errors)
- [ ] Unit tests > 80% coverage
- [ ] Integration tests for critical paths
- [ ] No console errors/warnings
- [ ] Error handling on all APIs
- [ ] Rate limiting on sensitive endpoints

### Security
- [ ] Row-Level Security (RLS) on all tables
- [ ] Admin authentication required
- [ ] Rate limiting active (Redis-backed)
- [ ] Security headers configured
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] 2FA for withdrawals

### Database
- [ ] All migrations applied
- [ ] Critical indexes created
- [ ] Composite indexes for order book
- [ ] Optimistic locking for wallets
- [ ] Backup strategy implemented

### Payments
- [ ] bKash sandbox tested
- [ ] Nagad sandbox tested
- [ ] Withdrawal processing tested
- [ ] KYC verification flow tested
- [ ] Daily limits enforced

### Bangladesh-Specific
- [ ] Bangla translations complete
- [ ] Local market categories added
- [ ] NID-based KYC implemented
- [ ] Bangladesh Bank compliance reviewed
- [ ] Local support channels ready

### Performance
- [ ] Order book caching active
- [ ] API response caching configured
- [ ] Database query optimization
- [ ] Image optimization enabled
- [ ] CDN configured

### Monitoring
- [ ] Sentry error tracking
- [ ] Vercel Analytics
- [ ] Database monitoring
- [ ] Uptime monitoring
- [ ] Alert system configured

---

## 10. POST-LAUNCH MONITORING

### Daily (First Week)
- [ ] Check error logs (Sentry)
- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Verify payment processing
- [ ] Review user registrations

### Weekly (First Month)
- [ ] Performance review
- [ ] Security audit
- [ ] User feedback analysis
- [ ] Feature usage analytics
- [ ] Database optimization

### Monthly (Ongoing)
- [ ] Full security audit
- [ ] Performance optimization
- [ ] Feature roadmap review
- [ ] Compliance check
- [ ] Disaster recovery test

---

## 📞 SUPPORT & RESOURCES

### Emergency Contacts
- **Technical Lead:** [Your Contact]
- **Bangladesh Operations:** [Local Partner]
- **Compliance Advisor:** [Legal Contact]

### Documentation
- **Admin Guide:** `docs/ADMIN_GUIDE.md`
- **API Reference:** `docs/API_REFERENCE.md`
- **Deployment Guide:** `docs/DEPLOYMENT.md`

### External Resources
- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **bKash Developer:** https://developer.bka.sh
- **Nagad Developer:** https://developer.nagad.com.bd

---

**Document Version:** 2.0  
**Last Updated:** February 22, 2026  
**Status:** Ready for AI Agent Execution  

**🚀 LET'S BUILD THE BEST PREDICTION MARKET FOR BANGLADESH! 🇧🇩**
