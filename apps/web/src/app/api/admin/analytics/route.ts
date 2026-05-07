import { NextRequest, NextResponse } from 'next/server';
import { analyticsService, AnalyticsPeriod, MetricType } from '@/lib/analytics/service';
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as AnalyticsPeriod) || '24h';
    const type = (searchParams.get('type') as MetricType) || 'trading';

    // Security Check: Verify Admin via cloud Supabase JWT
    const authResult = await requireAdminUser(request);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    // Check admin flag in local DB
    const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
        'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
        [userId]
    );

    if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
