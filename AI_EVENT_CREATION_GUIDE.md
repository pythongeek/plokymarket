# Plokymarket AI Event Creation System - Technical Guide

## Executive Summary

This guide documents the **production-ready AI-powered event creation system** for Plokymarket, a Polymarket-style prediction marketplace built for the Bangladesh market. The system uses a **multi-agent AI architecture** combining Vertex AI (Primary) and Kimi API (Secondary/Fallback) with modular service design.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [AI Agent Sequence](#2-ai-agent-sequence)
3. [Tech Stack](#3-tech-stack)
4. [Implementation Details](#4-implementation-details)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Deployment Guide](#7-deployment-guide)
8. [Monitoring & Observability](#8-monitoring--observability)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Event Form  │  │ AI Suggest  │  │  Preview    │  │   Submission    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
└─────────┼────────────────┼────────────────┼──────────────────┼──────────┘
          │                │                │                  │
          ▼                ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js API Routes)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              /api/ai/event-processor (Main Orchestrator)            ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────┐ ││
│  │  │   Slug      │ │ Category    │ │  Content    │ │   Validation   │ ││
│  │  │   Agent     │ │   Agent     │ │   Agent     │ │     Agent      │ ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │              /api/ai/market-resolution (Oracle)                     ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────┐ ││
│  │  │  Retrieval  │ │  Synthesis  │ │ Deliberation│ │  Explanation   │ ││
│  │  │    Agent    │ │    Agent    │ │    Agent    │ │     Agent      │ ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI Model Layer (Vertex AI + Kimi)                     │
│  ┌─────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │     Vertex AI (Primary) │    │      Kimi API (Fallback)            │ │
│  │  ┌───────────────────┐  │    │  ┌─────────────────────────────┐   │ │
│  │  │  Gemini 1.5 Pro   │  │◄───┼──┤  Kimi k1.5 (128K context)   │   │ │
│  │  │  - Complex reasoning│  │    │  - Fast inference             │   │ │
│  │  │  - JSON mode      │  │    │  - Bengali optimized          │   │ │
│  │  └───────────────────┘  │    │  └─────────────────────────────┘   │ │
│  │  ┌───────────────────┐  │    │  ┌─────────────────────────────┐   │ │
│  │  │  Gemini 1.5 Flash │  │◄───┼──┤  Kimi Moonshot v1           │   │ │
│  │  │  - High throughput│  │    │  - Cost efficient             │   │ │
│  │  │  - Quick tasks    │  │    │  - Fallback mode              │   │ │
│  │  └───────────────────┘  │    │  └─────────────────────────────┘   │ │
│  └─────────────────────────┘    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Layer (Supabase)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   events    │  │   markets   │  │ ai_pipelines│  │  event_workflows│ │
│  │  (master)   │  │  (trading)  │  │  (tracking) │  │   (orchestration)│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Agent Communication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Event Creation Workflow                              │
└─────────────────────────────────────────────────────────────────────────┘

Phase 1: Content Optimization (Core Identity Agent)
─────────────────────────────────────────────────────
Input: Raw event title (Bangla/English/Mixed)
  │
  ├─► Transliteration (Bengali → English)
  ├─► SEO optimization for Bangladesh market
  ├─► Slug generation: /[^a-z0-9]/g regex cleaning
  │
  └─► Output: SEO-friendly title + URL-safe slug

Phase 2: Categorization (Local Taxonomy Agent)
─────────────────────────────────────────────────────
Input: Optimized title + description
  │
  ├─► Hierarchical tagging:
  │     ├─ Primary: Politics | Sports | Crypto | Economics | Weather
  │     ├─ Secondary: BPL | Election | Cricket | Football
  │     └─ Special: bd-local (for Bangladesh-specific events)
  │
  ├─► Check: supabase/migrations/059_events_system.sql constraints
  │
  └─► Output: Category tags + confidence scores

Phase 3: Content Generation (Description Agent)
─────────────────────────────────────────────────────
Input: Title + Category + Context
  │
  ├─► Generate description in detected language
  ├─► Add resolution criteria
  ├─► Suggest resolution source
  │
  └─► Output: Complete event description

Phase 4: Validation (Quality Assurance Agent)
─────────────────────────────────────────────────────
Input: Complete event data
  │
  ├─► Fact-check against known sources
  ├─► Check for duplicate events
  ├─► Validate resolution date feasibility
  │
  └─► Output: Validation report + risk score

Phase 5: Market Generation (Trading Agent)
─────────────────────────────────────────────────────
Input: Validated event
  │
  ├─► Generate initial odds (YES/NO)
  ├─► Calculate liquidity requirements
  ├─► Set trading parameters
  │
  └─► Output: Market configuration ready for deployment
```

---

## 2. AI Agent Sequence

### 2.1 Agent Configuration

| Agent | Model | Temperature | Max Tokens | Purpose |
|-------|-------|-------------|------------|---------|
| Slug Generator | Gemini 1.5 Flash | 0.1 | 256 | Deterministic slug creation |
| Category Classifier | Gemini 1.5 Flash | 0.2 | 512 | Fast categorization |
| Content Generator | Gemini 1.5 Pro | 0.3 | 2048 | Rich description generation |
| Validation Engine | Gemini 1.5 Pro | 0.1 | 1024 | Strict validation |
| Market Configurator | Gemini 1.5 Pro | 0.2 | 1024 | Trading parameters |

### 2.2 Fallback Chain

```typescript
// Primary → Secondary → Tertiary fallback chain
const FALLBACK_CHAIN = [
  { provider: 'vertex', model: 'gemini-1.5-pro' },
  { provider: 'vertex', model: 'gemini-1.5-flash' },
  { provider: 'kimi', model: 'kimi-k1.5' },
  { provider: 'kimi', model: 'moonshot-v1' },
];

// Rotation logic based on failure rate
if (vertexFailureRate > 0.1) {
  primaryProvider = 'kimi';
}
```

### 2.3 Bangladesh-Specific Optimizations

```typescript
// Language detection
const detectLanguage = (text: string): 'bn' | 'en' | 'mixed' => {
  const bengaliChars = /[\u0980-\u09FF]/;
  const hasBengali = bengaliChars.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  
  if (hasBengali && hasEnglish) return 'mixed';
  return hasBengali ? 'bn' : 'en';
};

// SEO keywords for Bangladesh
const BD_SEO_KEYWORDS = {
  politics: ['নির্বাচন', 'ভোট', 'সরকার', 'আওয়ামী লীগ', 'বিএনপি'],
  sports: ['বিপিএল', 'ক্রিকেট', 'ফুটবল', 'টাইগার্স', 'বাংলাদেশ দল'],
  crypto: ['বিটকয়েন', 'ইথেরিয়াম', 'ক্রিপ্টো', 'ব্লকচেইন'],
  economics: ['টাকা', 'ডলার', 'ইকনোমি', 'বাজেট', 'মূল্যস্ফীতি']
};
```

---

## 3. Tech Stack

### 3.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| AI Engine | Vertex AI (Gemini) | 1.5 Pro/Flash | Primary AI processing |
| AI Fallback | Kimi API | k1.5 | Secondary AI provider |
| Orchestration | Upstash Workflow | Latest | Async job processing |
| Alternative | Inngest | Latest | Event-driven workflows |
| Database | Supabase (PostgreSQL) | 15+ | Primary data store |
| Cache | Upstash Redis | Latest | Rate limiting & caching |
| Frontend | Next.js | 15.3 | React framework |
| Styling | Tailwind CSS | 3.4 | UI styling |
| Components | shadcn/ui | Latest | UI components |

### 3.2 Timezone Configuration

```typescript
// All dates stored in UTC, displayed in Asia/Dhaka
const TIMEZONE_CONFIG = {
  default: 'Asia/Dhaka',
  offset: '+06:00',
  displayFormat: 'bn-BD', // Bengali locale
};
```

---

## 4. Implementation Details

### 4.1 Vertex AI Client Setup

```typescript
// lib/ai/vertex-client.ts
import { VertexAI, HarmCategory, HarmBlockThreshold } from "@google-cloud/vertexai";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
const LOCATION = process.env.VERTEX_LOCATION || "asia-south1"; // Mumbai for BD latency

export const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
  googleAuthOptions: {
    credentials: JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64!, "base64").toString()
    ),
  },
});

