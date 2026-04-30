# Plokymarket TypeScript & System Errors Report

**Generated:** 2026-03-17
**Project:** Plokymarket Web App
**Total Errors:** ~500+ TypeScript errors

---

## Executive Summary

The Plokymarket web app has significant TypeScript errors primarily caused by:
1. **Schema mismatch** - Local database is missing tables/views that exist in production
2. **Outdated types** - Type definitions don't reflect the actual database schema
3. **Missing RPC functions** - Database functions referenced in code don't exist

---

## Error Categories

### 1. Missing Tables (Local DB vs Production)

The following tables are referenced in code but don't exist in the local database:

| Table Name | Files Affected |
|------------|---------------|
| `events` | markets/page.tsx, types/unified.ts |
| `profiles` | api/admin/ai-config/route.ts, test_ssr.ts, test_supabase.ts |
| `user_profiles` | api/admin/ai-config/route.ts, test_ssr.ts |
| `deposit_requests` | test_ssr.ts, test_supabase.ts |
| `user_reputation` | lib/social/reputation-service.ts |
| `expert_badges` | lib/social/reputation-service.ts |
| `user_badges` | lib/social/reputation-service.ts |
| `user_follows` | lib/social/reputation-service.ts |
| `activities` | lib/social/reputation-service.ts |
| `ai_resolution_pipelines` | api/_deprecated/n8n-webhook/route.ts |
| `resolution_systems` | api/_deprecated/n8n-webhook/route.ts |
| `ai_providers` | api/admin/ai-config/route.ts |
| `ai_prompts` | api/admin/ai-config/route.ts |
| `admin_ai_settings` | api/admin/ai-config/route.ts |
| `user_portfolio_v2` (view) | Multiple files |

### 2. Missing Columns in Existing Tables

| Table | Missing Column | Files Affected |
|-------|---------------|----------------|
| `markets` | `best_bid` | types/unified.ts |
| `markets` | `no_price` | types/unified.ts |
| `users` | `reputation_score` | lib/social/reputation-service.ts |
| `ai_event_pipelines` | `total_predictions` | lib/social/reputation-service.ts |
| `ai_event_pipelines` | `correct_predictions` | lib/social/reputation-service.ts |
| `ai_event_pipelines` | `current_streak` | lib/social/reputation-service.ts |
| `ai_event_pipelines` | `best_streak` | lib/social/reputation-service.ts |
| `ai_event_pipelines` | `social_score` | lib/social/reputation-service.ts |

### 3. Missing RPC Functions

The following RPC functions are called in code but don't exist in the database:

| Function Name | Files Affected |
|---------------|---------------|
| `increment_social_score` | lib/social/reputation-service.ts |
| `create_workflow_execution` | lib/upstash/workflows.ts |
| `update_workflow_status` | lib/upstash/workflows.ts |
| `log_workflow_step` | lib/upstash/workflows.ts |

### 4. Type Mismatch Errors

| Error | Files Affected |
|-------|---------------|
| `b.count` is of type 'unknown' | app/[lang]/(dashboard)/markets/MarketsClient.tsx |
| Category count type mismatch | app/[lang]/(dashboard)/markets/MarketsClient.tsx |
| Implicit 'any' type | lib/tif/service.ts |
| Json type not found | lib/upstash/workflows.ts |

---

## Root Cause Analysis

### Primary Issue: Database Schema Mismatch

The local PostgreSQL database (via Docker) has only **15 tables**, while the production Supabase has significantly more tables and views. The TypeScript types are generated from the local database, which creates a fundamental mismatch.

### Tables in Local Database (15)
```
- ai_event_pipelines
- markets
- oracle_verifications
- orders
- payment_transactions
- position_interventions
- positions
- support_ticket_messages
- support_tickets
- trades
- transactions
- usdt_transactions
- user_internal_notes
- users
- wallets
```

### Expected Tables (Production)
The code expects these additional tables:
- events
- profiles / user_profiles
- deposit_requests
- user_reputation
- expert_badges
- user_badges
- user_follows
- activities
- workflow_executions
- workflow_schedules
- leaderboard
- comments
- And many more...

---

## Recommended Fixes

### Option 1: Sync with Production Database (Recommended)

1. **Get types from production Supabase:**
```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

2. **Apply missing migrations locally:**
```bash
# Apply all pending migrations from supabase/migrations/
```

### Option 2: Create Comprehensive Type Definitions

Create manual type definitions for all expected tables that don't exist locally.

### Option 3: Incremental Fixes

For each error category:

1. **Missing tables** - Create stub tables/views in local DB or disable affected code
2. **Missing columns** - Add columns to existing tables via migration
3. **Missing RPC functions** - Create stub functions or update database schema
4. **Type mismatches** - Add proper type annotations

---

## Quick Wins (Low Effort, High Impact)

1. **Fix MarketsClient.tsx** - Add type assertion for count fields
2. **Fix lib/upstash/workflows.ts** - Import Json from database types
3. **Fix lib/tif/service.ts** - Add explicit types to parameters
4. **Delete or update test files** - test_ssr.ts, test_supabase.ts, test_types.ts reference non-existent tables

---

## Files Requiring Immediate Attention

| Priority | File | Issue |
|----------|------|-------|
| HIGH | src/types/database.types.ts | Needs regeneration from production |
| HIGH | src/types/unified.ts | References non-existent columns |
| HIGH | lib/social/reputation-service.ts | Missing multiple tables |
| MEDIUM | lib/upstash/workflows.ts | Missing RPC functions |
| MEDIUM | app/[lang]/(dashboard)/markets/MarketsClient.tsx | Type assertions needed |
| LOW | test_*.ts files | Should be removed or updated |

---

## Next Steps

1. **Regenerate types from production Supabase** (requires production access)
2. **Run database migrations** to add missing tables locally
3. **Fix type assertion errors** in component files
4. **Add missing RPC functions** to database
5. **Re-run TypeScript compiler** to verify fixes

---

## Notes

- The local database uses PostgreSQL 15 directly, not full Supabase
- RLS policies and Supabase-specific features won't work locally
- For production-ready code, always generate types from the production database
