# Plokymarket - Agent Development Guide

## Project Overview

Plokymarket is a Polymarket-style prediction marketplace built for the Bangladesh market. It allows users to trade on the outcome of future events (sports, crypto, politics, etc.) using a CLOB (Central Limit Order Book) matching engine.

**Key Features:**
- Binary outcome markets (YES/NO predictions)
- Real-time order book with limit and market orders
- Wallet management with local payment methods (bKash, Nagad)
- AI-powered oracle system for market resolution
- Multi-language support (Bangla default, English, Hindi)
- Admin panel for market creation and resolution

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3 (App Router)
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **State Management**: Zustand (with persistence)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion

### Backend & Database
- **Database**: PostgreSQL 15 (via Supabase)
- **API**: PostgREST + Supabase client
- **Authentication**: Supabase Auth with email/password
- **Row Level Security (RLS)**: Enabled on all tables

### Infrastructure
- **Deployment**: Vercel (frontend)
- **Database Hosting**: Supabase Cloud
- **Docker**: Local development setup for PostgreSQL

---

## Project Structure

```
plokymarket/
├── apps/
│   └── web/                          # Next.js frontend application
│       ├── src/
│       │   ├── app/                  # Next.js App Router
│       │   │   ├── (auth)/           # Auth routes (login, register)
│       │   │   ├── (dashboard)/      # Main app routes
│       │   │   │   ├── markets/      # Market list & details
│       │   │   │   ├── portfolio/    # User positions
│       │   │   │   ├── wallet/       # Wallet management
│       │   │   │   ├── activity/     # Activity feed
│       │   │   │   └── leaderboard/  # User rankings
│       │   │   ├── admin/            # Admin panel
│       │   │   ├── api/              # API routes (AI oracle, etc.)
│       │   │   ├── layout.tsx        # Root layout
│       │   │   ├── page.tsx          # Home page
│       │   │   └── globals.css       # Global styles
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui components
│       │   │   ├── trading/          # Trading components
│       │   │   ├── market/           # Market display components
│       │   │   ├── portfolio/        # Portfolio components
│       │   │   ├── layout/           # Layout components
│       │   │   └── providers/        # Context providers
│       │   ├── lib/                  # Utilities & services
│       │   │   ├── supabase/         # Supabase clients
│       │   │   ├── clob/             # Order book engine
│       │   │   ├── oracle/           # AI oracle system
│       │   │   ├── wallet/           # Wallet services
│       │   │   └── utils.ts          # Utility functions
│       │   ├── hooks/                # Custom React hooks
│       │   ├── store/                # Zustand store
│       │   ├── types/                # TypeScript types
│       │   └── i18n/                 # Internationalization
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── supabase/                         # Database configuration
│   ├── docker-compose.yml            # Local PostgreSQL setup
│   ├── db/
│   │   ├── init.sql                  # Database schema
│   │   ├── matching_engine.sql       # Order matching functions
│   │   └── schema_production.sql     # Production schema
│   └── migrations/                   # Database migrations (001-028)
│
├── automation/                       # Automation scripts
├── docs/                             # Documentation
└── instructions/                     # Project instructions
```

---

## Build and Development Commands

### Frontend (apps/web)

```bash
cd apps/web

# Install dependencies
npm install

# Development server
npm run dev          # Runs on http://localhost:3000

# Build for production
npm run build

# Production server
npm run start

# Linting
npm run lint
```

### Database (Local Development)

```bash
cd supabase

# Copy environment file
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD

# Start PostgreSQL
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
docker logs polymarket-postgres --follow

# Initialize database schema
docker exec -i polymarket-postgres psql -U postgres -d polymarket < db/init.sql

# Apply matching engine functions
docker exec -i polymarket-postgres psql -U postgres -d polymarket < db/matching_engine.sql

# Access PostgreSQL
docker exec -it polymarket-postgres psql -U postgres -d polymarket
```

**Database Access:**
- PostgreSQL: `localhost:5433`
- PostgREST API: `http://localhost:3000`

---

## Environment Variables

### Frontend (.env.local)

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: AI Oracle
GEMINI_API_KEY=your-gemini-api-key
```

### Supabase Local (.env)

```env
POSTGRES_PASSWORD=your_secure_password
SITE_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

---

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Use explicit types for function parameters and returns
- Avoid `any` type - use `unknown` with type guards
- Use interfaces for object shapes, types for unions

