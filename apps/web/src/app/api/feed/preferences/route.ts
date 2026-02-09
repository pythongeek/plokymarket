import { NextRequest, NextResponse } from 'next/server';
import { FeedService } from '@/lib/social/feed-service';
import { createClient } from '@/lib/supabase/server';

const feedService = new FeedService();

// GET /api/feed/preferences
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const preferences = await feedService.getPreferences(user.id);
    return NextResponse.json({ data: preferences });
  } catch (error: any) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/feed/preferences
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const preferences = await feedService.updatePreferences(user.id, body);
    return NextResponse.json({ data: preferences });
  } catch (error: any) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
