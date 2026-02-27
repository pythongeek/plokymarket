/**
 * Workflow - Market Close Check
 * Checks for markets closing in <1 hour and sends notifications
 * Called by group-fast workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const preferredRegion = 'sin1';

async function processMarketCloseCheck(supabase: any) {
  const in1Hour = new Date(Date.now() + 3600000).toISOString();
  const now = new Date().toISOString();

  // Find markets closing in next hour
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

  let notificationsSent = 0;

  for (const market of closingMarkets || []) {
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
        notificationsSent += notifications.length;
      }
    }

    // Mark as warned
    const { error: updateError } = await supabase
      .from('markets')
      .update({ close_warned: true })
      .eq('id', market.id);

    if (updateError) {
      console.error(
        `[MarketCloseCheck] Market Update Error for ${market.id}:`,
        updateError
      );
    }
  }

  return {
    status: 'ok',
    closingMarketsFound: (closingMarkets || []).length,
    notificationsSent,
    timestamp: now,
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const result = await processMarketCloseCheck(supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[MarketCloseCheck] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'market-close-check',
    description: 'Check for markets closing soon and notify followers',
    timestamp: new Date().toISOString(),
  });
}
