# Plokymarket - Complete Event Creation Implementation Guide
## বাংলাদেশ কনটেক্স্টে ফ্রি টিয়ার অপ্টিমাইজড সলিউশন

---

## 📋 সিস্টেম আর্কিটেকচার

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LAYER                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Manual Creator  │  │ AI Generator    │  │ Admin Panel     │ │
│  │ (Mode 1)        │  │ (Mode 2)        │  │ (Review/Approve)│ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼──────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE LAYER                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Next.js 15 + Edge Runtime (10s timeout optimized)      │    │
│  │  • /api/admin/events/create (Manual Event API)          │    │
│  │  • /api/admin/generate-topics (AI Generation API)       │    │
│  │  • /api/upstash-workflow/event-processor (Async)        │    │
│  │  • /api/cron/daily-ai-topics (Daily Cron)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     UPSTASH LAYER (FREE)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ QStash Cron     │  │ Workflow        │  │ Redis Cache     │ │
│  │ • Daily 6AM     │  │ • Async Process │  │ • Rate Limit    │ │
│  │ • Retry Logic   │  │ • Retry Failed  │  │ • Duplicate     │ │
│  │ • 10K req/day   │  │ • 10K req/day   │  │   Prevention    │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘ │
└───────────┼────────────────────┼───────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE LAYER (FREE)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ markets         │  │ resolution_     │  │ admin_activity_ │ │
│  │ • Events        │  │   systems       │  │   logs          │ │
│  │ • Questions     │  │ • AI Config     │  │ • Audit Trail   │ │
│  │ • Trading Data  │  │ • Oracle Setup  │  │ • Compliance    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 মোড ১: ম্যানুয়াল ইভেন্ট ক্রিয়েটর

### ফাইল স্ট্রাকচার
```
app/sys-cmd-7x9k2/events/create/page.tsx          # UI Component
app/api/admin/events/create/route.ts              # Edge API
app/api/upstash-workflow/event-processor/route.ts # Async Processor
```

### ১. লজিক অ্যালগরিদম (Logic Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                    MANUAL EVENT CREATION                     │
└─────────────────────────────────────────────────────────────┘

Step 1: Admin Form Input
├─ শিরোনাম (বাংলা/ইংরেজি, ১০+ অক্ষর)
├─ প্রশ্ন (Yes/No ফরম্যাট, ২০+ অক্ষর)
├─ বিবরণ (ঐচ্ছিক)
├─ ক্যাটাগরি (৮টি অপশন)
│   ├─ খেলাধুলা (BPL, Cricket, Football)
│   ├─ রাজনীতি (নির্বাচন, সিটি কর্পোরেশন)
│   ├─ অর্থনীতি (USD-BDT, Inflation, Stock)
│   ├─ বিনোদন (Bollywood, Hollywood)
│   ├─ প্রযুক্তি (AI, Crypto, Mobile)
│   ├─ আন্তর্জাতিক (Global Events)
│   ├─ সামাজিক (Trends, Viral)
│   └─ আবহাওয়া (Cyclone, Monsoon)
├─ ট্যাগ (১+ ট্যাগ বাধ্যতামূলক)
├─ সময় (ট্রেডিং শেষ তারিখ)
├─ লিকুইডিটি (১০০-১০,০০০)
└─ রেজোলিউশন পদ্ধতি
    ├─ ম্যানুয়াল অ্যাডমিন (ডিফল্ট)
    ├─ AI Oracle (স্বয়ংক্রিয়)
    └─ বিশেষজ্ঞ প্যানেল

Step 2: Client-Side Validation
├─ শিরোনাম: min 10 chars
├─ প্রশ্ন: min 20 chars, must contain ?/কি/হবে
├─ তারিখ: Future date required
├─ ট্যাগ: At least 1 tag
└─ সব ভ্যালিডেশন পাস হলে Submit Enable

Step 3: Edge API Processing (< 10s)
├─ Admin Authentication (JWT)
├─ Admin Role Verification
├─ Database Insert (markets table)
├─ Resolution Config Insert
├─ Admin Activity Log
├─ Trigger Upstash Workflow (Async)
└─ Telegram Notification

