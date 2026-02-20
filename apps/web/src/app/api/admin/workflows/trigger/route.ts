import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/admin/workflows/trigger
// Manually trigger workflows from admin panel
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { workflow } = body;

    const workflowEndpoints: Record<string, { endpoint: string; method: string; description: string }> = {
      'dispute-workflow': {
        endpoint: '/api/dispute-workflow',
        method: 'POST',
        description: 'Process pending disputes and resolutions'
      },
      'execute-news': {
        endpoint: '/api/workflows/execute-news',
        method: 'POST',
        description: 'Fetch and process news market data'
      },
      'batch-markets': {
        endpoint: '/api/cron/batch-markets',
        method: 'GET',
        description: 'Batch process market updates'
      },
      'daily-report': {
        endpoint: '/api/workflows/daily-report',
        method: 'POST',
        description: 'Generate and send daily summary report'
      },
      'auto-verify': {
        endpoint: '/api/workflows/auto-verify',
        method: 'POST',
        description: 'Check pending deposits for auto-verification'
      },
      'combined-market-data': {
        endpoint: '/api/workflows/combined-market-data',
        method: 'POST',
        description: 'Run combined crypto + sports market data fetch'
      },
      'combined-analytics': {
        endpoint: '/api/workflows/combined-analytics',
        method: 'POST',
        description: 'Run combined analytics + tick adjustment + exchange rate'
      },
      'combined-daily-ops': {
        endpoint: '/api/workflows/combined-daily-ops',
        method: 'POST',
        description: 'Run combined leaderboard + AI topics + cleanup'
      }
    };

    if (!workflow || !workflowEndpoints[workflow]) {
      return NextResponse.json({
        error: 'Invalid workflow',
        available: Object.keys(workflowEndpoints)
      }, { status: 400 });
    }

    const config = workflowEndpoints[workflow];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://polymarket-bangladesh.vercel.app';
    
    console.log(`Admin ${user.id} triggering workflow: ${workflow}`);

    // Trigger the workflow
    const response = await fetch(`${appUrl}${config.endpoint}`, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Trigger': 'true',
        'X-Admin-Id': user.id
      }
    });

    const result = await response.json().catch(() => ({ message: 'No response body' }));

    // Log the trigger
    await supabase.from('admin_workflow_triggers').insert({
      admin_id: user.id,
      workflow_name: workflow,
      endpoint: config.endpoint,
      status: response.ok ? 'success' : 'failed',
      response: result,
      created_at: new Date().toISOString()
    });

    if (!response.ok) {
      return NextResponse.json({
        error: 'Workflow execution failed',
        workflow,
        result
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow triggered successfully',
      workflow,
      description: config.description,
      result
    });

  } catch (error) {
    console.error('Workflow trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/workflows/trigger
// Get list of available manual workflows
export async function GET() {
  const manualWorkflows = [
    {
      id: 'dispute-workflow',
      name: 'Dispute Resolution',
      description: 'Process pending disputes and resolutions',
      category: 'Admin',
      recommended: 'Run when new disputes are reported'
    },
    {
      id: 'execute-news',
      name: 'News Market Data',
      description: 'Fetch and process news market data',
      category: 'Market Data',
      recommended: 'Run daily or when major news breaks'
    },
    {
      id: 'batch-markets',
      name: 'Batch Markets',
      description: 'Batch process market updates',
      category: 'Core',
      recommended: 'Run when markets need batch updates'
    },
    {
      id: 'daily-report',
      name: 'Daily Report',
      description: 'Generate and send daily summary report',
      category: 'Reporting',
      recommended: 'Run on-demand for reports'
    },
    {
      id: 'auto-verify',
      name: 'Auto-Verification',
      description: 'Check pending deposits for auto-verification',
      category: 'USDT Management',
      recommended: 'Run when deposits are pending'
    },
    {
      id: 'combined-market-data',
      name: 'Combined Market Data',
      description: 'Run crypto + sports market data fetch',
      category: 'Market Data',
      recommended: 'Manual override for scheduled market data'
    },
    {
      id: 'combined-analytics',
      name: 'Combined Analytics',
      description: 'Run analytics + tick adjustment + exchange rate',
      category: 'Analytics',
      recommended: 'Manual override for scheduled analytics'
    },
    {
      id: 'combined-daily-ops',
      name: 'Combined Daily Operations',
      description: 'Run leaderboard + AI topics + cleanup',
      category: 'Daily Operations',
      recommended: 'Manual override for midnight operations'
    }
  ];

  return NextResponse.json({
    workflows: manualWorkflows,
    automated: [
      { name: 'Combined Market Data', cron: '*/5 * * * *', description: 'Crypto + Sports every 5 min' },
      { name: 'Combined Analytics', cron: '0 * * * *', description: 'Analytics + Tick + Rate hourly' },
      { name: 'Combined Daily Ops', cron: '0 0 * * *', description: 'Leaderboard + AI + Cleanup at midnight' },
      { name: 'Check Escalations', cron: '*/5 * * * *', description: 'Support escalation check every 5 min' }
    ]
  });
}
