# Cron-job.org Migration Plan: QStash & Vercel to External Cron

## Overview

This document outlines the step-by-step migration from QStash and Vercel Cron to **cron-job.org** for all workflow automation. The goal is to have **separate cron jobs for each task** rather than merged/grouped workflows, providing better scalability and bypassing Vercel's function calling limits.

---

## Why Migrate to cron-job.org?

| Feature | Vercel Cron | QStash Free | cron-job.org |
|---------|-------------|-------------|--------------|
| **Free Tier Jobs** | 1 per day (Hobby) | 10 schedules | Unlimited |
| **Frequency Limits** | Daily max | 10 schedules | Every minute |
| **Function Call Limits** | Yes (bypass desired) | Yes | No |
| **Separate Jobs** | No (merged) | Limited | Yes (each task separate) |
| **Reliability** | Good | High | Good |
| **API Access** | No | Yes | Yes (REST API) |

---

## Current Workflow Inventory

### Phase 1: High-Frequency Jobs (Every 5 Minutes)

| # | Workflow Name | Endpoint | Method | Dependencies |
|---|---------------|----------|--------|--------------|
| 1.1 | Crypto Market Data | `/api/workflows/execute-crypto` | POST | QStash signature or CRON_SECRET |
| 1.2 | USDT Exchange Rate | `/api/workflows/update-exchange-rate` | POST | QStash signature |
| 1.3 | Support Escalations | `/api/workflows/check-escalations` | POST | QStash signature |
| 1.4 | Market Close Check | `/api/workflows/market-close-check` | POST | QStash signature |
| 1.5 | Batch Markets Processing | `/api/cron/batch-markets` | GET | CRON_SECRET |

### Phase 2: Medium-Frequency Jobs (Every 10 Minutes)

| # | Workflow Name | Endpoint | Method | Dependencies |
|---|---------------|----------|--------|--------------|
| 2.1 | Sports Market Data | `/api/workflows/execute-sports` | POST | QStash signature |
| 2.2 | Auto-Verification | `/api/workflows/auto-verify` | POST | QStash signature |

### Phase 3: Hourly Jobs

| # | Workflow Name | Endpoint | Method | Dependencies |
|---|---------------|----------|--------|--------------|
| 3.1 | Daily Analytics | `/api/workflows/analytics/daily` | POST | QStash signature |
| 3.2 | Tick Adjustment | `/api/cron/tick-adjustment` | GET | CRON_SECRET |
| 3.3 | Price Snapshot | `/api/workflows/price-snapshot` | POST | QStash signature |

### Phase 4: Daily Jobs (Midnight Bangladesh Time = 18:00 UTC)

| # | Workflow Name | Endpoint | Method | Dependencies |
|---|---------------|----------|--------|--------------|
| 4.1 | News Market Fetch | `/api/workflows/execute-news` | POST | QStash signature |
| 4.2 | Leaderboard Refresh | `/api/leaderboard/cron` | POST | QStash signature |
| 4.3 | Daily AI Topics | `/api/cron/daily-ai-topics` | POST | CRON_SECRET |
| 4.4 | Cleanup Expired Deposits | `/api/workflows/cleanup-expired` | POST | QStash signature |
| 4.5 | Daily Platform Report | `/api/workflows/daily-report` | POST | QStash signature |
| 4.6 | Phase2 Daily Cleanup | `/api/workflows/cleanup` | POST | QStash signature |

### Phase 5: Less Frequent Jobs

| # | Workflow Name | Endpoint | Frequency | Dependencies |
|---|---------------|----------|-----------|--------------|
| 5.1 | Dispute Workflow | `/api/dispute-workflow` | Every 6 hours | QStash signature |
| 5.2 | Sync Orphaned Events | `/api/cron/sync-orphaned-events` | Every 6 hours | CRON_SECRET |

---

## Migration Steps

### Prerequisites

1. **Create cron-job.org Account**: https://cron-job.org
2. **Get API Base URL**: Your Vercel app URL (e.g., `https://polymarket-bangladesh.vercel.app`)
3. **Prepare CRON_SECRET**: Ensure `MASTER_CRON_SECRET` is set in Vercel environment variables

---

### Step 1: Prepare API Endpoints for cron-job.org

All endpoints need to accept requests from cron-job.org. We need to ensure they either:
- Accept `CRON_SECRET` as header
- Or be updated to accept cron-job.org requests

**Recommended**: Add `x-cron-secret` header support to all cron endpoints.

#### Update middleware/endpoint to accept cron-job.org

For GET endpoints, add `x-cron-secret` header check:
```typescript
// In each cron route, support both auth methods
const cronSecret = request.headers.get('x-cron-secret');
const authHeader = request.headers.get('authorization');

// Accept if CRON_SECRET matches OR if it's a valid cron
if (cronSecret === process.env.CRON_SECRET || cronSecret === process.env.MASTER_CRON_SECRET) {
  // Allow access
}
```

---

### Step 2: Create cron-job.org Jobs (Phase by Phase)

#### Phase 1 - Create 5 High-Frequency Jobs

Go to https://cron-job.org/en/jobs/ and create:

