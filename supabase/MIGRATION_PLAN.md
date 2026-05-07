# Plokymarket — Local Supabase Migration Plan
**Step 1 of N — Schema Audit & Documentation**
Generated: May 5, 2026 | VPS: 204.168.167.195 | Local DB: polymarket-postgres (:5433)

---

## Current State (What Exists vs What Was Planned)

### The Problem
- `schema_production.sql` defines only **13 core tables** — a bare minimum
- The local DB actually has **63 tables** — evolved well beyond the plan
- `supabase/migrations/` files exist but were **NEVER applied via Supabase CLI**
- No `supabase_migrations` schema in DB = zero migration tracking
- All DB changes were applied **manually via scripts**
- `schema_production.sql` is now **obsolete** — does not reflect reality

---

## Actual Local DB Inventory (63 Tables)

### Core Trading Tables
| Table | Columns | Code Refs | Purpose |
|-------|---------|-----------|---------|
| `events` | **65** | 22 | Main event data (denormalized — includes market-like fields) |
| `markets` | **113** | **98** | Main market data (very wide — includes trading fields) |
| `orders` | 26 | **39** | User limit orders |
| `trades` | 23 | 12 | Filled trades |
| `positions` | 12 | 14 | User positions (shares × price) |

### User & Auth Tables
| Table | Columns | Code Refs | Purpose |
|-------|---------|-----------|---------|
| `users` | 19 | 6 | Supabase Auth users (password_hash, email, phone) |
| `profiles` | 12 | 10 | Financial: balance, deposits, withdrawals, KYC status |
| `user_profiles` | 16 | **33** | User attrs: full_name, avatar, admin flags, preferences |

### Wallet & Settlement
| Table | Columns | Code Refs | Purpose |
|-------|---------|-----------|---------|
| `wallets` | 26 | 16 | User wallet (BDT balance, locked, transactions) |
| `wallet_transactions` | 9 | 0 | Wallet TX log |
| `transactions` | 11 | 0 | Generic transaction log |
| `settlement_records` | 11 | 0 | Market resolution settlement |

### Notifications & Social
| Table | Columns | Code Refs | Purpose |
|-------|---------|-----------|---------|
| `notifications` | 15 | **30** | User notifications |
| `comments` | 9 | 19 | Market/event comments |
| `follows` | 4 | 15 | User follows |
| `activity_feed` | 5 | 2 | Activity stream |

### Market Operations
| Table | Columns | Code Refs | Purpose |
|-------|---------|-----------|---------|
| `oracle_requests` | 23 | 18 | AI oracle resolution requests |
| `disputes` | 27 | 7 | Market resolution disputes |
| `daily_topics` | 7 | 8 | AI-generated daily questions |
| `exchange_rates` | 14 | 15 | BDT/USDT exchange rates |

### PMF (Prediction Market Finance) — Liquidity & Margin
| Table | Columns | Purpose |
|-------|---------|---------|
| `pmf_liquidity_pools` | 18 | Liquidity pools |
| `pmf_pool_shares` | 11 | LP token shares |
| `pmf_liquidity_additions` | 10 | LQ additions |
| `pmf_liquidity_removals` | 8 | LQ removals |
| `pmf_accrued_fees` | 6 | Fee tracking |
| `pmf_distributions` | 10 | Fee distributions |
| `margin_locks` | 8 | Margin positions |
| `margin_history` | 11 | Margin TX history |
| `margin_snapshots` | 10 | Margin snapshots |
| `user_margin_settings` | 10 | User margin config |

### KYC
| Table | Columns | Code Refs |
|-------|---------|-----------|
| `kyc_submissions` | 9 | 4 |
| `kyc_documents` | 12 | 0 |

### Admin & System
| Table | Columns | Code Refs |
|-------|---------|-----------|
| `admin_activity_logs` | 14 | 3 |
| `admin_audit_log` | 8 | 0 |
| `admin_ai_settings` | 10 | 0 |
| `ai_configs` | 7 | 0 |

### Workflows & Orders
| Table | Columns | Code Refs |
|-------|---------|-----------|
| `workflow_configs` | 11 | 0 |
| `workflow_schedules` | 21 | 0 |
| `workflow_dlq` | 16 | 0 |
| `upstash_workflow_runs` | 23 | 0 |
| `conditional_orders` | 13 | 0 |
| `order_book` | 26 | 0 |
| `order_activity` | 9 | 0 |
| `order_commitments` | 5 | 0 |
| `fill_records` | 26 | 0 |
| `matching_latency` | 5 | 0 |
| `matching_wal` | 6 | 0 |

### Other
| Table | Columns | Code Refs |
|-------|---------|-----------|
| `leaderboard` | 18 | 3 |
| `payment_transactions` | 11 | 1 |
| `frozen_funds` | 7 | 0 |
| `maker_stats` | 6 | 0 |
| `user_reputation` | 12 | 0 |
| `market_followers` | 7 | 0 |
| `notification_preferences` | 11 | 0 |
| `position_snapshots` | 9 | 0 |
| `event_definitions` | 22 | 2 |
| `events_simple` | 2 | 0 |
| `activities` | 5 | 0 |

---

## Issues Found

### 🔴 CRITICAL

**1. `users` table has `password_hash` — Supabase Auth is BYPASSED**
The `users` table has `password_hash` column (confirmed from local DB schema). But the app uses Supabase Auth via `ploky-auth` (Gotrue-compatible) which manages auth in its own tables. This means:
- If `ploky-auth` creates users, they go into `ploky-auth`'s internal tables
- The `users` table in `polymarket` DB may be orphaned (no FK from ploky-auth)
- User login via `ploky-auth` → JWT validated → but `profiles` table has `id` that may not match

