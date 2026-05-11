# Polymarket Analysis + Plokymarket Backend Plan

## Part 1: How Polymarket Manages Order Books

### 1.1 API Architecture (from live analysis)

```
┌───────────────────────────────────────────────────────────┐
│  Polymarket CLOB (Central Limit Order Book)              │
└───────────────────────────────────────────────────────────┘

GET /markets/{id}           → Market metadata, fees, tokens
GET /book?token_id={id}     → Order book (bids[] + asks[])
GET /last-trade-price       → Latest trade price + side

Order Book Structure:
  bids: [{ price: "0.52", size: "146.34" }, ...]  // Buy orders
  asks: [{ price: "0.94", size: "2500" }, ...]    // Sell orders
```

### 1.2 What Polymarket Shows on Market Cards (Homepage)

```
┌─────────────────────────────────────────────────────┐
│  [Event Image - Full Width]                          │
│  ┌───────────────────────────────────────────────┐ │
│  │ Category Badge + Icon                            │ │
│  │                                                │ │
│  │ "Will Tesla stock hit $300 before July 1?"      │ │
│  │                                                │ │
│  │  YES  52¢      NO  48¢                        │ │
│  │  ████████████████████████████████████████████    │ │
│  │  ┌──────────────────────────────────┐       │ │
│  │  │ $716K volume  ·  2 months left          │       │ │
│  │  └──────────────────────────────────┘       │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 1.3 What Polymarket Shows on Market Detail Page

```
┌─────────────────────────────────────────────────────┐
│  MARKET HEADER                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Image]  Will Tesla stock hit $300?            │ │
│  │                                                │ │
│  │  52% chance  ·  $716K Vol  ·  $43K Liquidity  │ │
│  │                                                │ │
│  │  [  BUY YES 52¢  ]    [  BUY NO 48¢  ]      │ │
│  │  [  SELL YES     ]    [  SELL NO      ]      │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  ORDER BOOK                                        │
│  ┌───────────────┐  ┌───────────────┐    │
│  │ BIDS (Buy)      │  │ ASKS (Sell)     │    │
│  │ Size    Price   │  │ Price   Size    │    │
│  │ 146     $0.52   │  │ $0.94   2500    │    │
│  │  70     $0.51   │  │ $0.96    250    │    │
│  │ 49K     $0.50   │  │ $0.97   2087    │    │
│  │ 11K     $0.49   │  │ $0.98   7000    │    │
│  │ 10K     $0.48   │  │ $0.99   2500    │    │
│  └───────────────┘  └───────────────┘    │
│                                                    │
│  PRICE HISTORY CHART                               │
│  ┌───────────────────────────────────────────────┐ │
│  │  ─/───────╱───────╱────╱──────╱────╲───────╲───────│ │
│  │ ╱                                        ╲      │ │
│  │╱                                          ╲─────│ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  RECENT TRADES                                     │
│  Time      Side    Price   Size                   │
│  2m ago    BUY     $0.54   $500                   │
│  5m ago    SELL    $0.53   $200                   │
└─────────────────────────────────────────────────────┘
```

---

## Part 2: Kid-Friendly Visual Design for Plokymarket

### 2.1 The "8-Year-Old Test"

An 8-year-old should instantly understand:
1. **Green = Good/Yes**, **Red = Bad/No** (universal colors)
2. **Bigger bar = More people think so**
3. **Clock icon = Time running out**
4. **Money bag = How much people bet**

### 2.2 Enhanced Market Card (Just Built ✅)

```
┌─────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────┐ │
│  │ [Image or Color Gradient Background]            │ │
│  │  🏏 Cricket  (category badge)                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  Will India win the match?                        │
│                                                    │
│  YES  ██████████████████████████████████  62% │
│  NO   ████████████████████████████████████████  38% │
│                                                    │
│  💰 ৳1.2লঅট্রেড        ⏳ 2দিন বাকি     │
│                                                    │
│  [হ্যাঁ 62¢]  [না 38¢]                    │
└─────────────────────────────────────────────────────┘
```

### 2.3 Additional Kid-Friendly Features to Add

| Feature | How It Helps | Implementation |
|---------|-------------|----------------|
| **Emoji Indicators** | Instant recognition | 🚨 Hot market, 🔥 Trending, ⭐ New |
| **Color-coded Confidence** | Green=high confidence, Yellow=uncertain, Red=low | Progress bar color changes |
| **"Smart Money" Badge** | Shows what big players bet on | Aggregate large order data |
| **Simple Odds Translator** | "62% = like rolling 3+ on a dice" | Tooltip/popover with analogy |
| **Volume Thermometer** | Visual heat indicator for activity | Animated bar showing 24hr volume |
| **"Your Pick" Stamp** | Visual confirmation after voting | Confetti animation on trade |

---

## Part 3: Local Supabase Backend Architecture

### 3.1 What "Local Supabase" Means

```
┌─────────────────────────────────────────────────────┐
│  YOUR LOCAL SUPABASE STACK                         │
├─────────────────────────────────────────────────────┤
│  PostgreSQL 15 (Docker)                            │
│  ├── public schema: markets, events, trades...       │
│  ├── auth schema: users, sessions, MFA...            │
│  ├── storage schema: file buckets config             │
│  └── realtime schema: live subscriptions             │
│                                                    │
│  PostgREST (Docker) → REST API on /rest/v1/        │
│  Auth Server (Express) → JWT on /auth/v1/          │
│  Next.js App (PM2) → Frontend + API routes         │
└─────────────────────────────────────────────────────┘
```

### 3.2 Database Schema for Order Book

```sql
-- Core tables needed for full order book
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT,
  image_url TEXT,
  description TEXT,
  yes_price DECIMAL(10,4) DEFAULT 0.5000,
  no_price DECIMAL(10,4) DEFAULT 0.5000,
  total_volume DECIMAL(20,4) DEFAULT 0,
  liquidity DECIMAL(20,4) DEFAULT 0,
  trading_closes_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_outcome TEXT, -- 'YES', 'NO', or NULL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order book: every buy/sell order
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
  price DECIMAL(10,4) NOT NULL CHECK (price > 0 AND price < 1),
  quantity DECIMAL(20,4) NOT NULL CHECK (quantity > 0),
  filled_quantity DECIMAL(20,4) DEFAULT 0,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIAL', 'FILLED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trades: when orders match
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id),
  buyer_order_id UUID REFERENCES orders(id),
  seller_order_id UUID REFERENCES orders(id),
  price DECIMAL(10,4) NOT NULL,
  quantity DECIMAL(20,4) NOT NULL,
  buyer_user_id UUID REFERENCES auth.users(id),
  seller_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User positions: net holdings per market
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  market_id UUID REFERENCES markets(id),
  outcome TEXT NOT NULL CHECK (outcome IN ('YES', 'NO')),
  quantity DECIMAL(20,4) DEFAULT 0,
  avg_entry_price DECIMAL(10,4) DEFAULT 0,
  unrealized_pnl DECIMAL(20,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, market_id, outcome)
);