export const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Model factory for event creation agents
export function getEventCreationModel(
  modelName: string, 
  systemInstruction: string,
  temperature: number = 0.2
) {
  return vertexAI.getGenerativeModel({
    model: modelName,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature,
      maxOutputTokens: 2048,
      responseMimeType: "application/json", // Force structured output
    },
  });
}
```

### 4.2 Event Creation Agents

#### 4.2.1 Slug Generation Agent

```typescript
// lib/ai/agents/slugAgent.ts
import { getEventCreationModel } from "../vertex-client";

const SLUG_AGENT_PROMPT = `
You are a URL slug generator for a Bangladesh prediction market platform.

TASK: Convert event titles into SEO-friendly, URL-safe slugs.

RULES:
1. Transliterate Bengali text to English romanization
2. Use only lowercase letters, numbers, and hyphens
3. Remove all special characters
4. Keep it under 60 characters
5. Include relevant keywords for Bangladesh market

EXAMPLES:
Input: "বিপিএল ২০২৫ ফাইনালে কুমিল্লা জিতবে?"
Output: {"slug": "bpl-2025-final-comilla-winner", "title": "BPL 2025 Final: Will Comilla Win?"}

Input: "ঢাকার তাপমাত্রা ৩৫ ডিগ্রি ছাড়াবে?"
Output: {"slug": "dhaka-temperature-35-degree", "title": "Will Dhaka Temperature Exceed 35°C?"}

Respond in JSON format only.
`;

