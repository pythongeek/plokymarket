/**
 * Dispute Resolution Workflow - Upstash Workflow
 * Handles long-running dispute voting/review periods
 * Serverless workflow for 3-7 day dispute resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * POST: Handle workflow steps
 * This endpoint is called by Upstash Workflow multiple times
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const payload = await request.json();
    const { step, data } = payload;
    
    const supabase = getSupabase();

    // Step 1: Initialize Dispute - Update status to under_review
    if (step === 'initiate' || !step) {
      const { disputeId, eventId, userId, bondAmount } = data;
      
      // Update dispute status
      await supabase
        .from('dispute_records')
        .update({
          status: 'under_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', disputeId);
      
      // Add to manual review queue with high priority
      await supabase
        .from('manual_review_queue')
        .insert({
          market_id: eventId,
          review_type: 'disputed',
          priority: 'urgent',
          status: 'pending'
        });
      
      // Lock user bond
      await supabase.rpc('lock_dispute_bond', {
        p_user_id: userId,
        p_amount: bondAmount,
        p_dispute_id: disputeId
      });
      
      return NextResponse.json({
        step: 'initiate',
        status: 'success',
        disputeId,
        nextStep: 'wait-for-voting',
        votingPeriodDays: 3,
        executionTimeMs: Date.now() - startTime
      });
    }

    // Step 2: Wait for voting period (handled by Upstash sleep)
    // This step is just a marker - actual sleep happens in workflow orchestration
    if (step === 'wait-for-voting') {
      return NextResponse.json({
        step: 'wait-for-voting',
        status: 'waiting',
        waitDuration: '3 days',
        nextStep: 'collect-votes',
        executionTimeMs: Date.now() - startTime
      });
    }

    // Step 3: Collect votes and expert opinions
    if (step === 'collect-votes') {
      const { disputeId, eventId } = data;
      
      // Get expert votes for this event
      const { data: expertVotes } = await supabase
        .from('expert_votes')
        .select('*')
        .eq('event_id', eventId);
      
      // Get community votes (if implemented)
      const { data: communityVotes } = await supabase
        .from('dispute_votes')
        .select('*')
        .eq('dispute_id', disputeId);
      
      // Calculate weighted consensus
      const voteSummary = calculateVoteConsensus(expertVotes, communityVotes);
      
      return NextResponse.json({
        step: 'collect-votes',
        status: 'success',
        disputeId,
        voteSummary,
        nextStep: 'final-ruling',
        executionTimeMs: Date.now() - startTime
      });
    }

    // Step 4: Final ruling and fund distribution
    if (step === 'final-ruling') {
      const { disputeId, eventId, userId, bondAmount, voteSummary } = data;
      
      // Determine ruling based on votes
      const ruling = determineRuling(voteSummary);
      
      // Update dispute with ruling
      await supabase
        .from('dispute_records')
        .update({
          status: ruling === 'upheld' ? 'accepted' : 'rejected',
          resolution: ruling,
          resolved_at: new Date().toISOString(),
          bond_returned: ruling === 'upheld',
          bond_forfeited: ruling !== 'upheld',
          bond_processed_at: new Date().toISOString()
        })
        .eq('id', disputeId);
      
      // Handle fund distribution
      if (ruling === 'upheld') {
        // Return bond to user
        await supabase.rpc('return_dispute_bond', {
          p_user_id: userId,
          p_amount: bondAmount,
          p_dispute_id: disputeId
        });
        
        // Revert market resolution for re-review
        await supabase
          .from('markets')
          .update({
            status: 'closed',
            outcome: null,
            resolved_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
        
        // Add back to manual review
        await supabase
          .from('manual_review_queue')
          .insert({
            market_id: eventId,
            review_type: 'flagged',
            priority: 'urgent',
            status: 'pending'
          });
      } else {
        // Forfeit bond to platform
        await supabase.rpc('forfeit_dispute_bond', {
          p_dispute_id: disputeId,
          p_amount: bondAmount
        });
      }
      
      return NextResponse.json({
        step: 'final-ruling',
        status: 'completed',
        disputeId,
        ruling,
        bondHandled: true,
        executionTimeMs: Date.now() - startTime
      });
    }

    return NextResponse.json(
      { error: 'Unknown workflow step', step },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Dispute Workflow] Error:', error);
    return NextResponse.json(
      {
        error: 'Workflow failed',
        details: error.message,
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Workflow status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'dispute-resolution-workflow',
    steps: ['initiate', 'wait-for-voting', 'collect-votes', 'final-ruling'],
    votingPeriod: '3 days',
    timestamp: new Date().toISOString()
  });
}

// Helper functions
function calculateVoteConsensus(expertVotes: any[], communityVotes: any[]) {
  if (!expertVotes && !communityVotes) {
    return { consensus: 'insufficient_data', confidence: 0 };
  }
  
  // Weight expert votes more heavily
  let yesWeight = 0;
  let noWeight = 0;
  let totalWeight = 0;
  
  // Expert votes (weight = reputation_score)
  expertVotes?.forEach(vote => {
    const weight = vote.expert?.reputation_score || 1;
    if (vote.vote_outcome === 1) yesWeight += weight;
    else noWeight += weight;
    totalWeight += weight;
  });
  
  // Community votes (weight = 1)
  communityVotes?.forEach(vote => {
    if (vote.vote === 'YES') yesWeight += 1;
    else noWeight += 1;
    totalWeight += 1;
  });
  
  if (totalWeight === 0) {
    return { consensus: 'no_votes', confidence: 0 };
  }
  
  const yesPercentage = (yesWeight / totalWeight) * 100;
  const consensus = yesPercentage > 60 ? 'YES' : yesPercentage < 40 ? 'NO' : 'UNDECIDED';
  const confidence = Math.abs(yesPercentage - 50) * 2; // 0-100 scale
  
  return {
    consensus,
    confidence: Math.round(confidence),
    yesPercentage: Math.round(yesPercentage),
    totalVotes: totalWeight,
    expertVotes: expertVotes?.length || 0,
    communityVotes: communityVotes?.length || 0
  };
}

function determineRuling(voteSummary: any) {
  // If strong consensus (>70% confidence), follow the vote
  if (voteSummary.confidence >= 70) {
    return voteSummary.consensus === 'YES' ? 'upheld' : 'dismissed';
  }
  
  // If undecided, default to dismissed (user loses bond)
  if (voteSummary.consensus === 'UNDECIDED' || voteSummary.consensus === 'no_votes') {
    return 'dismissed';
  }
  
  // Borderline case - require higher threshold for upholding
  return voteSummary.confidence >= 60 ? 'upheld' : 'dismissed';
}
