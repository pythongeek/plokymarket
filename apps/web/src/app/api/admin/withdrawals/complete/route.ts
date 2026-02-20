import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/withdrawals/complete
// Complete a withdrawal (mark as completed after BDT transfer)
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
    const { withdrawalId, adminNotes, transferProofUrl } = body;

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

    if (withdrawal.status !== 'processing') {
      return NextResponse.json(
        { error: 'Withdrawal not in processing state' },
        { status: 400 }
      );
    }

    // Use the database function to complete withdrawal
    const { data: result, error: functionError } = await supabase
      .rpc('process_withdrawal', {
        p_withdrawal_id: withdrawalId,
        p_user_id: withdrawal.user_id,
        p_approve: true,
        p_admin_notes: adminNotes || null
      });

    if (functionError) {
      console.error('Failed to complete withdrawal:', functionError);
      return NextResponse.json(
        { error: 'Failed to complete withdrawal: ' + functionError.message },
        { status: 500 }
      );
    }

    // Update transfer proof if provided
    if (transferProofUrl) {
      await supabase
        .from('withdrawal_requests')
        .update({ transfer_proof_url: transferProofUrl })
        .eq('id', withdrawalId);
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      type: 'withdrawal_completed',
      title: 'উইথড্র সম্পন্ন হয়েছে',
      message: `আপনার ${withdrawal.usdt_amount} USDT (${withdrawal.bdt_amount} BDT) উইথড্র সম্পন্ন হয়েছে।`,
      metadata: {
        withdrawal_id: withdrawalId,
        usdt_amount: withdrawal.usdt_amount,
        bdt_amount: withdrawal.bdt_amount,
        mfs_provider: withdrawal.mfs_provider,
        recipient_number: withdrawal.recipient_number
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal completed successfully',
      data: { withdrawalId }
    });

  } catch (error) {
    console.error('Admin complete withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