export async function generateSlug(title: string) {
  const model = getEventCreationModel("gemini-1.5-flash", SLUG_AGENT_PROMPT, 0.1);
  
  const result = await model.generateContent(`
    Generate slug for: "${title}"
    Respond in JSON: {"slug": "...", "title": "...", "keywords": [...]}
  `);
  
  const text = result.response.candidates![0].content.parts[0].text!;
  return JSON.parse(text.match(/\{[\s\S]*\}/)![0]);
}
```

#### 4.2.2 Category Classification Agent

```typescript
// lib/ai/agents/categoryAgent.ts
const CATEGORY_AGENT_PROMPT = `
You are a category classifier for Bangladesh prediction markets.

CATEGORIES (with confidence threshold 0.7):
- politics: Elections, government, political events
- sports: Cricket, football, BPL, international sports
- crypto: Bitcoin, Ethereum, cryptocurrency prices
- economics: Stock market, GDP, inflation, exchange rates
- weather: Temperature, rainfall, cyclones, natural disasters
- entertainment: Movies, celebrities, awards
- technology: Tech launches, AI, social media
- international: Global events affecting Bangladesh

SPECIAL TAGS:
- bd-local: Event primarily concerning Bangladesh
- high-impact: Major national significance
- time-sensitive: Requires quick resolution

Respond in JSON:
{
  "primary": "category_name",
  "secondary": ["sub_category"],
  "tags": ["bd-local", "high-impact"],
  "confidence": 0.92,
  "reasoning": "brief explanation"
}
`;

