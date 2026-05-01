import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface WebhookPayload {
  event: 'market_created' | 'market_resolved' | 'market_paused' | 'liquidity_added';
  market_id: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// POST: Handle market lifecycle webhook events
export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json();
    const { event, market_id, data = {} } = body;

    const supabase = await createClient();

    switch (event) {
      case 'market_created': {
        // Notify followers of new market
        const { data: followers } = await supabase
          .from('market_followers')
          .select('user_id')
          .eq('event_id', market_id);

        if (followers && followers.length > 0) {
          // Create notifications for followers
          const notifications = followers.map((f: { user_id: string }) => ({
            user_id: f.user_id,
            type: 'market_created',
            title: 'নতুন বাজার তৈরি হয়েছে',
            message: `আপনার অনুসরণ করা বাজার "${data.question || 'নতুন বাজার'}" তৈরি হয়েছে`,
            reference_id: market_id,
          }));

          await supabase.from('notifications').insert(notifications);
        }
        break;
      }

      case 'market_resolved': {
        const { outcome, resolution_reason } = data as {
          outcome: string;
          resolution_reason?: string;
        };

        // Update market status
        await supabase
          .from('events')
          .update({
            status: 'resolved',
            resolution: outcome,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', market_id);

        // Calculate and settle positions
        const { data: positions } = await supabase
          .from('positions')
          .select('user_id, quantity, entry_price, outcome')
          .eq('event_id', market_id);

        if (positions && positions.length > 0) {
          const settlements = positions.map((p) => {
            const isWinner = p.outcome === outcome;
            const payout = isWinner
              ? Number(p.quantity) * 1 // Full payout for winners (assuming even odds)
              : 0;
            return {
              user_id: p.user_id,
              event_id: market_id,
              amount: payout,
              type: 'settlement',
              created_at: new Date().toISOString(),
            };
          });

          await supabase.from('wallet_transactions').insert(settlements);

          // Update user balances
          for (const settlement of settlements) {
            if (settlement.amount > 0) {
              await supabase.rpc('increment_balance', {
                p_user_id: settlement.user_id,
                p_amount: settlement.amount,
              });
            }
          }

          // Send notifications
          const notifications = positions
            .filter((p: any) => p.outcome === outcome)
            .map((p: { user_id: string }) => ({
              user_id: p.user_id,
              type: 'position_settled',
              title: 'পজিশন সমাধান হয়েছে',
              message: `আপনার পজিশন সমাধান হয়েছে এবং আপনি জয়ী হয়েছেন!`,
              reference_id: market_id,
            }));

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
          }
        }
        break;
      }

      case 'market_paused': {
        // Lock all open orders for this market
        const { error: ordersError } = await supabase
          .from('orders')
          .update({ status: 'locked' })
          .eq('event_id', market_id)
          .eq('status', 'open');

        if (ordersError) {
          console.error('Error locking orders:', ordersError);
        }

        // Get users with open positions
        const { data: positions } = await supabase
          .from('positions')
          .select('user_id')
          .eq('event_id', market_id);

        // Notify users
        if (positions && positions.length > 0) {
          const notifications = positions.map((p: { user_id: string }) => ({
            user_id: p.user_id,
            type: 'market_paused',
            title: 'বাজার বিরামিত',
            message: 'একটি বাজার সাময়িকভাবে বিরামিত করা হয়েছে। নতুন ট্রেড প্রচলিত নয়।',
            reference_id: market_id,
          }));

          await supabase.from('notifications').insert(notifications);
        }
        break;
      }

      case 'liquidity_added': {
        // Update market depth display
        // This event is informational - the order book is already updated
        const { liquidity_amount, added_by } = data as {
          liquidity_amount: number;
          added_by: string;
        };

        console.log(
          `Liquidity added to market ${market_id}: ${liquidity_amount} by ${added_by}`
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${event}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, event, market_id });
  } catch (error) {
    console.error('Market lifecycle webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'market-lifecycle-webhook',
    timestamp: new Date().toISOString(),
  });
}
