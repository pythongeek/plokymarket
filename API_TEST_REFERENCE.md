# Plokymarket - Complete API Test Reference

**Generated**: February 16, 2026  
**Market ID**: `2698853e-f9fc-48d4-b9c9-d8663a929a93`

---

## Setup

### Required Constants
```javascript
const CONFIG = {
  marketId: '2698853e-f9fc-48d4-b9c9-d8663a929a93',
  supabaseUrl: 'https://sltcfmqefujecqfbmkvz.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE',
  apiUrl: 'https://polymarket-bangladesh.vercel.app/api'
};
```

---

## API Call Examples

### 1. GET Market Details
```bash
curl -X GET \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/markets?id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93' \
  -H 'apikey: YOUR_ANON_KEY'

# Response (201 bytes):
{
  "id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "question": "Will Plokymarket users exceed 15,000 by December 2026?",
  "description": "Test event measuring platform growth milestones",
  "category": "Technology",
  "subcategory": "Platform Growth",
  "tags": ["plokymarket", "platform", "growth", "test"],
  "status": "active",
  "trading_closes_at": "2026-03-18T16:25:29+00:00",
  "event_date": "2026-03-19T16:25:29+00:00",
  "initial_liquidity": 10000,
  "answer_type": "binary",
  "answer1": "হ্যাঁ (YES)",
  "answer2": "না (NO)",
  "is_featured": true,
  "created_at": "2026-02-16T16:25:29+00:00",
  "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978...",
  "total_volume": 0,
  "yes_shares_outstanding": 0,
  "no_shares_outstanding": 0,
  "winning_outcome": null,
  "resolved_at": null
}
```

---

### 2. Place Limit Order (BUY)
```bash
curl -X POST \
  'https://polymarket-bangladesh.vercel.app/api/orders' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_USER_TOKEN' \
  -d '{
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "order_type": "limit",
    "side": "buy",
    "outcome": "YES",
    "price": 0.55,
    "quantity": 100
  }'

# Response:
{
  "order_id": "order-uuid-buy-001",
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "user_id": "user-uuid-buyer",
  "order_type": "limit",
  "side": "buy",
  "outcome": "YES",
  "price": 0.55,
  "quantity": 100,
  "filled_quantity": 0,
  "status": "open",
  "created_at": "2026-02-16T16:30:00Z",
  "matching_log": {
    "status": "open",
    "reason": "No matching sell orders at this price"
  }
}
```

---

### 3. Place Limit Order (SELL) - Triggers Matching
```bash
curl -X POST \
  'https://polymarket-bangladesh.vercel.app/api/orders' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SELLER_TOKEN' \
  -d '{
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "order_type": "limit",
    "side": "sell",
    "outcome": "YES",
    "price": 0.55,
    "quantity": 100
  }'

# Response (AUTOMATIC MATCHING TRIGGERED):
{
  "order_id": "order-uuid-sell-001",
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "user_id": "user-uuid-seller",
  "order_type": "limit",
  "side": "sell",
  "outcome": "YES",
  "price": 0.55,
  "quantity": 100,
  "filled_quantity": 100,
  "status": "filled",
  "created_at": "2026-02-16T16:30:05Z",
  "matching_log": {
    "status": "matched",
    "matches": [
      {
        "order_id": "order-uuid-buy-001",
        "price": 0.55,
        "quantity": 100,
        "trade_id": "trade-uuid-001",
        "execution_time_ms": 23
      }
    ],
    "total_matches": 1,
    "total_quantity_matched": 100,
    "total_filled": 100,
    "remaining_quantity": 0
  }
}
```

---

### 4. Verify Trade Executed
```bash
curl -X GET \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/trades?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93' \
  -H 'apikey: YOUR_ANON_KEY'

# Response:
[
  {
    "id": "trade-uuid-001",
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "buy_order_id": "order-uuid-buy-001",
    "sell_order_id": "order-uuid-sell-001",
    "price": 0.55,
    "quantity": 100,
    "timestamp": "2026-02-16T16:30:05Z",
    "buy_user_id": "user-uuid-buyer",
    "sell_user_id": "user-uuid-seller"
  }
]
```

---

