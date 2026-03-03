# Tab 1

### [**Plokymarket \- Prediction Marketplace**](https://polymarket-bangladesh.vercel.app/)

### **What We Have Built**

We have successfully deployed a full Prediction Marketplace platform tailored for the Bangladeshi market ("Polymarket BD").

1. Production Deployment: The web app is live on Vercel with a custom domain alias support.  
2. Database Core: A complete PostgreSQL financial database schema hosted on Supabase.  
3. Matching Engine: A decentralized-style order book engine written in PL/pgSQL that handles order matching, trade execution, and settlement directly in the database.  
4. Modern Brand Identity: A revamped "Dark Mode" homepage with glassmorphism effects, animated backgrounds, and "blobs" to create a premium, high-trust feel.

---

### **🛠️ Tech Stack & Languages**

We are using a modern, scalable, and type-safe stack:

* Frontend:  
  * Language: TypeScript (Ensure type safety for financial data).  
  * Framework: Next.js 15 (App Router for performance and SEO).  
  * Styling: Tailwind CSS (for rapid, responsive design) \+ Framer Motion (for complex animations).  
  * Icons: Lucide React.  
* Backend / Database:  
  * Language: SQL / PL/pgSQL (Advanced stored procedures for the trading engine).  
  * Platform: Supabase (Managed PostgreSQL \+ Auth).  
  * Security: Row Level Security (RLS).

---

### **🔒 Security Analysis**

The platform is Highly Secure by design effectively mitigating common web attacks:

1. Database Security (RLS): We enabled Row Level Security on *every* table.  
   * *Result*: A user literally *cannot* query another user's wallet balance or open orders, even if they try to hack the API client. The database rejects the request at the kernel level.  
2. Environment Isolation: Secrets (Supabase Admin Keys) are stored only in Vercel's encrypted environment variables, never exposed to the client browser.  
3. Type Safety: TypeScript prevents standard frontend data handling errors.  
4. Auth Integration: User identity is managed by Supabase Auth (JWT tokens), removing the risk of handling passwords manually.

---

### **✅ Functional vs. 🚧 Non-Functional Status**

| Feature | Status | Details |
| :---- | :---- | :---- |
| Homepage | ✅ Functional | Fully animated, responsive, high-fidelity design. |
| Markets List | ✅ Functional | The /markets page fetches real data from the live Database. |
| Database Schema | ✅ Functional | Production-ready with users, wallets, orders, trades, and markets tables. |
| Trading Engine | ✅ Functional | The logic (match\_order function) exists in the DB, ready to process trades. |
| Live Ticker | 🚧 Mock Data | The homepage ticker animation works smoothly but displays *placeholder* data, not live market moves. |
| User Onboarding | 🚧 Partial | The UI exists and DB supports it, but the full Sign-up \-\> Email Verification flow needs manual end-to-end testing. |
| Payments | ❌ Pending | The payment\_transactions table exists, but integration with Bkash/Nagad APIs is not yet built. |

---

### **🚀 Advanced Features to Add (Roadmap)**

To make this a "Unicorn-level" product, I recommend adding these next:

1. Order Book Visualization:  
   * Add a real-time "Depth Chart" (Green/Red walls) on the market detail page so traders can see liquidity gaps.  
2. Real-Time Data Streams:  
   * Connect Supabase Realtime to the frontend so that when a trade happens, the price updates instantly without refreshing the page.  
3. Bkash/Nagad Payment Gateway:  
   * Build a serverless function to handle IPN (Instant Payment Notification) webhooks from local payment providers to auto-credit user wallets.  
4. AI Oracle Resolution:  
   * Use an LLM (Claude/GPT) to automatically browse the web and resolve markets (e.g., "Did Bitcoin pass $100k?") to reduce admin workload.  
5. Referral System:  
   * Add a viral loop where users get ৳50 for referring friends, tracked via the users table.

Recommendation: The immediate next step should be wiring up the Trading UI to the backend so we can execute the first real trade on the live site.

# Tab 2

# **Plokymarket \- Complete Production-Ready Implementation Guide**

## **🎯 Project Overview**

A localized Polymarket-style prediction marketplace for Bangladesh with:

* **Bangla-First Localization** (Bangla, English, Hindi)  
* **Dark/Light Theme Toggle**  
* **Advanced Trading UI** (Order Book, Charts, Market/Limit Orders)  
* **Leaderboards & Social Features**  
* **AI-Powered Market Resolution**  
* **Local Payment Integration** (bKash, Nagad)

---

## **📊 Feature Comparison & Gap Analysis**

| Feature | Polymarket | Plokymarket Status | Priority |
| ----- | ----- | ----- | ----- |
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

## **🏗️ Architecture Overview**

### **Tech Stack**

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
├── Supabase (PostgreSQL \+ Auth \+ Realtime)  
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

### **System Architecture Diagram**

┌─────────────────────────────────────────────────────────────┐  
│                       USER INTERFACE                         │  
│  (Next.js \+ React \+ Tailwind \+ i18next \+ next-themes)       │  
└──────────────────┬──────────────────────────────────────────┘  
                   │  
                   ▼  
┌─────────────────────────────────────────────────────────────┐  
│                    STATE MANAGEMENT                          │  
│              (Zustand \+ React Query)                         │  
└──────────────────┬──────────────────────────────────────────┘  
                   │  
                   ▼  
┌─────────────────────────────────────────────────────────────┐  
│                   SUPABASE CLIENT                            │  
│           (Authentication \+ Realtime \+ Storage)              │  
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
│  \- Order Matching Algorithm                                  │  
│  \- Position Management                                       │  
│  \- Settlement Logic                                          │  
└─────────────────────────────────────────────────────────────┘  
        │  
        ▼  
┌─────────────────────────────────────────────────────────────┐  
│                    n8n AUTOMATION                            │  
│  \- News Scraping (Prothom Alo, Daily Star)                  │  
│  \- AI Oracle (OpenAI GPT-4)                                  │  
│  \- Payment Verification (bKash/Nagad)                        │  
└─────────────────────────────────────────────────────────────┘

---

## **🗄️ Database Schema (Enhanced)**

### **Core Tables**

\-- \===================================  
\-- USERS & AUTHENTICATION  
\-- \===================================

CREATE TABLE public.users (  
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
    email TEXT UNIQUE NOT NULL,  
    phone TEXT UNIQUE,  
    full\_name TEXT NOT NULL,  
    username TEXT UNIQUE,  
    avatar\_url TEXT,  
    bio TEXT,  
    preferred\_language VARCHAR(5) DEFAULT 'bn', \-- 'bn', 'en', 'hi'  
    theme VARCHAR(10) DEFAULT 'dark', \-- 'dark', 'light'  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW(),  
    is\_admin BOOLEAN DEFAULT FALSE,  
    kyc\_verified BOOLEAN DEFAULT FALSE,  
    kyc\_document\_url TEXT,  
    total\_volume NUMERIC(12, 2\) DEFAULT 0,  
    total\_pnl NUMERIC(12, 2\) DEFAULT 0,  
    trades\_count INT DEFAULT 0,  
    win\_rate NUMERIC(5, 2\) DEFAULT 0,  
    rank INT,  
    CONSTRAINT username\_format CHECK (username \~ '^\[a-zA-Z0-9\_\]{3,20}$')  
);

\-- \===================================  
\-- WALLETS & TRANSACTIONS  
\-- \===================================

CREATE TABLE public.wallets (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    user\_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  
    balance NUMERIC(12, 2\) DEFAULT 0 CHECK (balance \>= 0),  
    locked\_balance NUMERIC(12, 2\) DEFAULT 0 CHECK (locked\_balance \>= 0),  
    lifetime\_deposits NUMERIC(12, 2\) DEFAULT 0,  
    lifetime\_withdrawals NUMERIC(12, 2\) DEFAULT 0,  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW(),  
    UNIQUE(user\_id)  
);

\-- \===================================  
\-- MARKETS (Enhanced)  
\-- \===================================

CREATE TYPE market\_category AS ENUM (  
    'politics', 'sports', 'economy', 'entertainment',   
    'weather', 'technology', 'health', 'education'  
);

CREATE TABLE public.markets (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    question TEXT NOT NULL,  
    question\_bn TEXT, \-- Bangla translation  
    question\_hi TEXT, \-- Hindi translation  
    description TEXT,  
    description\_bn TEXT,  
    description\_hi TEXT,  
    category market\_category NOT NULL,  
    tags TEXT\[\],  
    source\_url TEXT,  
    image\_url TEXT,  
    creator\_id UUID REFERENCES public.users(id),  
    status market\_status DEFAULT 'active',  
    resolution\_source TEXT,  
    min\_price NUMERIC(5, 4\) DEFAULT 0.01 CHECK (min\_price \> 0),  
    max\_price NUMERIC(5, 4\) DEFAULT 0.99 CHECK (max\_price \< 1),  
    tick\_size NUMERIC(5, 4\) DEFAULT 0.01,  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    trading\_closes\_at TIMESTAMPTZ NOT NULL,  
    event\_date TIMESTAMPTZ NOT NULL,  
    resolved\_at TIMESTAMPTZ,  
    winning\_outcome outcome\_type,  
    resolution\_details JSONB,  
    total\_volume NUMERIC(12, 2\) DEFAULT 0,  
    liquidity NUMERIC(12, 2\) DEFAULT 0,  
    yes\_shares\_outstanding BIGINT DEFAULT 0,  
    no\_shares\_outstanding BIGINT DEFAULT 0,  
    yes\_price NUMERIC(5, 4),  
    no\_price NUMERIC(5, 4),  
    price\_24h\_change NUMERIC(5, 4),  
    volume\_24h NUMERIC(12, 2\) DEFAULT 0,  
    traders\_count INT DEFAULT 0,  
    comments\_count INT DEFAULT 0,  
    views\_count INT DEFAULT 0,  
    is\_featured BOOLEAN DEFAULT FALSE,  
    is\_trending BOOLEAN DEFAULT FALSE,  
    CONSTRAINT valid\_dates CHECK (event\_date \> trading\_closes\_at)  
);

\-- \===================================  
\-- ORDERS (Enhanced)  
\-- \===================================

CREATE TABLE public.orders (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    market\_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,  
    user\_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  
    order\_type order\_type NOT NULL,  
    side order\_side NOT NULL,  
    outcome outcome\_type NOT NULL,  
    price NUMERIC(5, 4\) NOT NULL CHECK (price \> 0 AND price \< 1),  
    quantity BIGINT NOT NULL CHECK (quantity \> 0),  
    filled\_quantity BIGINT DEFAULT 0 CHECK (filled\_quantity \<= quantity),  
    remaining\_quantity BIGINT GENERATED ALWAYS AS (quantity \- filled\_quantity) STORED,  
    status order\_status DEFAULT 'open',  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW(),  
    expires\_at TIMESTAMPTZ,  
    cancelled\_at TIMESTAMPTZ,  
    cancel\_reason TEXT,  
    CONSTRAINT valid\_fill CHECK (filled\_quantity \<= quantity)  
);

\-- \===================================  
\-- ACTIVITY FEED  
\-- \===================================

CREATE TYPE activity\_type AS ENUM (  
    'order\_placed', 'trade\_executed', 'market\_created',   
    'market\_resolved', 'position\_opened', 'position\_closed',  
    'comment\_added', 'user\_followed'  
);

