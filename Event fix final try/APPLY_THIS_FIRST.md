# 🔥 CRITICAL: Apply This Migration First

## Problem
You have 20+ conflicting resolution-related migrations that have left your database in an inconsistent state. The `resolution_systems` table has:
- Wrong column names
- Broken foreign keys  
- Missing constraints
- Conflicting helper migrations

## Solution
**Run this ONE migration to fix everything:**

```sql
-- File: 141_final_resolution_fix.sql
-- Run this in Supabase Dashboard → SQL Editor
```

## What This Migration Does

### 1. **Cleans Up the Mess**
- Drops the broken `resolution_systems` table completely
- Removes all conflicting constraints and FKs
- Starts fresh with correct structure

### 2. **Creates Correct Table Structure**
```sql
resolution_systems:
- id: UUID (PK)
- event_id: UUID → events(id) ON DELETE CASCADE  ✓ Fixed FK
- primary_method: VARCHAR (5 valid values)
- confidence_threshold: INTEGER
- ai_keywords: TEXT[]
- ai_sources: TEXT[]
- resolver_reference: TEXT
- status: VARCHAR (pending/in_progress/resolved/disputed/cancelled)
- resolution_notes: TEXT
- resolved_at: TIMESTAMPTZ
- resolved_by: UUID → auth.users(id)
- created_at/updated_at: TIMESTAMPTZ
```

### 3. **Supports All 5 Resolution Methods**
1. `manual_admin` - Admin manually resolves
2. `ai_oracle` - AI-powered resolution
3. `expert_panel` - Expert panel vote
4. `external_api` - External API verification
5. `consensus` - Community consensus

### 4. **Fixes All Related Tables**
- `events` - adds resolution_method, resolution_delay_hours, etc.
- `markets` - adds missing columns (name, slug, liquidity, etc.)
- `custom_categories` - 25 Bangladesh categories
- Social tables: bookmarks, followers, comment_likes, price_history

### 5. **Creates Working Function**
`create_event_complete()` - properly creates event + market + resolution config in one transaction

## After Running the Migration

1. **Test event creation:**
```sql
SELECT create_event_complete(
  '{"title":"Test Event","category":"Sports","trading_closes_at":"2026-12-31T23:59:59Z","resolution_method":"ai_oracle"}'::jsonb,
  'YOUR_ADMIN_UUID'::uuid
);
```

2. **Copy the frontend files** from this folder to your project (see README_FIX_INSTRUCTIONS.md)

## ⚠️ IMPORTANT

**Do NOT run the old migrations 132, 131, 011, 116, 105, 083, 082, etc.**

This single migration (141) replaces ALL of them with a clean, working setup.
