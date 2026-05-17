/**
 * GET  /api/admin/workflows/cron-job - List jobs from cron-job.org
 * POST /api/admin/workflows/cron-job - Trigger a job run
 * Uses cron-job.org API as the backend scheduler
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/admin-auth';

const CRON_JOB_API_KEY = process.env.CRON_JOB_API_KEY || 'api-z0PgvEWDmWIDOcfycqGzlQA6nrSbltpogwmgvQfTs3g=';
const CRON_JOB_BASE = 'https://api.cron-job.org';

async function cronJobFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${CRON_JOB_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CRON_JOB_API_KEY}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'cron-job.org error' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// GET - List all cron-job.org jobs
export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const data = await cronJobFetch('/jobs');
    return NextResponse.json({ data: data.jobs || [] });
  } catch (err: any) {
    console.error('Cron-job.org list error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - Trigger a job by ID
export async function POST(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    await cronJobFetch(`/jobs/${jobId}/run`, { method: 'POST' });
    return NextResponse.json({ success: true, message: 'Job triggered' });
  } catch (err: any) {
    console.error('Cron-job.org trigger error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
