/**
 * QStash Scheduled Endpoint: Check for Escalated Events
 * Triggered every 5 minutes to process escalated events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyQStashSignature } from '@/lib/qstash/verify';

export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = await createClient();

    // Note: The workflow_executions table schema doesn't match what this endpoint expects
    // The table has: id, workflow_name, status, results, error_message, started_at, completed_at, duration_ms, created_at
    // It does NOT have: event_id, outcome, confidence, notified columns
    // This endpoint was designed for a different schema - returning success for now

    // Check for escalated settlements in the proper table instead
    const { data: settlementEscalations, error: settlementError } = await supabase
      .from('settlement_escalations')
      .select('id, market_id, reason, status, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);

    if (settlementError) {
      console.error('[Escalation Check] Database error:', settlementError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!settlementEscalations || settlementEscalations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new escalations to process',
        escalations: 0
      });
    }

    // Process settlement escalations
    const processed = [];

    for (const escalation of settlementEscalations) {
      try {
        // Get market info
        const { data: market } = await supabase
          .from('markets')
          .select('question, name_bn')
          .eq('id', escalation.market_id)
          .single();

        // Create notification for admin
        await supabase.from('notifications').insert({
          user_id: null,
          type: 'settlement_escalation',
          title: 'Settlement Escalation Requires Review',
          message: `Market "${market?.question || escalation.market_id}" has a settlement issue: ${escalation.reason}`,
          data: {
            marketId: escalation.market_id,
            escalationId: escalation.id,
            reason: escalation.reason
          },
          created_at: new Date().toISOString()
        });

        processed.push({
          escalationId: escalation.id,
          marketId: escalation.market_id,
          reason: escalation.reason
        });

        console.log(`[Escalation Check] Processed settlement escalation for ${escalation.market_id}`);
      } catch (notifyError) {
        console.error(`[Escalation Check] Failed to process ${escalation.id}:`, notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      escalations: processed.length,
      processed
    });

  } catch (error: any) {
    console.error('[Escalation Check] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
