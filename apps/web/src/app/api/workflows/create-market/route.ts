import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyQStashSignature } from '@/lib/upstash/workflows';
import { MarketService } from '@/lib/services/MarketService';
import { Client as QStashClient } from '@upstash/qstash';

export const runtime = 'edge';
export const maxDuration = 60; // Extra time for seeding orderbook

const getSupabase = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('upstash-signature') || '';
        const bodyText = await request.text();

        if (process.env.NODE_ENV === 'production' && !verifyQStashSignature(signature, bodyText)) {
            console.warn('[Create Market] Invalid QStash signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const { eventId, userId, eventData } = JSON.parse(bodyText);

        if (!eventId || !userId || !eventData) {
            console.error('[Create Market] Missing required fields', { eventId, userId });
            return NextResponse.json({ error: 'Missing req fields' }, { status: 400 });
        }

        const supabase = getSupabase();

        // 1. Double check market doesn't already exist for this event
        const { data: existingMarket } = await supabase
            .from('markets')
            .select('id')
            .eq('event_id', eventId)
            .maybeSingle();

        if (existingMarket) {
            console.log('[Create Market] Market already exists for event:', eventId);
            return NextResponse.json({ success: true, marketId: existingMarket.id, message: 'Market already exists' });
        }

        // 2. Create the market
        const { data: market, error: marketError } = await supabase
            .from('markets')
            .insert({
                event_id: eventId,
                name: eventData.title,
                question: eventData.question,
                description: eventData.description,
                category: eventData.category,
                subcategory: eventData.subcategory,
                trading_closes_at: eventData.trading_closes_at,
                resolution_delay_hours: eventData.resolution_delay_hours,
                initial_liquidity: eventData.initial_liquidity,
                liquidity: eventData.initial_liquidity,
                status: 'active',
                slug: `${eventData.slug}-market`,
                answer_type: 'binary',
                answer1: eventData.answer1,
                answer2: eventData.answer2,
                is_featured: eventData.is_featured,
                created_by: userId,
                image_url: eventData.image_url,
            })
            .select()
            .single();

        if (marketError) {
            console.error('[Create Market] Market insert error:', marketError);
            throw new Error(`Market insert error: ${marketError.message}`);
        }

        const marketId = market.id;
        console.log('[Create Market] Successfully created market:', marketId);

        // 3. Create resolution configuration
        const { error: resolutionError } = await supabase
            .from('resolution_systems')
            .insert({
                event_id: eventId,
                market_id: marketId,
                primary_method: eventData.resolution_method,
                ai_keywords: eventData.tags || [],
                ai_sources: [],
                confidence_threshold: 85,
            });

        if (resolutionError) {
            console.warn('[Create Market] Resolution config warning:', resolutionError);
        }

        // 4. Seed initial orderbook
        try {
            const marketService = new MarketService();
            const seedResult = await marketService.seedInitialOrderbook(
                marketId,
                userId,
                eventData.initial_liquidity
            );

            if (!seedResult.success) {
                console.warn('[Create Market] Orderbook seeding failed:', seedResult.error);
            } else {
                console.log('[Create Market] Orderbook seeded with', seedResult.order_ids?.length || 0, 'orders');
            }
        } catch (seedError: any) {
            console.warn('[Create Market] Orderbook seeding error:', seedError.message);
        }

        // 5. Log admin action
        try {
            await supabase.rpc('log_admin_action', {
                p_admin_id: userId,
                p_action_type: 'create_event',
                p_resource_type: 'event',
                p_resource_id: eventId,
                p_new_values: {
                    title: eventData.title,
                    category: eventData.category,
                    market_id: marketId,
                },
                p_reason: 'Event created via admin panel (async market generation)',
            });
        } catch (logError: any) {
            console.warn('[Create Market] Admin log warning:', logError.message);
        }

        // 6. Chain into event-processor workflow
        if (process.env.QSTASH_TOKEN) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
                const qstashClient = new QStashClient({ token: process.env.QSTASH_TOKEN });

                await qstashClient.publishJSON({
                    url: `${baseUrl}/api/workflows/event-processor`,
                    body: {
                        event_id: eventId,
                        market_id: marketId,
                        action: 'post_create',
                    }
                });
            } catch (workflowError: any) {
                console.warn('[Create Market] Event Processor trigger warning:', workflowError.message);
            }
        }

        return NextResponse.json({ success: true, eventId, marketId });

    } catch (error: any) {
        console.error('[Create Market] Async execution error:', error.message);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