Step 4: Upstash Workflow (Async)
├─ Step 1: Initialize
│   └─ Check if AI Oracle enabled
├─ Step 2: AI Analysis (if needed)
│   ├─ Build Context Prompt
│   ├─ Call Gemini API
│   ├─ Parse Analysis
│   └─ Save to ai_resolution_pipelines
└─ Step 3: Complete
    └─ Update event status
```

### ২. বাংলাদেশ কনটেক্স্ট ভ্যালিডেশন

```typescript
// ক্যাটাগরি-ভিত্তিক ভ্যালিডেশন
const BD_CONTEXT_RULES = {
  sports: {
    keywords: ['বিপিএল', 'BPL', 'ক্রিকেট', 'Shakib', 'Tamim', 'Mushfiqur'],
    teams: ['ঢাকা', 'চট্টগ্রাম', 'খুলনা', 'রাজশাহী', 'সিলেট', 'রংপুর', 'কুমিল্লা', 'বরিশাল'],
    validation: (text) => text.includes('জিতবে') || text.includes('হারবে')
  },
  
  politics: {
    keywords: ['নির্বাচন', 'ভোট', 'সিটি কর্পোরেশন', 'মেয়র'],
    cities: ['ঢাকা', 'চট্টগ্রাম', 'খুলনা', 'রাজশাহী', 'সিলেট', 'বরিশাল', 'রংপুর'],
    validation: (text) => text.includes('জিতবে') || text.includes('হবে')
  },
  
  economy: {
    keywords: ['টাকা', 'ডলার', 'দাম', 'মূল্য', 'ইনফ্লেশন'],
    currencies: ['USD', 'BDT', 'টাকা'],
    validation: (text) => text.includes('বাড়বে') || text.includes('কমবে')
  }
};
```

### ৩. API ইমপ্লিমেন্টেশন

#### Edge Function (`app/api/admin/events/create/route.ts`)

```typescript
/**
 * API Architecture:
 * 
 * 1. Authentication (< 100ms)
 *    └─ JWT verify + Admin check
 * 
 * 2. Validation (< 50ms)
 *    └─ Schema validation
 * 
 * 3. Database Insert (< 200ms)
 *    └─ markets + resolution_systems
 * 
 * 4. Async Triggers (< 100ms)
 *    ├─ Upstash Workflow
 *    └─ Telegram Notification
 * 
 * Total: < 500ms (well within 10s limit)
 */

export const runtime = 'edge';
export const preferredRegion = 'iad1';

export async function POST(request: NextRequest) {
  // Step 1: Auth (caching enabled)
  const { user } = await verifyAdmin(request);
  
  // Step 2: Validation
  const body = await request.json();
  validateEventData(body.event_data);
  
  // Step 3: Database (parallel)
  const [event, config] = await Promise.all([
    createEvent(body.event_data, user.id),
    createResolutionConfig(body.resolution_config)
  ]);
  
  // Step 4: Async triggers (non-blocking)
  Promise.all([
    triggerWorkflow(event.id),
    sendNotification(event.name, user.name)
  ]);
  
  return Response.json({ success: true, event_id: event.id });
}
```

### ৪. Upstash Workflow ইন্টিগ্রেশন

```typescript
/**
 * Workflow Steps:
 * 
 * Step 1: init
 * ├─ Get event details
 * └─ Check resolution method
 * 
 * Step 2: ai_analysis (if ai_oracle)
 * ├─ Build Bangladesh context prompt
 * ├─ Call Gemini 1.5 Flash (free tier)
 * ├─ Parse JSON response
 * └─ Save to ai_resolution_pipelines
 * 
 * Step 3: complete
 * └─ Update status
 */

