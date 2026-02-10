import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Verify draft ownership
    const { data: draft } = await supabase
      .from('market_creation_drafts')
      .select('creator_id, liquidity_commitment')
      .eq('id', draft_id)
      .single();

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Check if user is creator or admin
    if (draft.creator_id !== user.id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Check minimum liquidity requirement ($1,000)
    if (amount < 1000) {
      return NextResponse.json(
        { error: 'Minimum liquidity commitment is $1,000' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc('record_liquidity_deposit', {
      p_draft_id: draft_id,
      p_tx_hash: tx_hash,
      p_amount: amount
    });

    if (error) throw error;

    return NextResponse.json({ success: data });
  } catch (error: any) {
    console.error('Error recording liquidity deposit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record deposit' },
      { status: 500 }
    );
  }
}
