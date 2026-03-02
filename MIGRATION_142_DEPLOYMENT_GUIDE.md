# Migration 142 Deployment Guide
## Critical Fix: Event Creation & Upstash Workflow Infrastructure

**CRITICAL:** This migration MUST be applied in sequence (142a → 142b → 142c) to fix the broken event creation flow and establish proper workflow tracking.

---

## 🚨 Executive Summary

### Problems Fixed
1. **Event Creation Broken**: `events.title` column missing → events created with NULL title → orphaned events
2. **No Workflow Tracking**: `upstash_workflow_runs` table missing → no audit trail for QStash jobs
3. **No DLQ**: `workflow_dlq` table missing → failed jobs have no recovery path
4. **n8n Legacy**: Old n8n webhooks still present → potential conflicts

### Solution
- **142a**: Normalize `events.question` → `events.title`
- **142b**: Create Upstash workflow infrastructure + migrate from n8n
- **142c**: Add monitoring views for workflow health

---

## 📋 Pre-Deployment Checklist

- [ ] Backup production database
- [ ] Verify QSTASH_TOKEN is configured in Vercel
- [ ] Verify GEMINI_API_KEY is configured (for AI oracle)
- [ ] Ensure admin access to Supabase Dashboard
- [ ] Prepare for 5-10 minute maintenance window

---

## 🔧 Step 1: Apply Migration 142a (CRITICAL - FIRST)

**Purpose:** Fix the events table title/question mismatch

### SQL to Execute

```sql
-- Migration 142a: Normalize events.question → events.title
-- Run this FIRST before any other migrations

BEGIN;

-- Add title column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'events' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.events ADD COLUMN title TEXT;
  END IF;
END $$;

-- Migrate existing data: question → title
UPDATE public.events 
SET title = question 
WHERE title IS NULL AND question IS NOT NULL;

-- Also try name if still NULL
UPDATE public.events 
SET title = name 
WHERE title IS NULL AND name IS NOT NULL;

-- Last resort: use slug
UPDATE public.events 
SET title = REPLACE(slug, '-', ' ')
WHERE title IS NULL AND slug IS NOT NULL;

-- Set any remaining NULLs
UPDATE public.events 
SET title = 'Untitled Event ' || id::text
WHERE title IS NULL;

-- Make title NOT NULL
ALTER TABLE public.events ALTER COLUMN title SET NOT NULL;

-- Add sync trigger
CREATE OR REPLACE FUNCTION sync_event_title_question()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.question IS NULL THEN
    NEW.question := NEW.title;
  END IF;
  IF NEW.question IS DISTINCT FROM OLD.question AND NEW.title IS NULL THEN
    NEW.title := NEW.question;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_event_title_question ON public.events;
CREATE TRIGGER trigger_sync_event_title_question
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION sync_event_title_question();

COMMIT;
```

### Verification

```sql
-- Check for any NULL titles (should return 0 rows)
SELECT COUNT(*) FROM events WHERE title IS NULL;

-- Check that all events have titles
SELECT id, title, question FROM events LIMIT 5;
```

---

## 🔧 Step 2: Apply Migration 142b (CRITICAL - SECOND)

**Purpose:** Create Upstash workflow tracking tables

### SQL to Execute

