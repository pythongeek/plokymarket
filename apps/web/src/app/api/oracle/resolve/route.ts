// @ts-nocheck
/**
 * Direct AI Oracle Resolve API
 * Synchronous endpoint for immediate AI oracle resolution (admin use)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { AIOrchestrator } from '@/lib/oracle/ai/AIOrchestrator';

const aiOrchestrator = new AIOrchestrator();

/**
 * POST /api/oracle/resolve
 * Trigger immediate AI oracle resolution (bypasses Inngest queue)
 * Admin only - for testing or immediate resolution needs
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { marketId, skipInngest } = body;

    if (!marketId) {
      return NextResponse.json(
        { error: 'Missing required field: marketId' },
        { status: 400 }
      );
    }

    // Authenticate
    const authHeader = request.headers.get('authorization');
    const isServiceCall = authHeader?.startsWith('Bearer ');

    if (!isServiceCall) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: user } = await (supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin')
        .eq('id', session.user.id)
        .single() as any);

      if (!user?.is_admin && !user?.is_super_admin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    const service = await createServiceClient();

    // Fetch market
    const { data: market, error: marketError } = await (service
      .from('markets')
      .select('id, question, title, status')
      .eq('id', marketId)
      .single() as any);

    if (marketError || !market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }

    if (market.status === 'resolved') {
      return NextResponse.json(
        { error: 'Market is already resolved' },
        { status: 400 }
      );
    }

    // Run AI orchestration directly
    console.log(`[Oracle Resolve] Running direct AI resolution for market ${marketId}`);
    
    const result = await aiOrchestrator.resolve(
      marketId,
      market.question || market.title,
      { source: 'direct_api' }
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error?.message || 'AI resolution failed',
        marketId,
        actionTaken: 'failed',
      }, { status: 500 });
    }

    const response: any = {
      success: true,
      marketId,
      outcome: result.pipeline.finalOutcome,
      confidence: result.pipeline.finalConfidence,
      confidenceLevel: result.pipeline.confidenceLevel,
      actionTaken: result.actionTaken,
      pipelineId: result.pipeline.pipelineId,
      sources: result.pipeline.retrieval?.corpus?.sources || [],
      reasoning: result.pipeline.explanation?.summary || result.pipeline.deliberation?.summaryText,
    };

    // If skipInngest is true, don't trigger workflow - caller handles finalization
    if (skipInngest) {
      return NextResponse.json(response);
    }

    // Trigger Inngest for async processing and settlement
    try {
      await inngest.send({
        name: 'oracle/ai.resolve',
        data: {
          requestId: `oracle_${Date.now()}_${marketId.slice(0, 8)}`,
          marketId,
          marketQuestion: market.question || market.title,
          context: { source: 'direct_api', pipelineId: result.pipeline.pipelineId },
          triggerSource: isServiceCall ? 'service' : 'admin',
        },
      });
      response.workflowTriggered = true;
    } catch (workflowErr) {
      console.error('[Oracle Resolve] Failed to trigger workflow:', workflowErr);
      response.workflowTriggered = false;
      response.workflowError = 'Failed to trigger async workflow';
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('POST /api/oracle/resolve error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute AI oracle resolution' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/oracle/resolve/health
 * Get AI oracle system health status
 */
export async function GET(request: NextRequest) {
  try {
    const health = aiOrchestrator.getHealthStatus();
    
    return NextResponse.json({
      success: true,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('GET /api/oracle/resolve/health error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get health status' },
      { status: 500 }
    );
  }
}