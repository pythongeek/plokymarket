# Cron Job Configuration for cron-job.org

## Replace QStash with cron-job.org

All cron jobs should be configured in cron-job.org with the following settings:

### Environment Variables Required in Vercel:
```
CRON_SECRET=your-secure-random-secret
MASTER_CRON_SECRET=your-secure-random-secret
```

---

## Job Configurations:

| # | Job Name | URL | Cron Expression | Frequency |
|---|----------|-----|----------------|-----------|
| 1 | Batch Markets | `https://polymarket-bangladesh.vercel.app/api/cron/batch-markets` | `0 23 * * 6` | Weekly (Saturday 11 PM) |
| 2 | Sync Orphaned | `https://polymarket-bangladesh.vercel.app/api/cron/sync-orphaned-events` | `0 18 * * *` | Daily 6 PM |
| 3 | Dispute Workflow | `https://polymarket-bangladesh.vercel.app/api/dispute-workflow` | `0 18 * * *` | Daily 6 PM |
| 4 | Leaderboard | `https://polymarket-bangladesh.vercel.app/api/leaderboard/cron` | `0 18 * * *` | Daily 6 PM |
| 5 | Analytics | `https://polymarket-bangladesh.vercel.app/api/workflows/analytics/daily` | `0 23 * * *` | Daily 11 PM |
| 6 | Auto Verify | `https://polymarket-bangladesh.vercel.app/api/workflows/auto-verify` | `0 23 * * *` | Daily 11 PM |
| 7 | Escalations | `https://polymarket-bangladesh.vercel.app/api/workflows/check-escalations` | `0 23 * * *` | Daily 11 PM |
| 8 | Cleanup Deposits | `https://polymarket-bangladesh.vercel.app/api/workflows/cleanup-expired` | `0 18 * * *` | Daily 6 PM |
| 9 | Daily Report | `https://polymarket-bangladesh.vercel.app/api/workflows/daily-report` | `0 9 * * *` | Daily 9 AM |
| 10 | Crypto Market | `https://polymarket-bangladesh.vercel.app/api/workflows/execute-crypto` | `0 */4 * * *` | Every 4 hours |
| 11 | News Market | `https://polymarket-bangladesh.vercel.app/api/workflows/execute-news` | `0 */6 * * *` | Every 6 hours |
| 12 | Sports | `https://polymarket-bangladesh.vercel.app/api/workflows/execute-sports` | `0 */4 * * *` | Every 4 hours |
| 13 | Market Close | `https://polymarket-bangladesh.vercel.app/api/workflows/market-close-check` | `0 */2 * * *` | Every 2 hours |
| 14 | Price Snapshot | `https://polymarket-bangladesh.vercel.app/api/workflows/price-snapshot` | `0 * * * *` | Every hour |
| 15 | Exchange Rate | `https://polymarket-bangladesh.vercel.app/api/workflows/update-exchange-rate` | `0 */2 * * *` | Every 2 hours |
| 16 | AI Topics | `https://polymarket-bangladesh.vercel.app/api/cron/daily-ai-topics` | `0 6 * * *` | Daily 6 AM |

---

## cron-job.org Setup:

### URL:
https://cron-job.org/en/

### Create Job Settings:
1. **Title**: Plokymarket - [Job Name]
2. **URL**: See table above
3. **Schedule**: Select appropriate cron expression
4. **Execution**: HTTP (GET or POST)
5. **Authentication**: 
   - Header: `Authorization`
   - Value: `Bearer YOUR_CRON_SECRET`

---

## Cron Expression Reference:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
```

### Common Expressions:
- `0 * * * *` = Every hour at minute 0
- `0 */2 * * *` = Every 2 hours
- `0 */4 * * *` = Every 4 hours
- `0 */6 * * *` = Every 6 hours
- `0 0 * * *` = Daily at midnight
- `0 6 * * *` = Daily at 6 AM
- `0 9 * * *` = Daily at 9 AM
- `0 18 * * *` = Daily at 6 PM
- `0 23 * * *` = Daily at 11 PM
- `0 23 * * 6` = Weekly on Saturday at 11 PM
