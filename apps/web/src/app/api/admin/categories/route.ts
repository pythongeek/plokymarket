/**
 * API Route: /api/admin/categories
 * Get and update category settings (sorting, visibility)
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/categories - Get all category settings
export async function GET() {
    try {
        const supabase = await createClient();
        
        const { data, error } = await supabase
            .from('category_settings')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        return NextResponse.json(data || []);
    } catch (error) {
        console.error('[Categories GET]', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}

// PUT /api/admin/categories - Update category settings (bulk)
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
        const { categories } = body; // Array of { category_key, display_name, display_order, is_visible, is_featured, icon_emoji }
        
        if (!categories || !Array.isArray(categories)) {
            return NextResponse.json({ error: 'Categories array is required' }, { status: 400 });
        }
        
        // Update each category - use explicit typing to avoid deep type instantiation
        const updates = categories.map((cat: { category_key: string; display_name?: string; display_order?: number; is_visible?: boolean; is_featured?: boolean; icon_emoji?: string }) => {
            const updateData: Record<string, any> = {};
            if (cat.display_name !== undefined) updateData.display_name = cat.display_name;
            if (cat.display_order !== undefined) updateData.display_order = cat.display_order;
            if (cat.is_visible !== undefined) updateData.is_visible = cat.is_visible;
            if (cat.is_featured !== undefined) updateData.is_featured = cat.is_featured;
            if (cat.icon_emoji !== undefined) updateData.icon_emoji = cat.icon_emoji;
            return (supabase as any)
                .from('category_settings')
                .update(updateData)
                .eq('category_key', cat.category_key);
        });
        
        await Promise.all(updates);
        
        // Fetch updated categories
        const { data, error } = await supabase
            .from('category_settings')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Categories PUT]', error);
        return NextResponse.json({ error: 'Failed to update categories' }, { status: 500 });
    }
}
