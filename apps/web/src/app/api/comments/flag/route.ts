import { NextRequest, NextResponse } from 'next/server';
import { CommentsService } from '@/lib/social/comments-service';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

const commentsService = new CommentsService();

// POST /api/comments/flag
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
    const user = await getUserFromRequest(request);

    if (!user) {
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
