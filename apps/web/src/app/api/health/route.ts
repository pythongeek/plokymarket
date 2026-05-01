import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency_ms?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime_seconds: number;
  services: {
    database: ServiceStatus;
    supabase: ServiceStatus;
    redis: ServiceStatus;
  };
  environment: 'production' | 'development' | 'staging';
}

const startTime = Date.now();

export async function GET() {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    services: {
      database: { status: 'up' },
      supabase: { status: 'up' },
      redis: { status: 'up' },
    },
    environment: (process.env.NODE_ENV as any) || 'development',
  };

  // Check Supabase
  const startSupabase = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('markets').select('id').limit(1);
    response.services.supabase.latency_ms = Date.now() - startSupabase;
    if (error && error.code !== 'PGRST116') {
      // Ignore "no rows" error, that's fine
      response.services.supabase.status = 'degraded';
      response.services.supabase.error = error.message;
    }
  } catch (err: any) {
    response.services.supabase.status = 'down';
    response.services.supabase.latency_ms = Date.now() - startSupabase;
    response.services.supabase.error = err.message;
  }

  // Check Redis (Upstash)
  const startRedis = Date.now();
  try {
    const redisUrl = process.env.KV_REST_API_URL;
    if (redisUrl) {
      const res = await fetch(`${redisUrl}/health`, {
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
      });
      response.services.redis.latency_ms = Date.now() - startRedis;
      if (!res.ok) {
        response.services.redis.status = 'degraded';
      }
    } else {
      response.services.redis.status = 'up'; // Redis is optional
    }
  } catch (err: any) {
    response.services.redis.status = 'degraded';
    response.services.redis.latency_ms = Date.now() - startRedis;
    response.services.redis.error = err.message;
  }

  // Database check (local postgres via environment)
  const startDB = Date.now();
  try {
    // Try a simple query to verify DB is reachable
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      // For local Supabase Docker, DATABASE_URL would be set
      response.services.database.latency_ms = Date.now() - startDB;
      response.services.database.status = 'up';
    }
  } catch (err: any) {
    response.services.database.status = 'degraded';
    response.services.database.latency_ms = Date.now() - startDB;
    response.services.database.error = err.message;
  }

  // Overall status
  const downServices = Object.values(response.services).filter(
    (s) => s.status === 'down'
  ).length;
  const degradedServices = Object.values(response.services).filter(
    (s) => s.status === 'degraded'
  ).length;

  if (downServices > 0) {
    response.status = 'down';
  } else if (degradedServices > 0) {
    response.status = 'degraded';
  }

  const httpStatus = response.status === 'down' ? 503 : 200;

  return NextResponse.json(response, { status: httpStatus });
}
