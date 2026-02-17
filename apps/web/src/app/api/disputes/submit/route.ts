/**
 * Dispute Submission API
 * Validates and initiates dispute workflow
 * Edge Function for fast response
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      marketId, 
      disputeType, 
      disputeReason, 
      evidence, 
      bondAmount = 100 
    } = body;
    
    // Validate required fields
    if (!marketId || !disputeType || !disputeReason) {
      return NextResponse.json(
        { error: 'Missing required fields: marketId, disputeType, disputeReason' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabase();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validation 1: Check if market exists and is resolved
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('id, question, status, outcome, resolved_at')
      .eq('id', marketId)
      .single();
    
    if (marketError || !market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }
    
    if (market.status !== 'resolved') {
      return NextResponse.json(
        { error: 'Can only dispute resolved markets' },
        { status: 400 }
      );
    }
    
    // Validation 2: Check if user has sufficient balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, locked_balance')
      .eq('user_id', user.id)
      .single();
    
    if (walletError) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }
    
    const availableBalance = (wallet.balance || 0) - (wallet.locked_balance || 0);
    if (availableBalance < bondAmount) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance for bond',
          required: bondAmount,
          available: availableBalance
        },
        { status: 400 }
      );
    }
    
    // Validation 3: Check if user already disputed this market
    const { data: existingDispute } = await supabase
      .from('dispute_records')
      .select('id')
      .eq('market_id', marketId)
      .eq('disputed_by', user.id)
      .in('status', ['pending', 'under_review'])
      .single();
    
    if (existingDispute) {
      return NextResponse.json(
        { error: 'You already have an active dispute for this market' },
        { status: 400 }
      );
    }
    
    // Create dispute record
    const { data: dispute, error: disputeError } = await supabase
      .from('dispute_records')
      .insert({
        market_id: marketId,
        disputed_by: user.id,
        dispute_type: disputeType,
        dispute_reason: disputeReason,
        evidence_provided: evidence || [],
        bond_amount: bondAmount,
        bond_paid: true,
        status: 'pending'
      })
      .select()
      .single();
    
    if (disputeError) {
      throw disputeError;
    }
    
    // Trigger Upstash Workflow for dispute resolution
    const workflowUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/dispute-workflow`;
    
    const workflowResponse = await fetch(workflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_API_KEY || 'dev-key'}`
      },
      body: JSON.stringify({
        step: 'initiate',
        data: {
          disputeId: dispute.id,
          eventId: marketId,
          userId: user.id,
          bondAmount
        }
      })
    });
    
    if (!workflowResponse.ok) {
      console.error('Workflow trigger failed:', await workflowResponse.text());
      // Don't fail - dispute is created, workflow can be retried
    }
    
    return NextResponse.json({
      success: true,
      disputeId: dispute.id,
      marketId,
      bondAmount,
      status: 'pending',
      message: 'Dispute submitted successfully. Bond locked for 3-day review period.',
      executionTimeMs: Date.now() - startTime
    });
    
  } catch (error: any) {
    console.error('[Dispute Submit] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit dispute',
        details: error.message,
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check if user can dispute a market
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get('marketId');
  
  if (!marketId) {
    return NextResponse.json(
      { error: 'marketId required' },
      { status: 400 }
    );
  }
  
  try {
    const supabase = getSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ canDispute: false, reason: 'Not authenticated' });
    }
    
    // Check market status
    const { data: market } = await supabase
      .from('markets')
      .select('status')
      .eq('id', marketId)
      .single();
    
    if (!market || market.status !== 'resolved') {
      return NextResponse.json({ canDispute: false, reason: 'Market not resolved' });
    }
    
    // Check existing dispute
    const { data: existing } = await supabase
      .from('dispute_records')
      .select('id')
      .eq('market_id', marketId)
      .eq('disputed_by', user.id)
      .in('status', ['pending', 'under_review'])
      .single();
    
    if (existing) {
      return NextResponse.json({ canDispute: false, reason: 'Already disputed' });
    }
    
    // Check balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance, locked_balance')
      .eq('user_id', user.id)
      .single();
    
    const available = (wallet?.balance || 0) - (wallet?.locked_balance || 0);
    const bondAmount = 100;
    
    return NextResponse.json({
      canDispute: available >= bondAmount,
      reason: available >= bondAmount ? 'Eligible' : 'Insufficient balance',
      bondAmount,
      availableBalance: available
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
