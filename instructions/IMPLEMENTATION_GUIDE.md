# Polymarket BD - Complete Implementation & Deployment Guide

## 📁 PROJECT STRUCTURE OVERVIEW

```
polymarket-bd/
├── 📁 apps/
│   └── 📁 web/                    # Next.js Frontend → DEPLOY TO VERCEL
│       ├── src/
│       │   ├── app/               # Next.js App Router
│       │   ├── components/        # React Components
│       │   ├── lib/               # Utilities, Supabase Client
│       │   └── types/             # TypeScript Types
│       ├── .env.local             # Vercel Environment Variables
│       └── package.json
│
├── 📁 supabase/                   # → DEPLOY TO SUPABASE
│   ├── migrations/                # Database Schema
│   ├── functions/                 # Edge Functions
│   └── config.toml
│
├── 📁 docker/                     # → DEPLOY TO DOCKER (n8n)
│   └── n8n/
│       ├── docker-compose.yml
│       └── workflows/
│
└── README.md
```

---

## 🗄️ PART 1: SUPABASE SETUP (Database + Auth + Realtime)

### Step 1.1: Create Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create new project (or use existing)
# Go to https://app.supabase.com and create new project
# Project Name: polymarket-bd
# Database Password: [generate strong password]
# Region: [closest to your users]
```

### Step 1.2: Database Schema Migration

Create file: `/supabase/migrations/001_initial_schema.sql`

```sql
-- ===================================
-- EXTENSIONS
-- ===================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- ENUMS
-- ===================================
CREATE TYPE market_status AS ENUM ('active', 'closed', 'resolved', 'cancelled');
CREATE TYPE outcome_type AS ENUM ('YES', 'NO');
CREATE TYPE order_type AS ENUM ('limit', 'market');
CREATE TYPE order_side AS ENUM ('buy', 'sell');
CREATE TYPE order_status AS ENUM ('open', 'partially_filled', 'filled', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'settlement', 'refund');

-- ===================================
-- TABLES
-- ===================================

-- Users (extends Supabase Auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE
);

-- Wallets
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) DEFAULT 0 CHECK (balance >= 0),
    locked_balance NUMERIC(12, 2) DEFAULT 0 CHECK (locked_balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Markets
CREATE TABLE public.markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
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
    resolution_details JSONB,
    total_volume NUMERIC(12, 2) DEFAULT 0,
    yes_shares_outstanding BIGINT DEFAULT 0,
    no_shares_outstanding BIGINT DEFAULT 0,
    CONSTRAINT valid_dates CHECK (event_date > trading_closes_at)
);

-- Orders
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
    status order_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT valid_fill CHECK (filled_quantity <= quantity)
);

