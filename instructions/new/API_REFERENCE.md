# Plokymarket API Reference

## Complete API Endpoints & Usage Examples

---

## 🔐 Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'John Doe',
    },
  },
});
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password',
});
```

### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

---

## 📊 Markets API

### Get All Markets
```typescript
const { data: markets, error } = await supabase
  .from('markets')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

### Get Single Market
```typescript
const { data: market, error } = await supabase
  .from('markets')
  .select(`
    *,
    creator:users(username, avatar_url)
  `)
  .eq('id', marketId)
  .single();
```

### Get Markets by Category
```typescript
const { data: markets, error } = await supabase
  .from('markets')
  .select('*')
  .eq('category', 'politics')
  .eq('status', 'active')
  .order('total_volume', { ascending: false });
```

### Get Trending Markets
```typescript
const { data: markets, error } = await supabase
  .from('markets')
  .select('*')
  .eq('is_trending', true)
  .order('volume_24h', { ascending: false })
  .limit(10);
```

### Search Markets
```typescript
const { data: markets, error } = await supabase
  .from('markets')
  .select('*')
  .textSearch('question', searchQuery)
  .limit(20);
```

### Create Market (Admin Only)
```typescript
const { data: market, error } = await supabase
  .from('markets')
  .insert({
    question: 'Will Bangladesh win the next cricket match?',
    question_bn: 'বাংলাদেশ কি পরবর্তী ক্রিকেট ম্যাচ জিতবে?',
    description: 'Against India in T20 World Cup',
    category: 'sports',
    trading_closes_at: '2024-12-31T00:00:00Z',
    event_date: '2025-01-15T00:00:00Z',
  })
  .select()
  .single();
```

---

## 💰 Orders API

### Place Order
```typescript
const { data: order, error } = await supabase
  .from('orders')
  .insert({
    market_id: marketId,
    user_id: userId,
    order_type: 'limit',
    side: 'buy',
    outcome: 'YES',
    price: 0.65,
    quantity: 100,
  })
  .select()
  .single();

// Trigger matching engine
const { data: matchResult } = await supabase.rpc('match_order_v2', {
  p_order_id: order.id,
});
```

### Get User's Orders
```typescript
const { data: orders, error } = await supabase
  .from('orders')
  .select(`
    *,
    market:markets(question, status)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Get Open Orders
```typescript
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', userId)
  .in('status', ['open', 'partially_filled'])
  .order('created_at', { ascending: false });
```

### Cancel Order
```typescript
const { data: order, error } = await supabase
  .from('orders')
  .update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancel_reason: 'User cancelled',
  })
  .eq('id', orderId)
  .eq('user_id', userId)
  .select()
  .single();
```

### Get Order Book
```typescript
// Get buy orders (bids)
const { data: bids } = await supabase
  .from('orders')
  .select('price, quantity, filled_quantity')
  .eq('market_id', marketId)
  .eq('side', 'buy')
  .in('status', ['open', 'partially_filled'])
  .order('price', { ascending: false })
  .limit(20);

// Get sell orders (asks)
const { data: asks } = await supabase
  .from('orders')
  .select('price, quantity, filled_quantity')
  .eq('market_id', marketId)
  .eq('side', 'sell')
  .in('status', ['open', 'partially_filled'])
  .order('price', { ascending: true })
  .limit(20);
```

---

## 📈 Trades API

### Get Market Trades
```typescript
const { data: trades, error } = await supabase
  .from('trades')
  .select(`
    *,
    buyer:users!buyer_id(username),
    seller:users!seller_id(username)
  `)
  .eq('market_id', marketId)
  .order('created_at', { ascending: false })
  .limit(50);
```

### Get User Trades
```typescript
const { data: trades, error } = await supabase
  .from('trades')
  .select(`
    *,
    market:markets(question)
  `)
  .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
  .order('created_at', { ascending: false });
```

### Get Trade Statistics
```typescript
const { data: stats } = await supabase
  .rpc('get_trade_stats', {
    p_user_id: userId,
    p_timeframe: 'monthly',
  });
```

---

## 💼 Positions API

### Get User Positions
```typescript
const { data: positions, error } = await supabase
  .from('positions')
  .select(`
    *,
    market:markets(question, status, yes_price, no_price)
  `)
  .eq('user_id', userId)
  .gt('quantity', 0)
  .order('updated_at', { ascending: false });
```

### Get Position by Market
```typescript
const { data: position, error } = await supabase
  .from('positions')
  .select('*')
  .eq('user_id', userId)
  .eq('market_id', marketId)
  .eq('outcome', 'YES')
  .single();
```