// Example Workflow Trigger
const workflowPayload = {
  step: 'init',
  data: {
    event_id: 'uuid',
    config: {
      primary_method: 'ai_oracle',
      ai_keywords: ['BPL', 'কুমিল্লা'],
      ai_sources: ['prothomalo.com', 'espncricinfo.com'],
      confidence_threshold: 85
    }
  }
};
```

---

## 🔄 মোড ২: AI ডেইলি টপিকস

### ক্রোন সিডিউল সেটআপ

```javascript
// Upstash QStash Cron (Free Tier: 10K req/day)
{
  "destination": "https://your-app.vercel.app/api/cron/daily-ai-topics",
  "cron": "0 0 * * *",  // 6:00 AM Bangladesh Time
  "method": "POST",
  "headers": {
    "x-cron-secret": "your-secret"
  },
  "retries": 3
}
```

### AI প্রম্পট ইঞ্জিনিয়ারিং

```
=== BANGLADESH CONTEXT (60%) ===
Sports:
- BPL 2024: Teams (Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Rangpur, Cumilla, Barishal)
- National Team: Shakib Al Hasan, Tamim Iqbal, Mushfiqur Rahim
- IPL: Very popular in Bangladesh
- Football: Abahani, Mohammedan, Bashundhara Kings

Economy:
- USD-BDT Exchange Rate (120-125 TK range)
- Inflation: Rice, Onion, Oil prices
- Stock Market: DSE Index
- Remittance: Middle East, Malaysia, Singapore
- IMF Loan and economic policies

Politics:
- National Elections
- City Corporation Elections (Dhaka, Chattogram, etc.)
- Government policies and infrastructure
- Padma Bridge, Metro Rail, Expressway projects

=== INTERNATIONAL CONTEXT (40%) ===
Sports:
- ICC Tournaments (World Cup, T20, Champions Trophy)
- FIFA World Cup, Premier League, Champions League
- Olympics 2024

Global:
- US Presidential Election 2024
- Major geopolitical events
- Oil prices and global economy
- Climate change summits

Entertainment:
- Bollywood: SRK, Salman, Amir Khan movies
- Hollywood: Marvel, DC, Oscar winners
- K-pop: BTS, Blackpink trends

Technology:
- iPhone/Samsung releases
- AI developments (ChatGPT, Gemini)
- Crypto: Bitcoin, Ethereum movements
```

---

## 💾 ডাটাবেস স্কিমা

### মূল টেবিল

```sql
-- markets (events)
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  tags TEXT[],
  
  -- Trading
  trading_closes_at TIMESTAMPTZ NOT NULL,
  resolution_delay_hours INTEGER DEFAULT 24,
  initial_liquidity NUMERIC DEFAULT 1000,
  liquidity NUMERIC DEFAULT 1000,
  
  -- Answers
  answer_type VARCHAR(20) DEFAULT 'binary',
  answer1 VARCHAR(100) DEFAULT 'হ্যাঁ (Yes)',
  answer2 VARCHAR(100) DEFAULT 'না (No)',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  slug VARCHAR(100) UNIQUE,
  
  -- Media
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- resolution_systems
CREATE TABLE resolution_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  
  -- Method
  primary_method VARCHAR(50) DEFAULT 'manual_admin',
  
  -- AI Config
  ai_keywords TEXT[],
  ai_sources TEXT[],
  confidence_threshold INTEGER DEFAULT 85,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ai_resolution_pipelines (AI analysis results)
