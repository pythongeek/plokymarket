'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { marketSchema, type MarketFormData } from '@/lib/validations/market';
import { revalidatePath } from 'next/cache';

export async function createMarketAction(data: MarketFormData) {
    try {
        const supabase = await createClient();

        // 1. Verify Authentication & Admin Status
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { error: { auth: ['Unauthorized. Please login again.'] } };
        }

        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (profileError || (!profile?.is_admin && !profile?.is_super_admin)) {
            return { error: { auth: ['Admin access required.'] } };
        }

        // 2. Server-Side Validation
        const parsed = marketSchema.safeParse(data);
        if (!parsed.success) {
            return { error: parsed.error.format() };
        }

        const formData = parsed.data;

        // 3. Slug Uniqueness Check (Race Condition Protection)
        const { data: existing } = await supabase
            .from('events')
            .select('id')
            .eq('slug', formData.slug)
            .single();

        if (existing) {
            return { error: { slug: ['এই Slug টি ইতিমধ্যে ব্যবহৃত হচ্ছে। অন্য একটি চেষ্টা করুন।'] } };
        }

        // 4. Create Event & Market via Services
        const { eventService } = await import('@/lib/services/EventService');
        const { marketService } = await import('@/lib/services/MarketService');

        const event = await eventService.createEvent({
            title: formData.name,
            question: formData.question,
            slug: formData.slug,
            category: formData.category.toLowerCase(),
            starts_at: new Date(formData.startsAt).toISOString(),
            ends_at: new Date(formData.endsAt).toISOString(),
            description: formData.description || undefined,
            image_url: formData.imageUrl || undefined,
            created_by: user.id,
            status: 'active'
        });

        const market = await marketService.createMarketWithLiquidity(
            event.id,
            {
                question: event.question,
                description: event.description,
                category: event.category,
                status: 'active',
                trading_closes_at: event.ends_at,
                event_date: event.ends_at,
                creator_id: user.id
            } as any,
            formData.initialLiquidity
        );

        // 5. Trigger n8n Webhook for Image Optimization (Optional but recommended)
        if (formData.imageUrl && process.env.N8N_WEBHOOK_URL) {
            try {
                await fetch(`${process.env.N8N_WEBHOOK_URL}/optimize-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId: event.id, imageUrl: formData.imageUrl }),
                });
            } catch (webhookErr) {
                console.warn('Webhook trigger failed:', webhookErr);
                // Don't fail the whole action if the webhook fails
            }
        }

        // 6. Log Admin Activity
        try {
            await supabase.rpc('log_admin_access', {
                p_admin_id: user.id,
                p_action: 'create_market',
                p_success: true,
            });
        } catch (logErr) {
            console.warn('Log admin access failed:', logErr);
        }

        // Revalidate paths to update UI
        revalidatePath('/sys-cmd-7x9k2/events');
        revalidatePath('/');

        return { success: true, event };

    } catch (error: any) {
        console.error('Unexpected Server Action Error:', error);
        return { error: error.message || 'An unexpected error occurred.' };
    }
}
