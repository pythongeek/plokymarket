/**
 * Workflow Management API
 * CRUD operations + execution + monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  DEFAULT_WORKFLOWS,
  VerificationWorkflow,
  buildWorkflow,
  buildWorkflowStep,
} from '@/lib/workflows/WorkflowBuilder';
import { executeVerificationWorkflow } from '@/lib/workflows/UpstashOrchestrator';

export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

/**
 * GET /api/workflows
 * List all workflows or filter by category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const enabled = searchParams.get('enabled');

    const supabase = await createServiceClient();

    let query = supabase.from('verification_workflows').select('*');

    if (category) {
      query = query.eq('event_category', category);
    }

    if (enabled) {
      query = query.eq('enabled', enabled === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    // Merge with default workflows
    const allWorkflows = [
      ...Object.values(DEFAULT_WORKFLOWS),
      ...(data || []),
    ];

    return NextResponse.json({
      workflows: allWorkflows,
      count: allWorkflows.length,
    });
  } catch (error: any) {
    console.error('Get workflows error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/workflows
 * Create new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, eventCategory, steps } = body;

    // Authenticate admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Build workflow
    const workflow = buildWorkflow({
      name,
      description,
      eventCategory,
      steps: steps.map((s: any) =>
        buildWorkflowStep({
          name: s.name,
          sources: s.sources,
          logic: s.logic,
          requiredConfidence: s.requiredConfidence,
          timeout: s.timeout,
        })
      ),
    });

    // Save to database
    const { data, error } = await supabase
      .from('verification_workflows')
      .insert([
        {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          event_category: workflow.eventCategory,
          config: workflow,
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ workflow: data }, { status: 201 });
  } catch (error: any) {
    console.error('Create workflow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/workflows/[id]
 * Update workflow
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('verification_workflows')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ workflow: data });
  } catch (error: any) {
    console.error('Update workflow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete workflow
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();

    // Prevent deleting default workflows
    if (Object.values(DEFAULT_WORKFLOWS).some((w) => w.id === id)) {
      return NextResponse.json(
        { error: 'Cannot delete default workflow' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('verification_workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete workflow error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/workflows/execute
 * Execute workflow for event verification
 */
export async function executeWorkflowForEvent(
  eventId: string,
  workflowId: string,
  eventData: any
): Promise<any> {
  try {
    return await executeVerificationWorkflow(eventId, workflowId, eventData);
  } catch (error: any) {
    console.error('Workflow execution error:', error);
    throw error;
  }
}

/**
 * GET /api/workflows/[id]/history
 * Get execution history for workflow
 */
export async function getWorkflowHistory(workflowId: string, limit: number = 20) {
  try {
    const supabase = await createServiceClient();

    const { data, error } = await supabase
      .from('workflow_executions')
      .select(
        `
        id,
        event_id,
        workflow_id,
        outcome,
        confidence,
        execution_time,
        created_at,
        events!inner(question)
      `
      )
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      history: data,
      count: data?.length || 0,
    };
  } catch (error: any) {
    console.error('Get history error:', error);
    throw error;
  }
}

/**
 * GET /api/workflows/stats
 * Get workflow statistics
 */
export async function getWorkflowStats(workflowId?: string) {
  try {
    const supabase = await createServiceClient();

    let query = supabase.from('workflow_executions').select('outcome, confidence', {
      count: 'exact',
    });

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, count } = await query;

    if (!data) return null;

    const yesCount = data.filter((d: any) => d.outcome === 'yes').length;
    const noCount = data.filter((d: any) => d.outcome === 'no').length;
    const escalatedCount = data.filter((d: any) => d.outcome === 'escalated').length;
    const avgConfidence =
      data.reduce((sum: number, d: any) => sum + d.confidence, 0) / data.length;

    return {
      totalExecutions: count,
      yesCount,
      noCount,
      escalatedCount,
      yesPercentage: count ? Math.round((yesCount / count) * 100) : 0,
      noPercentage: count ? Math.round((noCount / count) * 100) : 0,
      escalatedPercentage: count ? Math.round((escalatedCount / count) * 100) : 0,
      avgConfidence: Math.round(avgConfidence),
    };
  } catch (error: any) {
    console.error('Get stats error:', error);
    throw error;
  }
}
