import { NextRequest, NextResponse } from 'next/server';
import { FeedService } from '@/lib/social/feed-service';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

const feedService = new FeedService();

// POST /api/feed/read - Mark activities as read
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
    const body = await req.json().catch(() => ({}));
    const { activityIds } = body;
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (activityIds && activityIds.length > 0) {
      await feedService.markAsRead(user.id, activityIds);
    } else {
      await feedService.markAllAsRead(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
