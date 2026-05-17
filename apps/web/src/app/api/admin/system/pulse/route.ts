/**
 * GET /api/admin/system/pulse - Unified system telemetry for Super Admin dashboard
 * Returns: DB latency, Node.js memory, uptime, slow queries, recent errors
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export const dynamic = 'force-dynamic';

interface SlowQuery {
  query: string;
  mean_exec_time: number;
  calls: number;
  rows: number;
}

interface SystemError {
  id: string;
  level: string;
  source: string;
  message: string;
  route?: string;
  created_at: string;
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const startTime = performance.now();
  let dbLatency = -1;
  let dbStatus: 'healthy' | 'degraded' | 'down' = 'down';
  let slowQueries: SlowQuery[] = [];
  let recentErrors: SystemError[] = [];
  let errorRate24h = 0;
  let totalErrors24h = 0;

  try {
    // DB ping + latency
    const dbStart = performance.now();
    await pool.query('SELECT 1');
    dbLatency = Math.round(performance.now() - dbStart);
    dbStatus = dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'down';
  } catch {
    dbStatus = 'down';
  }

  // Slow query detection (graceful fallback)
  try {
    const sqResult = await pool.query(`
      SELECT query, mean_exec_time, calls, rows
      FROM pg_stat_statements
      WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY mean_exec_time DESC
      LIMIT 5
    `);
    slowQueries = sqResult.rows || [];
  } catch {
    // pg_stat_statements not available — skip silently
    slowQueries = [];
  }

  // Recent system errors
  try {
    const errResult = await pool.query(`
      SELECT id, level, source, message, route, created_at
      FROM system_errors
      WHERE created_at > now() - interval '24 hours'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    recentErrors = errResult.rows || [];

    // Error rate in last 24h
    const rateResult = await pool.query(`
      SELECT COUNT(*) as total FROM system_errors WHERE created_at > now() - interval '24 hours'
    `);
    totalErrors24h = parseInt(rateResult.rows[0]?.total || '0', 10);
    errorRate24h = totalErrors24h;
  } catch {
    recentErrors = [];
  }

  const mem = process.memoryUsage();

  return NextResponse.json({
    status: {
      database: dbStatus,
      api: 'healthy',
      memory: mem.heapUsed > mem.heapTotal * 0.9 ? 'degraded' : 'healthy',
    },
    metrics: {
      dbLatencyMs: dbLatency,
      memoryUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      memoryTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      memoryRSSMB: Math.round(mem.rss / 1024 / 1024),
      uptimeSeconds: Math.floor(process.uptime()),
      errorRate24h,
      totalErrors24h,
    },
    slowQueries,
    recentErrors,
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
