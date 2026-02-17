# Plokymarket - Test Execution Guide

**Status**: 🟢 First Event Created  
**Event ID**: `2698853e-f9fc-48d4-b9c9-d8663a929a93`  
**Date**: February 16, 2026

---

## Test Event Details

| Field | Value |
|-------|-------|
| **Question** | Will Plokymarket users exceed 15,000 by December 2026? |
| **Category** | Technology |
| **Subcategory** | Platform Growth |
| **Trading Closes** | March 18, 2026 at 4:25 PM |
| **Event Date** | March 19, 2026 at 4:25 PM |
| **Initial Liquidity** | ৳10,000 |
| **Answers** | হ্যাঁ (YES) / না (NO) |
| **Resolution** | AI Oracle |
| **Status** | 🟢 ACTIVE |

---

## Testing Checklist

### Phase 1: Market Verification ✅

- [x] Event created in database
- [x] Event accessible via API
- [x] Event displaying on homepage
- [ ] Order book displaying correctly
- [ ] Price tickers initialized (should start at ৳0.50 YES / ৳0.50 NO)

**Verification Steps**:
```bash
# 1. Check market is live
curl -H "apikey: YOUR_ANON_KEY" \
  https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/markets?id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93

# 2. Visit in browser
https://polymarket-bangladesh.vercel.app/markets/2698853e-f9fc-48d4-b9c9-d8663a929a93
```

---

### Phase 2: Execute Test Trade

### Step 1: Create Test Users

For trading, we need at least 2 users (buyer and seller). Create test accounts:

```
User 1 (Buyer):
- Email: test.buyer@plokymarket.bd
- Password: TestBuyer123!

User 2 (Seller):
- Email: test.seller@plokymarket.bd
- Password: TestSeller123!
```

**How to create**:
1. Go to: https://polymarket-bangladesh.vercel.app/register
2. Fill in the form with test user details
3. Verify email (check test inbox or skip if email verification disabled)
4. Complete KYC (if required)

### Step 2: Fund Test Wallets

Each user needs initial balance to trade. Add test deposits:

```sql
-- Option A: Direct Database Insert (fastest)
INSERT INTO transactions (
  user_id,
  type,
  amount,
  description,
  status
) VALUES 
  ('user_uuid_1', 'deposit', 50000, 'Test deposit - Buyer', 'completed'),
  ('user_uuid_2', 'deposit', 50000, 'Test deposit - Seller', 'completed');

UPDATE wallets 
SET balance = balance + 50000 
WHERE user_id IN ('user_uuid_1', 'user_uuid_2');

-- Option B: Via API (if endpoint available)
POST /api/wallet/deposit
{
  "amount": 50000,
  "method": "test"
}
```

### Step 3: Place Limit Orders

**User 1 (Buyer) - Buy YES at 0.55**:
```json
POST /api/orders
{
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "order_type": "limit",
  "side": "buy",
  "outcome": "YES",
  "price": 0.55,
  "quantity": 100
}

Expected Response:
{
  "order_id": "order_uuid_1",
  "status": "open",
  "price": 0.55,
  "quantity": 100,
  "filled_quantity": 0
}
```

**User 2 (Seller) - Sell YES at 0.55**:
```json
POST /api/orders
{
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "order_type": "limit",
  "side": "sell",
  "outcome": "YES",
  "price": 0.55,
  "quantity": 100
}
```

### Step 4: Monitor Order Matching

After placing both orders, check:

**1. Order Book Updates**:
```bash
# Check real-time order book
curl -H "apikey: YOUR_ANON_KEY" \
  https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/orders?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93&status=neq.cancelled

# Expected: Both orders should transition to 'filled'
```

**2. Trade Execution**:
```bash
# Check trades table
curl -H "apikey: YOUR_ANON_KEY" \
  https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/trades?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93

# Expected Response:
{
  "id": "trade_uuid",
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "buy_order_id": "order_uuid_1",
  "sell_order_id": "order_uuid_2",
  "price": 0.55,
  "quantity": 100,
  "timestamp": "2026-02-16T16:25:00Z"
}
```

