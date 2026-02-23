/**
 * Auto-fill entire form with AI
 * Generates complete event data from topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

// Calculate trading end date based on category
function getDefaultEndDate(category: string): string {
  const now = new Date();
  const days = {
    sports: 7,
    politics: 3,
    economy: 14,
    entertainment: 30,
    technology: 21,
    international: 14,
    social: 7,
    weather: 5
  };

  now.setDate(now.getDate() + (days[category as keyof typeof days] || 7));
  return now.toISOString().slice(0, 16);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { topic, partial_data } = body;

    if (!topic || topic.trim().length < 5) {
      return NextResponse.json(
        { error: 'টপিক কমপক্ষে ৫ অক্ষর হতে হবে' },
        { status: 400 }
      );
    }

    // Build comprehensive prompt
    const prompt = `
You are an AI assistant for Plokymarket, a Bangladesh prediction market platform.
Generate a complete event form from this topic.

TOPIC: "${topic}"

=== BANGLADESH CONTEXT ===
Sports: BPL (Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Rangpur, Cumilla, Barishal), 
        National Team (Shakib, Tamim, Mushfiqur), IPL, Cricket
Politics: Elections, City Corporation (Dhaka, Chattogram), Awami League, BNP
Economy: USD-BDT rate (120-125), Inflation, Stock Market (DSE)
Entertainment: Bollywood (SRK, Salman), Dhallywood, K-pop
Technology: iPhone, Samsung, AI, Crypto (Bitcoin, Ethereum)

=== OUTPUT FORMAT ===
Return ONLY valid JSON:
{
  "name": "Catchy event title (Bengali/English, max 100 chars)",
  "question": "Clear Yes/No question (Bengali/English, max 200 chars)",
  "description": "2-3 sentence description in Bengali",
  "category": "One of: sports, politics, economy, entertainment, technology, international, social, weather",
  "subcategory": "Specific area (e.g., BPL, Cricket, Election)",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "confidence": 85
}

Make it engaging and relevant to Bangladesh audience.
`;

    // Call Gemini
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
    let aiData: any = {};
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Parse error:', text);
      throw new Error('Failed to parse AI response');
    }

    // Build form data
    const formData = {
      name: aiData.name || topic,
      question: aiData.question || `${topic} - কি এটি ঘটবে?`,
      description: aiData.description || `${topic} সম্পর্কে একটি প্রেডিকশন মার্কেট`,
      category: aiData.category || 'sports',
      subcategory: aiData.subcategory || '',
      tags: Array.isArray(aiData.tags) ? aiData.tags : ['বাংলাদেশ', 'প্রেডিকশন'],
      trading_closes_at: getDefaultEndDate(aiData.category || 'sports'),
      resolution_delay: 1440,
      initial_liquidity: 1000,
      resolution_method: 'manual_admin' as const
    };

    return NextResponse.json({
      success: true,
      form_data: formData,
      ai_confidence: aiData.confidence || 80,
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Auto-fill error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
