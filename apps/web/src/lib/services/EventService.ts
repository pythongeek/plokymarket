import { createClient } from '@supabase/supabase-js';
import { Event } from '@/types/market-system';

/**
 * Supabase Admin client generator for backend operations.
 */
const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });
};

/**
 * Service to handle Event-related operations.
 */
export class EventService {
    /**
     * Generates a slug from a title.
     */
    generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 80) + '-' + Date.now().toString(36);
    }

    /**
     * Normalizes event data and inserts it into the database.
     * Only whitelisted columns are sent to Supabase to prevent invalid-column errors.
     */
    async createEvent(eventData: Partial<Event> & Record<string, any>): Promise<Event> {
        console.log(`🔥 [EventService] Creating event: ${eventData.title}`);

        try {
            const title = eventData.title || eventData.question || 'Untitled Event';
            const slug = eventData.slug || this.generateSlug(title);

            // Check for duplicate slug
            const { data: existingEvent } = await getSupabaseAdmin()
                .from('events')
                .select('id, slug, status')
                .eq('slug', slug)
                .maybeSingle();

            if (existingEvent) {
                console.warn(`🔥 [EventService] Event with slug "${slug}" already exists, appending timestamp`);
            }

            const finalSlug = existingEvent ? `${slug}-${Date.now().toString(36)}` : slug;

            // ✅ WHITELIST: Only send valid events table columns
            const payload: Record<string, any> = {
                title,
                question: eventData.question || title,
                slug: finalSlug,
                description: eventData.description || '',
                category: eventData.category || 'general',
                subcategory: eventData.subcategory || null,
                tags: eventData.tags || [],
                status: eventData.status || 'active',
                starts_at: eventData.starts_at || new Date().toISOString(),
                ends_at: eventData.ends_at || null,
                trading_opens_at: eventData.trading_opens_at || new Date().toISOString(),
                trading_closes_at: eventData.trading_closes_at || null,
                image_url: eventData.image_url || null,
                is_featured: eventData.is_featured || false,
                resolution_source: eventData.resolution_source || null,
                resolution_method: eventData.resolution_method || 'manual_admin',
                resolution_delay: eventData.resolution_delay ?? 1440,
                ai_keywords: eventData.ai_keywords || [],
                ai_sources: eventData.ai_sources || [],
                ai_confidence_threshold: eventData.ai_confidence_threshold || 85,
                initial_liquidity: eventData.initial_liquidity || 1000,
                answer1: eventData.answer1 || 'হ্যাঁ (YES)',
                answer2: eventData.answer2 || 'না (NO)',
                created_by: eventData.created_by || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Remove null/undefined values to let DB defaults handle them
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined) delete payload[key];
            });

            console.log(`🔥 [EventService] Insert payload keys:`, Object.keys(payload).join(', '));

            const { data, error } = await getSupabaseAdmin()
                .from('events')
                .insert(payload)
                .select()
                .single();

            if (error) {
                console.error('🔥 [EventService] Insert error:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                throw new Error(error.message);
            }

            console.log(`🔥 [EventService] Event created successfully:`, {
                id: data.id,
                slug: data.slug,
                status: data.status,
            });
            return data as Event;
        } catch (err: any) {
            console.error('🔥 [EventService] createEvent failed:', err.message);
            throw err;
        }
    }

    /**
     * Generates a signed URL for image uploads.
     */
    async getUploadUrl(filePath: string, bucket: string = 'event-images'): Promise<{ signedUrl: string, path: string }> {
        try {
            const { data, error } = await getSupabaseAdmin()
                .storage
                .from(bucket)
                .createSignedUploadUrl(filePath);

            if (error) throw error;
            return { signedUrl: data.signedUrl, path: data.path };
        } catch (err: any) {
            console.error("[EventService] Failed to generate upload URL:", err);
            throw err;
        }
    }
}

export const eventService = new EventService();
