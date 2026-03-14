# Workflow Cron Management - Implementation Plan

## Executive Summary

This plan addresses the high Vercel CPU usage caused by frequent automated workflow executions. The solution involves creating a database-backed workflow schedule management system with a full admin control panel.

---

## Current System Analysis

### Existing Components

| Component | Location | Status |
|-----------|----------|--------|
| Workflow API | [`apps/web/src/app/api/workflows/management.ts`](apps/web/src/app/api/workflows/management.ts) | ✅ Active |
| Admin Trigger API | [`apps/web/src/app/api/admin/workflows/trigger/route.ts`](apps/web/src/app/api/admin/workflows/trigger/route.ts) | ✅ Active |
| Setup API | [`apps/web/src/app/api/admin/workflows/setup/route.ts`](apps/web/src/app/api/admin/workflows/setup/route.ts) | ✅ Active |
| WorkflowManager Component | [`apps/web/src/components/admin/WorkflowManager.tsx`](apps/web/src/components/admin/WorkflowManager.tsx) | ✅ Active |
| QStashWorkflowManager | [`apps/web/src/components/admin/QStashWorkflowManager.tsx`](apps/web/src/components/admin/QStashWorkflowManager.tsx) | ✅ Active |
| Admin Workflows Page | [`apps/web/src/app/sys-cmd-7x9k2/workflows/page.tsx`](apps/web/src/app/sys-cmd-7x9k2/workflows/page.tsx) | ✅ Active |

### Current Cron Schedules (PROBLEM)

```json
[
  { "name": "Hourly Price Snapshot", "cron": "0 * * * *", "endpoint": "/api/upstash-workflow/price-snapshot" },
  { "name": "Market Close Check", "cron": "*/15 * * * *", "endpoint": "/api/upstash-workflow/market-close-check" },
  { "name": "Combined Market Data", "cron": "*/5 * * * *", "endpoint": "/api/workflows/combined-market-data" },
  { "name": "Combined Analytics", "cron": "0 * * * *", "endpoint": "/api/workflows/combined-analytics" },
  { "name": "Combined Daily Operations", "cron": "0 0 * * *", "endpoint": "/api/workflows/combined-daily-ops" },
  { "name": "Check Escalations", "cron": "*/5 * * * *", "endpoint": "/api/workflows/check-escalations" }
]
```

**Issues Identified:**
1. `*/5 * * * *` (every 5 minutes) - Too frequent, causes high CPU
2. AI Topics workflow (`combined-daily-ops`) is failing
3. No admin control to change schedules
4. No database persistence for schedule configurations

---

## Implementation Plan

### Phase 1: Database Migrations

#### Migration 1: Workflow Schedule Configuration Table

Create `supabase/migrations/202603150000_workflow_schedules_config.sql`:

```sql
-- Table: workflow_schedule_configs
-- Stores configurable schedule settings for each workflow
CREATE TABLE IF NOT EXISTS public.workflow_schedule_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key VARCHAR(100) NOT NULL UNIQUE,
    workflow_name VARCHAR(255) NOT NULL,
    description TEXT,
    endpoint_url VARCHAR(500) NOT NULL,
    cron_expression VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_enabled BOOLEAN DEFAULT true,
    is_auto_run BOOLEAN DEFAULT false,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_workflow_schedule_configs_key ON public.workflow_schedule_configs(workflow_key);
CREATE INDEX idx_workflow_schedule_configs_enabled ON public.workflow_schedule_configs(is_enabled, is_auto_run);
CREATE INDEX idx_workflow_schedule_configs_next_run ON public.workflow_schedule_configs(next_run_at) WHERE is_enabled = true;

-- RLS
ALTER TABLE public.workflow_schedule_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflow schedule configs"
  ON public.workflow_schedule_configs FOR ALL
  TO service_role
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

#### Migration 2: Workflow Execution Logging Enhancement

Create `supabase/migrations/202603150001_workflow_execution_logs_enhanced.sql`:

```sql
-- Add execution tracking columns
ALTER TABLE public.workflow_executions
ADD COLUMN IF NOT EXISTS trigger_source VARCHAR(20) DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS trigger_admin_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cpu_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS memory_used_mb INTEGER;

-- Create table for tracking each workflow's individual runs
CREATE TABLE IF NOT EXISTS public.workflow_run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_key VARCHAR(100) NOT NULL,
    execution_id UUID REFERENCES public.workflow_executions(id),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'running',
    error_message TEXT,
    cpu_time_ms INTEGER,
    rows_processed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflow_run_logs_workflow ON public.workflow_run_logs(workflow_key, created_at DESC);
