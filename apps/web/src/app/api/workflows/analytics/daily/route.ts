/**
 * QStash Scheduled Endpoint: Generate Daily Workflow Analytics
 * Triggered daily at midnight to generate analytics reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyQStashSignature } from '@/lib/qstash/verify';

export async function POST(request: NextRequest) {
  try {
    // Verify QStash signature
    const isValid = await verifyQStashSignature(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get daily statistics
    const { data: executions, error } = await supabase
      .from('workflow_executions')
      .select('outcome, confidence, execution_time, workflow_id')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (error) {
      console.error('[Analytics Daily] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const totalExecutions = executions?.length || 0;
    const yesCount = executions?.filter(e => e.outcome === 'yes').length || 0;
    const noCount = executions?.filter(e => e.outcome === 'no').length || 0;
    const escalatedCount = executions?.filter(e => e.outcome === 'escalated').length || 0;
    
    const avgConfidence = totalExecutions > 0
      ? executions?.reduce((sum, e) => sum + (e.confidence || 0), 0) / totalExecutions
      : 0;
    
    const avgExecutionTime = totalExecutions > 0
      ? executions?.reduce((sum, e) => sum + (e.execution_time || 0), 0) / totalExecutions
      : 0;

    // Store daily analytics
    const { error: insertError } = await supabase
      .from('workflow_analytics_daily')
      .insert({
        date: yesterday.toISOString().split('T')[0],
        total_executions: totalExecutions,
        yes_count: yesCount,
        no_count: noCount,
        escalated_count: escalatedCount,
        avg_confidence: Math.round(avgConfidence * 100) / 100,
        avg_execution_time: Math.round(avgExecutionTime),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('[Analytics Daily] Failed to store analytics:', insertError);
    }

    console.log('[Analytics Daily] Generated report for', yesterday.toISOString().split('T')[0]);
    console.log(`  Total: ${totalExecutions}, YES: ${yesCount}, NO: ${noCount}, Escalated: ${escalatedCount}`);

    return NextResponse.json({
      success: true,
      date: yesterday.toISOString().split('T')[0],
      analytics: {
        totalExecutions,
        yesCount,
        noCount,
        escalatedCount,
        avgConfidence: Math.round(avgConfidence * 100) / 100,
        avgExecutionTime: Math.round(avgExecutionTime)
      }
    });

  } catch (error: any) {
    console.error('[Analytics Daily] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
