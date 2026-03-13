import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { QStashClient } from '@/lib/upstash/workflows';

export const runtime = 'edge';
export const maxDuration = 60;

const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
    try {
        // 1. Verify Vercel Cron Authentication
        // https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
        const authHeader = request.headers.get('authorization');
        const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('cron-secret');
        if (process.env.NODE_ENV === 'production') {
            const secret = process.env.CRON_SECRET || process.env.MASTER_CRON_SECRET;
            if (authHeader !== `Bearer ${secret}` && cronSecret !== secret) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const supabase = getSupabase();

        // 2. Fetch orphaned event IDs using the view/function created in migration 143c
        const { data: orphanedEventIds, error: rpcError } = await supabase
            .rpc('get_orphaned_event_ids');

        if (rpcError) {
            console.error('[Orphan Sync] RPC failed:', rpcError);
            return NextResponse.json({ error: 'Failed to fetch orphaned events' }, { status: 500 });
        }

        if (!orphanedEventIds || orphanedEventIds.length === 0) {
            return NextResponse.json({ success: true, message: 'No orphaned events found', count: 0 });
        }

        console.log(`[Orphan Sync] Found ${orphanedEventIds.length} orphaned events.`);

        // 3. Fetch full event details
        const { data: events, error: fetchError } = await supabase
            .from('events')
            .select('*')
            .in('id', orphanedEventIds);

        if (fetchError || !events) {
            return NextResponse.json({ error: 'Failed to fetch event details' }, { status: 500 });
        }

        // 4. Publish to QStash
        const qstashClient = new QStashClient({ token: process.env.QSTASH_TOKEN! });
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        let queuedCount = 0;
        const errors: string[] = [];

        for (const event of events) {
            try {
                await qstashClient.publishJSON({
                    url: `${baseUrl}/api/workflows/create-market`,
                    body: {
                        eventId: event.id,
                        userId: event.created_by,
                        eventData: {
                            title: event.title,
                            question: event.question,
                            description: event.description,
                            category: event.category,
                            subcategory: event.subcategory,
                            slug: event.slug,
                            trading_closes_at: event.trading_closes_at,
                            resolution_delay_hours: event.resolution_delay_hours || 24,
                            initial_liquidity: event.initial_liquidity || 10000,
                            resolution_method: event.resolution_method || 'manual_admin',
                            answer1: event.answer1 || 'Yes',
                            answer2: event.answer2 || 'No',
                            is_featured: event.is_featured || false,
                            image_url: event.image_url,
                            tags: event.tags || [],
                        }
                    },
                    retries: 3
                });
                queuedCount++;
            } catch (err: any) {
                console.error(`[Orphan Sync] Failed to enqueue event ${event.id}:`, err);
                errors.push(`Event ${event.id}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            count: queuedCount,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('[Orphan Sync] Fatal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
