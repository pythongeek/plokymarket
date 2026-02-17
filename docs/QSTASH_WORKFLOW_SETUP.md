# QStash Workflow Setup Guide

Since the automated script couldn't authenticate with your QStash token, follow these manual steps to create the scheduled workflows.

## Prerequisites

1. Go to https://console.upstash.com/qstash
2. Sign in to your account
3. Copy your QStash Token from the console

## Manual Setup Steps

### Step 1: Open Upstash Console

Navigate to: https://console.upstash.com/qstash/schedules

### Step 2: Create Each Schedule

Click "Create Schedule" and fill in the details for each workflow:

#### 1. Crypto Workflow Verification
```
Name: workflow-verification-crypto
Destination: https://polymarket-bangladesh.vercel.app/api/workflows/execute-crypto
Method: POST
Cron: */5 * * * *
Headers:
  Content-Type: application/json
  X-Workflow-Name: workflow-verification-crypto
```

#### 2. Sports Workflow Verification
```
Name: workflow-verification-sports
Destination: https://polymarket-bangladesh.vercel.app/api/workflows/execute-sports
Method: POST
Cron: */10 * * * *
Headers:
  Content-Type: application/json
  X-Workflow-Name: workflow-verification-sports
```

#### 3. News Workflow Verification
```
Name: workflow-verification-news
Destination: https://polymarket-bangladesh.vercel.app/api/workflows/execute-news
Method: POST
Cron: */15 * * * *
Headers:
  Content-Type: application/json
  X-Workflow-Name: workflow-verification-news
```

#### 4. Escalation Check
```
Name: workflow-escalation-check
Destination: https://polymarket-bangladesh.vercel.app/api/workflows/check-escalations
Method: POST
Cron: */5 * * * *
Headers:
  Content-Type: application/json
  X-Workflow-Name: workflow-escalation-check
```

#### 5. Daily Analytics
```
Name: workflow-analytics-daily
Destination: https://polymarket-bangladesh.vercel.app/api/workflows/analytics/daily
Method: POST
Cron: 0 0 * * *
Headers:
  Content-Type: application/json
  X-Workflow-Name: workflow-analytics-daily
```

### Step 3: Verify Schedules

After creating all 5 schedules, you should see them listed at:
https://console.upstash.com/qstash/schedules

## Alternative: Using curl

If you have your QStash token, you can create schedules using curl:

```bash
# Set your token
export QSTASH_TOKEN="your_actual_token_here"

# 1. Crypto Workflow (every 5 minutes)
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://polymarket-bangladesh.vercel.app/api/workflows/execute-crypto",
    "cron": "*/5 * * * *",
    "headers": {
      "Content-Type": "application/json",
      "X-Workflow-Name": "workflow-verification-crypto"
    }
  }'

# 2. Sports Workflow (every 10 minutes)
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://polymarket-bangladesh.vercel.app/api/workflows/execute-sports",
    "cron": "*/10 * * * *",
    "headers": {
      "Content-Type": "application/json",
      "X-Workflow-Name": "workflow-verification-sports"
    }
  }'

# 3. News Workflow (every 15 minutes)
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://polymarket-bangladesh.vercel.app/api/workflows/execute-news",
    "cron": "*/15 * * * *",
    "headers": {
      "Content-Type": "application/json",
      "X-Workflow-Name": "workflow-verification-news"
    }
  }'

# 4. Escalation Check (every 5 minutes)
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://polymarket-bangladesh.vercel.app/api/workflows/check-escalations",
    "cron": "*/5 * * * *",
    "headers": {
      "Content-Type": "application/json",
      "X-Workflow-Name": "workflow-escalation-check"
    }
  }'

# 5. Daily Analytics (midnight daily)
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://polymarket-bangladesh.vercel.app/api/workflows/analytics/daily",
    "cron": "0 0 * * *",
    "headers": {
      "Content-Type": "application/json",
      "X-Workflow-Name": "workflow-analytics-daily"
    }
  }'
```

## Schedule Summary

| Schedule Name | Endpoint | Frequency | Purpose |
|--------------|----------|-----------|---------|
| workflow-verification-crypto | /api/workflows/execute-crypto | Every 5 min | Verify crypto events |
| workflow-verification-sports | /api/workflows/execute-sports | Every 10 min | Verify sports events |
| workflow-verification-news | /api/workflows/execute-news | Every 15 min | Verify news events |
| workflow-escalation-check | /api/workflows/check-escalations | Every 5 min | Check escalations |
| workflow-analytics-daily | /api/workflows/analytics/daily | Daily at midnight | Generate reports |

## Troubleshooting

### 401 Unauthorized
- Your QStash token is invalid or expired
- Get a new token from https://console.upstash.com/qstash

### 404 Not Found
- The destination URL might be incorrect
- Verify your app is deployed at: https://polymarket-bangladesh.vercel.app

### 400 Bad Request
- Check that the cron expression is valid
- Ensure the destination URL includes https://

## Next Steps

1. Create all 5 schedules in the Upstash Console
2. Wait for the first execution (check the QStash logs)
3. Verify the workflows are running by checking your database for new `workflow_executions` entries
4. Check the admin dashboard at: https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/workflows-advanced

## Monitoring

Monitor your schedules at:
- https://console.upstash.com/qstash/schedules (QStash Console)
- https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/workflows-advanced (Admin Dashboard)

## Support

If you encounter issues:
1. Check QStash documentation: https://docs.upstash.com/qstash
2. Verify your Vercel deployment is working
3. Check the API endpoint logs in Vercel
