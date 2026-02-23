import { createClient } from '@/lib/supabase/server';

export type ActivityType =
    | 'TRADE'
    | 'MARKET_CREATE'
    | 'MARKET_RESOLVE'
    | 'LEAGUE_UP'
    | 'LEAGUE_DOWN'
    | 'COMMENT'
    | 'USER_JOIN';

export interface LogActivityParams {
    userId: string;
    type: ActivityType;
    data: any; // { marketId, marketQuestion, amount, outcome, etc. }
    algorithmicWeight?: number;
    metadata?: any;
}

export class ActivityService {
    /**
     * Logs a platform activity to the database.
     */
    async logActivity(params: LogActivityParams) {
        const supabase = await createClient();

        const { error } = await supabase
            .from('activities')
            .insert({
                user_id: params.userId,
                type: params.type,
                data: params.data,
                algorithmic_weight: params.algorithmicWeight || 1.0,
                metadata: params.metadata || {}
            });

        if (error) {
            console.error('[ActivityService] Failed to log activity:', error);
            // Non-blocking, we don't throw to avoid breaking the caller's logic
        }
    }

    /**
     * Batch log helper
     */
    async logBatch(activities: LogActivityParams[]) {
        const supabase = await createClient();

        const payload = activities.map(a => ({
            user_id: a.userId,
            type: a.type,
            data: a.data,
            algorithmic_weight: a.algorithmicWeight || 1.0,
            metadata: a.metadata || {}
        }));

        const { error } = await supabase.from('activities').insert(payload);
        if (error) console.error('[ActivityService] Batch log failed:', error);
    }
}
