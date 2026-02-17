# QStash Setup - Final Solutions

## Problem
Your Upstash console doesn't have a "Keys" tab, and the API login doesn't work with your credentials.

## Solution 1: Manual Dashboard Setup (Recommended)

### Step 1: Open QStash Schedules
Go directly to: **https://console.upstash.com/qstash/schedules**

### Step 2: Create Schedule
Look for one of these buttons:
- **"Create Schedule"**
- **"+ New Schedule"**
- **"Add Schedule"**
- **"New"** button

### Step 3: Fill Form
| Field | Value |
|-------|-------|
| **Destination URL** | `https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets` |
| **HTTP Method** | `GET` |
| **Schedule Type** | `Cron` |
| **Cron Expression** | `0,15,30,45 * * * *` |
| **Retry Count** | `3` |

### Step 4: Save
Click **"Create"** or **"Save"**

---

## Solution 2: Use Vercel Cron (Simpler)

Since QStash setup is difficult, use Vercel's built-in cron:

### Step 1: Update vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/batch-markets",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### Step 2: Deploy
```bash
cd apps/web
npx vercel --prod
```

**Note**: Vercel Hobby plan only allows **daily** cron jobs (not every 15 minutes).

---

## Solution 3: Use External Cron Service

### Option A: Cron-job.org (Free)
1. Go to: https://cron-job.org
2. Create account
3. Add new cron job:
   - **URL**: `https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets`
   - **Schedule**: Every 15 minutes
   - **Method**: GET

### Option B: UptimeRobot (Free)
1. Go to: https://uptimerobot.com
2. Add monitor:
   - **Type**: HTTP(s)
   - **URL**: Your endpoint
   - **Interval**: Every 5 minutes (free plan)

---

## Solution 4: Trigger Workflow Manually (For Testing)

You can manually trigger the workflow via browser or curl:

### Browser:
```
https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets
```

### cURL:
```bash
curl https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets
```

---

## What I Recommend

**For now**: Use **Solution 2 (Vercel Cron)** with daily schedule, then upgrade to Pro plan later for more frequent runs.

**Or**: Use **Solution 3 (Cron-job.org)** for free 15-minute intervals.

**Which solution would you like to try?**
