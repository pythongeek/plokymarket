# Get QStash Token - Alternative Methods

## Method 1: Upstash Dashboard (Current UI)

Since there's no "Keys" tab, try these locations:

### Option A: Look for "QStash" in Left Sidebar
1. Go to https://console.upstash.com
2. Check left sidebar for **"QStash"** menu item
3. Click on it
4. Look for **"Settings"** or **"API Keys"** tab

### Option B: Team Settings
1. Click on your **Profile/Team** name (top right)
2. Go to **"Settings"** or **"API Keys"**
3. Look for QStash section

### Option C: Project Settings
1. Select your project
2. Click **"Settings"** tab
3. Look for **"QStash Keys"** or **"Integrations"**

---

## Method 2: Using Upstash CLI (Most Reliable)

### Step 1: Install CLI
```bash
npm install -g upstash
```

### Step 2: Login
```bash
upstash login
# Enter your email and password
```

### Step 3: Get QStash Token
```bash
# List your QStash keys
upstash qstash keys list

# Or get specific token
upstash qstash keys get
```

---

## Method 3: Direct API with Your Credentials

Since you have UserID/Password, you can get the token via API:

```bash
# Login to get access token
curl -X POST https://api.upstash.com/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "27fb468b-5ef1-434e-be22-a6be4809ff49",
    "password": "dd35cb79485846538dfbd5be878cf8e0"
  }'

# This returns an access token, then use it to get QStash keys:
curl https://api.upstash.com/v2/qstash/keys \
  -H "Authorization: Bearer ACCESS_TOKEN_FROM_ABOVE"
```

---

## Method 4: Manual Schedule Creation (Easiest)

If you can't find the token, create the schedule manually:

1. Go to: https://console.upstash.com/qstash/schedules
2. Click **"Create Schedule"** or **"+"** button
3. Fill the form:

| Field | Value |
|-------|-------|
| **Name** | `batch-markets-cron` |
| **Destination** | `https://polymarket-bangladesh-lfuzx7p1n-bdowneer191s-projects.vercel.app/api/cron/batch-markets` |
| **Method** | `GET` |
| **Schedule** | `Every 15 minutes` or Cron: `0,15,30,45 * * * *` |
| **Retry** | `3 times` |

4. Click **"Create"** or **"Save"**

---

## Method 5: Use Vercel Cron Instead (Free Alternative)

Since QStash setup is complex, use Vercel's built-in cron (limited to daily on Hobby plan):

### Update vercel.json:
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

This runs once daily at 6 AM.

---

## What to Look For in Dashboard

The QStash token usually looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(NOT like your current token which is base64 UserID:Password)

**Can you share a screenshot of what you see in the Upstash dashboard? Or tell me what menu items are available in the left sidebar?** This will help me guide you to the right location.
