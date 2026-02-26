import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Handle cookie setting in Server Components
            // This can happen when the cookie is being set during SSR
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
  const cookieStore = await cookies();
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Service role key not configured');
    throw new Error('Service role credentials not configured');
  }

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Handle cookie setting in Server Components
            // This can happen when the cookie is being set during SSR
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
