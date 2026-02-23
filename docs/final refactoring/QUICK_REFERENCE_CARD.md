# 🎯 PLOKYMARKET BD - QUICK REFERENCE CARD
## For AI Agent - Daily Execution Checklist

---

## 🔥 CRITICAL FIXES (Do These First)

### Fix 1: Supabase Client `await` (30 min)
```bash
# Find all broken files
grep -r "= createClient()" src/app/api/ --include="*.ts" -l

# Fix pattern: Add `await` before every `createClient()` call
```

### Fix 2: CLOB Type Case (15 min)
```typescript
// In src/lib/clob/types.ts
// Change: type Side = "BUY" | "SELL";
// To:     type Side = "buy" | "sell";

// Change: type OrderStatus = "OPEN" | "FILLED";
// To:     type OrderStatus = "open" | "filled";
```

### Fix 3: FeedService Methods (2 hours)
```typescript
// Create src/lib/services/feedService.ts with:
// - getFollowStatus()
// - getFollowers()
// - getFollowing()
// - followUser()
// - unfollowUser()
```

---

## 📋 DAILY CHECKLIST

### Day 1: Foundation
- [ ] Fix Supabase `await` in all API routes
- [ ] Fix CLOB type case mismatch
- [ ] Create FeedService
- [ ] Fix snoozeUntil variable
- [ ] Fix workflowStore selectStats
- [ ] Run `npm run type-check` (should be 0 errors)

### Day 2: Database & Security
- [ ] Add composite indexes to orders table
- [ ] Add wallet version column
- [ ] Fix rate limiter (Redis-backed)
- [ ] Add security headers middleware
- [ ] Test RLS policies

### Day 3: Admin APIs
- [ ] Create admin withdrawal processing API
- [ ] Create admin deposit reject API
- [ ] Create real-time exchange rate API
- [ ] Test all admin endpoints

### Day 4: Order Book
- [ ] Create OrderBookService with caching
- [ ] Create order placement API
- [ ] Create order cancellation API
- [ ] Test order matching

### Day 5: Portfolio & Wallet
- [ ] Create PortfolioService
- [ ] Create WalletService
- [ ] Create portfolio API
- [ ] Create wallet balance API

### Day 6: Real-time
- [ ] Create useRealtimeOrders hook
- [ ] Create useRealtimeTrades hook
- [ ] Test Supabase Realtime subscriptions

### Day 7: Bangla Localization
- [ ] Create i18n config (default: 'bn')
- [ ] Create bn.json translations
- [ ] Update all UI components
- [ ] Test Bangla rendering

### Day 8: bKash Integration
- [ ] Create bKashService
- [ ] Create deposit API with bKash
- [ ] Create deposit callback handler
- [ ] Test bKash sandbox

### Day 9: Nagad Integration
- [ ] Create NagadService
- [ ] Add Nagad to deposit API
- [ ] Test Nagad sandbox

### Day 10: Withdrawals
- [ ] Create withdrawal API
- [ ] Add rate limiting
- [ ] Add KYC checks
- [ ] Create admin withdrawal panel

### Day 11: KYC System
- [ ] Create KYC submission API
- [ ] Create document upload handler
- [ ] Test file uploads

### Day 12: Admin KYC Panel
- [ ] Create KYC review page
- [ ] Add approve/reject buttons
- [ ] Test KYC workflow

### Day 13: 2FA
- [ ] Create 2FA service
- [ ] Add OTP generation
- [ ] Add OTP verification
- [ ] Integrate with withdrawals

### Day 14: Leaderboard
- [ ] Create LeaderboardService
- [ ] Create leaderboard API
- [ ] Add ranking calculation
- [ ] Create leaderboard UI

### Day 15: Environment
- [ ] Set all env variables in Vercel
- [ ] Test bKash credentials
- [ ] Test Nagad credentials
- [ ] Test Redis connection

### Day 16: Testing
- [ ] Run integration tests
- [ ] Test order placement
- [ ] Test matching engine
- [ ] Test payments

### Day 17: Performance
- [ ] Add API caching headers
- [ ] Optimize database queries
- [ ] Test load performance

### Day 18: Launch
- [ ] Final type check
- [ ] Final build
- [ ] Deploy to production
- [ ] Verify all features

---

## 🚨 EMERGENCY FIXES

### If API Routes Return 500
```bash
# Check Supabase client calls
grep -r "createClient()" src/app/api/ | grep -v "await"
# Fix all occurrences by adding `await`
```

### If Orders Don't Match
```bash
# Check type definitions
cat src/lib/clob/types.ts | grep -E "Side|OrderStatus"
# Ensure all values are lowercase
```

### If Withdrawals Fail
```bash
# Check admin API exists
ls -la src/app/api/admin/withdrawals/
# Create if missing
```

---

## 📞 QUICK COMMANDS

```bash
# Type check
npm run type-check

# Build
npm run build

# Test
npm run test

# Deploy
vercel --prod

# Check logs
vercel logs --follow

# Database
supabase db reset
supabase db push
```

---

## 🔗 IMPORTANT URLs

- **Production:** https://plokymarket.bd
- **Admin Portal:** https://plokymarket.bd/sys-cmd-7x9k2
- **Supabase:** https://app.supabase.com/project/sltcfmqefujecqfbmkvz
- **Vercel:** https://vercel.com/dashboard

---

**Keep this card handy while working!**
