import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/notifications/mark-read
 * Mark notifications as read
 * Body: { notificationIds?: string[] } - if empty, marks all as read
 * Returns: { markedRead: number }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
