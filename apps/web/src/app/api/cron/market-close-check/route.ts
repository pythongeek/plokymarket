import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * GET /api/cron/market-close-check
 * Checks for markets closing in <1 hour and sends notifications
 * Called by Vercel Cron every 15 minutes
 * Requires: Authorization: Bearer CRON_SECRET
 * 
 * Also supports POST for Upstash Workflow compatibility
 */
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
    console.error('[Cron/MarketClose] Market Query Error:', marketError);
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
        `[Cron/MarketClose] Follower Query Error for ${market.id}:`,
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
          `[Cron/MarketClose] Notification Insert Error for ${market.id}:`,
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
        `[Cron/MarketClose] Market Update Error for ${market.id}:`,
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

export async function GET(req: NextRequest) {
  try {
    // Secure cron endpoint
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const result = await processMarketCloseCheck(supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cron/MarketClose] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for Upstash Workflow compatibility
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const result = await processMarketCloseCheck(supabase);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Cron/MarketClose] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
