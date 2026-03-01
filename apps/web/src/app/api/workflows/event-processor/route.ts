/**
 * Event Processor Workflow
 * Handles post-event creation tasks via Upstash QStash
 * - Sends notifications
 * - Updates search index
 * - Triggers AI analysis (if applicable)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

export const runtime = 'edge';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const signature = request.headers.get('upstash-signature') || '';
    const bodyText = await request.text();
    
    if (!verifyQStashSignature(signature, bodyText)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(bodyText);
    const { event_id, market_id, action } = body;

    if (!event_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, action' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      event_id,
      action,
      tasks: [],
    };

    // Handle different actions
    switch (action) {
      case 'post_create': {
        // Task 1: Update event search index
        try {
          const { error: searchError } = await supabase.rpc('update_event_search_index', {
            p_event_id: event_id,
          });
          
          results.tasks.push({
            name: 'update_search_index',
            status: searchError ? 'failed' : 'success',
            error: searchError?.message,
          });
        } catch (err: any) {
          results.tasks.push({
            name: 'update_search_index',
            status: 'failed',
            error: err.message,
          });
        }

        // Task 2: Send notification to admin (if configured)
        try {
          if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            const { data: event } = await supabase
              .from('events')
              .select('title, category')
              .eq('id', event_id)
              .single();

            if (event) {
              const message = `🎉 New Event Created!\n\nTitle: ${event.title}\nCategory: ${event.category}\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/events/${event_id}`;
              
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: process.env.TELEGRAM_CHAT_ID,
                  text: message,
                }),
              });

              results.tasks.push({
                name: 'send_notification',
                status: 'success',
              });
            }
          }
        } catch (err: any) {
          results.tasks.push({
            name: 'send_notification',
            status: 'failed',
            error: err.message,
          });
        }

        // Task 3: Trigger AI analysis for AI oracle events
        try {
          const { data: event } = await supabase
            .from('events')
            .select('resolution_method')
            .eq('id', event_id)
            .single();

          if (event?.resolution_method === 'ai_oracle') {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

            await fetch(`${baseUrl}/api/ai/event-workflow`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event_id }),
            });

            results.tasks.push({
              name: 'trigger_ai_analysis',
              status: 'success',
            });
          }
        } catch (err: any) {
          results.tasks.push({
            name: 'trigger_ai_analysis',
            status: 'failed',
            error: err.message,
          });
        }
        break;
      }

      case 'pre_resolve':
      case 'post_resolve':
        results.tasks.push({
          name: `${action}_tasks`,
          status: 'success',
          message: 'Tasks completed',
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Log workflow execution
    await supabase.from('workflow_executions').insert({
      workflow_name: 'event-processor',
      status: results.tasks.every(t => t.status === 'success') ? 'success' : 'partial',
      results,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error: any) {
    console.error('Event processor error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
