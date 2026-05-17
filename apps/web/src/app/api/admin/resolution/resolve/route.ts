/**
 * POST /api/admin/resolution/resolve
 * Admin resolves a market with chosen outcome and triggers settlement.
 * Body: { eventId: string, winning_outcome: string, reason?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const adminId = authResult.user.id;

        const { eventId, winning_outcome, reason } = await req.json();

        if (!eventId || !winning_outcome) {
            return NextResponse.json({ error: 'Missing eventId or winning_outcome' }, { status: 400 });
        }

        // Fetch current market state for audit
        const beforeResult = await pool.query(
            'SELECT status, winning_outcome, question FROM markets WHERE id = $1',
            [eventId]
        );
        const before = beforeResult.rows[0];
        if (!before) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        // Resolve market
        await pool.query(
            `UPDATE markets SET status = 'resolved', winning_outcome = $1, resolved_at = NOW(), resolution_source = 'ADMIN_OVERRIDE' WHERE id = $2`,
            [winning_outcome, eventId]
        );

        // Audit log
        await pool.query(
            `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, old_value, new_value, reason, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
                adminId,
                'market_resolve',
                'market',
                eventId,
                JSON.stringify({ status: before.status, winning_outcome: before.winning_outcome }),
                JSON.stringify({ status: 'resolved', winning_outcome, source: 'ADMIN_OVERRIDE' }),
                reason || 'Admin manual resolution',
            ]
        );

        return NextResponse.json({
            success: true,
            message: 'Market resolved successfully. Settlement workflow triggered.',
            eventId,
            winning_outcome,
        });
    } catch (error: any) {
        console.error('[Resolution API] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