CREATE INDEX idx_workflow_run_logs_status ON public.workflow_run_logs(status, created_at DESC);
```

---

### Phase 2: API Endpoints

#### New Endpoint: `/api/admin/workflows/schedules`

Create [`apps/web/src/app/api/admin/workflows/schedules/route.ts`](apps/web/src/app/api/admin/workflows/schedules/route.ts):

```typescript
// GET - List all workflow schedule configs
// POST - Create/update workflow schedule config
// PUT - Toggle auto-run, update cron
// DELETE - Remove schedule config
```

**Features:**
- List all configurable workflows with current settings
- Update cron expression for each workflow
- Enable/disable auto-run for each workflow
- View last run status and errors

#### New Endpoint: `/api/admin/workflows/schedules/[key]/run`

Create [`apps/web/src/app/api/admin/workflows/schedules/[key]/run/route.ts`](apps/web/src/app/api/admin/workflows/schedules/[key]/run/route.ts):

```typescript
// POST - Manually trigger a specific workflow
// Records admin_id, timestamp, source as 'manual'
```

#### Enhanced Endpoint: `/api/admin/workflows/trigger`

Update existing [`trigger/route.ts`](apps/web/src/app/api/admin/workflows/trigger/route.ts) to:
- Log execution with trigger source
- Track execution time and status
- Update `workflow_run_logs` table

---

### Phase 3: Admin UI Components

#### 3.1 Enhanced WorkflowManager Component

Update [`apps/web/src/components/admin/WorkflowManager.tsx`](apps/web/src/components/admin/WorkflowManager.tsx):

**New Features:**
- Display all workflows with their current schedule settings
- Edit cron expression dropdown/input
- Toggle auto-run switch
- Manual run button
- Last run status and error display

#### 3.2 New WorkflowScheduleEditor Component

Create [`apps/web/src/components/admin/WorkflowScheduleEditor.tsx`](apps/web/src/components/admin/WorkflowScheduleEditor.tsx):

```typescript
interface WorkflowScheduleConfig {
  workflow_key: string;
  workflow_name: string;
  description: string;
  endpoint_url: string;
  cron_expression: string;
  timezone: string;
  is_enabled: boolean;
  is_auto_run: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  failure_count: number;
  last_error: string | null;
}
```

**UI Elements:**
- Cron expression builder (preset options + custom)
- Timezone selector
- Enable/Disable toggle
- Auto-run toggle
- Manual trigger button with loading state
- Execution history accordion

#### 3.3 New CronPresetSelector Component

Create [`apps/web/src/components/admin/CronPresetSelector.tsx`](apps/web/src/components/admin/CronPresetSelector.tsx):

```typescript
const CRON_PRESETS = [
  { label: 'Every 5 minutes', value: '*/5 * * * *', cpu: 'HIGH' },
  { label: 'Every 15 minutes', value: '*/15 * * * *', cpu: 'MEDIUM' },
  { label: 'Every 30 minutes', value: '*/30 * * * *', cpu: 'LOW' },
  { label: 'Every hour', value: '0 * * * *', cpu: 'LOW' },
  { label: 'Every 6 hours', value: '0 */6 * * *', cpu: 'MINIMAL' },
  { label: 'Once daily (midnight)', value: '0 0 * * *', cpu: 'MINIMAL' },
  { label: 'Once daily (9 AM Dhaka)', value: '0 9 * * *', timezone: 'Asia/Dhaka', cpu: 'MINIMAL' },
  { label: 'Disabled', value: null, cpu: 'NONE' },
];
```

---

### Phase 4: Recommended Cron Schedules

#### CPU Usage Reduction Strategy

| Workflow | Current | Recommended | CPU Reduction |
|----------|---------|-------------|---------------|
| Combined Market Data | `*/5 * * * *` | `*/30 * * * *` | 83% |
| Check Escalations | `*/5 * * * *` | `*/30 * * * *` | 83% |
| Market Close Check | `*/15 * * * *` | `*/30 * * * *` | 50% |
| Hourly Price Snapshot | `0 * * * *` | `0 */2 * * *` | 50% |
| Combined Analytics | `0 * * * *` | Keep as is | 0% |
| Combined Daily Ops | `0 0 * * *` | Keep as is | 0% |

#### Workflow Categories

**High-Frequency (Every 30 min):**
- Combined Market Data (crypto + sports)
- Check Escalations (support)

**Medium-Frequency (Every 2 hours):**
- Price Snapshot

**Low-Frequency (Daily):**
- Combined Analytics
- Combined Daily Operations

**Manual-Only (Disabled):**
- AI Topics (failing - requires investigation)

---

### Phase 5: Implementation Steps

#### Step 1: Database Migrations
```
[ ] Create workflow_schedule_configs migration
[ ] Create workflow_run_logs migration
[ ] Run migrations on production database
[ ] Verify tables created with proper indexes
```

#### Step 2: API Development
```
[ ] Create /api/admin/workflows/schedules route
[ ] Create /api/admin/workflows/schedules/[key]/run route
[ ] Update trigger route to log executions
[ ] Add authentication checks
[ ] Test all endpoints
```

#### Step 3: Admin UI Development
```
[ ] Create CronPresetSelector component
[ ] Create WorkflowScheduleEditor component
[ ] Update WorkflowManager component
[ ] Add loading states and error handling
[ ] Test UI interactions
```

#### Step 4: Configuration & Testing
```
[ ] Seed default workflow configurations
[ ] Test manual workflow triggers
[ ] Verify schedule updates work
[ ] Monitor CPU usage after changes
```

#### Step 5: Cleanup
```
[ ] Remove failed QStash schedules
[ ] Document new workflow configuration
[ ] Train admin team on new interface
```

---

## Technical Architecture

### System Flow Diagram

```mermaid
graph TD
    A[Admin Panel] -->|1. View/Edit Schedules| B[workflow_schedule_configs DB]
    A -->|2. Manual Trigger| C[API: /schedules/[key]/run]
    C -->|3. Execute Workflow| D[Workflow Endpoint]
    D -->|4. Log Result| E[workflow_run_logs]
    D -->|5. Update Status| B
    F[QStash Cron] -->|Scheduled Trigger| D
    E -->|6. Analytics| G[Admin Dashboard]
