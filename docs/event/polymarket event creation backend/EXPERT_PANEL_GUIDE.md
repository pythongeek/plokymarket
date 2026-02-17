# Expert Panel System - Complete Implementation Guide

## ওভারভিউ

Vercel Free Tier, Supabase, Upstash, এবং Local Docker n8n ব্যবহার করে Weighted Reputation System সহ Expert Panel Management।

## আর্কিটেকচার

```
┌─────────────────────────────────────────────────────────────────┐
│                     Vercel Edge (Free Tier)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ /api/experts│  │ /api/resolve│  │ /api/verify-deployment  │ │
│  │ (Cached)    │  │ (Settlement)│  │ (AI QA)                 │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (PostgreSQL)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ expert_panel │  │ expert_votes │  │ get_weighted_expert_ │  │
│  │ (Reputation) │  │ (AI Verified)│  │ consensus()          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Upstash Redis (Free Tier)                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Cache: experts:top_10 (TTL: 5 min)                        │ │
│  │  Cache: processed:event_id (TTL: 24 hr)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Local Docker n8n                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Expert Verification  │  │ Market Resolution                │ │
│  │ (Gemini AI)          │  │ (AI Oracle)                      │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## ১. Reputation System (Weighted)

### গাণিতিক সূত্র

```
Reputation (R) = (Correct Votes / Total Votes) × ln(Total Votes + 1)
```

**Rank Tiers:**
| Reputation | Tier |
|------------|------|
| >= 4.0 | Diamond |
| >= 3.0 | Platinum |
| >= 2.0 | Gold |
| >= 1.0 | Silver |
| < 1.0 | Bronze |

### Database Functions

```sql
-- Calculate reputation
SELECT calculate_reputation_score(correct_votes, total_votes);

-- Get weighted consensus for an event
SELECT * FROM get_weighted_expert_consensus('event-uuid');
```

---

## ২. File Structure

```
supabase/migrations/
├── 088_expert_panel_system.sql    # Expert panel tables & functions

apps/web/src/
├── app/api/
│   ├── experts/route.ts           # GET /api/experts (cached)
│   ├── resolve/route.ts           # POST /api/resolve (settlement)
│   └── verify-deployment/route.ts # POST /api/verify-deployment (AI QA)
│
├── components/admin/
│   └── ExpertPanel.tsx            # Admin UI for expert management
│
└── app/sys-cmd-7x9k2/experts/
    └── page.tsx                   # Admin page

docs/event/polymarket event creation backend/n8n/
├── expert_verification_workflow.json  # n8n AI verification
└── market_resolution_workflow.json    # n8n market resolution
```

---

## ৩. Setup Instructions

### Step 1: Database Migration

```sql
-- Supabase SQL Editor এ চালান
\i supabase/migrations/088_expert_panel_system.sql
```

### Step 2: Environment Variables

**Vercel (.env.local):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your-upstash-token

# Authentication
N8N_API_KEY=your-secure-random-key
GEMINI_API_KEY=your-gemini-api-key
```

**n8n (Environment Variables):**
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
SUPABASE_DB_URL=postgresql://user:pass@host:5432/db
GEMINI_API_KEY=your-gemini-api-key
```

### Step 3: Deploy

```bash
cd apps/web
npx vercel --prod
```

### Step 4: n8n Workflow Import

1. n8n Dashboard → Import from File
2. `expert_verification_workflow.json` import করুন
3. Credentials সেটআপ করুন (Gemini API, Supabase DB)

---

## ৪. API Endpoints

### GET /api/experts
Top 10 experts (Redis cached)

**Response:**
```json
{
  "experts": [...],
  "cached": true,
  "executionTimeMs": 45
}
```

### POST /api/experts
Get weighted consensus for event

**Body:**
```json
{ "eventId": "uuid" }
```

**Response:**
```json
{
  "eventId": "uuid",
  "consensus": [
    { "outcome": 1, "total_weight": 15.5, "vote_count": 3, "consensus_percentage": 75.5 }
  ],
  "votes": [...]
}
```

### POST /api/resolve
Resolve market with settlement

**Body:**
```json
{
  "eventId": "uuid",
  "result": "YES",
  "confidence": 0.95
}
```

### POST /api/verify-deployment
AI QA for deployment verification

**Body:**
```json
{ "url": "https://your-app.vercel.app" }
```

---

## ৫. Admin Panel

**URL:** `/sys-cmd-7x9k2/experts`

**Features:**
- Expert list with reputation scores
- Rank tiers (Bronze → Diamond)
- Verify/Unverify experts
- View expert vote history
- Add new experts
- AI verification status

---

## ৬. Free Tier Limits & Optimization

| Service | Free Limit | Our Strategy |
|---------|-----------|--------------|
| Vercel Edge | 1M requests/month | Cache with Redis |
| Vercel Build | 6,000 min/month | Optimize build |
| Supabase | 500MB + 2M requests | SQL functions |
| Upstash | 10,000 req/day | 5min cache TTL |
| n8n (Local) | Unlimited | Docker local |

### Optimization Tips

1. **Redis Caching:** Top experts 5 min cache
2. **Edge Functions:** Lightweight only
3. **SQL Functions:** Heavy logic in database
4. **n8n Local:** AI processing local Docker এ

---

## ৭. Testing

### Test Expert Reputation
```bash
curl https://your-app.vercel.app/api/experts
```

### Test Consensus
```bash
curl -X POST https://your-app.vercel.app/api/experts \
  -H "Content-Type: application/json" \
  -d '{"eventId": "test-uuid"}'
```

### Test Deployment Verification
```bash
curl -X POST https://your-app.vercel.app/api/verify-deployment \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app"}'
```

---

## ৮. Troubleshooting

### Redis Connection Failed
- KV_REST_API_URL এবং KV_REST_API_TOKEN চেক করুন
- Upstash dashboard এ verify করুন

### Expert Votes Not Counting
- Trigger `trigger_update_expert_stats` active কিনা চেক করুন
- `expert_votes` table এ RLS policy verify করুন

### AI Verification Not Working
- n8n workflow active কিনা দেখুন
- Gemini API key valid কিনা চেক করুন
- Webhook URL accessible কিনা test করুন

---

## ৯. Next Steps

1. ✅ Database migration চালান
2. ✅ Environment variables সেট করুন
3. ✅ Vercel এ deploy করুন
4. ✅ n8n workflows import করুন
5. ✅ Admin panel এ experts যোগ করুন
6. ✅ Test করুন