**3. Position Updates**:
```bash
# Check user positions
curl -H "apikey: YOUR_ANON_KEY" \
  https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/positions?user_id=eq.user_uuid_1

# Expected:
{
  "user_id": "user_uuid_1",
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "outcome": "YES",
  "quantity": 100,
  "entry_price": 0.55,
  "current_value": null  // Updated in real-time
}
```

---

### Phase 3: Verify Order Matching ✅

The matching engine uses **Price-Time Priority**:

```
1. Orders sorted by price (best first)
   - BUY orders: highest price first
   - SELL orders: lowest price first

2. Within same price: earliest order first (FIFO)

3. Pro-rata allocation if multiple matches

4. Automatic settlement and wallet updates
```

**Verification Logger Output** (from `/api/orders` response):

```json
{
  "matching_log": {
    "initial_order": {
      "side": "buy",
      "price": 0.55,
      "quantity": 100
    },
    "matching_candidates": [
      {
        "order_id": "order_uuid_2",
        "side": "sell",
        "price": 0.55,
        "quantity": 100,
        "match_ratio": 1.0
      }
    ],
    "executions": [
      {
        "trade_id": "trade_uuid",
        "price": 0.55,
        "quantity": 100,
        "timestamp": "2026-02-16T16:25:00Z"
      }
    ],
    "remaining_quantity": 0,
    "execution_time_ms": 45
  }
}
```

**Test Cases to Verify**:

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| **Full Fill** | BUY 100 @ 0.55 vs SELL 100 @ 0.55 | Both orders filled 100 |
| **Partial Fill** | BUY 100 @ 0.55 vs SELL 60 @ 0.55 | SELL filled 60, BUY has 40 open |
| **Price Mismatch (BUY)** | BUY 100 @ 0.50 vs SELL 100 @ 0.55 | No match (buy price too low) |
| **Price Mismatch (SELL)** | BUY 100 @ 0.50 vs SELL 100 @ 0.45 | Match at 0.45 or 0.50? (depends on convention) |
| **Time Priority** | SELL 50 @ 0.55 (old) + SELL 50 @ 0.55 (new) vs BUY 100 @ 0.55 | Match old order first |

---

### Phase 4: Test Settlement

Settlement happens **automatically** after market resolution:

#### Manual Settlement (For Testing)

```sql
-- Manually resolve market
UPDATE markets 
SET status = 'resolved', 
    winning_outcome = 'YES',
    resolved_at = NOW()
WHERE id = '2698853e-f9fc-48d4-b9c9-d8663a929a93';

-- Trigger settlement function
SELECT settle_binary_market(
  '2698853e-f9fc-48d4-b9c9-d8663a929a93',
  'YES'::outcome_type
);
```

#### Verify Settlement Results

```bash
# 1. Check wallet updates
curl -H "apikey: YOUR_ANON_KEY" \
  https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/wallets?user_id=eq.user_uuid_1

# Expected:
{
  "balance": 54500,  // 50000 initial - 100 @ 0.55 cost + 100 YES payout @ 1.00
  "locked_balance": 0
}

# 2. Check settlement transactions
curl -H "apikey: YOUR_ANON_KEY" \
  https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/transactions?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93&type=eq.settlement

# Expected:
{
  "user_id": "user_uuid_1",
  "type": "settlement",
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "amount": 100,  // Winner receives 100
  "description": "Market resolved YES"
}

# 3. Check market status
curl -H "apikey: YOUR_ANON_KEY" \
  https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/markets?id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93

# Expected status: 'resolved'
```

**Settlement Logic**:
- **YES Buyers**: Receive their initial cost back + profit (1.00 - entry_price) × quantity
- **NO Buyers**: Lose their initial cost (all shares worth 0)
- **YES Sellers**: Keep their premium + sell price difference
- **NO Sellers**: Receive full share value (1.00 × quantity)

---

### Phase 5: Monitor Real-Time Updates

Real-time updates use **Supabase Realtime Subscriptions**:

#### JavaScript Client Example

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to orders updates
supabase
  .channel('orders:market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Order Update:', payload.new);
      console.log('Old State:', payload.old);
    }
  )
  .subscribe();

// Subscribe to trades
supabase
  .channel('trades:market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'trades' },
    (payload) => {
      console.log('New Trade:', payload.new);
      // Update UI immediately
    }
  )
  .subscribe();

