# Plokymarket Database Migration Organization

## Overview

This document organizes all Supabase database migrations for the Plokymarket prediction marketplace platform. The migrations are categorized by phase with clear dependencies and deployment instructions.

---

## Migration Categories

### Category A: Foundation (Core Types & Base Schema)

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| A1 | `20260309100001_core_types.sql` | Creates all ENUM types: market_status, order_status, order_side, order_type, kyc_status, answer_type, event_tags_domain | None (base) |
| A2 | `20260309100002_users.sql` | Adds columns to users: wallet_address, email, is_admin, kyc_status, timestamps, indexes | A1 |

### Category B: Domain Core Tables

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| B1 | `20260312100003_events.sql` | Events table: title, answer_type, tags (JSONB), status, timestamps, indexes | A1 |
| B2 | `20260312100004_markets.sql` | Markets table: event_id, slug, status, fee_percent, timestamps | A1, B1 |
| B3 | `20260312100005_wrappers_events.sql` | Legacy event creation wrappers (create_event_complete, create_event_complete_v2) | B1 |

### Category C: Trading Core (Orders & Trades)

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| C1 | `20260312100006_orders.sql` | Orders table with partitioning, legacy migration | A1, B2 |
| C2 | `20260312100007_trades.sql` | Trades table with partitioning, legacy migration | A1, B2 |
| C3 | `20260312100008_wrappers_orders.sql` | Legacy order wrappers (place_order_atomic, submit_order) | C1 |
| C4 | `20260312100009_wrappers_trades.sql` | Legacy trade wrapper (settle_market) | C2 |

### Category D: Wallet & Finance

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| D1 | `20260312100010_wallets.sql` | Wallets table: balance, locked_balance, exchange_rates table | A1 |
| D2 | `20260312100013_wrappers_wallets.sql` | Wallet wrappers (freeze_funds, update_exchange_rate) | D1 |

### Category E: Analytics & Leaderboard

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| E1 | `20260312100011_analytics.sql` | Leaderboard table, price_history functions, get_price_history RPC | A1 |
| E2 | `20260312100014_wrappers_analytics.sql` | Legacy analytics wrappers (get_leaderboard, fetch_leaderboard) | E1 |

### Category F: Oracle & Admin

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| F1 | `20260312100012_oracle.sql` | Oracle requests table, resolve_market_v2 RPC | A1, B2 |
| F2 | `20260312100015_wrappers_oracle.sql` | Legacy oracle wrapper (resolve_market) | F1 |
| F3 | `20260312100016_admin.sql` | Admin audit log table, log_admin_action_v2 RPC | A1, A2 |

### Category G: Security (RLS & Scaling)

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| G1 | `20260312100017_rls.sql` | Row Level Security policies for all tables | A2, B1, B2, C1, C2, D1, E1, F1 |
| G2 | `20260312100018_scaling.sql` | pg_cron setup for leaderboard refresh | E1 |

---

## Phase 2: Enhanced Features (v2/v3)

### Phase 3A: Orders Enhancement

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 3A-1 | `20260312110001_orders_enhanced.sql` | Orders: remaining_quantity, outcome, expires_at, fees, place_order_atomic_v2, cancel_order_v2, get_order_book_v2, get_user_orders_v2 | C1, D1 |

### Phase 3B: Trades Enhancement

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 3B-1 | `20260312110002_trades_enhanced.sql` | Trades: fee tracking, settlement, execute_trade_v2, upsert_position_v2, settle_market_v2, get_market_trades_v2, get_user_positions_v2 | C2, C1 |

### Phase 3C: Wrapper Consolidation

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 3C-1 | `20260312110003_wrappers_orders_trades.sql` | All legacy order/trade wrappers delegating to v2 versions | 3A-1, 3B-1 |

### Phase 4A: Wallets Enhancement

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 4A-1 | `20260312120001_wallets_enhanced.sql` | Wallets: total_deposited, withdrawal limits, risk_score, deposit_funds_v2, withdraw_funds_v2, release_funds_v2, get_wallet_summary_v2 | D1 |

