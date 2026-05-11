// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, addRateLimitHeaders, RateLimitTier } from '@/lib/upstash/rateLimit';
import { jwtVerify } from 'jose';

// POST /api/deposits/request
// Create a new deposit request
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export async function POST(request: Request) {
  try {

    // Get user session
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Apply deposit-specific rate limiting (10 deposits per hour max)
    const depositResult = await checkRateLimit(
      request,
      RateLimitTier.STRICT,
      user.id,
      'deposit'
    );
    
    if (!depositResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Deposit rate limit exceeded. Please try again later.',
          code: 'DEPOSIT_RATE_LIMITED',
          retryAfter: depositResult.retryAfter,
        },
        { status: 429 }
      );
      return addRateLimitHeaders(response, depositResult);
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

    // Get user session
    const user = await getUserFromRequest(request);

    if (!user) {
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