// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


/**
 * POST /api/admin/markets/batch
 * Batch create markets from events
 * Body: {
 *   markets: Array<{
 *     event_id: string,
 *     name: string,
 *     name_bn: string,
 *     category: string,
 *     question: string,
 *     question_bn: string,
 *     outcomes: string[],
 *     trading_closes_at: string
 *   }>
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);


        // Admin check
        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const { markets } = await req.json();

        if (!Array.isArray(markets) || markets.length === 0) {
            return NextResponse.json({ error: 'No markets provided' }, { status: 400 });
        }

        console.log(`[Batch Market] Creating ${markets.length} markets...`);

        const results = [];
        const errors = [];

        for (const marketData of markets) {
            try {
                const marketType = marketData.outcomes?.length > 2 ? 'multi_outcome' : 'binary';
                const insertResult = await pool.query(
                    `INSERT INTO markets (event_id, name, name_bn, category, question, question_bn, trading_closes_at, status, market_type)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
                     RETURNING *`,
                    [
                        marketData.event_id,
                        marketData.name,
                        marketData.name_bn,
                        marketData.category,
                        marketData.question,
                        marketData.question_bn,
                        marketData.trading_closes_at,
                        marketType
                    ]
                );
                results.push(insertResult.rows[0]);
            } catch (err: any) {
                errors.push({ event_id: marketData.event_id, error: err.message });
            }
        }

        return NextResponse.json({
            success: errors.length === 0,
            count: results.length,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[Batch Market] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
