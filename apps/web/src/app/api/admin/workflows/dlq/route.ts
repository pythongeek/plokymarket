// @ts-nocheck
/**
 * Dead Letter Queue Management API
 * Admin-only endpoint for managing failed workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

export const runtime = 'nodejs';

// Verify admin access
async function verifyAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { isAdmin: false };

  const token = authHeader.split(' ')[1];
  const userId = await getUserFromToken(token);
  
  if (!userId) return { isAdmin: false };

  const profileResult = await pool.query(
    'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
    [userId]
  );
  const profile = profileResult.rows[0];

  return { isAdmin: !!(profile?.is_admin || profile?.is_super_admin), userId };
}

/**
 * GET: List DLQ items
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pending' or 'resolved'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status === 'pending') {
      whereClause += `${whereClause ? ' AND ' : ''}resolved_at IS NULL`;
    } else if (status === 'resolved') {
      whereClause += `${whereClause ? ' AND ' : ''}resolved_at IS NOT NULL`;
    }

    const whereStr = whereClause ? `WHERE ${whereClause}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM workflow_dlq ${whereStr}`,
      params
    );
    const count = parseInt(countResult.rows[0]?.total || '0');

    params.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT dlq.*, 
              uwr.workflow_type, uwr.event_id, uwr.market_id, uwr.payload
       FROM workflow_dlq dlq
       LEFT JOIN upstash_workflow_runs uwr ON uwr.id = dlq.workflow_run_id
       ${whereStr}
       ORDER BY dlq.failed_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return NextResponse.json({
      success: true,
      items: dataResult.rows || [],
      total: count,
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
  const auth = await verifyAdmin(request);
  if (!auth.isAdmin) {
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

    // Update DLQ item
    const updateResult = await pool.query(
      `UPDATE workflow_dlq 
       SET resolved_at = NOW(),
           resolved_by = $1,
           resolution_action = $2,
           resolution_notes = $3,
           updated_at = NOW()
       WHERE id = $4 AND resolved_at IS NULL
       RETURNING *`,
      [auth.userId, action, notes, dlq_id]
    );

    const dlqItem = updateResult.rows[0];

    if (!dlqItem) {
      return NextResponse.json({
        success: false,
        error: 'DLQ item not found or already resolved',
      }, { status: 404 });
    }

    // Handle action-specific logic
    if (action === 'retry') {
      // Update workflow run status to RETRYING
      await pool.query(
        `UPDATE upstash_workflow_runs 
         SET status = 'RETRYING',
             retry_count = COALESCE(retry_count, 0) + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [dlqItem.workflow_run_id]
      );
    }

    // Log admin action
    await pool.query(
      `SELECT * FROM log_admin_action($1, 'dlq_resolve', 'workflow_dlq', $2, $3, $4)`,
      [auth.userId, dlq_id, { action, notes }, `DLQ item ${action}`]
    );

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
