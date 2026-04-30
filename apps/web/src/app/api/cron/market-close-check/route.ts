/**
 * Market Close Check Cron Job
 * Checks markets closing within 1 hour and sends notifications
 * Delegates to n8n workflow for notification handling
 *
 * SCHEDULE SETUP (cron-job.org):
 * - Target URL: https://your-app.vercel.app/api/cron/market-close-check
 * - Method: GET
 * - Headers: Authorization: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call n8n workflow webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/webhook/plokymarket-market-close`;

    const n8nResponse = await fetch(`${n8nWebhookUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-n8n-api-key': process.env.N8N_API_KEY || ''
      }
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n workflow failed: ${n8nResponse.status}`);
    }

    const result = await n8nResponse.json();

    return NextResponse.json({
      success: true,
      source: 'n8n_workflow',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Cron/MarketClose] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