```

### Data Flow

1. **Schedule Configuration Flow:**
   - Admin edits schedule → API validates → DB updates → Response to UI

2. **Manual Trigger Flow:**
   - Admin clicks "Run" → API creates execution log → Calls endpoint → Updates log with result

3. **Scheduled Execution Flow:**
   - QStash triggers at cron time → Endpoint executes → Logs to execution table → Updates schedule config

---

## Key Files to Modify

| File | Action |
|------|--------|
| `supabase/migrations/202603150000_workflow_schedules_config.sql` | Create |
| `supabase/migrations/202603150001_workflow_execution_logs_enhanced.sql` | Create |
| `apps/web/src/app/api/admin/workflows/schedules/route.ts` | Create |
| `apps/web/src/app/api/admin/workflows/schedules/[key]/run/route.ts` | Create |
| `apps/web/src/app/api/admin/workflows/trigger/route.ts` | Update |
| `apps/web/src/components/admin/WorkflowScheduleEditor.tsx` | Create |
| `apps/web/src/components/admin/CronPresetSelector.tsx` | Create |
| `apps/web/src/components/admin/WorkflowManager.tsx` | Update |
| `apps/web/src/app/sys-cmd-7x9k2/workflows/page.tsx` | Update |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| QStash API calls/month | ~17,000 | ~3,000 |
| Vercel CPU usage (workflows) | High | Low |
| Failed workflow rate | ~10% | <1% |
| Admin schedule changes | N/A | Real-time |

---

## Appendix: QStash Schedule Limits

**Note:** QStash has a limit of 10 schedules on the free tier. Current status shows:
- 4 schedules created successfully
- 2 schedules failed (quota exceeded)

**Recommendation:** Consolidate workflows to stay within limits and use the database-backed schedule config for finer control.

---

## Appendix: Workflow Definitions

```typescript
interface WorkflowDefinition {
  key: string;
  name: string;
  description: string;
  endpoint: string;
  defaultCron: string;
  category: 'market_data' | 'analytics' | 'operations' | 'admin';
}
```

Default workflows to configure:
1. `combined-market-data` - Crypto + Sports data fetch
2. `check-escalations` - Support escalation check
3. `market-close-check` - Market closure monitoring
4. `price-snapshot` - Hourly price recording
5. `combined-analytics` - Analytics + tick adjustment
6. `combined-daily-ops` - Daily leaderboard + AI topics + cleanup

---

*Plan created: 2026-03-14*
*Last updated: 2026-03-14*
