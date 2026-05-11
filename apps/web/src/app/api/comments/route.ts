// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { ActivityService } from '@/lib/activity';
import { jwtVerify } from 'jose';

// Simple in-memory rate limiter
const rateLimits = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_POSTS = 10;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const posts = rateLimits.get(userId) || [];
  const recent = posts.filter(t => now - t < RATE_LIMIT_WINDOW);
  rateLimits.set(userId, recent);
  return recent.length >= MAX_POSTS;
}

function recordPost(userId: string) {
  const posts = rateLimits.get(userId) || [];
  posts.push(Date.now());
  rateLimits.set(userId, posts);
}

// Simple sentiment analysis
function analyzeSentiment(content: string): { sentiment: string; score: number } {
  const positive = ['agree', 'bullish', 'win', 'good', 'great', 'buy', 'yes', 'correct'];
  const negative = ['disagree', 'bearish', 'lose', 'bad', 'sell', 'no', 'wrong'];

  const lower = content.toLowerCase();
  let score = 0;
  positive.forEach(w => { if (lower.includes(w)) score += 0.2; });
  negative.forEach(w => { if (lower.includes(w)) score -= 0.2; });

  let sentiment = 'neutral';
  if (score > 0.3) sentiment = 'positive';
  else if (score < -0.3) sentiment = 'negative';

  return { sentiment, score };
}

// GET /api/comments?marketId=xxx
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
  const marketId = searchParams.get('marketId');

  if (!marketId) {
    return NextResponse.json({ error: 'Missing marketId' }, { status: 400 });
  }

  try {

    // Simple query - get all comments for this market
    const { data: comments, error } = await supabase
      .from('market_comments')
      .select(`
        *,
        users:user_id (full_name)
      `)
      .eq('market_id', marketId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Build thread tree
    const commentMap = new Map();
    const roots: any[] = [];

    // First pass
    (comments || []).forEach((c: any) => {
      c.replies = [];
      commentMap.set(c.id, c);
    });

    // Second pass - link parents
    (comments || []).forEach((c: any) => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(c);
      } else {
        roots.push(c);
      }
    });

    return NextResponse.json({
      data: {
        comments: roots,
        total_count: comments?.length || 0,
        has_more: false
      }
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { marketId, content, parentId, marketQuestion } = body;

    if (!marketId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    if (isRateLimited(user.id)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute.' },
        { status: 429 }
      );
    }

    // Get parent depth if replying
    let depthLevel = 0;
    if (parentId) {
      const { data: parent } = await supabase
        .from('market_comments')
        .select('depth_level')
        .eq('id', parentId)
        .single();
      if (parent) {
        depthLevel = parent.depth_level + 1;
      }
    }

    // Analyze sentiment
    const { sentiment, score } = analyzeSentiment(content);

    // Insert comment
    const { data: comment, error } = await supabase
      .from('market_comments')
      .insert({
        market_id: marketId,
        user_id: user.id,
        parent_id: parentId,
        content,
        depth_level: depthLevel,
        is_collapsed: depthLevel >= 3,
        sentiment,
        sentiment_score: score,
        score: 0
      })
      .select('*, users:user_id (full_name)')
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    recordPost(user.id);

    // Log Activity
    const activityService = new ActivityService();
    await activityService.logActivity({
      userId: user.id,
      type: 'COMMENT',
      data: {
        marketId,
        marketQuestion: marketQuestion || 'Market Discussion',
        content: content.slice(0, 100),
        commentId: comment.id
      }
    });

    return NextResponse.json({ data: comment });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post comment' },
      { status: 500 }
    );
  }
}
