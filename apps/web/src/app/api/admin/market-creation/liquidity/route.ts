import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketCreationService } from '@/lib/market-creation/service';

// POST /api/admin/market-creation/liquidity - Record liquidity deposit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draft_id, tx_hash, amount } = body;

    if (!draft_id || !tx_hash || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('id', user.id).single();

    const success = await MarketCreationService.recordLiquidityDeposit(supabase, user.id, {
      draft_id,
      tx_hash,
      amount,
      is_admin: !!profile?.is_admin
    });

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('Error recording liquidity deposit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record deposit' },
      { status: 500 }
    );
  }
}
