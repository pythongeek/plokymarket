// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';


/**
 * PATCH /api/admin/markets/[id]/fields
 * Update market financial and blockchain fields
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdminUser(request);


        // Admin check
        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { id: marketId } = await params;

        // Whitelist allowed fields
        const allowedFields = [
            'initial_liquidity',
            'volume',
            'condition_id',
            'token1',
            'token2',
            'neg_risk',
            'resolver_reference',
        ];

        const fieldsToUpdate: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in body) {
                fieldsToUpdate[key] = body[key];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
        }

        // Build dynamic UPDATE query
        const setClauses = Object.keys(fieldsToUpdate).map((k, i) => `${k} = $${i + 1}`);
        const values = Object.values(fieldsToUpdate);
        const updateResult = await pool.query(
            `UPDATE markets SET ${setClauses.join(', ')} WHERE id = $${values.length + 1} RETURNING *`,
            [...values, marketId]
        );

        if (updateResult.rows.length === 0) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        // Log admin action (non-blocking)
        pool.query(
            `INSERT INTO admin_audit_log (admin_id, action_type, resource_type, resource_id, new_values, reason, created_at)
             VALUES ($1, 'update_market', 'market', $2, $3, 'Admin field update via portal', NOW())`,
            [userId, marketId, JSON.stringify(fieldsToUpdate)]
        ).catch(() => { });

        return NextResponse.json({ success: true, market: updateResult.rows[0] });
    } catch (error: any) {
        console.error('[Admin Market Fields] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/admin/markets/[id]/fields
 * Get current market field values
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdminUser(request);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;

        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const marketResult = await pool.query(
            `SELECT id, title, status, initial_liquidity, volume, condition_id, token1, token2, neg_risk, resolver_reference, created_at, updated_at
             FROM markets WHERE id = $1`,
            [id]
        );

        const market = marketResult.rows[0];
        if (!market) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        return NextResponse.json({ market });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
