import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/comments/[id]/like
 * Toggle like on a comment. Returns { liked: boolean, like_count: number }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = params.id;

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('user_id', user.id)
    .eq('comment_id', commentId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId);
  } else {
    await supabase
      .from('comment_likes')
      .insert({ user_id: user.id, comment_id: commentId });
  }

  const { count } = await supabase
    .from('comment_likes')
    .select('comment_id', { count: 'exact', head: true })
    .eq('comment_id', commentId);

  return NextResponse.json({ liked: !existing, like_count: count ?? 0 });
}
