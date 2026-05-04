// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/admin-auth';

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

// GET /api/admin/kyc/settings - Get platform KYC settings
export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM kyc_settings WHERE id = 1');

        if (result.rows.length === 0) {
            return NextResponse.json({
                withdrawal_threshold: 5000,
                required_documents: ['id_document', 'selfie'],
                auto_approve_enabled: false,
                auto_approve_max_risk_score: 30,
                kyc_globally_required: false,
                updated_at: null
            });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error getting KYC settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get KYC settings' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/kyc/settings - Update platform KYC settings
export async function PUT(req: NextRequest) {
    try {
        // Auth via requireAdminUser (local JWT validation)
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const { user: adminUser, pool: adminPool } = authResult;
    const userId = adminUser.id;
        }

        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await req.json();
        const allowedFields = [
            'withdrawal_threshold',
            'required_documents',
            'auto_approve_enabled',
            'auto_approve_max_risk_score',
            'kyc_globally_required',
        ];

        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        // Validate threshold
        if (updates.withdrawal_threshold !== undefined && updates.withdrawal_threshold < 0) {
            return NextResponse.json(
                { error: 'Withdrawal threshold must be non-negative' },
                { status: 400 }
            );
        }

        updates.updated_by = userId;
        updates.updated_at = new Date().toISOString();

        const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
        const values = [...Object.values(updates), 1];

        const result = await pool.query(
            `UPDATE kyc_settings SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error: any) {
        console.error('Error updating KYC settings:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update KYC settings' },
            { status: 500 }
        );
    }
}
