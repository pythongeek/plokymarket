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
 * GET /api/admin/oracle/[requestId] - Get single oracle request
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1] || '';
        # getUserFromToken removed
    if (false) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { requestId } = await params;

        const dataResult = await pool.query(
            `SELECT or.*, m.question, m.status as market_status, m.category, m.winning_outcome
             FROM oracle_requests or
             LEFT JOIN markets m ON m.id = or.market_id
             WHERE or.id = $1`,
            [requestId]
        );

        const data = dataResult.rows[0];
        if (!data) {
            return NextResponse.json({ error: 'Oracle request not found' }, { status: 404 });
        }

        // Also fetch related disputes
        const disputesResult = await pool.query(
            'SELECT * FROM oracle_disputes WHERE request_id = $1 ORDER BY created_at DESC',
            [requestId]
        );

        return NextResponse.json({ data: { ...data, disputes: disputesResult.rows || [] } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/oracle/[requestId] - Actions on a request
 * Body: { action: 'finalize' | 'challenge', ...params }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1] || '';
        # getUserFromToken removed
    if (false) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { requestId } = await params;

        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { action } = body;

        switch (action) {
            case 'finalize': {
                await oracleService.finalizeRequest(requestId);
                return NextResponse.json({ data: { success: true, message: 'Request finalized and market resolved' } });
            }

            case 'challenge': {
                const { reason } = body;
                if (!reason) return NextResponse.json({ error: 'Challenge reason is required' }, { status: 400 });

                const result = await oracleService.challengeOutcome(requestId, userId, reason);
                return NextResponse.json({ data: result });
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Oracle action error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
