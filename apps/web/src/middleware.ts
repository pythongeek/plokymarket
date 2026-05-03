import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { jwtVerify, decodeJwt } from 'jose';

// Secure admin paths
const SECURE_PATHS = {
  admin: '/sys-cmd-7x9k2',
  auth: '/auth-portal-3m5n8',
};

const ALLOWED_ADMIN_IPS: string[] = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
const AUTH_RATE_LIMIT_WINDOW=300;
const MAX_AUTH_ATTEMPTS=5;
const JWT_SECRET=process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET';

// Lazy Redis
let redis: Redis | undefined;
const getRedis = () => {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (url && token) redis = new Redis({ url, token });
  }
  return redis;
};

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
}

async function checkAuthRateLimit(ip: string) {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: MAX_AUTH_ATTEMPTS };
  const key = `ratelimit:auth:${ip}`;
  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, AUTH_RATE_LIMIT_WINDOW);
    pipeline.ttl(key);
    const results = await pipeline.exec() as number[];
    const count = results[0] || 0;
    const ttl = results[2] as number || AUTH_RATE_LIMIT_WINDOW;
    if (count > MAX_AUTH_ATTEMPTS) return { allowed: false, remaining: 0, retryAfter: ttl > 0 ? ttl : AUTH_RATE_LIMIT_WINDOW };
    return { allowed: true, remaining: Math.max(0, MAX_AUTH_ATTEMPTS - count) };
  } catch { return { allowed: true, remaining: MAX_AUTH_ATTEMPTS }; }
}

// Auth portal only needs rate limiting and security headers, NOT auth checks
function isAuthPortal(pathname: string) { return pathname.includes(SECURE_PATHS.auth); }
function isSecurePath(pathname: string) { return !isAuthPortal(pathname) && Object.values(SECURE_PATHS).some(p => pathname.includes(p)); }
function isApiAdminPath(pathname: string) { return pathname.includes('/api/admin'); }
function isAdminPath(pathname: string) { return pathname.includes('/admin'); }

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
      const authUrl = new URL(SECURE_PATHS.auth, request.url);
      authUrl.searchParams.set('redirect', pathname);
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
