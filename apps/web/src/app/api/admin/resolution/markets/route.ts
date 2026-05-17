// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/resolution/markets
 * Fetches events that are eligible for resolution based on Sections 2.3.1
 * (trading_status = 'active' AND ends_at passed AND resolution_delay passed)
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Authenticate and Admin Check
        const authResult = await requireAdminUser(request);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;


        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // 2. Fetch resolvable events from the new view
        const dataResult = await pool.query(
            'SELECT * FROM view_resolvable_events ORDER BY ends_at ASC'
        );
        const data = dataResult.rows;

        // 3. Enrich with UMA/Oracle status if available
        const marketIds = data?.map(e => e.id) || [];

        if (marketIds.length > 0) {
            const oracleResult = await pool.query(
                `SELECT market_id, status, proposed_outcome, confidence_score 
                 FROM oracle_requests 
                 WHERE market_id = ANY($1)`,
                [marketIds]
            );

            const oracleMap = new Map();
            oracleResult.rows?.forEach(req => {
                oracleMap.set(req.market_id, req);
            });

            const enrichedData = data.map(e => ({
                ...e,
                oracle: oracleMap.get(e.id) || { status: 'none' }
            }));

            return NextResponse.json({ data: enrichedData });
        }

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
