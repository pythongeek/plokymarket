# সম্পূর্ণ প্রোডাকশন-রেডি ইভেন্ট ম্যানেজমেন্ট সিস্টেম
## Next.js + Supabase + n8n + AI Integration

---

## 📋 সূচিপত্র

1. [সিস্টেম আর্কিটেকচার ওভারভিউ](#সিস্টেম-আর্কিটেকচার-ওভারভিউ)
2. [ডাটাবেস স্কিমা এক্সটেনশন](#ডাটাবেস-স্কিমা-এক্সটেনশন)
3. [AI সাজেশন সিস্টেম](#ai-সাজেশন-সিস্টেম)
4. [ইভেন্ট তৈরির ৩টি মোড](#ইভেন্ট-তৈরির-৩টি-মোড)
5. [৫টি যাচাইকরণ সিস্টেম](#৫টি-যাচাইকরণ-সিস্টেম)
6. [অ্যাডমিন UI কম্পোনেন্ট](#অ্যাডমিন-ui-কম্পোনেন্ট)
7. [n8n অটোমেশন ওয়ার্কফ্লো](#n8n-অটোমেশন-ওয়ার্কফ্লো)
8. [ডিপ্লয়মেন্ট গাইড](#ডিপ্লয়মেন্ট-গাইড)

---

## 🏗️ সিস্টেম আর্কিটেকচার ওভারভিউ

### প্রধান কম্পোনেন্ট:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Manual     │  │  AI-Assisted │  │   Hybrid     │      │
│  │   Creator    │  │   Creator    │  │   Creator    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL + Storage)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Events │ AI Topics │ Resolutions │ Expert Panel    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  n8n Automation Workflows                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ AI News  │  │ Oracle   │  │ Alert    │  │ Auto     │   │
│  │ Scanner  │  │ Monitor  │  │ System   │  │ Resolver │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services & APIs                        │
│  • Anthropic Claude API (AI Suggestions)                    │
│  • News APIs (প্রথম আলো, ডেইলি স্টার, BBC Bangla)         │
│  • Chainlink Oracle (Crypto Prices)                         │
│  • Sports APIs (Cricinfo, ESPN)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ ডাটাবেস স্কিমা এক্সটেনশন

### ১. AI Daily Topics টেবিল

```sql
-- AI দ্বারা প্রতিদিন সাজেস্ট করা টপিক স্টোর করার জন্য
CREATE TABLE ai_daily_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- টপিক ইনফরমেশন
  suggested_title VARCHAR(255) NOT NULL,
  suggested_question TEXT NOT NULL,
  suggested_description TEXT,
  
  -- ক্যাটাগরি এবং মেটাডাটা
  suggested_category VARCHAR(50) NOT NULL,
  suggested_subcategory VARCHAR(100),
  suggested_tags TEXT[],
  trending_score NUMERIC(5, 2) CHECK (trending_score BETWEEN 0 AND 100),
  
  -- সোর্স এবং কনফিডেন্স
  source_urls TEXT[],
  confidence_score NUMERIC(5, 2) CHECK (confidence_score BETWEEN 0 AND 100),
  ai_reasoning TEXT,
  
  -- টাইমিং সাজেশন
  suggested_start_date TIMESTAMPTZ,
  suggested_end_date TIMESTAMPTZ,
  suggested_resolution_delay INTEGER DEFAULT 60,
  
  -- স্ট্যাটাস ট্র্যাকিং
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'converted', 'expired')
  ),
  
  -- অ্যাডমিন অ্যাকশন
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  converted_event_id UUID REFERENCES events(id),
  
  -- টাইমস্টাম্প
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- সার্চ ইনডেক্স
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(suggested_title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(suggested_question, '')), 'B')
  ) STORED
);

-- ইনডেক্স তৈরি করুন
CREATE INDEX idx_ai_topics_status ON ai_daily_topics(status);
CREATE INDEX idx_ai_topics_category ON ai_daily_topics(suggested_category);
CREATE INDEX idx_ai_topics_trending ON ai_daily_topics(trending_score DESC);
CREATE INDEX idx_ai_topics_created ON ai_daily_topics(created_at DESC);
CREATE INDEX idx_ai_topics_search ON ai_daily_topics USING gin(search_vector);
```

### ২. Resolution Systems টেবিল

```sql
-- নির্বাচন ও নিষ্পত্তি হাব
CREATE TABLE resolution_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- রেজোলিউশন মেথড
  primary_method VARCHAR(50) NOT NULL CHECK (
    primary_method IN ('ai_oracle', 'manual_admin', 'expert_panel', 'dispute_tribunal', 'external_oracle')
  ),
  fallback_methods VARCHAR(50)[] DEFAULT ARRAY['manual_admin'],
  
  -- AI Oracle সেটিংস
  ai_oracle_config JSONB DEFAULT '{
    "sources": [],
    "keywords": [],
    "confidence_threshold": 90,
    "min_sources_required": 3
  }'::jsonb,
  
  -- Expert Panel
  assigned_experts UUID[],
  expert_votes JSONB DEFAULT '[]'::jsonb,
  expert_consensus_threshold NUMERIC(3, 2) DEFAULT 0.75,
  
  -- Dispute Management
  dispute_count INTEGER DEFAULT 0,
  disputes JSONB DEFAULT '[]'::jsonb,
  dispute_bond_amount NUMERIC(10, 2) DEFAULT 100.00,
  
  -- External Oracle
  external_oracle_type VARCHAR(50), -- 'chainlink', 'cricinfo', 'coinbase', etc.
  external_api_endpoint TEXT,
  external_api_key_encrypted TEXT,
  external_last_check TIMESTAMPTZ,
  
  -- স্ট্যাটাস
  resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (
    resolution_status IN ('pending', 'in_progress', 'resolved', 'disputed', 'failed')
  ),
  
  -- রেজাল্ট
  proposed_outcome INTEGER CHECK (proposed_outcome IN (1, 2, NULL)),
  confidence_level NUMERIC(5, 2),
  evidence JSONB DEFAULT '[]'::jsonb,
  
  -- অডিট
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT unique_event_resolution UNIQUE (event_id)
);

CREATE INDEX idx_resolution_event ON resolution_systems(event_id);
CREATE INDEX idx_resolution_status ON resolution_systems(resolution_status);
CREATE INDEX idx_resolution_method ON resolution_systems(primary_method);
```

### ৩. Expert Panel টেবিল

```sql
-- বিশেষজ্ঞ প্যানেল ("বিশিষ্ট ব্যক্তি")
CREATE TABLE expert_panel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- বিশেষজ্ঞ প্রোফাইল
  expert_name VARCHAR(100) NOT NULL,
  credentials TEXT,
  specializations VARCHAR(50)[] NOT NULL, -- ['Sports', 'Cricket', 'BPL']
  bio TEXT,
  
  -- ভেরিফিকেশন
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- পারফরম্যান্স মেট্রিক্স
  total_votes INTEGER DEFAULT 0,
  correct_votes INTEGER DEFAULT 0,
  incorrect_votes INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_votes > 0 THEN (correct_votes::NUMERIC / total_votes * 100)
      ELSE 0
    END
  ) STORED,
  
  -- রেটিং এবং রেপুটেশন
  expert_rating NUMERIC(3, 2) DEFAULT 0.00 CHECK (expert_rating BETWEEN 0 AND 5),
  reputation_score INTEGER DEFAULT 0,
  
  -- অ্যাভেইলেবিলিটি
  is_active BOOLEAN DEFAULT TRUE,
  availability_status VARCHAR(20) DEFAULT 'available' CHECK (
    availability_status IN ('available', 'busy', 'unavailable')
  ),
  
  -- কন্টাক্ট
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- টাইমস্টাম্প
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_vote_at TIMESTAMPTZ,
  
  CONSTRAINT unique_expert_user UNIQUE (user_id)
);

CREATE INDEX idx_expert_specializations ON expert_panel USING gin(specializations);
CREATE INDEX idx_expert_rating ON expert_panel(expert_rating DESC);
CREATE INDEX idx_expert_accuracy ON expert_panel(accuracy_rate DESC);
CREATE INDEX idx_expert_active ON expert_panel(is_active, availability_status);
```

### ৪. News Sources টেবিল (AI Oracle জন্য)

```sql
-- AI Oracle এর জন্য নিউজ সোর্স ম্যানেজমেন্ট
CREATE TABLE news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- সোর্স ইনফরমেশন
  source_name VARCHAR(100) NOT NULL,
  source_url TEXT NOT NULL,
  source_type VARCHAR(50) CHECK (
    source_type IN ('news_website', 'api', 'rss_feed', 'social_media')
  ),
  
  -- দেশ এবং ভাষা
  country_code CHAR(2) DEFAULT 'BD',
  language_code CHAR(2) DEFAULT 'bn',
  
  -- যাচাইকরণ
  is_verified BOOLEAN DEFAULT FALSE,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  bias_rating VARCHAR(20) CHECK (
    bias_rating IN ('left', 'center-left', 'center', 'center-right', 'right', 'neutral')
  ),
  
  -- API সেটিংস (যদি থাকে)
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  requires_authentication BOOLEAN DEFAULT FALSE,
  rate_limit_per_hour INTEGER DEFAULT 100,
  
  -- RSS ফিড (যদি থাকে)
  rss_feed_url TEXT,
  
  -- ক্যাটাগরি কভারেজ
  categories_covered VARCHAR(50)[],
  
  -- পারফরম্যান্স মেট্রিক্স
  total_articles_fetched INTEGER DEFAULT 0,
  successful_fetches INTEGER DEFAULT 0,
  failed_fetches INTEGER DEFAULT 0,
  last_fetch_at TIMESTAMPTZ,
  last_fetch_status VARCHAR(20),
  
  -- স্ট্যাটাস
  is_active BOOLEAN DEFAULT TRUE,
  is_whitelisted BOOLEAN DEFAULT FALSE,
  
  -- মেটাডাটা
  scraping_config JSONB DEFAULT '{}'::jsonb,
  
  -- টাইমস্টাম্প
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_source_url UNIQUE (source_url)
);

CREATE INDEX idx_news_source_active ON news_sources(is_active, is_whitelisted);
CREATE INDEX idx_news_source_country ON news_sources(country_code);
CREATE INDEX idx_news_source_categories ON news_sources USING gin(categories_covered);
```

### ৫. Dispute Records টেবিল

```sql
-- বিরোধ ট্রাইব্যুনাল ("সালিশ") রেকর্ড
CREATE TABLE dispute_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resolution_system_id UUID REFERENCES resolution_systems(id),
  
  -- বিরোধকারী
  disputed_by UUID NOT NULL REFERENCES auth.users(id),
  dispute_type VARCHAR(50) CHECK (
    dispute_type IN ('wrong_outcome', 'premature_resolution', 'technical_error', 'oracle_failure', 'other')
  ),
  
  -- বিরোধের বিবরণ
  dispute_reason TEXT NOT NULL,
  evidence_urls TEXT[],
  evidence_files TEXT[], -- Storage bucket এ ফাইল পাথ
  
  -- বন্ড ম্যানেজমেন্ট
  bond_amount NUMERIC(10, 2) NOT NULL,
  bond_locked_at TIMESTAMPTZ DEFAULT NOW(),
  bond_status VARCHAR(20) DEFAULT 'locked' CHECK (
    bond_status IN ('locked', 'returned', 'forfeited')
  ),
  
  -- বিচার প্রক্রিয়া
  assigned_judge UUID REFERENCES auth.users(id),
  judge_notes TEXT,
  ruling VARCHAR(50) CHECK (
    ruling IN ('accepted', 'rejected', 'partial', NULL)
  ),
  ruling_reason TEXT,
  ruling_at TIMESTAMPTZ,
  
  -- স্ট্যাটাস
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'resolved', 'escalated', 'withdrawn')
  ),
  
  -- ভোটিং (যদি কমিউনিটি ভোট প্রয়োজন)
  community_votes_yes INTEGER DEFAULT 0,
  community_votes_no INTEGER DEFAULT 0,
  voting_ends_at TIMESTAMPTZ,
  
  -- টাইমস্টাম্প
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT positive_bond CHECK (bond_amount > 0)
);

CREATE INDEX idx_dispute_event ON dispute_records(event_id);
CREATE INDEX idx_dispute_status ON dispute_records(status);
CREATE INDEX idx_dispute_user ON dispute_records(disputed_by);
CREATE INDEX idx_dispute_created ON dispute_records(created_at DESC);
```

### ৬. Admin Activity Logs টেবিল

```sql
-- অ্যাডমিন কার্যকলাপ ট্র্যাকিং
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- অ্যাডমিন ইনফো
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- অ্যাকশন ডিটেইলস
  action_type VARCHAR(50) NOT NULL CHECK (
    action_type IN (
      'create_event', 'update_event', 'delete_event', 'resolve_event',
      'approve_topic', 'reject_topic', 'pause_market', 'resume_market',
      'add_expert', 'remove_expert', 'resolve_dispute', 'manual_override',
      'update_oracle', 'emergency_action'
    )
  ),
  
  -- সম্পর্কিত রিসোর্স
  resource_type VARCHAR(50), -- 'event', 'topic', 'dispute', etc.
  resource_id UUID,
  
  -- পরিবর্তনের বিবরণ
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  
  -- প্রসঙ্গ
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- টাইমস্টাম্প
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_activity_logs(action_type);
CREATE INDEX idx_admin_logs_created ON admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_logs_resource ON admin_activity_logs(resource_type, resource_id);
```

---

## 🤖 AI সাজেশন সিস্টেম

### Claude API ইন্টিগ্রেশন

Next.js Edge Function তৈরি করুন:

**`app/api/ai/suggest-topics/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const runtime = 'edge'
export const maxDuration = 60

interface TopicSuggestion {
  title: string
  question: string
  description: string
  category: string
  subcategory: string
  tags: string[]
  trending_score: number
  confidence_score: number
  reasoning: string
  source_urls: string[]
  suggested_start_date: string
  suggested_end_date: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // যাচাই করুন যে ইউজার অ্যাডমিন কিনা
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pro) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // বাংলাদেশ কন্টেক্সট এবং ক্যাটাগরি
    const { categories = ['all'], count = 5 } = await req.json()

    const prompt = `আপনি একটি প্রেডিকশন মার্কেট প্ল্যাটফর্মের জন্য ইভেন্ট সাজেশন দিচ্ছেন। বাংলাদেশের বর্তমান প্রেক্ষাপট বিবেচনা করে ${count}টি আকর্ষণীয়, বিতর্কিত এবং ট্রেড করার যোগ্য ইভেন্ট সাজেস্ট করুন।

প্রেক্ষাপট:
- আজকের তারিখ: ${new Date().toLocaleDateString('bn-BD')}
- টার্গেট ক্যাটাগরি: ${categories.join(', ')}
- ভাষা: বাংলা এবং ইংরেজি মিশ্রিত
- দেশ: বাংলাদেশ

প্রতিটি ইভেন্টের জন্য নিম্নলিখিত তথ্য দিন:

1. **শিরোনাম**: সংক্ষিপ্ত, আকর্ষণীয় (max 50 chars)
2. **প্রশ্ন**: পরিষ্কার Yes/No প্রশ্ন যা ভবিষ্যতে যাচাই করা যাবে
3. **বিবরণ**: 2-3 বাক্যে কনটেক্সট (বাংলা + ইংরেজি)
4. **ক্যাটাগরি**: Sports, Politics, Crypto, Economics, Technology, Entertainment, World Events, Science, Culture, Business
5. **সাবক্যাটাগরি**: আরো নির্দিষ্ট
6. **ট্যাগ**: 3-5টি প্রাসঙ্গিক কীওয়ার্ড (বাংলা + ইংরেজি)
7. **ট্রেন্ডিং স্কোর**: 0-100 (কতটা জনপ্রিয় হবে)
8. **কনফিডেন্স স্কোর**: 0-100 (কতটা নিশ্চিত যে এটি ভালো ইভেন্ট)
9. **যুক্তি**: কেন এটি ভালো মার্কেট হবে (1-2 বাক্য)
10. **সোর্স URL**: সম্পর্কিত নিউজ লিংক (2-3টি)
11. **শুরুর তারিখ**: YYYY-MM-DD format
12. **শেষের তারিখ**: YYYY-MM-DD format

বাংলাদেশের জন্য বিশেষভাবে প্রাসঙ্গিক বিষয়:
- ক্রিকেট (BPL, T20 World Cup, India-Bangladesh series)
- রাজনীতি (নির্বাচন, সরকারি নীতি, হরতাল)
- অর্থনীতি (মুদ্রাস্ফীতি, ডলারের দাম, রেমিট্যান্স)
- টেকনোলজি (স্টার্টআপ, bKash, Nagad)
- বিনোদন (ঢালিউড, বাংলা নাটক)
- শিক্ষা (SSC, HSC, বিশ্ববিদ্যালয় ভর্তি)

Response শুধুমাত্র valid JSON array হতে হবে:
[
  {
    "title": "...",
    "question": "...",
    "description": "...",
    "category": "...",
    "subcategory": "...",
    "tags": ["...", "..."],
    "trending_score": 85,
    "confidence_score": 90,
    "reasoning": "...",
    "source_urls": ["...", "..."],
    "suggested_start_date": "2026-02-14",
    "suggested_end_date": "2026-06-30"
  }
]`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // JSON পার্স করুন
    let suggestions: TopicSuggestion[]
    try {
      // Remove markdown code blocks if present
      let jsonText = content.text.trim()
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      suggestions = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response:', content.text)
      throw new Error('Failed to parse AI response')
    }

    // Supabase এ সেভ করুন
    const { data: savedTopics, error: saveError } = await supabase
      .from('ai_daily_topics')
      .insert(
        suggestions.map((topic) => ({
          suggested_title: topic.title,
          suggested_question: topic.question,
          suggested_description: topic.description,
          suggested_category: topic.category,
          suggested_subcategory: topic.subcategory,
          suggested_tags: topic.tags,
          trending_score: topic.trending_score,
          confidence_score: topic.confidence_score,
          ai_reasoning: topic.reasoning,
          source_urls: topic.source_urls,
          suggested_start_date: topic.suggested_start_date,
          suggested_end_date: topic.suggested_end_date,
          status: 'pending',
        }))
      )
      .select()

    if (saveError) {
      throw saveError
    }

    return NextResponse.json({
      success: true,
      topics: savedTopics,
      count: savedTopics?.length || 0,
    })
  } catch (error: any) {
    console.error('AI suggestion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
```

### প্রতিদিন স্বয়ংক্রিয় সাজেশন (n8n Workflow)

n8n তে এই ওয়ার্কফ্লো সেটআপ করুন:

```json
{
  "name": "Daily AI Topic Suggestions",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 6 * * *"
            }
          ]
        }
      },
      "name": "Schedule - Every Morning 6 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "={{$env.NEXT_PUBLIC_APP_URL}}/api/ai/suggest-topics",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "categories",
              "value": "=['Sports', 'Politics', 'Crypto', 'Economics']"
            },
            {
              "name": "count",
              "value": "=10"
            }
          ]
        },
        "options": {}
      },
      "name": "Call AI Suggestion API",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.success}}",
              "value2": true
            }
          ]
        }
      },
      "name": "Check Success",
      "type": "n8n-nodes-base.if",
      "position": [650, 300]
    },
    {
      "parameters": {
        "url": "={{$env.SLACK_WEBHOOK_URL}}",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "text",
              "value": "=✅ AI generated {{$json.count}} new topic suggestions!"
            }
          ]
        }
      },
      "name": "Notify Success (Slack)",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 250]
    }
  ],
  "connections": {
    "Schedule - Every Morning 6 AM": {
      "main": [[{ "node": "Call AI Suggestion API", "type": "main", "index": 0 }]]
    },
    "Call AI Suggestion API": {
      "main": [[{ "node": "Check Success", "type": "main", "index": 0 }]]
    },
    "Check Success": {
      "main": [[{ "node": "Notify Success (Slack)", "type": "main", "index": 0 }]]
    }
  }
}
```

---

## 📝 ইভেন্ট তৈরির ৩টি মোড

### Mode 1: Manual Creator (সম্পূর্ণ ম্যানুয়াল)

**`app/admin/events/create/manual/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import { TagInput } from '@/components/ui/tag-input'
import { Card } from '@/components/ui/card'
import { 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Tag,
  FileText,
  Image as ImageIcon,
  Settings
} from 'lucide-react'

const CATEGORIES = [
  'Sports', 'Politics', 'Crypto', 'Economics',
  'Technology', 'Entertainment', 'World Events',
  'Science', 'Culture', 'Business'
]

const RESOLUTION_METHODS = [
  { value: 'ai_oracle', label: 'AI Oracle (স্বয়ংক্রিয়)' },
  { value: 'manual_admin', label: 'Manual Admin (ম্যানুয়াল)' },
  { value: 'expert_panel', label: 'Expert Panel (বিশেষজ্ঞ)' },
  { value: 'external_oracle', label: 'External API (বহিঃস্থ)' }
]

export default function ManualEventCreator() {
  const router = useRouter()
  const supabase = createClient()
  
  // ফর্ম স্টেট
  const [formData, setFormData] = useState({
    name: '',
    question: '',
    description: '',
    category: 'Sports',
    subcategory: '',
    tags: [] as string[],
    answer1: 'Yes',
    answer2: 'No',
    answer_type: 'binary',
    starts_at: new Date().toISOString(),
    ends_at: '',
    resolution_delay: 60,
    initial_liquidity: 1000,
    image_url: '',
    is_verified: false,
    is_featured: false,
  })

  const [resolutionConfig, setResolutionConfig] = useState({
    primary_method: 'manual_admin',
    fallback_methods: ['manual_admin'],
    ai_oracle_config: {
      sources: [],
      keywords: [],
      confidence_threshold: 90,
      min_sources_required: 3
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ভ্যালিডেশন
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 5) {
      newErrors.name = 'শিরোনাম কমপক্ষে ৫ অক্ষর হতে হবে'
    }

    if (!formData.question || formData.question.length < 20) {
      newErrors.question = 'প্রশ্ন কমপক্ষে ২০ অক্ষর হতে হবে'
    }

    if (!formData.ends_at) {
      newErrors.ends_at = 'শেষ তারিখ প্রয়োজন'
    } else {
      const endDate = new Date(formData.ends_at)
      const startDate = new Date(formData.starts_at)
      if (endDate <= startDate) {
        newErrors.ends_at = 'শেষ তারিখ শুরুর তারিখের পরে হতে হবে'
      }
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'কমপক্ষে ১টি ট্যাগ যোগ করুন'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // স্লাগ জেনারেট
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // সাবমিট
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('ফর্মে ত্রুটি আছে। দয়া করে সংশোধন করুন।')
      return
    }

    setIsSubmitting(true)

    try {
      // ১. ইভেন্ট তৈরি করুন
      const slug = generateSlug(formData.name)
      
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          ...formData,
          slug,
          trading_status: 'pending', // অ্যাডমিন অনুমোদন পর্যন্ত
        })
        .select()
        .single()

      if (eventError) throw eventError

      // ২. Resolution System সেটআপ
      const { error: resolutionError } = await supabase
        .from('resolution_systems')
        .insert({
          event_id: event.id,
          ...resolutionConfig
        })

      if (resolutionError) throw resolutionError

      // ৩. Activity Log
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: 'create_event',
          resource_type: 'event',
          resource_id: event.id,
          new_values: formData,
          reason: 'Manual event creation'
        })

      toast.success('✅ ইভেন্ট সফলভাবে তৈরি হয়েছে!')
      router.push(`/admin/events/${event.id}`)

    } catch (error: any) {
      console.error('Event creation error:', error)
      toast.error(error.message || 'ইভেন্ট তৈরি করতে ব্যর্থ')
    } finally {
      setIsSubmitting(false)
    }
  }

  // প্রিভিউ
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">নতুন ইভেন্ট তৈরি করুন (ম্যানুয়াল)</h1>
        <p className="text-gray-600 dark:text-gray-400">
          সম্পূর্ণ নিয়ন্ত্রণ সহ ম্যানুয়ালি ইভেন্ট তৈরি করুন
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* মূল ফর্ম */}
        <div className="lg:col-span-2 space-y-6">
          {/* মূল তথ্য */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              মূল তথ্য
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  শিরোনাম *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="যেমন: Bitcoin $100K by 2026?"
                  maxLength={255}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  প্রশ্ন (Yes/No Format) *
                </label>
                <Textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="পরিষ্কার এবং যাচাইযোগ্য প্রশ্ন লিখুন যার উত্তর হ্যাঁ বা না হবে"
                  rows={3}
                  maxLength={2000}
                  className={errors.question ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{errors.question || 'কমপক্ষে ২০ অক্ষর'}</span>
                  <span>{formData.question.length}/2000</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  বিস্তারিত বিবরণ (ঐচ্ছিক)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ইভেন্ট সম্পর্কে অতিরিক্ত তথ্য, প্রেক্ষাপট, নিয়ম..."
                  rows={5}
                />
              </div>
            </div>
          </Card>

          {/* ক্যাটাগরি এবং ট্যাগ */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" />
              ক্যাটাগরি এবং ট্যাগ
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    ক্যাটাগরি *
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    সাবক্যাটাগরি (ঐচ্ছিক)
                  </label>
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="যেমন: Cricket, BPL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ট্যাগ *
                </label>
                <TagInput
                  tags={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                  placeholder="ট্যাগ টাইপ করুন এবং Enter চাপুন"
                  className={errors.tags ? 'border-red-500' : ''}
                />
                {errors.tags && (
                  <p className="text-sm text-red-500 mt-1">{errors.tags}</p>
                )}
              </div>
            </div>
          </Card>

          {/* সময় সেটিংস */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              সময় সেটিংস
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    শুরুর তারিখ এবং সময়
                  </label>
                  <DatePicker
                    value={formData.starts_at}
                    onChange={(date) => setFormData({ ...formData, starts_at: date })}
                    showTime
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    শেষের তারিখ এবং সময় *
                  </label>
                  <DatePicker
                    value={formData.ends_at}
                    onChange={(date) => setFormData({ ...formData, ends_at: date })}
                    showTime
                    minDate={formData.starts_at}
                    className={errors.ends_at ? 'border-red-500' : ''}
                  />
                  {errors.ends_at && (
                    <p className="text-sm text-red-500 mt-1">{errors.ends_at}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  রেজোলিউশন ডিলে (মিনিট)
                </label>
                <Input
                  type="number"
                  value={formData.resolution_delay}
                  onChange={(e) => setFormData({ ...formData, resolution_delay: parseInt(e.target.value) })}
                  min={0}
                  max={20160}
                  step={30}
                />
                <p className="text-xs text-gray-500 mt-1">
                  ইভেন্ট শেষ হওয়ার পর রেজোলিউশনের আগে কতক্ষণ অপেক্ষা করতে হবে
                </p>
              </div>
            </div>
          </Card>

          {/* ইমেজ আপলোড */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              ইমেজ আপলোড
            </h2>
            
            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              bucket="event-images"
              path={`events/${generateSlug(formData.name)}`}
            />
          </Card>

          {/* Resolution সেটিংস */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Resolution সেটিংস
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  প্রাথমিক রেজোলিউশন পদ্ধতি
                </label>
                <Select
                  value={resolutionConfig.primary_method}
                  onValueChange={(value) => 
                    setResolutionConfig({ ...resolutionConfig, primary_method: value })
                  }
                >
                  {RESOLUTION_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </Select>
              </div>

              {resolutionConfig.primary_method === 'ai_oracle' && (
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h3 className="font-medium">AI Oracle কনফিগারেশন</h3>
                  
                  <div>
                    <label className="block text-sm mb-2">
                      নিউজ সোর্স (URLs)
                    </label>
                    <TagInput
                      tags={resolutionConfig.ai_oracle_config.sources}
                      onChange={(sources) => 
                        setResolutionConfig({
                          ...resolutionConfig,
                          ai_oracle_config: {
                            ...resolutionConfig.ai_oracle_config,
                            sources
                          }
                        })
                      }
                      placeholder="যেমন: prothomalo.com, dhakatribune.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">
                      কীওয়ার্ড (বাংলা + ইংরেজি)
                    </label>
                    <TagInput
                      tags={resolutionConfig.ai_oracle_config.keywords}
                      onChange={(keywords) => 
                        setResolutionConfig({
                          ...resolutionConfig,
                          ai_oracle_config: {
                            ...resolutionConfig.ai_oracle_config,
                            keywords
                          }
                        })
                      }
                      placeholder="যেমন: Bitcoin, বিটকয়েন, $100K"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">
                      Confidence Threshold: {resolutionConfig.ai_oracle_config.confidence_threshold}%
                    </label>
                    <input
                      type="range"
                      min="70"
                      max="99"
                      value={resolutionConfig.ai_oracle_config.confidence_threshold}
                      onChange={(e) => 
                        setResolutionConfig({
                          ...resolutionConfig,
                          ai_oracle_config: {
                            ...resolutionConfig.ai_oracle_config,
                            confidence_threshold: parseInt(e.target.value)
                          }
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* সাইডবার */}
        <div className="space-y-6">
          {/* প্রিভিউ */}
          <Card className="p-6 sticky top-4">
            <h2 className="text-lg font-semibold mb-4">প্রিভিউ</h2>
            
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'প্রিভিউ লুকান' : 'প্রিভিউ দেখুন'}
            </Button>

            {showPreview && (
              <div className="border rounded-lg p-4 space-y-3">
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                <h3 className="font-semibold">{formData.name || 'শিরোনাম'}</h3>
                <p className="text-sm text-gray-600">{formData.question || 'প্রশ্ন'}</p>
                <div className="flex gap-2 flex-wrap">
                  {formData.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ভ্যালিডেশন চেক */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium mb-2">ভ্যালিডেশন</h3>
              {Object.entries({
                name: formData.name.length >= 5,
                question: formData.question.length >= 20,
                ends_at: !!formData.ends_at,
                tags: formData.tags.length > 0
              }).map(([key, isValid]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={isValid ? 'text-green-600' : 'text-red-600'}>
                    {key === 'name' && 'শিরোনাম'}
                    {key === 'question' && 'প্রশ্ন'}
                    {key === 'ends_at' && 'শেষ তারিখ'}
                    {key === 'tags' && 'ট্যাগ'}
                  </span>
                </div>
              ))}
            </div>

            {/* সাবমিট বাটন */}
            <Button
              className="w-full mt-6"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'ইভেন্ট তৈরি করুন'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

---

### Mode 2: AI-Assisted Creator (সম্পূর্ণ AI)

**`app/admin/events/create/ai-assisted/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  RefreshCw, 
  Check, 
  X,
  TrendingUp,
  Calendar,
  Tag,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AISuggestion {
  id: string
  suggested_title: string
  suggested_question: string
  suggested_description: string
  suggested_category: string
  suggested_subcategory: string
  suggested_tags: string[]
  trending_score: number
  confidence_score: number
  ai_reasoning: string
  source_urls: string[]
  suggested_start_date: string
  suggested_end_date: string
}

export default function AIAssistedCreator() {
  const router = useRouter()
  const supabase = createClient()
  
  const [topic, setTopic] = useState('')
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // AI সাজেশন জেনারেট
  const generateSuggestions = async () => {
    if (!topic.trim()) {
      toast.error('দয়া করে একটি টপিক লিখুন')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/suggest-single-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          variations: 3 // ৩টি ভিন্ন ভ্যারিয়েশন জেনারেট করুন
        })
      })

      if (!response.ok) throw new Error('Failed to generate suggestions')

      const data = await response.json()
      
      // Supabase থেকে saved topics লোড করুন
      const { data: topics } = await supabase
        .from('ai_daily_topics')
        .select('*')
        .in('id', data.topic_ids)
        .order('confidence_score', { ascending: false })

      setSuggestions(topics || [])
      toast.success(`✨ ${topics?.length || 0}টি সাজেশন জেনারেট হয়েছে!`)

    } catch (error: any) {
      console.error('Generation error:', error)
      toast.error('সাজেশন জেনারেট করতে ব্যর্থ')
    } finally {
      setIsGenerating(false)
    }
  }

  // সিলেক্টেড সাজেশন থেকে ইভেন্ট তৈরি
  const createEventFromSuggestion = async (suggestion: AISuggestion) => {
    setIsCreating(true)

    try {
      // ১. Slug জেনারেট
      const slug = suggestion.suggested_title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // ২. ইভেন্ট তৈরি
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          slug,
          name: suggestion.suggested_title,
          question: suggestion.suggested_question,
          description: suggestion.suggested_description,
          category: suggestion.suggested_category,
          subcategory: suggestion.suggested_subcategory,
          tags: suggestion.suggested_tags,
          starts_at: suggestion.suggested_start_date,
          ends_at: suggestion.suggested_end_date,
          trading_status: 'pending',
          is_verified: false,
        })
        .select()
        .single()

      if (eventError) throw eventError

      // ৩. AI Oracle দিয়ে Resolution সেটআপ (ডিফল্ট)
      await supabase
        .from('resolution_systems')
        .insert({
          event_id: event.id,
          primary_method: 'ai_oracle',
          fallback_methods: ['manual_admin'],
          ai_oracle_config: {
            sources: suggestion.source_urls,
            keywords: suggestion.suggested_tags,
            confidence_threshold: 85,
            min_sources_required: 2
          }
        })

      // ৪. AI Topic স্ট্যাটাস আপডেট
      await supabase
        .from('ai_daily_topics')
        .update({
          status: 'converted',
          converted_event_id: event.id
        })
        .eq('id', suggestion.id)

      // ৫. Activity Log
      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user?.id,
          action_type: 'create_event',
          resource_type: 'event',
          resource_id: event.id,
          change_summary: 'Created from AI suggestion',
          reason: `AI-assisted creation from topic: ${topic}`
        })

      toast.success('✅ ইভেন্ট সফলভাবে তৈরি হয়েছে!')
      router.push(`/admin/events/${event.id}`)

    } catch (error: any) {
      console.error('Event creation error:', error)
      toast.error(error.message || 'ইভেন্ট তৈরি করতে ব্যর্থ')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" />
          AI-Assisted Event Creator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          AI দিয়ে স্বয়ংক্রিয়ভাবে ইভেন্ট জেনারেট করুন - শুধু টপিক বলুন
        </p>
      </div>

      {/* ইনপুট সেকশন */}
      <Card className="p-6 mb-8">
        <label className="block text-sm font-medium mb-3">
          আপনি কোন বিষয়ে ইভেন্ট তৈরি করতে চান?
        </label>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="যেমন: 'আগামী BPL এ কোন টিম জিতবে', 'Bitcoin $100K হবে কি 2026 এ', 'পরের নির্বাচনে কে জিতবে'..."
          rows={3}
          className="text-lg"
        />
        
        <Button
          onClick={generateSuggestions}
          disabled={isGenerating || !topic.trim()}
          size="lg"
          className="mt-4 w-full sm:w-auto"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              জেনারেট হচ্ছে...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              AI সাজেশন জেনারেট করুন
            </>
          )}
        </Button>
      </Card>

      {/* সাজেশন লিস্ট */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold mb-4">
              AI সাজেশন ({suggestions.length})
            </h2>

            {suggestions.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  border rounded-lg p-6 transition-all cursor-pointer
                  ${selectedSuggestion === suggestion.id 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950' 
                    : 'hover:border-gray-400 dark:hover:border-gray-600'}
                `}
                onClick={() => setSelectedSuggestion(
                  selectedSuggestion === suggestion.id ? null : suggestion.id
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">
                        {suggestion.suggested_title}
                      </h3>
                      <Badge variant="secondary">
                        {suggestion.suggested_category}
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {suggestion.suggested_question}
                    </p>
                  </div>

                  {/* স্কোর */}
                  <div className="flex gap-2 ml-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {suggestion.confidence_score}
                      </div>
                      <div className="text-xs text-gray-500">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-1" />
                        {suggestion.trending_score}
                      </div>
                      <div className="text-xs text-gray-500">Trending</div>
                    </div>
                  </div>
                </div>

                {/* বিবরণ */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {suggestion.suggested_description}
                </p>

                {/* মেটাডাটা */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      {new Date(suggestion.suggested_start_date).toLocaleDateString('bn-BD')}
                      {' → '}
                      {new Date(suggestion.suggested_end_date).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <div className="flex gap-1 flex-wrap">
                      {suggestion.suggested_tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Reasoning */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        AI যুক্তি:
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {suggestion.ai_reasoning}
                      </p>
                    </div>
                  </div>
                </div>

                {/* সোর্স লিংক */}
                {suggestion.source_urls.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      সোর্স:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.source_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {new URL(url).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* অ্যাকশন বাটন */}
                <div className="flex gap-3">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      createEventFromSuggestion(suggestion)
                    }}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {isCreating ? 'তৈরি হচ্ছে...' : 'এই ইভেন্ট তৈরি করুন'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={async (e) => {
                      e.stopPropagation()
                      await supabase
                        .from('ai_daily_topics')
                        .update({ status: 'rejected' })
                        .eq('id', suggestion.id)
                      setSuggestions(suggestions.filter(s => s.id !== suggestion.id))
                      toast.success('সাজেশন প্রত্যাখ্যান করা হয়েছে')
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* খালি স্টেট */}
      {suggestions.length === 0 && !isGenerating && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            একটি টপিক লিখুন এবং AI সাজেশন জেনারেট করুন
          </p>
        </div>
      )}
    </div>
  )
}
```

---

(চলবে... পরের পার্টে Hybrid Mode, Resolution Systems এবং n8n Workflows রয়েছে)

এই ফাইলটি খুবই বড় হয়ে যাচ্ছে। আমি এটিকে multiple ফাইলে ভাগ করে দিচ্ছি যাতে আপনি সব কিছু সুসংগতভাবে পান।
