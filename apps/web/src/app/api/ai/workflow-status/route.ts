/**
 * Check AI Workflow Status
 * Returns current status and results if completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Initialize Supabase admin client is managed via createServiceClient

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflow_id');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get suggestions for this workflow
    const { data: suggestions, error } = await supabase
      .from('ai_daily_topics')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('ai_confidence', { ascending: false });

    if (error) {
      throw error;
    }

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json({
        status: 'not_found',
        message: 'No suggestions found for this workflow'
      });
    }

    // Check if all are processed
    const pendingCount = suggestions.filter(s => s.status === 'pending' && s.suggested_title === 'Processing...').length;
    const completedCount = suggestions.filter(s => s.suggested_title !== 'Processing...').length;

    let status = 'processing';
    if (pendingCount === 0 && completedCount > 0) {
      status = 'completed';
    } else if (pendingCount === suggestions.length) {
      status = 'pending';
    }

    return NextResponse.json({
      status,
      workflow_id: workflowId,
      total: suggestions.length,
      completed: completedCount,
      pending: pendingCount,
      suggestions: status === 'completed' ? suggestions : undefined
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