```sql
-- Migration 142b: Upstash QStash Infrastructure
-- Run this AFTER 142a

BEGIN;

-- Create upstash_workflow_runs table
CREATE TABLE IF NOT EXISTS public.upstash_workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id TEXT UNIQUE NOT NULL,
    message_id TEXT,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
    workflow_type VARCHAR(50) NOT NULL CHECK (
        workflow_type IN (
            'event_creation', 'market_resolution', 'deposit_notification',
            'withdrawal_processing', 'daily_report', 'auto_verification',
            'exchange_rate_update', 'price_snapshot', 'market_close_check',
            'settlement', 'ai_oracle', 'batch_markets', 'cleanup'
        )
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
        status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED')
    ),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    error_details JSONB DEFAULT '{}'::jsonb,
    payload JSONB DEFAULT '{}'::jsonb,
    result JSONB DEFAULT '{}'::jsonb,
    execution_time_ms INTEGER,
    steps_completed INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 1,
    source VARCHAR(20) DEFAULT 'upstash' CHECK (source IN ('upstash', 'n8n_migrated', 'manual')),
    migrated_from_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_upstash_workflow_runs_event_id ON public.upstash_workflow_runs(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_upstash_workflow_runs_market_id ON public.upstash_workflow_runs(market_id) WHERE market_id IS NOT NULL;
CREATE INDEX idx_upstash_workflow_runs_status ON public.upstash_workflow_runs(status);
CREATE INDEX idx_upstash_workflow_runs_workflow_type ON public.upstash_workflow_runs(workflow_type);
CREATE INDEX idx_upstash_workflow_runs_workflow_run_id ON public.upstash_workflow_runs(workflow_run_id);
CREATE INDEX idx_upstash_workflow_runs_created_at ON public.upstash_workflow_runs(created_at DESC);

-- Create workflow_dlq (Dead Letter Queue)
CREATE TABLE IF NOT EXISTS public.workflow_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id TEXT NOT NULL REFERENCES public.upstash_workflow_runs(workflow_run_id),
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_code VARCHAR(50),
    failed_at TIMESTAMPTZ DEFAULT NOW(),
    failed_step VARCHAR(100),
    payload_snapshot JSONB DEFAULT '{}'::jsonb,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_action VARCHAR(20) CHECK (resolution_action IN ('retry', 'discard', 'manual_resolve', 'archived')),
    resolution_notes TEXT,
    retry_attempts INTEGER DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLQ Indexes
CREATE INDEX idx_workflow_dlq_workflow_run_id ON public.workflow_dlq(workflow_run_id);
CREATE INDEX idx_workflow_dlq_failed_at ON public.workflow_dlq(failed_at DESC);
CREATE INDEX idx_workflow_dlq_resolved ON public.workflow_dlq(resolved_at) WHERE resolved_at IS NULL;

-- Create workflow_schedules table
CREATE TABLE IF NOT EXISTS public.workflow_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id TEXT UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE,
    workflow_type VARCHAR(50) NOT NULL,
    cron_expression TEXT NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    endpoint_url TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'POST',
    headers JSONB DEFAULT '{}'::jsonb,
    default_payload JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(20),
    next_run_at TIMESTAMPTZ,
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.upstash_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_dlq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin access
CREATE POLICY "Allow admin read workflow runs"
    ON public.upstash_workflow_runs
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

CREATE POLICY "Service role full access"
    ON public.upstash_workflow_runs
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Allow admin manage DLQ"
    ON public.workflow_dlq
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = auth.uid() AND (is_admin = TRUE OR is_super_admin = TRUE)
    ));

CREATE POLICY "Service role full access DLQ"
    ON public.workflow_dlq
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- Helper function: record_workflow_start
CREATE OR REPLACE FUNCTION record_workflow_start(
    p_workflow_run_id TEXT,
    p_workflow_type VARCHAR,
    p_event_id UUID DEFAULT NULL,
    p_market_id UUID DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb,
    p_message_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.upstash_workflow_runs (
        workflow_run_id, message_id, workflow_type, event_id, market_id,
        status, payload, started_at
    ) VALUES (
        p_workflow_run_id, p_message_id, p_workflow_type, p_event_id, p_market_id,
        'RUNNING', p_payload, NOW()
    )
    ON CONFLICT (workflow_run_id) 
    DO UPDATE SET 
        status = 'RUNNING',
        started_at = NOW(),
        retry_count = public.upstash_workflow_runs.retry_count + 1,
        updated_at = NOW()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: record_workflow_complete
CREATE OR REPLACE FUNCTION record_workflow_complete(
    p_workflow_run_id TEXT,
    p_status VARCHAR,
    p_result JSONB DEFAULT '{}'::jsonb,
    p_error_message TEXT DEFAULT NULL,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.upstash_workflow_runs
    SET 
        status = p_status,
        result = p_result,
        error_message = p_error_message,
        completed_at = NOW(),
        execution_time_ms = p_execution_time_ms,
        updated_at = NOW()
    WHERE workflow_run_id = p_workflow_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: add_to_workflow_dlq
CREATE OR REPLACE FUNCTION add_to_workflow_dlq(
    p_workflow_run_id TEXT,
    p_error_message TEXT,
    p_error_stack TEXT DEFAULT NULL,
    p_failed_step VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.workflow_dlq (
        workflow_run_id, error_message, error_stack, failed_step, payload_snapshot
    )
    SELECT 
        p_workflow_run_id, p_error_message, p_error_stack, p_failed_step,
        COALESCE(payload, '{}'::jsonb)
    FROM public.upstash_workflow_runs
    WHERE workflow_run_id = p_workflow_run_id
    RETURNING id INTO v_id;
    
    UPDATE public.upstash_workflow_runs
    SET status = 'FAILED', error_message = p_error_message, updated_at = NOW()
    WHERE workflow_run_id = p_workflow_run_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

### Verification

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('upstash_workflow_runs', 'workflow_dlq', 'workflow_schedules');

-- Should return 3 rows
```

