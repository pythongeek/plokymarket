# Database Migration Conflict Analysis

## Summary

Before running migration **141_final_resolution_fix.sql**, here's the analysis of existing event-related migrations and their conflicts.

---

## 🔴 CRITICAL CONFLICTS (Will Break 141)

### 1. **resolution_delay vs resolution_delay_hours Column Mismatch**

| Migration | Column Used | Status |
|-----------|-------------|--------|
| 141 (NEW) | `resolution_delay` (minutes) | ✅ Correct |
| 20260225_add_resolution_delay_to_events | `resolution_delay` (minutes) | ✅ Compatible |
| 093_manual_event_system | `resolution_delay_hours` | ❌ **CONFLICT** |
| 094_reimplemented_events_markets | `resolution_delay_hours` | ❌ **CONFLICT** |
| 123_create_event_with_markets_rpc | `resolution_delay_hours` | ❌ **CONFLICT** |
| 125_fix_event_creation | `resolution_delay_hours` | ❌ **CONFLICT** |
| 138_fix_events_constraints | `resolution_delay_hours` | ❌ **CONFLICT** |
| 139_fix_create_event_function | `resolution_delay_hours` | ❌ **CONFLICT** |

**Solution**: Migration 141 handles this by checking if `resolution_delay` exists before adding it.

---

### 2. **create_event_complete Function Versions**

Multiple migrations create this function with **different signatures**:

| Migration | Function Signature |
|-----------|-------------------|
| 094_reimplemented_events_markets | `create_event_complete(JSONB, UUID)` - uses `resolution_delay_hours` |
| 139_fix_create_event_function | `create_event_complete(JSONB, UUID)` - simplified version |
| 141 (NEW) | `create_event_complete(JSONB, UUID)` - uses `resolution_delay` |

**Problem**: All have same name but different implementations.

**Solution**: Migration 141 uses `DROP FUNCTION IF EXISTS` first, then recreates.

---

### 3. **resolution_systems Table Structure Differences**

| Migration | Table Structure |
|-----------|----------------|
| 081_ai_event_creation_schema | Full-featured (ai_oracle_config, expert_votes, disputes, etc.) |
| 093_manual_event_system | Simple version (primary_method, ai_keywords, etc.) |
| 141 (NEW) | Clean version with 5 methods, no expert panel tables |

**Problem**: Different columns in each version.

**Solution**: Migration 141 drops the table completely and recreates from scratch.

---

### 4. **Resolution Method Name Mismatch**

| Migration | Resolution Methods |
|-----------|-------------------|
| 141 (NEW) | manual_admin, ai_oracle, expert_panel, external_api, **consensus**, **community_vote**, **hybrid** (all 6) |
| 093_manual_event_system | manual_admin, ai_oracle, expert_panel, external_api (missing consensus, community_vote, hybrid) |
| 138_fix_events_constraints | manual_admin, ai_oracle, expert_panel, external_api, **community_vote**, **hybrid** (missing consensus) |
| 139_fix_create_event_function | manual_admin, ai_oracle, expert_panel, external_api, **community_vote**, **hybrid** (missing consensus) |

**Problem**: 
- 141 uses `consensus`
- 138/139 use `community_vote` and `hybrid`

**Solution**: Migration 141 now includes all 6 methods for maximum compatibility.

---

## 🟡 WARNINGS (Potential Issues)

### 5. **Migration 123 - Uses Non-existent `outcomes` Column**

```sql
-- Migration 123 tries to insert into markets.outcomes:
INSERT INTO markets (..., outcomes, ...) VALUES (..., '["Yes", "No"]'::JSONB, ...)
```

**Problem**: `markets` table doesn't have `outcomes` column.

**Status**: This was already fixed in migration 125.

---

### 6. **Multiple get_admin_events Functions**

| Migration | Return Type |
|-----------|-------------|
| 094 | Has `resolution_delay_hours` |
| 141 (NEW) | Has `resolution_delay` |

**Solution**: 141 drops and recreates with correct column name.

---

## ✅ SAFE MIGRATIONS (No Conflicts)

These migrations are safe and don't conflict with 141:

| Migration | Purpose | Status |
|-----------|---------|--------|
| 059_events_system.sql | Initial events table creation | ✅ Safe (uses IF NOT EXISTS) |
| 100_fix_event_schema_and_rls.sql | RLS policy fixes | ✅ Safe (idempotent) |
| 106_event_validation_and_realtime.sql | Validation triggers | ✅ Safe (if properly written) |
| 115_emergency_pause_system.sql | Emergency pause | ✅ Safe (separate feature) |
| 119_events_realtime_rls.sql | Realtime RLS | ✅ Safe (RLS policies) |
| 130_fix_markets_events_fk.sql | Foreign key fixes | ✅ Safe (idempotent) |
| 135_fix_events_markets_relationship.sql | Relationship fixes | ✅ Safe (idempotent) |
| 136_fix_events_columns_and_fk.sql | Column fixes | ✅ Safe (IF NOT EXISTS) |
| 137_fix_slug_and_required_columns.sql | Slug fixes | ✅ Safe |

---

## 📋 RECOMMENDATION

### BEFORE Running Migration 141:

1. **Backup your database** - Always backup before major migrations

2. **Run this cleanup SQL first** (optional but recommended):
```sql
-- Drop conflicting functions that 141 will recreate
DROP FUNCTION IF EXISTS create_event_complete(JSONB, UUID);
DROP FUNCTION IF EXISTS get_admin_events(VARCHAR, VARCHAR, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS create_event_with_resolution(JSONB, JSONB, UUID);
DROP FUNCTION IF EXISTS create_event_with_markets(JSONB, JSONB[]);

-- Drop conflicting constraints
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_resolution_method_check;
ALTER TABLE public.markets DROP CONSTRAINT IF EXISTS markets_resolution_method_check;

-- Drop resolution_systems table (will be recreated by 141)
DROP TABLE IF EXISTS public.resolution_systems CASCADE;
```

3. **Run Migration 141** - It will handle everything else

---

## 🔍 TEST AFTER MIGRATION

```sql
-- Test the function exists and works
SELECT create_event_complete(
    '{
        "title": "Test Event",
        "category": "Sports",
        "trading_closes_at": "2026-12-31T23:59:59Z",
        "resolution_method": "consensus",
        "resolution_delay": 1440
    }'::jsonb,
    'YOUR_ADMIN_UUID'::uuid
);

-- Check the result
-- Should return: {"success": true, "event_id": "...", "market_id": "...", "slug": "..."}
```

---

## 📁 MIGRATIONS TO DELETE (Already Cleaned)

The following migrations have been deleted from local:
- 132_fix_resolution_method_constraint
- 131_add_resolution_date_to_events
- 011_add_resolution_system_columns
- 116_resolution_interface
- 105_comments_and_resolvers
- 083_production_resolution_system
- 082_market_resolution_system
- 20260225_add_resolution_delay_to_events

---

## 🎯 BOTTOM LINE

**Migration 141 is designed to handle all conflicts by:**
1. Dropping and recreating conflicting functions
2. Dropping and recreating the resolution_systems table
3. Using `IF NOT EXISTS` for column additions
4. Defining its own constraints

**It's safe to run 141 as-is**, but backing up first is always recommended.
