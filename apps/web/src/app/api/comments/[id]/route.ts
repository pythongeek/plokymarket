import { NextRequest, NextResponse } from 'next/server';
import { CommentsService } from '@/lib/social/comments-service';
import { createClient } from '@/lib/supabase/server';

const commentsService = new CommentsService();

// PATCH /api/comments/[id] - Edit comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Missing content' },
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

    const comment = await commentsService.editComment(commentId, user.id, content);

    return NextResponse.json({ data: comment });
  } catch (error: any) {
    console.error('Error editing comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to edit comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await commentsService.deleteComment(commentId, user.id);

    return NextResponse.json({ data: { success: result } });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
