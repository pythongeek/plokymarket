import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/withdrawals/reject
// Reject a withdrawal (refund balance to user)
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
    const { withdrawalId, rejectionReason } = body;

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID required' },
        { status: 400 }
      );
    }

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Rejection reason required (minimum 5 characters)' },
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

    if (withdrawal.status !== 'processing') {
      return NextResponse.json(
        { error: 'Withdrawal must be in processing state to reject' },
        { status: 400 }
      );
    }

    // Use the database function to reject withdrawal
    const { data: result, error: functionError } = await supabase
      .rpc('process_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_user_id: withdrawal.user_id,
        p_approve: false,
        p_admin_notes: rejectionReason
      });

    if (functionError) {
      console.error('Failed to reject withdrawal:', functionError);
      return NextResponse.json(
        { error: 'Failed to reject withdrawal: ' + functionError.message },
        { status: 500 }
      );
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      type: 'withdrawal_rejected',
      title: 'উইথড্র বাতিল হয়েছে',
      message: `আপনার ${withdrawal.usdt_amount} USDT উইথড্র রিকোয়েস্ট বাতিল করা হয়েছে। কারণ: ${rejectionReason}`,
      metadata: {
        withdrawal_id: withdrawalId,
        usdt_amount: withdrawal.usdt_amount,
        rejection_reason: rejectionReason
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal rejected and balance refunded',
      data: { 
        withdrawalId,
        refundedAmount: withdrawal.usdt_amount
      }
    });

  } catch (error) {
    console.error('Admin reject withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
