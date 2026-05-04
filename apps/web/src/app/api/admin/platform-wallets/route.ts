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
 * GET /api/admin/platform-wallets
 * Returns active platform wallet addresses
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1] || '';
        # getUserFromToken removed
    if (false) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await pool.query(
            'SELECT method, wallet_number, wallet_name, instructions FROM platform_wallets WHERE is_active = true ORDER BY display_order'
        );

        return NextResponse.json({ wallets: result.rows || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/platform-wallets
 * Create or update a platform wallet (admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1] || '';
        # getUserFromToken removed
    if (false) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const profileResult = await pool.query(
            'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const profile = profileResult.rows[0];
        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { method, wallet_number, wallet_name, instructions, is_active, display_order } = body;

        // Upsert by method
        const result = await pool.query(
            `INSERT INTO platform_wallets (method, wallet_number, wallet_name, instructions, is_active, display_order, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (method) DO UPDATE SET
               wallet_number = EXCLUDED.wallet_number,
               wallet_name = EXCLUDED.wallet_name,
               instructions = EXCLUDED.instructions,
               is_active = EXCLUDED.is_active,
               display_order = EXCLUDED.display_order,
               updated_at = NOW()
             RETURNING *`,
            [method, wallet_number, wallet_name, instructions, is_active ?? true, display_order ?? 0]
        );

        return NextResponse.json({ success: true, wallet: result.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
