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

// POST /api/admin/users/interventions - Perform position intervention
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

    const { 
      user_id, 
      position_id, 
      intervention_type, 
      reason, 
      position_value,
      pnl,
      liquidation_price,
      exit_price,
      risk_level,
      send_notification 
    } = body;

    if (!user_id || !intervention_type || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Perform intervention via RPC
    const rpcResult = await pool.query(
      'SELECT * FROM perform_position_intervention($1, $2, $3, $4, $5)',
      [userId, user_id, position_id, intervention_type, reason, send_notification !== false]
    );
    const interventionId = rpcResult.rows[0]?.id || rpcResult.rows[0];

    if (rpcResult.rows[0]?.error) {
      throw new Error(rpcResult.rows[0].error);
    }

    // Update with additional details if provided
    if (position_value !== undefined && interventionId) {
      await pool.query(
        `UPDATE position_interventions 
         SET position_value = $1, pnl = $2, liquidation_price = $3, exit_price = $4, risk_level_at_time = $5
         WHERE id = $6`,
        [position_value, pnl, liquidation_price, exit_price, risk_level, interventionId]
      );
    }

    // Send real-time notification to user
    if (send_notification !== false && user_id) {
      await pool.query(
        `INSERT INTO notifications 
         (user_id, type, title, body, data, created_at)
         VALUES ($1, 'position_intervention', $2, $3, $4, NOW())`,
        [
          user_id, 
          `Position ${intervention_type === 'liquidation' ? 'Liquidated' : 'Closed'}`,
          `Your position has been ${intervention_type} by admin. Reason: ${reason}`,
          { intervention_id: interventionId, intervention_type }
        ]
      );
    }

    return NextResponse.json({ 
      success: true, 
      intervention_id: interventionId 
    });
  } catch (error: any) {
    console.error('Error performing intervention:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform intervention' },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/interventions - List interventions
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
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (targetUserId) {
      whereClause += `${whereClause ? ' AND ' : ''}pi.user_id = $${paramIndex++}`;
      params.push(targetUserId);
    }

    const whereStr = whereClause ? `WHERE ${whereClause}` : '';

    params.push(limit);
    const dataResult = await pool.query(
      `SELECT pi.*, 
              up.email as user_email, up.full_name as user_full_name,
              pap.full_name as performed_by_full_name
       FROM position_interventions pi
       LEFT JOIN user_profiles up ON up.id = pi.user_id
       LEFT JOIN user_profiles pap ON pap.id = pi.performed_by
       ${whereStr}
       ORDER BY pi.performed_at DESC
       LIMIT $${paramIndex++}`,
      params
    );

    return NextResponse.json({ data: dataResult.rows || [] });
  } catch (error: any) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interventions' },
      { status: 500 }
    );
  }
}
