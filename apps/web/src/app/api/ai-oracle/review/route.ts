/**
 * Human Review Queue API
 * Manage AI resolution items requiring human oversight
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGlobalOrchestrator } from '@/lib/oracle/ai/AIOrchestrator';
import { getGlobalReviewQueue } from '@/lib/oracle/ai/feedback/HumanReviewQueue';

/**
 * GET: Fetch review items
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    
    let query = supabase
      .from('human_review_queue')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (assignedToMe) {
      query = query.eq('assigned_to', user.id);
    }
    
    const { data: items, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch review items' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ items: items || [] });
    
  } catch (error) {
    console.error('[Review API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST: Assign or submit review
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    const { action } = body;
    
    if (action === 'assign') {
      // Assign next available item
      const { data: pendingItems, error: fetchError } = await supabase
        .from('human_review_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (fetchError || !pendingItems || pendingItems.length === 0) {
        return NextResponse.json(
          { error: 'No pending items available' },
          { status: 404 }
        );
      }
      
      const item = pendingItems[0];
      
      const { error: updateError } = await supabase
        .from('human_review_queue')
        .update({
          status: 'assigned',
          assigned_to: user.id,
          assigned_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to assign item' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ item });
      
    } else if (action === 'submit') {
      // Submit review decision
      const { itemId, decision, finalOutcome, notes } = body;
      
      if (!itemId || !decision) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
      
      // Verify assignment
      const { data: item, error: itemError } = await supabase
        .from('human_review_queue')
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (itemError || !item) {
        return NextResponse.json(
          { error: 'Review item not found' },
          { status: 404 }
        );
      }
      
      if (item.assigned_to !== user.id) {
        return NextResponse.json(
          { error: 'Item not assigned to you' },
          { status: 403 }
        );
      }
      
      // Update review item
      const { error: updateError } = await supabase
        .from('human_review_queue')
        .update({
          status: decision === 'escalate' ? 'escalated' : 'completed',
          reviewer_decision: decision,
          final_outcome: finalOutcome,
          reviewer_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', itemId);
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to submit review' },
          { status: 500 }
        );
      }
      
      // Record feedback
      const orchestrator = getGlobalOrchestrator();
      orchestrator.processHumanReview(itemId, decision, finalOutcome);
      
      // If accepting or modifying, update market
      if (decision === 'accept' || decision === 'modify') {
        const resolvedOutcome = decision === 'accept' ? item.ai_outcome : finalOutcome;
        
        if (resolvedOutcome) {
          const { error: marketError } = await supabase
            .from('markets')
            .update({
              status: 'resolved',
              winning_outcome: resolvedOutcome,
              resolved_at: new Date().toISOString(),
              resolution_details: {
                source: 'AI_ORACLE_HUMAN_REVIEW',
                ai_outcome: item.ai_outcome,
                ai_confidence: item.ai_confidence,
                reviewer_decision: decision,
                reviewer_id: user.id
              }
            })
            .eq('id', item.market_id);
          
          if (marketError) {
            console.error('[Review API] Failed to update market:', marketError);
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        decision,
        finalOutcome: decision === 'accept' ? item.ai_outcome : finalOutcome
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('[Review API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
