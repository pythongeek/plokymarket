import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Create a Supabase client for use in Server Components and Server Actions
 * This client handles cookies properly for SSR environments
 */
export async function createClient() {
  const cookieStore = await cookies();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    throw new Error('Supabase credentials not configured');
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting in Server Components
            // This can happen when the cookie is being set during SSR
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie removal in Server Components
          }
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}

/**
 * Create a service role client for admin operations
 * Only use this in server-side code and never expose to client
 */
export async function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Service role key not configured');
    throw new Error('Service role credentials not configured');
  }

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
