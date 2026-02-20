import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

// POST /api/workflows/combined-analytics
// Consolidated workflow: Analytics + Tick Adjustment + Exchange Rate
export async function POST(request: Request) {
  try {
    // Verify QStash signature
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = await createClient();
    const results = {
      timestamp: new Date().toISOString(),
      analytics: null as any,
      tickAdjustment: null as any,
      exchangeRate: null as any,
      errors: [] as string[]
    };

    // Execute daily analytics
    try {
      const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/analytics/daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.analytics = await analyticsResponse.json();
    } catch (error) {
      results.errors.push(`Analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Execute tick adjustment
    try {
      const tickResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/tick-adjustment`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      results.tickAdjustment = await tickResponse.json();
    } catch (error) {
      results.errors.push(`Tick Adjustment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Execute exchange rate update
    try {
      const rateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/exchange-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.exchangeRate = await rateResponse.json();
    } catch (error) {
      results.errors.push(`Exchange Rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Log execution
    await supabase.from('workflow_executions').insert({
      workflow_name: 'combined-analytics',
      status: results.errors.length === 0 ? 'success' : 'partial',
      results,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: results.errors.length === 0,
      message: 'Combined analytics workflow executed',
      results
    });

  } catch (error) {
    console.error('Combined analytics workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
