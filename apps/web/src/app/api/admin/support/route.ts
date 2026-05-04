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

// GET /api/admin/support - List support tickets
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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigned = searchParams.get('assigned');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += `${whereClause ? ' AND ' : ''}st.status = $${paramIndex++}`;
      params.push(status);
    }

    if (priority) {
      whereClause += `${whereClause ? ' AND ' : ''}st.priority = $${paramIndex++}`;
      params.push(priority);
    }

    if (assigned === 'me') {
      whereClause += `${whereClause ? ' AND ' : ''}st.assigned_to = $${paramIndex++}`;
      params.push(userId);
    } else if (assigned === 'unassigned') {
      whereClause += `${whereClause ? ' AND ' : ''}st.assigned_to IS NULL`;
    }

    const whereStr = whereClause ? `WHERE ${whereClause}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM support_tickets st ${whereStr}`,
      params
    );
    const count = parseInt(countResult.rows[0]?.total || '0');

    params.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT st.*,
              u.email as user_email, u.full_name as user_full_name,
              a.full_name as assigned_to_full_name
       FROM support_tickets st
       LEFT JOIN user_profiles u ON u.id = st.user_id
       LEFT JOIN user_profiles a ON a.id = st.assigned_to
       ${whereStr}
       ORDER BY st.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return NextResponse.json({ 
      data: dataResult.rows || [],
      total: count
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/support - Update ticket
export async function PATCH(req: NextRequest) {
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

    const { ticket_id, status, assigned_to, priority } = body;

    if (!ticket_id) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (assigned_to !== undefined) {
      updates.assigned_to = assigned_to;
      updates.assigned_at = assigned_to ? new Date().toISOString() : null;
    }
    if (priority) updates.priority = priority;

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
    values.push(ticket_id);

    const updateResult = await pool.query(
      `UPDATE support_tickets 
       SET ${setClauses.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const data = updateResult.rows[0];

    // Log action via RPC
    await pool.query(
      `SELECT * FROM log_admin_action($1, 'update_support_ticket', 'support', $2, NULL, $3)`,
      [userId, data.user_id, { ticket_id, updates }]
    );

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
