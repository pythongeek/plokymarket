import { createClient } from '@/lib/supabase/server';

export type ActivityType =
    | 'TRADE'
    | 'MARKET_CREATE'
    | 'MARKET_RESOLVE'
    | 'LEAGUE_UP'
    | 'LEAGUE_DOWN'
    | 'COMMENT'
    | 'USER_JOIN';

export class ActivityService {

    async logActivity(userId: string, type: ActivityType, data: any) {
        const supabase = await createClient();

        const { error } = await supabase
            .from('activities')
            .insert({
                user_id: userId,
                type,
                data
            });

        if (error) {
            console.error('Failed to log activity:', error);
            // We don't throw here to avoid blocking the main action (like a trade)
        }
    }

    async getGlobalFeed(limit = 50) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('activities')
            .select(`
        *,
        users (
          username,
          full_name,
          avatar_url
        )
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
}
