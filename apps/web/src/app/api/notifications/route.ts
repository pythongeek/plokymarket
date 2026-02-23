import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';
    const category = searchParams.get('category');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Get unread count
    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .eq('is_dismissed', false);

    return NextResponse.json({
      data: notifications || [],
      unread_count: unreadCount || 0,
      has_more: (notifications?.length || 0) === limit
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, templateId, data, marketId, orderId, senderId, priority } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins or system can create notifications for other users
    // Users can only create for themselves
    if (user.id !== userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!userData?.is_admin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data: notificationId, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_template_id: templateId,
      p_data: data,
      p_market_id: marketId,
      p_order_id: orderId,
      p_sender_id: senderId,
      p_priority: priority
    });

    if (error) throw error;

    return NextResponse.json({ data: { notificationId } });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark as read, dismiss, or snooze
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, notificationIds, snoozeMinutes } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let result;

    switch (action) {
      case 'mark_read':
        if (notificationIds?.length) {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in('id', notificationIds)
            .eq('user_id', user.id);
          if (error) throw error;
        } else {
          // Mark all as read
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('is_read', false);
          if (error) throw error;
        }
        result = { success: true };
        break;

      case 'dismiss':
        if (notificationIds?.length) {
          const { error } = await supabase
            .from('notifications')
            .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
            .in('id', notificationIds)
            .eq('user_id', user.id);
          if (error) throw error;
        }
        result = { success: true };
        break;

      case 'snooze':
        let snoozeUntil: string | null = null;
        if (notificationIds?.length && snoozeMinutes) {
          snoozeUntil = new Date(Date.now() + snoozeMinutes * 60000).toISOString();
          const { error } = await supabase
            .from('notifications')
            .update({ snoozed_until: snoozeUntil })
            .in('id', notificationIds)
            .eq('user_id', user.id);
          if (error) throw error;
        }
        result = { success: true, snoozed_until: snoozeUntil ?? null };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
