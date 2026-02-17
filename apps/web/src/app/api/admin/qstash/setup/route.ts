/**
 * Admin API: Setup QStash Schedule for Market Resolution
 * This creates a recurring cron job to check markets every hour
 * 
 * Supported Workflows:
 * - check-markets: Hourly market resolution checks
 * - batch-markets: Every 15 min batch processing
 * - daily-ai-topics: Daily AI topic generation
 * - tick-adjustment: Hourly tick size adjustments
 * - leaderboard: Daily leaderboard processing
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSchedule, listSchedules, deleteSchedule } from '@/lib/qstash/client';

// Available workflow configurations
const WORKFLOW_CONFIGS = {
  'check-markets': {
    path: '/api/cron/check-markets',
    cron: '0 * * * *',
    method: 'GET',
    description: 'Hourly market resolution checks'
  },
  'batch-markets': {
    path: '/api/cron/batch-markets',
    cron: '0,15,30,45 * * * *',
    method: 'GET',
    description: 'Every 15 min batch processing'
  },
  'daily-ai-topics': {
    path: '/api/cron/daily-ai-topics',
    cron: '0 0 * * *',
    method: 'POST',
    description: 'Daily AI topic generation (6 AM BDT)'
  },
  'tick-adjustment': {
    path: '/api/cron/tick-adjustment',
    cron: '0 * * * *',
    method: 'GET',
    description: 'Hourly tick size adjustments'
  },
  'leaderboard': {
    path: '/api/leaderboard/cron',
    cron: '0 0 * * *',
    method: 'POST',
    description: 'Daily leaderboard processing (6 AM BDT)'
  }
};

export const runtime = 'edge';

// Verify admin authentication
async function verifyAdmin(request: Request): Promise<{ isAdmin: boolean; error?: string }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing authorization header' };
  }

  const token = authHeader.split(' ')[1];
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, error: 'Invalid token' };
  }

  // Check if user is admin (supports both 'users' and 'user_profiles' tables)
  let isAdmin = false;
  
  // Try user_profiles table first (most common)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin, is_super_admin')
    .eq('id', user.id)
    .single();
  
  if (profile?.is_admin || profile?.is_super_admin) {
    isAdmin = true;
  } else {
    // Fallback to users table with role column
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (userData?.role === 'admin') {
      isAdmin = true;
    }
  }

  if (!isAdmin) {
    return { isAdmin: false, error: 'Not an admin' };
  }

  return { isAdmin: true };
}

/**
 * POST /api/admin/qstash/setup
 * Create or update the QStash schedule for market resolution
 * 
 * Body: { workflow: 'tick-adjustment' | 'leaderboard' | 'check-markets' | 'batch-markets' | 'daily-ai-topics' }
 */
export async function POST(request: Request) {
  const adminCheck = await verifyAdmin(request);
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { 
      workflow = 'check-markets',
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://plokymarket.vercel.app'
    } = body;

    // Validate workflow
    const config = WORKFLOW_CONFIGS[workflow as keyof typeof WORKFLOW_CONFIGS];
    if (!config) {
      return NextResponse.json(
        { 
          error: 'Invalid workflow',
          available: Object.keys(WORKFLOW_CONFIGS)
        },
        { status: 400 }
      );
    }

    const webhookUrl = `${baseUrl}${config.path}`;

    // First, check for existing schedules and delete them
    const existingSchedules = await listSchedules();
    const existingSchedule = existingSchedules.find(
      s => s.destination === webhookUrl
    );

    if (existingSchedule) {
      console.log(`[QStash] Deleting existing schedule: ${existingSchedule.scheduleId}`);
      await deleteSchedule(existingSchedule.scheduleId);
    }

    // Create new schedule
    const { scheduleId } = await createSchedule(webhookUrl, {
      cron: config.cron,
      retries: 3,
    });

    console.log(`[QStash] Created new schedule: ${scheduleId} for ${workflow}`);

    return NextResponse.json({
      success: true,
      scheduleId,
      workflow,
      cron: config.cron,
      webhookUrl,
      description: config.description,
      message: `QStash schedule for ${workflow} created successfully`,
    });

  } catch (error: any) {
    console.error('[QStash Setup] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to setup QStash schedule',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/qstash/setup
 * List all QStash schedules and available workflows
 */
export async function GET(request: Request) {
  const adminCheck = await verifyAdmin(request);
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const schedules = await listSchedules();
    
    return NextResponse.json({
      success: true,
      schedules,
      count: schedules.length,
      availableWorkflows: WORKFLOW_CONFIGS,
    });

  } catch (error: any) {
    console.error('[QStash List] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list schedules' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/qstash/setup
 * Delete a QStash schedule
 */
export async function DELETE(request: Request) {
  const adminCheck = await verifyAdmin(request);
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { error: adminCheck.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      );
    }

    await deleteSchedule(scheduleId);

    return NextResponse.json({
      success: true,
      message: `Schedule ${scheduleId} deleted successfully`,
    });

  } catch (error: any) {
    console.error('[QStash Delete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
