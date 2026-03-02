/**
 * Workflow Setup API
 * Admin endpoint to configure QStash schedules
 * Replaces n8n workflow configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { Client as QStashClient } from '@upstash/qstash';

export const runtime = 'edge';

const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN not configured');
  return new QStashClient({ token });
};

async function verifyAdmin(supabase: any, request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin, is_super_admin')
    .eq('id', user.id)
    .single();

  return !!(profile?.is_admin || profile?.is_super_admin);
}

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
};

const DEFAULT_SCHEDULES = [
  {
    name: 'market-close-check',
    workflow_type: 'market_close_check',
    cron: '0 */6 * * *',
    endpoint: '/api/workflows/v2/execute',
    payload: { workflow_type: 'market_close_check' },
    description: 'Check and close markets past trading deadline',
  },
  {
    name: 'price-snapshot',
    workflow_type: 'price_snapshot',
    cron: '*/30 * * * *',
    endpoint: '/api/workflows/v2/execute',
    payload: { workflow_type: 'price_snapshot' },
    description: 'Take price snapshots for active markets',
  },
  {
    name: 'exchange-rate-update',
    workflow_type: 'exchange_rate_update',
    cron: '*/5 * * * *',
    endpoint: '/api/workflows/update-exchange-rate',
    payload: {},
    description: 'Update BDT/USDT exchange rate',
  },
  {
    name: 'daily-report',
    workflow_type: 'daily_report',
    cron: '0 9 * * *',
    timezone: 'Asia/Dhaka',
    endpoint: '/api/workflows/v2/execute',
    payload: { workflow_type: 'daily_report' },
    description: 'Generate and send daily report to admins',
  },
  {
    name: 'workflow-cleanup',
    workflow_type: 'cleanup',
    cron: '0 2 * * *',
    endpoint: '/api/workflows/v2/execute',
    payload: { workflow_type: 'cleanup' },
    description: 'Clean up old completed workflow runs',
  },
];

export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();

  if (!await verifyAdmin(supabase, request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const qstash = getQStashClient();
    const schedules = await qstash.schedules.list();

    const { data: localSchedules } = await supabase
      .from('workflow_schedules')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      qstash_schedules: schedules.map((s: any) => ({
        id: s.id,
        destination: s.destination,
        cron: s.cron,
        created_at: s.createdAt,
      })),
      local_schedules: localSchedules || [],
    });

  } catch (error: any) {
    console.error('[Workflow Setup] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();

  if (!await verifyAdmin(supabase, request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, schedule_id, setup_defaults } = body;

    const qstash = getQStashClient();
    const baseUrl = getBaseUrl();

    if (setup_defaults) {
      const results = [];

      for (const config of DEFAULT_SCHEDULES) {
        try {
          const schedule = await qstash.schedules.create({
            destination: `${baseUrl}${config.endpoint}`,
            cron: config.cron,
            timezone: config.timezone,
            retries: 3,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          await supabase
            .from('workflow_schedules')
            .upsert({
              schedule_id: schedule.id,
              name: config.name,
              workflow_type: config.workflow_type,
              cron_expression: config.cron,
              timezone: config.timezone || 'UTC',
              endpoint_url: config.endpoint,
              default_payload: config.payload,
              description: config.description,
              is_active: true,
            }, { onConflict: 'name' })
            .select()
            .single();

          results.push({
            name: config.name,
            status: 'created',
            schedule_id: schedule.id,
          });
        } catch (err: any) {
          results.push({
            name: config.name,
            status: 'error',
            error: err.message,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Default schedules setup completed',
        results,
      });
    }

    if (action === 'delete' && schedule_id) {
      await qstash.schedules.delete({ id: schedule_id });
      
      await supabase
        .from('workflow_schedules')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('schedule_id', schedule_id);

      return NextResponse.json({
        success: true,
        message: `Schedule ${schedule_id} deleted`,
      });
    }

    if (action === 'pause' && schedule_id) {
      await supabase
        .from('workflow_schedules')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('schedule_id', schedule_id);

      return NextResponse.json({
        success: true,
        message: `Schedule ${schedule_id} paused`,
      });
    }

    if (action === 'resume' && schedule_id) {
      await supabase
        .from('workflow_schedules')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('schedule_id', schedule_id);

      return NextResponse.json({
        success: true,
        message: `Schedule ${schedule_id} resumed`,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error: any) {
    console.error('[Workflow Setup] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
