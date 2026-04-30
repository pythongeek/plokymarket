/**
 * API Route: /api/admin/site-settings
 * Get and update site-wide settings (trading pause, maintenance mode, etc.)
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/site-settings - Get all site settings
export async function GET() {
    try {
        const supabase = await createClient();
        
        // Cast to any to avoid deep type instantiation with site_settings table
        const { data: settings, error } = await (supabase as any)
            .from('site_settings')
            .select('*');
        
        if (error) throw error;
        
        // Convert array to key-value object - use any to avoid deep type instantiation
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
        const supabase = await createClient();
        
        // Check admin权限
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { data: userData } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
        
        if (!userData?.is_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        const body = await req.json();
        const { key, value } = body;
        
        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }
        
        const { error } = await (supabase as any)
            .from('site_settings')
            .update({
                setting_value: value,
                updated_by: user.id
            })
            .eq('id', key);
        
        if (error) throw error;
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SiteSettings PUT]', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
