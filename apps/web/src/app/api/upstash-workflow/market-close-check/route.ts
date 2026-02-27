/**
 * Upstash Workflow - Market Close Check
 * Checks for markets closing in <1 hour and sends notifications
 * Scheduled via QStash every 15 minutes
 * 
 * This replaces the Vercel Cron to stay within free tier limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'sin1';

/**
 * POST handler for Upstash Workflow
 * Steps:
 * 1. find-closing-markets - Find markets closing in next hour
 * 2. notify-followers - Send notifications to followers
 * 3. mark-warned - Mark markets as warned
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const payload = await request.json();
    const { step, data } = payload;

    const supabase = await createServiceClient();

    // Step 1: Find markets closing in next hour
    if (step === 'find-closing-markets' || !step) {
      const in1Hour = new Date(Date.now() + 3600000).toISOString();
      const now = new Date().toISOString();

      console.log('[MarketCloseCheck] Finding markets closing before', in1Hour);

      const { data: closingMarkets, error: marketError } = await supabase
        .from('markets')
        .select('id, name, name_bn')
        .eq('status', 'active')
        .lte('trading_closes_at', in1Hour)
        .gt('trading_closes_at', now)
        .is('close_warned', null);

      if (marketError) {
        console.error('[MarketCloseCheck] Market Query Error:', marketError);
        throw marketError;
      }

      console.log(`[MarketCloseCheck] Found ${closingMarkets?.length || 0} markets closing soon`);

      return NextResponse.json({
        step: 'find-closing-markets',
        status: 'success',
        closingMarkets: closingMarkets || [],
        nextStep: 'notify-followers',
        timestamp: now,
      });
    }

    // Step 2: Notify followers
    if (step === 'notify-followers') {
      const { closingMarkets } = data;
      let totalNotifications = 0;

      for (const market of closingMarkets) {
        // Get followers who want closing notifications
        const { data: followers, error: followerError } = await supabase
          .from('market_followers')
          .select('user_id')
          .eq('market_id', market.id)
          .eq('notify_on_resolve', true);

        if (followerError) {
          console.error(
            `[MarketCloseCheck] Follower Query Error for ${market.id}:`,
            followerError
          );
          continue;
        }

        if (followers && followers.length > 0) {
          // Insert notifications
          const notifications = followers.map((f) => ({
            user_id: f.user_id,
            type: 'market_closing_soon',
            title: '⏰ মার্কেট শীঘ্রই বন্ধ হবে',
            title_bn: '⏰ মার্কেট শীঘ্রই বন্ধ হবে',
            body: `${market.name} — ১ ঘণ্টার মধ্যে ট্রেডিং বন্ধ হবে`,
            body_bn: `${market.name_bn || market.name} — ১ ঘণ্টার মধ্যে ট্রেডিং বন্ধ হবে`,
            market_id: market.id,
            action_url: `/markets/${market.id}`,
          }));

          const { error: notifyError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notifyError) {
            console.error(
              `[MarketCloseCheck] Notification Insert Error for ${market.id}:`,
              notifyError
            );
          } else {
            totalNotifications += notifications.length;
            console.log(
              `[MarketCloseCheck] Sent ${notifications.length} notifications for ${market.id}`
            );
          }
        }
      }

      return NextResponse.json({
        step: 'notify-followers',
        status: 'success',
        totalNotifications,
        nextStep: 'mark-warned',
        timestamp: new Date().toISOString(),
      });
    }

    // Step 3: Mark markets as warned
    if (step === 'mark-warned') {
      const { closingMarkets } = data;
      let markedCount = 0;

      for (const market of closingMarkets) {
        const { error: updateError } = await supabase
          .from('markets')
          .update({ close_warned: true })
          .eq('id', market.id);

        if (updateError) {
          console.error(
            `[MarketCloseCheck] Market Update Error for ${market.id}:`,
            updateError
          );
        } else {
          markedCount++;
        }
      }

      return NextResponse.json({
        step: 'mark-warned',
        status: 'completed',
        closingMarketsFound: closingMarkets?.length || 0,
        markedCount,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Unknown step
    return NextResponse.json(
      { error: 'Unknown workflow step', step },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[MarketCloseCheck Workflow] Error:', error);
    return NextResponse.json(
      {
        error: 'Market close check workflow failed',
        details: error.message,
        executionTimeMs: Date.now() - startTime,
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
    service: 'upstash-workflow-market-close-check',
    description: 'Check for markets closing soon and notify followers',
    steps: ['find-closing-markets', 'notify-followers', 'mark-warned'],
    schedule: '*/15 * * * *',
    timestamp: new Date().toISOString(),
  });
}
