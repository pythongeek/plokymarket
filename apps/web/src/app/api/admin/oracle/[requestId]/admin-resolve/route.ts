import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

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
 * POST /api/admin/oracle/[requestId]/admin-resolve
 * Admin "God Mode" - directly resolve a market with admin's chosen outcome.
 * Body: { winning_outcome: string, reason: string }
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

        // Admin check
        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const { winning_outcome, reason } = body;
        const { requestId } = await params;

        if (!winning_outcome || !reason) {
            return NextResponse.json({ error: 'winning_outcome and reason are required' }, { status: 400 });
        }

        // Get the request to find market_id
        const requestResult = await pool.query(
            'SELECT market_id FROM oracle_requests WHERE id = $1',
            [requestId]
        );

        const oracleRequest = requestResult.rows[0];
        if (!oracleRequest) {
            return NextResponse.json({ error: 'Oracle request not found' }, { status: 404 });
        }

        const now = new Date().toISOString();

        // 1) Update oracle request
        await pool.query(
            `UPDATE oracle_requests SET status = 'finalized', proposed_outcome = $1, confidence_score = 1.0, evidence_text = $2, finalized_at = $3 WHERE id = $4`,
            [`Admin Override: ${winning_outcome}`, `Admin Override: ${reason}`, now, requestId]
        );

        // 2) Resolve market
        await pool.query(
            `UPDATE markets SET status = 'resolved', winning_outcome = $1, resolved_at = $2, resolution_source = 'ADMIN_OVERRIDE' WHERE id = $3`,
            [winning_outcome, now, oracleRequest.market_id]
        );

        return NextResponse.json({
            data: {
                success: true,
                message: `Market resolved via Admin Override. Outcome: ${winning_outcome}`,
                market_id: oracleRequest.market_id,
            },
        });
    } catch (error: any) {
        console.error('Admin resolve error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
