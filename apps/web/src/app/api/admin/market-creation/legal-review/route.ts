import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';

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

// GET /api/admin/market-creation/legal-review - Get review queue
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || '';
    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    if (!profileResult.rows[0]?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const result = await pool.query(
      'SELECT * FROM get_legal_review_queue($1)',
      [userId]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error: any) {
    console.error('Error fetching legal review queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch review queue' },
      { status: 500 }
    );
  }
}

// POST /api/admin/market-creation/legal-review - Submit for review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || '';
    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id, notes } = body;

    if (!draft_id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

    await pool.query(
      'SELECT * FROM submit_for_legal_review($1, $2)',
      [draft_id, notes || null]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting for review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit for review' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/market-creation/legal-review - Complete review
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || '';
    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileResult = await pool.query(
      'SELECT is_admin, is_senior_counsel FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { draft_id, status, notes } = body;

    if (!draft_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approved', 'rejected', 'escalated'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'escalated' && !profile.is_senior_counsel) {
      return NextResponse.json(
        { error: 'Senior counsel required for escalation' },
        { status: 403 }
      );
    }

    await pool.query(
      'SELECT * FROM complete_legal_review($1, $2, $3, $4)',
      [draft_id, userId, status, notes || null]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error completing review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete review' },
      { status: 500 }
    );
  }
}
