# Workflow Consolidation Guide

## Overview

We've consolidated 10 QStash scheduled workflows into **4 core automated workflows** + **8 manual trigger workflows** to optimize the free tier usage while maintaining all functionality.

## Before vs After

### Before (10 Scheduled Workflows)
| # | Workflow | Frequency | Status |
|---|----------|-----------|--------|
| 1 | leaderboard/cron | Daily midnight | Keep (consolidated) |
| 2 | execute-crypto | Every 5 min | Consolidated |
| 3 | execute-news | Daily 12PM | Manual |
| 4 | analytics/daily | Hourly | Consolidated |
| 5 | tick-adjustment | Hourly | Consolidated |
| 6 | execute-sports | Every 10 min | Consolidated |
| 7 | dispute-workflow | Every 6 hours | Manual |
| 8 | daily-ai-topics | Daily midnight | Consolidated |
| 9 | check-escalations | Every 5 min | Keep (automated) |
| 10 | batch-markets | Every 15 min | Manual |

### After (4 Automated + 8 Manual)

#### Automated Workflows (4)
| # | Workflow | Frequency | Components |
|---|----------|-----------|------------|
| 1 | **Combined Market Data** | Every 5 min | execute-crypto + execute-sports |
| 2 | **Combined Analytics** | Hourly | analytics/daily + tick-adjustment + exchange-rate |
| 3 | **Combined Daily Ops** | Daily midnight | leaderboard + daily-ai-topics + cleanup-expired |
| 4 | **Check Escalations** | Every 5 min | Support escalation checks |

#### Manual Workflows (8)
| # | Workflow | Use Case |
|---|----------|----------|
| 1 | Dispute Workflow | Process pending disputes when needed |
| 2 | News Market Data | Fetch news data on-demand |
| 3 | Batch Markets | Batch process markets manually |
| 4 | Daily Report | Generate reports on-demand |
| 5 | Auto-Verification | Check pending deposits manually |
| 6 | Combined Market Data | Manual override for market data |
| 7 | Combined Analytics | Manual override for analytics |
| 8 | Combined Daily Ops | Manual override for daily ops |

## New API Endpoints

### Consolidated Workflows
```
POST /api/workflows/combined-market-data
POST /api/workflows/combined-analytics
POST /api/workflows/combined-daily-ops
```

### Admin Trigger API
```
GET  /api/admin/workflows/trigger    # List available workflows
POST /api/admin/workflows/trigger    # Trigger specific workflow
```

## Admin Panel

Access the workflow management UI at:
```
/sys-cmd-7x9k2/workflows
```

Features:
- View all 4 automated workflows with their schedules
- Trigger any of the 8 manual workflows with one click
- View execution history and results
- See consolidation information

## Database Tables

### workflow_executions
Tracks all automated workflow executions:
```sql
SELECT * FROM workflow_executions 
ORDER BY created_at DESC 
LIMIT 10;
```

### admin_workflow_triggers
Tracks manual triggers by admins:
```sql
SELECT * FROM admin_workflow_triggers 
ORDER BY created_at DESC 
LIMIT 10;
```

### workflow_execution_summary (View)
Summary statistics:
```sql
SELECT * FROM workflow_execution_summary;
```

## Migration Steps

1. **Apply Database Migration:**
   ```bash
   # Run migration 097_workflow_consolidation.sql
   ```

2. **Delete Old Schedules:**
   ```bash
   # Delete schedules that will be consolidated
   # Keep only: check-escalations
   ```

3. **Create New Consolidated Schedules:**
   ```bash
   cd apps/web
   npm run usdt:schedules
   ```

4. **Verify in Admin Panel:**
   - Go to /sys-cmd-7x9k2/workflows
   - Check all 4 automated workflows are listed
   - Test manual trigger of one workflow

## Benefits

1. **Free Tier Compliance:** Only 4 automated schedules within QStash free tier
2. **Cost Savings:** No need to upgrade for additional schedules
3. **Flexibility:** Manual workflows available when needed
4. **Monitoring:** Full execution tracking and history
5. **Consolidation:** Reduced API calls and better resource utilization

## Troubleshooting

### Workflow not triggering?
- Check QStash console: https://console.upstash.com/qstash/schedules
- Verify endpoint URLs are accessible
- Check workflow_executions table for errors

### Manual trigger failing?
- Verify admin authentication
- Check admin_workflow_triggers table for error details
- Ensure workflow endpoint exists and is working

### Need to add more automated workflows?
- Consider upgrading QStash plan
- Or convert an existing automated workflow to manual
- Or consolidate further if possible

## Future Improvements

1. **Real-time Monitoring:** Add WebSocket notifications for workflow completion
2. **Retry Logic:** Implement exponential backoff for failed workflows
3. **Workflow Chaining:** Allow workflows to trigger other workflows
4. **Conditional Execution:** Run workflows based on business logic conditions
