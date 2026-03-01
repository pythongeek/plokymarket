import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/markets/[id]/follow
 * Toggle follow for a market. Returns { following: boolean, follower_count: number }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const marketId = params.id;
  const body = await req.json().catch(() => ({}));
  const { notify_on_trade = false, notify_on_resolve = true } = body;

  // Check existing follow
  const { data: existing } = await supabase
    .from('market_followers')
    .select('market_id')
    .eq('user_id', user.id)
    .eq('market_id', marketId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('market_followers')
      .delete()
      .eq('user_id', user.id)
      .eq('market_id', marketId);
  } else {
    await supabase
      .from('market_followers')
      .insert({ user_id: user.id, market_id: marketId, notify_on_trade, notify_on_resolve });
  }

  // Return updated follower count
  const { count } = await supabase
    .from('market_followers')
    .select('market_id', { count: 'exact', head: true })
    .eq('market_id', marketId);

  return NextResponse.json({ following: !existing, follower_count: count ?? 0 });
}
