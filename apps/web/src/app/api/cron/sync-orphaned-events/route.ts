/**
 * Cron: Sync Orphaned Event Definitions
 * GET /api/cron/sync-orphaned-events
 *
 * UNIFIED ARCHITECTURE: orphaned = event_definitions with no linked market.
 * Markets without event_id are NOT orphaned — they're valid standalone markets.
 *
 * Auth: CRON_SECRET bearer token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('cron-secret');
  if (process.env.NODE_ENV === 'production') {
    const secret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
    if (authHeader !== `Bearer ${secret}` && cronSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Find event_definitions that have no linked market in markets.event_id
    const orphanedResult = await pool.query(`
      SELECT
        e.id,
        e.title,
        e.category,
        e.status::TEXT,
        e.created_at,
        e.resolves_at,
        COUNT(m.id)::INT AS linked_markets
      FROM event_definitions e
      LEFT JOIN markets m ON m.event_id = e.id
      GROUP BY e.id, e.title, e.category, e.status, e.created_at, e.resolves_at
      HAVING COUNT(m.id) = 0
      ORDER BY e.created_at DESC
    `);

    const orphanedEvents = orphanedResult.rows || [];

    if (orphanedEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orphaned events found',
        count: 0,
        architecture: 'unified (market IS event)',
      });
    }

    return NextResponse.json({
      success:         true,
      count:           orphanedEvents.length,
      orphaned_events: orphanedEvents.map(e => ({
        id:         e.id,
        title:      e.title,
        category:   e.category,
        status:     e.status,
        created_at: e.created_at,
        resolves_at: e.resolves_at,
      })),
      synced_at:    new Date().toISOString(),
      architecture: 'unified (market IS event)',
    });
  } catch (err) {
    console.error('[Orphan Sync] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
