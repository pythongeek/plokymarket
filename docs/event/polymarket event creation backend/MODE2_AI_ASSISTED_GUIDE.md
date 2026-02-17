# Mode 2: AI-Assisted Event Creator
## Complete Implementation Guide

---

## 🎯 ওভারভিউ

AI-Assisted Creator হলো একটি স্মার্ট সিস্টেম যেখানে অ্যাডমিন শুধু একটি টপিক দিলে Gemini AI স্বয়ংক্রিয়ভাবে বাংলাদেশ কনটেক্স্টে ইভেন্ট সাজেশন তৈরি করে।

### কীভাবে কাজ করে:
1. **Admin Input**: টপিক লিখুন (যেমন: "বিপিএল ফাইনাল")
2. **Upstash Workflow**: Async processing শুরু হয়
3. **Gemini AI**: বাংলাদেশ কনটেক্স্টে বিশ্লেষণ করে
4. **Suggestions**: ৩টি ভিন্ন ভ্যারিয়েশন দেখায়
5. **One-Click Create**: পছন্দ করলে ইভেন্ট তৈরি

---

## 🏗️ আর্কিটেকচার

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /sys-cmd-7x9k2/events/create/ai-assisted              │    │
│  │  • Topic Input                                          │    │
│  │  • Context (Optional)                                   │    │
│  │  • Variations Count                                     │    │
│  │  • Real-time Status                                     │    │
│  └────────────────────────┬────────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE API (< 10s)                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  POST /api/ai/generate-topic-workflow                   │    │
│  │  • Validate Input                                       │    │
│  │  • Create DB Records (pending)                          │    │
│  │  • Trigger Upstash QStash                               │    │
│  │  • Return Workflow ID                                   │    │
│  └────────────────────────┬────────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UPSTASH QSTASH (ASYNC)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Queue Message                                        │    │
│  │  • Retry Logic (3x)                                     │    │
│  │  • Deliver to Webhook                                   │    │
│  └────────────────────────┬────────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW PROCESSOR                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  POST /api/ai/workflow-processor                        │    │
│  │  • Bangladesh Context Builder                           │    │
│  │  • Gemini 1.5 Flash API Call                            │    │
│  │  • Parse JSON Response                                  │    │
│  │  • Update DB Records                                    │    │
│  │  • Telegram Notification                                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 AI প্রম্পট ইঞ্জিনিয়ারিং

### বাংলাদেশ কনটেক্সট

```
=== BANGLADESH CONTEXT (Primary Focus) ===

Sports:
├─ BPL (Bangladesh Premier League)
│  ├─ Teams: Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Rangpur, Cumilla, Barishal
│  ├─ Players: Shakib Al Hasan, Tamim Iqbal, Mushfiqur Rahim, Liton Das
│  └─ Format: T20, League + Playoffs
│
├─ National Team
│  ├─ Formats: Test, ODI, T20
│  ├─ Key Series: vs India, Pakistan, Australia, England
│  └─ Rankings: ICC rankings
│
└─ Football
   ├─ Clubs: Abahani, Mohammedan, Bashundhara Kings
   └─ Tournaments: Bangladesh Premier League

Politics:
├─ National Elections (জাতীয় নির্বাচন)
├─ City Corporation: Dhaka North/South, Chattogram, Khulna, Rajshahi
├─ Political Parties: Awami League, BNP, Jatiya Party
└─ Key Issues: Development, Economy, Foreign Policy

Economy:
├─ USD-BDT Rate: 120-125 TK per USD (current)
├─ Inflation: Rice, Onion, Oil, Gas prices
├─ Stock Market: DSE Index, Chittagong Stock Exchange
├─ Remittance: Middle East, Malaysia, Singapore, UK
└─ IMF: Loan programs, conditions

Entertainment:
├─ Bollywood: SRK, Salman Khan, Amir Khan releases
├─ Dhallywood: Bangladeshi cinema
├─ Hollywood: Marvel, DC, Oscar winners
└─ Music: K-pop trends, Local artists

Technology:
├─ Mobile: iPhone, Samsung, Xiaomi, Realme launches
├─ AI: ChatGPT, Google Gemini updates
├─ Crypto: Bitcoin, Ethereum, local regulations
└─ Social: Viral trends, TikTok, Facebook

Social:
├─ Festivals: Eid-ul-Fitr, Eid-ul-Adha, Durga Puja
├─ Education: HSC, SSC, University admission/results
├─ Weather: Cyclone (Amphan, Yaas), Monsoon, Floods
└─ Viral: Social media challenges, trends
```

### ভ্যারিয়েশন স্ট্র্যাটেজি

```typescript
const variationPrompts = [
  // Variation 1: Local Focus
  "Focus on Bangladesh local context with specific teams/players/politicians. Include local language (Bengali) terms.",
  
  // Variation 2: Economic Impact
  "Focus on economic impact, market predictions, and financial implications. Include numbers and data.",
  
  // Variation 3: International Comparison
  "Focus on international comparison, global trends, and how Bangladesh fits into the bigger picture."
];
```

---

## 🔧 API এন্ডপয়েন্টস

### 1. Generate Topic Workflow

**Endpoint:** `POST /api/ai/generate-topic-workflow`

**Request:**
```json
{
  "topic": "বিপিএল ফাইনাল",
  "context": "কুমিল্লা vs ঢাকা",
  "variations": 3,
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "workflow_run_id": "ai-topic-1708000000000-abc123",
  "message_id": "msg_xxx",
  "suggestion_ids": ["uuid1", "uuid2", "uuid3"],
  "status": "pending"
}
```

### 2. Check Workflow Status

