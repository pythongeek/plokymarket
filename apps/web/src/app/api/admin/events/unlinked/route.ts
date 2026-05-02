// apps/web/src/app/api/admin/events/unlinked/route.ts
// Get unlinked events (events without markets) for EventLinkingPanel
// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { NextRequest, NextResponse } from 'next/server';

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

// GET /api/admin/events/unlinked - Get events that don't have markets
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
      'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active events
    const eventsResult = await pool.query(
      `SELECT id, title, question, category, trading_closes_at, status 
       FROM events 
       WHERE status = 'active'
       ORDER BY trading_closes_at ASC`
    );

    if (eventsResult.error) {
      return NextResponse.json({ error: eventsResult.error.message }, { status: 500 });
    }

    // Get all markets with event_id to find linked events
    const marketsResult = await pool.query(
      `SELECT event_id FROM markets WHERE event_id IS NOT NULL`
    );

    const linkedEventIds = new Set(
      (marketsResult.rows || [])
        .map((m: any) => m.event_id)
        .filter(Boolean)
    );

    // Filter to only unlinked events
    const unlinked = (eventsResult.rows || []).filter((e: any) => !linkedEventIds.has(e.id));

    return NextResponse.json({ data: unlinked });
  } catch (err: any) {
    console.error('[admin/events/unlinked] Unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