### 5. Check User Positions (After Trade)
```bash
curl -X GET \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/positions?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93' \
  -H 'apikey: YOUR_ANON_KEY'

# Response:
[
  {
    "id": "position-uuid-buyer",
    "user_id": "user-uuid-buyer",
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "outcome": "YES",
    "quantity": 100,
    "entry_price": 0.55,
    "entry_cost": 55.00,
    "current_value": null,
    "unrealized_pnl": null,
    "created_at": "2026-02-16T16:30:05Z"
  },
  {
    "id": "position-uuid-seller",
    "user_id": "user-uuid-seller",
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "outcome": "YES",
    "quantity": -100,
    "entry_price": 0.55,
    "entry_cost": -55.00,
    "current_value": null,
    "unrealized_pnl": null,
    "created_at": "2026-02-16T16:30:05Z"
  }
]
```

---

### 6. Check Wallet After Trade
```bash
curl -X GET \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/wallets?user_id=eq.user-uuid-buyer' \
  -H 'apikey: YOUR_ANON_KEY'

# Before Trade:
{
  "balance": 50000.00,      // Initial deposit
  "locked_balance": 0.00
}

# After Trade (Buyer):
{
  "balance": 49945.00,      // 50000 - (100 * 0.55) = 49945
  "locked_balance": 55.00   // Cost of YES shares locked
}

# After Trade (Seller):
{
  "balance": 50055.00,      // 50000 + (100 * 0.55) = 50055
  "locked_balance": 0.00    // No locked balance (sold short)
}
```

---

### 7. Get Order Book (Real-Time)
```bash
curl -X GET \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/orders?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93&status=eq.open&order=price.desc' \
  -H 'apikey: YOUR_ANON_KEY'

# Response (Empty after full fill):
[]

# OR (If partial fill):
[
  {
    "id": "order-uuid-buy-002",
    "side": "buy",
    "outcome": "YES",
    "price": 0.54,
    "quantity": 50,
    "filled_quantity": 0,
    "status": "open"
  },
  {
    "id": "order-uuid-sell-002",
    "side": "sell",
    "outcome": "YES",
    "price": 0.56,
    "quantity": 50,
    "filled_quantity": 0,
    "status": "open"
  }
]
```

---

### 8. Market Settlement (Admin Only)
```bash
curl -X POST \
  'https://polymarket-bangladesh.vercel.app/api/admin/markets/resolve' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -d '{
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "winning_outcome": "YES",
    "resolution_method": "admin_manual"
  }'

# Response:
{
  "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
  "status": "resolved",
  "winning_outcome": "YES",
  "resolved_at": "2026-02-16T16:35:00Z",
  "settlement_results": {
    "winners": 1,
    "losers": 1,
    "total_settled": 100.00,
    "winner_payout": 100.00,
    "loser_loss": 0.00,
    "resolution_method": "admin_manual"
  }
}
```

---

### 9. Verify Settlement Transactions
```bash
curl -X GET \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/transactions?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93&type=eq.settlement' \
  -H 'apikey: YOUR_ANON_KEY'

# Response:
[
  {
    "id": "txn-uuid-settlement-001",
    "user_id": "user-uuid-buyer",
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "type": "settlement",
    "amount": 100.00,
    "description": "Market resolved YES - Position settled",
    "status": "completed",
    "created_at": "2026-02-16T16:35:00Z"
  },
  {
    "id": "txn-uuid-settlement-002",
    "user_id": "user-uuid-seller",
    "market_id": "2698853e-f9fc-48d4-b9c9-d8663a929a93",
    "type": "settlement",
    "amount": -55.00,
    "description": "Market resolved YES - Position settled",
    "status": "completed",
    "created_at": "2026-02-16T16:35:00Z"
  }
]
```

---

### 10. Check Final Wallet State
```bash
curl -X GET \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/wallets?user_id=eq.user-uuid-buyer' \
  -H 'apikey: YOUR_ANON_KEY'

# After Settlement (Buyer who won):
{
  "balance": 50045.00,      // 49945 + 100 (settlement payout)
  "locked_balance": 0.00    // Freed after settlement
}

# After Settlement (Seller who lost):
{
  "balance": 50000.00,      // 50055 - 55 (loss from bad position)
  "locked_balance": 0.00
}
```