**Endpoint:** `GET /api/ai/workflow-status?workflow_id=xxx`

**Response:**
```json
{
  "status": "completed",
  "workflow_id": "ai-topic-1708000000000-abc123",
  "total": 3,
  "completed": 3,
  "pending": 0,
  "suggestions": [...]
}
```

### 3. Workflow Processor (Internal)

**Endpoint:** `POST /api/ai/workflow-processor`

**Called by:** Upstash QStash

**Process:**
1. Receive workflow payload
2. Build Bangladesh context prompt
3. Call Gemini API for each variation
4. Parse and validate JSON
5. Update database
6. Send notification

---

## 💾 ডাটাবেস স্কিমা

### ai_daily_topics টেবিল (আগের মতোই, কিছু কলাম যোগ)

```sql
-- Additional columns for Mode 2
ALTER TABLE ai_daily_topics ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0;
ALTER TABLE ai_daily_topics ADD COLUMN source_urls TEXT[] DEFAULT '{}';
ALTER TABLE ai_daily_topics ADD COLUMN suggested_trading_end TIMESTAMPTZ;
ALTER TABLE ai_daily_topics ADD COLUMN suggested_subcategory VARCHAR(50);
ALTER TABLE ai_daily_topics ADD COLUMN workflow_id VARCHAR(100);
ALTER TABLE ai_daily_topics ADD COLUMN converted_event_id UUID REFERENCES markets(id);
```

---

## 🚀 ডিপ্লয়মেন্ট স্টেপস

### Step 1: Environment Variables

```bash
# Add to Vercel Dashboard
NEXT_PUBLIC_APP_URL=https://polymarket-bangladesh.vercel.app
QSTASH_TOKEN=your-upstash-qstash-token
GEMINI_API_KEY=your-gemini-api-key
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Step 2: Database Migration

```sql
-- Run in Supabase SQL Editor
ALTER TABLE ai_daily_topics 
ADD COLUMN IF NOT EXISTS trending_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS source_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS suggested_trading_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suggested_subcategory VARCHAR(50),
ADD COLUMN IF NOT EXISTS workflow_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS converted_event_id UUID REFERENCES markets(id);

-- Index for workflow queries
CREATE INDEX IF NOT EXISTS idx_ai_topics_workflow ON ai_daily_topics(workflow_id);
```

### Step 3: Test Workflow

```bash
# 1. Test API directly
curl -X POST https://your-app.vercel.app/api/ai/generate-topic-workflow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "topic": "বিপিএল ফাইনাল",
    "context": "কুমিল্লা vs ঢাকা",
    "variations": 3
  }'

# 2. Check status
curl "https://your-app.vercel.app/api/ai/workflow-status?workflow_id=xxx" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 পারফরম্যান্স

### টাইমিং ব্রেকডাউন

| Step | Time | Notes |
|------|------|-------|
| API Validation | < 50ms | Edge function |
| DB Insert (pending) | < 100ms | Parallel inserts |
| QStash Trigger | < 200ms | Async queue |
| **Total Response** | **< 500ms** | To user |
| Gemini API Call | 2-5s | Per variation |
| JSON Parsing | < 100ms | |
| DB Update | < 100ms | |
| **Total Processing** | **5-15s** | Background |

### Free Tier Limits

| Service | Limit | Our Usage |
|---------|-------|-----------|
| Vercel Edge | 10s timeout | < 500ms response |
| Upstash QStash | 10K req/day | ~100/day |
| Gemini 1.5 Flash | 15 req/min | ~10/min max |
| Supabase | 500K req/day | ~1000/day |

---

## 🎨 UI ফিচারস

### মূল কম্পোনেন্টস

1. **Topic Input**
   - Large textarea with examples
   - Context input (optional)
   - Variation count slider

2. **Status Display**
   - Real-time workflow status
   - Progress indicator
   - Time elapsed

3. **Suggestion Cards**
   - Title + Question
   - Confidence & Trending scores
   - Category badge with icon
   - AI reasoning
   - Source links
   - One-click create

4. **Empty State**
   - Illustration
   - Example topics
   - Instructions

---

## ✅ টেস্টিং চেকলিস্ট

### Functional Tests
- [ ] Topic input validation (min 5 chars)
- [ ] Workflow trigger success
- [ ] Status polling works
- [ ] Suggestions display correctly
- [ ] Create event from suggestion
- [ ] Reject suggestion
- [ ] Telegram notification received

### Bangladesh Context Tests
- [ ] BPL related topics include team names
- [ ] Cricket questions include player names
- [ ] Political questions include party names
- [ ] Economic questions include specific numbers
- [ ] Bengali language used appropriately

### Performance Tests
- [ ] API response < 500ms
- [ ] Workflow completes < 15s
- [ ] No timeout errors
- [ ] Retry logic works

---

## 🐛 ট্রাবলশুটিং

### সমস্যা: Workflow stuck in "pending"
**সমাধান:** 
- Check QStash dashboard
- Verify endpoint URL
- Check logs in Vercel

### সমস্যা: Gemini returns invalid JSON
**সমাধান:**
- Add retry logic
- Validate JSON before parsing
- Fallback to default format

### সমস্যা: Timeout on Vercel
**সমাধান:**
- Ensure < 10s execution
- Use Upstash for async tasks
- Optimize database queries

---

## 📞 সাপোর্ট

- **URL**: `/sys-cmd-7x9k2/events/create/ai-assisted`
- **API Docs**: See above endpoints
- **Logs**: Vercel Dashboard

---

**Last Updated**: February 15, 2026
**Version**: 1.0
**Status**: Production Ready
