/**
 * AI Oracle Resolution System
 * Automatically resolves events using Gemini AI
 * Analyzes news and determines outcome
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

// Mock news fetcher (replace with actual news APIs)
async function fetchNewsArticles(keywords: string[], sources: string[]): Promise<any[]> {
  // In production, integrate with:
  // - NewsAPI
  // - GDELT
  // - Custom RSS feeds
  // - Bangladesh news sources

  // For now, return mock data based on keywords
  return [
    {
      title: `Latest update on ${keywords[0]}`,
      source: sources[0] || 'prothomalo.com',
      publishedAt: new Date().toISOString(),
      content: `News content about ${keywords.join(', ')}...`
    }
  ];
}

// Analyze with Gemini
async function analyzeWithAI(event: any, articles: any[]): Promise<any> {
  const prompt = `
You are an AI oracle for a prediction market platform.
Analyze the following news articles to determine the outcome of this event.

EVENT QUESTION: "${event.question}"
EVENT DESCRIPTION: "${event.description || 'N/A'}"
CATEGORY: ${event.category}
TRADING ENDED: ${event.trading_closes_at}

NEWS ARTICLES (${articles.length}):
${articles.map((a, i) => `
${i + 1}. Title: ${a.title}
   Source: ${a.source}
   Date: ${a.publishedAt}
   Content: ${a.content}
`).join('\n')}

YOUR TASK:
1. Determine if the event resolved as YES or NO
2. Provide confidence score (0-100)
3. Cite specific evidence
4. Explain your reasoning

CRITICAL RULES:
- Only return YES if there is CLEAR, VERIFIED evidence
- For Bangladesh sports/politics, require multiple sources
- If uncertain, return LOW confidence
- Be conservative with predictions

Return ONLY valid JSON:
{
  "outcome": "yes" | "no" | "uncertain",
  "confidence": 85,
  "reasoning": "Detailed explanation with citations",
  "evidence_sources": ["Article 1: specific quote", "Article 2: specific quote"],
  "red_flags": ["any concerns"]
}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      })
    }
  );

  if (!response.ok) {
    throw new Error('AI analysis failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No analysis content');
  }

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Parse error:', text);
  }

  return null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get event and resolution config
    const { data: event, error: eventError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const { data: resolution, error: resError } = await supabase
      .from('resolution_systems')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (resError || !resolution) {
      return NextResponse.json(
        { error: 'Resolution config not found' },
        { status: 404 }
      );
    }

    // Check if already resolved
    if (event.status === 'resolved') {
      return NextResponse.json(
        { error: 'Event already resolved' },
        { status: 400 }
      );
    }

    // Fetch news articles
    const articles = await fetchNewsArticles(
      resolution.ai_keywords || [],
      resolution.ai_sources || []
    );

    if (articles.length < (resolution.min_sources_required || 2)) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient news sources',
        sources_found: articles.length,
        required: resolution.min_sources_required || 2
      });
    }

    // AI Analysis
    const analysis = await analyzeWithAI(event, articles);

    if (!analysis) {
      throw new Error('AI analysis failed');
    }

    // Check confidence threshold
    const threshold = resolution.confidence_threshold || 85;

    if (analysis.confidence < threshold || analysis.outcome === 'uncertain') {
      // Low confidence - update status but don't resolve
      await supabase
        .from('resolution_systems')
        .update({
          status: 'pending_review',
          ai_analysis: analysis,
          evidence: { articles, analysis }
        })
        .eq('id', resolution.id);

      return NextResponse.json({
        success: false,
        message: 'Low confidence - requires manual review',
        analysis,
        threshold
      });
    }

    // High confidence - resolve event
    const outcome = analysis.outcome === 'yes' ? 1 : 2;

    await supabase
      .from('markets')
      .update({
        status: 'resolved',
        outcome: analysis.outcome,
        resolved_at: new Date().toISOString(),
        resolution_source: 'ai_oracle'
      })
      .eq('id', eventId);

    await supabase
      .from('resolution_systems')
      .update({
        status: 'resolved',
        final_outcome: analysis.outcome,
        confidence_level: analysis.confidence,
        ai_analysis: analysis,
        evidence: { articles, analysis },
        resolved_at: new Date().toISOString()
      })
      .eq('id', resolution.id);

    // Log resolution
    await supabase.rpc('log_admin_action', {
      p_admin_id: null,
      p_action_type: 'resolve_event',
      p_resource_type: 'market',
      p_resource_id: eventId,
      p_new_values: { outcome: analysis.outcome, confidence: analysis.confidence },
      p_reason: 'AI Oracle automatic resolution'
    });

    return NextResponse.json({
      success: true,
      outcome: analysis.outcome,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('AI Oracle error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
