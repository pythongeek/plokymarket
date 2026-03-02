# Migration 142 Changes Summary

## Overview
This fix addresses critical issues with:
1. **Event creation failing** due to missing `title` column normalization
2. **Missing workflow tracking** infrastructure for Upstash QStash
3. **Legacy n8n dependencies** that need to be removed

---

## Files Created

### 1. Database Migrations (in `supabase/migrations/`)

| File | Purpose | Priority |
|------|---------|----------|
| `142a_normalize_events_title.sql` | Adds `title` column, migrates data from `question`, adds sync trigger | **FIRST** |
| `142b_upstash_workflow_infrastructure.sql` | Creates `upstash_workflow_runs`, `workflow_dlq`, `workflow_schedules` tables | **SECOND** |
| `142c_workflow_monitoring_views.sql` | Creates monitoring views and health check function | **THIRD** |

### 2. New API Routes (Upstash-native, no n8n)

| File | Purpose |
|------|---------|
| `apps/web/src/app/api/workflows/v2/execute/route.ts` | Main workflow executor using new tables |
| `apps/web/src/app/api/admin/workflows/dlq/route.ts` | Dead Letter Queue management API |
| `apps/web/src/app/api/admin/workflows/setup/route.ts` | QStash schedule configuration API |

### 3. Deprecated/Moved Files (n8n legacy)

| Old Location | New Location | Action |
|--------------|--------------|--------|
| `apps/web/src/app/api/webhooks/n8n/` | `apps/web/src/app/api/webhooks/_deprecated_n8n/n8n/` | **Moved** |
| `apps/web/src/app/api/resolution/n8n-webhook/` | `apps/web/src/app/api/_deprecated/n8n-webhook/` | **Moved** |

### 4. Documentation

| File | Purpose |
|------|---------|
| `MIGRATION_142_DEPLOYMENT_GUIDE.md` | Step-by-step deployment instructions |
| `MIGRATION_142_CHANGES_SUMMARY.md` | This file - overview of all changes |

---

## Deployment Order

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Apply 142a SQL (Fix events.title)                 │
│  └── Essential: Without this, event creation stays broken  │
├─────────────────────────────────────────────────────────────┤
│  STEP 2: Apply 142b SQL (Create workflow tables)           │
│  └── Essential: Without this, no workflow tracking         │
├─────────────────────────────────────────────────────────────┤
│  STEP 3: Apply 142c SQL (Monitoring views)                 │
│  └── Optional: Nice to have for monitoring                 │
├─────────────────────────────────────────────────────────────┤
│  STEP 4: Deploy code to Vercel                             │
│  └── New API routes become active                          │
├─────────────────────────────────────────────────────────────┤
│  STEP 5: Setup QStash schedules                            │
│  └── Call /api/admin/workflows/setup with setup_defaults   │
├─────────────────────────────────────────────────────────────┤
│  STEP 6: Verify (wait 48h) then cleanup n8n tables         │
│  └── DROP TABLE n8n_resolutions, etc.                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Database Objects Created

### Tables

```sql
-- Main workflow tracking table
upstash_workflow_runs (
  workflow_run_id TEXT UNIQUE,
  event_id UUID,
  market_id UUID,
  workflow_type VARCHAR,
  status VARCHAR, -- PENDING, RUNNING, COMPLETED, FAILED, RETRYING
  payload JSONB,
  result JSONB,
  error_message TEXT,
  retry_count INTEGER,
  ...
)

-- Dead Letter Queue for failed workflows
workflow_dlq (
  workflow_run_id TEXT,
  error_message TEXT,
  failed_step VARCHAR,
  resolution_action VARCHAR, -- retry, discard, manual_resolve
  ...
)

-- Schedule configurations
workflow_schedules (
  schedule_id TEXT,
  name VARCHAR UNIQUE,
  cron_expression TEXT,
  endpoint_url TEXT,
  is_active BOOLEAN,
  ...
)
```

### Functions

```sql
-- Record workflow start
record_workflow_start(p_workflow_run_id, p_workflow_type, ...)

-- Record workflow completion
record_workflow_complete(p_workflow_run_id, p_status, ...)

-- Add to DLQ
add_to_workflow_dlq(p_workflow_run_id, p_error_message, ...)

-- Health check
workflow_health_check() RETURNS TABLE(check_name, status, details, severity)
```

### Views

```sql
workflow_status_summary    -- Counts by type and status
workflow_daily_stats       -- Daily aggregated statistics
dlq_pending_issues         -- Unresolved DLQ items with context
event_workflow_status      -- Workflow status linked to events
```

---

## API Changes

### New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/workflows/v2/execute` | Execute workflow step |
| GET | `/api/workflows/v2/execute` | Get workflow status |
| GET | `/api/admin/workflows/dlq` | List DLQ items |
| POST | `/api/admin/workflows/dlq` | Resolve/retry DLQ item |
| GET | `/api/admin/workflows/setup` | List schedules |
| POST | `/api/admin/workflows/setup` | Create/manage schedules |

### Deprecated Endpoints (Moved)

| Old Endpoint | Status | Replacement |
|--------------|--------|-------------|
| `/api/webhooks/n8n/resolution` | **MOVED** | `/api/workflows/v2/execute` |
| `/api/resolution/n8n-webhook` | **MOVED** | `/api/workflows/v2/execute` |

---

## Environment Variables Required

```bash
# Required for QStash
QSTASH_TOKEN=your_qstash_token
QSTASH_URL=https://qstash.upstash.io/v2/publish/

# Required for AI Oracle workflows
GEMINI_API_KEY=your_gemini_api_key

# Required for callbacks
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Verification Commands

### Database Verification

```sql
-- Check events have titles
SELECT COUNT(*) FROM events WHERE title IS NULL;
-- Should return: 0

-- Check workflow tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('upstash_workflow_runs', 'workflow_dlq', 'workflow_schedules');
-- Should return: 3 rows

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('record_workflow_start', 'record_workflow_complete', 'add_to_workflow_dlq');
-- Should return: 3 rows
```

### API Verification

```bash
# Test workflow endpoint
curl https://your-domain.com/api/workflows/v2/execute

# Expected: {"status":"active","service":"upstash-workflow-v2",...}
```

---

## Rollback Plan

If issues occur:

1. **Code rollback**: Revert git commit and redeploy
2. **Database rollback**: 
   - 142c: Drop views (safe)
   - 142b: Keep tables (no data loss), just stop using
   - 142a: DO NOT DROP title column (would lose data)

---

## Next Steps After Deployment

1. ✅ Test event creation in admin panel
2. ✅ Verify workflow runs are tracked in `upstash_workflow_runs`
3. ✅ Check DLQ is empty (or has expected items)
4. ✅ Monitor `workflow_health_check()` for 48 hours
5. ✅ After 48h successful operation: DROP old n8n tables
