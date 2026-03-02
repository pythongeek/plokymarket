/**
 * Dead Letter Queue Management API
 * Admin-only endpoint for managing failed workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Verify admin access
async function verifyAdmin(supabase: any, request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin, is_super_admin')
    .eq('id', user.id)
    .single();

  return !!(profile?.is_admin || profile?.is_super_admin);
}

/**
 * GET: List DLQ items
 */
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();

  if (!await verifyAdmin(supabase, request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' or 'resolved'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('workflow_dlq')
      .select(`
        *,
        upstash_workflow_runs:workflow_run_id (
          workflow_type,
          event_id,
          market_id,
          payload
        )
      `, { count: 'exact' });

    if (status === 'pending') {
      query = query.is('resolved_at', null);
    } else if (status === 'resolved') {
      query = query.not('resolved_at', 'is', null);
    }

    const { data, error, count } = await query
      .order('failed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      items: data || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('[DLQ API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * POST: Resolve or retry DLQ item
 */
export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();

  if (!await verifyAdmin(supabase, request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { dlq_id, action, notes } = body;

    if (!dlq_id || !action) {
      return NextResponse.json({
        success: false,
        error: 'dlq_id and action are required',
      }, { status: 400 });
    }

    const validActions = ['retry', 'discard', 'manual_resolve'];
    if (!validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        error: `Invalid action. Must be one of: ${validActions.join(', ')}`,
      }, { status: 400 });
    }

    // Get current user for resolved_by
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token || '');

    // Update DLQ item
    const { data: dlqItem, error: updateError } = await supabase
      .from('workflow_dlq')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
        resolution_action: action,
        resolution_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dlq_id)
      .is('resolved_at', null)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!dlqItem) {
      return NextResponse.json({
        success: false,
        error: 'DLQ item not found or already resolved',
      }, { status: 404 });
    }

    // Handle action-specific logic
    if (action === 'retry') {
      // Update workflow run status to RETRYING
      await supabase
        .from('upstash_workflow_runs')
        .update({
          status: 'RETRYING',
          retry_count: supabase.rpc('increment', { row_id: dlqItem.workflow_run_id }),
          updated_at: new Date().toISOString(),
        })
        .eq('workflow_run_id', dlqItem.workflow_run_id);

      // Here you could trigger a retry via QStash
      // This is a simplified version - actual retry would republish to QStash
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      p_admin_id: user?.id,
      p_action_type: 'dlq_resolve',
      p_resource_type: 'workflow_dlq',
      p_resource_id: dlq_id,
      p_new_values: { action, notes },
      p_reason: `DLQ item ${action}`,
    });

    return NextResponse.json({
      success: true,
      message: `DLQ item ${action}d successfully`,
      dlq_item: dlqItem,
    });

  } catch (error: any) {
    console.error('[DLQ API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