---

## 🔧 Step 3: Apply Migration 142c (OPTIONAL - THIRD)

**Purpose:** Add monitoring views for workflow health

### SQL to Execute

```sql
-- Migration 142c: Workflow Monitoring Views
-- Run this AFTER 142b

BEGIN;

-- Workflow status summary view
CREATE OR REPLACE VIEW public.workflow_status_summary AS
SELECT 
    workflow_type,
    status,
    COUNT(*) as count,
    MIN(started_at) as oldest_started,
    MAX(started_at) as newest_started,
    AVG(execution_time_ms) as avg_execution_time_ms
FROM public.upstash_workflow_runs
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY workflow_type, status;

-- Daily stats view
CREATE OR REPLACE VIEW public.workflow_daily_stats AS
SELECT 
    DATE(created_at) as date,
    workflow_type,
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as successful,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
    COUNT(*) FILTER (WHERE status = 'RETRYING') as retrying,
    AVG(execution_time_ms) FILTER (WHERE status = 'COMPLETED') as avg_success_time_ms,
    AVG(retry_count) as avg_retries
FROM public.upstash_workflow_runs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), workflow_type
ORDER BY date DESC, workflow_type;

-- DLQ pending issues view
CREATE OR REPLACE VIEW public.dlq_pending_issues AS
SELECT 
    dlq.id as dlq_id,
    dlq.workflow_run_id,
    dlq.error_message,
    dlq.failed_step,
    dlq.failed_at,
    dlq.retry_attempts,
    run.workflow_type,
    run.event_id,
    run.market_id,
    run.payload,
    EXTRACT(EPOCH FROM (NOW() - dlq.failed_at))/3600 as hours_pending
FROM public.workflow_dlq dlq
JOIN public.upstash_workflow_runs run ON run.workflow_run_id = dlq.workflow_run_id
WHERE dlq.resolved_at IS NULL
ORDER BY dlq.failed_at ASC;

-- Health check function
CREATE OR REPLACE FUNCTION public.workflow_health_check()
RETURNS TABLE (check_name TEXT, status TEXT, details TEXT, severity TEXT) AS $$
BEGIN
    -- Stuck workflows
    RETURN QUERY
    SELECT 'Stuck Workflows'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' WHEN COUNT(*) < 5 THEN 'WARNING' ELSE 'CRITICAL' END::TEXT,
        COUNT(*) || ' workflows running > 1 hour'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'info' WHEN COUNT(*) < 5 THEN 'warning' ELSE 'critical' END::TEXT
    FROM public.upstash_workflow_runs
    WHERE status = 'RUNNING' AND started_at < NOW() - INTERVAL '1 hour';

    -- DLQ backlog
    RETURN QUERY
    SELECT 'DLQ Backlog'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' WHEN COUNT(*) < 10 THEN 'WARNING' ELSE 'CRITICAL' END::TEXT,
        COUNT(*) || ' unresolved items in DLQ'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'info' WHEN COUNT(*) < 10 THEN 'warning' ELSE 'critical' END::TEXT
    FROM public.workflow_dlq WHERE resolved_at IS NULL;

    -- Recent failures
    RETURN QUERY
    SELECT 'Recent Failures (24h)'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'OK' WHEN COUNT(*) < 10 THEN 'WARNING' ELSE 'CRITICAL' END::TEXT,
        COUNT(*) || ' failed workflows in last 24h'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'info' WHEN COUNT(*) < 10 THEN 'warning' ELSE 'critical' END::TEXT
    FROM public.upstash_workflow_runs
    WHERE status = 'FAILED' AND created_at > NOW() - INTERVAL '24 hours';

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

---

## 🚀 Step 4: Deploy Code Changes

### 4.1 Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "fix: Migration 142 - Event creation & Upstash workflow infrastructure"

# Push to deploy
git push origin main
```

