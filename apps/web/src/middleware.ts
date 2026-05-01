import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from '@/i18n/routing';
import { Redis } from '@upstash/redis';

// Secure admin path - NOT using /admin, /login etc
// These are randomized and hard to guess
const SECURE_PATHS = {
  admin: '/sys-cmd-7x9k2',
  auth: '/auth-portal-3m5n8',
};

// IP whitelist for admin access (optional additional security)
const ALLOWED_ADMIN_IPS: string[] = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

// Rate limiting configuration for auth attempts (using Redis)
const AUTH_RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds
const MAX_AUTH_ATTEMPTS = 5;

// Lazy Redis initialization
let redis: Redis | undefined;
const getRedis = (): Redis | undefined => {
    if (!redis) {
        const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
        if (url && token) {
            redis = new Redis({ url, token });
        }
    }
    return redis;
};

// Get client IP from request
function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded ? forwarded.split(',')[0].trim() : 
           request.headers.get('x-real-ip') || 
           'unknown';
}

// Check and record auth rate limit using Redis
async function checkAuthRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
    const redis = getRedis();
    if (!redis) {
        // Fail-open if Redis unavailable
        return { allowed: true, remaining: MAX_AUTH_ATTEMPTS };
    }

    const key = `ratelimit:auth:${ip}`;
    
    try {
        const pipeline = redis.pipeline();
        pipeline.incr(key);
        pipeline.expire(key, AUTH_RATE_LIMIT_WINDOW);
        pipeline.ttl(key);
        
        const results = await pipeline.exec();
        const count = (results[0] as number) || 0;
        const ttl = (results[2] as number) || AUTH_RATE_LIMIT_WINDOW;

        if (count > MAX_AUTH_ATTEMPTS) {
            return { 
                allowed: false, 
                remaining: 0, 
                retryAfter: ttl > 0 ? ttl : AUTH_RATE_LIMIT_WINDOW 
            };
        }

        return { 
            allowed: true, 
            remaining: Math.max(0, MAX_AUTH_ATTEMPTS - count) 
        };
    } catch (error) {
        console.error('[Auth RateLimit] Redis error:', error);
        return { allowed: true, remaining: MAX_AUTH_ATTEMPTS };
    }
}

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run next-intl middleware first for i18n routing
  const intlResponse = intlMiddleware(request);

  // If next-intl redirected (e.g., from / to /bn), return that response
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // Mandatory Security Headers for Financial Platforms
  const securityHeaders = {
    'X-Frame-Options': 'DENY', // Prevent Clickjacking
    'X-Content-Type-Options': 'nosniff', // Prevent MIME sniffing
    'X-XSS-Protection': '1; mode=block', // Enable XSS filtering
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', // Disable unused features
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // Enforce HTTPS
  };

  // Inject headers without overriding existing ones
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if this is the auth portal (login page) — it must NOT require auth
  const isAuthPortal = pathname.includes(SECURE_PATHS.auth);

  // Check if accessing secure admin paths (excluding auth portal)
  const isSecurePath = !isAuthPortal && Object.values(SECURE_PATHS).some(path =>
    pathname.includes(path)
  );

  const isApiAdminPath = pathname.includes('/api/admin');
  const isAdminPath = pathname.includes('/admin');

  // Auth portal only needs rate limiting and security headers, NOT auth checks
  if (isAuthPortal) {
    // Apply Redis-based auth rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkAuthRateLimit(clientIp);
    
    if (!rateLimitResult.allowed) {
      console.warn(`[Auth RateLimit] Too many auth attempts from IP: ${clientIp}`);
      const blockedResponse = new NextResponse(
        JSON.stringify({ 
          error: 'Too many authentication attempts. Please try again later.',
          code: 'AUTH_RATE_LIMITED',
          retryAfter: rateLimitResult.retryAfter
        }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || AUTH_RATE_LIMIT_WINDOW),
            'X-RateLimit-Limit': String(MAX_AUTH_ATTEMPTS),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
      Object.entries(securityHeaders).forEach(([key, value]) => {
        blockedResponse.headers.set(key, value);
      });
      return blockedResponse;
    }
    
    // Add rate limit headers to successful auth portal responses
    response.headers.set('X-RateLimit-Limit', String(MAX_AUTH_ATTEMPTS));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  if (isSecurePath || isApiAdminPath || isAdminPath) {
    // IP whitelist check (if configured)
    if (ALLOWED_ADMIN_IPS.length > 0) {
      const clientIp =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'unknown';

      if (!ALLOWED_ADMIN_IPS.includes(clientIp)) {
        console.warn(`Admin access denied from IP: ${clientIp}`);
        return new NextResponse('Access Denied', { status: 403 });
      }
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn(`Auth error in middleware for ${pathname}:`, authError?.message);

      // If there's an explicit auth error, clear the session cookies to prevent loops
      if (authError) {
        // We can't easily sign out from middleware, but we can ensure the response clears cookies
        // Supabase middleware helper handles this via setAll if we use the right response
      }

      // Redirect to secure auth portal with return URL
      const authUrl = new URL(SECURE_PATHS.auth, request.url);
      authUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(authUrl);
    }

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_admin, is_super_admin, email')
      .eq('id', user.id)
      .single();

    if (profileError || (!profile?.is_admin && !profile?.is_super_admin)) {
      console.warn(`Non-admin user ${user.id} attempted admin access`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Pass metadata to request headers so Server Components can read them
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-id', user.id);
    requestHeaders.set('x-admin-email', profile.email || user.email || '');
    requestHeaders.set('x-admin-level', profile.is_super_admin ? 'super' : 'admin');

    // Create a new response with the modified headers for the downstream request
    const responseWithHeaders = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Copy cookies from original response
    response.cookies.getAll().forEach(cookie => {
      responseWithHeaders.cookies.set(cookie);
    });

    // Also add security headers to the actual output response
    Object.entries(securityHeaders).forEach(([key, value]) => {
      responseWithHeaders.headers.set(key, value);
    });
    responseWithHeaders.headers.set('X-Robots-Tag', 'noindex, nofollow');

    return responseWithHeaders;
  }

  return response;
}

export const config = {
  // Match all paths except API routes, static files, etc.
  // Language prefix removed - site now uses root path only with Bangla as default
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
};
