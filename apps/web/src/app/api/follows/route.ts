import { NextRequest, NextResponse } from 'next/server';
import { feedService } from '@/lib/services/feedService';
import { createClient } from '@/lib/supabase/server';

// GET /api/follows - Get follow status, followers, or following
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'status', 'followers', 'following'
    const userId = searchParams.get('userId');

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = user.id;
    const targetUserId = userId || currentUserId;

    switch (type) {
      case 'status':
        if (!userId || userId === currentUserId) {
          return NextResponse.json({ error: 'Cannot check follow status for yourself' }, { status: 400 });
        }
        const status = await feedService.getFollowStatus(currentUserId, userId);
        return NextResponse.json({ data: status });

      case 'followers':
        const followers = await feedService.getFollowers(targetUserId);
        return NextResponse.json({ data: followers });

      case 'following':
        const following = await feedService.getFollowing(targetUserId);
        return NextResponse.json({ data: following });

      default:
        // Return both followers and following counts
        const [followersList, followingList] = await Promise.all([
          feedService.getFollowers(targetUserId),
          feedService.getFollowing(targetUserId)
        ]);
        return NextResponse.json({
          data: {
            followers_count: followersList.length,
            following_count: followingList.length,
            followers: followersList.slice(0, 10),
            following: followingList.slice(0, 10)
          }
        });
    }
  } catch (error: any) {
    console.error('Error in follows API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch follow data' },
      { status: 500 }
    );
  }
}

// POST /api/follows - Follow a user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetUserId, action = 'follow' } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    let result;
    if (action === 'follow') {
      result = await feedService.followUser(user.id, targetUserId);
    } else if (action === 'unfollow') {
      result = await feedService.unfollowUser(user.id, targetUserId);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error in follow action:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process follow action' },
      { status: 500 }
    );
  }
}
