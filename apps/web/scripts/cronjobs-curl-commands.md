# Cron-job.org Setup Commands (Phase 1 - 5 min jobs)

Run these commands in your terminal to create the Phase 1 cron jobs.

## Set your API token and secret
```bash
export CRONJOB_API_TOKEN="z0PgvEWDmWIDOcfycqGzlQA6nrSbltpogwmgvQfTs3g="
export CRON_SECRET="ploky-daily-ai-secret-2024"
```

## Phase 1: Every 5 Minutes (5 jobs)

### 1. Crypto Market Verification
```bash
curl -X POST https://cron-job.org/api/jobs \
  -H "Authorization: Token $CRONJOB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "url": "https://polymarket-bangladesh.vercel.app/api/workflows/execute-crypto",
      "method": "POST",
      "schedule": {
        "timezone": "UTC",
        "expression": "*/5 * * * *"
      },
      "headers": {
        "Content-Type": "application/json",
        "X-Cron-Secret": "'"$CRON_SECRET"'"
      },
      "title": "Crypto Market Verification (5 min)",
      "is_active": true,
      "save_responses": true
    }
  }'
```

### 2. USDT Exchange Rate Update
```bash
curl -X POST https://cron-job.org/api/jobs \
  -H "Authorization: Token $CRONJOB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "url": "https://polymarket-bangladesh.vercel.app/api/workflows/update-exchange-rate",
      "method": "POST",
      "schedule": {
        "timezone": "UTC",
        "expression": "*/5 * * * *"
      },
      "headers": {
        "Content-Type": "application/json",
        "X-Cron-Secret": "'"$CRON_SECRET"'"
      },
      "title": "USDT Exchange Rate Update (5 min)",
      "is_active": true,
      "save_responses": true
    }
  }'
```

### 3. Support Escalation Check
```bash
curl -X POST https://cron-job.org/api/jobs \
  -H "Authorization: Token $CRONJOB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "url": "https://polymarket-bangladesh.vercel.app/api/workflows/check-escalations",
      "method": "POST",
      "schedule": {
        "timezone": "UTC",
        "expression": "*/5 * * * *"
      },
      "headers": {
        "Content-Type": "application/json",
        "X-Cron-Secret": "'"$CRON_SECRET"'"
      },
      "title": "Support Escalation Check (5 min)",
      "is_active": true,
      "save_responses": true
    }
  }'
```

### 4. Market Close Check
```bash
curl -X POST https://cron-job.org/api/jobs \
  -H "Authorization: Token $CRONJOB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "url": "https://polymarket-bangladesh.vercel.app/api/workflows/market-close-check",
      "method": "POST",
      "schedule": {
        "timezone": "UTC",
        "expression": "*/5 * * * *"
      },
      "headers": {
        "Content-Type": "application/json",
        "X-Cron-Secret": "'"$CRON_SECRET"'"
      },
      "title": "Market Close Check (5 min)",
      "is_active": true,
      "save_responses": true
    }
  }'
```

### 5. Batch Markets Processing (15 min)
```bash
curl -X POST https://cron-job.org/api/jobs \
  -H "Authorization: Token $CRONJOB_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job": {
      "url": "https://polymarket-bangladesh.vercel.app/api/cron/batch-markets",
      "method": "GET",
      "schedule": {
        "timezone": "UTC",
        "expression": "*/15 * * * *"
      },
      "headers": {
        "X-Cron-Secret": "'"$CRON_SECRET"'"
      },
      "title": "Batch Markets Processing (15 min)",
      "is_active": true,
      "save_responses": true
    }
  }'
```
