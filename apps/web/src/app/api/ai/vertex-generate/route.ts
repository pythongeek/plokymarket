/**
 * Vertex AI Generation API
 * Server-side endpoint for Vertex AI calls
 * Supports content, market-logic, timing, and risk generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Setup conditional authentication options
function getAuthOptions() {
  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

  if (base64Key) {
    try {
      // Production/Vercel: Use the decoded Base64 key
      const credentials = JSON.parse(
        Buffer.from(base64Key, 'base64').toString('utf-8')
      );
      return { credentials };
    } catch (error) {
      console.error('[Vertex API] Failed to parse Base64 key:', error);
    }
  }

  // Local: Return empty object to let the SDK find local 'gcloud' credentials
  return {};
}

// Initialize Vertex AI
function initVertexAI(): VertexAI | null {
  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.VERTEX_LOCATION || 'us-central1';

    if (!project) {
      console.warn('[Vertex API] GOOGLE_CLOUD_PROJECT not set');
      return null;
    }

    return new VertexAI({
      project,
      location,
      googleAuthOptions: getAuthOptions()
    });
  } catch (error) {
    console.error('[Vertex API] Failed to init:', error);
    return null;
  }
}

// Content generation prompt
function getContentPrompt(context: any): string {
  return `
You are a content optimization AI for a Bangladeshi prediction market platform.
Analyze this raw input and generate an optimized event:

Raw Input: "${context.rawInput || context.title}"

Generate:
1. An engaging Bengali title (SEO optimized, include year if relevant)
2. A compelling description in Bengali
3. Category (Sports, Politics, Crypto, Weather, Entertainment, Other)
4. Subcategory
5. Relevant tags (array)
6. SEO score (0-100)

Respond ONLY in this JSON format:
{
  "title": "...",
  "description": "...",
  "category": "...",
  "subcategory": "...",
  "tags": ["..."],
  "seoScore": number
}
`;
}

// Market logic prompt
function getMarketLogicPrompt(context: any): string {
  return `
Analyze this prediction market and determine optimal settings:

Title: "${context.title}"
Category: ${context.category || 'Unknown'}
Current Outcomes: ${JSON.stringify(context.outcomes || [])}

Determine:
1. Market type (binary/categorical/scalar)
2. Optimal outcomes array in Bengali
3. Recommended liquidity (BDT)
4. Trading fee percentage
5. Min/max trade amounts

Respond in JSON:
{
  "marketType": "binary|categorical|scalar",
  "outcomes": ["..."],
  "liquidity": number,
  "tradingFee": 0.02,
  "minTrade": 10,
  "maxTrade": 1000
}
`;
}

// Timing prompt
function getTimingPrompt(context: any): string {
  return `
Analyze timing for this Bangladeshi prediction market:

Title: "${context.title}"
Category: ${context.category || 'Unknown'}
Current Time: ${new Date().toISOString()}

Determine:
1. When should trading close? (ISO-8601 format, Asia/Dhaka timezone)
2. When should the event resolve? (ISO-8601 format)
3. Any timing warnings?

For sports events, close trading 5 minutes before match starts.

Respond in JSON:
{
  "tradingClosesAt": "2025-02-26T14:00:00+06:00",
  "resolutionDate": "2025-02-26T20:00:00+06:00",
  "warnings": []
}
`;
}

// Risk assessment prompt
function getRiskPrompt(context: any): string {
  return `
Assess compliance and risk for this Bangladeshi prediction market:

Title: "${context.title}"
Description: "${context.description || ''}"
Category: ${context.category || 'Unknown'}

Check for:
1. Bangladesh Cyber Security Law 2023 compliance
2. Political sensitivity
3. Gambling policy (ensure it's skill-based prediction, not luck)
4. Platform Terms of Service

Respond in JSON:
{
  "isSafe": true/false,
  "riskScore": 0-100,
  "violations": ["..."],
  "recommendations": ["..."],
  "policyChecks": {
    "cyberSecurityLaw": true/false,
    "termsOfService": true/false,
    "gamblingPolicy": true/false,
    "politicalSensitivity": true/false
  }
}
`;
}

// Market proposal prompt
function getMarketProposalPrompt(context: any): string {
  return `
Analyze this Bangladeshi prediction market event and propose optimal markets.

Event Title: "${context.title}"
Description: "${context.description || ''}"
Category: ${context.category || 'Unknown'}

Propose:
1. Primary market (main prediction)
2. 1-2 secondary markets (side predictions)

For each market provide:
- name (Bengali)
- question (Bengali)
- type (binary/categorical/scalar)
- outcomes (array in Bengali)
- suggestedLiquidity (number in BDT)
- reasoning (English or Bengali)

Respond ONLY in this JSON format:
{
  "primaryMarket": { "name": "...", "question": "...", "type": "...", "outcomes": [...], "suggestedLiquidity": number, "reasoning": "..." },
  "secondaryMarkets": [
    { "name": "...", "question": "...", "type": "...", "outcomes": [...], "suggestedLiquidity": number, "reasoning": "..." }
  ],
  "totalSuggestedLiquidity": number
}
`;
}

/**
 * POST: Generate content using Vertex AI
 */
