# PLOKYMARKET: Quick Reference Guide
## For AI Agent Implementation

---

## WHAT'S MISSING (Priority Order)

### 🔴 CRITICAL (Must Implement)
| Feature | Description | Files to Create |
|---------|-------------|-----------------|
| **Full CLOB Order Book** | Bid/ask depth, price ladder, visual bars | `OrderBook.tsx`, `matching-engine/engine.ts` |
| **Limit Orders** | Order placement, cancellation, partial fills | `orders/route.ts`, `TradingPanel.tsx` |
| **Oracle System** | AI-powered market resolution | `oracle/service.ts`, `oracle_requests` table |
| **Market Resolution** | Automated settlement, payouts | `finalizeResolution()` in oracle service |

### 🟡 HIGH (Important)
| Feature | Description | Files to Create |
|---------|-------------|-----------------|
| **Leaderboard** | PnL rankings by timeframe | `leaderboard/page.tsx`, `LeaderboardTable.tsx` |
| **Portfolio Analytics** | PnL tracking, performance charts | `portfolio/page.tsx`, `PnLChart.tsx` |
| **Activity Feed** | User actions timeline | `activity/page.tsx`, `activity_feed` table |
| **Comments System** | Market discussion threads | `comments/route.ts`, `CommentSection.tsx` |

### 🟢 MEDIUM (Nice to Have)
| Feature | Description | Files to Create |
|---------|-------------|-----------------|
| **Liquidity Rewards** | Maker rebates, daily rewards | `reward_distributions` table |
| **Notifications** | Order fills, market resolutions | `notifications` table, NotificationService |
| **Admin Dashboard** | Market/user management | `admin/` route |
| **KYC System** | Identity verification | `kyc/` route, document upload |

---

## KEY ALGORITHMS

### 1. Order Matching (Price-Time Priority)
```
1. New order arrives
2. Lock funds in user's wallet
3. If MARKET order: match with best available price
4. If LIMIT order: try to match, add remainder to order book
5. Execute trades (taker pays taker fee, maker gets rebate)
6. Update positions for both parties
7. Broadcast order book update
```

### 2. Market Resolution (AI Oracle)
```
1. Market closes (trading_end_at reached)
2. Gather evidence from news sources
3. AI analyzes evidence using Gemini API
4. Propose outcome with confidence score
5. 7-day challenge period
6. If no disputes: resolve market, distribute payouts
7. If disputes: escalate to human review
```

### 3. Complete Set Arbitrage
```
Invariant: YES_price + NO_price = 100¢

If YES + NO > 100¢:
  - Buy complete set for 100¢ (get 1 YES + 1 NO)
  - Sell YES at YES_price, sell NO at NO_price
  - Profit = (YES_price + NO_price) - 100¢

If YES + NO < 100¢:
  - Buy YES at YES_price, buy NO at NO_price
  - Redeem complete set for 100¢
  - Profit = 100¢ - (YES_price + NO_price)
```

---

## DATABASE TABLES (Priority Order)

### Already Have (from previous implementation)
- ✅ `users` - Basic auth
- ✅ `wallets` - Balance tracking
- ✅ `markets` - Market data
- ✅ `orders` - Order storage
- ✅ `trades` - Trade history

### Need to Add
```sql
-- CRITICAL
CREATE TABLE oracle_requests (...);
CREATE TABLE oracle_disputes (...);

-- HIGH
CREATE TABLE positions (...);
CREATE TABLE position_history (...);
CREATE TABLE activity_feed (...);
CREATE TABLE comments (...);

-- MEDIUM
CREATE TABLE leaderboard_entries (...);
CREATE TABLE reward_distributions (...);
CREATE TABLE notifications (...);
CREATE TABLE price_history (...);
```

---

## API ENDPOINTS NEEDED

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
```

### Markets
```
GET  /api/markets              # List markets
GET  /api/markets/[slug]       # Market detail
GET  /api/markets/[slug]/orders    # Order book
GET  /api/markets/[slug]/trades    # Recent trades
GET  /api/markets/[slug]/history   # Price history
GET  /api/markets/[slug]/comments  # Market comments
```

### Orders
```
POST   /api/orders              # Create order
GET    /api/orders/user         # User's orders
DELETE /api/orders/[id]         # Cancel order
```

### Portfolio
```
GET /api/portfolio              # User positions
GET /api/portfolio/pnl          # PnL history
GET /api/transactions           # Transaction history
```

### Wallet
```
POST /api/wallet/deposit        # Initiate deposit
POST /api/wallet/withdraw       # Request withdrawal
GET  /api/wallet/balance        # Get balance
```

### Leaderboard
```
GET /api/leaderboard?timeframe=daily|weekly|monthly|all
```

---

## FRONTEND COMPONENTS NEEDED

### Trading Components
```
/src/components/trading/
├── OrderBook.tsx          # Visual order book with depth bars
├── PriceChart.tsx         # Candlestick/line chart
├── TradingPanel.tsx       # Buy/sell interface
├── PositionPanel.tsx      # Current positions
└── TradeHistory.tsx       # Recent trades
```

### Market Components
```
/src/components/markets/
├── MarketCard.tsx         # Market preview card
├── MarketList.tsx         # List of markets
├── MarketHeader.tsx       # Market title & info
├── MarketStats.tsx        # Volume, liquidity stats
└── RelatedMarkets.tsx     # Similar markets
```

### Portfolio Components
```
/src/components/portfolio/
├── PortfolioSummary.tsx   # Total value, PnL
├── PositionList.tsx       # Open positions
├── PnLChart.tsx           # PnL over time
└── TransactionHistory.tsx # Deposit/withdrawal history
```

### Leaderboard Components
```
/src/components/leaderboard/
├── LeaderboardTable.tsx   # Rankings table
├── UserRank.tsx           # Current user's rank
└── TimeframeSelector.tsx  # Daily/Weekly/Monthly/All
```

---

## EXTERNAL INTEGRATIONS

### bKash Payment (Bangladesh)
```
Sandbox: https://tokenized.sandbox.bka.sh
Production: https://tokenized.pay.bka.sh