// Subscribe to wallets
supabase
  .channel(`wallets:user_id=eq.${userId}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'wallets' },
    (payload) => {
      console.log('Wallet Updated:', payload.new);
    }
  )
  .subscribe();
```

#### Test Monitoring Points

| Component | Expected Behavior | How to Verify |
|-----------|------------------|---------------|
| **Order Status Changes** | open → partially_filled → filled (within 100ms) | Check order table updates in real-time |
| **Price Ticker** | Updates on new trades | Should reflect latest trade price |
| **Order Book Depth** | Updates immediately | Bid/ask spread updates in real-time |
| **Wallet Balance** | Locked amount increases during order, decreases after fill | Check wallet in UI updates without refresh |
| **Position Updates** | New positions created, quantities updated | Portfolio page reflects new positions |
| **Activity Feed** | New trades appear instantly | Activity feed wall updates in real-time |

#### Browser DevTools Verification

```javascript
// In browser console:
// Subscribe and log all events
window.supabase
  .channel('*')
  .on('postgres_changes', { event: '*' }, (payload) => {
    console.group(`${payload.table} - ${payload.eventType}`);
    console.log('New:', payload.new);
    console.log('Old:', payload.old);
    console.groupEnd();
  })
  .subscribe();
```

---

## Test Scripts

### Automated Testing Script

Run this after each phase to validate system state:

```bash
# Navigate to project
cd apps/web

# Run test suite (if available)
npm run test:e2e -- --grep "trading|settlement"

# Or manual curl tests
node ../../test-execution.js
```

### Test Execution Script (Node.js)

```javascript
// test-execution.js
const https = require('https');

const config = {
  marketId: '2698853e-f9fc-48d4-b9c9-d8663a929a93',
  apiUrl: 'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1',
  anonKey: 'YOUR_ANON_KEY'
};

async function testMarketState() {
  const tests = [
    { name: 'Market Active', endpoint: `markets?id=eq.${config.marketId}` },
    { name: 'Orders Exist', endpoint: `orders?market_id=eq.${config.marketId}` },
    { name: 'Trades Exist', endpoint: `trades?market_id=eq.${config.marketId}` },
    { name: 'Positions Updated', endpoint: `positions?market_id=eq.${config.marketId}` }
  ];

  for (const test of tests) {
    try {
      const data = await fetch(`${config.apiUrl}/${test.endpoint}`, {
        headers: { 'apikey': config.anonKey }
      }).then(r => r.json());
      console.log(`✅ ${test.name}:`, data.length, 'records');
    } catch (error) {
      console.error(`❌ ${test.name}:`, error.message);
    }
  }
}

testMarketState();
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Orders not matching** | Price ranges don't overlap | Ensure BUY price ≥ SELL price at same outcome |
| **Wallet not updating** | RLS policies blocking update | Verify user auth token valid |
| **Order book empty** | No orders placed yet | Place at least 1 limit order |
| **Settlement fails** | Market not in 'closed' status | Close market before resolving |
| **Real-time not updating** | Subscription not active | Check browser console for errors |

### Enable Debug Logging

```javascript
// Enable Supabase debug logging
localStorage.setItem('sb-plokymarket_debug', 'true');

// Check logs
const client = createClient(url, key);
client.auth.onAuthStateChange((event, session) => {
  console.log('Auth Event:', event, session);
});
```

---

## Success Criteria

✅ **Phase 1 (Market)**: Event created and visible  
✅ **Phase 2 (Trading)**: Orders placed and filled  
⏳ **Phase 3 (Matching)**: All matches executed correctly  
⏳ **Phase 4 (Settlement)**: Wallets updated with winnings  
⏳ **Phase 5 (Monitoring)**: Real-time updates working  

---

## Next Steps

1. **Execute Phase 2** - Create test users and place orders
2. **Monitor Matching** - Verify all trades execute and settle
3. **Load Testing** - Place 100+ concurrent orders
4. **Stress Testing** - Test with large quantity orders (10,000+ shares)
5. **Multi-Market** - Create and trade multiple markets simultaneously

---

**Generated**: February 16, 2026  
**Event Status**: 🟢 LIVE  
**Next**: Execute Test Trade Phase
