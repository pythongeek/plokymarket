import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/withdrawals/request
// Create a new withdrawal request
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, mfsProvider, recipientNumber, recipientName } = body;

    // Validation
    if (!amount || !mfsProvider || !recipientNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const usdtAmount = parseFloat(amount);
    if (isNaN(usdtAmount) || usdtAmount < 1) {
      return NextResponse.json(
        { error: 'Withdrawal amount must be at least 1 USDT' },
        { status: 400 }
      );
    }

    if (!/^[01][3-9]\d{8}$/.test(recipientNumber)) {
      return NextResponse.json(
        { error: 'Invalid Bangladeshi mobile number format' },
        { status: 400 }
      );
    }

    // Get user profile and check balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, daily_withdrawal_limit, last_withdrawal_date')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to get user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check balance
    if (profile.balance < usdtAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Check daily withdrawal limit
    const today = new Date().toISOString().split('T')[0];
    const lastWithdrawalDate = profile.last_withdrawal_date;
    
    let dailyTotal = 0;
    if (lastWithdrawalDate === today) {
      const { data: todayWithdrawals, error: todayError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'withdrawal')
        .eq('status', 'completed')
        .gte('created_at', `${today}T00:00:00Z`);

      if (todayError) {
        console.error('Failed to check daily withdrawals:', todayError);
        return NextResponse.json(
          { error: 'Failed to check withdrawal limits' },
          { status: 500 }
        );
      }

      dailyTotal = todayWithdrawals?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
    }

    if ((dailyTotal + usdtAmount) > profile.daily_withdrawal_limit) {
      return NextResponse.json(
        { error: `Daily withdrawal limit exceeded. Limit: ${profile.daily_withdrawal_limit} USDT` },
        { status: 400 }
      );
    }

    // Get current exchange rate
    const { data: exchangeRateData, error: rateError } = await supabase
      .from('exchange_rates')
      .select('bdt_to_usdt')
      .eq('effective_until', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (rateError) {
      console.error('Failed to get exchange rate:', rateError);
      return NextResponse.json(
        { error: 'Unable to get current exchange rate' },
        { status: 500 }
      );
    }

    const exchangeRate = exchangeRateData.bdt_to_usdt;
    const bdtAmount = parseFloat((usdtAmount * exchangeRate).toFixed(2));

    // Get client IP and user agent
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create withdrawal request
    const { data: withdrawalRequest, error: insertError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        usdt_amount: usdtAmount,
        bdt_amount: bdtAmount,
        exchange_rate: exchangeRate,
        mfs_provider: mfsProvider,
        recipient_number: recipientNumber,
        recipient_name: recipientName || null,
        status: 'pending',
        ip_address: clientIp,
        user_agent: userAgent
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create withdrawal request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    // Trigger withdrawal processing workflow via Upstash
    try {
      const workflowResponse = await fetch(`${process.env.UPSTASH_WORKFLOW_BASE_URL}/withdrawal-processing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.UPSTASH_WORKFLOW_TOKEN}`
        },
        body: JSON.stringify({
          withdrawalId: withdrawalRequest.id,
          userId: user.id,
          amount: usdtAmount,
          mfsProvider: mfsProvider,
          recipientNumber: recipientNumber
        })
      });

      if (!workflowResponse.ok) {
        console.warn('Failed to trigger withdrawal processing workflow');
      }
    } catch (workflowError) {
      console.warn('Workflow processing failed:', workflowError);
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalRequest: {
        id: withdrawalRequest.id,
        usdtAmount: withdrawalRequest.usdt_amount,
        bdtAmount: withdrawalRequest.bdt_amount,
        mfsProvider: withdrawalRequest.mfs_provider,
        recipientNumber: withdrawalRequest.recipient_number,
        status: withdrawalRequest.status,
        createdAt: withdrawalRequest.created_at
      }
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/withdrawals/request
// Get user's withdrawal requests
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('withdrawal_requests')
      .select(`
        id,
        usdt_amount,
        bdt_amount,
        mfs_provider,
        recipient_number,
        recipient_name,
        status,
        admin_notes,
        processed_by,
        processed_at,
        cancelled_at,
        cancellation_reason,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: withdrawals, error } = await query;

    if (error) {
      console.error('Failed to fetch withdrawal requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawal requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
      count: withdrawals?.length || 0
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/withdrawals/request/:id/cancel
// Cancel a pending withdrawal request
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const withdrawalId = params.id;
    const body = await request.json();
    const { reason } = body;

    // Get withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Check if withdrawal can be cancelled
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending withdrawals can be cancelled' },
        { status: 400 }
      );
    }

    // Update withdrawal status to cancelled
    const { data: updatedWithdrawal, error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || 'User cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to cancel withdrawal:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel withdrawal' },
        { status: 500 }
      );
    }

    // Release any holds (if processing started)
    if (withdrawal.balance_hold_id) {
      const { error: holdError } = await supabase
        .from('balance_holds')
        .update({
          released_at: new Date().toISOString(),
          released_by: user.id,
          released_reason: 'withdrawal_cancelled'
        })
        .eq('id', withdrawal.balance_hold_id);

      if (holdError) {
        console.warn('Failed to release hold on cancellation:', holdError);
      }

      // Add back to balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({
          balance: supabase.rpc('add', [supabase.raw('balance'), withdrawal.usdt_amount]),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (balanceError) {
        console.warn('Failed to restore balance on cancellation:', balanceError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal cancelled successfully',
      withdrawal: {
        id: updatedWithdrawal.id,
        status: updatedWithdrawal.status,
        cancelledAt: updatedWithdrawal.cancelled_at
      }
    });

  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}