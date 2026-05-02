/**
 * API Route: /api/admin/categories
 * Get and update category settings (sorting, visibility)
 */
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

// GET /api/admin/categories - Get all category settings
export async function GET() {
    try {
        const result = await pool.query(
            'SELECT * FROM category_settings ORDER BY display_order ASC'
        );

        return NextResponse.json(result.rows || []);
    } catch (error) {
        console.error('[Categories GET]', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// PUT /api/admin/categories - Update category settings (bulk)
export async function PUT(req: NextRequest) {
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { categories } = body;

        if (!categories || !Array.isArray(categories)) {
            return NextResponse.json({ error: 'Categories array is required' }, { status: 400 });
        }

        // Update each category
        for (const cat of categories) {
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (cat.display_name !== undefined) { updates.push(`display_name = $${paramIndex++}`); values.push(cat.display_name); }
            if (cat.display_order !== undefined) { updates.push(`display_order = $${paramIndex++}`); values.push(cat.display_order); }
            if (cat.is_visible !== undefined) { updates.push(`is_visible = $${paramIndex++}`); values.push(cat.is_visible); }
            if (cat.is_featured !== undefined) { updates.push(`is_featured = $${paramIndex++}`); values.push(cat.is_featured); }
            if (cat.icon_emoji !== undefined) { updates.push(`icon_emoji = $${paramIndex++}`); values.push(cat.icon_emoji); }

            if (updates.length > 0) {
                values.push(cat.category_key);
                await pool.query(
                    `UPDATE category_settings SET ${updates.join(', ')} WHERE category_key = $${paramIndex}`,
                    values
                );
            }
        }

        // Fetch updated categories
        const result = await pool.query(
            'SELECT * FROM category_settings ORDER BY display_order ASC'
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('[Categories PUT]', error);
        return NextResponse.json({ error: 'Failed to update categories' }, { status: 500 });
    }
}
