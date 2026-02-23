/**
 * AI Field Suggestion API
 * Provides field-level AI suggestions with Bangladesh context
 * Edge Function optimized for Vercel Free Tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

// Bangladesh context prompts
const FIELD_PROMPTS: Record<string, (data: any) => string> = {
  name: (data) => `
You are an AI assistant for Plokymarket, a Bangladesh prediction market platform.
Suggest a catchy, engaging event title based on the context.

Current Title: "${data.name || 'empty'}"
Category: ${data.category}
Context: ${data.description || 'N/A'}

=== BANGLADESH CONTEXT ===
Sports: BPL, Cricket, Football - use team names like Dhaka, Chattogram, Khulna, Cumilla
Politics: Elections, City Corporation - use party names, leader names
Economy: USD-BDT rate, inflation, stock market
Entertainment: Bollywood, Dhallywood, K-pop

REQUIREMENTS:
- Catchy title in Bengali/English mix
- Max 100 characters
- Include key terms for searchability
- Clear prediction topic

Return JSON:
{
  "value": "suggested title",
  "confidence": 85,
  "reasoning": "why this title works",
  "alternatives": ["alt1", "alt2"]
}
`,

  question: (data) => `
Formulate a clear Yes/No prediction question for this event.

Title: "${data.name}"
Current Question: "${data.question || 'empty'}"
Category: ${data.category}

=== REQUIREMENTS ===
- Clear Yes/No answer
- Verifiable outcome
- Specific timeframe
- Unambiguous language
- Mix of Bengali and English

Return JSON:
{
  "value": "Will [event] happen by [date]?",
  "confidence": 90,
  "reasoning": "explanation",
  "alternatives": ["alt question 1", "alt question 2"]
}
`,

  description: (data) => `
Write a compelling description for this prediction market event.

Title: "${data.name}"
Question: "${data.question}"
Category: ${data.category}

=== BANGLADESH CONTEXT ===
Include relevant local context:
- Sports: Team form, player stats, head-to-head
- Politics: Recent polls, candidate popularity
- Economy: Current rates, trends

Return JSON:
{
  "value": "2-3 sentence description",
  "confidence": 80,
  "reasoning": "why this description is effective"
}
`,

  category: (data) => `
Determine the best category for this event.

Title: "${data.name}"
Description: "${data.description || 'N/A'}"

Available categories:
- sports (BPL, Cricket, Football, IPL)
- politics (Elections, City Corporation)
- economy (USD-BDT, Inflation, Stock)
- entertainment (Bollywood, Movies)
- technology (AI, Crypto, Mobile)
- international (Global events)
- social (Trends, Festivals)
- weather (Cyclone, Monsoon)

Return JSON:
{
  "value": "category_name",
  "confidence": 95,
  "reasoning": "why this category fits"
}
`,

  tags: (data) => `
Suggest relevant tags for this event.

Title: "${data.name}"
Category: ${data.category}
Description: "${data.description || 'N/A'}"

=== REQUIREMENTS ===
- 3-5 tags
- Mix of Bengali and English
- Searchable keywords
- Popular terms
- Comma-separated

Return JSON:
{
  "value": "tag1, tag2, tag3, tag4",
  "confidence": 85,
  "reasoning": "why these tags"
}
`,

  trading_closes_at: (data) => `
Suggest appropriate trading end date for this event.

Title: "${data.name}"
Category: ${data.category}

=== GUIDELINES ===
- Sports: 1-7 days before match
- Politics: 1-3 days before election
- Economy: 7-30 days for predictions
- Entertainment: Before release/announcement

Return JSON:
{
  "value": "2024-03-15T18:00:00",
  "confidence": 80,
  "reasoning": "why this date"
}
`
};

// Call Gemini API
async function callGemini(prompt: string): Promise<any> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error('Gemini API failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No content from Gemini');
  }

  // Parse JSON
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('JSON parse error:', text);
  }

  return null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { field, current_data, context } = body;

    if (!field || !FIELD_PROMPTS[field]) {
      return NextResponse.json(
        { error: 'Invalid field' },
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = FIELD_PROMPTS[field](current_data);

    // Call Gemini
    const suggestion = await callGemini(prompt);

    if (!suggestion) {
      throw new Error('Failed to generate suggestion');
    }

    return NextResponse.json({
      success: true,
      suggestion: {
        value: suggestion.value,
        confidence: suggestion.confidence || 80,
        reasoning: suggestion.reasoning || 'AI generated suggestion',
        alternatives: suggestion.alternatives || []
      },
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Field suggestion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
