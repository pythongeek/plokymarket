import { NextRequest, NextResponse } from 'next/server';
import { feedService } from '@/lib/services/feedService';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

// GET /api/follows - Get follow status, followers, or following
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


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'status', 'followers', 'following'
    const userId = searchParams.get('userId');
    const user = await getUserFromRequest(request);

    if (!user) {
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
    const user = await getUserFromRequest(request);

    if (!user) {
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
