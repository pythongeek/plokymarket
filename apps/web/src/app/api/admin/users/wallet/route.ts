import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get admin user from auth header or session
        const authHeader = request.headers.get('authorization');
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify admin status
        const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .select('is_admin, is_super_admin')
            .eq('id', userId)
            .single();

        if (adminError || !adminUser?.is_admin) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action, targetUserId, amount, reason } = body;

        if (!targetUserId || !amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid parameters' },
                { status: 400 }
            );
        }

        let result;

        switch (action) {
            case 'credit':
                result = await supabase.rpc('admin_credit_wallet', {
                    p_admin_id: userId,
                    p_user_id: targetUserId,
                    p_amount: amount,
                    p_reason: reason || 'Admin credit'
                });
                break;

            case 'debit':
                result = await supabase.rpc('admin_debit_wallet', {
                    p_admin_id: userId,
                    p_user_id: targetUserId,
                    p_amount: amount,
                    p_reason: reason || 'Admin debit'
                });
                break;

            case 'get':
                result = await supabase.rpc('admin_get_user_wallet', {
                    p_admin_id: userId,
                    p_user_id: targetUserId
                });
                break;

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }

        if (result.error) {
            return NextResponse.json(
                { success: false, error: result.error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });

    } catch (error: any) {
        console.error('Admin wallet error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const adminId = request.headers.get('x-user-id');

        if (!adminId || !userId) {
            return NextResponse.json(
                { success: false, error: 'Missing parameters' },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify admin
        const { data: adminUser } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', adminId)
            .single();

        if (!adminUser?.is_admin) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        const { data, error } = await supabase.rpc('admin_get_user_wallet', {
            p_admin_id: adminId,
            p_user_id: userId
        });

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data
        });

    } catch (error: any) {
        console.error('Get wallet error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
