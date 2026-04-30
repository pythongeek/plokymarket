/**
 * Server Component for Homepage with ISR
 * Fetches initial data on the server and caches it for 60 seconds
 * This provides fast TTFB while maintaining client-side interactivity
 */
import { createPublicClient } from '@/lib/supabase/server';
import HomePageClient, { Event, TickerMarket } from './home-page-client';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// Bengali text encoding fix
const fixBengaliEncoding = (text: string | null): string | null => {
  if (!text) return text;

  try {
    if (text.includes('') || /[\ufffd]/.test(text)) {
      const bytes = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      return decoded;
    }
    return text;
  } catch {
    return text;
  }
};

export default async function HomePageServer() {
  try {
    const supabase = createPublicClient();

    // Fetch trending events for ticker (with price data)
    const { data: tickerData } = await supabase
      .from('events')
      .select(`
        id, title, question, total_volume, current_yes_price, current_no_price, price_24h_change
      `)
      .eq('status', 'active')
      .order('total_volume', { ascending: false })
      .limit(10);

    const tickerMarkets: TickerMarket[] = (tickerData || []).map(event => ({
      id: event.id,
      title: fixBengaliEncoding(event.title) || event.question,
      question: fixBengaliEncoding(event.question) || '',
      yes_price: event.current_yes_price || 0.5,
      no_price: event.current_no_price || 0.5,
      change_24h: event.price_24h_change || 0,
      volume: event.total_volume || 0
    }));

    // Fetch initial markets (public data, no auth required)
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, title, question, description, category, subcategory, tags, 
        image_url, slug, status, is_featured, trading_closes_at, 
        starts_at, ends_at, total_volume, created_at
      `)
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('total_volume', { ascending: false })
      .limit(12);

    if (error) {
      console.error('[HomePage Server] Error fetching events:', error);
    }

    // Process data to fix encoding and filter out events with null required fields
    const processedEvents: Event[] = (events || [])
      .filter(event => event.title && event.question && event.status && event.total_volume !== null && event.created_at)
      .map(event => ({
        id: event.id,
        title: fixBengaliEncoding(event.title)!,
        question: fixBengaliEncoding(event.question)!,
        description: fixBengaliEncoding(event.description) || undefined,
        category: event.category,
        subcategory: event.subcategory || undefined,
        tags: (event.tags as string[]) || [],
        image_url: event.image_url || undefined,
        slug: fixBengaliEncoding(event.slug) || undefined,
        status: event.status,
        is_featured: event.is_featured || false,
        trading_closes_at: event.trading_closes_at || undefined,
        starts_at: event.starts_at || undefined,
        ends_at: event.ends_at || undefined,
        total_volume: event.total_volume || 0,
        created_at: event.created_at!,
      }));

    // Fetch recommended events (public data based on popularity)
    const { data: recommended } = await supabase
      .from('events')
      .select(`
        id, title, question, description, category, subcategory, tags, 
        image_url, slug, status, is_featured, trading_closes_at, 
        starts_at, ends_at, total_volume, created_at
      `)
      .eq('status', 'active')
      .order('total_volume', { ascending: false })
      .limit(4);

    const processedRecommended: Event[] = (recommended || [])
      .filter(event => event.title && event.question && event.status && event.total_volume !== null && event.created_at)
      .map(event => ({
        id: event.id,
        title: fixBengaliEncoding(event.title)!,
        question: fixBengaliEncoding(event.question)!,
        description: fixBengaliEncoding(event.description) || undefined,
        category: event.category,
        subcategory: event.subcategory || undefined,
        tags: (event.tags as string[]) || [],
        image_url: event.image_url || undefined,
        slug: fixBengaliEncoding(event.slug) || undefined,
        status: event.status,
        is_featured: event.is_featured || false,
        trading_closes_at: event.trading_closes_at || undefined,
        starts_at: event.starts_at || undefined,
        ends_at: event.ends_at || undefined,
        total_volume: event.total_volume || 0,
        created_at: event.created_at!,
      }));

    return (
      <HomePageClient
        initialEvents={processedEvents}
        initialRecommended={processedRecommended}
        initialTickerMarkets={tickerMarkets}
      />
    );
  } catch (err) {
    console.error('[HomePage Server] Fatal error:', err);
    // Return empty data on error - client will handle refresh
    return (
      <HomePageClient
        initialEvents={[]}
        initialRecommended={[]}
        initialTickerMarkets={[]}
      />
    );
  }
}