CREATE TABLE public.activities (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    user\_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  
    type activity\_type NOT NULL,  
    market\_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,  
    order\_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,  
    trade\_id UUID REFERENCES public.trades(id) ON DELETE SET NULL,  
    metadata JSONB,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- \===================================  
\-- LEADERBOARD CACHE  
\-- \===================================

CREATE TABLE public.leaderboard\_cache (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    user\_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  
    timeframe VARCHAR(20) NOT NULL, \-- 'daily', 'weekly', 'monthly', 'all\_time'  
    total\_pnl NUMERIC(12, 2\) DEFAULT 0,  
    total\_volume NUMERIC(12, 2\) DEFAULT 0,  
    trades\_count INT DEFAULT 0,  
    win\_rate NUMERIC(5, 2\) DEFAULT 0,  
    rank INT,  
    calculated\_at TIMESTAMPTZ DEFAULT NOW(),  
    UNIQUE(user\_id, timeframe)  
);

\-- \===================================  
\-- MARKET COMMENTS  
\-- \===================================

CREATE TABLE public.market\_comments (  
    id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    market\_id UUID REFERENCES public.markets(id) ON DELETE CASCADE,  
    user\_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  
    parent\_id UUID REFERENCES public.market\_comments(id) ON DELETE CASCADE,  
    content TEXT NOT NULL,  
    likes\_count INT DEFAULT 0,  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW(),  
    is\_deleted BOOLEAN DEFAULT FALSE  
);

\-- \===================================  
\-- USER FOLLOWS  
\-- \===================================

CREATE TABLE public.user\_follows (  
    follower\_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  
    following\_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    PRIMARY KEY (follower\_id, following\_id),  
    CONSTRAINT no\_self\_follow CHECK (follower\_id \!= following\_id)  
);

\-- \===================================  
\-- INDEXES (Performance Optimization)  
\-- \===================================

\-- Markets  
CREATE INDEX idx\_markets\_status ON public.markets(status) WHERE status \= 'active';  
CREATE INDEX idx\_markets\_category ON public.markets(category, created\_at DESC);  
CREATE INDEX idx\_markets\_trending ON public.markets(is\_trending, volume\_24h DESC)   
    WHERE is\_trending \= TRUE;  
CREATE INDEX idx\_markets\_featured ON public.markets(is\_featured, created\_at DESC)   
    WHERE is\_featured \= TRUE;  
CREATE INDEX idx\_markets\_search ON public.markets   
    USING gin(to\_tsvector('english', question || ' ' || COALESCE(description, '')));

\-- Orders (Matching Engine)  
CREATE INDEX idx\_orders\_matching ON public.orders(  
    market\_id, outcome, side, status, price, created\_at  
) WHERE status IN ('open', 'partially\_filled');  
CREATE INDEX idx\_orders\_user\_active ON public.orders(user\_id, status, created\_at DESC)  
    WHERE status IN ('open', 'partially\_filled');

\-- Trades  
CREATE INDEX idx\_trades\_market\_time ON public.trades(market\_id, created\_at DESC);  
CREATE INDEX idx\_trades\_user ON public.trades(buyer\_id, created\_at DESC);  
CREATE INDEX idx\_trades\_seller ON public.trades(seller\_id, created\_at DESC);

\-- Activities  
CREATE INDEX idx\_activities\_user ON public.activities(user\_id, created\_at DESC);  
CREATE INDEX idx\_activities\_market ON public.activities(market\_id, created\_at DESC);  
CREATE INDEX idx\_activities\_type ON public.activities(type, created\_at DESC);

\-- Leaderboard  
CREATE INDEX idx\_leaderboard\_timeframe ON public.leaderboard\_cache(  
    timeframe, rank ASC, total\_pnl DESC  
);

\-- Comments  
CREATE INDEX idx\_comments\_market ON public.market\_comments(  
    market\_id, created\_at DESC  
) WHERE is\_deleted \= FALSE;

---

## **🔄 Enhanced Matching Engine**

### **Algorithm Flow**

1\. Order Received  
   ↓  
2\. Validate Order (funds, market status, price limits)  
   ↓  
3\. Lock Funds (for buy orders)  
   ↓  
4\. Match Against Opposite Orders  
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
5\. Execute Trades (while matches available)  
   • Calculate trade quantity (minimum of remaining quantities)  
   • Determine trade price (maker's price for price priority)  
   • Update order filled quantities  
   • Create trade record  
   ↓  
6\. Update Positions  
   • Buyer: \+shares at trade price  
   • Seller: \-shares at trade price  
   • Calculate realized PnL for seller  
   ↓  
7\. Settle Funds  
   • Transfer USDC from buyer to seller  
   • Unlock remaining funds for unfilled portions  
   ↓  
8\. Update Market Metrics  
   • Total volume  
   • 24h volume  
   • Price (last trade)  
   • Liquidity  
   ↓  
9\. Emit Realtime Events  
   • Order book updates  
   • Trade notifications  
   • Position updates

### **Enhanced Matching Function**

\-- \===================================  
\-- ENHANCED MATCHING ENGINE  
\-- \===================================

CREATE OR REPLACE FUNCTION match\_order\_v2(p\_order\_id UUID)  
RETURNS TABLE(  
    matched BOOLEAN,  
    trades\_created INT,  
    remaining\_quantity BIGINT,  
    avg\_fill\_price NUMERIC(5, 4),  
    total\_filled BIGINT  
) AS $$  
DECLARE  
    v\_order RECORD;  
    v\_match RECORD;  
    v\_trade\_quantity BIGINT;  
    v\_trade\_price NUMERIC(5, 4);  
    v\_trades\_count INT := 0;  
    v\_remaining BIGINT;  
    v\_total\_filled BIGINT := 0;  
    v\_weighted\_price NUMERIC := 0;  
BEGIN  
    \-- Lock and get the order with FOR UPDATE  
    SELECT \* INTO v\_order  
    FROM public.orders  
    WHERE id \= p\_order\_id  
    FOR UPDATE;  
      
    \-- Validate order status  
    IF NOT FOUND OR v\_order.status NOT IN ('open', 'partially\_filled') THEN  
        RETURN QUERY SELECT FALSE, 0, 0::BIGINT, 0::NUMERIC(5, 4), 0::BIGINT;  
        RETURN;  
    END IF;  
      
    \-- Check if market is still active  
    IF NOT EXISTS (  
        SELECT 1 FROM public.markets   
        WHERE id \= v\_order.market\_id   
        AND status \= 'active'   
        AND trading\_closes\_at \> NOW()  
    ) THEN  
        UPDATE public.orders SET status \= 'cancelled'::order\_status  
        WHERE id \= p\_order\_id;  
        RETURN QUERY SELECT FALSE, 0, 0::BIGINT, 0::NUMERIC(5, 4), 0::BIGINT;  
        RETURN;  
    END IF;  
      
    v\_remaining := v\_order.quantity \- v\_order.filled\_quantity;  
      
    \-- Matching loop  
    WHILE v\_remaining \> 0 LOOP  
        IF v\_order.side \= 'buy' THEN  
            \-- Buy order matching logic  
            SELECT \* INTO v\_match  
            FROM public.orders  
            WHERE market\_id \= v\_order.market\_id  
              AND status IN ('open', 'partially\_filled')  
              AND id \!= v\_order.id  
              AND (  
                  \-- Same outcome sell orders  
                  (side \= 'sell'   
                   AND outcome \= v\_order.outcome   
                   AND price \<= v\_order.price)  
                  OR  
                  \-- Opposite outcome buy orders (arbitrage)  
                  (side \= 'buy'   
                   AND outcome \!= v\_order.outcome   
                   AND (price \+ v\_order.price) \<= 1.00)  
              )  
            ORDER BY   
              CASE   
                WHEN side \= 'sell' THEN price  
                ELSE (1.00 \- price)  
              END ASC,  
              created\_at ASC  
            LIMIT 1  
            FOR UPDATE SKIP LOCKED;  
        ELSE  
            \-- Sell order matching logic  
            SELECT \* INTO v\_match  
            FROM public.orders  
            WHERE market\_id \= v\_order.market\_id  
              AND status IN ('open', 'partially\_filled')  
              AND id \!= v\_order.id  
              AND side \= 'buy'  
              AND outcome \= v\_order.outcome  
              AND price \>= v\_order.price  
            ORDER BY price DESC, created\_at ASC  
            LIMIT 1  
            FOR UPDATE SKIP LOCKED;  
        END IF;  
          
        \-- Exit if no matches found  
        EXIT WHEN NOT FOUND;  
          
        \-- Calculate trade quantity  
        v\_trade\_quantity := LEAST(  
            v\_remaining,   
            v\_match.quantity \- v\_match.filled\_quantity  
        );  
          
        \-- Determine trade price (maker gets their price)  
        IF v\_order.created\_at \< v\_match.created\_at THEN  
            v\_trade\_price := v\_order.price;  
        ELSE  
            v\_trade\_price := v\_match.price;  
        END IF;  
          
        \-- Create trade record  
        INSERT INTO public.trades (  
            market\_id,   
            buy\_order\_id,   
            sell\_order\_id,   
            outcome,  
            price,   
            quantity,   
            buyer\_id,   
            seller\_id  
        ) VALUES (  
            v\_order.market\_id,  
            CASE WHEN v\_order.side \= 'buy' THEN v\_order.id ELSE v\_match.id END,  
            CASE WHEN v\_order.side \= 'sell' THEN v\_order.id ELSE v\_match.id END,  
            v\_order.outcome,  
            v\_trade\_price,  
            v\_trade\_quantity,  
            CASE WHEN v\_order.side \= 'buy' THEN v\_order.user\_id ELSE v\_match.user\_id END,  
            CASE WHEN v\_order.side \= 'sell' THEN v\_order.user\_id ELSE v\_match.user\_id END  
        );  
          
        \-- Update order filled quantities  
        UPDATE public.orders SET   
            filled\_quantity \= filled\_quantity \+ v\_trade\_quantity,  
            status \= CASE   
                WHEN filled\_quantity \+ v\_trade\_quantity \>= quantity   
                THEN 'filled'::order\_status  
                ELSE 'partially\_filled'::order\_status  
            END,  
            updated\_at \= NOW()  
        WHERE id \= v\_order.id;  
          
        UPDATE public.orders SET   
            filled\_quantity \= filled\_quantity \+ v\_trade\_quantity,  
            status \= CASE   
                WHEN filled\_quantity \+ v\_trade\_quantity \>= quantity   
                THEN 'filled'::order\_status  
                ELSE 'partially\_filled'::order\_status  
            END,  
            updated\_at \= NOW()  
        WHERE id \= v\_match.id;  
          
        \-- Update positions  
        PERFORM update\_position\_v2(  
            CASE WHEN v\_order.side \= 'buy' THEN v\_order.user\_id ELSE v\_match.user\_id END,  
            v\_order.market\_id,   
            v\_order.outcome,   
            v\_trade\_quantity,   
            v\_trade\_price  
        );  
          
        PERFORM update\_position\_v2(  
            CASE WHEN v\_order.side \= 'sell' THEN v\_order.user\_id ELSE v\_match.user\_id END,  
            v\_order.market\_id,   
            v\_order.outcome,   
            \-v\_trade\_quantity,   
            v\_trade\_price  
        );  
          
        \-- Process settlement  
        PERFORM process\_trade\_settlement\_v2(  
            CASE WHEN v\_order.side \= 'buy' THEN v\_order.id ELSE v\_match.id END,  
            CASE WHEN v\_order.side \= 'sell' THEN v\_order.id ELSE v\_match.id END,  
            v\_trade\_quantity,   
            v\_trade\_price  
        );  
          
        \-- Update market metrics  
        PERFORM update\_market\_metrics(v\_order.market\_id, v\_trade\_quantity, v\_trade\_price);  
          
        \-- Track for weighted average calculation  
        v\_weighted\_price := v\_weighted\_price \+ (v\_trade\_price \* v\_trade\_quantity);  
        v\_total\_filled := v\_total\_filled \+ v\_trade\_quantity;  
          
        v\_remaining := v\_remaining \- v\_trade\_quantity;  
        v\_trades\_count := v\_trades\_count \+ 1;  
    END LOOP;  
      
    \-- Calculate average fill price  
    DECLARE  
        v\_avg\_price NUMERIC(5, 4\) := 0;  
    BEGIN  
        IF v\_total\_filled \> 0 THEN  
            v\_avg\_price := v\_weighted\_price / v\_total\_filled;  
        END IF;  
          
        RETURN QUERY SELECT   
            v\_trades\_count \> 0,   
            v\_trades\_count,   
            v\_remaining,  
            v\_avg\_price,  
            v\_total\_filled;  
    END;  
END;  
$$ LANGUAGE plpgsql;

\-- \===================================  
\-- MARKET METRICS UPDATE  
\-- \===================================

CREATE OR REPLACE FUNCTION update\_market\_metrics(  
    p\_market\_id UUID,  
    p\_quantity BIGINT,  
    p\_price NUMERIC(5, 4\)  
) RETURNS VOID AS $$  
DECLARE  
    v\_trade\_value NUMERIC(12, 2);  
BEGIN  
    v\_trade\_value := p\_quantity \* p\_price;  
      
    UPDATE public.markets SET  
        total\_volume \= total\_volume \+ v\_trade\_value,  
        volume\_24h \= volume\_24h \+ v\_trade\_value,  
        yes\_price \= CASE   
            WHEN p\_price IS NOT NULL THEN p\_price   
            ELSE yes\_price   
        END,  
        no\_price \= CASE   
            WHEN p\_price IS NOT NULL THEN (1.00 \- p\_price)  
            ELSE no\_price   
        END,  
        updated\_at \= NOW()  
    WHERE id \= p\_market\_id;  
      
    \-- Update share counts  
    UPDATE public.markets  
    SET yes\_shares\_outstanding \= (  
        SELECT COALESCE(SUM(quantity), 0\)  
        FROM public.positions  
        WHERE market\_id \= p\_market\_id AND outcome \= 'YES'  
    ),  
    no\_shares\_outstanding \= (  
        SELECT COALESCE(SUM(quantity), 0\)  
        FROM public.positions  
        WHERE market\_id \= p\_market\_id AND outcome \= 'NO'  
    )  
    WHERE id \= p\_market\_id;  
END;  
$$ LANGUAGE plpgsql;

\-- \===================================  
\-- LEADERBOARD CALCULATION  
\-- \===================================

CREATE OR REPLACE FUNCTION calculate\_leaderboard(p\_timeframe VARCHAR(20))  
RETURNS VOID AS $$  
DECLARE  
    v\_start\_date TIMESTAMPTZ;  
BEGIN  
    \-- Determine timeframe  
    v\_start\_date := CASE p\_timeframe  
        WHEN 'daily' THEN NOW() \- INTERVAL '1 day'  
        WHEN 'weekly' THEN NOW() \- INTERVAL '7 days'  
        WHEN 'monthly' THEN NOW() \- INTERVAL '30 days'  
        ELSE '1970-01-01'::TIMESTAMPTZ \-- all\_time  
    END;  
      
    \-- Delete existing cache for this timeframe  
    DELETE FROM public.leaderboard\_cache WHERE timeframe \= p\_timeframe;  
      
    \-- Calculate and insert new rankings  
    INSERT INTO public.leaderboard\_cache (  
        user\_id, timeframe, total\_pnl, total\_volume, trades\_count, win\_rate, rank  
    )  
    SELECT   
        p.user\_id,  
        p\_timeframe,  
        SUM(p.realized\_pnl) as total\_pnl,  
        SUM(t.price \* t.quantity) as total\_volume,  
        COUNT(DISTINCT t.id) as trades\_count,  
        CASE   
            WHEN COUNT(DISTINCT t.id) \> 0   
            THEN (COUNT(DISTINCT t.id) FILTER (  
                WHERE p.realized\_pnl \> 0  
            )::NUMERIC / COUNT(DISTINCT t.id)::NUMERIC) \* 100  
            ELSE 0  
        END as win\_rate,  
        ROW\_NUMBER() OVER (ORDER BY SUM(p.realized\_pnl) DESC) as rank  
    FROM public.positions p  
    LEFT JOIN public.trades t ON (  
        t.buyer\_id \= p.user\_id OR t.seller\_id \= p.user\_id  
    ) AND t.created\_at \>= v\_start\_date  
    WHERE p.created\_at \>= v\_start\_date  
    GROUP BY p.user\_id  
    HAVING SUM(p.realized\_pnl) IS NOT NULL  
    ORDER BY total\_pnl DESC;  
      
    \-- Update user ranks  
    UPDATE public.users u  
    SET rank \= l.rank  
    FROM public.leaderboard\_cache l  
    WHERE u.id \= l.user\_id   
    AND l.timeframe \= 'all\_time';  
END;  
$$ LANGUAGE plpgsql;

---

## **🌍 Localization Implementation**

### **Directory Structure**

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

### **Translation Files**

**`public/locales/bn/common.json`**

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

**`public/locales/bn/markets.json`**

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

**`public/locales/bn/trading.json`**

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

**`public/locales/bn/navigation.json`**

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

### **i18next Configuration**

**`apps/web/src/lib/i18n.ts`**

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
    supportedLngs: \['bn', 'en', 'hi'\],  
      
    ns: \['common', 'markets', 'trading', 'navigation'\],  
    defaultNS: 'common',  
      
    backend: {  
      loadPath: '/locales/{{lng}}/{{ns}}.json',  
    },  
      
    detection: {  
      order: \['localStorage', 'navigator'\],  
      caches: \['localStorage'\],  
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

### **Language Switcher Component**

**`apps/web/src/components/LanguageSwitcher.tsx`**

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

const languages \= \[  
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },  
  { code: 'en', name: 'English', flag: '🇺🇸' },  
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },  
\];

export function LanguageSwitcher() {  
  const { i18n } \= useTranslation();  
  const \[currentLang, setCurrentLang\] \= useState(i18n.language);  
  const supabase \= createClient();

  const changeLanguage \= async (langCode: string) \=\> {  
    await i18n.changeLanguage(langCode);  
    setCurrentLang(langCode);  
    localStorage.setItem('i18nextLng', langCode);  
      
    // Update user preference in database  
    const { data: { user } } \= await supabase.auth.getUser();  
    if (user) {  
      await supabase  
        .from('users')  
        .update({ preferred\_language: langCode })  
        .eq('id', user.id);  
    }  
  };

  const currentLanguage \= languages.find(lang \=\> lang.code \=== currentLang) || languages\[0\];

  return (  
    \<DropdownMenu\>  
      \<DropdownMenuTrigger asChild\>  
        \<Button variant="ghost" size="sm" className="gap-2"\>  
          \<Globe className="h-4 w-4" /\>  
          \<span className="hidden sm:inline"\>{currentLanguage.flag} {currentLanguage.name}\</span\>  
          \<span className="sm:hidden"\>{currentLanguage.flag}\</span\>  
        \</Button\>  
      \</DropdownMenuTrigger\>  
      \<DropdownMenuContent align="end"\>  
        {languages.map((lang) \=\> (  
          \<DropdownMenuItem  
            key={lang.code}  
            onClick={() \=\> changeLanguage(lang.code)}  
            className={currentLang \=== lang.code ? 'bg-accent' : ''}  
          \>  
            \<span className="mr-2"\>{lang.flag}\</span\>  
            {lang.name}  
          \</DropdownMenuItem\>  
        ))}  
      \</DropdownMenuContent\>  
    \</DropdownMenu\>  
  );  
}

---

## **🎨 Theme System (Dark/Light Mode)**

### **Theme Provider Setup**

**`apps/web/src/providers/theme-provider.tsx`**

'use client';

import \* as React from 'react';  
import { ThemeProvider as NextThemesProvider } from 'next-themes';  
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {  
  return \<NextThemesProvider {...props}\>{children}\</NextThemesProvider\>;  
}

### **Theme Toggle Component**

**`apps/web/src/components/ThemeToggle.tsx`**

'use client';

import { Moon, Sun } from 'lucide-react';  
import { useTheme } from 'next-themes';  
import { useEffect, useState } from 'react';  
import { Button } from '@/components/ui/button';  
import { useTranslation } from 'react-i18next';  
import { createClient } from '@/lib/supabase/client';

export function ThemeToggle() {  
  const { theme, setTheme } \= useTheme();  
  const { t } \= useTranslation('common');  
  const \[mounted, setMounted\] \= useState(false);  
  const supabase \= createClient();

  useEffect(() \=\> {  
    setMounted(true);  
  }, \[\]);

  const toggleTheme \= async () \=\> {  
    const newTheme \= theme \=== 'dark' ? 'light' : 'dark';  
    setTheme(newTheme);  
      
    // Update user preference in database  
    const { data: { user } } \= await supabase.auth.getUser();  
    if (user) {  
      await supabase  
        .from('users')  
        .update({ theme: newTheme })  
        .eq('id', user.id);  
    }  
  };

  if (\!mounted) {  
    return \<div className="w-9 h-9" /\>;  
  }

  return (  
    \<Button  
      variant="ghost"  
      size="sm"  
      onClick={toggleTheme}  
      className="gap-2"  
    \>  
      {theme \=== 'dark' ? (  
        \<\>  
          \<Sun className="h-4 w-4" /\>  
          \<span className="hidden sm:inline"\>{t('theme.light')}\</span\>  
        \</\>  
      ) : (  
        \<\>  
          \<Moon className="h-4 w-4" /\>  
          \<span className="hidden sm:inline"\>{t('theme.dark')}\</span\>  
        \</\>  
      )}  
    \</Button\>  
  );  
}

### **Tailwind Dark Mode Configuration**

**`apps/web/tailwind.config.ts`**

import type { Config } from 'tailwindcss';

const config: Config \= {  
  darkMode: \['class'\],  
  content: \[  
    './pages/\*\*/\*.{ts,tsx}',  
    './components/\*\*/\*.{ts,tsx}',  
    './app/\*\*/\*.{ts,tsx}',  
    './src/\*\*/\*.{ts,tsx}',  
  \],  
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
        md: 'calc(var(--radius) \- 2px)',  
        sm: 'calc(var(--radius) \- 4px)',  
      },  
    },  
  },  
  plugins: \[require('tailwindcss-animate')\],  
};

