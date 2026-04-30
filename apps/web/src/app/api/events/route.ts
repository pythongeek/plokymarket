/**
 * Public Events API — serves active events for the homepage
 * Uses admin client to bypass RLS on the events table
 * Includes Bengali text encoding fix
 * Cached at CDN edge for 60 seconds
 */
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// ISR: Cache for 60 seconds at edge, stale-while-revalidate for 5 minutes
export const dynamic = 'force-static';
export const revalidate = 60;

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get('cursor'); // for infinite scroll - last event ID
        const limit = parseInt(searchParams.get('limit') || '12');
        const userId = searchParams.get('user_id'); // for personalized recommendations
        
        const supabase = getAdmin();
        
        let query = supabase
            .from('events')
            .select('id, title, question, description, category, subcategory, tags, image_url, slug, status, is_featured, trading_closes_at, starts_at, ends_at, total_volume, created_at')
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit);
        
        // Cursor-based pagination for infinite scroll
        if (cursor) {
            const { data: cursorEvent } = await supabase
                .from('events')
                .select('created_at')
                .eq('id', cursor)
                .single();
            
            if (cursorEvent) {
                query = query.lt('created_at', cursorEvent.created_at);
            }
        }
        
        const { data, error } = await query;

        if (error) {
            console.error('[Events API] Error:', error);
            return NextResponse.json({ events: [], nextCursor: null });
        }

        // Fix Bengali encoding in response
        const processedData = processEventData(data || []);
        
        // Generate next cursor
        const nextCursor = processedData.length > 0 ? processedData[processedData.length - 1].id : null;
        
        // For personalized recommendations: get user's trade categories
        let recommendedEvents = [];
        if (userId) {
            try {
                // Get user's trading history - get market IDs from trades
                const { data: userTrades } = await supabase
                    .from('trades')
                    .select('market_id')
                    .eq('user_id', userId)
                    .limit(50);
                
                if (userTrades && userTrades.length > 0) {
                    // Get unique market IDs
                    const marketIds = [...new Set(userTrades.map(t => t.market_id).filter(Boolean))];
                    
                    if (marketIds.length > 0) {
                        // Get categories from those markets
                        const { data: markets } = await supabase
                            .from('markets')
                            .select('category')
                            .in('id', marketIds);
                        
                        const categories = [...new Set(markets?.map(m => m.category).filter(Boolean) || [])];
                        
                        if (categories.length > 0) {
                            // Get events from those categories
                            const { data: recommended } = await supabase
                                .from('events')
                                .select('id, title, question, description, category, subcategory, tags, image_url, slug, status, is_featured, trading_closes_at, starts_at, ends_at, total_volume, created_at')
                                .eq('status', 'active')
                                .in('category', categories)
                                .order('total_volume', { ascending: false })
                                .limit(4);
                            
                            if (recommended) {
                                recommendedEvents = processEventData(recommended);
                            }
                        }
                    }
                }
            } catch (recErr) {
                console.error('[Events API] Recommendations error:', recErr);
            }
        }
        
        return NextResponse.json({
            events: processedData,
            nextCursor,
            hasMore: processedData.length === limit,
            recommended: recommendedEvents
        }, {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          }
        });
    } catch (err) {
        console.error('[Events API] Fatal:', err);
        return NextResponse.json({ events: [], nextCursor: null, recommended: [] });
    }
}