-- Trades
CREATE TABLE public.trades (
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

-- Positions
CREATE TABLE public.positions (
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

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    trade_id UUID REFERENCES public.trades(id),
    market_id UUID REFERENCES public.markets(id),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oracle Verifications
CREATE TYPE oracle_status AS ENUM ('pending', 'verified', 'disputed', 'finalized');

CREATE TABLE public.oracle_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,
    ai_result outcome_type,
    ai_confidence NUMERIC(3, 2),
    ai_reasoning TEXT,
    scraped_data JSONB,
    admin_id UUID REFERENCES public.users(id),
    admin_decision outcome_type,
    admin_notes TEXT,
    status oracle_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ
);

-- Payment Transactions
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('bkash', 'nagad', 'bank_transfer');

CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    method payment_method NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id TEXT UNIQUE,
    sender_number TEXT,
    receiver_number TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ===================================
-- INDEXES
-- ===================================
CREATE INDEX idx_orders_matching ON public.orders(market_id, outcome, side, status, price, created_at)
    WHERE status IN ('open', 'partially_filled');
CREATE INDEX idx_orders_user ON public.orders(user_id, status);
CREATE INDEX idx_trades_market ON public.trades(market_id, created_at DESC);
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_positions_user_market ON public.positions(user_id, market_id);

-- ===================================
-- FUNCTIONS
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON public.users FOR SELECT
    USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Users can read own wallet" ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT
    USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own orders" ON public.orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Positions policies
CREATE POLICY "Users can view own positions" ON public.positions FOR SELECT
    USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Markets (public read, admin write)
CREATE POLICY "Anyone can read markets" ON public.markets FOR SELECT
    USING (true);
CREATE POLICY "Admins can manage markets" ON public.markets FOR ALL
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- Trades (public read)
CREATE POLICY "Anyone can read trades" ON public.trades FOR SELECT
    USING (true);

-- Payment transactions
CREATE POLICY "Users can view own payments" ON public.payment_transactions FOR SELECT
    USING (auth.uid() = user_id);
```

### Step 1.3: Matching Engine Function

Create file: `/supabase/migrations/002_matching_engine.sql`

```sql
-- ===================================
-- MATCHING ENGINE
-- ===================================

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
        balance = balance - v_total_cost,
        locked_balance = locked_balance - v_total_cost
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
```

### Step 1.4: Deploy to Supabase

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Get your API credentials from Supabase Dashboard:
# Project Settings > API > Project URL & anon/public key
```

**Supabase Dashboard Settings:**
- Go to Authentication > Settings
- Enable Email provider
- Disable "Confirm email" for easier testing (enable in production)
- Set Site URL to your Vercel domain

---

## 🌐 PART 2: VERCEL SETUP (Frontend)

### Step 2.1: Project Setup

```bash
# Create Next.js project
npx create-next-app@latest polymarket-web --typescript --tailwind --app --src-dir
cd polymarket-web

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install zustand date-fns recharts lucide-react
npm install -D @types/node

# Initialize shadcn/ui
npx shadcn@latest init

# Add shadcn components
npx shadcn@latest add button input card table dialog dropdown-menu tabs badge select slider textarea alert checkbox label separator scroll-area
```

### Step 2.2: Environment Variables

Create file: `apps/web/.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2.3: Supabase Client Configuration

Create file: `apps/web/src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create file: `apps/web/src/lib/supabase/server.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal in Server Components
          }
        },
      },
    }
  )
}
```

Create file: `apps/web/src/lib/supabase/middleware.ts`

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

### Step 2.4: Middleware Setup

Create file: `apps/web/src/middleware.ts`

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Step 2.5: Types Definition

Create file: `apps/web/src/types/index.ts`

```typescript
export type MarketStatus = 'active' | 'closed' | 'resolved' | 'cancelled';
export type OutcomeType = 'YES' | 'NO';
export type OrderType = 'limit' | 'market';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled';

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  kyc_verified: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Market {
  id: string;
  question: string;
  description?: string;
  category: string;
  source_url?: string;
  image_url?: string;
  creator_id?: string;
  status: MarketStatus;
  resolution_source?: string;
  min_price: number;
  max_price: number;
  tick_size: number;
  created_at: string;
  trading_closes_at: string;
  event_date: string;
  resolved_at?: string;
  winning_outcome?: OutcomeType;
  resolution_details?: Record<string, any>;
  total_volume: number;
  yes_shares_outstanding: number;
  no_shares_outstanding: number;
  yes_price?: number;
  no_price?: number;
}

export interface Order {
  id: string;
  market_id: string;
  user_id: string;
  order_type: OrderType;
  side: OrderSide;
  outcome: OutcomeType;
  price: number;
  quantity: number;
  filled_quantity: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface Trade {
  id: string;
  market_id: string;
  buy_order_id?: string;
  sell_order_id?: string;
  outcome: OutcomeType;
  price: number;
  quantity: number;
  buyer_id?: string;
  seller_id?: string;
  created_at: string;
}

export interface Position {
  id: string;
  market_id: string;
  user_id: string;
  outcome: OutcomeType;
  quantity: number;
  average_price: number;
  realized_pnl: number;
  created_at: string;
  updated_at: string;
  market?: Market;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id?: string;
  trade_id?: string;
  market_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}
```

### Step 2.6: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Vercel Dashboard Configuration:**
1. Import your GitHub repository
2. Add Environment Variables in Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy!

---

## 🐳 PART 3: DOCKER SETUP (n8n Automation)

### Step 3.1: Docker Compose Configuration

Create file: `docker/n8n/docker-compose.yml`

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: polymarket-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme123
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/
      - DB_TYPE=sqlite
      - DB_SQLITE_PATH=/home/node/.n8n/database.sqlite
      - GENERIC_TIMEZONE=Asia/Dhaka
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/workflows
    networks:
      - n8n-network

  # Optional: PostgreSQL for n8n (recommended for production)
  postgres:
    image: postgres:15-alpine
    container_name: n8n-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=n8n_password
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n-network
    profiles:
      - production

volumes:
  n8n_data:
  postgres_data:

networks:
  n8n-network:
    driver: bridge
```

### Step 3.2: Start n8n

```bash
cd docker/n8n

# Start n8n
docker-compose up -d

# Access n8n at http://localhost:5678
# Login: admin / changeme123
```

### Step 3.3: n8n Workflow Configuration

#### Workflow 1: News Scraper

**Trigger:** Schedule (every 6 hours)

**Nodes:**
1. **Schedule Trigger** - Runs every 6 hours
2. **HTTP Request** - Scrape Prothom Alo
   - URL: `https://www.prothomalo.com/`
   - Method: GET
3. **HTML Extract** - Extract article titles and URLs
4. **Function** - Filter relevant articles
   ```javascript
   const articles = $input.all()[0].json.data;
   const relevant = articles.filter(article => {
     const keywords = ['election', 'cricket', 'economy', 'GDP'];
     return keywords.some(k => article.title.toLowerCase().includes(k));
   });
   return relevant.map(a => ({ json: a }));
   ```
5. **Supabase** - Store scraped data

#### Workflow 2: AI Oracle Verification

**Trigger:** Webhook (from Supabase on new market resolution)

**Nodes:**
1. **Webhook** - Trigger on market resolution
2. **Supabase** - Get market details
3. **HTTP Request** - OpenAI API
   ```json
   {
     "model": "gpt-4",
     "messages": [
       {
         "role": "system",
         "content": "You are a fact-checker. Determine if the news resolves the market question. Return JSON: {result: 'YES'|'NO', confidence: 0-1, reasoning: 'explanation'}"
       },
       {
         "role": "user",
         "content": "Market: {{$json.question}}\n\nNews: {{$json.articleContent}}"
       }
     ]
   }
   ```
4. **Function** - Parse AI response
5. **Supabase** - Update oracle_verifications table

#### Workflow 3: Payment Verification

**Trigger:** Webhook (from frontend on payment submission)

**Nodes:**
1. **Webhook** - Receive payment notification
2. **Supabase** - Get pending payment
3. **Function** - Verify transaction
4. **Supabase** - Update wallet balance
5. **Email/SMS** - Notify user

### Step 3.4: Production Deployment (Railway/Render)

```bash
# For Railway
npm install -g @railway/cli
railway login
railway init
railway add --database postgres
railway up

# For Render
# 1. Create new Web Service on Render
# 2. Connect GitHub repository
# 3. Set environment variables
# 4. Deploy
```

---

## 🔧 PART 4: FRONTEND COMPONENTS

### Step 4.1: Copy All Components

Copy these files from the built project to `apps/web/src/`:

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (Home)
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── markets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── portfolio/page.tsx
│   │   └── wallet/page.tsx
│   └── admin/page.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Layout.tsx
│   ├── market/
│   │   └── MarketCard.tsx
│   └── trading/
│       ├── OrderBook.tsx
│       ├── PriceChart.tsx
│       └── TradingPanel.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils.ts
├── store/
│   └── useStore.ts
└── types/
    └── index.ts
```

### Step 4.2: Update Store for Supabase

Replace mock data calls with Supabase queries:

```typescript
// In useStore.ts - Replace mock functions with Supabase calls

fetchMarkets: async () => {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  set({ markets: data || [] });
},

placeOrder: async (marketId, side, outcome, price, quantity) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      market_id: marketId,
      user_id: user.id,
      side,
      outcome,
      price,
      quantity,
      order_type: 'limit'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Order error:', error);
    return false;
  }
  
  // Trigger matching engine
  await supabase.rpc('match_order', { p_order_id: data.id });
  
  return true;
},
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] RLS policies configured
- [ ] Environment variables set
- [ ] Vercel project linked
- [ ] Docker/n8n configured (optional)

