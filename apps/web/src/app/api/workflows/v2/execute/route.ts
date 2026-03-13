/**
 * Upstash Workflow Executor v2
 * Dedicated workflow handler using upstash_workflow_runs table
 * NO n8n dependency - pure Upstash QStash implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { QStashClient } from '@/lib/upstash/workflows';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

// Initialize QStash client
const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN not configured');
  return new QStashClient({ token });
};

interface WorkflowPayload {
  workflow_type: string;
  event_id?: string;
  market_id?: string;
  payload?: Record<string, unknown>;
  steps?: string[];
  current_step?: number;
  workflow_run_id?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const workflowRunId = crypto.randomUUID();
  
  try {
    const body: WorkflowPayload = await request.json();
    const supabase = await createServiceClient();
    
    const {
      workflow_type,
      event_id,
      market_id,
      payload = {},
      steps = [],
      current_step = 0,
    } = body;

    await supabase.rpc('record_workflow_start', {
      p_workflow_run_id: workflowRunId,
      p_workflow_type: workflow_type,
      p_event_id: event_id,
      p_market_id: market_id,
      p_payload: payload,
    });

    let result: Record<string, unknown> = {};
    let status: 'COMPLETED' | 'FAILED' | 'RUNNING' = 'RUNNING';
    let nextStep: string | null = null;

    try {
      switch (workflow_type) {
        case 'event_creation':
          result = await handleEventCreation(supabase, payload, event_id);
          status = 'COMPLETED';
          break;

        case 'market_resolution':
          result = await handleMarketResolution(supabase, payload, market_id);
          status = 'COMPLETED';
          break;

        case 'deposit_notification':
          result = await handleDepositNotification(supabase, payload);
          status = 'COMPLETED';
          break;

        case 'withdrawal_processing':
          result = await handleWithdrawalProcessing(supabase, payload);
          status = 'COMPLETED';
          break;

        case 'ai_oracle':
          const aiResult = await handleAIOracle(supabase, payload, market_id, steps, current_step);
          result = aiResult.result;
          status = aiResult.status;
          nextStep = aiResult.nextStep;
          break;

        case 'price_snapshot':
          result = await handlePriceSnapshot(supabase, payload);
          status = 'COMPLETED';
          break;

        case 'market_close_check':
          result = await handleMarketCloseCheck(supabase);
          status = 'COMPLETED';
          break;

        case 'daily_report':
          result = await handleDailyReport(supabase);
          status = 'COMPLETED';
          break;

        case 'cleanup':
          result = await handleCleanup(supabase);
          status = 'COMPLETED';
          break;

        default:
          throw new Error(`Unknown workflow type: ${workflow_type}`);
      }
    } catch (stepError: any) {
      await supabase.rpc('add_to_workflow_dlq', {
        p_workflow_run_id: workflowRunId,
        p_error_message: stepError.message,
        p_error_stack: stepError.stack,
        p_failed_step: workflow_type,
      });

      return NextResponse.json({
        success: false,
        workflow_run_id: workflowRunId,
        error: stepError.message,
        status: 'FAILED',
        execution_time_ms: Date.now() - startTime,
      }, { status: 500 });
    }

    await supabase.rpc('record_workflow_complete', {
      p_workflow_run_id: workflowRunId,
      p_status: status,
      p_result: result,
      p_execution_time_ms: Date.now() - startTime,
    });

    if (status === 'RUNNING' && nextStep) {
      const qstash = getQStashClient();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      await qstash.publishJSON({
        url: `${baseUrl}/api/workflows/v2/execute`,
        body: {
          ...body,
          workflow_run_id: workflowRunId,
          current_step: current_step + 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      workflow_run_id: workflowRunId,
      status,
      result,
      next_step: nextStep,
      execution_time_ms: Date.now() - startTime,
    });

  } catch (error: any) {
    console.error('[Workflow v2] Fatal error:', error);
    return NextResponse.json({
      success: false,
      workflow_run_id: workflowRunId,
      error: error.message,
      status: 'FAILED',
      execution_time_ms: Date.now() - startTime,
    }, { status: 500 });
  }
}

async function handleEventCreation(supabase: any, payload: Record<string, unknown>, eventId?: string) {
  if (eventId) {
    await supabase
      .from('events')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .eq('status', 'draft');
  }
  return { processed: true, event_id: eventId };
}

async function handleMarketResolution(supabase: any, payload: Record<string, unknown>, marketId?: string) {
  if (!marketId) throw new Error('market_id required for resolution');
  const outcome = payload.outcome as string;
  if (!outcome) throw new Error('outcome required');
  
  const { error } = await supabase.rpc('settle_market_v2', {
    p_market_id: marketId,
    p_winning_outcome: outcome,
  });
  
  if (error) throw error;
  return { resolved: true, market_id: marketId, outcome };
}

async function handleDepositNotification(supabase: any, payload: Record<string, unknown>) {
  const { depositId, userId, amount } = payload as any;
  
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'deposit_received',
    title: 'Deposit Received',
    message: `Your deposit of ${amount} USDT is being processed`,
    data: { deposit_id: depositId },
  });

  return { notified: true, deposit_id: depositId };
}

async function handleWithdrawalProcessing(supabase: any, payload: Record<string, unknown>) {
  const { withdrawalId, userId, status } = payload as any;
  
  await supabase.from('notifications').insert({
    user_id: userId,
    type: `withdrawal_${status}`,
    title: status === 'completed' ? 'Withdrawal Complete' : 'Withdrawal Processing',
    message: status === 'completed' 
      ? 'Your withdrawal has been processed'
      : 'Your withdrawal is being processed',
    data: { withdrawal_id: withdrawalId },
  });

  return { processed: true, withdrawal_id: withdrawalId };
}

async function handleAIOracle(
  supabase: any,
  payload: Record<string, unknown>,
  marketId: string | undefined,
  steps: string[],
  currentStep: number
) {
  if (!marketId) throw new Error('market_id required for AI oracle');

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error('GEMINI_API_KEY not configured');

  const { data: market } = await supabase
    .from('markets')
    .select('question, description, category')
    .eq('id', marketId)
    .single();

  if (!market) throw new Error('Market not found');

  const prompt = `Analyze this prediction market and determine the outcome:\n\nQuestion: ${market.question}\nDescription: ${market.description || 'N/A'}\nCategory: ${market.category}\n\nReturn JSON: {"outcome": "YES" | "NO" | "UNCERTAIN", "confidence": 0-100, "reasoning": "brief explanation"}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const geminiData = await response.json();
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

  let analysis;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    analysis = match ? JSON.parse(match[0]) : { outcome: 'UNCERTAIN', confidence: 0 };
  } catch {
    analysis = { outcome: 'UNCERTAIN', confidence: 0, reasoning: 'Parse failed' };
  }

  await supabase.from('ai_resolution_pipelines').insert({
    market_id: marketId,
    pipeline_id: `ai-${Date.now()}`,
    synthesis_output: analysis,
    final_confidence: analysis.confidence,
    status: 'completed',
  });

  if (analysis.confidence >= 85 && analysis.outcome !== 'UNCERTAIN') {
    await supabase.rpc('settle_market_v2', {
      p_market_id: marketId,
      p_winning_outcome: analysis.outcome,
    });
  }

  return { result: analysis, status: 'COMPLETED' as const, nextStep: null };
}

async function handlePriceSnapshot(supabase: any, payload: Record<string, unknown>) {
  const { data: markets } = await supabase
    .from('markets')
    .select('id, question')
    .eq('status', 'active');

  const snapshots = [];
  for (const market of (markets || []).slice(0, 50)) {
    const { data: orders } = await supabase
      .from('orders')
      .select('price, side, outcome')
      .eq('market_id', market.id)
      .eq('status', 'open')
      .order('price', { ascending: false })
      .limit(10);

    const yesBuy = orders?.find((o: any) => o.side === 'buy' && o.outcome === 'YES')?.price || null;
    const yesSell = orders?.find((o: any) => o.side === 'sell' && o.outcome === 'YES')?.price || null;

    if (yesBuy || yesSell) {
      const { data: snapshot } = await supabase
        .from('price_snapshots')
        .insert({
          market_id: market.id,
          yes_bid: yesBuy,
          yes_ask: yesSell,
          timestamp: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (snapshot) snapshots.push(snapshot);
    }
  }

  return { snapshots_created: snapshots.length };
}

async function handleMarketCloseCheck(supabase: any) {
  const now = new Date().toISOString();

  const { data: markets } = await supabase
    .from('markets')
    .select('id, question, trading_closes_at')
    .eq('status', 'active')
    .lte('trading_closes_at', now);

  const closed = [];
  for (const market of markets || []) {
    await supabase
      .from('markets')
      .update({ status: 'closed', updated_at: now })
      .eq('id', market.id);
    
    closed.push(market.id);
  }

  return { markets_checked: (markets || []).length, markets_closed: closed.length };
}

async function handleDailyReport(supabase: any) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: stats } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('date', today)
    .single();

  const { data: admins } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('is_admin', true);

  for (const admin of admins || []) {
    await supabase.from('notifications').insert({
      user_id: admin.id,
      type: 'daily_report',
      title: 'Daily Report Ready',
      message: `Daily statistics for ${today} are available`,
      data: stats,
    });
  }

  return { report_date: today, admins_notified: (admins || []).length };
}

async function handleCleanup(supabase: any) {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: deleted } = await supabase
    .from('upstash_workflow_runs')
    .delete()
    .lt('created_at', cutoff)
    .in('status', ['COMPLETED', 'FAILED', 'CANCELLED'])
    .select('count');

  return { old_runs_deleted: deleted?.length || 0 };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentRuns, error } = await supabase
      .from('upstash_workflow_runs')
      .select('status, workflow_type')
      .gte('created_at', last24h);

    const dlqResult = await supabase
      .from('workflow_dlq')
      .select('id')
      .is('resolved_at', null);

    const stats: Record<string, Record<string, number>> = {};
    for (const run of recentRuns || []) {
      if (!stats[run.workflow_type]) stats[run.workflow_type] = {};
      stats[run.workflow_type][run.status] = (stats[run.workflow_type][run.status] || 0) + 1;
    }

    return NextResponse.json({
      status: 'active',
      service: 'upstash-workflow-v2',
      recent_stats: stats,
      dlq_pending: (dlqResult.data || []).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
