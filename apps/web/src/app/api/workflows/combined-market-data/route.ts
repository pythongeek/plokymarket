import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

// POST /api/workflows/combined-market-data
// Consolidated workflow: Crypto + Sports market data in one call
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
      crypto: null as any,
      sports: null as any,
      errors: [] as string[]
    };

    // Execute crypto market data fetch
    try {
      const cryptoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/execute-crypto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.crypto = await cryptoResponse.json();
    } catch (error) {
      results.errors.push(`Crypto: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Execute sports market data fetch
    try {
      const sportsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/execute-sports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.sports = await sportsResponse.json();
    } catch (error) {
      results.errors.push(`Sports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Log execution
    await supabase.from('workflow_executions').insert({
      workflow_name: 'combined-market-data',
      status: results.errors.length === 0 ? 'success' : 'partial',
      results,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: results.errors.length === 0,
      message: 'Combined market data workflow executed',
      results
    });

  } catch (error) {
    console.error('Combined market data workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
