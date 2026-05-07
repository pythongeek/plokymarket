/**
 * API Route: /api/admin/site-settings
 * Get and update site-wide settings (trading pause, maintenance mode, etc.)
 */
// @ts-nocheck
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';


// GET /api/admin/site-settings - Get all site settings
export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM site_settings');
        const settings = result.rows;
        
        // Convert array to key-value object
        const settingsObj: Record<string, any> = {};
        (settings || []).forEach((s: any) => {
            settingsObj[s.id] = s.setting_value;
        });
        
        return NextResponse.json(settingsObj);
    } catch (error) {
        console.error('[SiteSettings GET]', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT /api/admin/site-settings - Update site settings
export async function PUT(req: NextRequest) {
    try {
        const authResult = await requireAdminUser(req);
        if ('error' in authResult) return authResult.error;
        const userId = authResult.user.id;
        
        // Check admin permissions
        const profileResult = await pool.query(
            'SELECT is_admin FROM user_profiles WHERE id = $1',
            [userId]
        );
        const userData = profileResult.rows[0];
        
        if (!userData?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const body = await req.json();
        const { key, value } = body;
        
        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }
        
        const updateResult = await pool.query(
            `UPDATE site_settings 
             SET setting_value = $1, updated_by = $2 
             WHERE id = $3
             RETURNING *`,
            [value, userId, key]
        );
        
        if (updateResult.rowCount === 0) {
            return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SiteSettings PUT]', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