### Calculate Position Value
```typescript
const { data: positionValue } = await supabase.rpc('calculate_position_value', {
  p_user_id: userId,
  p_market_id: marketId,
});
```

---

## 💳 Wallet API

### Get Wallet Balance
```typescript
const { data: wallet, error } = await supabase
  .from('wallets')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### Deposit Funds
```typescript
// 1. Create payment transaction
const { data: payment, error } = await supabase
  .from('payment_transactions')
  .insert({
    user_id: userId,
    method: 'bkash',
    amount: 1000,
    sender_number: '01712345678',
    transaction_id: 'BKash-TXN-12345',
  })
  .select()
  .single();

// 2. Update wallet (after payment verification)
const { data: wallet } = await supabase
  .from('wallets')
  .update({
    balance: supabase.sql`balance + ${amount}`,
    lifetime_deposits: supabase.sql`lifetime_deposits + ${amount}`,
  })
  .eq('user_id', userId)
  .select()
  .single();
```

### Withdraw Funds
```typescript
const { data: payment, error } = await supabase
  .from('payment_transactions')
  .insert({
    user_id: userId,
    method: 'bkash',
    amount: -500,
    receiver_number: '01712345678',
  })
  .select()
  .single();

// Update wallet after withdrawal approval
const { data: wallet } = await supabase
  .from('wallets')
  .update({
    balance: supabase.sql`balance - ${amount}`,
    lifetime_withdrawals: supabase.sql`lifetime_withdrawals + ${amount}`,
  })
  .eq('user_id', userId)
  .select()
  .single();
```

### Get Transaction History
```typescript
const { data: transactions, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

---

## 🏆 Leaderboard API

### Get Leaderboard
```typescript
const { data: leaderboard, error } = await supabase
  .from('leaderboard_cache')
  .select(`
    *,
    user:users(username, avatar_url)
  `)
  .eq('timeframe', 'all_time')
  .order('rank', { ascending: true })
  .limit(100);
```

### Get User Rank
```typescript
const { data: userRank, error } = await supabase
  .from('leaderboard_cache')
  .select('*')
  .eq('user_id', userId)
  .eq('timeframe', 'all_time')
  .single();
```

### Calculate Leaderboard (Scheduled Job)
```typescript
const { data, error } = await supabase.rpc('calculate_leaderboard', {
  p_timeframe: 'daily',
});
```

---

## 📱 Activity Feed API

### Get User Activity
```typescript
const { data: activities, error } = await supabase
  .from('activities')
  .select(`
    *,
    user:users(username, avatar_url),
    market:markets(question)
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

### Get Global Activity Feed
```typescript
const { data: activities, error } = await supabase
  .from('activities')
  .select(`
    *,
    user:users(username, avatar_url),
    market:markets(question)
  `)
  .in('type', ['trade_executed', 'market_created', 'market_resolved'])
  .order('created_at', { ascending: false })
  .limit(100);
```

### Create Activity
```typescript
const { data: activity, error } = await supabase
  .from('activities')
  .insert({
    user_id: userId,
    type: 'trade_executed',
    market_id: marketId,
    trade_id: tradeId,
    metadata: {
      outcome: 'YES',
      price: 0.65,
      quantity: 100,
    },
  })
  .select()
  .single();
```

---

## 💬 Comments API

### Get Market Comments
```typescript
const { data: comments, error } = await supabase
  .from('market_comments')
  .select(`
    *,
    user:users(username, avatar_url),
    replies:market_comments(
      *,
      user:users(username, avatar_url)
    )
  `)
  .eq('market_id', marketId)
  .is('parent_id', null)
  .eq('is_deleted', false)
  .order('created_at', { ascending: false });
```

### Post Comment
```typescript
const { data: comment, error } = await supabase
  .from('market_comments')
  .insert({
    market_id: marketId,
    user_id: userId,
    content: 'This market looks interesting!',
  })
  .select()
  .single();

// Update market comment count
await supabase
  .from('markets')
  .update({
    comments_count: supabase.sql`comments_count + 1`,
  })
  .eq('id', marketId);
```

### Reply to Comment
```typescript
const { data: reply, error } = await supabase
  .from('market_comments')
  .insert({
    market_id: marketId,
    user_id: userId,
    parent_id: parentCommentId,
    content: 'I agree with this analysis!',
  })
  .select()
  .single();
```

### Like Comment
```typescript
// Update likes count
const { data: comment, error } = await supabase
  .from('market_comments')
  .update({
    likes_count: supabase.sql`likes_count + 1`,
  })
  .eq('id', commentId)
  .select()
  .single();
```

---

## 👥 User Social Features

### Follow User
```typescript
const { data: follow, error } = await supabase
  .from('user_follows')
  .insert({
    follower_id: currentUserId,
    following_id: targetUserId,
  })
  .select()
  .single();
```

### Unfollow User
```typescript
const { error } = await supabase
  .from('user_follows')
  .delete()
  .eq('follower_id', currentUserId)
  .eq('following_id', targetUserId);
```

### Get Followers
```typescript
const { data: followers, error } = await supabase
  .from('user_follows')
  .select(`
    follower:users!follower_id(id, username, avatar_url)
  `)
  .eq('following_id', userId);
```

### Get Following
```typescript
const { data: following, error } = await supabase
  .from('user_follows')
  .select(`
    following:users!following_id(id, username, avatar_url)
  `)
  .eq('follower_id', userId);
```

---

## 🔧 Utility Functions

### Get Market Statistics
```typescript
const { data: stats } = await supabase.rpc('get_market_stats', {
  p_market_id: marketId,
});

// Returns:
// {
//   total_volume: number,
//   volume_24h: number,
//   traders_count: number,
//   orders_count: number,
//   avg_trade_size: number,
//   price_volatility: number
// }
```

### Get User Statistics
```typescript
const { data: stats } = await supabase.rpc('get_user_stats', {
  p_user_id: userId,
});

// Returns:
// {
//   total_pnl: number,
//   total_volume: number,
//   trades_count: number,
//   win_rate: number,
//   avg_roi: number,
//   markets_traded: number
// }
```

### Calculate Market Probability
```typescript
// Based on last trade price
const probability = market.yes_price * 100; // e.g., 65%

// Based on order book mid-price
const midPrice = (bestBid + bestAsk) / 2;
const probability = midPrice * 100;
```

---

## 🔄 Realtime Subscriptions

### Subscribe to Market Updates
```typescript
const channel = supabase
  .channel(`market:${marketId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'markets',
      filter: `id=eq.${marketId}`,
    },
    (payload) => {
      console.log('Market updated:', payload.new);
      setMarket(payload.new);
    }
  )
  .subscribe();

