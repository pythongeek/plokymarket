/**
 * AI Oracle Health Check API
 * Monitor system status, circuit breakers, and queue stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGlobalOrchestrator } from '@/lib/oracle/ai/AIOrchestrator';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get orchestrator health status
    const orchestrator = getGlobalOrchestrator();
    const health = orchestrator.getHealthStatus();
    
    // Get database stats
    const { data: pipelineStats, error: pipelineError } = await supabase
      .from('ai_resolution_pipelines')
      .select('status, confidence_level')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    const stats = {
      last24h: {
        total: pipelineStats?.length || 0,
        completed: pipelineStats?.filter(p => p.status === 'completed').length || 0,
        failed: pipelineStats?.filter(p => p.status === 'failed').length || 0,
        autoResolved: pipelineStats?.filter(p => p.confidence_level === 'automated').length || 0,
        humanReview: pipelineStats?.filter(p => p.confidence_level === 'human_review').length || 0,
        escalated: pipelineStats?.filter(p => p.confidence_level === 'escalation').length || 0
      }
    };
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        circuitBreakers: health.circuitBreakers,
        cache: health.cacheStats,
        reviewQueue: health.reviewQueueStats,
        feedback: health.feedbackReport
      },
      stats,
      version: '2.0.0'
    });
    
  } catch (error) {
    console.error('[Health API] Error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Run maintenance tasks
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const orchestrator = getGlobalOrchestrator();
    const maintenance = await orchestrator.runMaintenance();
    
    return NextResponse.json({
      success: true,
      maintenance
    });
    
  } catch (error) {
    console.error('[Health API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