**Action needed:** Verify `users.id` = `profiles.id` = `user_profiles.id` and that ploky-auth writes to the same `users` table.

**2. Dual Profile Tables — Data Split Unclear**
- `profiles` (12 cols): balance, total_deposited, total_withdrawn, kyc_status, referral_code
- `user_profiles` (16 cols): full_name, avatar_url, is_admin, is_super_admin, kyc_level, status
- Both have `id` as PK
- Code uses `user_profiles` 33x but `profiles` 10x
- These should be ONE table with all fields

**Action needed:** Audit which fields are written where, then merge into one `user_profiles` table.

**3. `events` has 65 columns — likely denormalized**
The `events` table has nearly as many columns as `markets` (113). This suggests event data and market data may be stored in both places. Need to verify if this is intentional or redundant.

### 🟡 MEDIUM

**4. 46 indexes exist but no migration tracking**
Indexes are created but not tracked. If we recreate from scratch, we'd lose performance.

**5. `schema_production.sql` is obsolete**
It only covers 13 tables. The real schema is the 63-table local DB. We need to regenerate it from actual DB state.

**6. RLS Policies (00003_rls_policies.sql) may not be applied**
No `supabase_migrations` schema means we don't know what's actually applied. The RLS policies may or may not be active.

---

## Step-by-Step Plan

### STEP 1 ✅ COMPLETED — Schema Audit
- [x] Extract all 63 tables from local DB
- [x] Extract column definitions for key tables
- [x] Map table usage in API code (98 code references analyzed)
- [x] Identify critical tables (markets=98, profiles=56, orders=39)
- [x] Identify redundant/overlapping tables (profiles vs user_profiles)
- [x] Check indexes and migration tracking

### STEP 2 — Generate Authoritative Schema SQL
- [ ] Extract full CREATE TABLE statements from local DB using pg_dump
- [ ] Generate `supabase/migrations/00000_actual_schema.sql` (source of truth)
- [ ] Generate `supabase/migrations/00004_functions.sql` (all SQL functions)
- [ ] Generate `supabase/migrations/00005_views.sql` (all views)
- [ ] Generate `supabase/migrations/00006_indexes.sql` (all indexes)
- [ ] Regenerate `schema_production.sql` to match reality

### STEP 3 — Fix User Table Architecture
- [ ] Verify ploky-auth → `users` table integration (does auth write to local users table?)
- [ ] Audit write paths for `profiles` vs `user_profiles`
- [ ] Merge duplicate fields into single `user_profiles` table
- [ ] Add proper FK: `users.id` → `user_profiles.id`, `users.id` → `profiles.id`
- [ ] Update all code references from `profiles` → `user_profiles` where needed

### STEP 4 — Add RLS Policies (Supabase-native Security)
- [ ] Apply `00003_rls_policies.sql` to local DB
- [ ] Verify policies are active (check pg_policies table)
- [ ] Test that unauthenticated users can't read restricted tables
- [ ] Test that users can only read their own orders/wallets
- [ ] Add policies for PMF tables, KYC tables, admin logs

### STEP 5 — Verify Migration CLI Compatibility
- [ ] Install Supabase CLI on VPS (`npm install -g supabase`)
- [ ] Run `supabase migration new` to start tracking
- [ ] Confirm `supabase_migrations` schema appears in DB
- [ ] Future migrations will be tracked automatically

### STEP 6 — TypeScript Type Generation
- [ ] Use `supabase gen types typescript` to generate types from actual DB
- [ ] Replace `/types/database.types.ts` with generated types
- [ ] Audit breaking changes (renamed columns, missing fields)

### STEP 7 — Replace Cloud Supabase References (Remaining)
- [ ] Frontend Supabase client (`/lib/supabase/`) → local PostgREST (:4000)
- [ ] Check all `sltcfmqefujecqfbmkvz` references outside admin routes
- [ ] Replace with local URL in env vars
- [ ] Test market creation, order placement, wallet operations

### STEP 8 — Deploy & Verify
- [ ] Rebuild after schema/type changes
- [ ] Deploy to VPS
- [ ] Run smoke tests on all critical paths
- [ ] Monitor PM2 logs for errors

---

## What I Need From You (to continue)

1. **DB_PASSWORD for local postgres** — I couldn't read it from `/opt/auth-server/.env` (file missing on current check). Need: `psql polymarket` access to run `pg_dump`.

2. **Verify ploky-auth user flow** — Does `ploky-auth` write to the local `users` table, or does it have its own user store? Check: does a user created via login appear in `polymarket.public.users`?

3. **Cloud Supabase access (optional)** — The `sltcfmqefujecqfbmkvz.supabase.co` DB has data we may need to migrate. If yes, I need:
   - `POSTGRES_URL_NON_POOLING` from Supabase Dashboard → Settings → Connection Pooling
   - Or a DB dump file (`pg_dump`) from the cloud

4. **Priority decision** — Should we:
   - **Option A**: Keep current 63-table local DB as-is, just document it properly
   - **Option B**: Strip down to schema_production.sql (13 tables) + essential additions, clean up duplicates

---

## Quick Wins (If You Want to Continue Now)

While waiting for the above, you can run this on the VPS to get a full pg_dump:

```bash
ssh root@204.168.167.195
docker run --rm --network=host postgres:15 pg_dump \
  'postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5433/polymarket' \
  --schema-only > /root/schema_$(date +%Y%m%d).sql
```

Then share the file path or copy it to the workspace.
