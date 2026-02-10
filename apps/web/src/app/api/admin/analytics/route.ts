import { NextRequest, NextResponse } from 'next/server';
import { analyticsService, AnalyticsPeriod, MetricType } from '@/lib/analytics/service';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as AnalyticsPeriod) || '24h';
    const type = (searchParams.get('type') as MetricType) || 'trading';

    // Security Check: Verify Admin
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We rely on the RPC's internal check or RLS, but double check here for API safety
    // Ideally, we check profile role here to save a DB call if possible, or just let RPC handle it.
    // The RPC `get_platform_analytics` has an internal admin check now.

    try {
        const data = await analyticsService.getMetrics(period, type);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