export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[Vertex API][${requestId}] Request received`);

  try {
    // Check Environment Variables (Diagnostic)
    const envStatus = {
      project: !!process.env.GOOGLE_CLOUD_PROJECT,
      location: !!process.env.VERTEX_LOCATION,
      serviceAccount: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      kimiKey: !!process.env.KIMI_API_KEY,
    };
    console.log(`[Vertex API][${requestId}] Env status:`, envStatus);

    // Authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn(`[Vertex API][${requestId}] Unauthorized:`, authError?.message);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await req.json();
    console.log(`[Vertex API][${requestId}] Payload:`, JSON.stringify(body, null, 2));

    const { type, context } = body;

    if (!type || !context) {
      console.error(`[Vertex API][${requestId}] Missing type or context`);
      return NextResponse.json(
        { error: 'Missing type or context' },
        { status: 400 }
      );
    }

    // Initialize Vertex AI
    const vertex = initVertexAI();
    if (!vertex) {
      console.error(`[Vertex API][${requestId}] Initialization failed`);
      return NextResponse.json(
        { error: 'Vertex AI not initialized' },
        { status: 500 }
      );
    }

    // Get appropriate prompt
    let prompt: string;
    switch (type) {
      case 'content':
        prompt = getContentPrompt(context);
        break;
      case 'market-logic':
        prompt = getMarketLogicPrompt(context);
        break;
      case 'timing':
        prompt = getTimingPrompt(context);
        break;
      case 'risk':
        prompt = getRiskPrompt(context);
        break;
      case 'market-proposal':
        prompt = getMarketProposalPrompt(context);
        break;
      default:
        console.error(`[Vertex API][${requestId}] Invalid type: ${type}`);
        return NextResponse.json(
          { error: 'Invalid type', received: type },
          { status: 400 }
        );
    }

    console.log(`[Vertex API][${requestId}] Prompt selection successful: ${type}`);

    // Generate content
    const model = vertex.preview.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    console.log(`[Vertex API][${requestId}] Calling model...`);
    const result = await model.generateContent(prompt);

    // Robust text extraction from Vertex AI response
    const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log(`[Vertex API][${requestId}] Raw AI response:`, response);

    if (!response) {
      console.error(`[Vertex API][${requestId}] Empty response from model`);
      return NextResponse.json(
        { error: 'Empty response from Vertex AI' },
        { status: 500 }
      );
    }

    // Extract JSON
    let parsed;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error(`[Vertex API][${requestId}] Parse error:`, parseError);
      return NextResponse.json(
        { error: 'Invalid JSON response', raw: response },
        { status: 500 }
      );
    }

    // Return the parsed result directly if it matches the expected structure
    // This allows for more flexible AI responses
    console.log(`[Vertex API][${requestId}] Success`);
    return NextResponse.json({
      success: true,
      result: parsed,
      provider: 'vertex',
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

  } catch (error) {
    console.error(`[Vertex API][${requestId}] Global Error:`, error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error as any)?.stack : undefined
      },
      { status: 500 }
    );
  }
}
