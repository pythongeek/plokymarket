/**
 * API Route: /api/conditional-orders/[id]
 * 
 * Handles individual conditional order operations:
 * - GET: Get single conditional order
 * - DELETE: Cancel a conditional order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('conditional_orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ order: data });
    } catch (err) {
        console.error('Error fetching conditional order:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update status to cancelled
        const { error } = await supabase
            .from('conditional_orders')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancel_reason: 'User requested cancellation',
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .eq('status', 'pending');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error cancelling conditional order:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