CREATE TABLE ai_resolution_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
  pipeline_id VARCHAR(100),
  
  -- AI Data
  query JSONB,
  synthesis_output JSONB,
  final_confidence NUMERIC(5,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'running',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- admin_activity_logs
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 ডিপ্লয়মেন্ট গাইড

### Step 1: Environment Variables

```bash
# Vercel Dashboard > Settings > Environment Variables

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash QStash
UPSTASH_WORKFLOW_URL=https://qstash.upstash.io/v2/publish
UPSTASH_WORKFLOW_TOKEN=your-qstash-token
QSTASH_TOKEN=your-qstash-token

# AI
GEMINI_API_KEY=your-gemini-api-key

# Notifications
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Security
CRON_SECRET=your-random-secret-key
```

### Step 2: Database Migration

```bash
# Run in Supabase SQL Editor
\i supabase/migrations/093_manual_event_system.sql
```

### Step 3: Setup Cron Jobs

```bash
# Install dependencies
cd apps/web
npm install @upstash/qstash

# Setup daily AI topics cron
cd scripts
node setup-daily-ai-cron.js

# Verify schedules
node -e "const { Client } = require('@upstash/qstash'); 
const client = new Client({ token: 'your-token' }); 
client.schedules.list().then(s => console.log(s));"
```

### Step 4: Deploy

```bash
# Build and deploy
cd apps/web
npm run build
npx vercel --prod
```

---

## 📊 পারফরম্যান্স অপ্টিমাইজেশন

### Vercel Edge Best Practices

```typescript
// 1. Use Edge Runtime
export const runtime = 'edge';
export const preferredRegion = 'iad1'; // Close to Bangladesh

// 2. Minimize dependencies
// ❌ Don't use: axios, moment, lodash
// ✅ Use: native fetch, Intl.DateTimeFormat

// 3. Parallel async operations
const [data1, data2] = await Promise.all([
  fetchData1(),
  fetchData2()
]);

// 4. Caching
export const revalidate = 3600; // 1 hour

// 5. Database connection pooling
const supabase = createClient(url, key, {
  auth: { persistSession: false }
});
```

### Upstash Free Tier Limits

| Service | Limit | Usage |
|---------|-------|-------|
| QStash | 10K req/day | Cron + Workflow |
| Redis | 10K req/day | Caching + Rate Limit |
| Workflow | 10K steps/day | Async Processing |

---

## 🔔 নোটিফিকেশন সিস্টেম

### Telegram Bot Setup

```bash
# 1. Create bot with @BotFather
# 2. Get chat ID
# 3. Set environment variables

TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=-1001234567890
```

### Notification Format

```
🆕 নতুন ইভেন্ট তৈরি হয়েছে

📌 BPL 2024 ফাইনালে কুমিল্লা জিতবে?
👤 তৈরি করেছেন: Admin
⏰ সময়: ১৫ ফেব্রুয়ারি, ২০২৬, সকাল ১০:৩০

🔗 দেখুন: https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/events/uuid
```

---

## ✅ টেস্টিং চেকলিস্ট

### ম্যানুয়াল ইভেন্ট ক্রিয়েশন
- [ ] শিরোনাম ১০ অক্ষরের কম হলে এরর
- [ ] প্রশ্নে ?/কি/হবে না থাকলে এরর
- [ ] ভবিষ্যৎ তারিখ না দিলে এরর
- [ ] ট্যাগ না দিলে এরর
- [ ] সাকসেস হলে টেলিগ্রাম নোটিফিকেশন
- [ ] AI Oracle সিলেক্ট করলে Workflow ট্রিগার

### AI ডেইলি টপিকস
- [ ] ৬টায় অটো জেনারেট
- [ ] ডুপ্লিকেট প্রিভেনশন
- [ ] বাংলাদেশ + ইন্টারন্যাশনাল মিক্স
- [ ] টেলিগ্রাম নোটিফিকেশন

### পারফরম্যান্স
- [ ] API response < 500ms
- [ ] Workflow complete < 5s
- [ ] No timeout errors

---

## 🆘 ট্রাবলশুটিং

### সমস্যা: Vercel Timeout
**সমাধান:** Upstash Workflow ব্যবহার করুন

### সমস্যা: Database Connection Limit
**সমাধান:** Connection pooling + Edge Runtime

### সমস্যা: AI Response Slow
**সমাধান:** Gemini 1.5 Flash (faster than GPT-4)

### সমস্যা: Duplicate Cron Jobs
**সমাধান:** Redis caching for idempotency

---

## 📞 সাপোর্ট

- **Documentation**: This guide
- **Dashboard**: https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2
- **Admin Panel**: https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/events/create

---

**Last Updated**: February 15, 2026
**Version**: 1.0
**Optimized For**: Vercel Free Tier + Supabase Free + Upstash Free
