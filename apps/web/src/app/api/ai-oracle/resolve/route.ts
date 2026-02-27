/**
 * AI Oracle Resolution API
 * Production endpoint for AI-powered market resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIOrchestrator, getGlobalOrchestrator } from '@/lib/oracle/ai/AIOrchestrator';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin or system role
    const { data: userData } = await (supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as any);

    const isSystemRequest = req.headers.get('x-api-key') === process.env.ORACLE_API_KEY;

    if (!userData?.is_admin && !isSystemRequest) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or system access required' },
        { status: 403 }
      );
    }

    // Parse request
    const body = await req.json();
    const { marketId, context = {} } = body;

    if (!marketId) {
      return NextResponse.json(
        { error: 'Missing required field: marketId' },
        { status: 400 }
      );
    }

    // Fetch market details
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
      .single();

    if (marketError || !market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    if (market.status !== 'closed') {
      return NextResponse.json(
        { error: 'Market must be closed before resolution' },
        { status: 400 }
      );
    }

    // Initialize orchestrator
    const orchestrator = getGlobalOrchestrator();

    // Execute AI resolution
    console.log(`[AI Oracle API] Starting resolution for market ${marketId}`);
    const startTime = Date.now();

    const result = await orchestrator.resolve(
      marketId,
      market.question,
      {
        ...context,
        resolutionDate: market.event_date,
        marketType: market.category
      }
    );

    const executionTime = Date.now() - startTime;

    // Store pipeline result in database
    if (result.pipeline) {
      const { error: insertError } = await supabase
        .from('ai_resolution_pipelines')
        .insert({
          pipeline_id: result.pipeline.pipelineId,
          market_id: marketId,
          query: result.pipeline.query,
          retrieval_output: result.pipeline.retrieval,
          synthesis_output: result.pipeline.synthesis,
          deliberation_output: result.pipeline.deliberation,
          explanation_output: result.pipeline.explanation,
          final_outcome: result.pipeline.finalOutcome,
          final_confidence: result.pipeline.finalConfidence,
          confidence_level: result.pipeline.confidenceLevel,
          recommended_action: result.pipeline.recommendedAction,
          status: result.pipeline.status,
          started_at: result.pipeline.startedAt,
          completed_at: result.pipeline.completedAt,
          total_execution_time_ms: result.pipeline.totalExecutionTimeMs,
          synthesis_model_version: result.pipeline.modelVersions.synthesis,
          deliberation_model_version: result.pipeline.modelVersions.deliberation,
          explanation_model_version: result.pipeline.modelVersions.explanation
        });

      if (insertError) {
        console.error('[AI Oracle API] Failed to store pipeline:', insertError);
      }
    }

    // If auto-resolved, update market
    if (result.actionTaken === 'auto_resolved' && result.pipeline?.finalOutcome) {
      const { error: updateError } = await supabase
        .from('markets')
        .update({
          status: 'resolved',
          winning_outcome: result.pipeline.finalOutcome,
          resolved_at: new Date().toISOString(),
          resolution_details: {
            source: 'AI_ORACLE',
            confidence: result.pipeline.finalConfidence,
            pipeline_id: result.pipeline.pipelineId,
            explanation: result.pipeline.explanation?.naturalLanguageReasoning
          }
        })
        .eq('id', marketId);

      if (updateError) {
        console.error('[AI Oracle API] Failed to update market:', updateError);
      }
    }

    console.log(`[AI Oracle API] Resolution completed in ${executionTime}ms: ${result.actionTaken}`);

    return NextResponse.json({
      success: result.success,
      action: result.actionTaken,
      pipeline: result.pipeline ? {
        id: result.pipeline.pipelineId,
        outcome: result.pipeline.finalOutcome,
        confidence: result.pipeline.finalConfidence,
        confidenceLevel: result.pipeline.confidenceLevel,
        explanation: result.pipeline.explanation?.naturalLanguageReasoning,
        citations: result.pipeline.explanation?.keyEvidenceCitations,
        executionTimeMs: result.pipeline.totalExecutionTimeMs
      } : null,
      error: result.error
    });

  } catch (error) {
    console.error('[AI Oracle API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve AI resolution status
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const marketId = searchParams.get('marketId');

    if (!marketId) {
      return NextResponse.json(
        { error: 'Missing marketId parameter' },
        { status: 400 }
      );
    }

    const { data: pipelines, error } = await supabase
      .from('ai_resolution_pipelines')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch resolution status' },
        { status: 500 }
      );
    }

    if (!pipelines || pipelines.length === 0) {
      return NextResponse.json(
        { status: 'not_found', message: 'No AI resolution found for this market' },
        { status: 404 }
      );
    }

    const pipeline = pipelines[0];

    return NextResponse.json({
      status: pipeline.status,
      outcome: pipeline.final_outcome,
      confidence: pipeline.final_confidence,
      confidenceLevel: pipeline.confidence_level,
      explanation: pipeline.explanation_output?.naturalLanguageReasoning,
      startedAt: pipeline.started_at,
      completedAt: pipeline.completed_at,
      executionTimeMs: pipeline.total_execution_time_ms
    });

  } catch (error) {
    console.error('[AI Oracle API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
