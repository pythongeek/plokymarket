/**
 * Market Recommendations API
 * Phase 4 - AI-powered market recommendations endpoint
 * 
 * GET /api/markets/recommendations
 * Query params:
 *   - tab: 'personalized' | 'trending' | 'volume'
 *   - limit: number (default 5)
 *   - userId: string (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import type { UnifiedEvent } from '@/types/unified';

export const runtime = 'edge';

interface RecommendationResponse {
  recommendations: Array<{
    event: UnifiedEvent;
    score: number;
    reasons: Array<{
      type: string;
      label: string;
      labelBn: string;
      weight: number;
    }>;
    predictedTrend: 'up' | 'down' | 'stable';
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    timeHorizon: 'short' | 'medium' | 'long';
  }>;
  generatedAt: string;
  version: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'personalized';
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const userId = searchParams.get('userId') || null;

    const supabase = createPublicClient();

    // Build query based on tab
    let query = supabase
      .from('events')
      .select('*')
      .eq('status', 'active');

    // Apply tab-specific filters
    switch (tab) {
      case 'trending':
        query = query.eq('is_trending', true);
        break;
      case 'volume':
        query = query.order('total_volume', { ascending: false });
        break;
      case 'personalized':
      default:
        // For personalized, we'd normally use ML/AI to score
        // For now, just return active events ordered by created_at
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Execute query
    const { data: events, error } = await query
      .limit(limit * 2) // Fetch extra for scoring
      .range(0, limit * 2 - 1);

    if (error) {
      console.error('Error fetching markets for recommendations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    // Get user-specific data if authenticated
    let userPreferences: string[] = [];
    let followedMarkets: string[] = [];
    
    if (userId) {
      // Get user category preferences
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferred_categories')
        .eq('user_id', userId)
        .single();

      if (profile?.preferred_categories) {
        userPreferences = profile.preferred_categories;
      }

      // Get followed markets
      const { data: follows } = await supabase
        .from('market_follows')
        .select('market_id')
        .eq('user_id', userId);

      followedMarkets = follows?.map(f => f.market_id) || [];
    }

    // Score and rank events
    const scoredEvents = events?.map((event) => {
      const reasons: Array<{ type: string; label: string; labelBn: string; weight: number }> = [];
      let score = 0.5;
      let predictedTrend: 'up' | 'down' | 'stable' = 'stable';
      let confidence = 0.5;
      let riskLevel: 'low' | 'medium' | 'high' = 'medium';
      let timeHorizon: 'short' | 'medium' | 'long' = 'medium';

      // Volume scoring (higher volume = higher score)
      const volume = event.total_volume || 0;
      if (volume > 100000) {
        score += 0.2;
        reasons.push({ type: 'volume_surge', label: 'High Volume', labelBn: 'উচ্চ ভলিউম', weight: 0.2 });
      } else if (volume > 10000) {
        score += 0.1;
        reasons.push({ type: 'volume_surge', label: 'Good Volume', labelBn: 'ভালো ভলিউম', weight: 0.1 });
      }

      // Trending scoring
      if (event.is_trending) {
        score += 0.15;
        reasons.push({ type: 'trending', label: 'Trending', labelBn: 'ট্রেন্ডিং', weight: 0.15 });
      }

      // User preference matching (personalized tab)
      if (tab === 'personalized' && userPreferences.length > 0) {
        if (userPreferences.includes(event.category)) {
          score += 0.1;
          reasons.push({ type: 'following', label: 'Preferred Category', labelBn: 'পছন্দের বিভাগ', weight: 0.1 });
        }
      }

      // Followed market boost
      if (followedMarkets.includes(event.id)) {
        score += 0.1;
        reasons.push({ type: 'following', label: 'Following', labelBn: 'অনুসরণ', weight: 0.1 });
      }

      // Price movement scoring (simulated based on recent data)
      // In production, this would use actual price history
      const price = event.current_yes_price || 0.5;
      if (price > 0.7) {
        predictedTrend = 'up';
        confidence = 0.7;
        riskLevel = 'low';
        timeHorizon = 'short';
        reasons.push({ type: 'price_movement', label: 'Bullish Signal', labelBn: 'বুলিশ সংকেত', weight: 0.15 });
      } else if (price < 0.3) {
        predictedTrend = 'down';
        confidence = 0.7;
        riskLevel = 'high';
        timeHorizon = 'short';
        reasons.push({ type: 'price_movement', label: 'Bearish Signal', labelBn: 'বেয়ারিশ সংকেত', weight: 0.15 });
      }

      // Featured/expert picks
      if (event.is_featured) {
        score += 0.1;
        reasons.push({ type: 'expert_pick', label: 'Featured', labelBn: 'বিশেষ সুপারিশ', weight: 0.1 });
      }

      // Normalize score to 0-1 range
      score = Math.min(Math.max(score, 0), 1);

      // Calculate risk based on volume and price
      if (volume < 1000) {
        riskLevel = 'high';
      } else if (volume > 50000) {
        riskLevel = 'low';
      }

      return {
        event,
        score,
        reasons: reasons.slice(0, 3), // Top 3 reasons
        predictedTrend,
        confidence,
        riskLevel,
        timeHorizon,
      };
    });

    // Sort by score and limit
    const sortedRecommendations = scoredEvents
      ?.sort((a, b) => b.score - a.score)
      .slice(0, limit) || [];

    const response: RecommendationResponse = {
      recommendations: sortedRecommendations,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
