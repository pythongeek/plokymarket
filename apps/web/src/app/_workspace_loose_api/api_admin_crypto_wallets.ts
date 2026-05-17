// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('platform_crypto_wallets')
      .select('*')
      .order('network', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { network, address, memo_pattern, fee_usdt, confirmation_blocks, instructions } = body;

    if (!network || !address) {
      return NextResponse.json({ error: 'Network and address required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('platform_crypto_wallets')
      .insert({
        network: network.toLowerCase(),
        address,
        memo_pattern: memo_pattern || null,
        fee_usdt: fee_usdt || 0,
        confirmation_blocks: confirmation_blocks || 1,
        instructions: instructions || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { data, error } = await supabase
      .from('platform_crypto_wallets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { error } = await supabase
      .from('platform_crypto_wallets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
