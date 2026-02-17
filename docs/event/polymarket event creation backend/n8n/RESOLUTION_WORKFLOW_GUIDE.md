# Market Resolution Workflow Setup Guide

## ওভারভিউ

AI-powered market resolution সিস্টেমের জন্য n8n automation ওয়ার্কফ্লো।

**Architecture:**
```
Supabase → n8n Webhook → Upstash Cache → Gemini AI → Vercel /api/resolve → Supabase
```

---

## ফাইলস

1. `market_resolution_workflow.json` - n8n workflow ফাইল
2. `apps/web/src/app/api/resolve/route.ts` - Vercel Edge Function

---

## ধাপ ১: n8n Workflow ইম্পোর্ট

### 1.1 Import করুন

1. n8n Editor এ যান
2. **Add Workflow** → **Import from File**
3. `market_resolution_workflow.json` সিলেক্ট করুন

### 1.2 Credentials সেটআপ

#### Gemini API Key
```
Type: HTTP Query Auth
Name: Gemini API Key
Query Parameter Name: key
Query Parameter Value: YOUR_GEMINI_API_KEY
```

#### Vercel API Key
```
Type: HTTP Header Auth
Name: Vercel API Key
Header Name: x-api-key
Header Value: YOUR_N8N_API_KEY
```

### 1.3 Environment Variables

n8n Settings → Variables:

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your_upstash_token
```

---

## ধাপ ২: Vercel Edge Function

### 2.1 ফাইল কনফার্ম

`apps/web/src/app/api/resolve/route.ts` আছে কিনা চেক করুন।

### 2.2 Environment Variables

Vercel Dashboard এ যোগ করুন:

```bash
N8N_API_KEY=your_secure_random_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=your_upstash_token
```

### 2.3 Deploy

```bash
cd apps/web
npx vercel --prod
```

---

## API Reference

### Webhook Trigger

**URL**: `POST /webhook/market-resolution`

**Body**:
```json
{
  "event_id": "uuid-of-market",
  "event_query": "Will Bitcoin reach $100K by end of 2026?"
}
```

**Response**:
```json
{
  "success": true,
  "eventId": "uuid-of-market",
  "result": "YES",
  "confidence": 0.95,
  "status": "resolved"
}
```

### Vercel Resolve Endpoint

**URL**: `POST /api/resolve`

**Headers**:
```
x-api-key: your-n8n-api-key
```

**Body**:
```json
{
  "eventId": "uuid-of-market",
  "result": "YES",
  "confidence": 0.95,
  "sourceUrl": "https://example.com/news",
  "summary": "Bitcoin reached $100,500"
}
```

---

## কনফিডেন্স লেভেল

| Confidence | Action |
|------------|--------|
| >= 90% | Auto-resolve |
| 70-89% | Human review |
| < 70% | Gather more evidence |

---

## ট্রাবলশুটিং

### "Already Processed"
**কারণ**: Redis cache এ flag আছে
**সমাধান**: 24 ঘণ্টা অপেক্ষা করুন

### "Confidence too low"
**কারণ**: AI confidence 90% এর নিচে
**সমাধান**: Manual review এ পাঠান

### Redis Connection Failed
**কারণ**: Environment variables ভুল
**সমাধান**: KV_REST_API_URL এবং KV_REST_API_TOKEN চেক করুন

---

## নিরাপত্তা চেকলিস্ট

- [ ] N8N_API_KEY strong এবং unique
- [ ] Supabase RLS policies enabled
- [ ] Redis cache TTL সেট (24 hours)
- [ ] API rate limiting enabled
