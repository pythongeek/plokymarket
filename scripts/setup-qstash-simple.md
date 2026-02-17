# Upstash QStash Setup - Simple Method

## Option 1: Using Upstash CLI (Recommended)

### Step 1: Install Upstash CLI
```bash
npm install -g upstash
```

### Step 2: Login with your credentials
```bash
upstash login
# Enter your email/password when prompted
# Or use: upstash login --email "your-email" --password "your-password"
```

### Step 3: Create the schedule
```bash
upstash qstash schedule create \
  --destination "https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets" \
  --cron "0,15,30,45 * * * *" \
  --method GET \
  --retries 3
```

---

## Option 2: Using cURL with Proper Token

### Step 1: Get QStash Token from Console
1. Go to: https://console.upstash.com/qstash
2. Click on **"Keys"** tab
3. Copy the **QSTASH_TOKEN** (NOT the UserID/Password)

### Step 2: Create Schedule via API
```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets",
    "cron": "0,15,30,45 * * * *",
    "method": "GET",
    "retries": 3
  }'
```

---

## Option 3: Manual Dashboard Setup (Easiest)

1. **Open Upstash Console**: https://console.upstash.com/qstash/schedules

2. **Click "Create Schedule"**

3. **Fill in the form**:
   | Field | Value |
   |-------|-------|
   | **Destination URL** | `https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets` |
   | **Method** | `GET` |
   | **Cron Expression** | `0,15,30,45 * * * *` (Every 15 minutes) |
   | **Retries** | `3` |

4. **Click "Create"**

---

## Verify Setup

After creating the schedule, you can verify it:

```bash
# List all schedules
curl https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN"
```

Or check the dashboard: https://console.upstash.com/qstash/schedules

---

## Important Note

The token you provided (`eyJVc2VySUQiOiIyN2ZiNDY4Yi01ZWYxLTQzNGUtYmUyMi1hNmJlNDgwOWZmNDkiLCJQYXNzd29yZCI6ImRkMzVjYjc5NDg1ODQ2NTM4ZGZiZDViZTg3OGNmOGUwIn0=`) is a **UserID/Password credential** for Upstash Redis, NOT a QStash token.

**You need to get the QStash token separately from the Upstash Console.**