Required:
- BKASH_APP_KEY
- BKASH_APP_SECRET
- BKASH_USERNAME
- BKASH_PASSWORD
```

### Gemini AI (Oracle)
```
API: https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

Required:
- GEMINI_API_KEY
```

### News API (Evidence Gathering)
```
API: https://newsapi.org/v2/everything

Required:
- NEWS_API_KEY
```

---

## SECURITY CHECKLIST

### Authentication
- [ ] Password requirements (8+ chars, uppercase, lowercase, number, special)
- [ ] Rate limiting on login (5 attempts per 15 min)
- [ ] JWT tokens with expiration
- [ ] Session management

### API Security
- [ ] Rate limiting (100 requests per minute)
- [ ] CORS configuration
- [ ] Security headers (X-Frame-Options, CSP, etc.)
- [ ] Input validation

### Trading Security
- [ ] Self-trade prevention
- [ ] Order size limits (max 10,000 BDT)
- [ ] Daily volume limits (max 100,000 BDT)
- [ ] Price movement circuit breaker (50%)

### Financial Security
- [ ] KYC for withdrawals > 100 BDT
- [ ] Withdrawal cooldown (24h after deposit)
- [ ] Daily withdrawal limits (20,000 BDT)
- [ ] Audit logging

---

## TESTING STRATEGY

### Unit Tests
```
- Order matching logic
- PnL calculations
- Fee calculations
- Input validation
```

### Integration Tests
```
- Order placement flow
- Market resolution flow
- Payment webhook flow
- Real-time updates
```

### E2E Tests
```
- User registration → deposit → trade → withdraw
- Market creation → trading → resolution → payout
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Indexes created
- [ ] RLS policies configured
- [ ] Webhooks configured (bKash)

### Deployment
- [ ] Build successful
- [ ] Tests passing
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] SSL certificate

### Post-Deployment
- [ ] Health check endpoints
- [ ] Monitoring (Sentry)
- [ ] Error alerting
- [ ] Backup strategy

---

## COMMON ISSUES & SOLUTIONS

### Issue: Order book not updating in real-time
**Solution**: Check Supabase Realtime subscription, ensure channel name matches

### Issue: Wallet balance incorrect after trade
**Solution**: Verify transaction atomicity, check for race conditions

### Issue: AI oracle giving wrong resolution
**Solution**: Add human review step for low confidence (< 90%) predictions

### Issue: bKash payment not crediting wallet
**Solution**: Verify webhook signature, check transaction status callback

---

## PERFORMANCE OPTIMIZATION

### Database
- Use materialized views for order book
- Add indexes on frequently queried columns
- Use connection pooling

### Frontend
- Virtualize long lists (orders, trades)
- Debounce search inputs
- Lazy load charts

### API
- Cache market data (Redis)
- Use edge functions for low-latency operations
- Batch database queries

---

## BANGLADESH-SPECIFIC NOTES

### Currency
- All amounts stored in PAISA (1 BDT = 100 paise)
- Display format: ৳1,234.56

### Phone Numbers
- Format: 01XXXXXXXXX (11 digits)
- Validation regex: `/^01[3-9]\d{8}$/`

### Market Categories (Bangladesh Focus)
- Bangladesh Politics (elections, party politics)
- Bangladesh Cricket (international, BPL, domestic)
- Bangladesh Economy (stock market, currency, GDP)
- Dhaka City (traffic, metro, development)
- Education (HSC/SSC results, admissions)
- Entertainment (Dhallywood, celebrities)

### Localization
- Default language: Bangla (bn)
- Fallback: English (en)
- Third option: Hindi (hi)

---

## REFERENCE FILES

### Full Implementation Guide
- `PLOKYMARKET_IMPLEMENTATION_GUIDE_PART1.md` - Architecture, Database, Backend
- `PLOKYMARKET_IMPLEMENTATION_GUIDE_PART2.md` - Oracle, Frontend, Security, Deployment

### Code Examples
- Database schema (complete SQL)
- Matching engine (TypeScript)
- Oracle service (TypeScript)
- bKash integration (TypeScript)
- Order book component (React)
- Trading panel component (React)

---

## NEXT STEPS FOR AI AGENT

1. **Read both implementation guide parts thoroughly**
2. **Start with Phase 1: Foundation**
   - Initialize project
   - Setup database
   - Implement auth
3. **Move to Phase 2: Core Trading**
   - Build order book UI
   - Implement matching engine
   - Add price charts
4. **Continue with Phase 3-5**
   - Oracle system
   - Leaderboard
   - Security features

**Remember**: Test each component as you build it. Use the patterns shown in the implementation guides.