### Deployment Order

1. **Deploy Supabase First**
   ```bash
   supabase db push
   ```

2. **Get Supabase Credentials**
   - Project URL
   - Anon Key
   - Service Role Key

3. **Configure Vercel Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

5. **Update Supabase Auth Settings**
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs: Add Vercel domain

6. **Deploy n8n (Optional)**
   ```bash
   cd docker/n8n
   docker-compose up -d
   ```

### Post-Deployment

- [ ] Test user registration
- [ ] Test login
- [ ] Test market browsing
- [ ] Test order placement
- [ ] Verify real-time updates
- [ ] Check admin panel access

---

## 📊 ENVIRONMENT VARIABLES SUMMARY

### Supabase (Dashboard)
```
Project URL: https://xxxxxx.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIs...
Service Role Key: eyJhbGciOiJIUzI1NiIs...
JWT Secret: your-jwt-secret
```

### Vercel (Project Settings)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### n8n (Docker Environment)
```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
OPENAI_API_KEY=sk-...
```

---

## 🔒 SECURITY CHECKLIST

- [ ] RLS enabled on all tables
- [ ] Service role key never exposed to client
- [ ] CORS configured in Supabase
- [ ] Rate limiting on API routes
- [ ] Input validation on all forms
- [ ] HTTPS enforced
- [ ] Secure cookie settings
- [ ] Admin routes protected

---

## 🐛 TROUBLESHOOTING

### Common Issues

1. **CORS Errors**
   - Add Vercel domain to Supabase CORS origins

2. **Auth Not Persisting**
   - Check cookie settings in middleware
   - Verify Site URL in Supabase Auth settings

3. **Real-time Not Working**
   - Enable Realtime in Supabase Database settings
   - Check RLS policies allow realtime

4. **Database Connection Failed**
   - Verify connection string
   - Check IP allowlist in Supabase

---

## 📞 SUPPORT

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- n8n Docs: https://docs.n8n.io
- Next.js Docs: https://nextjs.org/docs
