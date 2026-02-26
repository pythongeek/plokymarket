/**
 * Public Events API — serves active events for the homepage
 * Uses admin client to bypass RLS on the events table
 * Includes Bengali text encoding fix
 */
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const getAdmin = () => createAdminClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { 
      auth: { persistSession: false, autoRefreshToken: false },
      db: {
        schema: 'public'
      }
    }
);

// Fix Bengali text encoding issues
const fixBengaliEncoding = (text: string | null): string | null => {
  if (!text) return text;
  
  try {
    // Check if text contains garbled Bengali characters
    // Common pattern: � or replacement characters
    if (text.includes('�') || /[\ufffd]/.test(text)) {
      // Try to decode as UTF-8 if it was incorrectly encoded
      const bytes = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      return decoded;
    }
    return text;
  } catch {
    return text;
  }
};

// Process event data to fix encoding
const processEventData = (events: any[]) => {
  return events.map(event => ({
    ...event,
    title: fixBengaliEncoding(event.title),
    question: fixBengaliEncoding(event.question),
    description: fixBengaliEncoding(event.description),
    slug: fixBengaliEncoding(event.slug),
  }));
};

export async function GET() {
    try {
        const supabase = getAdmin();
        const { data, error } = await supabase
            .from('events')
            .select('id, title, question, description, category, subcategory, tags, image_url, slug, status, is_featured, trading_closes_at, starts_at, ends_at, total_volume, created_at')
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[Events API] Error:', error);
            return NextResponse.json([]);
        }

        // Fix Bengali encoding in response
        const processedData = processEventData(data || []);
        
        return NextResponse.json(processedData, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          }
        });
    } catch (err) {
        console.error('[Events API] Fatal:', err);
        return NextResponse.json([]);
    }
}