---

## Real-Time Subscription Examples

### Using JavaScript/TypeScript

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Subscribe to all orders for market
supabase
  .channel(`orders:${CONFIG.marketId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `market_id=eq.${CONFIG.marketId}`
    },
    (payload) => {
      console.log('🔔 Order Update:', {
        event: payload.eventType,
        order: payload.new,
        previousOrder: payload.old
      });
    }
  )
  .subscribe();

// Subscribe to trades
supabase
  .channel(`trades:${CONFIG.marketId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'trades',
      filter: `market_id=eq.${CONFIG.marketId}`
    },
    (payload) => {
      console.log('💱 New Trade:', {
        tradeId: payload.new.id,
        price: payload.new.price,
        quantity: payload.new.quantity,
        timestamp: payload.new.timestamp
      });
      // Update UI immediately
      updatePriceTicker(payload.new.price);
      updateOrderBook();
    }
  )
  .subscribe();

// Subscribe to wallet changes for current user
supabase
  .channel(`wallets:user=${currentUserId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'wallets'
    },
    (payload) => {
      console.log('💰 Wallet Updated:', {
        balance: payload.new.balance,
        lockedBalance: payload.new.locked_balance
      });
      updateWalletDisplay(payload.new);
    }
  )
  .subscribe();
```

---

## Expected Timings

| Operation | Time | Notes |
|-----------|------|-------|
| Order Placement | ~50ms | API round trip |
| Matching Engine | ~25ms | Price-time priority |
| Trade Creation | ~15ms | Database insert |
| Wallet Update | ~30ms | RLS policies + update |
| Real-time Notification | ~100ms | WebSocket delivery |
| **Total Trade Execution** | **~220ms** | From submit to completion |

---

## Test Data

### Sample Order Combinations

| Test Case | BUY Order | SELL Order | Expected Result |
|-----------|-----------|-----------|-----------------|
| **Full Match** | 100 @ 0.55 | 100 @ 0.55 | Both filled 100 |
| **Partial Match** | 100 @ 0.55 | 60 @ 0.55 | BUY: 60 filled, 40 open; SELL: 60 filled |
| **Price Mismatch** | 100 @ 0.50 | 100 @ 0.55 | No match |
| **Large Buy** | 1000 @ 0.60 | 100 @ 0.60 | SELL: filled 100; BUY: 900 open |
| **Multiple Sellers** | 100 @ 0.55 | 60 @ 0.55 + 50 @ 0.55 | SELL order 1: 60 filled; SELL order 2: 40 filled |

---

## Error Responses

### Insufficient Balance
```json
{
  "error": "INSUFFICIENT_BALANCE",
  "message": "Insufficient balance to place order",
  "required": 55.00,
  "available": 45.00
}
```

### Invalid Price
```json
{
  "error": "INVALID_PRICE",
  "message": "Price must be between 0.0001 and 0.9999",
  "provided": 1.50
}
```

### Market Closed
```json
{
  "error": "MARKET_CLOSED",
  "message": "Market trading has closed",
  "trading_closes_at": "2026-03-18T16:25:29Z"
}
```

---

## Performance Testing

### Load Test Script
```bash
#!/bin/bash
# Place 100 orders rapidly
for i in {1..100}; do
  curl -X POST https://polymarket-bangladesh.vercel.app/api/orders \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"market_id\": \"2698853e-f9fc-48d4-b9c9-d8663a929a93\",
      \"order_type\": \"limit\",
      \"side\": \"buy\",
      \"outcome\": \"YES\",
      \"price\": $((50 + RANDOM % 10)).$(printf "%02d" $((RANDOM % 100))),
      \"quantity\": $((10 + RANDOM % 100))
    }" &
done
wait

# Check total orders
curl -s -H 'apikey: YOUR_ANON_KEY' \
  'https://sltcfmqefujecqfbmkvz.supabase.co/rest/v1/orders?market_id=eq.2698853e-f9fc-48d4-b9c9-d8663a929a93' \
  | jq '. | length'
```

---

**Status**: Ready for testing  
**Next**: Execute test trades and monitor real-time updates
