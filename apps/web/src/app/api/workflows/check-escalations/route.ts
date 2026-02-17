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

    // Find escalated events that need manual review
    const { data: escalations, error } = await supabase
      .from('workflow_executions')
      .select(`
        id,
        event_id,
        workflow_id,
        outcome,
        confidence,
        created_at,
        markets:event_id (question, category)
      `)
      .eq('outcome', 'escalated')
      .eq('notified', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Escalation Check] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!escalations || escalations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No new escalations to process',
        escalations: 0 
      });
    }

    const processed = [];

    // Process each escalation
    for (const escalation of escalations) {
      try {
        // Create notification for admin
        await supabase.from('notifications').insert({
          user_id: null, // System notification
          type: 'escalation',
          title: 'Event Requires Manual Review',
          message: `Event "${escalation.markets?.question}" has been escalated with ${escalation.confidence}% confidence`,
          data: {
            eventId: escalation.event_id,
            workflowId: escalation.workflow_id,
            executionId: escalation.id
          },
          created_at: new Date().toISOString()
        });

        // Mark as notified
        await supabase
          .from('workflow_executions')
          .update({ notified: true })
          .eq('id', escalation.id);

        processed.push({
          executionId: escalation.id,
          eventId: escalation.event_id,
          category: escalation.markets?.category
        });

        console.log(`[Escalation Check] Notified for ${escalation.event_id}`);
      } catch (notifyError) {
        console.error(`[Escalation Check] Failed to notify ${escalation.id}:`, notifyError);
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