### 4.2 Verify Deployment

```bash
# Check workflow v2 endpoint
curl https://your-domain.com/api/workflows/v2/execute

# Expected response:
# {"status":"active","service":"upstash-workflow-v2",...}
```

---

## 🔧 Step 5: Setup QStash Schedules

### 5.1 Call Setup API

```bash
# Get admin JWT token first (login as admin)
ADMIN_TOKEN="your_admin_jwt_token"

# Setup default schedules
curl -X POST https://your-domain.com/api/admin/workflows/setup \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"setup_defaults":true}'
```

### 5.2 Verify Schedules

```bash
# List schedules
curl https://your-domain.com/api/admin/workflows/setup \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🧹 Step 6: Cleanup (After 48h Verification)

After verifying everything works for 48 hours, clean up old n8n tables:

```sql
-- Drop old n8n tables (ONLY after 48h verification)
DROP TABLE IF EXISTS public.n8n_resolutions CASCADE;
DROP TABLE IF EXISTS public.n8n_executions CASCADE;
DROP TABLE IF EXISTS public.n8n_workflow_logs CASCADE;
```

---

## ✅ Post-Deployment Verification

### Test Event Creation

1. Go to admin panel → Events → Create
2. Create a test event with:
   - Title: "Test Event After Migration 142"
   - Question: "Will this test pass?"
   - Category: "Test"
3. Verify:
   - Event is created
   - Market is auto-created
   - `upstash_workflow_runs` has a record with `workflow_type='event_creation'`

### Test Workflow Execution

```sql
-- Check recent workflow runs
SELECT workflow_type, status, created_at 
FROM upstash_workflow_runs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Health Check

```sql
-- Run health check
SELECT * FROM workflow_health_check();
```

---

## 🐛 Troubleshooting

### Issue: "title column does not exist"
**Solution:** Migration 142a was not applied. Apply it first.

### Issue: "upstash_workflow_runs does not exist"
**Solution:** Migration 142b was not applied. Apply it after 142a.

### Issue: "QSTASH_TOKEN not configured"
**Solution:** Add QSTASH_TOKEN to Vercel environment variables.

### Issue: "record_workflow_start function does not exist"
**Solution:** Migration 142b was not fully applied. Re-run the SQL.

---

## 📞 Support

If issues persist after following this guide:
1. Check Supabase Logs for SQL errors
2. Check Vercel Function Logs for API errors
3. Run `SELECT * FROM workflow_health_check()` for status
4. Check DLQ: `SELECT * FROM dlq_pending_issues`
