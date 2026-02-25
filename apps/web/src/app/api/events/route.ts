/**
 * Public Events API — serves active events for the homepage
 * Uses admin client to bypass RLS on the events table
 */
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const getAdmin = () => createAdminClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET() {
    try {
        const supabase = getAdmin();
        const { data, error } = await supabase
            .from('events')
            .select('id, title, question, description, category, subcategory, tags, image_url, slug, status, is_featured, trading_closes_at, starts_at, ends_at, total_volume, created_at')
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[Events API] Error:', error);
            return NextResponse.json([]);
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error('[Events API] Fatal:', err);
        return NextResponse.json([]);
    }
}
