/**
 * Workflow Statistics and Analytics API
 * Provides aggregated metrics for workflows and outcomes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workflows/stats
 * Get aggregated workflow statistics with optional filtering
 * Query params: workflowId, startDate, endDate
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);

    // Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: user } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const workflowId = url.searchParams.get('id');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('workflow_executions')
      .select('outcome, confidence, escalated, execution_time, created_at');

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: executions, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics
    if (!executions || executions.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalExecutions: 0,
          yesCount: 0,
          noCount: 0,
          escalatedCount: 0,
          yesPercentage: 0,
          noPercentage: 0,
          escalatedPercentage: 0,
          avgConfidence: 0,
          avgExecutionTime: 0,
          minConfidence: 0,
          maxConfidence: 0,
          period: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
      });
    }

    const totalExecutions = executions.length;
    const yesCount = executions.filter((e: any) => e.outcome === 'yes').length;
    const noCount = executions.filter((e: any) => e.outcome === 'no').length;
    const escalatedCount = executions.filter((e: any) => e.escalated).length;

    const confidences = executions.map((e: any) => e.confidence).filter((c: any) => typeof c === 'number');
    const executionTimes = executions
      .map((e: any) => e.execution_time)
      .filter((t: any) => typeof t === 'number');

    const avgConfidence =
      confidences.length > 0
        ? Math.round((confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length) * 100) / 100
        : 0;

    const avgExecutionTime =
      executionTimes.length > 0
        ? Math.round((executionTimes.reduce((a: number, b: number) => a + b, 0) / executionTimes.length) * 10) / 10
        : 0;

    const minConfidence = confidences.length > 0 ? Math.min(...confidences) : 0;
    const maxConfidence = confidences.length > 0 ? Math.max(...confidences) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalExecutions,
        yesCount,
        noCount,
        escalatedCount,
        yesPercentage: Math.round((yesCount / totalExecutions) * 100),
        noPercentage: Math.round((noCount / totalExecutions) * 100),
        escalatedPercentage: Math.round((escalatedCount / totalExecutions) * 100),
        avgConfidence,
        avgExecutionTime,
        minConfidence,
        maxConfidence,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error: any) {
    console.error('GET /api/workflows/stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve statistics' },
      { status: 500 }
    );
  }
}
