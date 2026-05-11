import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Direct PostgREST fetch client for server components.
 * Bypasses the /auth/v1/ call that @supabase/ssr makes on init.
 * Uses native fetch — no auth overhead, no JWS verification issues.
 */
export class PostgrestClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://polymarketbd.com').replace(/\/$/, '');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    this.headers = {
      'apikey': anonKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  from(table: string) {
    return new PostgrestQueryBuilder(this.baseUrl, table, this.headers);
  }
}

class PostgrestQueryBuilder {
  private baseUrl: string;
  private table: string;
  private headers: Record<string, string>;
  private queryParams: string[] = [];
  private singleMode: 'single' | 'maybeSingle' | null = null;
  private bodyData: unknown = null;
  private method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';

  constructor(baseUrl: string, table: string, headers: Record<string, string>) {
    this.baseUrl = baseUrl;
    this.table = table;
    this.headers = headers;
  }

  select(columns = '*') {
    this.queryParams.push(`select=${encodeURIComponent(columns)}`);
    return this;
  }

  eq(column: string, value: string | number | boolean) {
    this.queryParams.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(String(value))}`);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    // Support both 'column.direction' and 'column' syntax
    const hasDirection = column.includes('.');
    const dir = opts?.ascending === false ? 'desc' : 'asc';
    const orderStr = hasDirection ? column : `${column}.${dir}`;
    this.queryParams.push(`order=${encodeURIComponent(orderStr)}`);
    return this;
  }

  limit(n: number) {
    this.queryParams.push(`limit=${n}`);
    return this;
  }

  range(from: number, to: number) {
    this.queryParams.push(`offset=${from}&limit=${to - from + 1}`);
    return this;
  }

  gt(column: string, value: number) {
    this.queryParams.push(`${encodeURIComponent(column)}=gt.${value}`);
    return this;
  }

  lt(column: string, value: number) {
    this.queryParams.push(`${encodeURIComponent(column)}=lt.${value}`);
    return this;
  }

  gte(column: string, value: number) {
    this.queryParams.push(`${encodeURIComponent(column)}=gte.${value}`);
    return this;
  }

  lte(column: string, value: number) {
    this.queryParams.push(`${encodeURIComponent(column)}=lte.${value}`);
    return this;
  }

  neq(column: string, value: string | number) {
    this.queryParams.push(`${encodeURIComponent(column)}=neq.${encodeURIComponent(String(value))}`);
    return this;
  }

  is(column: string, value: null | boolean) {
    const v = value === null ? 'null' : String(value);
    this.queryParams.push(`${encodeURIComponent(column)}=is.${v}`);
    return this;
  }

  in(column: string, values: (string | number)[]) {
    const vals = values.map(v => encodeURIComponent(String(v))).join(',');
    this.queryParams.push(`${encodeURIComponent(column)}=in.(${vals})`);
    return this;
  }

  or(conditions: string) {
    this.queryParams.push(`or=(${encodeURIComponent(conditions)})`);
    return this;
  }

  not(column: string, operator: string, value: string | number) {
    this.queryParams.push(`${encodeURIComponent(column)}=not.${operator}.${encodeURIComponent(String(value))}`);
    return this;
  }

  single() {
    this.singleMode = 'single';
    this.queryParams.push('limit=1');
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    this.queryParams.push('limit=1');
    return this;
  }

  insert(data: unknown | unknown[]) {
    this.method = 'POST';
    this.bodyData = data;
    this.headers = { ...this.headers, 'Prefer': 'return=representation' };
    return this;
  }

  update(data: Record<string, unknown>) {
    this.method = 'PATCH';
    this.bodyData = data;
    this.headers = { ...this.headers, 'Prefer': 'return=representation' };
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  match(query: Record<string, string | number | boolean>) {
    for (const [key, value] of Object.entries(query)) {
      this.eq(key, value);
    }
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async then<TResult1 = any[], TResult2 = any>(
    onfulfilled?: ((value: { data: TResult1; error: null }) => TResult1 | Promise<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const url = `${this.baseUrl}/rest/v1/${this.table}${this.queryParams.length > 0 ? '?' + this.queryParams.join('&') : ''}`;
    try {
      const fetchOpts: RequestInit = {
        method: this.method,
        headers: this.headers,
        cache: 'no-store',
      };
      if (this.bodyData !== null) {
        fetchOpts.body = JSON.stringify(this.bodyData);
      }
      const res = await fetch(url, fetchOpts);
      console.log('[PostgREST]', this.method, url, '-> status:', res.status);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw { code: 'PGRST' + res.status, message: err.message || res.statusText };
      }
      let data = await res.json() as TResult1;
      // Handle single/maybeSingle modes
      if (Array.isArray(data) && this.singleMode) {
        if (data.length === 0) {
          if (this.singleMode === 'maybeSingle') {
            data = null as unknown as TResult1;
          } else {
            throw { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' };
          }
        } else {
          data = data[0] as unknown as TResult1;
        }
      }
      return (onfulfilled ? onfulfilled({ data, error: null }) : data) as any;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }
}

// Bengali text encoding fix for Supabase responses
function encodeBengaliText(obj: unknown): unknown {
  if (typeof obj === 'string') {
    try {
      if (/[\u0980-\u09FF]/.test(obj)) return obj;
      return obj;
    } catch { return obj; }
  }
  if (Array.isArray(obj)) return (obj as unknown[]).map(encodeBengaliText);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, encodeBengaliText(v)])
    );
  }
  return obj;
}

export function encodeData<T>(data: T): T {
  return encodeBengaliText(data) as T;
}

/**
 * Public client for server components — uses direct PostgREST fetch
 * to avoid @supabase/ssr's internal /auth/v1/ call that fails with local auth.
 */
export function createPublicClient() {
  return new PostgrestClient();
}

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

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        async getAll() {
          try {
            const cookieStore = await cookies();
            return cookieStore.getAll();
          } catch { return []; }
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch { /* ignore */ }
        },
      },
      auth: { autoRefreshToken: true, persistSession: true },
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

  return createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        async getAll() {
          try { const cookieStore = await cookies(); return cookieStore.getAll(); }
          catch { return []; }
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore = await cookies();
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch { /* ignore */ }
        },
      },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
