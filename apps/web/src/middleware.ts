import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Secure admin path - NOT using /admin, /login etc
// These are randomized and hard to guess
const SECURE_PATHS = {
  admin: '/sys-cmd-7x9k2',
  auth: '/auth-portal-3m5n8',
};

// IP whitelist for admin access (optional additional security)
const ALLOWED_ADMIN_IPS: string[] = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

// Rate limiting for auth attempts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_AUTH_ATTEMPTS = 5;
const authAttempts = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check if this is the auth portal (login page) — it must NOT require auth
  const isAuthPortal = pathname.startsWith(SECURE_PATHS.auth);

  // Check if accessing secure admin paths (excluding auth portal)
  const isSecurePath = !isAuthPortal && Object.values(SECURE_PATHS).some(path =>
    pathname.startsWith(path)
  );

  const isApiAdminPath = pathname.startsWith('/api/admin');
  const isAdminPath = pathname.startsWith('/admin');

  // Auth portal only needs rate limiting and security headers, NOT auth checks
  if (isAuthPortal) {
    // Add extra headers for auth portal
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
  matcher: [
    '/sys-cmd-7x9k2/:path*',
    '/auth-portal-3m5n8/:path*',
    '/api/admin/:path*',
    '/admin/:path*',
  ],
};
