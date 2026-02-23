import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/usdt/debit
 * Debit USDT from a user's wallet (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const userId = formData.get('user_id') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const reason = formData.get('reason') as string;

    if (!userId || !amount || amount <= 0 || !reason) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const service = await createServiceClient();

    // Get current wallet balance and version
    const { data: wallet, error: walletError } = await service
      .from('wallets')
      .select('usdt_balance, locked_usdt, version')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const availableBalance = (wallet.usdt_balance || 0) - (wallet.locked_usdt || 0);

    if (amount > availableBalance) {
      return NextResponse.json({
        error: `অপর্যাপ্ত ব্যালেন্স। ব্যবহারযোগ্য: ${availableBalance.toFixed(2)} USDT`
      }, { status: 400 });
    }

    // Update wallet balance with optimistic locking
    const newBalance = (wallet.usdt_balance || 0) - amount;
    const { error: updateError, count } = await service
      .from('wallets')
      .update({
        usdt_balance: newBalance,
        total_withdrawn: amount,
        version: (wallet.version || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('version', wallet.version || 0);

    if (updateError || count === 0) {
      return NextResponse.json({
        error: 'Concurrency error: The wallet was updated by another process. Please try again.'
      }, { status: 409 });
    }

    // Log transaction
    await service.from('usdt_transactions').insert({
      user_id: userId,
      type: 'admin_debit',
      amount: -amount,
      balance_after: newBalance,
      reference: `admin:${user.id}`,
      metadata: { reason, admin_id: user.id },
      created_at: new Date().toISOString()
    });

    // Log admin action
    await service.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'usdt_debit',
      target_user_id: userId,
      details: { amount, reason },
      created_at: new Date().toISOString()
    });

    console.log(`[Admin Debit] ${user.id} debited ${amount} USDT from ${userId}`);

    return NextResponse.json({
      success: true,
      message: `${amount} USDT সফলভাবে ডেবিট করা হয়েছে`,
      newBalance: newBalance
    });
  } catch (error: any) {
    console.error('[Admin Debit] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}