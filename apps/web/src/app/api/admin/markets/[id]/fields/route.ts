import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/admin/markets/[id]/fields
 * Update market financial and blockchain fields
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { id: marketId } = await params;

        // Whitelist allowed fields
        const allowedFields = [
            'initial_liquidity',
            'volume',
            'condition_id',
            'token1',
            'token2',
            'neg_risk',
            'resolver_reference',
        ];

        const fieldsToUpdate: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in body) {
                fieldsToUpdate[key] = body[key];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
        }

        // Call the admin update function
        const { data, error } = await supabase.rpc('admin_update_market_fields', {
            p_market_id: marketId,
            p_fields: fieldsToUpdate,
        });

        if (error) {
            console.error('[Admin Market Fields] RPC error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Log admin action
        await supabase.rpc('log_admin_action', {
            p_admin_id: user.id,
            p_action_type: 'update_market',
            p_resource_type: 'market',
            p_resource_id: marketId,
            p_new_values: fieldsToUpdate,
            p_reason: 'Admin field update via portal',
        }).catch(() => { }); // Non-blocking

        return NextResponse.json({ success: true, market: data });
    } catch (error: any) {
        console.error('[Admin Market Fields] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/admin/markets/[id]/fields
 * Get current market field values
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        const { data: market, error } = await supabase
            .from('markets')
            .select(`
        id, title, status,
        initial_liquidity, volume,
        condition_id, token1, token2, neg_risk, resolver_reference,
        created_at, updated_at
      `)
            .eq('id', id)
            .single();

        if (error || !market) {
            return NextResponse.json({ error: 'Market not found' }, { status: 404 });
        }

        return NextResponse.json({ market });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
