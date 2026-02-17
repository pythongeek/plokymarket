# Upstash Workflow AI Oracle Guide

## ওভারভিউ

Upstash Workflow ব্যবহার করে দীর্ঘ সময় ধরে চলা AI Oracle প্রসেসিং - Vercel-এর ১০ সেকেন্ড টাইমআউট লিমিট কাটিয়ে।

## আর্কিটেকচার

```
┌─────────────────────────────────────────────────────────────────┐
│                     Upstash QStash (Cron)                        │
│                    Triggers every 5 minutes                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Vercel Edge /api/cron/batch-markets                 │
│              (Quick: Finds 5 markets, triggers workflow)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Upstash Workflow /api/upstash-workflow              │
│              (Long-running: AI processing steps)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 1. Fetch    │  │ 2. Scrape   │  │ 3. AI       │             │
│  │    Sources  │  │    News     │  │    Analysis │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                         │                       │
│                                         ▼                       │
│                              ┌─────────────────────┐            │
│                              │ 4. Resolve Market   │            │
│                              │    or Manual Review │            │
│                              └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase PostgreSQL                          │
│              (Market resolution & settlement)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ১. Workflow Steps

### Step 1: Fetch Sources (fetch-sources)
- Supabase থেকে active news sources আনে
- Trust score অনুযায়ী সাজায়
- Max 10 sources

### Step 2: Scrape News (scrape-news)
- প্রতিটি source থেকে content fetch করে
- HTML clean করে (scripts, styles remove)
- Text content limit: 5000 chars per source
- Max 5 sources per run (optimization)

### Step 3: AI Analysis (ai-analysis)
- Gemini 1.5 Flash API call
- Context: Combined news content
- Output: JSON with outcome, confidence, reasoning

### Step 4: Resolve Market (resolve-market)
**High Confidence (≥85%):**
- Market status → 'resolved'
- Trigger settlement
- User wallets updated

**Low Confidence (<85%) or Uncertain:**
- Market status → 'in_progress'
- Admin panel এ manual review এ পাঠায়
- Proposed outcome সহ evidence save করে

---

## ২. API Endpoints

### POST /api/upstash-workflow
Main workflow handler

**Request Body:**
```json
{
  "step": "fetch-sources|scrape-news|ai-analysis|resolve-market",
  "data": { ... }
}
```

**Response:**
```json
{
  "step": "...",
  "status": "success",
  "nextStep": "...",
  "...": "..."
}
```

### GET /api/cron/batch-markets
Cron job entry point

**Trigger:** Upstash QStash every 5 minutes

**Logic:**
1. Finds 5 markets ready for resolution
2. Sets Redis lock (30 min)
3. Triggers workflow for each

---

## ৩. Configuration

### Environment Variables (Vercel)

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
N8N_API_KEY=your-secure-api-key

# Upstash Redis
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-upstash-token

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Upstash QStash Schedule Setup

#### Option 1: Using Setup Script (Recommended)

```bash
# Set environment variables
$env:QSTASH_TOKEN="your_qstash_token"
$env:QSTASH_CURRENT_SIGNING_KEY="your_signing_key"
$env:NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Run setup script
node scripts/setup-qstash-schedule.js

# Run ALL QStash schedules (new)
# - idempotent: will replace existing schedules for the same endpoints
# - from the `apps/web` folder you can also use the npm helper
node scripts/setup-all-qstash.js

# npm helper (from `apps/web`)
npm run qstash:setup:all
```

#### Option 2: Manual Setup via Upstash Console

1. Go to: https://console.upstash.com/qstash/schedules
2. Click **Create Schedule**
3. Fill in the form:
   - **Destination URL**: `https://your-app.vercel.app/api/cron/batch-markets`
   - **Method**: `GET`
   - **Cron Expression**: `*/15 * * * *` (Every 15 minutes)
   - **Retries**: `3`
4. Click **Create**

#### Option 3: Using cURL

