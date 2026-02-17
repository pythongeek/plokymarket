/**
 * Expert Panel API - Vercel Edge Function
 * Optimized for speed with Redis caching
 * Free tier friendly with minimal compute
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redisCommand } from '@/lib/upstash/redis';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Cache key for top experts
const CACHE_KEY = 'experts:top_10';
const CACHE_TTL = 300; // 5 minutes

// Initialize Supabase
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * GET: Fetch top experts (cached)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Try Redis cache first
    const cachedData = await redisCommand('GET', CACHE_KEY);
    
    if (cachedData) {
      const experts = JSON.parse(cachedData);
      return NextResponse.json({
        experts,
        cached: true,
        executionTimeMs: Date.now() - startTime
      }, {
        headers: {
          'X-Cache': 'HIT',
          'X-Response-Time': `${Date.now() - startTime}ms`
        }
      });
    }

    // 2. If not in cache, fetch from Supabase
    const supabase = getSupabase();
    
    const { data: experts, error } = await supabase
      .from('expert_panel')
      .select(`
        id,
        expert_name,
        credentials,
        specializations,
        bio,
        avatar_url,
        reputation_score,
        accuracy_rate,
        expert_rating,
        rank_tier,
        total_votes,
        is_verified,
        is_active
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('reputation_score', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    // 3. Update Redis cache (async, don't wait)
    redisCommand('SET', CACHE_KEY, JSON.stringify(experts), 'EX', CACHE_TTL).catch(console.error);

    return NextResponse.json({
      experts: experts || [],
      cached: false,
      executionTimeMs: Date.now() - startTime
    }, {
      headers: {
        'X-Cache': 'MISS',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error: any) {
    console.error('[Experts API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch experts',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Get weighted consensus for an event
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get weighted consensus using database function
    const { data: consensus, error } = await supabase.rpc(
      'get_weighted_expert_consensus',
      { p_event_id: eventId }
    );

    if (error) {
      throw error;
    }

    // Get individual expert votes with details
    const { data: votes, error: votesError } = await supabase
      .from('expert_votes')
      .select(`
        id,
        vote_outcome,
        confidence_level,
        reasoning,
        ai_relevance_score,
        ai_verification_status,
        points_earned,
        expert:expert_id (
          expert_name,
          reputation_score,
          rank_tier,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (votesError) {
      throw votesError;
    }

    return NextResponse.json({
      eventId,
      consensus: consensus || [],
      votes: votes || [],
      executionTimeMs: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('[Experts API] Consensus error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get consensus',
        details: error.message
      },
      { status: 500 }
    );
  }
}
