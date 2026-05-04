// @ts-nocheck
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

// GET /api/admin/users/audit-log - Get audit logs
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('user_id');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (targetUserId) {
      whereClause += `${whereClause ? ' AND ' : ''}target_user_id = $${paramIndex++}`;
      params.push(targetUserId);
    }

    if (category) {
      whereClause += `${whereClause ? ' AND ' : ''}action_category = $${paramIndex++}`;
      params.push(category);
    }

    if (action) {
      whereClause += `${whereClause ? ' AND ' : ''}action = $${paramIndex++}`;
      params.push(action);
    }

    const whereStr = whereClause ? `WHERE ${whereClause}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM admin_audit_log ${whereStr}`,
      params
    );
    const count = parseInt(countResult.rows[0]?.total || '0');

    params.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT * FROM admin_audit_log 
       ${whereStr}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return NextResponse.json({ 
      data: dataResult.rows || [],
      total: count,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/audit-log/dual-auth - Approve with dual authorization
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { log_id, action } = body;

    if (!log_id) {
      return NextResponse.json(
        { error: 'Log ID required' },
        { status: 400 }
      );
    }

    // Get the pending log
    const logResult = await pool.query(
      'SELECT * FROM admin_audit_log WHERE id = $1',
      [log_id]
    );
    const log = logResult.rows[0];

    if (!log) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    // Verify this log requires dual auth and hasn't been approved yet
    if (!log.requires_dual_auth || log.dual_auth_admin_id) {
      return NextResponse.json(
        { error: 'This action does not require or already has dual authorization' },
        { status: 400 }
      );
    }

    // Ensure different admin is providing dual auth
    if (log.admin_id === userId) {
      return NextResponse.json(
        { error: 'Dual authorization must be performed by a different admin' },
        { status: 403 }
      );
    }

    if (action === 'approve') {
      // Update log with dual auth
      await pool.query(
        `UPDATE admin_audit_log 
         SET dual_auth_admin_id = $1, dual_auth_at = NOW()
         WHERE id = $2`,
        [userId, log_id]
      );

      // Apply the pending action
      await pool.query(
        `SELECT * FROM update_user_status($1, $2, $3, $4, $5)`,
        [log.admin_id, log.target_user_id, log.new_value, log.reason, userId]
      );

      return NextResponse.json({ success: true, action: 'approved' });
    } else if (action === 'reject') {
      // Mark as rejected
      await pool.query(
        `UPDATE admin_audit_log 
         SET new_value = new_value || '{"rejected": true, "rejected_by": "${userId}"}'::jsonb
         WHERE id = $1`,
        [log_id]
      );

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing dual auth:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process dual authorization' },
      { status: 500 }
    );
  }
}
