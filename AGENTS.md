# Plokymarket - Agent Development Guide

## Project Overview

Plokymarket is a Polymarket-style prediction marketplace built for the Bangladesh market. It allows users to trade on the outcome of future events (sports, crypto, politics, weather, etc.) using a CLOB (Central Limit Order Book) matching engine.

**Key Features:**
- Binary outcome markets (YES/NO predictions)
- Real-time order book with limit and market orders
- Wallet management with local payment methods (bKash, Nagad, bank transfer)
- USDT deposit/withdrawal system with manual verification
- AI-powered oracle system for market resolution
- Multi-language support (Bangla default, English, Hindi)
- Admin panel for market creation, resolution, and user management
- KYC verification system
- Leaderboard and gamification
- Social features (comments, follows, activity feed)
- Workflow automation via QStash

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3 (App Router)
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components
- **State Management**: Zustand (with persistence)
- **Authentication**: Supabase Auth with email/password and Google OAuth
- **Icons**: Lucide React
- **Charts**: Recharts, Chart.js
- **Animations**: Framer Motion
- **Internationalization**: i18next with react-i18next

### Backend & Database
- **Database**: PostgreSQL 15 (via Supabase Cloud)
- **API**: Next.js API Routes + PostgREST + Supabase client
- **Authentication**: Supabase Auth with JWT
- **Row Level Security (RLS)**: Enabled on all tables
- **Real-time**: Supabase Realtime for live data

### Infrastructure & Services
- **Deployment**: Vercel (frontend)
- **Database Hosting**: Supabase Cloud
- **Workflow Automation**: Upstash QStash
- **Redis**: Upstash Redis for caching
- **AI/ML**: Google Gemini API for AI oracle and content generation
- **Container Services**: Docker Compose for local development (n8n, PostgreSQL)

---

## Project Structure

```
plokymarket/
├── apps/
│   └── web/                          # Next.js frontend application
│       ├── src/
│       │   ├── app/                  # Next.js App Router
│       │   │   ├── (auth)/           # Auth routes (login, register)
│       │   │   │   ├── login/
│       │   │   │   └── register/
│       │   │   ├── (dashboard)/      # Main app routes (authenticated)
│       │   │   │   ├── markets/      # Market list & details
│       │   │   │   ├── portfolio/    # User positions & analytics
│       │   │   │   ├── wallet/       # Wallet management
│       │   │   │   ├── activity/     # Activity feed
│       │   │   │   ├── leaderboard/  # User rankings
│       │   │   │   ├── kyc/          # KYC verification
│       │   │   │   ├── rebates/      # Maker rebates
│       │   │   │   ├── levels/       # User levels
│       │   │   │   └── events/       # Event creation
│       │   │   ├── api/              # API routes
│       │   │   │   ├── admin/        # Admin API endpoints
│       │   │   │   ├── auth/         # Auth callbacks
│       │   │   │   ├── cron/         # Cron job endpoints
│       │   │   │   ├── workflows/    # Workflow automation
│       │   │   │   └── ...
│       │   │   ├── sys-cmd-7x9k2/    # Secure admin panel
│       │   │   ├── auth-portal-3m5n8/# Secure auth portal
│       │   │   ├── layout.tsx        # Root layout
│       │   │   ├── page.tsx          # Home page
│       │   │   └── globals.css       # Global styles
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui components
│       │   │   ├── trading/          # Trading components
│       │   │   ├── market/           # Market display components
│       │   │   ├── portfolio/        # Portfolio components
│       │   │   ├── admin/            # Admin panel components
│       │   │   ├── wallet/           # Wallet components
│       │   │   ├── clob/             # Order book components
│       │   │   ├── social/           # Social features
│       │   │   ├── layout/           # Layout components
│       │   │   └── providers/        # Context providers
│       │   ├── lib/                  # Utilities & services
│       │   │   ├── supabase/         # Supabase clients
│       │   │   ├── clob/             # Order book engine
│       │   │   ├── oracle/           # AI oracle system
│       │   │   ├── wallet/           # Wallet services
│       │   │   ├── matching/         # Matching engine
│       │   │   ├── workflows/        # Workflow management
│       │   │   ├── kyc/              # KYC services
│       │   │   ├── social/           # Social services
│       │   │   └── utils.ts          # Utility functions
│       │   ├── hooks/                # Custom React hooks
│       │   ├── store/                # Zustand store
│       │   ├── types/                # TypeScript types
│       │   └── i18n/                 # Internationalization
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       ├── tsconfig.json
│       └── middleware.ts             # Next.js middleware
│
├── supabase/                         # Database configuration
│   ├── docker-compose.yml            # Local PostgreSQL setup
│   ├── db/
│   │   ├── init.sql                  # Database schema
│   │   ├── matching_engine.sql       # Order matching functions
│   │   └── schema_production.sql     # Production schema
│   └── migrations/                   # Database migrations (001-122+)
│
├── docs/                             # Documentation
├── automation/                       # Automation scripts
└── scripts/                          # Utility scripts
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

# QStash Workflow Setup
npm run qstash:setup:all           # Setup all QStash schedules
npm run qstash:setup:batch         # Setup batch markets schedule
npm run qstash:setup:daily-topics  # Setup daily topics schedule
npm run qstash:setup:leaderboard   # Setup leaderboard cron

# USDT Workflow Setup
npm run usdt:setup                 # Setup USDT workflows
npm run usdt:cleanup               # Cleanup USDT workflows
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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# QStash (Required for workflows)
QSTASH_URL=https://qstash.upstash.io/v2/publish/
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Redis (Upstash)
KV_REST_API_URL=your-redis-url
KV_REST_API_TOKEN=your-redis-token

# Master Cron Secret
MASTER_CRON_SECRET=your-cron-secret

# Optional: Telegram Notifications
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
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
| `user_profiles` | Extended user profile data |
| `wallets` | User balances (available & locked) |
| `markets` | Prediction markets with questions |
| `events` | Event containers for markets |
| `orders` | Limit and market orders |
| `trades` | Completed trades |
| `positions` | User positions in markets |
| `transactions` | Wallet transaction history |
| `oracle_verifications` | AI verification results |
| `payment_transactions` | Deposit/withdrawal history |
| `kyc_documents` | KYC verification documents |
| `workflow_executions` | Workflow execution tracking |
| `leaderboard` | User rankings |
| `comments` | User comments on markets |
| `activity_feed` | User activity tracking |

### Enums

```typescript
market_status: 'active' | 'closed' | 'resolved' | 'cancelled' | 'paused'
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

### Workflow System (`lib/workflows/`)
Upstash QStash workflow orchestration:
- Automated cron jobs
- Manual trigger workflows
- Execution tracking

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

### Admin Security
- Admin panel uses randomized paths (`/sys-cmd-7x9k2`)
- Auth portal uses separate randomized path (`/auth-portal-3m5n8`)
- IP whitelist support for admin access
- Admin middleware checks `is_admin` or `is_super_admin` flags

### Database Security
- RLS policies ensure users can only access their own data
- Admin operations require `is_admin = true`
- Sensitive operations use database functions (RPC)

### API Security
- Middleware handles session updates
- API routes validate user permissions
- Environment variables for secrets
- Security headers enforced via middleware:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security

---

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `QSTASH_TOKEN`
   - `GEMINI_API_KEY`
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
- **Deployment Summary**: `DEPLOYMENT_SUMMARY.md`
- **Testing Guide**: `TEST_EXECUTION_GUIDE.md`
- **Documentation Index**: `DOCUMENTATION_INDEX.md`
