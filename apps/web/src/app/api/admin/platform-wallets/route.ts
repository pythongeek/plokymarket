import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/platform-wallets
 * Returns active platform wallet addresses
 */
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('platform_wallets')
            .select('method, wallet_number, wallet_name, instructions')
            .eq('is_active', true)
            .order('display_order');

        if (error) throw error;

        return NextResponse.json({ wallets: data || [] });
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
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { method, wallet_number, wallet_name, instructions, is_active, display_order } = body;

        // Upsert by method
        const { data, error } = await supabase
            .from('platform_wallets')
            .upsert({
                method,
                wallet_number,
                wallet_name,
                instructions,
                is_active: is_active ?? true,
                display_order: display_order ?? 0,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'method' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, wallet: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
