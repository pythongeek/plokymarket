// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

/**
 * POST /api/comments/[id]/like
 * Toggle like on a comment
 * Returns: { liked: boolean, likeCount: number }
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

    const { id: commentId } = await params;

    // Use the toggle function
    const { data, error } = await supabase.rpc('toggle_comment_like', {
      p_comment_id: commentId
    });

    if (error) {
      console.error('[Comment Like] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get updated like count
    const { data: comment } = await supabase
      .from('market_comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    return NextResponse.json({
      liked: data.liked,
      likeCount: comment?.like_count || 0,
    });
  } catch (error) {
    console.error('[Comment Like] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments/[id]/like
 * Check if user has liked this comment
 * Returns: { liked: boolean, likeCount: number }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createPublicClient();
    const user = await getUserFromRequest(request);
    const { id: commentId } = await params;

    // Get like count regardless of auth status
    const { data: comment } = await supabase
      .from('market_comments')
      .select('like_count')
      .eq('id', commentId)
      .single();

    if (!user) {
      return NextResponse.json({
        liked: false,
        likeCount: comment?.like_count || 0,
      });
    }

    // Check if user has liked
    const { data: like } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('comment_id', commentId)
      .single();

    return NextResponse.json({
      liked: !!like,
      likeCount: comment?.like_count || 0,
    });
  } catch (error) {
    console.error('[Comment Like Check] Unexpected error:', error);
    return NextResponse.json({
      liked: false,
      likeCount: 0,
    });
  }
}
