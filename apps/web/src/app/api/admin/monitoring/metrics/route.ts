import { requireAdmin } from '@/lib/admin/auth-guard';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    // Platform-wide metrics
    const [
      { count: totalUsers, error: uErr },
      { count: activeUsers, aErr },
      { count: totalMarkets, mErr },
      { count: activeMarkets, amErr },
      { count: totalTrades, tErr },
      { count: totalOrders, oErr },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('activity_feed').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('markets').select('*', { count: 'exact', head: true }),
      supabase.from('markets').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('trades').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]);

    // Recent volume
    const { data: volumeData } = await supabase
      .from('trades')
      .select('price, quantity')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const totalVolume = volumeData?.reduce(
      (sum, t) => sum + parseFloat(t.price) * parseFloat(t.quantity),
      0
    ) || 0;

    // Active conditional orders
    const { count: activeConditions } = await supabase
      .from('conditional_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Pending deposits/withdrawals
    const { count: pendingDeposits } = await supabase
      .from('deposits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Error rate (from admin_audit_log)
    const { count: recentErrors } = await supabase
      .from('admin_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'error')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    return NextResponse.json({
      metrics: {
        users: {
          total: totalUsers || 0,
          active_24h: activeUsers || 0,
        },
        markets: {
          total: totalMarkets || 0,
          active: activeMarkets || 0,
        },
        trading: {
          total_trades: totalTrades || 0,
          total_orders: totalOrders || 0,
          volume_24h: totalVolume,
        },
        operations: {
          active_conditional_orders: activeConditions || 0,
          pending_deposits: pendingDeposits || 0,
          pending_withdrawals: pendingWithdrawals || 0,
        },
        health: {
          errors_last_hour: recentErrors || 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Metrics error:', err);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
