import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

/**
 * POST /api/markets/[id]/bookmark
 * Toggle bookmark for a market
 * Returns: { bookmarked: boolean }
 */
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


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPublicClient();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: marketId } = await params;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPublicClient();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ bookmarked: false });
    }

    const { id: marketId } = await params;

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
