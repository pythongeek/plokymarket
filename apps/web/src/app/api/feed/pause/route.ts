import { NextRequest, NextResponse } from 'next/server';
import { FeedService } from '@/lib/social/feed-service';
import { createClient } from '@/lib/supabase/server';

const feedService = new FeedService();

// POST /api/feed/pause - Pause/resume notifications
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { duration } = body; // Duration in minutes, null to resume

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await feedService.pauseNotifications(user.id, duration);

    return NextResponse.json({ 
      success: true,
      paused: !!duration,
      until: duration 
        ? new Date(Date.now() + duration * 60000).toISOString()
        : null
    });
  } catch (error: any) {
    console.error('Error pausing notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to pause notifications' },
      { status: 500 }
    );
  }
}
