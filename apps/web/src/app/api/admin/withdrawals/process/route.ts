import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/withdrawals/process
// Move withdrawal from pending to processing (hold balance)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: adminRole, error: roleError } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !adminRole) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { withdrawalId, adminNotes } = body;

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID required' },
        { status: 400 }
      );
    }

    // Get withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal already processed' },
        { status: 400 }
      );
    }

    // Check user balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', withdrawal.user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.balance < withdrawal.usdt_amount) {
      return NextResponse.json(
        { error: 'Insufficient user balance' },
        { status: 400 }
      );
    }

    // Create balance hold
    const { data: hold, error: holdError } = await supabase
      .from('balance_holds')
      .insert({
        user_id: withdrawal.user_id,
        amount: withdrawal.usdt_amount,
        hold_type: 'withdrawal',
        reference_id: withdrawalId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();

    if (holdError) {
      console.error('Failed to create balance hold:', holdError);
      return NextResponse.json(
        { error: 'Failed to hold balance' },
        { status: 500 }
      );
    }

    // Deduct balance from user
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({
        balance: profile.balance - withdrawal.usdt_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawal.user_id);

    if (balanceError) {
      console.error('Failed to deduct balance:', balanceError);
      return NextResponse.json(
        { error: 'Failed to deduct balance' },
        { status: 500 }
      );
    }

    // Update withdrawal status to processing
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        balance_hold_id: hold.id,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('Failed to update withdrawal:', updateError);
      return NextResponse.json(
        { error: 'Failed to update withdrawal status' },
        { status: 500 }
      );
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      type: 'withdrawal_processing',
      title: 'উইথড্র প্রসেসিং শুরু হয়েছে',
      message: `আপনার ${withdrawal.usdt_amount} USDT উইথড্র রিকোয়েস্ট প্রসেসিং শুরু হয়েছে।`,
      metadata: {
        withdrawal_id: withdrawalId,
        usdt_amount: withdrawal.usdt_amount,
        bdt_amount: withdrawal.bdt_amount
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal moved to processing',
      data: {
        holdId: hold.id,
        withdrawalId
      }
    });

  } catch (error) {
    console.error('Admin process withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
