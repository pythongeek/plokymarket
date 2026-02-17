import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/wallet/transactions
// Get user's transaction history
export async function GET(request: Request) {
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

    // Get current exchange rate for BDT conversion
    const { data: exchangeRateData, error: rateError } = await supabase
      .from('exchange_rates')
      .select('bdt_to_usdt')
      .eq('effective_until', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    const exchangeRate = rateError ? 100.0000 : exchangeRateData.bdt_to_usdt;

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