/**
 * useRealtimePrice Hook
 * Subscribe to real-time price updates for an event
 */

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';

export function useRealtimePrice(eventId: string, side: 'yes' | 'no' = 'yes') {
  const [price, setPrice] = useState<number>(0.5);
  const supabase = getBrowserClient();

  useEffect(() => {
    // Fetch initial price
    const fetchPrice = async () => {
      const { data } = await supabase
        .from('events')
        .select(side === 'yes' ? 'current_yes_price' : 'current_no_price')
        .eq('id', eventId)
        .single();

      if (data) {
        setPrice(Number(data[side === 'yes' ? 'current_yes_price' : 'current_no_price']));
      }
    };

    fetchPrice();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`price-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          const newPrice = Number(
            payload.new[side === 'yes' ? 'current_yes_price' : 'current_no_price']
          );
          setPrice(newPrice);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [eventId, side, supabase]);

  return price;
}