export async function classifyCategory(title: string, description?: string) {
  const model = getEventCreationModel("gemini-1.5-flash", CATEGORY_AGENT_PROMPT, 0.2);
  
  const result = await model.generateContent(`
    Title: "${title}"
    Description: "${description || ''}"
    Classify this event.
  `);
  
  const text = result.response.candidates![0].content.parts[0].text!;
  return JSON.parse(text.match(/\{[\s\S]*\}/)![0]);
}
```

#### 4.2.3 Content Generation Agent

```typescript
// lib/ai/agents/contentAgent.ts
const CONTENT_AGENT_PROMPT = `
You are a content writer for Bangladesh prediction markets.

TASK: Generate compelling event descriptions with clear resolution criteria.

REQUIREMENTS:
1. Description must be in the same language as the title
2. Include specific resolution criteria
3. Mention authoritative source for resolution
4. Add relevant context for Bangladesh audience
5. Specify exact resolution date/time in Asia/Dhaka timezone

RESOLUTION CRITERIA TEMPLATE:
- What constitutes YES outcome
- What constitutes NO outcome
- What happens in edge cases
- Source of truth for resolution

BANGLADESH AUTHORITIES:
- Elections: Bangladesh Election Commission (eci.gov.bd)
- Cricket: Bangladesh Cricket Board (tigercricket.com.bd)
- Weather: Bangladesh Meteorological Department (bmd.gov.bd)
- Stocks: Dhaka Stock Exchange (dse.com.bd)
- Economy: Bangladesh Bank (bb.org.bd)

Respond in JSON:
{
  "description": "full description in appropriate language",
  "resolutionCriteria": "clear criteria",
  "resolutionSource": "authority name and URL",
  "context": "additional context",
  "language": "bn|en|mixed"
}
`;

