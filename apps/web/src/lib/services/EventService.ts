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
     */
    async createEvent(eventData: Partial<Event>): Promise<Event> {
        console.log(`[EventService] Creating event: ${eventData.title}`);

        try {
            const title = eventData.title || eventData.question || 'Untitled Event';
            const slug = eventData.slug || this.generateSlug(title);

            const payload = {
                ...eventData,
                title,
                slug,
                status: eventData.status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await getSupabaseAdmin()
                .from('events')
                .insert(payload)
                .select()
                .single();

            if (error) {
                console.error('[EventService] Insert error:', error);
                throw new Error(error.message);
            }

            console.log(`[EventService] Event created: ${data.id}`);
            return data as Event;
        } catch (err: any) {
            console.error('[EventService] createEvent failed:', err);
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