**Job 1.1: Crypto Market Data**
```
Title: Crypto Market Verification (Every 5 min)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/execute-crypto
Method: POST
Schedule: */5 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 1.2: USDT Exchange Rate**
```
Title: USDT Exchange Rate Update (Every 5 min)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/update-exchange-rate
Method: POST
Schedule: */5 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 1.3: Support Escalations**
```
Title: Support Escalation Check (Every 5 min)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/check-escalations
Method: POST
Schedule: */5 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 1.4: Market Close Check**
```
Title: Market Close Check (Every 5 min)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/market-close-check
Method: POST
Schedule: */5 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 1.5: Batch Markets Processing**
```
Title: Batch Markets Processing (Every 15 min)
URL: https://polymarket-bangladesh.vercel.app/api/cron/batch-markets
Method: GET
Schedule: */15 * * * *
Headers:
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

---

#### Phase 2 - Create 2 Medium-Frequency Jobs

**Job 2.1: Sports Market Data**
```
Title: Sports Market Verification (Every 10 min)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/execute-sports
Method: POST
Schedule: */10 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 2.2: Auto-Verification**
```
Title: Auto Verification (Every 10 min)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/auto-verify
Method: POST
Schedule: */10 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

---

#### Phase 3 - Create 3 Hourly Jobs

**Job 3.1: Daily Analytics**
```
Title: Daily Analytics (Hourly)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/analytics/daily
Method: POST
Schedule: 0 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 3.2: Tick Adjustment**
```
Title: Tick Adjustment (Hourly)
URL: https://polymarket-bangladesh.vercel.app/api/cron/tick-adjustment
Method: GET
Schedule: 30 * * * *
Headers:
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 3.3: Price Snapshot**
```
Title: Price Snapshot (Hourly)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/price-snapshot
Method: POST
Schedule: 15 * * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

---

#### Phase 4 - Create 6 Daily Jobs (Midnight Bangladesh Time)

> Bangladesh Time (UTC+6) = UTC 18:00 (previous day)

**Job 4.1: News Market Fetch**
```
Title: News Market Fetch (Daily at midnight BD)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/execute-news
Method: POST
Schedule: 0 0 * * *  (Note: This is UTC midnight, adjust to 18 0 * * * for BD)
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 4.2: Leaderboard Refresh**
```
Title: Leaderboard Refresh (Daily at midnight BD)
URL: https://polymarket-bangladesh.vercel.app/api/leaderboard/cron
Method: POST
Schedule: 0 0 * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 4.3: Daily AI Topics**
```
Title: Daily AI Topics Generation (Daily at midnight BD)
URL: https://polymarket-bangladesh.vercel.app/api/cron/daily-ai-topics
Method: POST
Schedule: 0 0 * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 4.4: Cleanup Expired Deposits**
```
Title: Cleanup Expired Deposits (Daily)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/cleanup-expired
Method: POST
Schedule: 0 0 * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 4.5: Daily Platform Report**
```
Title: Daily Platform Report (Daily at 9 AM BD)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/daily-report
Method: POST
Schedule: 0 9 * * *  (9 AM UTC = 3 PM BD)
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 4.6: Phase2 Daily Cleanup**
```
Title: Phase2 Daily Cleanup (Daily)
URL: https://polymarket-bangladesh.vercel.app/api/workflows/cleanup
Method: POST
Schedule: 0 1 * * *  (1 AM UTC = 7 AM BD)
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

---

#### Phase 5 - Create 2 Less Frequent Jobs

**Job 5.1: Dispute Workflow**
```
Title: Dispute Workflow (Every 6 hours)
URL: https://polymarket-bangladesh.vercel.app/api/dispute-workflow
Method: POST
Schedule: 0 */6 * * *
Headers:
  Content-Type: application/json
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

**Job 5.2: Sync Orphaned Events**
```
Title: Sync Orphaned Events (Every 6 hours)
URL: https://polymarket-bangladesh.vercel.app/api/cron/sync-orphaned-events
Method: GET
Schedule: 30 */6 * * *
Headers:
  X-Cron-Secret: {MASTER_CRON_SECRET}
```

---

### Step 3: Update Vercel Configuration

Remove crons from `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "next build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

### Step 4: Disable QStash Schedules

Go to https://console.upstash.com/qstash/schedules and delete all schedules, OR keep them as backup.

### Step 5: Verify & Monitor

1. Check cron-job.org dashboard for job execution history
2. Monitor database for `workflow_executions` table entries
3. Check Vercel function logs for any errors
4. Set up alerts in cron-job.org for failed executions

---

## Environment Variables Required

Make sure these are set in Vercel:

```env
# Required for all cron jobs
MASTER_CRON_SECRET=your_secure_random_string

# App URL (for building URLs in workflows)
NEXT_PUBLIC_APP_URL=https://polymarket-bangladesh.vercel.app

# Optional: Keep for manual triggers
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
```

---

## Rollback Plan

If issues arise:

1. **Quick Rollback**: Re-enable QStash schedules from console
2. **Restore Vercel Cron**: Add back to `vercel.json` and redeploy
3. **Manual Triggers**: Use `/api/admin/workflows/trigger` for testing

---

## Summary

| Phase | Jobs | Frequency | Total Jobs |
|-------|------|-----------|------------|
| Phase 1 | 5 | Every 5 min | 5 |
| Phase 2 | 2 | Every 10 min | 2 |
| Phase 3 | 3 | Hourly | 3 |
| Phase 4 | 6 | Daily | 6 |
| Phase 5 | 2 | Every 6 hours | 2 |
| **Total** | **18** | - | **18** |

All 18 workflows become **separate, independent cron jobs** in cron-job.org, providing:
- ✅ Better scalability (no Vercel function limits)
- ✅ More frequent updates (down from 10 QStash limit)
- ✅ Individual job monitoring and control
- ✅ Free tier (unlimited jobs)
- ✅ No dependency on QStash limits