```bash
curl -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer YOUR_QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "https://your-app.vercel.app/api/cron/batch-markets",
    "cron": "*/15 * * * *",
    "method": "GET",
    "retries": 3
  }'
```

**Schedule Details:**
- **Cron Expression:** `*/15 * * * *` (Every 15 minutes - free tier friendly)
- **Target URL:** `https://your-app.vercel.app/api/cron/batch-markets`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer QSTASH_TOKEN`

---

## ৪. Database Schema

### news_sources Table
```sql
CREATE TABLE news_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) NOT NULL,
    source_url TEXT NOT NULL,
    source_type VARCHAR(50),
    trust_score INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    is_whitelisted BOOLEAN DEFAULT FALSE,
    categories_covered VARCHAR(50)[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sample Data
```sql
INSERT INTO news_sources (source_name, source_url, trust_score, is_whitelisted, categories_covered)
VALUES 
    ('Prothom Alo', 'https://www.prothomalo.com', 85, true, ARRAY['Politics', 'Sports']),
    ('The Daily Star', 'https://www.thedailystar.net', 80, true, ARRAY['Economics', 'World']),
    ('BDNews24', 'https://bdnews24.com', 75, true, ARRAY['Politics', 'Technology']);
```

---

## ৫. Manual Review System

### Low Confidence Flow

```
AI Analysis → Confidence < 85% → Manual Review Queue → Admin Approval → Settlement
```

### Admin Panel
**URL:** `/sys-cmd-7x9k2/resolutions`

**Features:**
- "Proposed" ট্যাবে AI suggestions দেখা যায়
- Confidence score সহ display
- Approve/Reject বাটন
- Manual reasoning input

---

## ৬. Optimization Tips

### 1. Payload Size
- News content limit: 5000 chars per source
- Total context: 10000 chars max
- Reduces API cost & processing time

### 2. Batch Processing
- 5 markets per cron run
- 30 min Redis lock per market
- Prevents duplicate processing

### 3. Error Handling
- Failed sources skip করে
- AI parse error handle করে
- Manual review এ পাঠায়

### 4. Caching
- Top experts: 5 min cache
- Processed markets: 24 hour cache
- News sources: Rarely change

---

## ৭. Free Tier Limits

| Service | Free Limit | Our Usage |
|---------|-----------|-----------|
| Vercel Edge | 1M requests/month | ~300/day |
| Upstash QStash | 100 requests/day | ~288/day |
| Upstash Redis | 10K requests/day | ~500/day |
| Gemini API | 60 requests/min | ~10/min |

**Note:** QStash 100/day limit এ 5 min interval = 288/day exceed করে। 
**Solution:** 15 min interval ব্যবহার করুন (96/day) অথবা paid tier upgrade করুন।

---

## ৮. Testing

### Test Workflow
```bash
curl -X POST https://your-app.vercel.app/api/upstash-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "step": "fetch-sources",
    "data": {
      "marketId": "test-id",
      "marketQuestion": "Will it rain tomorrow?"
    }
  }'
```

### Test Cron
```bash
curl https://your-app.vercel.app/api/cron/batch-markets \
  -H "upstash-signature: test-signature"
```

---

## ৯. Troubleshooting

### "No markets to process"
- Markets এর status 'active' এবং trading_closes_at পাস হয়েছে কিনা চেক করুন

### "Workflow trigger failed"
- N8N_API_KEY সঠিক কিনা চেক করুন
- Vercel logs এ error দেখুন

### "AI parse error"
- Gemini API key valid কিনা চেক করুন
- Response format JSON কিনা verify করুন

### "Duplicate processing"
- Redis lock কাজ করছে কিনা চেক করুন
- KV_REST_API_URL এবং KV_REST_API_TOKEN verify করুন

---

## ১০. Next Steps

1. ✅ Database migration চালান (news_sources table)
2. ✅ Environment variables সেট করুন
3. ✅ Upstash QStash schedule সেটআপ করুন
4. ✅ Deploy করুন
5. ✅ Test করুন
6. ✅ Admin panel থেকে verify করুন
