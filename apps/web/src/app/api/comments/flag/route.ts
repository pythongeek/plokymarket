import { NextRequest, NextResponse } from 'next/server';
import { CommentsService } from '@/lib/social/comments-service';
import { createClient } from '@/lib/supabase/server';

const commentsService = new CommentsService();

// POST /api/comments/flag
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId, reason, details } = body;

    if (!commentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await commentsService.flagComment(commentId, user.id, reason, details);

    return NextResponse.json({ data: { success: result } });
  } catch (error: any) {
    console.error('Error flagging comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to flag comment' },
      { status: 500 }
    );
  }
}
