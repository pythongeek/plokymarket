import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

// GET /api/admin/metrics/revenue
export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all';

    let cutoff: string | null = null;
    if (period === '24h') cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    else if (period === '7d') cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (period === '30d') cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let query: string;
    let values: any[] = [];

    if (cutoff) {
      query = `SELECT COALESCE(SUM(fee_amount), 0) as total_revenue FROM trades WHERE created_at >= $1`;
      values = [cutoff];
    } else {
      query = `SELECT COALESCE(SUM(fee_amount), 0) as total_revenue FROM trades`;
    }

    const result = await pool.query(query, values);
    const totalRevenue = parseFloat(result.rows[0]?.total_revenue || '0');

    return NextResponse.json({
      success: true,
      total_house_revenue: totalRevenue,
      period,
      currency: 'USDT',
    });
  } catch (error: any) {
    console.error('[Revenue Metrics]', error);
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
  }
}
