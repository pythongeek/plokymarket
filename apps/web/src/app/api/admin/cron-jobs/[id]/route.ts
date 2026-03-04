/**
 * Admin API Route: Individual Cron Job Management
 * Handle PUT, DELETE, and POST (trigger) for specific cron jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const CRONJOB_API_BASE = 'https://api.cron-job.org/jobs';

interface CronJobUpdate {
    name?: string;
    url?: string;
    schedule?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    is_active?: boolean;
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

// PUT /api/admin/cron-jobs/[id] - Update a cron job
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const updates: CronJobUpdate = await request.json();

        // Build update payload for cron-job.org
        const updatePayload: any = {};

        if (updates.name) updatePayload.title = updates.name;
        if (updates.url) updatePayload.url = updates.url;
        if (updates.method) updatePayload.method = updates.method;
        if (updates.is_active !== undefined) updatePayload.isActive = updates.is_active;
        if (updates.schedule) {
            updatePayload.schedule = {
                timezone: 'Asia/Dhaka',
                expression: updates.schedule,
            };
        }
        if (updates.headers) updatePayload.headers = updates.headers;

        // Update job via cron-job.org API
        await cronJobApiRequest(`/${id}`, 'PUT', updatePayload);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating cron job:', error);
        return NextResponse.json({
            error: error.message || 'Failed to update cron job',
        }, { status: 500 });
    }
}

// DELETE /api/admin/cron-jobs/[id] - Delete a cron job
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        // Delete job via cron-job.org API
        await cronJobApiRequest(`/${id}`, 'DELETE');

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting cron job:', error);
        return NextResponse.json({
            error: error.message || 'Failed to delete cron job',
        }, { status: 500 });
    }
}

// POST /api/admin/cron-jobs/[id]/trigger - Trigger a cron job immediately
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        // Trigger job via cron-job.org API
        await cronJobApiRequest(`/${id}/execute`, 'POST');

        return NextResponse.json({ success: true, message: 'Job triggered successfully' });
    } catch (error: any) {
        console.error('Error triggering cron job:', error);
        return NextResponse.json({
            error: error.message || 'Failed to trigger cron job',
        }, { status: 500 });
    }
}
