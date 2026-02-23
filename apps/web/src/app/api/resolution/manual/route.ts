/**
 * Manual Resolution API
 * Handles admin manual resolution with approval workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

// Send notification
async function notifyResolution(eventId: string, outcome: string, isEmergency: boolean) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const message = `
${isEmergency ? '🚨' : '✅'} <b>Event ${isEmergency ? 'Emergency' : ''} Resolved</b>

Event ID: ${eventId}
Outcome: ${outcome.toUpperCase()}
Type: ${isEmergency ? 'Emergency (No Approval)' : 'Standard'}
Time: ${new Date().toLocaleString('bn-BD')}

🔗 <a href="https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/resolution/${eventId}">View</a>
  `.trim();

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error('Notification error:', e);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = await createServiceClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser(token);
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin, full_name')
      .eq('id', user?.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { event_id, outcome, source, reasoning, evidence_urls, is_emergency } = body;

    // Validation
    if (!event_id || !outcome || !reasoning) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status === 'resolved') {
      return NextResponse.json(
        { error: 'Event already resolved' },
        { status: 400 }
      );
    }

    if (is_emergency) {
      // Emergency resolution - immediate
      await supabase
        .from('markets')
        .update({
          status: 'resolved',
          outcome: outcome,
          resolved_at: new Date().toISOString(),
          resolution_source: 'manual_admin_emergency'
        })
        .eq('id', event_id);

      await supabase
        .from('resolution_systems')
        .update({
          status: 'resolved',
          final_outcome: outcome,
          evidence: {
            source,
            reasoning,
            evidence_urls,
            resolved_by: user?.id,
            resolver_name: profile.full_name,
            is_emergency: true
          },
          resolved_at: new Date().toISOString()
        })
        .eq('event_id', event_id);

    } else {
      // Standard resolution - requires approval
      await supabase
        .from('resolution_systems')
        .update({
          status: 'pending_approval',
          proposed_outcome: outcome,
          evidence: {
            source,
            reasoning,
            evidence_urls,
            proposed_by: user?.id,
            proposer_name: profile.full_name,
            proposed_at: new Date().toISOString()
          }
        })
        .eq('event_id', event_id);
    }

    // Log action
    await supabase.rpc('log_admin_action', {
      p_admin_id: user?.id,
      p_action_type: 'resolve_event',
      p_resource_type: 'market',
      p_resource_id: event_id,
      p_new_values: { outcome, is_emergency },
      p_reason: reasoning
    });

    // Notify
    await notifyResolution(event_id, outcome, is_emergency);

    return NextResponse.json({
      success: true,
      message: is_emergency
        ? 'Emergency resolution completed'
        : 'Resolution proposal submitted for approval',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Manual resolution error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