export default config;

**`apps/web/src/app/globals.css`**

@tailwind base;  
@tailwind components;  
@tailwind utilities;

@layer base {  
  :root {  
    \--background: 0 0% 100%;  
    \--foreground: 222.2 84% 4.9%;  
    \--card: 0 0% 100%;  
    \--card-foreground: 222.2 84% 4.9%;  
    \--popover: 0 0% 100%;  
    \--popover-foreground: 222.2 84% 4.9%;  
    \--primary: 221.2 83.2% 53.3%;  
    \--primary-foreground: 210 40% 98%;  
    \--secondary: 210 40% 96.1%;  
    \--secondary-foreground: 222.2 47.4% 11.2%;  
    \--muted: 210 40% 96.1%;  
    \--muted-foreground: 215.4 16.3% 46.9%;  
    \--accent: 210 40% 96.1%;  
    \--accent-foreground: 222.2 47.4% 11.2%;  
    \--destructive: 0 84.2% 60.2%;  
    \--destructive-foreground: 210 40% 98%;  
    \--border: 214.3 31.8% 91.4%;  
    \--input: 214.3 31.8% 91.4%;  
    \--ring: 221.2 83.2% 53.3%;  
    \--radius: 0.5rem;  
    \--success: 142 76% 36%;  
    \--success-foreground: 138 76% 97%;  
    \--warning: 48 96% 53%;  
    \--warning-foreground: 48 96% 10%;  
  }

  .dark {  
    \--background: 222.2 84% 4.9%;  
    \--foreground: 210 40% 98%;  
    \--card: 222.2 84% 4.9%;  
    \--card-foreground: 210 40% 98%;  
    \--popover: 222.2 84% 4.9%;  
    \--popover-foreground: 210 40% 98%;  
    \--primary: 217.2 91.2% 59.8%;  
    \--primary-foreground: 222.2 47.4% 11.2%;  
    \--secondary: 217.2 32.6% 17.5%;  
    \--secondary-foreground: 210 40% 98%;  
    \--muted: 217.2 32.6% 17.5%;  
    \--muted-foreground: 215 20.2% 65.1%;  
    \--accent: 217.2 32.6% 17.5%;  
    \--accent-foreground: 210 40% 98%;  
    \--destructive: 0 62.8% 30.6%;  
    \--destructive-foreground: 210 40% 98%;  
    \--border: 217.2 32.6% 17.5%;  
    \--input: 217.2 32.6% 17.5%;  
    \--ring: 224.3 76.3% 48%;  
    \--success: 142 76% 36%;  
    \--success-foreground: 138 76% 97%;  
    \--warning: 48 96% 53%;  
    \--warning-foreground: 48 96% 10%;  
  }  
}

@layer base {  
  \* {  
    @apply border-border;  
  }  
  body {  
    @apply bg-background text-foreground;  
  }  
}

---

## **📊 Advanced Trading UI Components**

### **Order Book Component**

