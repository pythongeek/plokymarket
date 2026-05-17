import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Secure admin paths
const SECURE_PATHS = {
  admin: '/sys-cmd-7x9k2',
  auth: '/auth-portal-3m5n8',
};

const ALLOWED_ADMIN_IPS: string[] = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
const AUTH_RATE_LIMIT_WINDOW = Number(process.env.AUTH_RATE_LIMIT_WINDOW) || 300; // 5 min
const MAX_AUTH_ATTEMPTS = Number(process.env.MAX_AUTH_ATTEMPTS) || 5;

// MUST match login/route.ts and session/route.ts exactly
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
}

// Simple in-memory auth rate limiter for Edge Runtime (best-effort, resets on cold start)
const authLimitStore = new Map<string, { count: number; resetAt: number }>();
async function checkAuthRateLimit(ip: string) {
  const now = Date.now();
  const entry = authLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    authLimitStore.set(ip, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW * 1000 });
    return { allowed: true, remaining: MAX_AUTH_ATTEMPTS - 1 };
  }
  entry.count++;
  if (entry.count > MAX_AUTH_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }
  return { allowed: true, remaining: Math.max(0, MAX_AUTH_ATTEMPTS - entry.count) };
}

// Auth portal only needs rate limiting and security headers, NOT auth checks
function isAuthPortal(pathname: string) { return pathname.includes(SECURE_PATHS.auth); }
function isSecurePath(pathname: string) { return !isAuthPortal(pathname) && Object.values(SECURE_PATHS).some(p => pathname.includes(p)); }
function isApiAdminPath(pathname: string) { return pathname.includes('/api/admin'); }
function isAdminPath(pathname: string) { return pathname === '/admin' || pathname.startsWith('/admin/'); }

const intlMiddleware = createMiddleware({
  locales: ['bn', 'en', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'never',
});

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Encode JWT secret for jose
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  if (intlResponse.status !== 200) return intlResponse;

  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Auth portal - rate limit only
  if (isAuthPortal(pathname)) {
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkAuthRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      const blockedResponse = new NextResponse(
        JSON.stringify({ error: 'Too many authentication attempts.', code: 'AUTH_RATE_LIMITED', retryAfter: rateLimitResult.retryAfter }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter || AUTH_RATE_LIMIT_WINDOW), 'X-RateLimit-Limit': String(MAX_AUTH_ATTEMPTS), 'X-RateLimit-Remaining': '0' } }
      );
      Object.entries(securityHeaders).forEach(([k, v]) => blockedResponse.headers.set(k, v));
      return blockedResponse;
    }
    response.headers.set('X-RateLimit-Limit', String(MAX_AUTH_ATTEMPTS));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // Admin / API admin paths - require auth
  if (isSecurePath(pathname) || isApiAdminPath(pathname) || isAdminPath(pathname)) {
    // IP whitelist check
    if (ALLOWED_ADMIN_IPS.length > 0) {
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      if (!ALLOWED_ADMIN_IPS.includes(clientIp)) {
        return new NextResponse('Access Denied', { status: 403 });
      }
    }

    // Validate JWT from cookie using jose (Edge Runtime compatible)
    const token = request.cookies.get('sb-access-token')?.value;
    if (!token) {
      if (isApiAdminPath(pathname)) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized', code: 'NO_TOKEN' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const authUrl = new URL(SECURE_PATHS.auth, request.url);
      authUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(authUrl);
    }

    let decoded: any;
    try {
      // jose works in Edge Runtime - no Node.js crypto needed
      const { payload } = await jwtVerify(token, secretKey);
      decoded = payload;
    } catch (jwtErr) {
      console.warn('JWT validation failed:', (jwtErr as Error).message);
      if (isApiAdminPath(pathname)) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized', code: 'INVALID_TOKEN' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const authUrl = new URL(SECURE_PATHS.auth, request.url);
      authUrl.searchParams.set('redirect', pathname);
      authUrl.searchParams.set('error', 'invalid_token');
      return NextResponse.redirect(authUrl);
    }

    const userId = decoded.sub as string;
    const isAdmin = decoded.is_admin as boolean;
    const isSuperAdmin = decoded.is_super_admin as boolean;

    if (!isAdmin && !isSuperAdmin) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Pass admin metadata via headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-id', userId);
    requestHeaders.set('x-admin-email', (decoded.email as string) || '');
    requestHeaders.set('x-admin-level', isSuperAdmin ? 'super' : 'admin');
    requestHeaders.set('x-user-id', userId);

    const responseWithHeaders = NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.getAll().forEach(cookie => responseWithHeaders.cookies.set(cookie));
    Object.entries(securityHeaders).forEach(([k, v]) => responseWithHeaders.headers.set(k, v));
    responseWithHeaders.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return responseWithHeaders;
  }

  return response;
}

export const config = {
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
};
