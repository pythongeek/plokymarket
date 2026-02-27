/**
 * Workflow Execution API
 * Executes verification workflows on events and manages workflow history/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeVerificationWorkflow } from '@/lib/workflows/UpstashOrchestrator';
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/WorkflowBuilder';

/**
 * POST /api/workflows/execute
 * Execute a workflow on an event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Authenticate (allow from API routes or admin)
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
        .select('is_admin')
        .eq('id', session.user.id)
        .single() as any);

      if (!user?.is_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const { eventId, workflowId, eventData } = body;

    if (!eventId || !workflowId || !eventData) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, workflowId, eventData' },
        { status: 400 }
      );
    }

    // Execute the workflow
    const result = await executeVerificationWorkflow(eventId, workflowId, eventData);

    // Store execution result
    const { error: insertError } = await (supabase.from('workflow_executions').insert({
      event_id: eventId,
      workflow_id: workflowId,
      outcome: result.outcome,
      confidence: result.confidence,
      execution_time: result.totalExecutionTime,
      mismatch_detected: result.mismatch,
      escalated: result.outcome === 'escalated',
      sources: result.sources,
      evidence: { reasoning: result.reasoning },
      created_at: new Date().toISOString(),
    }) as any);

    if (insertError) {
      console.error('Failed to store execution:', insertError);
      // Continue anyway, as the workflow executed successfully
    }

    return NextResponse.json({
      success: true,
      result,
      message: result.outcome === 'escalated'
        ? 'Workflow escalated - requires manual review'
        : 'Workflow completed successfully',
    });
  } catch (error: any) {
    console.error('POST /api/workflows/execute error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/execute/history
 * Get workflow execution history with filtering and pagination
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
    const workflowId = url.searchParams.get('workflowId');
    const eventId = url.searchParams.get('eventId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const outcome = url.searchParams.get('outcome');
    const escalated = url.searchParams.get('escalated');

    // Build query
    let query = supabase
      .from('workflow_executions')
      .select('*', { count: 'exact' });

    if (workflowId) query = query.eq('workflow_id', workflowId);
    if (eventId) query = query.eq('event_id', eventId);
    if (outcome) query = query.eq('outcome', outcome);
    if (escalated !== null) query = query.eq('escalated', escalated === 'true');

    // Execute query with pagination
    const { data: executions, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      executions,
      pagination: {
        offset,
        limit,
        total: count,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error: any) {
    console.error('GET /api/workflows/execute/history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve execution history' },
      { status: 500 }
    );
  }
}
