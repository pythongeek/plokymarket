import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/withdrawals/process
 * Admin API to process withdrawal requests (approve/reject)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServiceClient();

    // 1. Authenticate Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization Check (Admin Only)
    // Checking against user_profiles for admin status as per guidelines
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !profile?.is_super_admin) {
      return NextResponse.json({ error: 'Access Denied: Admins Only' }, { status: 403 });
    }

    const { withdrawal_id, action, note } = await request.json();
    if (!withdrawal_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Status Verification
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Status check: Must be pending or processing
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return NextResponse.json({ error: 'Invalid withdrawal status for processing' }, { status: 400 });
    }

    if (action === 'approve') {
      // Execute Payout Logic (Mock)
      const payoutResult = await processPayout(withdrawal);

      if (!payoutResult.success) {
        return NextResponse.json({ error: 'Payout Gateway Error' }, { status: 502 });
      }

      // Update withdrawal_requests status to approved
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed', // 'completed' is the final success status in our enum
          processed_at: new Date().toISOString(),
          processed_by: user.id,
          transfer_proof_url: payoutResult.transactionId, // Store mock result
          admin_notes: note || 'Approved by Admin'
        })
        .eq('id', withdrawal_id);

      if (updateError) throw updateError;

      // Release the escrow/hold balance in Supabase via RPC
      // This is necessary because funds are locked during initial request/processing
      const { error: rpcError } = await supabase.rpc('release_balance_hold', { p_id: withdrawal_id });
      if (rpcError) throw rpcError;

    } else if (action === 'reject') {
      // Reject and Refund balance to user via atomic RPC
      const { error: rejectError } = await supabase.rpc('reject_withdrawal', {
        p_id: withdrawal_id,
        p_note: note || 'Rejected by Admin'
      });

      if (rejectError) throw rejectError;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal ${action}ed successfully`,
      status: action === 'approve' ? 'completed' : 'rejected'
    });

  } catch (error: any) {
    console.error('CRITICAL_WITHDRAWAL_ERROR:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * processPayout
 * Mock function for MFS (bKash/Nagad/Rocket) Payout integration
 */
async function processPayout(withdrawal: any) {
  // Placeholder for real MFS Gateway API integration
  // Logic Flow:
  // 1. Prepare Request Payload with recipient number and amount
  // 2. Sign request with platform secret key
  // 3. POST to Gateway API (bKash/Nagad/Rocket)
  // 4. Handle response asynchronously or synchronously

  console.log(`[Payout Mock] Processing ${withdrawal.bdt_amount} BDT for ${withdrawal.recipient_number} via ${withdrawal.mfs_provider}`);

  // Simulating successful gateway response
  return {
    success: true,
    transactionId: `MFS-${withdrawal.mfs_provider.toUpperCase()}-${Date.now()}`
  };
}
