/**
 * AI Agent Workflow API
 * Multi-agent orchestration endpoint
 * Coordinates Content, Logic, Timing, and Risk agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AgentOrchestrator } from '@/lib/ai-agents/orchestrator';
import { AgentContext } from '@/lib/ai-agents/types';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

/**
 * POST: Run full agent workflow
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // ============================================================================
    // STEP 1: Authentication
    // ============================================================================
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in' },
        { status: 401 }
      );
    }

    // Check admin permission
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin, can_create_events')
      .eq('id', user.id)
      .single();

    if (userError || (!userData?.is_admin && !userData?.can_create_events)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'No permission to create events' },
        { status: 403 }
      );
    }

    // ============================================================================
    // STEP 2: Parse Input
    // ============================================================================
    const body = await req.json();
    const {
      title,
      description,
      category,
      outcomes,
      trading_closes_at,
      resolution_date,
      existing_events = [],
      mode = 'full', // 'full' | 'content' | 'logic' | 'timing' | 'risk'
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Title is required' },
        { status: 400 }
      );
    }

    // ============================================================================
    // STEP 3: Fetch Existing Events for Duplicate Check
    // ============================================================================
    let existingEventTitles: string[] = existing_events;
    
    if (existingEventTitles.length === 0) {
      try {
        const { data: events } = await supabase
          .from('events')
          .select('title')
          .limit(100);
        
        if (events) {
          existingEventTitles = events.map(e => e.title);
        }
      } catch (e) {
        console.warn('[Agent Workflow] Could not fetch existing events:', e);
      }
    }

    // ============================================================================
    // STEP 4: Prepare Context
    // ============================================================================
    const context: AgentContext = {
      rawInput: title,
      title,
      description,
      category,
      outcomes,
      tradingClosesAt: trading_closes_at,
      resolutionDate: resolution_date,
      existingEvents: existingEventTitles,
    };

    // ============================================================================
    // STEP 5: Run Agent Workflow
    // ============================================================================
    const orchestrator = new AgentOrchestrator();
    
    let result;
    
    if (mode === 'full') {
      // Run all agents
      result = await orchestrator.runAll(context);
    } else {
      // Run specific agent
      const agentResult = await orchestrator.runAgent(mode, context);
      result = {
        success: true,
        [mode]: agentResult,
        errors: [],
        warnings: [],
        metadata: {
          totalTime: Date.now() - startTime,
          agentsUsed: [mode],
          providerUsed: 'vertex',
        },
      };
    }

    // ============================================================================
    // STEP 6: Return Response
    // ============================================================================
    return NextResponse.json({
      success: result.success,
      data: {
        content: result.content,
        market_logic: result.marketLogic,
        timing: result.timing,
        risk_assessment: result.riskAssessment,
      },
      warnings: result.warnings,
      errors: result.errors,
      metadata: {
        ...result.metadata,
        request_time: Date.now() - startTime,
        mode,
      },
    }, {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('[Agent Workflow] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Get provider health status
 */
export async function GET() {
  try {
    const { getProviderHealth } = await import('@/lib/ai-agents/provider-switcher');
    const health = getProviderHealth();
    
    return NextResponse.json({
      providers: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get provider health' },
      { status: 500 }
    );
  }
}
