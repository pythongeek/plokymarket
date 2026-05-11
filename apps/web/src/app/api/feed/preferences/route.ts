import { NextRequest, NextResponse } from 'next/server';
import { FeedService } from '@/lib/social/feed-service';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

const feedService = new FeedService();

// GET /api/feed/preferences
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


export async function GET() {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
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
    const user = await getUserFromRequest(request);

    if (!user) {
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
