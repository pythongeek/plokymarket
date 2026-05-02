// @ts-nocheck
import { pool, query } from '@/lib/admin/local-db';
import { NextRequest, NextResponse } from 'next/server';

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

// GET /api/admin/kyc - List all KYC submissions
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = await getUserFromToken(token);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const profiles = await query<{ is_admin: boolean; is_super_admin: boolean }>(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        if (!profiles[0]?.is_admin && !profiles[0]?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || undefined;
        const search = searchParams.get('search') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query based on filters
        let sql = `
            SELECT 
                id,
                verification_status,
                verification_tier,
                full_name,
                id_type,
                id_number,
                phone_number,
                submitted_at,
                verified_at,
                rejection_reason,
                id_document_front_url,
                id_document_back_url,
                selfie_url,
                proof_of_address_url,
                risk_score,
                daily_withdrawal_limit,
                created_at,
                updated_at
            FROM user_kyc_profiles
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            sql += ` AND verification_status = $${paramIndex++}`;
            params.push(status);
        }

        if (search) {
            sql += ` AND (full_name ILIKE $${paramIndex} OR id_number ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Get total count
        let countSql = sql.replace(/SELECT\s+[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM');
        const countResult = await pool.query(countSql, params);
        const total = parseInt(countResult.rows[0]?.count || '0');

        // Add ordering and pagination
        sql += ` ORDER BY submitted_at DESC NULLS LAST`;
        sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        const result = await pool.query(sql, params);

        return NextResponse.json({
            data: result.rows || [],
            total
        });
    } catch (error: any) {
        console.error('Error listing KYC:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to list KYC submissions' },
            { status: 500 }
        );
    }
}
