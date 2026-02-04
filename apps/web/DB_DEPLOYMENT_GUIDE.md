# Database Fix Deployment Guide

This guide explains how to deploy the latest database fixes to your Plokymarket project.

## Overview

The database fix includes:
- **Database Schema** ([`supabase/db/init.sql`](../../supabase/db/init.sql)) - Complete database structure with tables, indexes, functions, and RLS policies
- **Matching Engine** ([`supabase/db/matching_engine.sql`](../../supabase/db/matching_engine.sql)) - Order matching and settlement functions

## Quick Start (Windows)

Since you're on Windows, use the batch script:

```cmd
cd apps\web
deploy-db-fix.bat
```

This script will:
1. Check your environment variables
2. Guide you to apply SQL files to Supabase
3. Build the application
4. Deploy to Vercel

## Manual Deployment Steps

### Step 1: Apply Database Schema to Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Open [`supabase/db/init.sql`](../../supabase/db/init.sql) in a text editor
5. Copy the entire SQL content
6. Paste it into the SQL Editor
7. Click **Run** to execute

This will create:
- Tables: `users`, `wallets`, `markets`, `orders`, `trades`, `positions`, `transactions`, `oracle_verifications`, `payment_transactions`
- Indexes for optimal query performance
- Functions for automatic timestamp updates and wallet creation
- Row Level Security (RLS) policies
- Sample seed data (admin user and sample markets)

### Step 2: Apply Matching Engine Functions

1. In the same SQL Editor
2. Open [`supabase/db/matching_engine.sql`](../../supabase/db/matching_engine.sql)
3. Copy the entire SQL content
4. Paste it into the SQL Editor
5. Click **Run** to execute

This will create:
- `match_order()` - Matches orders against the order book
- `update_position()` - Updates user positions after trades
- `process_trade_settlement()` - Handles wallet updates for trades
- `settle_market()` - Settles markets and pays winners

### Step 3: Verify Database Setup

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- `users`
- `wallets`
- `markets`
- `orders`
- `trades`
- `positions`
- `transactions`
- `oracle_verifications`
- `payment_transactions`

Check that functions were created:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

Expected functions:
- `match_order`
- `update_position`
- `process_trade_settlement`
- `settle_market`
- `plokymarket_get_market_prices`
- `plokymarket_get_orderbook`
- `plokymarket_update_updated_at`
- `plokymarket_create_wallet_on_user`

### Step 4: Deploy to Vercel

#### Option A: Using Vercel CLI

```cmd
cd apps\web
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: Using GitHub

```cmd
cd f:/My profession/Hybrid APPs/Plokymarket
git add .
git commit -m "Deploy database fix"
git push
```

Then:
1. Go to https://vercel.com
2. Import your GitHub repository
3. Set root directory to `apps/web`
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
5. Click **Deploy**

### Step 5: Configure Supabase Auth Redirects

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to your Vercel domain (e.g., `https://plokymarket.vercel.app`)
3. Add **Redirect URLs**: `https://plokymarket.vercel.app/auth/callback`

### Step 6: Enable Realtime

In Supabase Dashboard → Database → Replication:

Enable Realtime for:
- `orders` table
- `trades` table
- `markets` table

## Testing the Deployment

### 1. Test Database Connection

Visit your deployed app and check the browser console for any Supabase connection errors.

### 2. Test User Registration

1. Go to `/register`
2. Create a new account
3. Verify that a user record was created in the `users` table
4. Verify that a wallet was automatically created in the `wallets` table

### 3. Test Market Creation

1. Log in as admin (or create an admin user)
2. Go to the admin panel
3. Create a new market
4. Verify the market appears in the `markets` table

### 4. Test Order Matching

1. Create a market
2. Place a buy order
3. Place a matching sell order
4. Verify that:
   - Orders were matched
   - A trade record was created in `trades` table
   - Positions were updated in `positions` table
   - Wallet balances were updated
   - Transaction records were created

## Troubleshooting

### SQL Execution Errors

**Error: `relation already exists`**
- This is normal if tables already exist
- The SQL uses `CREATE TABLE IF NOT EXISTS` to handle this

**Error: `function already exists`**
- The SQL uses `CREATE OR REPLACE FUNCTION` to handle this
- Functions will be updated with the latest version

### Build Errors

**Error: `Module not found`**
```cmd
cd apps\web
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variable Issues

**Error: `NEXT_PUBLIC_SUPABASE_URL is not defined`**
- Ensure environment variables are set in Vercel Dashboard
- Redeploy after adding variables
- Variable names must start with `NEXT_PUBLIC_` for client-side access

### Database Connection Issues

**Error: `Connection refused`**
- Verify Supabase project is active
- Check that project URL and keys are correct
- Ensure RLS policies allow access

## Database Schema Reference

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `wallets` | User wallet balances |
| `markets` | Prediction markets |
| `orders` | Buy/sell orders |
| `trades` | Executed trades |
| `positions` | User positions in markets |
| `transactions` | Transaction history |
| `oracle_verifications` | Market resolution data |
| `payment_transactions` | Deposit/withdrawal records |

### Key Functions

| Function | Purpose |
|----------|---------|
| `match_order()` | Match orders against order book |
| `update_position()` | Update user positions |
| `process_trade_settlement()` | Handle trade settlements |
| `settle_market()` | Settle markets and pay winners |
| `plokymarket_get_market_prices()` | Get current market prices |
| `plokymarket_get_orderbook()` | Get order book data |

## Useful SQL Queries

### Check all orders
```sql
SELECT * FROM public.orders ORDER BY created_at DESC LIMIT 10;
```

### Check all trades
```sql
SELECT * FROM public.trades ORDER BY created_at DESC LIMIT 10;
```

### Check user wallet
```sql
SELECT u.email, w.balance, w.locked_balance 
FROM public.users u 
JOIN public.wallets w ON u.id = w.user_id;
```

### Check market prices
```sql
SELECT * FROM plokymarket_get_market_prices('market-uuid-here');
```

### Manually match an order
```sql
SELECT * FROM match_order('order-uuid-here');
```

## Support

For issues with:
- **Supabase**: Visit https://supabase.com/support
- **Vercel**: Visit https://vercel.com/support
- **Application**: Check browser console for errors
