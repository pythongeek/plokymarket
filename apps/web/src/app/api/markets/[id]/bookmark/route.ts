import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/markets/[id]/bookmark
 * Toggle bookmark for a market
 * Returns: { bookmarked: boolean }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const marketId = params.id;

    // Check if bookmark exists using the toggle function
    const { data, error } = await supabase.rpc('toggle_bookmark', {
      p_market_id: marketId
    });

    if (error) {
      console.error('[Bookmark] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Bookmark] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/markets/[id]/bookmark
 * Check if user has bookmarked this market
 * Returns: { bookmarked: boolean }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ bookmarked: false });
    }

    const marketId = params.id;

    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .eq('market_id', marketId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Bookmark Check] Error:', error);
    }

    return NextResponse.json({ bookmarked: !!data });
  } catch (error) {
    console.error('[Bookmark Check] Unexpected error:', error);
    return NextResponse.json({ bookmarked: false });
  }
}
