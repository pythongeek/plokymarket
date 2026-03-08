import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get admin user from headers
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

        if (adminError || (!adminUser?.is_admin && !adminUser?.is_super_admin)) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { action, userIds, amount, reason } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No users selected' },
                { status: 400 }
            );
        }

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Invalid amount' },
                { status: 400 }
            );
        }

        const validActions = ['credit', 'debit'];
        if (!action || !validActions.includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid action' },
                { status: 400 }
            );
        }

        // Process each user
        const results = [];
        const errors = [];

        for (const targetUserId of userIds) {
            try {
                // Get or create wallet for user
                let { data: wallet, error: walletError } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', targetUserId)
                    .single();

                if (walletError || !wallet) {
                    // Create wallet if doesn't exist
                    const { data: newWallet, error: newWalletError } = await supabase
                        .from('wallets')
                        .insert({ user_id: targetUserId })
                        .select()
                        .single();

                    if (newWalletError) {
                        errors.push({ userId: targetUserId, error: newWalletError.message });
                        continue;
                    }
                    wallet = newWallet;
                }

                if (action === 'credit') {
                    // Credit USDT to wallet
                    const { error: creditError } = await supabase
                        .from('wallets')
                        .update({
                            usdt_balance: (wallet.usdt_balance || 0) + amount,
                            total_deposited: (wallet.total_deposited || 0) + amount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', targetUserId);

                    if (creditError) {
                        errors.push({ userId: targetUserId, error: creditError.message });
                    } else {
                        // Log transaction
                        await supabase.from('transactions').insert({
                            user_id: targetUserId,
                            transaction_type: 'deposit',
                            amount: amount,
                            status: 'completed',
                            description: reason || `Bulk USDT credit by admin`,
                            created_at: new Date().toISOString()
                        });

                        results.push({ userId: targetUserId, success: true });
                    }
                } else {
                    // Debit USDT from wallet
                    const currentBalance = wallet.usdt_balance || 0;
                    if (currentBalance < amount) {
                        errors.push({ userId: targetUserId, error: 'Insufficient balance' });
                        continue;
                    }

                    const { error: debitError } = await supabase
                        .from('wallets')
                        .update({
                            usdt_balance: currentBalance - amount,
                            total_withdrawn: (wallet.total_withdrawn || 0) + amount,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', targetUserId);

                    if (debitError) {
                        errors.push({ userId: targetUserId, error: debitError.message });
                    } else {
                        // Log transaction
                        await supabase.from('transactions').insert({
                            user_id: targetUserId,
                            transaction_type: 'withdrawal',
                            amount: -amount,
                            status: 'completed',
                            description: reason || `Bulk USDT debit by admin`,
                            created_at: new Date().toISOString()
                        });

                        // Log admin action
                        await supabase.from('admin_actions').insert({
                            admin_id: userId,
                            action: 'usdt_bulk_debit',
                            target_user_id: targetUserId,
                            details: { amount, reason },
                            created_at: new Date().toISOString()
                        });

                        results.push({ userId: targetUserId, success: true });
                    }
                }
            } catch (err: any) {
                errors.push({ userId: targetUserId, error: err.message });
            }
        }

        return NextResponse.json({
            success: results.length > 0,
            processed: results.length,
            failed: errors.length,
            results,
            errors
        });

    } catch (error: any) {
        console.error('Bulk USDT wallet error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
