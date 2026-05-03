/**
 * Cron: Sync Orphaned Events
 * GET /api/cron/sync-orphaned-events
 * 
 * Uses local PostgreSQL (pg) via local-db pool.
 * Auth: CRON_SECRET bearer token + x-cron-secret header.
 * Node.js runtime (uses pg pool)..
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // 1. Verify Cron Authentication
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('cron-secret');
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
    if (authHeader !== `Bearer ${secret}` && cronSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // 2. Fetch orphaned event IDs
    let orphanedEventIds: string[] = [];
    try {
      const { rows } = await pool.query(`SELECT * FROM get_orphaned_event_ids()`);
      orphanedEventIds = rows.map(r => r.id || r);
    } catch (e) {
      console.warn('[Orphan Sync] get_orphaned_event_ids not available:', e);
      return NextResponse.json({ success: true, message: 'Function not available', count: 0 });
    }

    if (!orphanedEventIds || orphanedEventIds.length === 0) {
      return NextResponse.json({ success: true, message: 'No orphaned events found', count: 0 });
    }

    console.log(`[Orphan Sync] Found ${orphanedEventIds.length} orphaned events.`);

    // 3. Fetch full event details
    const { rows: events } = await pool.query(
      `SELECT * FROM events WHERE id = ANY($1)`,
      [orphanedEventIds]
    );

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, message: 'No events found', count: 0 });
    }

    // 4. Return events for upstream processor (QStash, etc.)
    // Note: QStash publishing removed since we don't have QSTASH_TOKEN in edge runtime
    // Events are returned for the caller to handle
    
    return NextResponse.json({
      success: true,
      count: events.length,
      events: events.map(e => ({
        id: e.id,
        question: e.question,
        status: e.status,
        created_at: e.created_at,
      })),
      synced_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Orphan Sync] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