**`apps/web/src/components/trading/OrderBook.tsx`**

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
  const { t } \= useTranslation('trading');  
  const \[bids, setBids\] \= useState\<OrderBookLevel\[\]\>(\[\]);  
  const \[asks, setAsks\] \= useState\<OrderBookLevel\[\]\>(\[\]);  
  const \[spread, setSpread\] \= useState(0);  
  const supabase \= createClient();

  useEffect(() \=\> {  
    fetchOrderBook();  
      
    // Subscribe to order book updates  
    const channel \= supabase  
      .channel(\`orderbook:${marketId}\`)  
      .on(  
        'postgres\_changes',  
        {  
          event: '\*',  
          schema: 'public',  
          table: 'orders',  
          filter: \`market\_id=eq.${marketId}\`,  
        },  
        () \=\> {  
          fetchOrderBook();  
        }  
      )  
      .subscribe();

    return () \=\> {  
      supabase.removeChannel(channel);  
    };  
  }, \[marketId\]);

  const fetchOrderBook \= async () \=\> {  
    // Fetch buy orders (bids)  
    const { data: buyOrders } \= await supabase  
      .from('orders')  
      .select('price, quantity, filled\_quantity')  
      .eq('market\_id', marketId)  
      .eq('side', 'buy')  
      .in('status', \['open', 'partially\_filled'\])  
      .order('price', { ascending: false })  
      .limit(15);

    // Fetch sell orders (asks)  
    const { data: sellOrders } \= await supabase  
      .from('orders')  
      .select('price, quantity, filled\_quantity')  
      .eq('market\_id', marketId)  
      .eq('side', 'sell')  
      .in('status', \['open', 'partially\_filled'\])  
      .order('price', { ascending: true })  
      .limit(15);

    if (buyOrders) {  
      const aggregated \= aggregateOrders(buyOrders);  
      setBids(aggregated);  
    }

    if (sellOrders) {  
      const aggregated \= aggregateOrders(sellOrders);  
      setAsks(aggregated);  
    }

    // Calculate spread  
    if (buyOrders && buyOrders.length \> 0 && sellOrders && sellOrders.length \> 0\) {  
      const highestBid \= buyOrders\[0\].price;  
      const lowestAsk \= sellOrders\[0\].price;  
      setSpread(lowestAsk \- highestBid);  
    }  
  };

  const aggregateOrders \= (orders: any\[\]): OrderBookLevel\[\] \=\> {  
    const levels \= new Map\<number, number\>();  
      
    orders.forEach(order \=\> {  
      const remaining \= order.quantity \- order.filled\_quantity;  
      const current \= levels.get(order.price) || 0;  
      levels.set(order.price, current \+ remaining);  
    });

    let runningTotal \= 0;  
    const maxTotal \= Math.max(...Array.from(levels.values()));  
      
    return Array.from(levels.entries())  
      .map((\[price, quantity\]) \=\> {  
        runningTotal \+= quantity;  
        return {  
          price,  
          quantity,  
          total: runningTotal,  
          percentage: (runningTotal / maxTotal) \* 100,  
        };  
      });  
  };

  const OrderBookRow \= ({   
    level,   
    type   
  }: {   
    level: OrderBookLevel;   
    type: 'bid' | 'ask'   
  }) \=\> (  
    \<div className="relative flex items-center justify-between px-3 py-1 text-sm hover:bg-accent/50 cursor-pointer"\>  
      \<div  
        className={cn(  
          'absolute inset-0 opacity-20',  
          type \=== 'bid' ? 'bg-buy' : 'bg-sell'  
        )}  
        style={{ width: \`${level.percentage}%\` }}  
      /\>  
      \<span className={cn(  
        'relative z-10 font-medium',  
        type \=== 'bid' ? 'text-buy' : 'text-sell'  
      )}\>  
        {level.price.toFixed(4)}  
      \</span\>  
      \<span className="relative z-10 text-muted-foreground"\>  
        {level.quantity.toLocaleString()}  
      \</span\>  
      \<span className="relative z-10 text-muted-foreground"\>  
        {level.total.toLocaleString()}  
      \</span\>  
    \</div\>  
  );

  return (  
    \<Card className="h-full"\>  
      \<CardHeader className="pb-3"\>  
        \<div className="flex items-center justify-between"\>  
          \<CardTitle className="text-lg"\>{t('orderBook.title')}\</CardTitle\>  
          \<div className="text-sm text-muted-foreground"\>  
            {t('orderBook.spread')}: \<span className="text-foreground"\>{spread.toFixed(4)}\</span\>  
          \</div\>  
        \</div\>  
      \</CardHeader\>  
      \<CardContent className="p-0"\>  
        \<Tabs defaultValue="both" className="w-full"\>  
          \<TabsList className="grid w-full grid-cols-3 rounded-none"\>  
            \<TabsTrigger value="bids"\>{t('orderBook.bids')}\</TabsTrigger\>  
            \<TabsTrigger value="both"\>Both\</TabsTrigger\>  
            \<TabsTrigger value="asks"\>{t('orderBook.asks')}\</TabsTrigger\>  
          \</TabsList\>  
            
          \<div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-b"\>  
            \<span\>{t('price')}\</span\>  
            \<span\>{t('quantity')}\</span\>  
            \<span\>{t('total')}\</span\>  
          \</div\>

          \<TabsContent value="bids" className="mt-0 max-h-\[400px\] overflow-y-auto"\>  
            {bids.map((level, i) \=\> (  
              \<OrderBookRow key={i} level={level} type="bid" /\>  
            ))}  
          \</TabsContent\>

          \<TabsContent value="both" className="mt-0 max-h-\[400px\] overflow-y-auto"\>  
            \<div className="space-y-px"\>  
              {asks.slice().reverse().map((level, i) \=\> (  
                \<OrderBookRow key={\`ask-${i}\`} level={level} type="ask" /\>  
              ))}  
              \<div className="py-2 text-center text-lg font-semibold border-y"\>  
                {asks.length \> 0 ? asks\[0\].price.toFixed(4) : '-.----'}  
              \</div\>  
              {bids.map((level, i) \=\> (  
                \<OrderBookRow key={\`bid-${i}\`} level={level} type="bid" /\>  
              ))}  
            \</div\>  
          \</TabsContent\>

          \<TabsContent value="asks" className="mt-0 max-h-\[400px\] overflow-y-auto"\>  
            {asks.map((level, i) \=\> (  
              \<OrderBookRow key={i} level={level} type="ask" /\>  
            ))}  
          \</TabsContent\>  
        \</Tabs\>  
      \</CardContent\>  
    \</Card\>  
  );  
}

### **Price Chart Component (with Lightweight Charts)**

**`apps/web/src/components/trading/PriceChart.tsx`**

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

type ChartType \= 'line' | 'candlestick';  
type Timeframe \= '1H' | '4H' | '1D' | '1W' | 'ALL';

export function PriceChart({ marketId }: PriceChartProps) {  
  const chartContainerRef \= useRef\<HTMLDivElement\>(null);  
  const chartRef \= useRef\<IChartApi | null\>(null);  
  const seriesRef \= useRef\<ISeriesApi\<any\> | null\>(null);  
  const { theme } \= useTheme();  
  const \[chartType, setChartType\] \= useState\<ChartType\>('line');  
  const \[timeframe, setTimeframe\] \= useState\<Timeframe\>('1D');  
  const supabase \= createClient();

  useEffect(() \=\> {  
    if (\!chartContainerRef.current) return;

    // Chart colors based on theme  
    const isDark \= theme \=== 'dark';  
    const backgroundColor \= isDark ? '\#0f172a' : '\#ffffff';  
    const textColor \= isDark ? '\#e2e8f0' : '\#1e293b';  
    const gridColor \= isDark ? '\#1e293b' : '\#e2e8f0';

    // Create chart  
    const chart \= createChart(chartContainerRef.current, {  
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

    chartRef.current \= chart;

    // Create series based on type  
    createSeries(chart, chartType);

    // Fetch and set data  
    fetchChartData();

    // Handle resize  
    const handleResize \= () \=\> {  
      if (chartContainerRef.current && chartRef.current) {  
        chartRef.current.applyOptions({  
          width: chartContainerRef.current.clientWidth,  
        });  
      }  
    };

    window.addEventListener('resize', handleResize);

    return () \=\> {  
      window.removeEventListener('resize', handleResize);  
      chart.remove();  
    };  
  }, \[theme, chartType, timeframe, marketId\]);

  const createSeries \= (chart: IChartApi, type: ChartType) \=\> {  
    if (seriesRef.current) {  
      chart.removeSeries(seriesRef.current);  
    }

    if (type \=== 'line') {  
      seriesRef.current \= chart.addLineSeries({  
        color: '\#2563eb',  
        lineWidth: 2,  
      });  
    } else {  
      seriesRef.current \= chart.addCandlestickSeries({  
        upColor: '\#22c55e',  
        downColor: '\#ef4444',  
        borderVisible: false,  
        wickUpColor: '\#22c55e',  
        wickDownColor: '\#ef4444',  
      });  
    }  
  };

  const fetchChartData \= async () \=\> {  
    if (\!seriesRef.current) return;

    // Calculate time range based on timeframe  
    const now \= new Date();  
    const startTime \= new Date(now);  
      
    switch (timeframe) {  
      case '1H':  
        startTime.setHours(now.getHours() \- 1);  
        break;  
      case '4H':  
        startTime.setHours(now.getHours() \- 4);  
        break;  
      case '1D':  
        startTime.setDate(now.getDate() \- 1);  
        break;  
      case '1W':  
        startTime.setDate(now.getDate() \- 7);  
        break;  
      case 'ALL':  
        startTime.setFullYear(2000);  
        break;  
    }

    // Fetch trades for this market  
    const { data: trades } \= await supabase  
      .from('trades')  
      .select('price, created\_at, quantity')  
      .eq('market\_id', marketId)  
      .gte('created\_at', startTime.toISOString())  
      .order('created\_at', { ascending: true });

    if (\!trades || trades.length \=== 0\) return;

    if (chartType \=== 'line') {  
      const lineData \= trades.map(trade \=\> ({  
        time: new Date(trade.created\_at).getTime() / 1000,  
        value: trade.price,  
      }));  
      seriesRef.current.setData(lineData);  
    } else {  
      // Aggregate into candlesticks (1-minute bars)  
      const candleData \= aggregateToCandlesticks(trades, 60);  
      seriesRef.current.setData(candleData);  
    }

    // Fit content to view  
    chartRef.current?.timeScale().fitContent();  
  };

  const aggregateToCandlesticks \= (trades: any\[\], intervalSeconds: number) \=\> {  
    const candles \= new Map();

    trades.forEach(trade \=\> {  
      const timestamp \= new Date(trade.created\_at).getTime() / 1000;  
      const candleTime \= Math.floor(timestamp / intervalSeconds) \* intervalSeconds;

      if (\!candles.has(candleTime)) {  
        candles.set(candleTime, {  
          time: candleTime,  
          open: trade.price,  
          high: trade.price,  
          low: trade.price,  
          close: trade.price,  
        });  
      } else {  
        const candle \= candles.get(candleTime);  
        candle.high \= Math.max(candle.high, trade.price);  
        candle.low \= Math.min(candle.low, trade.price);  
        candle.close \= trade.price;  
      }  
    });

    return Array.from(candles.values()).sort((a, b) \=\> a.time \- b.time);  
  };

  return (  
    \<Card\>  
      \<CardHeader className="pb-3"\>  
        \<div className="flex items-center justify-between"\>  
          \<CardTitle className="text-lg"\>Price Chart\</CardTitle\>  
          \<div className="flex gap-2"\>  
            \<Tabs value={timeframe} onValueChange={(v) \=\> setTimeframe(v as Timeframe)}\>  
              \<TabsList\>  
                \<TabsTrigger value="1H"\>1H\</TabsTrigger\>  
                \<TabsTrigger value="4H"\>4H\</TabsTrigger\>  
                \<TabsTrigger value="1D"\>1D\</TabsTrigger\>  
                \<TabsTrigger value="1W"\>1W\</TabsTrigger\>  
                \<TabsTrigger value="ALL"\>ALL\</TabsTrigger\>  
              \</TabsList\>  
            \</Tabs\>  
            \<Tabs value={chartType} onValueChange={(v) \=\> setChartType(v as ChartType)}\>  
              \<TabsList\>  
                \<TabsTrigger value="line"\>Line\</TabsTrigger\>  
                \<TabsTrigger value="candlestick"\>Candles\</TabsTrigger\>  
              \</TabsList\>  
            \</Tabs\>  
          \</div\>  
        \</div\>  
      \</CardHeader\>  
      \<CardContent\>  
        \<div ref={chartContainerRef} /\>  
      \</CardContent\>  
    \</Card\>  
  );  
}

### **Trading Panel Component**

**`apps/web/src/components/trading/TradingPanel.tsx`**

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
  onOrderPlaced?: () \=\> void;  
}

export function TradingPanel({ market, onOrderPlaced }: TradingPanelProps) {  
  const { t } \= useTranslation('trading');  
  const { toast } \= useToast();  
  const \[side, setSide\] \= useState\<'buy' | 'sell'\>('buy');  
  const \[outcome, setOutcome\] \= useState\<'YES' | 'NO'\>('YES');  
  const \[orderType, setOrderType\] \= useState\<'market' | 'limit'\>('market');  
  const \[price, setPrice\] \= useState(market.yes\_price || 0.5);  
  const \[quantity, setQuantity\] \= useState(100);  
  const \[isSubmitting, setIsSubmitting\] \= useState(false);  
  const supabase \= createClient();

  const total \= price \* quantity;  
  const potentialProfit \= side \=== 'buy' ? (1 \- price) \* quantity : price \* quantity;  
  const roi \= ((potentialProfit / total) \* 100).toFixed(2);

  const handleSubmit \= async () \=\> {  
    setIsSubmitting(true);

    try {  
      const { data: { user } } \= await supabase.auth.getUser();  
      if (\!user) {  
        toast({  
          title: 'Authentication Required',  
          description: 'Please login to place orders',  
          variant: 'destructive',  
        });  
        return;  
      }

      // Check wallet balance  
      const { data: wallet } \= await supabase  
        .from('wallets')  
        .select('balance')  
        .eq('user\_id', user.id)  
        .single();

      if (\!wallet || wallet.balance \< total) {  
        toast({  
          title: 'Insufficient Balance',  
          description: 'Please deposit funds to place this order',  
          variant: 'destructive',  
        });  
        return;  
      }

      // Place order  
      const { data: order, error } \= await supabase  
        .from('orders')  
        .insert({  
          market\_id: market.id,  
          user\_id: user.id,  
          order\_type: orderType,  
          side,  
          outcome,  
          price,  
          quantity,  
        })  
        .select()  
        .single();

      if (error) throw error;

      // Trigger matching engine  
      await supabase.rpc('match\_order\_v2', { p\_order\_id: order.id });

      toast({  
        title: 'Order Placed',  
        description: \`${side.toUpperCase()} ${quantity} ${outcome} @ ${price.toFixed(4)}\`,  
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
    \<Card\>  
      \<CardHeader\>  
        \<CardTitle\>{t('placeOrder')}\</CardTitle\>  
      \</CardHeader\>  
      \<CardContent className="space-y-4"\>  
        {/\* Outcome Selection \*/}  
        \<div className="grid grid-cols-2 gap-2"\>  
          \<Button  
            variant={outcome \=== 'YES' ? 'default' : 'outline'}  
            className={cn(  
              'h-12',  
              outcome \=== 'YES' && 'bg-buy hover:bg-buy/90'  
            )}  
            onClick={() \=\> setOutcome('YES')}  
          \>  
            {t('yes')}  
            \<span className="ml-2 text-sm"\>  
              {(market.yes\_price || 0.5).toFixed(2)}¢  
            \</span\>  
          \</Button\>  
          \<Button  
            variant={outcome \=== 'NO' ? 'default' : 'outline'}  
            className={cn(  
              'h-12',  
              outcome \=== 'NO' && 'bg-sell hover:bg-sell/90'  
            )}  
            onClick={() \=\> setOutcome('NO')}  
          \>  
            {t('no')}  
            \<span className="ml-2 text-sm"\>  
              {(market.no\_price || 0.5).toFixed(2)}¢  
            \</span\>  
          \</Button\>  
        \</div\>

        {/\* Side Selection \*/}  
        \<Tabs value={side} onValueChange={(v) \=\> setSide(v as 'buy' | 'sell')}\>  
          \<TabsList className="grid w-full grid-cols-2"\>  
            \<TabsTrigger value="buy"\>{t('buy')}\</TabsTrigger\>  
            \<TabsTrigger value="sell"\>{t('sell')}\</TabsTrigger\>  
          \</TabsList\>  
        \</Tabs\>

        {/\* Order Type \*/}  
        \<Tabs value={orderType} onValueChange={(v) \=\> setOrderType(v as 'market' | 'limit')}\>  
          \<TabsList className="grid w-full grid-cols-2"\>  
            \<TabsTrigger value="market"\>{t('orderTypes.market')}\</TabsTrigger\>  
            \<TabsTrigger value="limit"\>{t('orderTypes.limit')}\</TabsTrigger\>  
          \</TabsList\>  
        \</Tabs\>

        {/\* Price (for limit orders) \*/}  
        {orderType \=== 'limit' && (  
          \<div className="space-y-2"\>  
            \<Label\>{t('price')}\</Label\>  
            \<Input  
              type="number"  
              step="0.01"  
              min={market.min\_price}  
              max={market.max\_price}  
              value={price}  
              onChange={(e) \=\> setPrice(parseFloat(e.target.value))}  
            /\>  
            \<Slider  
              value={\[price\]}  
              onValueChange={(v) \=\> setPrice(v\[0\])}  
              min={market.min\_price}  
              max={market.max\_price}  
              step={market.tick\_size}  
              className="py-2"  
            /\>  
          \</div\>  
        )}

        {/\* Quantity \*/}  
        \<div className="space-y-2"\>  
          \<Label\>{t('quantity')}\</Label\>  
          \<Input  
            type="number"  
            step="10"  
            min="10"  
            value={quantity}  
            onChange={(e) \=\> setQuantity(parseInt(e.target.value))}  
          /\>  
          \<Slider  
            value={\[quantity\]}  
            onValueChange={(v) \=\> setQuantity(v\[0\])}  
            min={10}  
            max={1000}  
            step={10}  
            className="py-2"  
          /\>  
        \</div\>

        {/\* Order Summary \*/}  
        \<div className="space-y-2 p-4 bg-muted rounded-lg"\>  
          \<div className="flex justify-between text-sm"\>  
            \<span className="text-muted-foreground"\>{t('avgPrice')}:\</span\>  
            \<span className="font-medium"\>{price.toFixed(4)}\</span\>  
          \</div\>  
          \<div className="flex justify-between text-sm"\>  
            \<span className="text-muted-foreground"\>{t('quantity')}:\</span\>  
            \<span className="font-medium"\>{quantity}\</span\>  
          \</div\>  
          \<div className="flex justify-between text-sm border-t pt-2"\>  
            \<span className="text-muted-foreground"\>{t('total')}:\</span\>  
            \<span className="font-bold"\>${total.toFixed(2)}\</span\>  
          \</div\>  
          \<div className="flex justify-between text-sm"\>  
            \<span className="text-muted-foreground"\>Potential Profit:\</span\>  
            \<span className="text-success font-medium"\>  
              ${potentialProfit.toFixed(2)} ({roi}%)  
            \</span\>  
          \</div\>  
        \</div\>

        {/\* Submit Button \*/}  
        \<Button  
          className={cn(  
            'w-full h-12',  
            side \=== 'buy' ? 'bg-buy hover:bg-buy/90' : 'bg-sell hover:bg-sell/90'  
          )}  
          onClick={handleSubmit}  
          disabled={isSubmitting}  
        \>  
          {isSubmitting ? 'Placing Order...' : \`${side.toUpperCase()} ${outcome}\`}  
        \</Button\>  
      \</CardContent\>  
    \</Card\>  
  );  
}

---

## **🏆 Leaderboard Implementation**

**`apps/web/src/app/(dashboard)/leaderboard/page.tsx`**

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
  user\_id: string;  
  username: string;  
  avatar\_url?: string;  
  total\_pnl: number;  
  total\_volume: number;  
  trades\_count: number;  
  win\_rate: number;  
}

type Timeframe \= 'daily' | 'weekly' | 'monthly' | 'all\_time';

export default function LeaderboardPage() {  
  const { t } \= useTranslation();  
  const \[timeframe, setTimeframe\] \= useState\<Timeframe\>('all\_time');  
  const \[leaderboard, setLeaderboard\] \= useState\<LeaderboardEntry\[\]\>(\[\]);  
  const \[loading, setLoading\] \= useState(true);  
  const supabase \= createClient();

  useEffect(() \=\> {  
    fetchLeaderboard();  
  }, \[timeframe\]);

  const fetchLeaderboard \= async () \=\> {  
    setLoading(true);

    const { data } \= await supabase  
      .from('leaderboard\_cache')  
      .select(\`  
        rank,  
        user\_id,  
        total\_pnl,  
        total\_volume,  
        trades\_count,  
        win\_rate,  
        users\!inner(username, avatar\_url)  
      \`)  
      .eq('timeframe', timeframe)  
      .order('rank', { ascending: true })  
      .limit(100);

    if (data) {  
      setLeaderboard(  
        data.map(entry \=\> ({  
          ...entry,  
          username: entry.users.username,  
          avatar\_url: entry.users.avatar\_url,  
        }))  
      );  
    }

    setLoading(false);  
  };

  const getRankBadge \= (rank: number) \=\> {  
    if (rank \=== 1\) return \<Trophy className="h-5 w-5 text-yellow-500" /\>;  
    if (rank \=== 2\) return \<Trophy className="h-5 w-5 text-gray-400" /\>;  
    if (rank \=== 3\) return \<Trophy className="h-5 w-5 text-amber-600" /\>;  
    return \<span className="text-muted-foreground"\>\#{rank}\</span\>;  
  };

  const LeaderboardRow \= ({ entry }: { entry: LeaderboardEntry }) \=\> (  
    \<div className="flex items-center gap-4 p-4 hover:bg-accent rounded-lg transition-colors"\>  
      \<div className="flex items-center justify-center w-12"\>  
        {getRankBadge(entry.rank)}  
      \</div\>  
        
      \<Avatar className="h-10 w-10"\>  
        \<AvatarImage src={entry.avatar\_url} /\>  
        \<AvatarFallback\>  
          {entry.username?.substring(0, 2).toUpperCase()}  
        \</AvatarFallback\>  
      \</Avatar\>  
        
      \<div className="flex-1"\>  
        \<p className="font-medium"\>{entry.username}\</p\>  
        \<p className="text-sm text-muted-foreground"\>  
          {entry.trades\_count} trades • {entry.win\_rate.toFixed(1)}% win rate  
        \</p\>  
      \</div\>  
        
      \<div className="text-right"\>  
        \<p className={cn(  
          'font-bold',  
          entry.total\_pnl \>= 0 ? 'text-success' : 'text-destructive'  
        )}\>  
          {entry.total\_pnl \>= 0 ? '+' : ''}${entry.total\_pnl.toFixed(2)}  
        \</p\>  
        \<p className="text-sm text-muted-foreground"\>  
          ${entry.total\_volume.toLocaleString()} volume  
        \</p\>  
      \</div\>  
    \</div\>  
  );

  return (  
    \<div className="container max-w-4xl py-8"\>  
      \<div className="space-y-6"\>  
        \<div\>  
          \<h1 className="text-3xl font-bold"\>Leaderboard\</h1\>  
          \<p className="text-muted-foreground"\>  
            Top traders ranked by profit & loss  
          \</p\>  
        \</div\>

        \<Tabs value={timeframe} onValueChange={(v) \=\> setTimeframe(v as Timeframe)}\>  
          \<TabsList\>  
            \<TabsTrigger value="daily"\>Daily\</TabsTrigger\>  
            \<TabsTrigger value="weekly"\>Weekly\</TabsTrigger\>  
            \<TabsTrigger value="monthly"\>Monthly\</TabsTrigger\>  
            \<TabsTrigger value="all\_time"\>All Time\</TabsTrigger\>  
          \</TabsList\>  
        \</Tabs\>

        \<Card\>  
          \<CardHeader\>  
            \<CardTitle\>Rankings\</CardTitle\>  
          \</CardHeader\>  
          \<CardContent\>  
            {loading ? (  
              \<div className="text-center py-8 text-muted-foreground"\>  
                Loading leaderboard...  
              \</div\>  
            ) : leaderboard.length \=== 0 ? (  
              \<div className="text-center py-8 text-muted-foreground"\>  
                No data available for this timeframe  
              \</div\>  
            ) : (  
              \<div className="space-y-2"\>  
                {leaderboard.map(entry \=\> (  
                  \<LeaderboardRow key={entry.user\_id} entry={entry} /\>  
                ))}  
              \</div\>  
            )}  
          \</CardContent\>  
        \</Card\>  
      \</div\>  
    \</div\>  
  );  
}

---

## **🔄 Realtime Updates Setup**

**`apps/web/src/hooks/useRealtimeMarket.ts`**

import { useEffect, useState } from 'react';  
import { createClient } from '@/lib/supabase/client';  
import type { Market } from '@/types';

export function useRealtimeMarket(marketId: string) {  
  const \[market, setMarket\] \= useState\<Market | null\>(null);  
  const supabase \= createClient();

  useEffect(() \=\> {  
    // Initial fetch  
    fetchMarket();

    // Subscribe to changes  
    const channel \= supabase  
      .channel(\`market:${marketId}\`)  
      .on(  
        'postgres\_changes',  
        {  
          event: 'UPDATE',  
          schema: 'public',  
          table: 'markets',  
          filter: \`id=eq.${marketId}\`,  
        },  
        (payload) \=\> {  
          setMarket(payload.new as Market);  
        }  
      )  
      .subscribe();

    return () \=\> {  
      supabase.removeChannel(channel);  
    };  
  }, \[marketId\]);

  const fetchMarket \= async () \=\> {  
    const { data } \= await supabase  
      .from('markets')  
      .select('\*')  
      .eq('id', marketId)  
      .single();

    if (data) setMarket(data);  
  };

  return market;  
}

---

## **📦 Dependencies**

**`apps/web/package.json`**

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

---

## **🚀 Deployment Steps**

### **1\. Supabase Setup**

\# Create Supabase project  
\# 1\. Go to https://app.supabase.com  
\# 2\. Click "New Project"  
\# 3\. Fill in project details  
\# 4\. Wait for setup to complete

\# Run migrations  
supabase link \--project-ref YOUR\_PROJECT\_REF  
supabase db push

\# Enable Realtime  
\# Go to Database \> Replication  
\# Enable realtime for: markets, orders, trades, positions

\# Configure Auth  
\# Go to Authentication \> Settings  
\# Enable Email provider  
\# Set Site URL to your Vercel domain

### **2\. Vercel Deployment**

\# Install Vercel CLI  
npm i \-g vercel

\# Login  
vercel login

\# Deploy  
cd apps/web  
vercel \--prod

\# Add environment variables in Vercel dashboard:  
\# NEXT\_PUBLIC\_SUPABASE\_URL  
\# NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY  
\# SUPABASE\_SERVICE\_ROLE\_KEY

### **3\. n8n Deployment (Optional)**

\# Using Docker  
cd docker/n8n  
docker-compose up \-d

\# Or deploy to Railway  
railway up

\# Configure workflows in n8n UI  
\# Access at http://localhost:5678

---

## **📊 Performance Optimization**

### **1\. Database Indexes**

All critical indexes are already included in the schema.

### **2\. Query Optimization**

// Use select() to fetch only needed fields  
const { data } \= await supabase  
  .from('markets')  
  .select('id, question, yes\_price, no\_price')  
  .eq('status', 'active');

// Use pagination for large datasets  
const { data } \= await supabase  
  .from('trades')  
  .select('\*')  
  .range(0, 49\) // First 50 items  
  .order('created\_at', { ascending: false });

### **3\. Caching Strategy**

// React Query for client-side caching  
import { useQuery } from '@tanstack/react-query';

const { data: markets } \= useQuery({  
  queryKey: \['markets'\],  
  queryFn: fetchMarkets,  
  staleTime: 60000, // 1 minute  
});

---

## **🧪 Testing**

### **Unit Tests**

// \_\_tests\_\_/matching-engine.test.ts  
describe('Matching Engine', () \=\> {  
  it('should match buy and sell orders', async () \=\> {  
    // Test implementation  
  });

  it('should calculate correct prices', async () \=\> {  
    // Test implementation  
  });  
});

### **E2E Tests**

// e2e/trading.spec.ts  
test('should place order successfully', async ({ page }) \=\> {  
  await page.goto('/markets/test-market');  
  await page.fill('\[data-testid="quantity"\]', '100');  
  await page.click('\[data-testid="place-order"\]');  
  await expect(page.locator('.toast')).toContainText('Order Placed');  
});

---

## **📚 API Documentation**

All API endpoints are auto-generated by Supabase PostgREST.

### **Examples**

// Get all active markets  
GET /rest/v1/markets?status=eq.active

// Get user's positions  
GET /rest/v1/positions?user\_id=eq.USER\_ID

// Place order  
POST /rest/v1/orders  
Body: { market\_id, side, outcome, price, quantity }

// Get order book  
GET /rest/v1/orders?market\_id=eq.MARKET\_ID\&status=in.(open,partially\_filled)

---

## **🔒 Security Checklist**

* \[ \] RLS enabled on all tables  
* \[ \] Environment variables secured  
* \[ \] CORS configured  
* \[ \] Rate limiting implemented  
* \[ \] Input validation on all forms  
* \[ \] SQL injection prevented (RLS)  
* \[ \] XSS prevention (React escaping)  
* \[ \] HTTPS enforced  
* \[ \] Authentication required for sensitive operations  
* \[ \] Admin routes protected

---

This comprehensive guide provides everything your AI agent needs to build a production-ready Plokymarket platform with all requested features\!

# Tab 3

# Tab 4

### **5.3 Admin Dashboard**

#### **5.3.1 Market Creation**

Guided workflow with quality gates:

TableCopy

| Stage | Validation | Timeline | Escalation |
| :---- | :---- | :---- | :---- |
| Template selection | Binary, categorical, scalar, custom | Immediate | N/A |
| Parameter configuration | Bounds, resolution criteria, oracle selection | 10 minutes | Auto-suggest based on category |
| Liquidity commitment | Minimum $1,000 from creator | 24h funding window | Auto-cancel if unfunded |
| Legal review | Sensitive topics, regulatory risk | 24h SLA | Senior counsel for edge cases |
| Preview & simulation | Virtual trading, price discovery test | Optional | Recommended for novel markets |
| Deployment | On-chain contract creation, indexing | \< 5 minutes | Manual rollback if issues |

#### **5.3.2 User Management**

Complete lifecycle controls:

TableCopy

| Function | Capability | Audit Trail |
| :---- | :---- | :---- |
| Profile viewing | Full KYC, trading history, risk score | All access logged |
| Status modification | Verification tier, trading restrictions, suspension | Dual authorization required |
| Position intervention | Liquidation, forced closure for risk | Real-time notification to user |
| Support integration | Ticket history, internal notes, escalation | CRM synchronization |

#### **5.3.3 Analytics**

Platform-wide metrics dashboard:

TableCopy

| Category | Metrics | Refresh Rate | Drill-Down |
| :---- | :---- | :---- | :---- |
| Trading | Volume, open interest, velocity, spread evolution | Real-time | Per market, per user tier |
| User | Acquisition, retention (cohort), activation, churn | Daily | Geographic, referral source |
| Financial | Revenue, fees, rewards, burn rate, runway | Hourly | Category, time series |
| Risk | Position concentration, correlation exposure, stress test | Real-time | Scenario analysis |
| Market quality | Quote persistence, fill rates, adverse selection | Per-trade | Maker/taker breakdown |

#### **5.3.4 Payment Management**

The payment management system implements the comprehensive wallet infrastructure with both dynamic and static address generation capabilities, optimized for emerging market accessibility with TRC20 USDT as primary deposit method.

Database Schema Extension:

sqlCopy

*\-- Extended wallets table for cryptocurrency support*  
ALTER TABLE public.wallets   
ADD COLUMN usdt\_address TEXT UNIQUE,  
ADD COLUMN qr\_code\_url TEXT,  
ADD COLUMN qr\_code\_data\_uri TEXT,  *\-- Base64 embedded for offline*  
ADD COLUMN network\_type TEXT DEFAULT 'TRC20'   
  CHECK (network\_type IN ('TRC20', 'ERC20', 'BEP20', 'SOL')),  
ADD COLUMN address\_type VARCHAR(20) DEFAULT 'STATIC'   
  CHECK (address\_type IN ('STATIC', 'DYNAMIC')),  
ADD COLUMN address\_generated\_at TIMESTAMPTZ,  
ADD COLUMN address\_expires\_at TIMESTAMPTZ,  *\-- For time-limited dynamic*  
ADD COLUMN network\_config JSONB DEFAULT '{  
  "confirmations\_required": 3,  
  "min\_deposit": 10.00,  
  "max\_deposit": 100000.00  
}',  
ADD COLUMN deposit\_whitelist\_enabled BOOLEAN DEFAULT FALSE,  
ADD COLUMN deposit\_whitelist\_addresses TEXT\[\],  
ADD COLUMN total\_deposits\_count INTEGER DEFAULT 0,  
ADD COLUMN total\_deposits\_volume\_usd DECIMAL(18, 8) DEFAULT 0.00,  
ADD COLUMN last\_deposit\_at TIMESTAMPTZ,

ADD COLUMN suspicious\_activity\_flag BOOLEAN DEFAULT FALSE;

Dynamic Address Generation (Supabase Edge Function):

TypeScriptCopy

*// supabase/functions/generate-wallet/index.ts*  
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'  
import { TronWeb } from 'https://esm.sh/tronweb@5.1.0'

const TRON\_FULL\_NODE \= Deno.env.get('TRON\_FULL\_NODE') || 'https://api.trongrid.io'  
const MASTER\_KEY \= Deno.env.get('TRON\_MASTER\_KEY')  *// HD wallet seed*

serve(async (req) \=\> {  
  const { user\_id, address\_type \= 'DYNAMIC' } \= await req.json()  
    
  const supabase \= createClient(  
    Deno.env.get('SUPABASE\_URL')\!,  
    Deno.env.get('SUPABASE\_SERVICE\_ROLE\_KEY')\!  
  )  
    
  *// Check for existing dynamic address*  
  const { data: existing } \= await supabase  
    .from('wallets')  
    .select('usdt\_address, address\_type')  
    .eq('user\_id', user\_id)  
    .single()  
    
  if (existing?.usdt\_address && existing.address\_type \=== 'DYNAMIC') {  
    return new Response(  
      JSON.stringify({   
        error: 'Dynamic address already exists',   
        address: existing.usdt\_address   
      }),  
      { status: 409 }  
    )  
  }  
    
  *// Generate HD wallet derivation path*  
  *// Path: m/44'/195'/userIndex'/0/0 (Tron coin type 195\)*  
  const userIndex \= deriveUserIndex(user\_id)  
  const derivedKey \= await derivePath(MASTER\_KEY, \`m/44'/195'/${userIndex}'/0/0\`)  
    
  const tronWeb \= new TronWeb({  
    fullHost: TRON\_FULL\_NODE,  
    privateKey: derivedKey.privateKey  
  })  
    
  const newAddress \= tronWeb.address.fromPrivateKey(derivedKey.privateKey)  
    
  *// Verify address validity on-chain*  
  const accountExists \= await tronWeb.trx.getAccount(newAddress)  
    .then(() \=\> true)  
    .catch(() \=\> false)  
    
  if (\!accountExists) {  
    *// Initialize with minimal TRX for activation if needed*  
    await fundActivationAddress(newAddress)  
  }  
    
  *// Generate QR codes*  
  const qrCodeURL \= await generateQRCode(newAddress, 'url')  
  const qrCodeDataURI \= await generateQRCode(newAddress, 'datauri')  
    
  *// Store in database*  
  const { error } \= await supabase  
    .from('wallets')  
    .update({  
      usdt\_address: newAddress,  
      qr\_code\_url: qrCodeURL,  
      qr\_code\_data\_uri: qrCodeDataURI,  
      address\_type: 'DYNAMIC',  
      address\_generated\_at: new Date().toISOString(),  
      address\_expires\_at: address\_type \=== 'DYNAMIC'   
        ? new Date(Date.now() \+ 90 \* 24 \* 60 \* 60 \* 1000).toISOString()  *// 90 days*  
        : null  
    })  
    .eq('user\_id', user\_id)  
    
  if (error) {  
    return new Response(  
      JSON.stringify({ error: 'Database update failed', details: error }),  
      { status: 500 }  
    )  
  }  
    
  return new Response(  
    JSON.stringify({  
      success: true,  
      address: newAddress,  
      qrCodeURL,  
      network: 'TRC20',  
      expiresAt: address\_type \=== 'DYNAMIC'   
        ? new Date(Date.now() \+ 90 \* 24 \* 60 \* 60 \* 1000).toISOString()  
        : null  
    }),  
    { status: 200 }  
  )

})

Payment Verification Flow (n8n workflow or Edge Function):

TypeScriptCopy

async function verifyPayment(txid: string, expectedAmount: number, userId: string) {  
  *// 1\. Blockchain API call to fetch transaction*  
  const txData \= await tronWeb.trx.getTransaction(txid)  
    .catch(err \=\> {  
      console.error('Transaction fetch failed:', err)  
      return null  
    })  
    
  if (\!txData) {  
    return { verified: false, reason: 'TRANSACTION\_NOT\_FOUND' }  
  }  
    
  *// 2\. Parse TRC20 transfer data*  
  const transferData \= parseTRC20Transfer(txData.raw\_data.contract\[0\])  
    
  if (\!transferData) {  
    return { verified: false, reason: 'NOT\_USDT\_TRANSFER' }  
  }  
    
  *// 3\. Verify recipient matches user's address*  
  const { data: wallet } \= await supabase  
    .from('wallets')  
    .select('usdt\_address')  
    .eq('user\_id', userId)  
    .single()  
    
  if (transferData.toAddress \!== wallet.usdt\_address) {  
    return { verified: false, reason: 'WRONG\_RECIPIENT' }  
  }  
    
  *// 4\. Check confirmations*  
  const currentBlock \= await tronWeb.trx.getCurrentBlock()  
  const confirmations \= currentBlock.block\_header.raw\_data.number \- txData.block  
    
  if (confirmations \< 3) {  
    return {   
      verified: false,   
      reason: 'INSUFFICIENT\_CONFIRMATIONS',  
      currentConfirmations: confirmations,  
      requiredConfirmations: 3  
    }  
  }  
    
  *// 5\. Verify amount (with 0.1% tolerance for fees)*  
  const receivedAmount \= transferData.amount / 1e6  *// USDT has 6 decimals*  
  const tolerance \= expectedAmount \* 0.001  
    
  if (Math.abs(receivedAmount \- expectedAmount) \> tolerance) {  
    return {   
      verified: false,   
      reason: 'AMOUNT\_MISMATCH',  
      expected: expectedAmount,  
      received: receivedAmount  
    }  
  }  
    
  *// 6\. Check for duplicate processing*  
  const { data: existing } \= await supabase  
    .from('deposit\_history')  
    .select('id')  
    .eq('blockchain\_txid', txid)  
    .single()  
    
  if (existing) {  
    return { verified: false, reason: 'ALREADY\_PROCESSED' }  
  }  
    
  *// 7\. Atomic balance update*  
  const { error: rpcError } \= await supabase.rpc('increment\_wallet\_balance', {  
    p\_user\_id: userId,  
    p\_amount: receivedAmount,  
    p\_txid: txid,  
    p\_confirmations: confirmations  
  })  
    
  if (rpcError) {  
    console.error('Balance update failed:', rpcError)  
    return { verified: false, reason: 'DATABASE\_ERROR' }  
  }  
    
  *// 8\. Record deposit history*  
  await supabase.from('deposit\_history').insert({  
    user\_id: userId,  
    blockchain\_txid: txid,  
    amount: receivedAmount,  
    network: 'TRC20',  
    confirmations,  
    status: 'CONFIRMED',  
    confirmed\_at: new Date().toISOString()  
  })  
    
  *// 9\. Update wallet statistics*  
  await supabase.rpc('update\_deposit\_stats', { p\_user\_id: userId })  
    
  return {   
    verified: true,   
    amount: receivedAmount,  
    confirmations,  
    processedAt: new Date().toISOString()  
  }

}

Three-Step User Flow:

TableCopy

| Step | User Action | System Response | Time |
| :---- | :---- | :---- | :---- |
| 1\. Request | Click "Deposit" | Generate `pending_transaction_id`, lock amount | \< 100ms |
| 2\. Present | View address/QR | Display `usdt_address`, `qr_code_url`, "Copy Address" button | \< 500ms |
| 3\. Verify | Submit TXID | Background verification, balance update, notification | 2-5 minutes (3 confirmations) |

Key UX optimizations: no site navigation required for complete deposit; real-time confirmation progress with block countdown; automatic balance refresh on verification; push notification on completion.

### **5.4 Theming and Mobile Responsiveness**

#### **5.4.1 Dark/Light Mode Toggle**

Implementation architecture:

TableCopy

| Layer | Technology | Behavior |
| :---- | :---- | :---- |
| Detection | `prefers-color-scheme` media query | System preference on first visit |
| Persistence | `localStorage` \+ cookie | Immediate server-side awareness |
| Application | CSS custom properties | Zero-JS runtime switching |
| Transition | CSS `transition` | 200ms smooth interpolation |
| Override | Manual toggle | User preference takes precedence |

Color system: 16 semantic color scales with guaranteed WCAG 2.1 AA compliance (4.5:1 normal text, 7:1 enhanced). Reduced motion respect via `prefers-reduced-motion` media query.

#### **5.4.2 Mobile-First Responsive Architecture**

Breakpoint system with component adaptation:

TableCopy

| Breakpoint | Range | Key Adaptations |
| :---- | :---- | :---- |
| Compact | 280-375px | Single column, bottom navigation, simplified order entry |
| Standard | 376-428px | Full feature access, thumb-zone optimization |
| Large mobile | 429-768px | Side navigation, expanded charts |
| Tablet | 769-1024px | Multi-pane layouts, hover interactions |
| Desktop | 1025-1440px | Full professional interface, keyboard shortcuts |
| Ultrawide | 1441px+ | Multiple market comparison, advanced analytics |

Touch optimization: 44×44dp minimum touch targets; gesture recognition for swipe, pinch, long-press; haptic feedback for critical actions; biometric authentication for high-value operations. Offline capability: service worker caching for position viewing, order drafting with sync on reconnection.

---

## **6\. Deployment and Infrastructure**

### **6.1 Cloud Architecture**

TableCopy

| Component | Provider | Configuration | Scaling |
| :---- | :---- | :---- | :---- |
| Frontend | Vercel Edge Network | Next.js 14, ISR, edge functions | Automatic global CDN |
| API/Edge Functions | Supabase \+ Deno Deploy | 35+ regions, \<50ms cold start | Zero-to-thousands in seconds |
| Database | Supabase PostgreSQL | Primary \+ 3 read replicas, connection pooling | Vertical \+ horizontal read |
| Matching Engine | AWS EC2 (c7i.2xlarge) | Dedicated instances, kernel bypass | Per-market shard scaling |
| Blockchain | Polygon \+ Solana public RPC | Fallback providers, private nodes for critical paths | N/A (external) |
| Storage | R2/S3 \+ Cloudflare Images | Immutable assets, optimized delivery | Unlimited |
| Monitoring | Datadog \+ PagerDuty | APM, infrastructure, custom trading metrics | Auto-alerting, runbooks |

### **6.2 Security Operations**

TableCopy

| Layer | Controls | Verification |
| :---- | :---- | :---- |
| Code | SAST (Semgrep), DAST (OWASP ZAP), dependency scanning | Pre-merge blocking |
| Infrastructure | Terraform validation, CIS benchmarks, network segmentation | Weekly compliance scan |
| Runtime | RASP, behavior analytics, anomaly detection | Real-time alerting |
| Incident | 24/7 SOC, 15-minute response SLA, automated containment | Quarterly tabletop exercises |
| Recovery | 4-hour RPO, 1-hour RTO for critical systems | Monthly disaster recovery test |

### **6.3 Performance Targets**

TableCopy

| Metric | Target | Measurement |
| :---- | :---- | :---- |
| Order placement latency | p99 \< 50ms | End-to-end, user to confirmation |
| Matching engine latency | p99 \< 500μs | Internal, receipt to fill notification |
| WebSocket update latency | p99 \< 100ms | Server emit to client receive |
| Page load (mobile 3G) | TTI \< 3.5s | Lighthouse, mid-range Android |
| API availability | 99.99% | Uptime monitoring, excluding planned maintenance |
| Blockchain settlement | \< 5 minutes (P1), \< 1 hour (P2) | From match to on-chain confirmation |

# Tab 5

# **Event & Market Architecture: "The Polymarket Model"**

## **1\. Core Hierarchy: Event vs. Market**

To replicate the robust structure of prediction markets, we distinguish between high-level **Events** and tradable **Markets**.

### The "Event" (Container)

Represents the real-world occurrence.

* **Examples**: "US Presidential Election 2024", "Super Bowl LVIII", "Bitcoin Price at YE 2024".  
* **Role**: Groups related markets, shares context (images, tags, category), and acts as the navigation anchor.  
* **Data Structure**:  
  * `Title`: "US Election 2024"  
  * `Slug`: `us-election-2024`  
  * `Category`: "Politics"  
  * `Start/End Date`: The lifecycle of the *event*, not necessarily the trading.

### The "Market" (contract)

Represents a specific *proposition* within that event that can be traded.

* **Examples**: "Winner" (Biden vs Trump), "Popular Vote Margin", "Winning Party".  
* **Role**: The actual order book and liquidity pool.  
* **Data Structure**:  
  * `Question`: "Who will win the 2024 US Presidential Election?"  
  * `Type`: Binary (Yes/No), Categorical (Multiple Choice), Scalar (Range).  
  * `Outcomes`: \[Yes, No\] or \[Republicans, Democrats, Independent\].  
  * `Resolution Rules`: Specific criteria for this contract.

---

## **2\. Advanced Market Templates**

Templates allow Admins to spin up complex markets instantly without redefining rules every time.

### Template Structure (JSON)

Each template defines the "Shape" of a market.

| Template ID | Name | Type | Key Features |
| :---- | :---- | :---- | :---- |
| `TV_SHOW_WINNER` | Reality TV Winner | Categorical | Auto-generates outcomes based on contestant list. |
| `CRYPTO_PRICE` | Crypto Price Target | Binary | Pre-filled resolution source (CoinGecko/Binance). |
| `ELECTION_WINNER` | Election Winner | Categorical | Requires "AP Call" or "FEC Certification" as source. |
| `SPORTS_MATCH` | Sports Game | Categorical | (Home/Away/Draw). Resolution via SportRadar/ESPN. |

### Configuration Flow

1. **Select Template**: Admin picks "Sports Match".  
2. **Input Parameters**: Admin inputs "Team A" and "Team B".  
3. **Auto-Generation**: System generates:  
   * **Question**: "Who will win Team A vs Team B?"  
   * **Outcomes**: \[Team A, Team B, Draw\]  
   * **Tags**: \[Sports, Soccer\]  
   * **Oracle Config**: Sets source to "Official League Website".

---

## **3\. Verification & Resolution Architecture (The "Oracle")**

This is the critical "Truth Engine". We use a **Multi-Stage Optimistic Oracle** model.

### Phase 1: The Trigger (Market Close)

* **Trigger**: `resolution_deadline` is reached OR `event_triggered` (e.g., game ends).  
* **Action**: Market status moves to `AWAITING_RESOLUTION`. Trading stops (or enters "post-only" reduce-only mode).

### Phase 2: The Proposal (Optimistic Truth)

* Who can propose?  
  1. **AI Agent (P1)**: The system's News Scraper/LLM proactively scans the defined `resolution_source_url`.  
     * If confidence \> 95%, it posts a proposal: "Team A Won".  
  2. **Admin (Fallback)**: If AI fails or is unsure, Admin manually proposes.  
  3. **User (Decentralized)**: (Future) Bonded users can propose the outcome.  
* **Asset**: A "Proposal Bond" is staked to prevent spam.

### Phase 3: The Challenge Window (Dispute Period)

* **Duration**: e.g., 2 hours (configurable per market).  
* **State**: `CHALLENGE_PERIOD`.  
* **Mechanism**:  
  * The proposed outcome is displayed publicly.  
  * **If Verified**: If time expires with NO challenges, the outcome is finalized.  
  * **If Challenged**: A specific "Dispute" is raised. A challenger stakes a bond matching the proposer.

### Phase 4: Dispute Resolution (The Court)

* **Trigger**: Valid Challenge raised.  
* **Adjudicator**:  
  * **Tier 1 (AI Re-check)**: Higher power LLM reviews the evidence.  
  * **Tier 2 (UMA/Kleros bridge)**: (Advanced) Send to on-chain oracle.  
  * **Tier 3 (Admin "God Mode")**: Super Admin manual override (for Beta/MVP).  
* **Result**: The disputes are settled, bonds are slashed (loser pays winner).

### Phase 5: Settlement

* **Action**: `settle_market(winning_outcome_id)`.  
* **Logic**:  
  * Winning Shares \-\> Redeemable for $1.00.  
  * Losing Shares \-\> Worth $0.00.  
  * Liquidity Providers \-\> Unlocked and returned \+ fees.

---

## **4\. Visual Architecture Diagram**

Truth EngineContainsContainsUsesGeneratesTrading LiveDate ReachedTriggerScrapesDataProposesWait 2hNoYesRulingPayoutEvent: US ElectionMarket: WinnerMarket: Pop VoteAdminTemplate: ElectionActiveLockedOracleNews SourcesAI AgentProposed: TRUMPChallenged?FinalizedDispute CourtUser Wallets

## **5\. Security & Integrity Features**

1. **Resolution Source Lock**: The URL/method for verification is written to the DB at creation and *cannot* be changed after trading starts.  
2. **Bonding**: Proposing/Challenging requires financial stake to prevent griefing.  
3. **Admin Override**: "Emergency Brake" to pause or cancel markets if ambiguous data arises.

# Tab 6

| Page | URL |
| :---- | :---- |
| Dashboard | [System Control Panel](https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2) |
| Market Control | [https://polymarket-bangladessh.vercel.app/](https://polymarket-bangladessh.vercel.app/sys-cmd-7x9k2**)sys-cmd-7x9k2/markets |
| User Management | [https://polymarket-bangladessh.vercel.app/](https://polymarket-bangladessh.vercel.app/sys-cmd-7x9k2**)sys-cmd-7x9k2/users |
| Analytics | [https://polymarket-bangladessh.vercel.app/](https://polymarket-bangladessh.vercel.app/sys-cmd-7x9k2**)sys-cmd-7x9k2/analytics |
| Events *(new)* | [https://polymarket-bangladessh.vercel.app/](https://polymarket-bangladessh.vercel.app/sys-cmd-7x9k2**)sys-cmd-7x9k2/events |
| Resolution *(new)* | [https://polymarket-bangladessh.vercel.app/](https://polymarket-bangladessh.vercel.app/sys-cmd-7x9k2**)sys-cmd-7x9k2/resolution |

# KYC

# [**arpiitt/AI-KYC-System: A modern Know Your Customer (KYC) verification system that uses artificial intelligence for face matching and document verification. This system provides a seamless way to verify user identity through document validation and facial recognition.**](https://github.com/arpiitt/AI-KYC-System)

# ***Implementation Plan \- AI-Powered KYC Integration***

## ***Goal***

*Integrate the [AI-KYC-System](https://github.com/arpiitt/AI-KYC-System) as a microservice to provide automated, free, and fully functional identity verification for Plokymarket.*

## ***Architecture***

*We will adopt a **Hybrid Architecture**:*

* ***Frontend (Next.js)**: Existing KYC UI (`/kyc`) collects data and uploads images to Supabase Storage.*  
* ***Backend (Next.js)**: New API route (`/api/kyc/verify`) acts as a gateway. It triggers the verification process.*  
* ***AI Microservice (Python)**: The `AI-KYC-System` running in a Docker container. It exposes a FastAPI endpoint to perform Face Matching and OCR.*  
* ***Database (Supabase)**: Stores the verification results and status.*

  ## ***User Review Required***

*IMPORTANT*

***Hosting Requirement**: The AI Microservice requires a runtime environment capable of running Docker containers (e.g., a VPS, DigitalOcean Droplet, Render, or the user's local machine for testing). It **cannot** run directly on Vercel Serverless Functions due to size and system dependency limits (OpenCV, Dlib).*

## ***Proposed Changes***

### *1\. AI Microservice Setup (New)*

*We will modify the cloned `AI-KYC-System` to be production-ready and Dockerized.*

#### *\[NEW\]* 

#### *docker-compose.yml*

* *Define the `kyc-service` container.*  
* *Expose port `8000`.*

  #### *\[NEW\]* 

  #### *Dockerfile*

* *Base image: `python:3.9-slim`.*  
* *Install system dependencies: `cmake`, `libgl1`, `libsm6`, `libxext6`, `tesseract-ocr`.*  
* *Install Python requirements.*

  #### *\[MODIFY\]* 

  #### *src/api/main.py*

* *Update `/api/kyc/verify` endpoint to accept **Image URLs** instead of file uploads.*  
* *This avoids double-uploading (Client \-\> Next.js \-\> Python) and leverages Supabase Storage.*

  #### *\[MODIFY\]* 

  #### *src/api/kyc\_processor.py*

* ***Upgrade Logic**: Replace the primitive `cv2.matchTemplate` (pixel comparison) with the robust `face_recognition` library (dlib embeddings) for accurate Face Matching.*  
* ***OCR**: Keep `pytesseract` for document data extraction.*

  ### *2\. Next.js Backend Integration*

  #### *\[NEW\]* 

  #### *apps/web/src/app/api/admin/kyc/verify/route.ts*

* *Admin-only endpoint to trigger manual AI verification for a user.*  
* *Fetches user's document URLs from Supabase.*  
* *Calls the Python Microservice.*  
* *Updates `user_kyc_profiles` based on the result.*

  #### *\[MODIFY\]* 

  #### *apps/web/src/lib/kyc/service.ts*

* *Add*   
* *verifyWithAi(userId: string) method.*

  ### *3\. Frontend Integration*

  #### *\[MODIFY\]* 

  #### *apps/web/src/app/sys-cmd-7x9k2/kyc/page.tsx (Admin Panel)*

* *Add a "Verify with AI" button to the User Detail view.*  
* *Display AI Confidence Score and OCR Data.*

  ## ***Verification Plan***

  ### *Automated Tests*

* ***Python Unit Tests**: Test the upgraded*   
* *verify\_face\_match with sample images.*

  ## ***Fixes & Troubleshooting***

* ***Class Definition Fix**: Added missing*   
* *KYCProcessor class to*   
* *kyc\_processor.py.*  
* ***SQL Conflicts**: Created*   
* *066\_fix\_kyc\_tables.sql to safely handle existing policies.*  
* ***Docker Command**: Switched to `docker compose` (v2) for better compatibility.*

  ### *Manual Verification*

1. *Start the Docker container.*  
2. *Submit a KYC application via the Plokymarket UI.*  
3. *Trigger "Verify with AI" from the Admin Panel.*  
4. *Verify that the Python service processes the images and returns a result.*  
5. *Verify that the user's status updates in Supabase.*  
1. 

# Tab 8

Here is the comprehensive technical architecture and implementation guide for \*\*Polymarket Bangladesh\*\* \- a zero-cost, automated payment infrastructure:

\---

\#\# 1\. SYSTEM ARCHITECTURE OVERVIEW

\#\#\# 1.1 Infrastructure Stack  
\`\`\`  
User Layer → API Gateway → Wallet Service → Blockchain Node → Binance P2P/RedotPay  
     ↓             ↓              ↓                ↓                  ↓  
  Web/App    Rate Limiter   HD Wallet     Tron/BSC Node      Payment Processors  
\`\`\`

\*\*Core Principle\*\*: Use \*\*USDT-TRC20\*\* (Tron Network) for 99% operations  
\- \*\*Why TRC20?\*\*: $0.5-$1 gas fees vs $5-$20 on ERC20. Binance supports deposits/withdrawals via TRC20.  
\- \*\*Backup\*\*: BEP20 (BSC) for high-congestion periods

\---

\#\# 2\. WALLET INFRASTRUCTURE (The Foundation)

\#\#\# 2.1 HD Wallet Architecture (Zero-Cost Generation)  
Instead of creating individual Binance accounts per user, generate \*\*deterministic wallets\*\* using BIP44 standard.

\*\*Implementation\*\*:  
\`\`\`javascript  
// Using tronweb.js or ethers.js  
const TronWeb \= require('tronweb');

// Master Key (Store in AWS Secrets Manager / HashiCorp Vault)  
const MASTER\_SEED \= process.env.MASTER\_SEED; 

// Generate unique address per user without blockchain fees  
function generateUserWallet(userId) {  
  const tronWeb \= new TronWeb({  
    fullHost: 'https://api.trongrid.io',  
    headers: { "TRON-PRO-API-KEY": process.env.TRONGRID\_KEY }  
  });  
    
  // Derivation path: m/44'/195'/userId'/0/0  
  // 195 is Tron's coin type  
  const path \= \`m/44'/195'/${userId}'/0/0\`;  
  const wallet \= tronWeb.fromMnemonic(MASTER\_SEED, path);  
    
  return {  
    address: wallet.address,  
    path: path,  
    // Private key is NOT stored; derived on-demand for sweeping  
  };  
}  
\`\`\`

\*\*Database Schema\*\*:  
\`\`\`sql  
CREATE TABLE user\_wallets (  
  id UUID PRIMARY KEY,  
  user\_id INT UNIQUE,  
  deposit\_address VARCHAR(42) UNIQUE, \-- TRC20 address  
  derivation\_path VARCHAR(50),  
  balance\_usdt DECIMAL(18,6) DEFAULT 0,  
  pending\_deposit DECIMAL(18,6) DEFAULT 0,  
  created\_at TIMESTAMP  
);

CREATE TABLE transactions (  
  id UUID PRIMARY KEY,  
  user\_id INT,  
  type ENUM('deposit', 'withdrawal', 'bet\_placement', 'winning'),  
  amount\_usdt DECIMAL(18,6),  
  tx\_hash VARCHAR(66),  
  status ENUM('pending', 'confirmed', 'failed'),  
  network VARCHAR(10) DEFAULT 'TRC20',  
  created\_at TIMESTAMP  
);  
\`\`\`

\#\#\# 2.2 Hot Wallet vs Cold Wallet Strategy  
\- \*\*Hot Wallet\*\*: 20% liquidity pool (connected to server, automated)  
\- \*\*Cold Wallet\*\*: 80% profit storage (offline/hardware wallet, manual withdrawal)

\*\*Sweeping Mechanism\*\*:  
\`\`\`javascript  
// Automated sweeping from user deposit addresses to hot wallet  
async function sweepDeposits() {  
  const pendingAddresses \= await getActiveDepositAddresses();  
    
  for (const addr of pendingAddresses) {  
    const balance \= await tronWeb.trx.getBalance(addr.address);  
    if (balance \> 10 USDT) { // Min threshold to justify gas fee  
      // Transfer to hot wallet  
      const tx \= await tronWeb.trx.sendTransaction(  
        HOT\_WALLET\_ADDRESS,   
        balance \- 1, // Leave 1 TRX for gas  
        addr.privateKey // Derived on-demand from master seed  
      );  
    }  
  }  
}  
\`\`\`

\---

\#\# 3\. DEPOSIT INTEGRATION (4 Methods)

\#\#\# 3.1 Method A: Binance P2P → User Wallet (Primary for BD)

\*\*Flow Architecture\*\*:  
\`\`\`  
User selects "Deposit via bKash/Nagad"  
        ↓  
System generates unique amount (e.g., 1002.45 BDT) \- "Payment ID encoding"  
        ↓  
User sends 1002.45 BDT to Agent's bKash  
        ↓  
Agent buys USDT on Binance P2P → Sends to User's TRC20 Address  
        ↓  
System detects blockchain deposit → Credits internal balance  
\`\`\`

\*\*Technical Implementation\*\*:

\*\*Step 1: Unique Amount Encoding\*\* (Automated Reconciliation)  
Instead of manual checking, use "Amount-Based Identification":  
\`\`\`javascript  
function generateDepositRequest(userId, baseAmount) {  
  // Add random cents (0.01-0.99) as identifier  
  const uniqueId \= (userId % 100\) / 100;   
  const finalAmount \= baseAmount \+ uniqueId; // e.g., 1000.47  
    
  return {  
    displayAmount: finalAmount.toFixed(2),  
    actualAmount: baseAmount,  
    identifier: uniqueId  
  };  
}  
\`\`\`

\*\*Step 2: Blockchain Monitoring\*\* (Free via TronGrid)  
\`\`\`javascript  
// WebSocket connection to TronGrid (Free tier: 10 req/sec)  
const tronWeb \= new TronWeb({ fullHost: 'https://api.trongrid.io' });

// Monitor Hot Wallet for incoming transfers  
tronWeb.trx.getContract(HOT\_WALLET\_ADDRESS).watch().then(event \=\> {  
  if (event.name \=== 'Transfer') {  
    const from \= event.result.from;  
    const to \= event.result.to;  
    const amount \= event.result.value / 1000000; // USDT has 6 decimals  
      
    // Match amount to user via unique decimal  
    const user \= await matchAmountToUser(amount);  
    await creditUserBalance(user.id, amount);  
  }  
});  
\`\`\`

\#\#\# 3.2 Method B: Direct Crypto Deposit (Global Users)  
Users deposit USDT-TRC20 directly from any exchange/wallet to their assigned address.

\*\*Auto-Credit System\*\*:  
\- Poll TronGrid API every 30 seconds for address balances  
\- Confirmations required: 19 blocks (\~1 minute)  
\- Auto-convert to internal ledger balance

\#\#\# 3.3 Method C: RedotPay Integration (Card Payments)

\*\*API Integration\*\*:  
\`\`\`javascript  
// RedotPay Merchant API  
const createRedotPayment \= async (userId, usdtAmount) \=\> {  
  const response \= await fetch('https://api.redotpay.com/v1/payments', {  
    method: 'POST',  
    headers: {  
      'Authorization': \`Bearer ${REDOT\_API\_KEY}\`,  
      'Content-Type': 'application/json'  
    },  
    body: JSON.stringify({  
      amount: usdtAmount,  
      currency: 'USDT',  
      order\_id: \`PM-${userId}-${Date.now()}\`,  
      callback\_url: 'https://api.polymarket-bd.com/webhook/redot',  
      success\_url: 'https://app.polymarket-bd.com/wallet/success'  
    })  
  });  
    
  return response.json(); // Returns checkout URL  
};  
\`\`\`

\*\*Webhook Handler\*\*:  
\`\`\`javascript  
app.post('/webhook/redot', async (req, res) \=\> {  
  const { order\_id, status, tx\_hash } \= req.body;  
  const userId \= extractUserFromOrder(order\_id);  
    
  if (status \=== 'confirmed') {  
    await db.transaction(async (trx) \=\> {  
      await trx('user\_wallets')  
        .where('user\_id', userId)  
        .increment('balance\_usdt', amount);  
        
      await trx('transactions').insert({  
        type: 'deposit',  
        method: 'redotpay',  
        tx\_hash,  
        status: 'confirmed'  
      });  
    });  
  }  
  res.sendStatus(200);  
});  
\`\`\`

\#\#\# 3.4 Method D: Zero-Fee Internal Transfers (Future P2P)  
Users can transfer USDT between themselves internally without blockchain fees (off-chain ledger update).

\---

\#\# 4\. WITHDRAWAL SYSTEM (User Cash Out)

\#\#\# 4.1 Crypto Withdrawal (Direct to Binance)  
Users withdraw USDT to any TRC20 address (their Binance wallet).

\*\*Security Flow\*\*:  
\`\`\`javascript  
async function processWithdrawal(userId, amount, toAddress) {  
  // 1\. Check balance  
  const wallet \= await getUserWallet(userId);  
  if (wallet.balance \< amount) throw new Error('Insufficient balance');  
    
  // 2\. Risk Check (Rule-based)  
  if (amount \> 1000\) await requireKYC(userId);  
  if (isBlacklisted(toAddress)) throw new Error('Address blocked');  
    
  // 3\. Deduct balance (Pessimistic locking)  
  await db.raw(\`  
    UPDATE user\_wallets   
    SET balance\_usdt \= balance\_usdt \- ?   
    WHERE user\_id \= ? AND balance\_usdt \>= ?  
  \`, \[amount, userId, amount\]);  
    
  // 4\. Queue blockchain transaction  
  await withdrawalQueue.add({  
    to: toAddress,  
    amount: amount \- 1, // Subtract network fee (1 USDT)  
    network: 'TRC20'  
  });  
    
  return { status: 'processing', eta: '2-5 minutes' };  
}  
\`\`\`

\#\#\# 4.2 Fiat Withdrawal (bKash/Nagad) \- P2P Reverse  
\*\*The Process\*\*:  
\`\`\`  
User requests 5000 BDT withdrawal  
        ↓  
System deducts USDT from balance (e.g., 41 USDT @ 122 BDT/USDT)  
        ↓  
Admin sells USDT on Binance P2P → Gets bKash  
        ↓  
Admin sends bKash to user  
        ↓  
System marks as completed  
\`\`\`

\*\*Admin Dashboard for Fiat Withdrawal\*\*:  
\- Queue system: FIFO (First In First Out)  
\- Auto-calculation: Current Binance P2P rate \- 1% spread (your profit margin)  
\- Bulk processing: Group small withdrawals to reduce P2P trades

\---

\#\# 5\. PROFIT MANAGEMENT & WITHDRAWAL (Your Revenue)

\#\#\# 5.1 Revenue Streams Identification  
1\. \*\*Spread on P2P\*\*: Buy rate vs Sell rate difference (1-2%)  
2\. \*\*Withdrawal Fee\*\*: 0.5-1% per withdrawal (competitive with banks)  
3\. \*\*Trading Fee\*\*: 0.1% per bet (Polymarket model)

\#\#\# 5.2 Automated Profit Segregation  
Every transaction splits funds:  
\`\`\`javascript  
// On user deposit of 100 USDT  
const grossDeposit \= 100;  
const platformFee \= grossDeposit \* 0.01; // 1% \= 1 USDT  
const netToUser \= grossDeposit \- platformFee;

// Ledger entries  
await db('ledger').insert(\[  
  { account: 'user\_wallet', amount: netToUser, type: 'credit' },  
  { account: 'platform\_revenue', amount: platformFee, type: 'credit' },  
  { account: 'hot\_wallet', amount: \-grossDeposit, type: 'debit' }  
\]);  
\`\`\`

\#\#\# 5.3 Profit Withdrawal System (Your Cash Out)  
\*\*Architecture\*\*:  
\- \*\*Accumulation Wallet\*\*: All fees collect here (automated sweep from hot wallet)  
\- \*\*Conversion Trigger\*\*: When balance \> $5000, auto-convert to BDT

\*\*Implementation\*\*:  
\`\`\`javascript  
// Cron job: Daily at 00:00  
async function sweepProfits() {  
  const profitBalance \= await getRevenueWalletBalance();  
    
  if (profitBalance \> 5000\) {  
    // Transfer to Binance deposit address (your corporate account)  
    await tronWeb.trx.sendTransaction(  
      BINANCE\_DEPOSIT\_ADDRESS, // Your Binance TRC20 deposit address  
      profitBalance \- 10, // Leave gas money  
      REVENUE\_WALLET\_KEY  
    );  
      
    // Now sell on Binance P2P manually or via API (if available) to bKash  
    notifyAdmin('Profit ready for P2P sale', profitBalance);  
  }  
}  
\`\`\`

\*\*Tax Compliance Strategy\*\*:  
\- Maintain two wallets: \`operational\_profit\` (for expenses) and \`retained\_earnings\`  
\- Use RedotPay Corporate Card for international expenses (servers, APIs)  
\- Local withdrawals via Binance P2P to registered business bKash account

\---

\#\# 6\. ZERO-COST IMPLEMENTATION STRATEGY

\#\#\# 6.1 Free Infrastructure Tiers  
| Component | Free Tier | Limit |  
|-----------|-----------|-------|  
| \*\*TronGrid API\*\* | 10 req/sec | Sufficient for \<10k users |  
| \*\*AWS/Heroku\*\* | 12 months free tier | Host backend |  
| \*\*PostgreSQL\*\* | Supabase free tier | 500MB, enough for start |  
| \*\*Redis\*\* | Upstash free | For queues |  
| \*\*Cloudflare\*\* | Free plan | CDN \+ DDoS protection |

\#\#\# 6.2 Gas Fee Optimization  
\- \*\*Fee Sponsorship\*\*: Use Tron's "Delegated Resources" \- stake TRX to get free bandwidth/energy for transactions  
\- \*\*Batch Processing\*\*: Group withdrawals every 4 hours instead of instant  
\- \*\*User-Paid Gas\*\*: Deduct 1 USDT from each withdrawal (standard practice)

\#\#\# 6.3 Zero-Cost P2P Agent Model  
Instead of hiring agents:  
\- \*\*Community Agents\*\*: Users can become "verified cashiers"   
\- They deposit float money upfront (e.g., 50,000 BDT)  
\- They earn 0.5% per transaction they process  
\- You only maintain the escrow system

\---

\#\# 7\. SECURITY ARCHITECTURE

\#\#\# 7.1 Multi-Signature Wallets (For Hot Wallet)  
Require 2/3 signatures for any outgoing transaction \> $1000:  
1\. Server signature (automated)  
2\. Admin signature (mobile app approval)  
3\. Backup signature (offline)

\#\#\# 7.2 Anti-Fraud System  
\`\`\`javascript  
const riskRules \= {  
  'new\_user\_limit': 100, // First deposit max $100  
  'velocity\_check': 'max\_3\_deposits\_per\_hour',  
  'blacklist\_countries': \['NK', 'IR'\],  
  'address\_reuse': 'flag\_if\_same\_address\_used\_by\_2\_users'  
};  
\`\`\`

\#\#\# 7.3 Backup & Recovery  
\- \*\*Daily encrypted backups\*\* of database to S3  
\- \*\*Seed phrase\*\*: Split using Shamir's Secret Sharing (3-of-5)  
  \- 1 part: Founder  
  \- 1 part: Co-founder    
  \- 1 part: Lawyer  
  \- 2 parts: Encrypted in separate clouds

\---

\#\# 8\. STEP-BY-STEP IMPLEMENTATION ROADMAP

\#\#\# Phase 1: MVP (Week 1-2)  
1\. Set up HD wallet generator  
2\. Create deposit addresses for 100 test users  
3\. Manual P2P process (you act as agent)  
4\. Basic balance tracking in Excel/Sheets

\#\#\# Phase 2: Automation (Week 3-4)  
1\. TronGrid integration for auto-deposit detection  
2\. RedotPay API integration  
3\. Automated ledger updates  
4\. Simple admin dashboard

\#\#\# Phase 3: Scale (Month 2\)  
1\. Multi-agent P2P system  
2\. Automated profit sweeping  
3\. Withdrawal queue system  
4\. Risk management rules

\#\#\# Phase 4: Optimization (Month 3\)  
1\. Batch processing to reduce fees  
2\. Internal P2P matching (User A withdraws 100 USDT, User B deposits 100 USDT \= Internal transfer, zero blockchain fee)  
3\. Mobile app for agents

\---

\#\# 9\. BINANCE INTEGRATION SPECIFICS

\#\#\# 9.1 Getting Binance Deposit Addresses  
\*\*For User Deposits\*\*:  
\- Users provide their Binance \*\*TRC20 deposit address\*\* (starts with T...)  
\- Your system sends USDT there directly

\*\*For Your Corporate Account\*\*:  
1\. Login to Binance → Wallet → Deposit → USDT → Select TRC20  
2\. Copy address: \`TV6MuV...\`   
3\. Set this as \`BINANCE\_DEPOSIT\_ADDRESS\` in your config for profit sweeping

\#\#\# 9.2 Binance Pay API (Alternative to P2P)  
If you get Binance Pay Merchant approval:  
\`\`\`javascript  
// Direct integration without P2P hassle  
const binancePay \= require('binance-pay');

const order \= await binancePay.createOrder({  
  merchantTradeNo: \`PM-${userId}\`,  
  orderAmount: amount,  
  currency: 'USDT',  
  productType: 'Prediction Market',  
  productName: 'Wallet Deposit'  
});  
\`\`\`

\---

\#\# 10\. MONITORING & ALERTS

Set up Telegram/Discord alerts for:  
\- Deposit \> $500 received  
\- Withdrawal \> $1000 requested  
\- Hot wallet balance \< $1000 (refill needed)  
\- Failed transaction \> 3 in 10 minutes  
\- Suspicious IP access

\*\*Example Alert\*\*:  
\`\`\`  
🚨 LARGE WITHDRAWAL  
User: @username (ID: 123\)  
Amount: 5000 USDT  
To: TV6MuV...  
Risk Score: 2/10  
Approve: \[YES\] \[NO\]  
\`\`\`

\---

\#\# Summary: The "Free" Economics

\*\*Your Costs\*\*:   
\- Server: $0 (free tier)  
\- Gas Fees: Paid by users (deducted from withdrawals)  
\- APIs: TronGrid free tier sufficient  
\- Labor: Automated (you only monitor)

\*\*Your Revenue\*\*:  
\- 1% on deposits (spread)  
\- 0.5% on withdrawals  
\- 1% on trading volume

\*\*Break-even\*\*: 0 USD (revenue starts from first transaction)

This architecture allows you to run a full-fledged prediction market with banking integration at essentially zero fixed cost, scaling only as transaction volume (and revenue) grows.  
