import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/usdt/credit
 * Credit USDT to a user's wallet (Admin only)
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

    // Get current wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('usdt_balance')
      .eq('user_id', userId)
      .single();

    if (walletError) {
      // Create wallet if doesn't exist
      await supabase.from('wallets').insert({
        user_id: userId,
        usdt_balance: amount,
        locked_usdt: 0,
        total_deposited: amount,
        total_withdrawn: 0
      });
    } else {
      // Update wallet balance
      await supabase
        .from('wallets')
        .update({
          usdt_balance: (wallet.usdt_balance || 0) + amount,
          total_deposited: (wallet.usdt_balance || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    // Log transaction
    await supabase.from('usdt_transactions').insert({
      user_id: userId,
      type: 'admin_credit',
      amount: amount,
      balance_after: (wallet?.usdt_balance || 0) + amount,
      reference: `admin:${user.id}`,
      metadata: { reason, admin_id: user.id },
      created_at: new Date().toISOString()
    });

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'usdt_credit',
      target_user_id: userId,
      details: { amount, reason },
      created_at: new Date().toISOString()
    });

    console.log(`[Admin Credit] ${user.id} credited ${amount} USDT to ${userId}`);

    return NextResponse.json({
      success: true,
      message: `${amount} USDT সফলভাবে ক্রেডিট করা হয়েছে`,
      newBalance: (wallet?.usdt_balance || 0) + amount
    });
  } catch (error: any) {
    console.error('[Admin Credit] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}