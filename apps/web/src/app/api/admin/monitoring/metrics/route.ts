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

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1] || '';
    const userId = await getUserFromToken(token);
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileResult = await pool.query(
        'SELECT is_admin FROM user_profiles WHERE id = $1',
        [userId]
    );
    if (!profileResult.rows[0]?.is_admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
    // Platform-wide metrics
    const [
        totalUsersResult,
        activeUsersResult,
        totalMarketsResult,
        activeMarketsResult,
        totalTradesResult,
        totalOrdersResult,
    ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM user_profiles'),
        pool.query('SELECT COUNT(*) as count FROM activity_feed WHERE created_at >= $1', [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]),
        pool.query('SELECT COUNT(*) as count FROM markets'),
        pool.query('SELECT COUNT(*) as count FROM markets WHERE status = $1', ['active']),
        pool.query('SELECT COUNT(*) as count FROM trades'),
        pool.query('SELECT COUNT(*) as count FROM orders'),
    ]);

    const totalUsers = parseInt(totalUsersResult.rows[0]?.count || '0');
    const activeUsers = parseInt(activeUsersResult.rows[0]?.count || '0');
    const totalMarkets = parseInt(totalMarketsResult.rows[0]?.count || '0');
    const activeMarkets = parseInt(activeMarketsResult.rows[0]?.count || '0');
    const totalTrades = parseInt(totalTradesResult.rows[0]?.count || '0');
    const totalOrders = parseInt(totalOrdersResult.rows[0]?.count || '0');

    // Recent volume
    const volumeResult = await pool.query(
        'SELECT price, quantity FROM trades WHERE created_at >= $1',
        [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]
    );

    const totalVolume = volumeResult.rows?.reduce(
        (sum: number, t: any) => sum + parseFloat(t.price) * parseFloat(t.quantity),
        0
    ) || 0;

    // Active conditional orders
    const activeConditionsResult = await pool.query(
        'SELECT COUNT(*) as count FROM conditional_orders WHERE status = $1',
        ['active']
    );
    const activeConditions = parseInt(activeConditionsResult.rows[0]?.count || '0');

    // Pending deposits/withdrawals
    const pendingDepositsResult = await pool.query(
        'SELECT COUNT(*) as count FROM deposits WHERE status = $1',
        ['pending']
    );
    const pendingDeposits = parseInt(pendingDepositsResult.rows[0]?.count || '0');

    const pendingWithdrawalsResult = await pool.query(
        'SELECT COUNT(*) as count FROM withdrawals WHERE status = $1',
        ['pending']
    );
    const pendingWithdrawals = parseInt(pendingWithdrawalsResult.rows[0]?.count || '0');

    // Error rate (from admin_audit_log)
    const recentErrorsResult = await pool.query(
        'SELECT COUNT(*) as count FROM admin_audit_log WHERE action = $1 AND created_at >= $2',
        ['error', new Date(Date.now() - 60 * 60 * 1000).toISOString()]
    );
    const recentErrors = parseInt(recentErrorsResult.rows[0]?.count || '0');

    return NextResponse.json({
      metrics: {
        users: {
          total: totalUsers,
          active_24h: activeUsers,
        },
        markets: {
          total: totalMarkets,
          active: activeMarkets,
        },
        trading: {
          total_trades: totalTrades,
          total_orders: totalOrders,
          volume_24h: totalVolume,
        },
        operations: {
          active_conditional_orders: activeConditions,
          pending_deposits: pendingDeposits,
          pending_withdrawals: pendingWithdrawals,
        },
        health: {
          errors_last_hour: recentErrors,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Metrics error:', err);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
