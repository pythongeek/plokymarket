// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { FeedService } from '@/lib/social/feed-service';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

const feedService = new FeedService();

// GET /api/feed
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
  const searchParams = req.nextUrl.searchParams;
  const cursor = searchParams.get('cursor') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50');
  const type = searchParams.get('type') as any;
  const filterTypes = type ? [type] : undefined;

  try {
    const user = await getUserFromRequest(request);

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
