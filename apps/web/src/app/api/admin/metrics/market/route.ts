import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/metrics/market
 * Retrieves the materialized view market metrics
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Authenticate and Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('id, is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        // 2. Fetch Materialized View
        const { data: metrics, error } = await supabase
            .from('market_metrics')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Market Metrics API] Fetch error:', error);

            // If the view doesn't exist yet, return an empty array gracefully
            if (error.code === '42P01') {
                return NextResponse.json({ metrics: [], warning: 'Materialized view not yet created' });
            }

            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ metrics });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
