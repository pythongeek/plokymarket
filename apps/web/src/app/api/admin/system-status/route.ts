/**
 * GET /api/admin/system-status - System status check for admin layout
 * Uses local PostgreSQL (pg)
 */
import { NextResponse } from 'next/server';
import { admin } from '@/lib/admin/auth-guard';

export async function GET() {
  const result = await admin();
  if (result.error) return result.error;

  try {
    // Check market_creation_drafts pending count
    const { rows } = await result.pool.query(`
      SELECT COUNT(*) as count FROM market_creation_drafts
      WHERE legal_review_status = 'pending'
    `);
    const pendingMarkets = Number(rows[0]?.count) || 0;

    return NextResponse.json({
      pending_markets: pendingMarkets,
      support_tickets: 0,
      total_alerts: pendingMarkets,
    });
  } catch (err) {
    console.error('System status error:', err);
    return NextResponse.json({ pending_markets: 0, support_tickets: 0, total_alerts: 0 });
  }
}
