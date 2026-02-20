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

        // 4. Database Insertion
        const eventId = crypto.randomUUID();

        // Use service client if database RLS is too restrictive for direct inserts or if we need to bypass some checks
        // However, the user's RLS policy should ideally allow admins to insert. 
        // We'll use the regular client first to respect RLS unless explicitly needed.
        const { data: event, error: insertError } = await supabase
            .from('events')
            .insert({
                id: eventId,
                name: formData.name,
                title: formData.name, // Sync title with name
                question: formData.question,
                slug: formData.slug,
                category: formData.category,
                answer1: formData.answer1,
                answer2: formData.answer2,
                answer_type: 'binary',
                starts_at: new Date(formData.startsAt).toISOString(),
                ends_at: new Date(formData.endsAt).toISOString(),
                trading_closes_at: new Date(formData.endsAt).toISOString(),
                resolution_delay: formData.resolutionDelay,
                initial_liquidity: formData.initialLiquidity,
                current_liquidity: formData.initialLiquidity,
                current_yes_price: formData.initialPrice,
                current_no_price: 1 - formData.initialPrice,
                image_url: formData.imageUrl || null,
                resolver_reference: formData.resolverAddress,
                description: formData.description || null,
                neg_risk: formData.negRisk,
                status: 'active', // Default to active for manually created markets
                is_verified: false, // Manual review required as per snippet
                is_featured: false,
                is_trending: false,
                total_volume: 0,
                total_trades: 0,
                unique_traders: 0,
                created_by: user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            console.error('Database Insertion Error:', insertError);
            return { error: { database: [insertError.message] } };
        }

        // 5. Trigger n8n Webhook for Image Optimization (Optional but recommended)
        if (formData.imageUrl && process.env.N8N_WEBHOOK_URL) {
            try {
                await fetch(`${process.env.N8N_WEBHOOK_URL}/optimize-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId: eventId, imageUrl: formData.imageUrl }),
                });
            } catch (webhookErr) {
                console.warn('Webhook trigger failed:', webhookErr);
                // Don't fail the whole action if the webhook fails
            }
        }

        // 6. Log Admin Activity
        await supabase.rpc('log_admin_access', {
            p_admin_id: user.id,
            p_action: 'create_market',
            p_success: true,
        });

        // Revalidate paths to update UI
        revalidatePath('/sys-cmd-7x9k2/events');
        revalidatePath('/');

        return { success: true, event };

    } catch (error: any) {
        console.error('Unexpected Server Action Error:', error);
        return { error: { server: [error.message || 'An unexpected error occurred.'] } };
    }
}
