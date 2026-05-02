import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { OracleService } from '@/lib/oracle/service';

const oracleService = new OracleService();

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

/**
 * GET /api/admin/oracle - List oracle requests
 * Query params: ?market_id=...&status=...
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1] || '';
        const userId = await getUserFromToken(token);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const marketId = searchParams.get('market_id');
        const status = searchParams.get('status');
        const pending = searchParams.get('pending') === 'true';

        if (pending) {
            const now = new Date().toISOString();

            // Subquery to find market_ids that already have requests
            const existingResult = await pool.query('SELECT market_id FROM oracle_requests');
            const excludedIds = existingResult.rows?.map((r: any) => r.market_id) || [];

            let pendingSql = `SELECT id, question, category, status, trading_closes_at FROM markets WHERE trading_closes_at < $1 AND status NOT IN ('resolved', 'cancelled')`;
            const pendingParams: any[] = [now];

            if (excludedIds.length > 0) {
                const placeholders = excludedIds.map((_: any, i: number) => `$${i + 2}`).join(', ');
                pendingSql += ` AND id NOT IN (${placeholders})`;
                pendingParams.push(...excludedIds);
            }

            pendingSql += ' LIMIT 20';
            const pendingResult = await pool.query(pendingSql, pendingParams);

            return NextResponse.json({ data: pendingResult.rows });
        }

        let sql = `SELECT or.*, m.question, m.status as market_status, m.category
                   FROM oracle_requests or
                   LEFT JOIN markets m ON m.id = or.market_id
                   ORDER BY or.created_at DESC`;
        const queryParams: any[] = [];

        if (marketId) {
            sql = `SELECT or.*, m.question, m.status as market_status, m.category
                   FROM oracle_requests or
                   LEFT JOIN markets m ON m.id = or.market_id
                   WHERE or.market_id = $1
                   ORDER BY or.created_at DESC`;
            queryParams.push(marketId);
        }
        if (status) {
            const condition = queryParams.length > 0 ? 'AND' : 'WHERE';
            sql += ` ${condition} or.status = $${queryParams.length + 1}`;
            queryParams.push(status);
        }

        sql += ' LIMIT 50';
        const result = await pool.query(sql, queryParams);

        return NextResponse.json({ data: result.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/oracle - Propose outcome for a market
 * Body: { market_id: string, context?: any }
 */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1] || '';
        const userId = await getUserFromToken(token);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Admin check
        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { market_id, context } = body;

        if (!market_id) {
            return NextResponse.json({ error: 'market_id is required' }, { status: 400 });
        }

        // Update market status to AWAITING_RESOLUTION
        await pool.query(
            `UPDATE markets SET status = 'awaiting_resolution' WHERE id = $1`,
            [market_id]
        );

        const proposal = await oracleService.proposeOutcome(market_id, context);

        return NextResponse.json({ data: proposal });
    } catch (error: any) {
        console.error('Oracle proposal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
