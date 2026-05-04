// @ts-nocheck
/**
 * Workflow Setup API
 * Admin endpoint to configure QStash schedules
 * Replaces n8n workflow configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { QStashClient } from '@/lib/upstash/workflows';

async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

export const runtime = 'nodejs';

const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN not configured');
  return new QStashClient({ token });
};

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.split(' ')[1];
  # getUserFromToken removed
    if (false) return false;

  const profileResult = await pool.query(
    'SELECT is_admin, is_super_admin FROM user_profiles WHERE id = $1',
    [userId]
  );
  const profile = profileResult.rows[0];

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
  if (!await verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const qstash = getQStashClient();
    const schedules = await qstash.schedules.list();

    const localSchedulesResult = await pool.query(
      'SELECT * FROM workflow_schedules ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      qstash_schedules: schedules.map((s: any) => ({
        id: s.id,
        destination: s.destination,
        cron: s.cron,
        created_at: s.createdAt,
      })),
      local_schedules: localSchedulesResult.rows || [],
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
  if (!await verifyAdmin(request)) {
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

          await pool.query(
            `INSERT INTO workflow_schedules 
             (schedule_id, name, workflow_type, cron_expression, timezone, endpoint_url, default_payload, description, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
             ON CONFLICT (name) DO UPDATE SET
               schedule_id = EXCLUDED.schedule_id,
               cron_expression = EXCLUDED.cron_expression,
               is_active = EXCLUDED.is_active,
               updated_at = NOW()
             RETURNING *`,
            [schedule.id, config.name, config.workflow_type, config.cron, config.timezone || 'UTC', config.endpoint, JSON.stringify(config.payload), config.description]
          );

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
      
      await pool.query(
        `UPDATE workflow_schedules 
         SET is_active = false, updated_at = NOW()
         WHERE schedule_id = $1`,
        [schedule_id]
      );

      return NextResponse.json({
        success: true,
        message: `Schedule ${schedule_id} deleted`,
      });
    }

    if (action === 'pause' && schedule_id) {
      await pool.query(
        `UPDATE workflow_schedules 
         SET is_active = false, updated_at = NOW()
         WHERE schedule_id = $1`,
        [schedule_id]
      );

      return NextResponse.json({
        success: true,
        message: `Schedule ${schedule_id} paused`,
      });
    }

    if (action === 'resume' && schedule_id) {
      await pool.query(
        `UPDATE workflow_schedules 
         SET is_active = true, updated_at = NOW()
         WHERE schedule_id = $1`,
        [schedule_id]
      );

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