### Phase 4B: Leaderboard & Analytics Enhancement

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 4B-1 | `20260312120002_leaderboard_analytics.sql` | Leaderboard table (full), materialized view, record_trade_result_v2, get_leaderboard_v2, get_platform_stats_v2, get_user_analytics_v2 | E1, A2 |

### Phase 4C: Oracle Enhancement

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 4C-1 | `20260312120003_oracle_enhanced.sql` | Oracle enhancements: dispute handling, submit_oracle_verdict_v2, dispute_resolution_v2 | F1 |

### Phase 4D: RLS Fix

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| 4D-1 | `20260312120004_phase4_rls_wrappers.sql` | RLS for leaderboard & oracle_disputes, leaderboard wrapper fixes | G1, 4B-1, 4C-1 |

---

## Phase 3: Final Consolidation

| # | File | Purpose | Dependencies |
|---|------|---------|--------------|
| FINAL-1 | `20260312130001_wrapper_migration.sql` | Complete wrapper pattern - ALL legacy functions delegate to v2/v3 | All prior |
| FINAL-2 | `20260312130002_smoke_tests.sql` | Smoke tests verifying wrapper delegation | FINAL-1 |

---

## Deployment Order (Production)

### Step 1: Foundation (Run First)
```bash
# Run in SQL Editor
20260309100001_core_types.sql
20260309100002_users.sql
```

### Step 2: Domain Core
```bash
20260312100003_events.sql
20260312100004_markets.sql
20260312100005_wrappers_events.sql
```

### Step 3: Trading
```bash
20260312100006_orders.sql
20260312100007_trades.sql
20260312100008_wrappers_orders.sql
20260312100009_wrappers_trades.sql
```

### Step 4: Finance & Analytics
```bash
20260312100010_wallets.sql
20260312100013_wrappers_wallets.sql
20260312100011_analytics.sql
20260312100014_wrappers_analytics.sql
```

### Step 5: Oracle & Admin
```bash
20260312100012_oracle.sql
20260312100015_wrappers_oracle.sql
20260312100016_admin.sql
```

### Step 6: Security
```bash
20260312100017_rls.sql
20260312100018_scaling.sql
```

### Step 7: Enhancements
```bash
20260312110001_orders_enhanced.sql
20260312110002_trades_enhanced.sql
20260312110003_wrappers_orders_trades.sql
20260312120001_wallets_enhanced.sql
20260312120002_leaderboard_analytics.sql
20260312120003_oracle_enhanced.sql
20260312120004_phase4_rls_wrappers.sql
```

### Step 8: Final
```bash
20260312130001_wrapper_migration.sql
20260312130002_smoke_tests.sql
```

---

## Old Migration Files Handling

### Archive Strategy

1. **Create archive folder**: Move old/duplicate migrations to `supabase/migrations/archive/`

2. **Files to archive** (if they exist):
   - Any migration files with duplicate numbers
   - Migration files that have been superseded by enhanced versions
   - Test/debug migrations

3. **Keep these files**:
   - All files listed in the deployment order above
   - Seed files in `supabase/seeds/`
   - This organization file

### Recommended Archive Commands

```bash
# Create archive if not exists
mkdir -p supabase/migrations/archive

# Move superseded/duplicate files (example)
mv supabase/migrations/old_version.sql supabase/migrations/archive/
```

---

## Running on Supabase SQL Editor

### Method 1: Sequential Execution

1. Open **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy content from each file in deployment order
3. Run each file separately
4. Verify with smoke tests

### Method 2: Combined Execution (Recommended for Clean Setup)

1. Create a combined migration file following the deployment order
2. Run all SQL in one transaction
3. This ensures atomic deployment

### Verification

After running `20260312130002_smoke_tests.sql`, you should see:
```
✅ ALL SMOKE TESTS PASSED!
```

---

## Notes

- All migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` for idempotency
- Legacy wrappers ensure backward compatibility with existing frontend code
- Production database already has some columns - migrations are additive only
- Smoke tests verify wrapper delegation is working correctly
