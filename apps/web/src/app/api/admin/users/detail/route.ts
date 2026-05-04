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

// GET /api/admin/users/detail?id=xxx - Get user full profile
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
    const targetUserId = searchParams.get('id');

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Log admin view action
    await pool.query(
      `SELECT * FROM log_admin_action($1, 'view_profile', 'kyc', $2, NULL, 'Admin viewing user profile')`,
      [userId, targetUserId]
    );

    // Get user profile via RPC
    const userProfileResult = await pool.query(
      'SELECT * FROM get_user_admin_profile($1)',
      [targetUserId]
    );
    const userProfile = userProfileResult.rows;

    // Get KYC details
    const kycResult = await pool.query(
      'SELECT * FROM user_kyc_profiles WHERE id = $1',
      [targetUserId]
    );
    const kycData = kycResult.rows[0];

    // Get status details
    const statusResult = await pool.query(
      'SELECT * FROM user_status WHERE id = $1',
      [targetUserId]
    );
    const statusData = statusResult.rows[0];

    // Get internal notes
    const notesResult = await pool.query(
      `SELECT uin.*, up.full_name as created_by_full_name
       FROM user_internal_notes uin
       LEFT JOIN user_profiles up ON up.id = uin.created_by
       WHERE uin.user_id = $1
       ORDER BY uin.created_at DESC`,
      [targetUserId]
    );
    const notes = notesResult.rows;

    // Get recent interventions
    const interventionsResult = await pool.query(
      `SELECT * FROM position_interventions 
       WHERE user_id = $1
       ORDER BY performed_at DESC
       LIMIT 10`,
      [targetUserId]
    );
    const interventions = interventionsResult.rows;

    // Get support tickets
    const ticketsResult = await pool.query(
      `SELECT st.*, up.full_name as assigned_to_full_name
       FROM support_tickets st
       LEFT JOIN user_profiles up ON up.id = st.assigned_to
       WHERE st.user_id = $1
       ORDER BY st.created_at DESC
       LIMIT 10`,
      [targetUserId]
    );
    const tickets = ticketsResult.rows;

    return NextResponse.json({
      profile: userProfile?.[0] || null,
      kyc: kycData,
      status: statusData,
      notes: notes || [],
      interventions: interventions || [],
      tickets: tickets || []
    });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/detail/notes - Add internal note
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

    const { user_id, note, note_type, is_escalation, escalated_to, escalation_reason } = body;

    if (!user_id || !note) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insertResult = await pool.query(
      `INSERT INTO user_internal_notes 
       (user_id, created_by, note, note_type, is_escalation, escalated_to, escalation_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, userId, note, note_type || 'general', is_escalation || false, escalated_to, escalation_reason]
    );

    const data = insertResult.rows[0];

    // Log action
    await pool.query(
      `SELECT * FROM log_admin_action($1, 'add_internal_note', 'support', $2, NULL, $3)`,
      [userId, user_id, { note_id: data.id, note_type, escalation: is_escalation ? `Escalation: ${escalation_reason}` : 'Internal note added' }]
    );

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add note' },
      { status: 500 }
    );
  }
}
