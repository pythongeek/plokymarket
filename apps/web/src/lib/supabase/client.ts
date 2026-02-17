import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Create a Supabase client for use in browser environments
 * This client is used for client-side data fetching and real-time subscriptions
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a mock client
    if (typeof window === 'undefined') {
      return null as any;
    }
    console.error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error('Supabase credentials not configured');
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

/**
 * Singleton instance for use in non-React contexts
 */
let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
