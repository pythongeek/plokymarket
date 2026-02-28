/**
 * Vertex AI Generation API
 * Server-side endpoint for Vertex AI calls
 * Supports content, market-logic, timing, and risk generation
 * 
 * Models (Industry Standard - Stable):
 * - gemini-1.5-flash-002 → Fast tasks: slug, classify, risk
 * - gemini-1.5-pro-002   → Complex: content, market logic
 * 
 * Region: asia-south1 (Mumbai) for low latency in Bangladesh
 */

import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// ─── Model Constants ──────────────────────────────────────────────────────────
// Latest stable model IDs from Google Cloud Vertex AI
// Reference: https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini
const FAST_MODEL = 'gemini-1.5-flash-002';  // Fast, cost-effective tasks (latest stable)
const PRO_MODEL = 'gemini-1.5-pro-002';    // Complex reasoning tasks (latest stable)

// ─── Auth Setup ───────────────────────────────────────────────────────────────
function getAuthOptions() {
  // Try Gemini API Key first (for API key based auth)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    return { apiKey: geminiApiKey };
  }

  // Fallback to Service Account
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    try {
      const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
      const credentials = JSON.parse(decodedKey);

      // Fix potential literal newline escaping issues common in Vercel envs
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }

      return { credentials };
    } catch (error) {
      console.error('[Vertex API] Failed to parse Base64 key:', error);
    }
  }
  return {};
}

/**
 * Initialize Vertex AI
 * Uses API key if available, otherwise service account
 */
function initVertexAI(): VertexAI | null {
  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // For API key auth, we use global endpoint
    const location = geminiApiKey ? 'global' : (process.env.VERTEX_LOCATION || 'us-central1');

    if (!project && !geminiApiKey) {
      console.warn('[Vertex API] Neither GOOGLE_CLOUD_PROJECT nor GEMINI_API_KEY set');
      return null;
    }

    console.log(`[Vertex API] Initializing with ${geminiApiKey ? 'API Key' : 'Service Account'}, location: ${location}`);

    const authOptions = getAuthOptions();

    // If using API key, we use a different initialization
    if (geminiApiKey) {
      return new VertexAI({
        project: project || 'gen-lang-client-0578182636',
        location: location,
        googleAuthOptions: authOptions
      });
    }

    return new VertexAI({
      project: project,
      location: location,
      googleAuthOptions: authOptions
    });
  } catch (error) {
    console.error('[Vertex API] Failed to init:', error);
    return null;
  }
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

function getContentPrompt(context: any): string {
  return `
You are a content optimization AI for a Bangladeshi prediction market platform called Plokymarket.
Analyze this raw input and generate an optimized event.

Raw Input: "${context.rawInput || context.title}"

Generate:
1. An engaging Bengali title (SEO optimized, include year if relevant)
2. A compelling description in Bengali (2-3 sentences)
3. Category: one of [Sports, Politics, Crypto, Weather, Entertainment, Other]
4. Subcategory (specific)
5. Relevant tags array (5-8 tags, mix Bengali and English)
6. SEO score 0-100

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "title": "...",
  "description": "...",
  "category": "...",
  "subcategory": "...",
  "tags": ["..."],
  "seoScore": 0
}`;
}

function getMarketLogicPrompt(context: any): string {
  return `
Analyze this Bangladeshi prediction market and determine optimal settings.

Title: "${context.title}"
Category: ${context.category || 'Unknown'}
Current Outcomes: ${JSON.stringify(context.outcomes || [])}

Determine:
1. Market type: binary, categorical, or scalar
2. Optimal outcomes array in Bengali (2-4 outcomes)
3. Recommended liquidity in BDT (min 1000)
4. Trading fee as decimal (0.01-0.05)
5. Min/max trade amounts in BDT

Respond ONLY in this JSON format:
{
  "marketType": "binary",
  "outcomes": ["হ্যাঁ", "না"],
  "liquidity": 10000,
  "tradingFee": 0.02,
  "minTrade": 10,
  "maxTrade": 10000
}`;
}

function getTimingPrompt(context: any): string {
  const now = new Date().toISOString();
  return `
Analyze timing for this Bangladeshi prediction market.

Title: "${context.title}"
Category: ${context.category || 'Unknown'}
Current Time (UTC): ${now}
Bangladesh is UTC+6 (Asia/Dhaka)

Rules:
- For sports events: close trading 30 minutes before match starts
- For crypto: use short windows (hours to days)
- For politics: longer windows (days to weeks)
- Resolution date should be after trading closes

Respond ONLY in this JSON format (use Asia/Dhaka offset +06:00):
{
  "tradingClosesAt": "2026-03-15T14:00:00+06:00",
  "resolutionDate": "2026-03-15T22:00:00+06:00",
  "warnings": []
}`;
}

function getRiskPrompt(context: any): string {
  return `
Assess compliance and risk for this Bangladeshi prediction market.

Title: "${context.title}"
Description: "${context.description || ''}"
Category: ${context.category || 'Unknown'}

Check:
1. Bangladesh Cyber Security Act 2023 compliance
2. Political sensitivity (elections, govt officials)
3. Gambling law (must be skill-based prediction, not pure luck)
4. Religious/cultural sensitivity
5. Privacy concerns

Respond ONLY in this JSON format:
{
  "isSafe": true,
  "riskScore": 0,
  "violations": [],
  "recommendations": [],
  "policyChecks": {
    "cyberSecurityAct": true,
    "termsOfService": true,
    "gamblingPolicy": true,
    "politicalSensitivity": true,
    "culturalSensitivity": true
  }
}`;
}