-- Price history for charts
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id),
  yes_price DECIMAL(10,4) NOT NULL,
  no_price DECIMAL(10,4) NOT NULL,
  volume_24h DECIMAL(20,4) DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_market_status ON orders(market_id, status);
CREATE INDEX idx_orders_market_side_outcome ON orders(market_id, side, outcome);
CREATE INDEX idx_trades_market ON trades(market_id);
CREATE INDEX idx_price_history_market_time ON price_history(market_id, recorded_at);
```

### 3.3 Order Matching Engine (Simple CLOB)

```typescript
// Pseudo-code for matching engine
function matchOrders(newOrder: Order) {
  // Find opposite orders that can match
  const oppositeSide = newOrder.side === 'BUY' ? 'SELL' : 'BUY';
  
  const candidates = db.orders
    .where({ market_id: newOrder.market_id, side: oppositeSide, status: 'OPEN' })
    .orderBy('price', newOrder.side === 'BUY' ? 'asc' : 'desc')
    .orderBy('created_at', 'asc'); // FIFO
  
  let remaining = newOrder.quantity;
  
  for (const candidate of candidates) {
    if (remaining <= 0) break;
    
    // Price match check
    const canMatch = newOrder.side === 'BUY' 
      ? newOrder.price >= candidate.price
      : newOrder.price <= candidate.price;
    
    if (!canMatch) break;
    
    const fillQty = Math.min(remaining, candidate.quantity - candidate.filled_quantity);
    
    // Create trade
    db.trades.create({
      market_id: newOrder.market_id,
      buyer_order_id: newOrder.side === 'BUY' ? newOrder.id : candidate.id,
      seller_order_id: newOrder.side === 'SELL' ? newOrder.id : candidate.id,
      price: candidate.price, // price improvement: use resting order's price
      quantity: fillQty,
    });
    
    // Update orders
    remaining -= fillQty;
    candidate.filled_quantity += fillQty;
    candidate.status = candidate.filled_quantity >= candidate.quantity ? 'FILLED' : 'PARTIAL';
  }
  
  newOrder.filled_quantity = newOrder.quantity - remaining;
  newOrder.status = remaining > 0 ? 'PARTIAL' : 'FILLED';
}
```

### 3.4 API Routes Needed

```
GET  /api/markets              → List all active markets
GET  /api/markets/[slug]       → Single market detail
GET  /api/markets/[slug]/book  → Order book (bids + asks)
GET  /api/markets/[slug]/trades → Recent trades
GET  /api/markets/[slug]/chart → Price history for charts
POST /api/orders               → Place new order
GET  /api/orders               → My orders
DELETE /api/orders/[id]        → Cancel order
GET  /api/positions            → My positions
GET  /api/portfolio            → Portfolio summary
```

---

## Part 4: Stepwise Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] **1.1** Set up local Supabase with Docker Compose
  ```yaml
  # docker-compose.yml
  services:
    db:
      image: supabase/postgres:15.1.1.78
      ports: ["5433:5432"]
    postgrest:
      image: postgrest/postgrest:v12
      ports: ["3001:3000"]
  ```
- [ ] **1.2** Run database migrations (create tables above)
- [ ] **1.3** Seed sample markets (10+ with images)
- [ ] **1.4** Connect frontend to PostgREST for market data
- [ ] **1.5** Deploy new market cards (already built ✅)

### Phase 2: Order Book (Week 2)
- [ ] **2.1** Build order matching engine (Next.js API route)
- [ ] **2.2** Create `/api/orders` POST endpoint
- [ ] **2.3** Create `/api/markets/[slug]/book` GET endpoint
- [ ] **2.4** Build order book UI on market detail page
- [ ] **2.5** Add price history recording (cron job every 5 min)

### Phase 3: Trading (Week 3)
- [ ] **3.1** User wallet/balance system
- [ ] **3.2** Position tracking (realized + unrealized P&L)
- [ ] **3.3** Trade history page
- [ ] **3.4** Portfolio dashboard
- [ ] **3.5** Order cancellation

### Phase 4: Admin (Week 4)
- [ ] **4.1** Admin market creation UI
- [ ] **4.2** Market resolution flow
- [ ] **4.3** User management
- [ ] **4.4** Deposit/withdrawal management
- [ ] **4.5** Analytics dashboard

### Phase 5: Polish (Week 5)
- [ ] **5.1** Real-time updates (Supabase Realtime or polling)
- [ ] **5.2** Price history charts (Recharts)
- [ ] **5.3** Kid-friendly tooltips + tutorials
- [ ] **5.4** Mobile optimization
- [ ] **5.5** Performance optimization

---

## Part 5: What I Need From You

| Item | Why | Priority |
|------|-----|----------|
| **Admin credentials** | Test admin panel, create markets | 🔴 Critical |
| **Database access** | Run migrations, seed data | 🔴 Critical |
| **Sample market list** | 10-20 events to seed | 🟡 High |
| **Image assets** | Market card header images | 🟡 High |
| **Currency decision** | BDT only or crypto too? | 🟡 High |
| **KYC requirements** | Legal compliance for Bangladesh | 🟠 Medium |

---

## Current Status

✅ **Market Card Redesign** - DONE & BUILT
- Image/gradient header
- YES/NO progress bars
- Volume + countdown timer
- Category badges with icons
- Bengali numbers throughout

⚠️ **Deployment** - Build successful, but PM2 not available in this environment
- Build output: `/root/workspace/plokymarket/apps/web/.next/`
- You need to deploy to your production server manually

---
*Generated: 2026-05-10 | Based on live Polymarket API analysis*
