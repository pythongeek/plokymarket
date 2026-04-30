// @ts-nocheck
/**
 * AI Oracle Resolution Status API
 * Get status and results of an oracle resolution request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/oracle/resolution/[id]
 * Get oracle request status and results
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Authenticate (service calls allowed)
    const authHeader = request.headers.get('authorization');
    const isServiceCall = authHeader?.startsWith('Bearer ');

    if (!isServiceCall) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const service = await createServiceClient();

    // Fetch oracle request
    const { data: oracleRequest, error } = await (service
      .from('oracle_requests')
      .select('*')
      .eq('id', id)
      .single() as any);

    if (error || !oracleRequest) {
      return NextResponse.json(
        { error: 'Oracle request not found' },
        { status: 404 }
      );
    }

    // Fetch associated pipeline if exists
    let pipeline = null;
    if (oracleRequest.ai_analysis?.pipelineId) {
      const { data: pipelineData } = await (service
        .from('ai_resolution_pipelines')
        .select('*')
        .eq('pipeline_id', oracleRequest.ai_analysis.pipelineId)
        .single() as any);
      pipeline = pipelineData;
    }

    // Fetch market info
    let marketInfo = null;
    const { data: market } = await (service
      .from('markets')
      .select('id, question, title, status, winning_outcome')
      .eq('id', oracleRequest.market_id)
      .single() as any);
    marketInfo = market;

    return NextResponse.json({
      success: true,
      request: {
        id: oracleRequest.id,
        marketId: oracleRequest.market_id,
        status: oracleRequest.status,
        requestType: oracleRequest.request_type,
        proposedOutcome: oracleRequest.proposed_outcome,
        confidenceScore: oracleRequest.confidence_score,
        evidenceText: oracleRequest.evidence_text,
        evidenceUrls: oracleRequest.evidence_urls,
        aiAnalysis: oracleRequest.ai_analysis,
        createdAt: oracleRequest.created_at,
        updatedAt: oracleRequest.updated_at,
        resolvedAt: oracleRequest.resolved_at,
        processedAt: oracleRequest.processed_at,
      },
      pipeline,
      market: marketInfo,
    });
  } catch (error: any) {
    console.error(`GET /api/oracle/resolution/[${(await params).id}] error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve oracle request' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/oracle/resolution/[id]
 * Trigger re-resolution or finalize request
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { action } = body;

    // Authenticate admin
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
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const service = await createServiceClient();

    // Fetch oracle request
    const { data: oracleRequest, error } = await (service
      .from('oracle_requests')
      .select('*')
      .eq('id', id)
      .single() as any);

    if (error || !oracleRequest) {
      return NextResponse.json(
        { error: 'Oracle request not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'reprocess':
        // Trigger reprocessing via Inngest
        await inngest.send({
          name: 'oracle/ai.resolve',
          data: {
            requestId: id,
            marketId: oracleRequest.market_id,
            reprocess: true,
          },
        });

        await (service
          .from('oracle_requests')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', id) as any);

        return NextResponse.json({
          success: true,
          message: 'Re-resolution triggered',
        });

      case 'finalize':
        if (!['proposed', 'pending'].includes(oracleRequest.status)) {
          return NextResponse.json(
            { error: 'Cannot finalize request in current status' },
            { status: 400 }
          );
        }

        // Update request status
        await (service
          .from('oracle_requests')
          .update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id) as any);

        // Trigger settlement workflow
        await inngest.send({
          name: 'market/resolve',
          data: {
            marketId: oracleRequest.market_id,
            resolutionSource: 'ORACLE_FINALIZED',
            outcome: oracleRequest.proposed_outcome,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Oracle request finalized and market resolution triggered',
        });

      case 'dispute':
        return NextResponse.json(
          { error: 'Dispute handling not implemented via this endpoint' },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: reprocess, finalize, dispute' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error(`POST /api/oracle/resolution/[${(await params).id}] error:`, error);
    return NextResponse.json(
      { error: error.message || 'Failed to process oracle request' },
      { status: 500 }
    );
  }
}