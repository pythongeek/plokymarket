import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Secure admin path - NOT using /admin, /login etc
// These are randomized and hard to guess
const SECURE_PATHS = {
  admin: '/sys-cmd-7x9k2',
  auth: '/auth-portal-3m5n8',
  users: '/usr-mgmt-4p7q1',
  markets: '/mkt-ctl-8v2w4',
  analytics: '/analytics-9x3y5',
};

// IP whitelist for admin access (optional additional security)
const ALLOWED_ADMIN_IPS: string[] = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

// Rate limiting for auth attempts
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_AUTH_ATTEMPTS = 5;
const authAttempts = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check if accessing secure admin paths
  const isSecurePath = Object.values(SECURE_PATHS).some(path =>
    pathname.startsWith(path)
  );

  const isApiAdminPath = pathname.startsWith('/api/admin');

  if (isSecurePath || isApiAdminPath) {
    // IP whitelist check (if configured)
    if (ALLOWED_ADMIN_IPS.length > 0) {
      const clientIp = request.ip ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'unknown';

      if (!ALLOWED_ADMIN_IPS.includes(clientIp)) {
        console.warn(`Admin access denied from IP: ${clientIp}`);
        return new NextResponse('Access Denied', { status: 403 });
      }
    }

    // Rate limiting for auth portal
    if (pathname.startsWith(SECURE_PATHS.auth)) {
      const clientIp = request.ip || 'unknown';
      const now = Date.now();
      const attempts = authAttempts.get(clientIp);

      if (attempts) {
        if (now > attempts.resetTime) {
          authAttempts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        } else if (attempts.count >= MAX_AUTH_ATTEMPTS) {
          return new NextResponse('Too Many Requests', { status: 429 });
        } else {
          attempts.count++;
        }
      } else {
        authAttempts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
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

    // Check admin status for admin paths
    if (isSecurePath || isApiAdminPath) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin')
        .eq('id', user.id)
        .single();

      if (profileError || (!profile?.is_admin && !profile?.is_super_admin)) {
        console.warn(`Non-admin user ${user.id} attempted admin access`);

        // Log unauthorized access attempt
        await supabase.from('admin_audit_log').insert({
          action: 'unauthorized_access_attempt',
          user_id: user.id,
          resource: pathname,
          ip_address: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0],
          user_agent: request.headers.get('user-agent'),
        });

        return new NextResponse('Forbidden', { status: 403 });
      }

      // Add admin info to headers for downstream use
      response.headers.set('x-admin-id', user.id);
      response.headers.set('x-admin-level', profile.is_super_admin ? 'super' : 'admin');
    }

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    '/sys-cmd-7x9k2/:path*',
    '/auth-portal-3m5n8/:path*',
    '/usr-mgmt-4p7q1/:path*',
    '/mkt-ctl-8v2w4/:path*',
    '/analytics-9x3y5/:path*',
    '/api/admin/:path*',
  ],
};
