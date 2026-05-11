// @ts-nocheck
import { createPublicClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// GET /api/wallet/transactions
// Get user's transaction history
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
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    let query = supabase
      .from('transactions')
      .select(`
        id,
        amount,
        type,
        description,
        status,
        reference_id,
        metadata,
        created_at,
        completed_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Get current exchange rate for BDT conversion from live table
    const { data: exchangeRateData, error: rateError } = await supabase
      .from('exchange_rates_live')
      .select('usdt_to_bdt')
      .eq('is_active', true)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const exchangeRate = rateError ? 119.0000 : exchangeRateData.usdt_to_bdt;

    // Format transactions with additional metadata
    const formattedTransactions = (transactions || []).map((tx: any) => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      status: tx.status,
      referenceId: tx.reference_id,
      metadata: tx.metadata,
      bdtAmount: parseFloat((tx.amount * exchangeRate).toFixed(2)),
      createdAt: tx.created_at,
      completedAt: tx.completed_at,
      formattedDate: new Date(tx.created_at).toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      count: formattedTransactions.length,
      exchangeRate: exchangeRate
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}