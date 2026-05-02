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

// POST /api/admin/market-creation/liquidity - Record liquidity deposit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || '';
    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id, tx_hash, amount } = body;

    if (!draft_id || !tx_hash || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const isAdmin = profileResult.rows[0]?.is_admin || false;

    // Verify draft ownership/permissions
    const draftResult = await pool.query(
      'SELECT creator_id FROM market_creation_drafts WHERE id = $1',
      [draft_id]
    );
    const draft = draftResult.rows[0];
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    if (draft.creator_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (amount < 1000) {
      return NextResponse.json(
        { error: 'Minimum liquidity commitment is $1,000' },
        { status: 400 }
      );
    }

    await pool.query(
      'SELECT * FROM record_liquidity_deposit($1, $2, $3)',
      [draft_id, tx_hash, amount]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error recording liquidity deposit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record deposit' },
      { status: 500 }
    );
  }
}
