import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


/**
 * GET /api/admin/metrics/market
 * Retrieves the materialized view market metrics
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate and Admin Check
        const authResult = await requireAdminUser(request);


        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );

        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // 2. Fetch Materialized View
        const { rows: metrics, error } = await pool.query(
            'SELECT * FROM market_metrics ORDER BY created_at DESC'
        );

        if (error) {
            console.error('[Market Metrics API] Fetch error:', error);

            // If the view doesn't exist yet, return an empty array gracefully
            if (error.code === '42P01') {
                return NextResponse.json({ metrics: [], warning: 'Materialized view not yet created' });
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ metrics });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
