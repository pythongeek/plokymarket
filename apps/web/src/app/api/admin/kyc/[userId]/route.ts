// @ts-nocheck
/**
 * KYC Admin API — per-user KYC details and actions
 * Auth: Local JWT validated via requireAdminUser (jose)
 */

import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/kyc/[userId] — Get specific user's KYC details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // ─── AUTH (local JWT) ─────────────────────────────────────────────
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        // adminUserId is the admin performing the action (not the target userId)

        const { userId } = await params;

        // Fetch profile
        const profileResult = await pool.query(
            'SELECT * FROM user_kyc_profiles WHERE id = $1',
            [userId]
        );

        // Fetch submissions
        const submissionsResult = await pool.query(
            'SELECT * FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        // Fetch overrides
        const overridesResult = await pool.query(
            'SELECT * FROM kyc_admin_overrides WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        // Get gate status
        let gate = {
            needs_kyc: false,
            reason: 'error',
            kyc_status: profileResult.rows[0]?.verification_status || 'unverified',
            total_withdrawn: 0,
            threshold: 5000,
        };

        try {
            const gateResult = await pool.query(
                'SELECT * FROM check_kyc_withdrawal_gate($1)',
                [userId]
            );
            if (gateResult.rows.length > 0) {
                gate = gateResult.rows[0];
            }
        } catch (gateError) {
            console.warn('check_kyc_withdrawal_gate error:', gateError);
        }

        return NextResponse.json({
            profile: profileResult.rows[0] || null,
            submissions: submissionsResult.rows || [],
            overrides: overridesResult.rows || [],
            gate,
        });
    } catch (error: any) {
        console.error('Error getting user KYC:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get user KYC' },
            { status: 500 }
        );
    }
}

// POST /api/admin/kyc/[userId] — Perform KYC action (approve/reject/force/waive/override)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        // ─── AUTH (local JWT) ─────────────────────────────────────────────
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const adminUserId = authResult.user.id;

        const { userId } = await params;
        const body = await req.json();
        const { action, reason, rejection_reason } = body;

        const validActions = ['approve', 'reject', 'force_kyc', 'waive_kyc', 'revoke_override'];
        if (!validActions.includes(action)) {
            return NextResponse.json(
                { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
                { status: 400 }
            );
        }

        if (action === 'reject' && !rejection_reason) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        // Call the admin_kyc_action RPC
        try {
            const result = await pool.query(
                'SELECT * FROM admin_kyc_action($1, $2, $3, $4, $5)',
                [adminUserId, userId, action, reason || null, rejection_reason || null]
            );

            return NextResponse.json(result.rows[0] || { success: true });
        } catch (rpcError: any) {
            console.error('admin_kyc_action RPC error:', rpcError);
            return NextResponse.json(
                { error: rpcError.message || 'Failed to perform KYC action' },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('Error performing KYC action:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to perform KYC action' },
            { status: 500 }
        );
    }
}
