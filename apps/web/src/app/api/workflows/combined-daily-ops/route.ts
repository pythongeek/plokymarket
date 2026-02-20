import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyQStashSignature } from '@/lib/upstash/workflows';

// POST /api/workflows/combined-daily-ops
// Consolidated workflow: Leaderboard + Daily AI Topics + Cleanup (runs at midnight BD time)
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
      leaderboard: null as any,
      dailyAiTopics: null as any,
      cleanup: null as any,
      errors: [] as string[]
    };

    // Execute leaderboard update
    try {
      const leaderboardResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leaderboard/cron`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.leaderboard = await leaderboardResponse.json();
    } catch (error) {
      results.errors.push(`Leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Execute daily AI topics
    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/daily-ai-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.dailyAiTopics = await aiResponse.json();
    } catch (error) {
      results.errors.push(`Daily AI Topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Execute cleanup
    try {
      const cleanupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/cleanup-expired`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      results.cleanup = await cleanupResponse.json();
    } catch (error) {
      results.errors.push(`Cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Log execution
    await supabase.from('workflow_executions').insert({
      workflow_name: 'combined-daily-ops',
      status: results.errors.length === 0 ? 'success' : 'partial',
      results,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: results.errors.length === 0,
      message: 'Combined daily operations workflow executed',
      results
    });

  } catch (error) {
    console.error('Combined daily ops workflow error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
