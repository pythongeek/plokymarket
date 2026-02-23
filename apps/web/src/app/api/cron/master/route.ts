import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// ===================================
// MASTER CRON JOB - Combined for Vercel Free Tier
// Runs: Daily at 00:00 UTC (configurable in vercel.json)
// Handles:
// 1. Weekly rebate calculations (Mondays)
// 2. Daily maker volume aggregation
// 3. Spread reward calculations
// 4. Expired order cleanup
// ===================================

const CRON_SECRET = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const secretFromQuery = req.nextUrl.searchParams.get('secret');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && secretFromQuery !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    timestamp: new Date().toISOString(),
    tasks: [] as any[],
  };

  const supabase = await createServiceClient();

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday
  const isMonday = dayOfWeek === 1;

  try {
    // ===================================
    // TASK 1: Process resting orders (daily)
    // Update total resting time for active orders
    // ===================================
    try {
      const { data: activeOrders, error: fetchError } = await supabase
        .from('resting_orders')
        .select('*')
        .eq('is_active', true);

      if (!fetchError && activeOrders) {
        for (const order of activeOrders) {
          const restingSeconds = Math.floor(
            (now.getTime() - new Date(order.resting_start_time).getTime()) / 1000
          );

          await supabase
            .from('resting_orders')
            .update({ total_resting_seconds: restingSeconds })
            .eq('id', order.id);
        }
      }

      results.tasks.push({
        name: 'update_resting_times',
        status: 'success',
        processed: activeOrders?.length || 0,
      });
    } catch (error: any) {
      results.tasks.push({
        name: 'update_resting_times',
        status: 'error',
        error: error.message,
      });
    }

    // ===================================
    // TASK 2: Aggregate maker volume (daily)
    // Update qualifying volume for orders that rested >1 second
    // ===================================
    try {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yearMonth = yesterday.toISOString().slice(0, 7);

      // Get all orders that qualified yesterday (rested > 1 second)
      const { data: qualifyingOrders, error: ordersError } = await supabase
        .from('resting_orders')
        .select('user_id, quantity, total_resting_seconds')
        .gte('resting_start_time', yesterday.toISOString())
        .lt('resting_start_time', now.toISOString())
        .gte('total_resting_seconds', 1); // Minimum 1 second for anti-spoofing

      if (!ordersError && qualifyingOrders) {
        // Aggregate by user
        const userVolumes: Record<string, number> = {};
        for (const order of qualifyingOrders) {
          userVolumes[order.user_id] = (userVolumes[order.user_id] || 0) + order.quantity;
        }

        // Update volume tracking for each user
        for (const [userId, volume] of Object.entries(userVolumes)) {
          // Get current spread contribution (simplified)
          const spreadContribution = volume * 0.001; // Simplified calculation

          await supabase.rpc('update_maker_volume', {
            p_user_id: userId,
            p_volume: volume,
            p_is_maker: true,
            p_spread_contribution: spreadContribution,
            p_resting_seconds: 86400, // Full day
          });
        }
      }

      results.tasks.push({
        name: 'aggregate_maker_volume',
        status: 'success',
        usersProcessed: Object.keys(qualifyingOrders || {}).length,
      });
    } catch (error: any) {
      results.tasks.push({
        name: 'aggregate_maker_volume',
        status: 'error',
        error: error.message,
      });
    }

    // ===================================
    // TASK 3: Calculate spread rewards (daily)
    // Calculate 7-day rolling average spread for each user
    // ===================================
    try {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get unique users with resting orders in last 7 days
      const { data: activeUsers, error: usersError } = await supabase
        .from('resting_orders')
        .select('user_id, market_id, spread_at_placement')
        .gte('resting_start_time', sevenDaysAgo.toISOString())
        .not('spread_at_placement', 'is', null);

      const userMarketSpreads: Record<string, { spreads: number[]; totalSize: number }> = {};

      if (!usersError && activeUsers) {
        // Calculate average spread per user per market
        for (const order of activeUsers) {
          const key = `${order.user_id}:${order.market_id}`;
          if (!userMarketSpreads[key]) {
            userMarketSpreads[key] = { spreads: [], totalSize: 0 };
          }
          userMarketSpreads[key].spreads.push(order.spread_at_placement);
        }

        // Insert spread reward records
        for (const [key, data] of Object.entries(userMarketSpreads)) {
          const [userId, marketId] = key.split(':');
          const avgSpread = data.spreads.reduce((a, b) => a + b, 0) / data.spreads.length;

          // Determine spread tier
          let spreadTier = 'wide';
          let multiplier = 0.5;
          if (avgSpread < 0.001) {
            spreadTier = 'elite';
            multiplier = 2.0;
          } else if (avgSpread < 0.002) {
            spreadTier = 'tight';
            multiplier = 1.5;
          } else if (avgSpread < 0.005) {
            spreadTier = 'standard';
            multiplier = 1.0;
          }

          await supabase.from('spread_rewards').insert({
            user_id: userId,
            market_id: marketId,
            calculation_date: now.toISOString().split('T')[0],
            avg_spread_7d: avgSpread,
            spread_tier: spreadTier,
            base_multiplier: multiplier,
            final_multiplier: multiplier,
          });
        }
      }

      results.tasks.push({
        name: 'calculate_spread_rewards',
        status: 'success',
        recordsCreated: Object.keys(userMarketSpreads || {}).length,
      });
    } catch (error: any) {
      results.tasks.push({
        name: 'calculate_spread_rewards',
        status: 'error',
        error: error.message,
      });
    }

    // ===================================
    // TASK 4: Weekly rebate calculation (Mondays only)
    // Calculate and create rebate records for previous week
    // ===================================
    if (isMonday) {
      try {
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);

        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);

        // Get all users with maker volume last week
        const { data: volumeData, error: volumeError } = await supabase
          .from('maker_volume_tracking')
          .select('*')
          .eq('year_month', lastWeekStart.toISOString().slice(0, 7));

        if (!volumeError && volumeData) {
          for (const userVolume of volumeData) {
            // Calculate rebate for this user
            await supabase.rpc('calculate_weekly_rebate', {
              p_user_id: userVolume.user_id,
              p_period_start: lastWeekStart.toISOString(),
              p_period_end: lastWeekEnd.toISOString(),
            });
          }
        }

        results.tasks.push({
          name: 'weekly_rebate_calculation',
          status: 'success',
          usersProcessed: volumeData?.length || 0,
          week: `${lastWeekStart.toISOString().split('T')[0]} to ${lastWeekEnd.toISOString().split('T')[0]}`,
        });
      } catch (error: any) {
        results.tasks.push({
          name: 'weekly_rebate_calculation',
          status: 'error',
          error: error.message,
        });
      }
    }

    // ===================================
    // TASK 5: Cleanup old resting orders (daily)
    // Remove tracking for orders older than 30 days
    // ===================================
    try {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: deleted, error: deleteError } = await supabase
        .from('resting_orders')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .eq('is_active', false)
        .select('count');

      results.tasks.push({
        name: 'cleanup_old_orders',
        status: 'success',
        deleted: deleted?.length || 0,
      });
    } catch (error: any) {
      results.tasks.push({
        name: 'cleanup_old_orders',
        status: 'error',
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error: any) {
    console.error('Master cron error:', error);
    return NextResponse.json(
      { success: false, error: error.message, ...results },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export const POST = GET;
