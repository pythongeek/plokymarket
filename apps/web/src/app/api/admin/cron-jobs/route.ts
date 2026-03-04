/**
 * Admin API Route: Cron Job Manager
 * Manages cron-job.org jobs via their REST API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CRONJOB_API_BASE = 'https://api.cron-job.org/jobs';

interface CronJob {
    id: number;
    url: string;
    name: string;
    schedule: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers: Record<string, string>;
    created_at: string;
    last_execution: string | null;
    last_status: number | null;
    is_active: boolean;
    execution_count: number;
    request_count: number;
}

// Helper to get cron-job.org API token from environment
function getCronJobApiToken(): string | null {
    return process.env.CRONJOB_API_TOKEN || null;
}

// Helper to make requests to cron-job.org API
async function cronJobApiRequest(endpoint: string, method: string = 'GET', body?: any) {
    const apiToken = getCronJobApiToken();

    if (!apiToken) {
        throw new Error('CRONJOB_API_TOKEN not configured');
    }

    const response = await fetch(`${CRONJOB_API_BASE}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`cron-job.org API error: ${error}`);
    }

    return response.json();
}

// GET /api/admin/cron-jobs - List all cron jobs
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('user_id', session.user.id)
            .single();

        const isAdmin = (profile as any)?.is_admin || (profile as any)?.is_super_admin;
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if API token is configured
        const apiToken = getCronJobApiToken();
        if (!apiToken) {
            return NextResponse.json({
                error: 'CRONJOB_API_TOKEN not configured',
                jobs: [],
                stats: null,
                configured: false,
            }, { status: 200 });
        }

        // Fetch jobs from cron-job.org
        const response = await cronJobApiRequest('');

        // Transform the response to our format
        const jobs: CronJob[] = (response.jobs || []).map((job: any) => ({
            id: job.jobId,
            url: job.url,
            name: job.title,
            schedule: job.schedule,
            method: job.method || 'POST',
            headers: job.headers || {},
            created_at: job.createdAt,
            last_execution: job.lastExecution?.time || null,
            last_status: job.lastExecution?.status || null,
            is_active: job.isActive,
            execution_count: job.executions || 0,
            request_count: job.usage || 0,
        }));

        // Calculate stats
        const stats = {
            total_requests: jobs.reduce((sum: number, j: CronJob) => sum + j.request_count, 0),
            request_limit: 10000, // Free tier limit
            usage_percentage: Math.round((jobs.reduce((sum: number, j: CronJob) => sum + j.request_count, 0) / 10000) * 100),
            active_jobs: jobs.filter((j: CronJob) => j.is_active).length,
            total_jobs: jobs.length,
        };

        return NextResponse.json({ jobs, stats, configured: true });
    } catch (error: any) {
        console.error('Error fetching cron jobs:', error);
        return NextResponse.json({
            error: error.message || 'Failed to fetch cron jobs',
            jobs: [],
            stats: null,
        }, { status: 500 });
    }
}

// POST /api/admin/cron-jobs - Create a new cron job
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('user_id', session.user.id)
            .single();

        const isAdminPost = (profile as any)?.is_admin || (profile as any)?.is_super_admin;
        if (!isAdminPost) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, url, schedule, method = 'POST', headers = {} } = body;

        if (!name || !url || !schedule) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get the base URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://polymarket-bangladesh.vercel.app';
        const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

        // Create job via cron-job.org API
        const response = await cronJobApiRequest('', 'POST', {
            url: fullUrl,
            title: name,
            schedule: {
                timezone: 'Asia/Dhaka',
                expression: schedule,
                enabled: true,
            },
            method: method,
            headers: headers,
        });

        return NextResponse.json({
            success: true,
            jobId: response.jobId,
        });
    } catch (error: any) {
        console.error('Error creating cron job:', error);
        return NextResponse.json({
            error: error.message || 'Failed to create cron job',
        }, { status: 500 });
    }
}