export async function generateContent(title: string, category: string) {
  const model = getEventCreationModel("gemini-1.5-pro", CONTENT_AGENT_PROMPT, 0.3);
  
  const result = await model.generateContent(`
    Title: "${title}"
    Category: ${category}
    Generate complete event content.
  `);
  
  const text = result.response.candidates![0].content.parts[0].text!;
  return JSON.parse(text.match(/\{[\s\S]*\}/)![0]);
}
```

### 4.3 API Routes

#### 4.3.1 Main Event Processor

```typescript
// app/api/ai/event-processor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "@/lib/ai/agents/slugAgent";
import { classifyCategory } from "@/lib/ai/agents/categoryAgent";
import { generateContent } from "@/lib/ai/agents/contentAgent";
import { validateEvent } from "@/lib/ai/agents/validationAgent";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120; // 2 minutes for complex generation

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse input
    const { title, context = {} } = await req.json();
    
    if (!title || title.length < 10) {
      return NextResponse.json(
        { error: "Title must be at least 10 characters" },
        { status: 400 }
      );
    }
    
    // Step 1: Generate slug and optimize title
    const slugResult = await generateSlug(title);
    
    // Step 2: Classify category
    const categoryResult = await classifyCategory(slugResult.title);
    
    // Step 3: Generate content
    const contentResult = await generateContent(
      slugResult.title,
      categoryResult.primary
    );
    
    // Step 4: Validate
    const validationResult = await validateEvent({
      title: slugResult.title,
      slug: slugResult.slug,
      category: categoryResult.primary,
      description: contentResult.description,
    });
    
    // Store in database
    const { data: event, error } = await supabase
      .from("events")
      .insert({
        title: slugResult.title,
        slug: slugResult.slug,
        category: categoryResult.primary,
        subcategories: categoryResult.secondary,
        tags: categoryResult.tags,
        description: contentResult.description,
        resolution_criteria: contentResult.resolutionCriteria,
        resolution_source: contentResult.resolutionSource,
        language: contentResult.language,
        validation_score: validationResult.score,
        validation_risks: validationResult.risks,
        created_by: user.id,
        status: validationResult.score > 0.8 ? "approved" : "pending_review",
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      event,
      aiGenerated: {
        slug: slugResult,
        category: categoryResult,
        content: contentResult,
        validation: validationResult,
      },
    });
    
  } catch (error) {
    console.error("[Event Processor] Error:", error);
    return NextResponse.json(
      { error: "Processing failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
```

### 4.4 Kimi API Fallback

```typescript
// lib/ai/kimi-client.ts
const KIMI_API_KEY = process.env.KIMI_API_KEY!;
const KIMI_BASE_URL = "https://api.moonshot.cn/v1";

export async function callKimiAPI(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.2
) {
  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KIMI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: "json_object" },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status}`);
  }
  
  return response.json();
}

// Fallback wrapper
export async function generateWithFallback(
  vertexFn: () => Promise<any>,
  kimiFn: () => Promise<any>
) {
  try {
    return await vertexFn();
  } catch (error) {
    console.warn("[AI Fallback] Vertex AI failed, switching to Kimi:", error);
    return await kimiFn();
  }
}
```

---

## 5. Database Schema

### 5.1 Events Table

```sql
-- supabase/migrations/060_ai_events_system.sql

-- Events table with AI-generated fields
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Categorization
    category VARCHAR(50) NOT NULL,
    subcategories TEXT[],
    tags TEXT[],
    
    -- Resolution
    resolution_criteria TEXT,
    resolution_source VARCHAR(255),
    resolution_date TIMESTAMPTZ,
    
    -- AI metadata
    language VARCHAR(10) DEFAULT 'en',
    validation_score DECIMAL(3,2),
    validation_risks JSONB,
    ai_generation_metadata JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, pending_review, approved, rejected
    
    -- Timestamps
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_category CHECK (category IN (
        'politics', 'sports', 'crypto', 'economics', 
        'weather', 'entertainment', 'technology', 'international'
    )),
    CONSTRAINT valid_status CHECK (status IN (
        'draft', 'pending_review', 'approved', 'rejected', 'published'
    ))
);

-- Indexes
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_slug ON events(slug);

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved events"
    ON events FOR SELECT
    USING (status IN ('approved', 'published'));

CREATE POLICY "Admins can manage all events"
    ON events FOR ALL
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    ));

CREATE POLICY "Users can view their own drafts"
    ON events FOR SELECT
    USING (created_by = auth.uid());
```

### 5.2 AI Pipeline Tracking

```sql
-- AI generation pipeline tracking
CREATE TABLE ai_event_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    
    -- Pipeline stages
    stage VARCHAR(50) NOT NULL, -- slug_gen, category, content, validation
    provider VARCHAR(20) NOT NULL, -- vertex, kimi
    model VARCHAR(50) NOT NULL,
    
    -- Input/Output
    input_payload JSONB,
    output_payload JSONB,
    
    -- Performance
    latency_ms INTEGER,
    tokens_used INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'success', -- success, failed, fallback_used
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_pipelines_event ON ai_event_pipelines(event_id);
CREATE INDEX idx_ai_pipelines_stage ON ai_event_pipelines(stage);
```

---

## 6. API Reference

### 6.1 Event Creation Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/ai/event-processor` | POST | Main event creation | User |
| `/api/ai/suggest-field` | POST | Suggest single field | User |
| `/api/ai/auto-fill-form` | POST | Auto-fill entire form | User |
| `/api/ai/validate-event` | POST | Validate event data | User |
| `/api/admin/events/create-from-ai` | POST | Admin AI creation | Admin |

### 6.2 Request/Response Examples

#### Create Event with AI

```bash
POST /api/ai/event-processor
Content-Type: application/json

{
  "title": "বিপিএল ২০২৫ ফাইনালে কুমিল্লা জিতবে?",
  "context": {
    "suggested_category": "sports",
    "resolution_date": "2025-02-15T18:00:00+06:00"
  }
}
```

```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "BPL 2025 Final: Will Comilla Win?",
    "slug": "bpl-2025-final-comilla-winner",
    "category": "sports",
    "subcategories": ["cricket", "bpl"],
    "tags": ["bd-local", "high-impact"],
    "description": "...",
    "resolution_criteria": "...",
    "resolution_source": "Bangladesh Cricket Board (tigercricket.com.bd)",
    "language": "mixed",
    "validation_score": 0.92,
    "status": "approved"
  },
  "aiGenerated": {
    "slug": {
      "slug": "bpl-2025-final-comilla-winner",
      "title": "BPL 2025 Final: Will Comilla Win?",
      "keywords": ["bpl", "2025", "final", "comilla", "cricket"]
    },
    "category": {
      "primary": "sports",
      "secondary": ["cricket", "bpl"],
      "tags": ["bd-local", "high-impact"],
      "confidence": 0.98
    },
    "validation": {
      "score": 0.92,
      "risks": [],
      "recommendation": "approve"
    }
  }
}
```

---

## 7. Deployment Guide

### 7.1 Environment Variables

```bash
# Vertex AI Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
VERTEX_LOCATION=asia-south1
GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=<base64-encoded-service-account-json>

# Kimi API Configuration (Fallback)
KIMI_API_KEY=your-kimi-api-key

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Workflow Orchestration
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key

# Security
ORACLE_API_KEY=your-internal-api-key
CRON_SECRET=your-cron-secret
```

### 7.2 Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/ai/event-processor/route.ts": {
      "maxDuration": 120,
      "memory": 1024
    },
    "app/api/ai-oracle/resolve/route.ts": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "crons": [
    {
      "path": "/api/cron/check-markets",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/daily-ai-topics",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### 7.3 Deployment Steps

```bash
# 1. Install dependencies
npm install @google-cloud/vertexai

# 2. Run database migrations
supabase migration up

# 3. Deploy to Vercel
vercel --prod

# 4. Set environment variables in Vercel Dashboard
# Project Settings > Environment Variables

# 5. Test the deployment
curl -X POST https://your-domain.com/api/ai/event-processor \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Event"}'
```

---

## 8. Monitoring & Observability

### 8.1 Health Check Endpoint

```typescript
// app/api/ai/health/route.ts
import { NextResponse } from "next/server";
import { vertexAI } from "@/lib/ai/vertex-client";

export async function GET() {
  const checks = {
    vertex: await checkVertexHealth(),
    kimi: await checkKimiHealth(),
    database: await checkDatabaseHealth(),
    cache: await checkCacheHealth(),
  };
  
  const allHealthy = Object.values(checks).every(c => c.healthy);
  
  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
```

### 8.2 Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `ai_request_latency` | End-to-end latency | > 5s |
| `ai_fallback_rate` | Kimi fallback percentage | > 10% |
| `ai_validation_score` | Average validation score | < 0.7 |
| `event_creation_rate` | Events created per hour | - |
| `pipeline_failure_rate` | Failed pipelines | > 5% |

---

## Appendix A: Bangladesh-Specific Constants

```typescript
// lib/ai/constants/bangladesh.ts

export const BD_CITIES = [
  'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna',
  'barisal', 'rangpur', 'mymensingh', 'comilla', 'narayanganj'
];

export const BD_POLITICAL_PARTIES = [
  'awami league', 'bnp', 'bangladesh nationalist party',
  'jamaat-e-islami', 'jatiya party'
];

export const BD_CRICKET_TEAMS = [
  'comilla victorians', 'dhaka capitals', 'chattogram challengers',
  'sylhet strikers', 'khulna tigers', 'rangpur riders'
];

export const BD_AUTHORITIES = {
  election: { name: 'Bangladesh Election Commission', url: 'eci.gov.bd' },
  cricket: { name: 'Bangladesh Cricket Board', url: 'tigercricket.com.bd' },
  weather: { name: 'Bangladesh Meteorological Dept', url: 'bmd.gov.bd' },
  stocks: { name: 'Dhaka Stock Exchange', url: 'dse.com.bd' },
  bank: { name: 'Bangladesh Bank', url: 'bb.org.bd' },
};
```

---

## Appendix B: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Vertex AI timeout | Complex generation | Increase maxDuration to 300s |
| JSON parse error | Malformed AI response | Add retry with stricter prompt |
| Rate limit exceeded | Too many requests | Implement exponential backoff |
| Bengali text garbled | Encoding issue | Ensure UTF-8 throughout pipeline |

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-02-26  
**Maintained by:** Plokymarket AI Team
