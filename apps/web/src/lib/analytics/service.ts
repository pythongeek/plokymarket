import { createClient } from '@/utils/supabase/server';

export type AnalyticsPeriod = '24h' | '7d' | '30d' | 'all';
export type MetricType = 'trading' | 'users' | 'financial' | 'risk' | 'market_quality';

export interface AnalyticsResponse {
    summary: Record<string, any>;
    series: any[];
}

export class AnalyticsService {
    /**
     * Fetch aggregated analytics data from the database
     */
    async getMetrics(period: AnalyticsPeriod, type: MetricType): Promise<AnalyticsResponse> {
        const supabase = createClient();

        try {
            const { data, error } = await supabase.rpc('get_platform_analytics', {
                p_period: period,
                p_metric_type: type
            });

            if (error) {
                console.error('Analytics RPC Error:', error);
                throw new Error(`Failed to fetch analytics: ${error.message}`);
            }

            // Ensure consistent structure even if null
            return data || { summary: {}, series: [] };
        } catch (err) {
            console.error('Analytics Service Error:', err);
            return { summary: {}, series: [] };
        }
    }

    /**
     * Trigger a manual refresh of the hourly snapshots (e.g. via cron or admin action)
     */
    async refreshSnapshots(): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.rpc('populate_analytics_last_24h');

        if (error) {
            console.error('Snapshot Refresh Error:', error);
            throw error;
        }
    }
}

export const analyticsService = new AnalyticsService();
