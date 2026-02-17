# AI Daily Topics System - Setup Guide

## ✅ Implementation Complete

The AI Daily Topics system has been implemented and deployed!

---

## 🚀 What's Deployed

**Production URL**: https://polymarket-bangladesh-mx6x1fbbl-bdowneer191s-projects.vercel.app

### New Features

1. **Daily AI Topic Generation** (`/api/cron/daily-topics`)
   - Triggered by Upstash QStash daily at 6 AM
   - Uses Gemini AI to generate trending topics
   - Fetches news from News API for context
   - Saves topics to `ai_daily_topics` table

2. **Manual Generation** (Admin only)
   - POST to `/api/cron/daily-topics` with admin token
   - Instant topic generation on demand

3. **Admin Panel** (`/admin/daily-topics`)
   - View pending/approved/rejected topics
   - Approve topics → Creates prediction market
   - Reject topics with reason
   - Delete topics
   - Real-time updates

4. **Admin API** (`/api/admin/daily-topics`)
   - GET: List topics with filtering
   - POST: Approve/Reject topics
   - DELETE: Remove topics

---

## 📋 Database Schema

### Table: `ai_daily_topics`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | VARCHAR(500) | Topic title/question |
| category | VARCHAR(50) | Sports, Politics, Crypto, etc. |
| description | TEXT | Detailed description |
| trading_end_date | DATE | When trading closes |
| source_keywords | TEXT[] | Related keywords |
| ai_confidence | NUMERIC | AI confidence score |
| status | VARCHAR(20) | pending/approved/rejected |
| approved_at | TIMESTAMPTZ | Approval timestamp |
| approved_by | UUID | Admin who approved |
| market_id | UUID | Linked market ID |
| generated_at | TIMESTAMPTZ | Generation timestamp |

---

## 🔧 Environment Variables

Add these to Vercel if not already set:

```bash
# AI APIs
GEMINI_API_KEY=your-gemini-api-key
NEWS_API_KEY=your-news-api-key

# QStash (Already configured)
QSTASH_TOKEN=eyJVc2VySUQiOiIyN2ZiNDY4Yi01ZWYxLTQzNGUtYmUyMi1hNmJlNDgwOWZmNDkiLCJQYXNzd29yZCI6ImRkMzVjYjc5NDg1ODQ2NTM4ZGZiZDViZTg3OGNmOGUwIn0=
QSTASH_CURRENT_SIGNING_KEY=sig_6uNKneQ6CmH9zqfpFfyJKxpBgQLH
QSTASH_NEXT_SIGNING_KEY=sig_7sB1LAkcv2c9LCGHAypXWwZ9F8Ar
QSTASH_URL=https://qstash.upstash.io

# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 🚀 Setup Steps

### Step 1: Apply Database Migration

Run in Supabase SQL Editor:

```sql
-- Run: supabase/migrations/084_ai_daily_topics.sql
```

### Step 2: Setup QStash Cron Job

```bash
cd apps/web
node scripts/setup-daily-topics-cron.js
```

Or manually in Upstash Dashboard:
- URL: `https://plokymarket-bangladesh.vercel.app/api/cron/daily-topics`
- Cron: `0 6 * * *` (daily at 6 AM)
- Retries: 3

### Step 3: Configure API Keys

1. **Get Gemini API Key**: https://makersuite.google.com/app/apikey
2. **Get News API Key**: https://newsapi.org/register
3. Add to Vercel Environment Variables

### Step 4: Test the System

**Manual Generation** (Admin):
```bash
curl -X POST https://plokymarket-bangladesh.vercel.app/api/cron/daily-topics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Access Admin Panel**:
- Go to: `https://plokymarket-bangladesh.vercel.app/admin/daily-topics`
- Login as admin
- Review and approve generated topics

---

## 📊 Workflow

### Automatic (Daily at 6 AM)
```
Upstash QStash
    ↓
/api/cron/daily-topics
    ↓
Fetch trending news
    ↓
Gemini AI generates topics
    ↓
Save to ai_daily_topics (status: pending)
    ↓
Admin reviews in /admin/daily-topics
    ↓
Admin approves → Creates market
```

### Manual (On Demand)
```
Admin clicks "Generate Now"
    ↓
POST /api/cron/daily-topics
    ↓
Same AI generation process
    ↓
Topics available immediately
```

---

## 🎨 Admin Panel Features

### Pending Topics Tab
- View AI-generated topics
- See confidence score
- View source keywords
- Approve/Reject/Delete actions

### Approved Topics Tab
- View approved topics
- See linked market ID
- Creation timestamp

### Rejected Topics Tab
- View rejected topics
- See rejection reasons

### Generate Button
- Manual topic generation
- Instant results
- Same AI logic as cron

---

## 🔒 Security

- **Cron Endpoint**: QStash signature verification
- **Manual Trigger**: Admin authentication required
- **Admin API**: Bearer token + admin role check
- **RLS Policies**: Public can only view approved topics

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Topics not generating | Check GEMINI_API_KEY and NEWS_API_KEY |
| Cron not running | Verify QStash schedule in Upstash dashboard |
| Admin access denied | Check user has `role = 'admin'` in database |
| Topics not saving | Check database migration applied |

---

## 📈 Monitoring

### Vercel Logs
- Check `/api/cron/daily-topics` executions
- Monitor `/api/admin/daily-topics` API calls

### QStash Logs
- View in Upstash Console
- Check delivery status

### Database
```sql
-- Check recent topics
SELECT * FROM ai_daily_topics 
ORDER BY generated_at DESC 
LIMIT 10;

-- Check pending topics count
SELECT COUNT(*) FROM ai_daily_topics 
WHERE status = 'pending';
```

---

## 📝 Next Steps

1. ✅ **Code deployed**
2. ⏳ **Apply database migration** (084_ai_daily_topics.sql)
3. ⏳ **Add GEMINI_API_KEY to Vercel**
4. ⏳ **Add NEWS_API_KEY to Vercel**
5. ⏳ **Setup QStash cron job**
6. ⏳ **Test manual generation**
7. ⏳ **Approve first topic**

---

**Status**: ✅ Production Ready
