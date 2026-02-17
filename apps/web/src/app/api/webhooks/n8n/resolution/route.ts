/**
 * n8n Webhook Callback Handler
 * Receives AI resolution results from n8n workflow
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Verify n8n API key
function verifyN8NAuth(request: Request): boolean {
  const apiKey = request.headers.get('x-n8n-api-key');
  const expectedKey = process.env.N8N_API_KEY;
  
  // In development, allow without key
  if (process.env.NODE_ENV === 'development' && !expectedKey) {
    return true;
  }
  
  if (!expectedKey) {
    console.warn('[n8n Webhook] N8N_API_KEY not configured');
    return false;
  }
  
  return apiKey === expectedKey;
}

interface ResolutionPayload {
  market_id: string;
  question: string;
  outcome: 'YES' | 'NO' | 'UNCERTAIN';
  confidence_score: number;
  reasoning: string;
  sources: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
  keywords_used: string[];
  timestamp: string;
}

/**
 * POST /api/webhooks/n8n/resolution
 * Receive AI resolution results from n8n
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  // Verify authentication
  if (!verifyN8NAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid API key' },
      { status: 401 }
    );
  }

  try {
    const payload: ResolutionPayload = await request.json();
    
    // Validate required fields
    if (!payload.market_id || !payload.outcome) {
      return NextResponse.json(
        { error: 'Missing required fields: market_id, outcome' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const now = new Date().toISOString();
    const confidenceThreshold = 90;

    // Get resolution system config
    const { data: resolutionConfig } = await supabase
      .from('resolution_systems')
      .select('ai_oracle_config')
      .eq('event_id', payload.market_id)
      .single();

    const threshold = resolutionConfig?.ai_oracle_config?.confidence_threshold || confidenceThreshold;

    // Determine resolution status based on confidence
    const canAutoResolve = 
      payload.confidence_score >= threshold && 
      payload.outcome !== 'UNCERTAIN';

    // Update resolution_systems table
    const { error: updateError } = await supabase
      .from('resolution_systems')
      .update({
        resolution_status: canAutoResolve ? 'resolved' : 'pending',
        proposed_outcome: payload.outcome === 'YES' ? 1 : payload.outcome === 'NO' ? 2 : null,
        confidence_level: payload.confidence_score,
        evidence: [
          {
            type: 'ai_analysis',
            outcome: payload.outcome,
            confidence: payload.confidence_score,
            reasoning: payload.reasoning,
            sources: payload.sources,
            keywords: payload.keywords_used,
            timestamp: payload.timestamp,
          }
        ],
        resolved_at: canAutoResolve ? now : null,
        updated_at: now,
      })
      .eq('event_id', payload.market_id);

    if (updateError) {
      throw new Error(`Failed to update resolution: ${updateError.message}`);
    }

    // If confidence is high enough, auto-resolve the market
    if (canAutoResolve) {
      const finalOutcome = payload.outcome === 'YES' ? 1 : 2;
      
      // Update market status
      const { error: marketError } = await supabase
        .from('markets')
        .update({
          status: 'resolved',
          outcome: finalOutcome,
          resolved_at: now,
          resolution_source_type: 'AI',
          resolution_details: {
            confidence: payload.confidence_score,
            reasoning: payload.reasoning,
            sources: payload.sources.map(s => s.url),
          },
          updated_at: now,
        })
        .eq('id', payload.market_id);

      if (marketError) {
        throw new Error(`Failed to resolve market: ${marketError.message}`);
      }

      // Trigger settlement (this would typically be a database function)
      const { error: settlementError } = await supabase.rpc('settle_market', {
        p_market_id: payload.market_id,
        p_outcome: finalOutcome,
      });

      if (settlementError) {
        console.error(`[n8n Webhook] Settlement error for ${payload.market_id}:`, settlementError);
        // Don't throw - resolution is done, settlement can be retried
      }

      console.log(`[n8n Webhook] Auto-resolved market ${payload.market_id} with outcome ${payload.outcome}`);
    } else {
      console.log(`[n8n Webhook] Market ${payload.market_id} needs manual review (confidence: ${payload.confidence_score}%)`);
    }

    return NextResponse.json({
      success: true,
      market_id: payload.market_id,
      outcome: payload.outcome,
      confidence: payload.confidence_score,
      auto_resolved: canAutoResolve,
      execution_time_ms: Date.now() - startTime,
    });

  } catch (error: any) {
    console.error('[n8n Webhook] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal Server Error',
        execution_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/n8n/resolution
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'n8n resolution webhook is active',
    timestamp: new Date().toISOString(),
  });
}
