/**
 * Expert Panel Resolution System
 * Weighted voting by verified experts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

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


export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

// Calculate weighted vote result
function calculateWeightedResult(votes: any[]) {
  let yesWeight = 0;
  let noWeight = 0;
  let totalWeight = 0;

  for (const vote of votes) {
    const weight = vote.expert_weight || 1;
    totalWeight += weight;

    if (vote.vote === 'yes') {
      yesWeight += weight;
    } else {
      noWeight += weight;
    }
  }

  const yesPercentage = (yesWeight / totalWeight) * 100;
  const threshold = 60; // 60% weighted majority required

  return {
    outcome: yesPercentage >= threshold ? 'yes' : 'no',
    yes_percentage: yesPercentage,
    yes_weight: yesWeight,
    no_weight: noWeight,
    total_weight: totalWeight,
    total_votes: votes.length,
    threshold_met: yesPercentage >= threshold || (100 - yesPercentage) >= threshold
  };
}

// Cast vote
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = await createServiceClient();

    // Verify expert
    const { data: { user } } = await getUserFromRequest(request)
    const { data: expert } = await supabase
      .from('expert_panel')
      .select('*')
      .eq('user_id', user?.id as string)
      .eq('is_verified', true)
      .single();

    if (!expert) {
      return NextResponse.json({ error: 'Verified expert required' }, { status: 403 });
    }

    const body = await request.json();
    const { event_id, vote, reasoning, confidence } = body;

    // Record vote
    const { error: voteError } = await supabase
      .from('expert_votes')
      .upsert({
        event_id,
        expert_id: expert.id,
        vote,
        reasoning,
        confidence: confidence || 80,
        voted_at: new Date().toISOString()
      } as any, {
        onConflict: 'event_id,expert_id'
      });

    if (voteError) throw voteError;

    // Check if we have enough votes to resolve
    const { data: votes } = await supabase
      .from('expert_votes')
      .select(`
        vote,
        confidence,
        expert_panel!inner(weight, accuracy_rate)
      ` as any)
      .eq('event_id', event_id) as any;

    const minVotesRequired = 5;

    if (votes && votes.length >= minVotesRequired) {
      // Calculate result
      const result = calculateWeightedResult(votes.map((v: any) => ({
        vote: v.vote,
        expert_weight: (v.expert_panel as any).weight || 1
      })));

      if (result.threshold_met) {
        // Resolve event
        await supabase
          .from('markets')
          .update({
            status: 'resolved',
            outcome: result.outcome,
            resolved_at: new Date().toISOString(),
            resolution_source: 'expert_panel'
          })
          .eq('id', event_id);

        await supabase
          .from('resolution_systems' as any)
          .update({
            status: 'resolved',
            final_outcome: result.outcome,
            expert_result: result,
            resolved_at: new Date().toISOString()
          })
          .eq('event_id', event_id);

        return NextResponse.json({
          success: true,
          resolved: true,
          outcome: result.outcome,
          result
        });
      }
    }

    return NextResponse.json({
      success: true,
      resolved: false,
      votes_cast: votes?.length || 1,
      votes_required: minVotesRequired
    });

  } catch (error: any) {
    console.error('Expert vote error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get voting status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: votes } = await supabase
      .from('expert_votes')
      .select(`
        vote,
        reasoning,
        confidence,
        voted_at,
        expert_panel(expert_name, specializations, weight)
      ` as any)
      .eq('event_id', eventId)
      .order('voted_at', { ascending: false }) as any;

    const result = votes ? calculateWeightedResult(votes.map((v: any) => ({
      vote: v.vote,
      expert_weight: (v.expert_panel as any).weight || 1
    }))) : null;

    return NextResponse.json({
      votes: votes || [],
      current_result: result,
      total_votes: votes?.length || 0,
      required_votes: 5
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
