import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/withdrawals/process
 * Transitions a withdrawal from 'pending' → 'processing'
 * Called when admin starts working on a withdrawal request
 * Frontend sends: { withdrawalId, notes }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServiceClient();

    // 1. Authenticate Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Authorization Check (Admin Only) — use user_profiles.is_admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !profile?.is_super_admin) {
      return NextResponse.json({ error: 'Access Denied: Admins Only' }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawalId, notes } = body;

    if (!withdrawalId) {
      return NextResponse.json({ error: 'Missing withdrawalId' }, { status: 400 });
    }

    // 3. Status Verification — must be 'pending' to start processing
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot start processing: withdrawal is '${withdrawal.status}', must be 'pending'` },
        { status: 400 }
      );
    }

    // 4. Transition: pending → processing
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        admin_notes: notes || 'Processing started by admin',
        processed_by: user.id,
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Withdrawal processing started',
      status: 'processing',
    });

  } catch (error: any) {
    console.error('CRITICAL_WITHDRAWAL_ERROR:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message,
    }, { status: 500 });
  }
}
