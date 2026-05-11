// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';
import {
  Activity,
  ContentType,
  MarketMovementActivity,
  TrendingMarketActivity,
  TraderActivity,
  SocialInteractionActivity
} from '@/types/social';

interface DiscoverFeedResponse {
  activities: Activity[];
  trending_markets: TrendingMarketInfo[];
  featured_traders: FeaturedTrader[];
  suggested_follows: SuggestedUser[];
  has_more: boolean;
  next_cursor?: string;
}

interface TrendingMarketInfo {
  market_id: string;
  question: string;
  volume_24h: number;
  price_movement: number;
  probability: number;
  category: string;
  trending_score: number;
}

interface FeaturedTrader {
  user_id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  reputation_score: number;
  accuracy_tier: string;
  total_predictions: number;
  is_followed?: boolean;
}

interface SuggestedUser {
  user_id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  mutual_followers: number;
  reason: 'similar_trades' | 'trending' | 'expert' | 'mutual_connection';
}

// GET /api/discover/feed
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
  const limit = parseInt(searchParams.get('limit') || '20');
  const section = searchParams.get('section') as 'all' | 'trending' | 'people' | undefined;

  try {
    const user = await getUserFromRequest(request);

    // Build the discover feed response
    const result: DiscoverFeedResponse = {
      activities: [],
      trending_markets: [],
      featured_traders: [],
      suggested_follows: [],
      has_more: false
    };

    // Fetch trending markets
    const { data: markets } = await supabase
      .from('markets')
      .select(`
        id,
        question,
        volume_24h,
        price_movement,
        probability,
        category
      `)
      .eq('status', 'open')
      .order('volume_24h', { ascending: false })
      .limit(10);

    if (markets) {
      result.trending_markets = markets.map(m => ({
        market_id: m.id,
        question: m.question,
        volume_24h: m.volume_24h || 0,
        price_movement: m.price_movement || 0,
        probability: m.probability || 50,
        category: m.category || 'general',
        trending_score: ((m.volume_24h || 0) * 0.6 + Math.abs(m.price_movement || 0) * 40)
      })).sort((a, b) => b.trending_score - a.trending_score);
    }

    // Fetch featured traders based on reputation
    const { data: traders } = await supabase
      .from('user_reputations')
      .select(`
        user_id,
        reputation_score,
        accuracy_tier,
        total_predictions,
        users (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .order('reputation_score', { ascending: false })
      .limit(10);

    if (traders) {
      // Get current user's follows to check if already following
      let followedIds: string[] = [];
      if (user) {
        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        followedIds = follows?.map(f => f.following_id) || [];
      }

      result.featured_traders = traders
        .filter(t => t.users && t.reputation_score > 0)
        .map(t => ({
          user_id: t.user_id,
          full_name: t.users.full_name,
          username: t.users.username,
          avatar_url: t.users.avatar_url,
          reputation_score: t.reputation_score,
          accuracy_tier: t.accuracy_tier,
          total_predictions: t.total_predictions,
          is_followed: followedIds.includes(t.user_id)
        }));
    }

    // Fetch suggested users to follow
    if (user) {
      const { data: suggestions } = await supabase
        .rpc('get_suggested_users', {
          p_user_id: user.id,
          p_limit: 5
        });

      if (suggestions) {
        result.suggested_follows = suggestions.map(s => ({
          user_id: s.id,
          full_name: s.full_name,
          username: s.username,
          avatar_url: s.avatar_url,
          bio: s.bio,
          mutual_followers: s.mutual_followers || 0,
          reason: s.reason || 'trending'
        }));
      }

      // Fallback if RPC doesn't exist
      if (result.suggested_follows.length === 0) {
        const { data: nonFollowed } = await supabase
          .from('users')
          .select('id, full_name, username, avatar_url, bio')
          .neq('id', user.id)
          .not('id', 'in', `(${followedIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (nonFollowed) {
          result.suggested_follows = nonFollowed.map(u => ({
            user_id: u.id,
            full_name: u.full_name,
            username: u.username,
            avatar_url: u.avatar_url,
            bio: u.bio,
            mutual_followers: 0,
            reason: 'trending' as const
          }));
        }
      }
    }

    // Fetch activities for the discover feed
    let activitiesQuery = supabase
      .from('activities')
      .select(`
        *,
        user:users!user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .order('algorithmic_weight', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply section filters
    if (section === 'trending') {
      activitiesQuery = activitiesQuery.in('type', ['trending_market', 'market_movement'] as ContentType[]);
    } else if (section === 'people') {
      activitiesQuery = activitiesQuery.in('type', ['follow', 'badge_earned', 'social_interaction'] as ContentType[]);
    }

    // Apply cursor pagination
    if (cursor) {
      activitiesQuery = activitiesQuery.lt('created_at', cursor);
    }

    activitiesQuery = activitiesQuery.limit(limit + 1);

    const { data: activities, error: activitiesError } = await activitiesQuery;

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
    } else if (activities) {
      result.has_more = activities.length > limit;
      result.activities = result.has_more ? activities.slice(0, limit) : activities;
      result.next_cursor = result.has_more 
        ? result.activities[result.activities.length - 1]?.created_at 
        : undefined;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching discover feed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch discover feed' },
      { status: 500 }
    );
  }
}
