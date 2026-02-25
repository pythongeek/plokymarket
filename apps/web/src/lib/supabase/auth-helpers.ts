import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/portfolio', '/wallet', '/admin'];

// Admin-only routes
const ADMIN_ROUTES = ['/admin'];

// Auth routes (redirect to markets if already logged in)
const AUTH_ROUTES = ['/login', '/register'];

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, allow all requests
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value, options);
        });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing admin route, verify user is admin
  if (isAdminRoute && user) {
    try {
      // Fetch user profile to check admin status
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        // Non-admin trying to access admin route
        return NextResponse.redirect(new URL('/markets', request.url));
      }
    } catch (error) {
      // If table doesn't exist or other error, redirect non-admins away
      console.error('Admin check error:', error);
      return NextResponse.redirect(new URL('/markets', request.url));
    }
  }

  // If accessing auth routes while logged in, redirect to markets or intended page
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.searchParams.get('redirect');
    if (redirectUrl && redirectUrl.startsWith('/')) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.redirect(new URL('/markets', request.url));
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}
