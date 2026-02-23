import { createClient } from '@/lib/supabase/server';

export class LeaderboardService {

    /**
     * Calculates advanced metrics (ROI, Streak, Accuracy) for a user
     */
    async calculateUserMetrics(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly') {
        const supabase = await createClient();

        // 1. Fetch Positions & Trades for PnL calculation
        const { data: positions } = await supabase
            .from('positions')
            .select('*, markets(status, winning_outcome)')
            .eq('user_id', userId);

        if (!positions || positions.length === 0) return;

        let totalVolume = 0;
        let realizedPnL = 0;
        let correctPredictions = 0;
        let totalResolved = 0;
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        // Sort by resolution time for streak
        const sortedPositions = [...positions]
            .filter(p => p.markets?.status === 'resolved')
            .sort((a, b) => new Date(a.markets?.resolved_at || 0).getTime() - new Date(b.markets?.resolved_at || 0).getTime());

        sortedPositions.forEach(pos => {
            const entryPrice = pos.average_price || 0;
            const quantity = pos.quantity || 0;
            const won = pos.markets?.winning_outcome === pos.outcome;
            const pnl = won ? (1 - entryPrice) * quantity : -entryPrice * quantity;

            realizedPnL += pnl;
            totalVolume += entryPrice * quantity;
            totalResolved++;

            if (won) {
                correctPredictions++;
                tempStreak++;
                if (tempStreak > bestStreak) bestStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
        });

        currentStreak = tempStreak;
        const accuracy = totalResolved > 0 ? (correctPredictions / totalResolved) * 100 : 0;
        const roi = totalVolume > 0 ? (realizedPnL / totalVolume) * 100 : 0;

        // 2. Update Cache
        const { error: upsertError } = await supabase
            .from('leaderboard_cache')
            .upsert({
                user_id: userId,
                timeframe: timeframe,
                trading_volume: Math.round(totalVolume * 100), // Store in cents/units if bigint
                realized_pnl: Math.round(realizedPnL * 100),
                roi: Number(roi.toFixed(2)),
                current_streak: currentStreak,
                best_streak: bestStreak,
                score: Math.round((realizedPnL * 110) + (accuracy * 10)), // Custom ranking score
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, timeframe' });

        if (upsertError) {
            console.error(`[Leaderboard] Upsert failed for user ${userId}:`, upsertError);
        }
    }

    /**
     * Mass refresh for all active users
     */
    async refreshLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'weekly') {
        const supabase = await createClient();

        // Fetch users with recent activity (trades or positions)
        const { data: activeUsers } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1000); // Scalability limit for now

        if (activeUsers) {
            console.log(`[Leaderboard] Refreshing metrics for ${activeUsers.length} users...`);
            for (const user of activeUsers) {
                await this.calculateUserMetrics(user.id, timeframe);
            }
        }
    }

    /**
     * Weekly Cron Job to process Leagues
     */
    async processWeeklyLeagues() {
        const supabase = await createClient();
        console.log("Processing Leagues...");

        // 1. Fetch current rankings
        const { data: cache } = await supabase
            .from('leaderboard_cache')
            .select('*')
            .eq('timeframe', 'weekly')
            .order('score', { ascending: false });

        if (!cache || cache.length === 0) return;

        // 2. Promotion/Relegation Logic (e.g., Top 10% move up)
        // This would interact with public.user_leagues
    }
}
