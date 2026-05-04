/**
 * API Route: /api/admin/site-settings
 * Get and update site-wide settings (trading pause, maintenance mode, etc.)
 */
// @ts-nocheck
import { pool } from '@/lib/admin/local-db';
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
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        # getUserFromToken removed
    if (false) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
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
