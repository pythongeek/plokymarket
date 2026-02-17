/**
 * Upstash Workflow Integration for AI Oracle
 * Handles long-running AI processing tasks
 * Vercel Edge compatible with Upstash Workflow SDK
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize Supabase
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

interface WorkflowContext {
  run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
}

/**
 * Main workflow handler
 * This endpoint is called by Upstash Workflow
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const payload = await request.json();
    const { workflowId, step, data } = payload;

    const supabase = getSupabase();

    // Step 1: Fetch active news sources
    if (step === 'fetch-sources' || !step) {
      const { data: sources, error } = await supabase
        .from('news_sources')
        .select('*')
        .eq('is_active', true)
        .eq('is_whitelisted', true)
        .order('trust_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      return NextResponse.json({
        step: 'fetch-sources',
        status: 'success',
        sources: sources || [],
        nextStep: 'scrape-news'
      });
    }

    // Step 2: Scrape news from sources
    if (step === 'scrape-news') {
      const { sources, marketId, marketQuestion } = data;
      const articles: any[] = [];

      // Fetch news from each source (limited to avoid timeout)
      for (const source of sources.slice(0, 5)) {
        try {
          const response = await fetch(source.source_url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Plokymarket-AI-Oracle/1.0',
              'Accept': 'text/html,application/rss+xml,application/atom+xml'
            }
          });

          if (response.ok) {
            const content = await response.text();
            // Extract text content (simplified)
            const textContent = content
              .replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/<style[^>]*>.*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 5000); // Limit content size

            articles.push({
              source: source.source_name,
              content: textContent,
              url: source.source_url
            });
          }
        } catch (err) {
          console.error(`Failed to fetch ${source.source_name}:`, err);
        }
      }

      return NextResponse.json({
        step: 'scrape-news',
        status: 'success',
        articles,
        marketId,
        marketQuestion,
        nextStep: 'ai-analysis'
      });
    }

    // Step 3: AI Analysis
    if (step === 'ai-analysis') {
      const { articles, marketId, marketQuestion } = data;

      // Combine articles into context
      const context = articles
        .map((a: any) => `Source: ${a.source}\n${a.content}`)
        .join('\n\n---\n\n')
        .substring(0, 10000); // Limit total context

      // Call Gemini API
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const prompt = `You are an AI Oracle for a prediction market. Analyze the following news content and determine the outcome.

Market Question: ${marketQuestion}

News Content:
${context}

Based on the evidence above, provide your analysis in JSON format:
{
  "outcome": "YES" | "NO" | "UNCERTAIN",
  "confidence": number (0.0 to 1.0),
  "reasoning": "brief explanation of your decision",
  "key_sources": ["source names that support your decision"]
}

Rules:
- Only return valid JSON, no markdown
- Confidence must be between 0.0 and 1.0
- If evidence is insufficient, return "UNCERTAIN" with low confidence`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const geminiResult = await response.json();
      const aiText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Parse JSON from response
      let aiDecision;
      try {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiDecision = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiText);
        aiDecision = {
          outcome: 'UNCERTAIN',
          confidence: 0.0,
          reasoning: 'Failed to parse AI response',
          key_sources: []
        };
      }

      return NextResponse.json({
        step: 'ai-analysis',
        status: 'success',
        aiDecision,
        marketId,
        marketQuestion,
        nextStep: 'resolve-market'
      });
    }

    // Step 4: Resolve Market or Send to Manual Review
    if (step === 'resolve-market') {
      const { aiDecision, marketId } = data;
      const confidenceThreshold = 0.85;

      // If confidence is high enough, auto-resolve
      if (aiDecision.confidence >= confidenceThreshold && aiDecision.outcome !== 'UNCERTAIN') {
        const outcome = aiDecision.outcome === 'YES' ? 1 : 2;

        // Update market status
        const { error: marketError } = await supabase
          .from('markets')
          .update({
            status: 'resolved',
            outcome,
            resolved_at: new Date().toISOString(),
            resolution_source_type: 'AI_ORACLE',
            resolution_details: {
              ai_reasoning: aiDecision.reasoning,
              confidence: aiDecision.confidence,
              sources: aiDecision.key_sources
            }
          })
          .eq('id', marketId);

        if (marketError) throw marketError;

        // Trigger settlement
        await supabase.rpc('settle_market_v2', {
          p_market_id: marketId,
          p_winning_outcome: aiDecision.outcome
        });

        return NextResponse.json({
          step: 'resolve-market',
          status: 'resolved',
          marketId,
          outcome: aiDecision.outcome,
          confidence: aiDecision.confidence,
          executionTimeMs: Date.now() - startTime
        });
      }

      // Low confidence - send to manual review
      await supabase
        .from('resolution_systems')
        .update({
          resolution_status: 'in_progress',
          proposed_outcome: aiDecision.outcome === 'YES' ? 1 : aiDecision.outcome === 'NO' ? 2 : null,
          confidence_level: aiDecision.confidence * 100,
          evidence: [{
            type: 'ai_oracle',
            reasoning: aiDecision.reasoning,
            confidence: aiDecision.confidence,
            sources: aiDecision.key_sources
          }]
        })
        .eq('event_id', marketId);

      return NextResponse.json({
        step: 'resolve-market',
        status: 'manual_review',
        marketId,
        aiDecision,
        reason: 'Confidence below threshold or uncertain outcome',
        executionTimeMs: Date.now() - startTime
      });
    }

    // Unknown step
    return NextResponse.json(
      { error: 'Unknown workflow step', step },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Upstash Workflow] Error:', error);
    return NextResponse.json(
      {
        error: 'Workflow failed',
        details: error.message,
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Workflow status and trigger info
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'upstash-workflow-oracle',
    steps: ['fetch-sources', 'scrape-news', 'ai-analysis', 'resolve-market'],
    timestamp: new Date().toISOString()
  });
}
