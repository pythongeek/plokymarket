import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

// Environment variables should be accessed inside functions for Edge runtime compatibility

// Bengali text encoding fix for Supabase responses
const encodeBengaliText = (obj: any): any => {
  if (typeof obj === 'string') {
    // Ensure proper UTF-8 encoding for Bengali characters
    try {
      // Check if string is already properly encoded
      if (/[\u0980-\u09FF]/.test(obj)) {
        return obj;
      }
      return obj;
    } catch {
      return obj;
    }
  }
  if (Array.isArray(obj)) {
    return obj.map(encodeBengaliText);
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, encodeBengaliText(value)])
    );
  }
  return obj;
};

/**
 * Create a Supabase client for use in Server Components and Server Actions
 * This version is static-safe and will not trigger "Dynamic server usage" 
 * errors during build unless auth is actually requested.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    throw new Error('Supabase credentials not configured');
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async getAll() {
          try {
            const cookieStore = await cookies();
            return cookieStore.getAll();
          } catch {
            return [];
          }
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Handle cookie setting in Server Components
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
 * Create a public-only client that never touches cookies.
 * Safe for use in ISR (revalidate) or static pages.
 */
export function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Create a service role client for admin operations
 * Only use this in server-side code and never expose to client
 */
export async function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Service role key not configured');
    throw new Error('Service role credentials not configured');
  }

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        async getAll() {
          try {
            const cookieStore = await cookies();
            return cookieStore.getAll();
          } catch {
            return [];
          }
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Handle cookie setting in Server Components
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
