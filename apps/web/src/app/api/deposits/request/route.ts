import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/deposits/request
// Create a new deposit request
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
    const { bdtAmount, mfsProvider, txnId, senderNumber, senderName } = body;

    // Validation
    if (!bdtAmount || !mfsProvider || !txnId || !senderNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const amount = parseFloat(bdtAmount);
    if (isNaN(amount) || amount < 50 || amount > 50000) {
      return NextResponse.json(
        { error: 'Deposit amount must be between 50 and 50,000 BDT' },
        { status: 400 }
      );
    }

    if (!/^[01][3-9]\d{8}$/.test(senderNumber)) {
      return NextResponse.json(
        { error: 'Invalid Bangladeshi mobile number format' },
        { status: 400 }
      );
    }

    if (txnId.length < 8) {
      return NextResponse.json(
        { error: 'Transaction ID must be at least 8 characters' },
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
    const usdtAmount = parseFloat((amount / exchangeRate).toFixed(2));

    // Check for duplicate transaction ID
    const { data: existingDeposit, error: duplicateError } = await supabase
      .from('deposit_requests')
      .select('id')
      .eq('txn_id', txnId.toUpperCase())
      .eq('mfs_provider', mfsProvider)
      .single();

    if (existingDeposit) {
      return NextResponse.json(
        { error: 'This Transaction ID has already been used' },
        { status: 409 }
      );
    }

    // Get client IP and user agent
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create deposit request
    const { data: depositRequest, error: insertError } = await supabase
      .from('deposit_requests')
      .insert({
        user_id: user.id,
        bdt_amount: amount,
        usdt_amount: usdtAmount,
        exchange_rate: exchangeRate,
        mfs_provider: mfsProvider,
        txn_id: txnId.toUpperCase(),
        sender_number: senderNumber,
        sender_name: senderName || null,
        status: 'pending',
        ip_address: clientIp,
        user_agent: userAgent
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create deposit request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create deposit request' },
        { status: 500 }
      );
    }

    // Trigger notification workflow via Upstash
    try {
      const workflowResponse = await fetch(`${process.env.UPSTASH_WORKFLOW_BASE_URL}/deposit-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.UPSTASH_WORKFLOW_TOKEN}`
        },
        body: JSON.stringify({
          userId: user.id,
          bdtAmount: amount,
          mfsProvider: mfsProvider,
          txnId: txnId.toUpperCase()
        })
      });

      if (!workflowResponse.ok) {
        console.warn('Failed to trigger deposit notification workflow');
      }
    } catch (workflowError) {
      console.warn('Workflow notification failed:', workflowError);
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit request submitted successfully',
      depositRequest: {
        id: depositRequest.id,
        bdtAmount: depositRequest.bdt_amount,
        usdtAmount: depositRequest.usdt_amount,
        mfsProvider: depositRequest.mfs_provider,
        txnId: depositRequest.txn_id,
        status: depositRequest.status,
        createdAt: depositRequest.created_at
      }
    });

  } catch (error) {
    console.error('Deposit request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/deposits/request
// Get user's deposit requests
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
      .from('deposit_requests')
      .select(`
        id,
        bdt_amount,
        usdt_amount,
        mfs_provider,
        txn_id,
        sender_number,
        sender_name,
        status,
        admin_notes,
        rejection_reason,
        verified_at,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: deposits, error } = await query;

    if (error) {
      console.error('Failed to fetch deposit requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deposit requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deposits: deposits || [],
      count: deposits?.length || 0
    });

  } catch (error) {
    console.error('Get deposits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}