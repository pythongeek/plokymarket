# Plokymarket - Polymarket-Style Prediction Marketplace

A complete Polymarket-style prediction marketplace built with React, Supabase, and Docker.

## 📁 Project Structure

```
plokymarket/
├── 📁 apps/
│   └── 📁 web/                    # Vite + React Frontend
│       ├── src/
│       │   ├── app/               # React App Router
│       │   ├── components/        # React Components
│       │   ├── lib/              # Utilities, Supabase Client
│       │   ├── pages/            # Application Pages
│       │   ├── store/            # Zustand State Management
│       │   ├── types/            # TypeScript Types
│       │   └── services/         # API Services
│       ├── package.json
│       └── vite.config.ts
│
├── 📁 supabase/                   # Local Supabase Setup
│   ├── docker-compose.yml         # PostgreSQL + PostgREST
│   ├── db/
│   │   ├── init.sql              # Database Schema
│   │   └── matching_engine.sql    # Matching Engine Functions
│   ├── .env.example
│   └── README.md
│
└── 📁 docker/
    └── 📁 n8n/
        ├── docker-compose.yml
        └── workflows/
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- npm or yarn

---

### Phase 1: Start Supabase (Database)

```bash
cd supabase

# 1. Copy environment variables
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD

# 2. Start PostgreSQL
docker-compose up -d postgres

# 3. Wait for PostgreSQL to be ready
docker logs polymarket-postgres --follow

# 4. Initialize Database Schema
docker exec -i polymarket-postgres psql -U postgres -d polymarket < db/init.sql

# 5. Apply Matching Engine Functions
docker exec -i polymarket-postgres psql -U postgres -d polymarket < db/matching_engine.sql
```

**Database Access:**
- PostgreSQL: `localhost:5433`
- PostgREST API: `http://localhost:3000`

---

### Phase 2: Start Frontend

```bash
cd apps/web

# 1. Copy environment variables
cp .env.example .env.local
# Edit .env.local and set:
# VITE_SUPABASE_URL=http://localhost:5433
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

**Frontend Access:** `http://localhost:5173`

---

## 📋 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Extended user profiles (linked to Supabase Auth) |
| `wallets` | User balances (available & locked) |
| `markets` | Prediction markets with questions |
| `orders` | Limit and market orders |
| `trades` | Completed trades |
| `positions` | User positions in markets |
| `transactions` | Wallet transaction history |
| `oracle_verifications` | AI verification results |
| `payment_transactions` | Payment history |

### Enums

```sql
market_status: 'active' | 'closed' | 'resolved' | 'cancelled'
outcome_type: 'YES' | 'NO'
order_type: 'limit' | 'market'
order_side: 'buy' | 'sell'
order_status: 'open' | 'partially_filled' | 'filled' | 'cancelled'
```

---

## 🔧 Matching Engine

The matching engine is implemented as PostgreSQL functions:

### Functions

| Function | Description |
|----------|-------------|
| `match_order(p_order_id)` | Matches a new order against existing orders |
| `update_position(...)` | Updates user positions after trades |
| `process_trade_settlement(...)` | Settles trades between buyer and seller |
| `settle_market(p_market_id, p_winning_outcome)` | Settles a resolved market |

### Matching Algorithm

1. **Buy Orders**: Match against sell orders with:
   - Same outcome (YES/YES or NO/NO)
   - Price <= order price
   - OR opposite outcome with combined probability <= 1.00

2. **Sell Orders**: Match against buy orders with:
   - Same outcome
   - Price >= order price

3. **Price Priority**: Earlier orders get better prices (time priority)

---

## 🔐 Authentication

Uses Supabase Auth with email/password:

```typescript
// Login
await signIn(email, password);

// Register
await signUp(email, password, fullName);

// Logout
await signOut();
```

---

## 🛒 Trading Flow

1. **Place Order**: User creates a limit order
2. **Lock Funds**: For buy orders, funds are locked in wallet
3. **Matching**: Order is matched against opposite orders
4. **Settlement**: Trades are settled, positions updated
5. **Resolution**: Market is resolved by admin
6. **Payout**: Winners receive payouts (1 USDC per share)

---

## 🐳 Docker Services

### Supabase (Database)

```bash
cd supabase
docker-compose up -d
```

### n8n (Automation) - Optional

```bash
cd docker/n8n
docker-compose up -d
```

Access n8n at `http://localhost:5678`

---

## 🧪 Testing Checklist

### Authentication
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Session persists on refresh

### Markets
- [ ] Markets list loads
- [ ] Market details display
- [ ] Price chart renders
- [ ] Order book shows data

### Trading
- [ ] Can place buy order
- [ ] Can place sell order
- [ ] Order appears in order book
- [ ] Wallet balance updates
- [ ] Position updates after trade

### Admin
- [ ] Admin can access admin panel
- [ ] Can create new market
- [ ] Can resolve market

---

## 🚀 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Database (Supabase Cloud)

1. Create project at [app.supabase.com](https://app.supabase.com)
2. Run migrations from `supabase/db/init.sql`
3. Run matching engine from `supabase/db/matching_engine.sql`
4. Update environment variables with new credentials

---

## 📝 Environment Variables

### Supabase (.env)
```env
POSTGRES_PASSWORD=your_password
SITE_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=http://localhost:5433
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📄 License

MIT License