function getMarketProposalPrompt(context: any): string {
  return `
You are an expert prediction market designer for Plokymarket, a Bangladeshi platform.

Event Title: "${context.title}"
Description: "${context.description || ''}"
Category: ${context.category || 'Unknown'}

Design optimal markets for this event. Create:
1. One primary market (the main prediction question)
2. One or two secondary markets (interesting side predictions)

For each market:
- name: short Bengali label
- question: full Bengali prediction question ending with "?"
- type: "binary" (yes/no) or "categorical" (multiple choices)
- outcomes: Bengali outcome labels array
- suggestedLiquidity: initial liquidity in BDT (1000-50000)
- reasoning: brief explanation (Bengali or English)

Respond ONLY in this JSON format:
{
  "primaryMarket": {
    "name": "...",
    "question": "...",
    "type": "binary",
    "outcomes": ["হ্যাঁ", "না"],
    "suggestedLiquidity": 10000,
    "reasoning": "..."
  },
  "secondaryMarkets": [
    {
      "name": "...",
      "question": "...",
      "type": "binary",
      "outcomes": ["হ্যাঁ", "না"],
      "suggestedLiquidity": 5000,
      "reasoning": "..."
    }
  ],
  "totalSuggestedLiquidity": 15000
}`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Vertex API][${requestId}] Request received`);

  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, context } = body;

    if (!type || !context) {
      return NextResponse.json({ error: 'Missing type or context' }, { status: 400 });
    }

    // Init Vertex AI
    const vertex = initVertexAI();
    if (!vertex) {
      return NextResponse.json(
        { error: 'Vertex AI not initialized — check GOOGLE_CLOUD_PROJECT env var' },
        { status: 500 }
      );
    }

    // Select prompt + model
    let prompt: string;
    let modelName: string;

    switch (type) {
      case 'content':
        prompt = getContentPrompt(context);
        modelName = PRO_MODEL;
        break;
      case 'market-logic':
        prompt = getMarketLogicPrompt(context);
        modelName = FAST_MODEL;
        break;
      case 'timing':
        prompt = getTimingPrompt(context);
        modelName = FAST_MODEL;
        break;
      case 'risk':
        prompt = getRiskPrompt(context);
        modelName = FAST_MODEL;
        break;
      case 'market-proposal':
        prompt = getMarketProposalPrompt(context);
        modelName = PRO_MODEL;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type', received: type, validTypes: ['content', 'market-logic', 'timing', 'risk', 'market-proposal'] },
          { status: 400 }
        );
    }

    console.log(`[Vertex API][${requestId}] Using model: ${modelName} for type: ${type}`);

    // Generate
    const model = vertex.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: type === 'risk' ? 0.1 : 0.3,
        responseMimeType: 'application/json',
      },
      tools: [{
        // @ts-ignore
        googleSearchRetrieval: {
          disableAttribution: false,
        } as any
      }]
    });

    console.log(`[Vertex API][${requestId}] Calling ${modelName}...`);
    const result = await model.generateContent(prompt);
    const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!response) {
      console.error(`[Vertex API][${requestId}] Empty response from model`);
      return NextResponse.json({ error: 'Empty response from Vertex AI' }, { status: 500 });
    }

    // Parse JSON
    let parsed: any;
    try {
      // Try direct parse first (responseMimeType: application/json should give clean JSON)
      try {
        parsed = JSON.parse(response);
      } catch {
        // Fallback: extract from code block or raw braces
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || response.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        parsed = JSON.parse(jsonMatch[1].trim());
      }
    } catch (parseError) {
      console.error(`[Vertex API][${requestId}] Parse error:`, parseError, '\nRaw:', response);
      return NextResponse.json(
        { error: 'Invalid JSON from model', raw: response },
        { status: 500 }
      );
    }

    // Make sure 'totalSuggestedLiquidity' exists for older UI compatibility
    if (type === 'market-proposal' && !parsed.totalSuggestedLiquidity) {
      const primaryLiq = parsed.primaryMarket?.suggestedLiquidity || 0;
      const secondaryLiq = (parsed.secondaryMarkets || []).reduce((sum: number, m: any) => sum + (m.suggestedLiquidity || 0), 0);
      parsed.totalSuggestedLiquidity = primaryLiq + secondaryLiq + 1000;
    }

    console.log(`[Vertex API][${requestId}] Success with ${modelName}`);

    return NextResponse.json({
      success: true,
      result: parsed,
      provider: 'vertex',
      model: modelName,
    }, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

  } catch (error: any) {
    // Detect quota/model errors specifically
    const msg = error?.message || '';
    const isModelError = msg.includes('not found') || msg.includes('deprecated') || msg.includes('not supported');
    const isQuotaError = msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');

    console.error(`[Vertex API][${requestId}] Error [${isModelError ? 'MODEL' : isQuotaError ? 'QUOTA' : 'GENERAL'}]:`, error);

    return NextResponse.json(
      {
        error: isModelError ? 'Model unavailable — check Vertex AI model access'
          : isQuotaError ? 'Quota exceeded — try again later'
            : 'Internal Server Error',
        message: msg,
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
      { status: 500 }
    );
  }
}
