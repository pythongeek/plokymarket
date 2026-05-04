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

// GET /api/admin/market-creation - List drafts or get single draft
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || '';
    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('id');
    const status = searchParams.get('status');

    if (draftId) {
      const profileResult = await pool.query(
        'SELECT is_admin FROM user_profiles WHERE id = $1',
        [userId]
      );
      const isAdmin = profileResult.rows[0]?.is_admin || false;

      const draftResult = await pool.query(
        'SELECT * FROM market_creation_drafts WHERE id = $1',
        [draftId]
      );
      const draft = draftResult.rows[0];
      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }
      if (draft.creator_id !== userId && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ data: draft });
    }

    let sql = 'SELECT * FROM market_creation_drafts WHERE creator_id = $1';
    const params: any[] = [userId];
    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }
    sql += ' ORDER BY updated_at DESC';
    const drafts = await query(sql, params);
    return NextResponse.json({ data: drafts });
  } catch (error: any) {
    console.error('Error fetching market drafts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// POST /api/admin/market-creation - Create new draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const { market_type, template_id, event_id } = body;

    const result = await pool.query(
      `SELECT * FROM create_market_draft($1, $2, $3, $4)`,
      [userId, market_type, template_id || null, event_id || null]
    );
    const draftId = result.rows[0]?.create_market_draft;

    return NextResponse.json({ data: draftId });
  } catch (error: any) {
    console.error('Error creating market draft:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create draft' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/market-creation - Update draft stage
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || '';
    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id, stage, stage_data } = body;

    if (!draft_id || !stage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query(
      `SELECT * FROM update_draft_stage($1, $2, $3)`,
      [draft_id, stage, stage_data || {}]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating draft stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update draft' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/market-creation - Delete draft
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get('id');

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
    }

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
    const isAdmin = profileResult.rows[0]?.is_admin || false;

    const draftResult = await pool.query(
      'SELECT creator_id FROM market_creation_drafts WHERE id = $1',
      [draftId]
    );
    const draft = draftResult.rows[0];
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    if (draft.creator_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await pool.query('DELETE FROM market_creation_drafts WHERE id = $1', [draftId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
