import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/deposits/verify
// Verify a deposit request
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
    const { depositId, adminNotes } = body;

    if (!depositId) {
      return NextResponse.json(
        { error: 'Deposit ID required' },
        { status: 400 }
      );
    }

    const service = await createServiceClient();

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

    // Call Supabase function to verify and credit deposit
    const { data: result, error: functionError } = await service
      .rpc('verify_and_credit_deposit', {
        p_deposit_id: depositId,
        p_user_id: (deposit as any).user_id,
        p_usdt_amount: (deposit as any).usdt_amount,
        p_admin_notes: adminNotes || null
      } as any);

    if (functionError) {
      console.error('Failed to verify deposit:', functionError);
      return NextResponse.json(
        { error: 'Failed to verify deposit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit verified and credited successfully',
      result
    });

  } catch (error) {
    console.error('Admin verify deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}