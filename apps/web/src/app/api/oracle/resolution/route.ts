// @ts-nocheck
/**
 * AI Oracle Resolution API
 * Handles AI-powered market resolution requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { inngest } from '@/lib/inngest/client';
import { OracleService } from '@/lib/oracle/service';
import { AIOrchestrator } from '@/lib/oracle/ai/AIOrchestrator';

const oracleService = new OracleService();
const aiOrchestrator = new AIOrchestrator();

/**
 * POST /api/oracle/resolution
 * Request AI oracle resolution for a market
 * Body: { marketId: string, context?: object }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { marketId, context } = body;

    if (!marketId) {
      return NextResponse.json(
        { error: 'Missing required field: marketId' },
        { status: 400 }
      );
    }

    // Verify authentication (service calls allowed for internal workflows)
    const authHeader = request.headers.get('authorization');
    const isServiceCall = authHeader?.startsWith('Bearer ');

    if (!isServiceCall) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check admin for manual trigger
      const { data: user } = await (supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin')
        .eq('id', session.user.id)
        .single() as any);

      if (!user?.is_admin && !user?.is_super_admin) {
        return NextResponse.json(
          { error: 'Admin access required for AI oracle resolution' },
          { status: 403 }
        );
      }
    }

    // Fetch market details
    const service = await createServiceClient();
    const { data: market, error: marketError } = await (service
      .from('markets')
      .select('id, question, title, status, resolution_systems(*)')
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

    // Create oracle request record
    const requestId = `oracle_${Date.now()}_${marketId.slice(0, 8)}`;
    const { data: oracleRequest, error: createError } = await (service
      .from('oracle_requests')
      .insert({
        id: requestId,
        market_id: marketId,
        request_type: 'initial',
        proposer_id: isServiceCall ? null : (await supabase.auth.getUser()).data.user?.id,
        bond_amount: 0,
        bond_currency: 'BDT',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single() as any);

    if (createError) {
      console.error('Failed to create oracle request:', createError);
      return NextResponse.json(
        { error: 'Failed to create oracle request' },
        { status: 500 }
      );
    }

    // Trigger Inngest workflow for async AI resolution
    try {
      await inngest.send({
        name: 'oracle/ai.resolve',
        data: {
          requestId,
          marketId,
          marketQuestion: market.question || market.title,
          context: context || {},
          triggerSource: isServiceCall ? 'service' : 'admin',
        },
      });

      console.log(`[Oracle Resolution] Triggered Inngest workflow for market ${marketId}`);
    } catch (workflowErr) {
      console.error('[Oracle Resolution] Failed to trigger Inngest workflow:', workflowErr);
      // Update request status to failed
      await (service
        .from('oracle_requests')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', requestId) as any);

      return NextResponse.json(
        { error: 'Failed to initiate resolution workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId,
      marketId,
      status: 'pending',
      message: 'AI oracle resolution initiated. Use GET /api/oracle/resolution/[requestId] to check status.',
    });
  } catch (error: any) {
    console.error('POST /api/oracle/resolution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate AI oracle resolution' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/oracle/resolution
 * List oracle requests with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);

    // Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: user } = await (supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single() as any);

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const marketId = url.searchParams.get('marketId');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('oracle_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (marketId) query = query.eq('market_id', marketId);
    if (status) query = query.eq('status', status);

    const { data: requests, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      requests,
      pagination: {
        offset,
        limit,
        total: count,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error: any) {
    console.error('GET /api/oracle/resolution error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve oracle requests' },
      { status: 500 }
    );
  }
}