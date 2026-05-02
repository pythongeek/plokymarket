import { NextRequest, NextResponse } from 'next/server';
import { analyticsService, AnalyticsPeriod, MetricType } from '@/lib/analytics/service';
import { pool, query } from '@/lib/admin/local-db';

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

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as AnalyticsPeriod) || '24h';
    const type = (searchParams.get('type') as MetricType) || 'trading';

    // Security Check: Verify Admin via cloud Supabase JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userId = await getUserFromToken(token);

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