// Unsubscribe when component unmounts
return () => supabase.removeChannel(channel);
```

### Subscribe to Order Book Updates
```typescript
const channel = supabase
  .channel(`orderbook:${marketId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `market_id=eq.${marketId}`,
    },
    () => {
      fetchOrderBook();
    }
  )
  .subscribe();
```

### Subscribe to New Trades
```typescript
const channel = supabase
  .channel(`trades:${marketId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'trades',
      filter: `market_id=eq.${marketId}`,
    },
    (payload) => {
      console.log('New trade:', payload.new);
      setTrades((prev) => [payload.new, ...prev]);
    }
  )
  .subscribe();
```

### Subscribe to User Activities
```typescript
const channel = supabase
  .channel(`user:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'activities',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('New activity:', payload.new);
      setActivities((prev) => [payload.new, ...prev]);
    }
  )
  .subscribe();
```

---

## 📊 Database Functions (RPC)

### Match Order
```sql
SELECT * FROM match_order_v2('order-uuid-here');
```

### Settle Market
```sql
SELECT * FROM settle_market('market-uuid-here', 'YES');
```

### Calculate Position Value
```sql
SELECT * FROM calculate_position_value('user-uuid', 'market-uuid');
```

### Update Market Metrics
```sql
SELECT * FROM update_market_metrics('market-uuid', 100, 0.65);
```

### Calculate Leaderboard
```sql
SELECT * FROM calculate_leaderboard('daily');
```

---

## 🔑 API Rate Limits

- **Authenticated requests**: 1000/minute
- **Anonymous requests**: 60/minute
- **Order placement**: 10/minute per user
- **Market creation**: 5/minute (admin only)

---

## 🛡️ Error Handling

### Common Error Codes

```typescript
try {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (error) {
    switch (error.code) {
      case '23505': // Unique violation
        console.error('Duplicate order');
        break;
      case '23503': // Foreign key violation
        console.error('Invalid market or user ID');
        break;
      case 'PGRST116': // No rows returned
        console.error('Resource not found');
        break;
      default:
        console.error('Unknown error:', error);
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
```

### Error Handling Best Practices

```typescript
import { PostgrestError } from '@supabase/supabase-js';

function handleSupabaseError(error: PostgrestError) {
  if (error.code === '23505') {
    return 'This record already exists';
  }
  if (error.code === '23503') {
    return 'Invalid reference';
  }
  if (error.code === '42501') {
    return 'Permission denied';
  }
  return error.message;
}
```

---

This API reference provides all the endpoints and patterns your AI agent needs to implement the Plokymarket platform!
