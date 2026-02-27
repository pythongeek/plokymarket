import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/comments/[id]/like
 * Toggle like on a comment
 * Returns: { liked: boolean, likeCount: number }
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

    const commentId = params.id;

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const commentId = params.id;

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
