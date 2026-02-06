import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const searchParams = req.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'weekly';
    const league = searchParams.get('league'); // Filter by league

    let query = supabase
        .from('leaderboard_cache')
        .select(`
      *,
      users:user_id (full_name, avatar_url, username),
      user_leagues:user_id (league_id)
    `)
        .eq('timeframe', timeframe)
        .order('total_pnl', { ascending: false })
        .limit(50); // Pagination needed for production

    // Filter by League if provided
    if (league) {
        // Requires joining or separate filter, Supabase JS simple join filter limits apply.
        // For MVP, we fetch and filter or update schema to have league_id in cache.
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
