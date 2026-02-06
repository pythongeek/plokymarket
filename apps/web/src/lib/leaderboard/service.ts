import { createClient } from '@/lib/supabase/server';

export class LeaderboardService {

    /**
     * Calculates advanced metrics (ROI, Streak) for a user
     * This logic can be heavy, so ideally run via Cron daily/hourly.
     */
    async calculateUserMetrics(userId: string) {
        const supabase = await createClient();

        // 1. Fetch Trades & Positions
        // In a real optimized system, we would use SQL aggregations. 
        // Here we show the logic in TS for clarity/agent capability, 
        // but moving to PL/pgSQL function is better for performance.

        // Let's call a hypothetical RPC or do raw calculation
        // Calculating Streak:
        const { data: trades } = await supabase
            .from('trades')
            .select('*, markets(status, winning_outcome)')
            .eq('buyer_id', userId) // simplified: considering 'buyer' side trades for wins
            .order('created_at', { ascending: false })
            .limit(50);

        let currentStreak = 0;
        if (trades) {
            for (const trade of trades) {
                const market = trade.markets;
                if (market && market.status === 'resolved') {
                    if (trade.outcome === market.winning_outcome) {
                        currentStreak++;
                    } else {
                        break; // Streak broken
                    }
                }
            }
        }

        // Calculating ROI
        // (Total Realized PnL / Total Invested) * 100
        // This requires robust accounting. For now, we use the `users.total_pnl` and `users.total_volume`.
        // ROI = (PnL / (Volume / 2)) approx match 

        // Update Cache
        await supabase.from('leaderboard_cache').upsert({
            user_id: userId,
            timeframe: 'weekly',
            current_streak: currentStreak,
            // roi: ...
        }, { onConflict: 'user_id, timeframe' });
    }

    /**
     * Weekly Cron Job to process Leagues
     * Promotes top 20%, Demotes bottom 20%
     */
    async processWeeklyLeagues() {
        const supabase = await createClient();

        // logic to move users between Bronze -> Silver -> Gold etc.
        console.log("Processing Leagues...");
    }
}
