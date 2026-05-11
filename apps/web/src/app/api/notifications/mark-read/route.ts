import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

/**
 * POST /api/notifications/mark-read
 * Mark notifications as read
 * Body: { notificationIds?: string[] } - if empty, marks all as read
 * Returns: { markedRead: number }
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


export async function POST(req: NextRequest) {
  try {
    const supabase = await createPublicClient();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const notificationIds = body.notificationIds;

    // Use RPC function to mark as read
    const { data, error } = await supabase.rpc('mark_notifications_read', {
      p_notification_ids: notificationIds?.length > 0 ? notificationIds : null,
    });

    if (error) {
      console.error('[Mark Read] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Mark Read] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/mark-read/count
 * Get unread notification count
 * Returns: { unreadCount: number }
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createPublicClient();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const { data, error } = await supabase.rpc('get_unread_notification_count');

    if (error) {
      console.error('[Unread Count] Error:', error);
      return NextResponse.json({ unreadCount: 0 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Unread Count] Unexpected error:', error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
