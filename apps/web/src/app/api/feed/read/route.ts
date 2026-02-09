import { NextRequest, NextResponse } from 'next/server';
import { FeedService } from '@/lib/social/feed-service';
import { createClient } from '@/lib/supabase/server';

const feedService = new FeedService();

// POST /api/feed/read - Mark activities as read
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { activityIds } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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
