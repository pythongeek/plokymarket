import { createClient } from '@/lib/supabase/server';
import { MarketsClient } from './MarketsClient';

export const dynamic = 'force-dynamic';

export default async function MarketsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    // We fetch initial highly requested events or all active
    // The requirement snippet showed `.eq('is_verified', true).order('volume', { ascending: false }).limit(50);`
    .eq('status', 'active')
    .order('total_volume', { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch initial events for SSR:', error);
  }

  return <MarketsClient initialEvents={events || []} />;
}
