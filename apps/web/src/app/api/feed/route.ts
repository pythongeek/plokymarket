import { NextRequest, NextResponse } from 'next/server';
import { FeedService } from '@/lib/social/feed-service';
import { createClient } from '@/lib/supabase/server';

const feedService = new FeedService();

// GET /api/feed
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');
  const type = searchParams.get('type') as any;
  const filterTypes = type ? [type] : undefined;

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let result;
    if (user) {
      // Personalized feed for logged-in users
      result = await feedService.getPersonalizedFeed(user.id, {
        cursor,
        limit,
        filterTypes,
        includeAggregated: true
      });
    } else {
      // Global feed for guests
      result = {
        ...await feedService.getGlobalFeed({ cursor, limit, filterTypes }),
        preferences: null,
        aggregations: [],
        unread_count: 0
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}
