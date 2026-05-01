/**
 * API Route Protection Middleware
 * Provides reusable rate limiting and abuse protection for Next.js API routes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
    checkRateLimit,
    checkApiRateLimit,
    checkTradingRateLimit,
    checkWithdrawalRateLimit,
    addRateLimitHeaders,
    abuseDetector,
    RateLimitTier,
} from '@/lib/upstash/rateLimit';

/**
 * Extract user ID from request if authenticated
 */
async function getUserIdFromRequest(request: Request): Promise<string | undefined> {
    try {
        // Import here to avoid circular dependencies
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id;
    } catch {
        return undefined;
    }
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown';
    return ip;
}

/**
 * Create a protected API route handler with rate limiting
 */
export function createProtectedRoute<T>(
    options: {
        tier?: RateLimitTier;
        requireAuth?: boolean;
        endpoint?: string;
    } = {}
) {
    const {
        tier = RateLimitTier.STANDARD,
        requireAuth = false,
        endpoint = 'api',
    } = options;

    return async function protectedHandler(
        request: NextRequest,
        handler: (request: NextRequest, userId?: string) => Promise<NextResponse>
    ): Promise<NextResponse> {
        const ip = getClientIp(request);

        // Check if IP is blocked
        if (await abuseDetector.isBlocked(ip)) {
            return NextResponse.json(
                {
                    error: 'Access denied. Please try again later.',
                    code: 'IP_BLOCKED',
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': '3600',
                        'X-Block-Reason': 'abuse_detection',
                    },
                }
            );
        }

        // Get user ID if available
        const userId = await getUserIdFromRequest(request);

        // Require authentication if specified
        if (requireAuth && !userId) {
            return NextResponse.json(
                { error: 'Authentication required', code: 'UNAUTHORIZED' },
                { status: 401 }
            );
        }

        // Check rate limit
        const rateLimitResult = await checkApiRateLimit(
            request,
            endpoint,
            userId,
            tier
        );

        if (!rateLimitResult.allowed) {
            await abuseDetector.recordFailedAttempt(ip, endpoint);
            
            const response = NextResponse.json(
                {
                    error: 'Too many requests. Please try again later.',
                    code: 'RATE_LIMITED',
                    retryAfter: rateLimitResult.retryAfter,
                },
                { status: 429 }
            );
            
            return addRateLimitHeaders(response, rateLimitResult);
        }

        try {
            const response = await handler(request, userId);
            await abuseDetector.recordSuccess(ip);
            return addRateLimitHeaders(response, rateLimitResult);
        } catch (error) {
            throw error;
        }
    };
}

/**
 * Specific protectors for different route types
 */

// Trading routes (orders, trades)
export async function withTradingProtection(
    request: NextRequest,
    userId: string,
    marketId: string,
    handler: () => Promise<Response>
): Promise<Response> {
    const tradingResult = await checkTradingRateLimit(userId, marketId);

    if (!tradingResult.allowed) {
        return addRateLimitHeaders(
            NextResponse.json(
                {
                    error: 'Trading rate limit exceeded. Please slow down.',
                    code: 'TRADING_RATE_LIMITED',
                    retryAfter: tradingResult.retryAfter,
                },
                { status: 429 }
            ),
            tradingResult
        );
    }

    const response = await handler();
    return addRateLimitHeaders(response, tradingResult);
}

// Withdrawal routes (most critical)
export async function withWithdrawalProtection(
    request: NextRequest,
    userId: string,
    handler: () => Promise<Response>
): Promise<Response> {
    const withdrawalResult = await checkWithdrawalRateLimit(userId);

    if (!withdrawalResult.allowed) {
        return addRateLimitHeaders(
            NextResponse.json(
                {
                    error: 'Withdrawal rate limit exceeded. Maximum 3 withdrawals per hour.',
                    code: 'WITHDRAWAL_RATE_LIMITED',
                    retryAfter: withdrawalResult.retryAfter,
                },
                { status: 429 }
            ),
            withdrawalResult
        );
    }

    const response = await handler();
    return addRateLimitHeaders(response, withdrawalResult);
}

// Admin API routes (stricter)
export async function withAdminProtection(
    request: NextRequest,
    handler: (userId: string) => Promise<Response>
): Promise<Response> {
    const ip = getClientIp(request);

    // Check if IP is blocked
    if (await abuseDetector.isBlocked(ip)) {
        return NextResponse.json(
            { error: 'Access denied', code: 'IP_BLOCKED' },
            { status: 429 }
        );
    }

    // Get user ID
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
        return NextResponse.json(
            { error: 'Authentication required', code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    // Use STRICT tier for admin operations
    const rateLimitResult = await checkRateLimit(
        request,
        RateLimitTier.STRICT,
        userId,
        'admin'
    );

    if (!rateLimitResult.allowed) {
        await abuseDetector.recordFailedAttempt(ip, 'admin');
        return addRateLimitHeaders(
            NextResponse.json(
                {
                    error: 'Admin rate limit exceeded.',
                    code: 'RATE_LIMITED',
                },
                { status: 429 }
            ),
            rateLimitResult
        );
    }

    const response = await handler(userId);
    return addRateLimitHeaders(response, rateLimitResult);
}

// Public API routes (lenient, but tracked)
export async function withPublicApiProtection(
    request: NextRequest,
    endpoint: string,
    handler: () => Promise<Response>
): Promise<Response> {
    const ip = getClientIp(request);

    if (await abuseDetector.isBlocked(ip)) {
        return NextResponse.json(
            { error: 'Access denied', code: 'IP_BLOCKED' },
            { status: 429 }
        );
    }

    const rateLimitResult = await checkApiRateLimit(
        request,
        endpoint,
        undefined,
        RateLimitTier.LENIENT
    );

    if (!rateLimitResult.allowed) {
        await abuseDetector.recordFailedAttempt(ip, endpoint);
        return addRateLimitHeaders(
            NextResponse.json(
                {
                    error: 'Too many requests.',
                    code: 'RATE_LIMITED',
                },
                { status: 429 }
            ),
            rateLimitResult
        );
    }

    const response = await handler();
    return addRateLimitHeaders(response, rateLimitResult);
}
