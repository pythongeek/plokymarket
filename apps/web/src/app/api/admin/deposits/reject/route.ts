import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/deposits/reject
// Reject a deposit request
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

    // Check if user has admin role — use user_profiles.is_admin
    const { data: profile, error: roleError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin')
      .eq('id', user.id)
      .single();

    if (roleError || (!profile?.is_admin && !profile?.is_super_admin)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { depositId, reason } = body;

    if (!depositId) {
      return NextResponse.json(
        { error: 'Deposit ID required' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Rejection reason required (minimum 5 characters)' },
        { status: 400 }
      );
    }

    const service = await createServiceClient() as any;

    // Get deposit request
    const { data: deposit, error: depositError } = await service
      .from('deposit_requests')
      .select('*')
      .eq('id', depositId)
      .single();

    if (depositError || !deposit) {
      return NextResponse.json(
        { error: 'Deposit request not found' },
        { status: 404 }
      );
    }

    if ((deposit as any).status !== 'pending') {
      return NextResponse.json(
        { error: 'Deposit already processed' },
        { status: 400 }
      );
    }

    // Update deposit request as rejected
    const { error: updateError } = await service
      .from('deposit_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', depositId);

    if (updateError) {
      console.error('Failed to reject deposit:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject deposit' },
        { status: 500 }
      );
    }

    // Create notification for user
    await service.from('notifications').insert({
      user_id: (deposit as any).user_id,
      type: 'deposit_rejected',
      title: 'ডিপোজিট বাতিল হয়েছে',
      message: `আপনার ৳${(deposit as any).bdt_amount} ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে। কারণ: ${reason}`,
      metadata: {
        deposit_id: depositId,
        rejection_reason: reason
      }
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Deposit rejected successfully'
    });

  } catch (error) {
    console.error('Admin reject deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