### Naming Conventions
- **Components**: PascalCase (e.g., `TradingPanel.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useOrderBook.ts`)
- **Utils/Services**: camelCase (e.g., `matchingEngine.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Order`, `MarketStatus`)
- **Database**: snake_case (e.g., `user_id`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE

### File Organization
- Group related components in folders
- Co-locate types with their primary usage
- Use barrel exports (`index.ts`) for public APIs
- Keep components under 300 lines; extract logic to hooks

### Imports Order
1. React/Next.js imports
2. Third-party libraries
3. Absolute imports (`@/components`, `@/lib`)
4. Relative imports
5. Type imports

### Error Handling
- Use try/catch for async operations
- Log errors with context: `console.error('Context:', error)`
- Return user-friendly error messages from API calls

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles (linked to Supabase Auth) |
| `wallets` | User balances (available & locked) |
| `markets` | Prediction markets with questions |
| `orders` | Limit and market orders |
| `trades` | Completed trades |
| `positions` | User positions in markets |
| `transactions` | Wallet transaction history |
| `oracle_verifications` | AI verification results |
| `payment_transactions` | Deposit/withdrawal history |

### Enums

```typescript
market_status: 'active' | 'closed' | 'resolved' | 'cancelled'
outcome_type: 'YES' | 'NO'
order_type: 'limit' | 'market'
order_side: 'buy' | 'sell'
order_status: 'open' | 'partially_filled' | 'filled' | 'cancelled'
transaction_type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'settlement' | 'refund'
payment_method: 'bkash' | 'nagad' | 'bank_transfer'
```

### Key Indexes
- `orders`: market_id + outcome + side + status + price (for matching)
- `trades`: market_id + created_at (for market data)
- `positions`: user_id + market_id (for portfolio)

---

## Key Services

### Supabase Client (`lib/supabase/client.ts`)
Browser client for Supabase. Uses `@supabase/ssr` for SSR compatibility.

### State Management (`store/useStore.ts`)
Zustand store with persistence for:
- Authentication state
- Market data
- Trading state
- User portfolio

### Matching Engine (`lib/clob/`)
Central Limit Order Book implementation:
- Price-time priority matching
- Pro-rata allocation support
- Order validation
- Risk management

### Oracle System (`lib/oracle/`)
AI-powered market resolution:
- Web scraping for evidence
- Multi-agent consensus
- Human review queue
- Dispute resolution

---

## Testing Instructions

### Manual Testing Checklist

**Authentication:**
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Session persists on refresh
- [ ] Rate limiting works on login

**Markets:**
- [ ] Markets list loads
- [ ] Market details display
- [ ] Price chart renders
- [ ] Order book shows data

**Trading:**
- [ ] Can place buy order
- [ ] Can place sell order
- [ ] Order appears in order book
- [ ] Wallet balance updates
- [ ] Position updates after trade

**Admin:**
- [ ] Admin can access admin panel
- [ ] Can create new market
- [ ] Can resolve market

---

## Internationalization

Default language is **Bangla (bn)**. Supported languages:
- `bn` - Bangla (default)
- `en` - English
- `hi` - Hindi

Translation files located in `src/i18n/locales/`.

To add a new translation key:
1. Add to all locale files
2. Use in component: `const { t } = useTranslation(); t('key.subkey')`

---

## Security Considerations

### Authentication
- Uses Supabase Auth with secure session management
- Row Level Security (RLS) enforced on all tables
- Rate limiting on login attempts

### Database Security
- RLS policies ensure users can only access their own data
- Admin operations require `is_admin = true`
- Sensitive operations use database functions (RPC)

### API Security
- Middleware handles session updates
- API routes validate user permissions
- Environment variables for secrets

---

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Database Migration (Production)

1. Create project at [app.supabase.com](https://app.supabase.com)
2. Run migrations from `supabase/migrations/` in order
3. Update environment variables with new credentials

---

## Common Issues

### Build Errors
- Ensure `next.config.js` has `ignoreDuringBuilds: true` for eslint/typescript if needed
- Check that all imports use `@/` aliases correctly

### Database Connection
- Verify Supabase URL and anon key in `.env.local`
- Check RLS policies if queries return empty results
- Ensure migrations are applied in correct order

### Type Errors
- Run `npm run build` to check for type errors
- Ensure all database columns are reflected in TypeScript types

---

## Resources

- **Project README**: `README.md`
- **Database Guide**: `supabase/README.md`
- **Deployment Guide**: `apps/web/DEPLOYMENT_GUIDE.md`
- **Database Deployment**: `apps/web/DB_DEPLOYMENT_GUIDE.md`
