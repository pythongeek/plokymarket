/**
 * Server-Side API Rate Limiting and Abuse Protection
 * Uses Upstash Redis for distributed rate limiting across instances
 * 
 * Features:
 * - Sliding window rate limiting
 * - Multiple rate limit tiers (strict, standard, lenient)
 * - IP-based and user-based rate limiting
 * - Abuse detection with automatic blocking
 * - Detailed rate limit headers
 */

import { Redis } from '@upstash/redis';

// Lazy initialization of Redis to avoid env var warnings at build time
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

// Rate limit tiers configuration
export enum RateLimitTier {
    STRICT = 'strict',     // 5 requests / 60 seconds (login, auth, sensitive ops)
    STANDARD = 'standard', // 30 requests / 60 seconds (general API)
    LENIENT = 'lenient',   // 100 requests / 60 seconds (read-heavy endpoints)
    CRITICAL = 'critical', // 3 requests / 60 seconds (withdrawal, high-risk)
}

interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
    keyPrefix: string;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
    [RateLimitTier.STRICT]: { maxRequests: 5, windowSeconds: 60, keyPrefix: 'rl:strict' },
    [RateLimitTier.STANDARD]: { maxRequests: 30, windowSeconds: 60, keyPrefix: 'rl:std' },
    [RateLimitTier.LENIENT]: { maxRequests: 100, windowSeconds: 60, keyPrefix: 'rl:lenient' },
    [RateLimitTier.CRITICAL]: { maxRequests: 3, windowSeconds: 60, keyPrefix: 'rl:critical' },
};

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: number;
    retryAfter?: number;
}

/**
 * Get client identifier from request (IP or user ID)
 */
function getClientIdentifier(request: Request, userId?: string): string {
    // Prefer user ID if authenticated
    if (userId) {
        return `user:${userId}`;
    }
    
    // Fall back to IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown';
    return `ip:${ip}`;
}

/**
 * Sliding window rate limiter using Redis sorted sets
 * More accurate than simple counter approach
 */
export async function checkRateLimit(
    request: Request,
    tier: RateLimitTier,
    userId?: string,
    customKey?: string
): Promise<RateLimitResult> {
    const redis = getRedis();
    if (!redis) {
        // If Redis unavailable, allow request (fail-open for availability)
        console.warn('[RateLimit] Redis unavailable, allowing request');
        return {
            allowed: true,
            remaining: 999,
            limit: 999,
            resetAt: Date.now() + 60000,
        };
    }

    const config = RATE_LIMIT_CONFIGS[tier];
    const clientId = getClientIdentifier(request, userId);
    const key = customKey 
        ? `${config.keyPrefix}:${customKey}:${clientId}`
        : `${config.keyPrefix}:${clientId}`;
    const now = Date.now();
    const windowStart = now - (config.windowSeconds * 1000);

    try {
        // Use Redis pipeline for atomic operations
        const pipeline = redis.pipeline();
        
        // Remove old entries outside the window
        pipeline.zremrangebyscore(key, 0, windowStart);
        
        // Count current requests in window
        pipeline.zcard(key);
        
        // Add current request with timestamp as score
        pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
        
        // Set expiration on the key
        pipeline.expire(key, config.windowSeconds + 1);
        
        const results = await pipeline.exec();
        const currentCount = (results[1] as number) || 0;

        const limit = config.maxRequests;
        const remaining = Math.max(0, limit - currentCount - 1);
        const resetAt = now + (config.windowSeconds * 1000);

        if (currentCount >= limit) {
            // Get oldest entry to calculate retry-after
            const oldest = await redis.zrange(key, 0, 0, { withScores: true });
            const oldestTime = oldest && oldest.length >= 2 ? Number(oldest[1]) : now;
            const retryAfter = Math.ceil((oldestTime + (config.windowSeconds * 1000) - now) / 1000);

            return {
                allowed: false,
                remaining: 0,
                limit,
                resetAt,
                retryAfter: Math.max(1, retryAfter),
            };
        }

        return {
            allowed: true,
            remaining,
            limit,
            resetAt,
        };
    } catch (error) {
        console.error('[RateLimit] Redis error:', error);
        // Fail-open for availability
        return {
            allowed: true,
            remaining: 999,
            limit: 999,
            resetAt: Date.now() + 60000,
        };
    }
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
    response: Response,
    result: RateLimitResult
): Response {
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());
    
    if (!result.allowed && result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString());
    }
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * IP-based abuse detection and auto-blocking
 * Tracks suspicious patterns across all requests from an IP
 */
export const abuseDetector = {
    // Track failed attempts for abuse scoring
    async recordFailedAttempt(ip: string, type: string): Promise<void> {
        const redis = getRedis();
        if (!redis) return;

        try {
            const key = `abuse:failed:${ip}`;
            const abuseKey = `abuse:score:${ip}`;
            
            // Increment failed attempts
            await redis.incr(key);
            await redis.expire(key, 3600); // 1 hour window
            
            // Increment abuse score
            const score = await redis.incr(abuseKey);
            await redis.expire(abuseKey, 86400); // 24 hour decay
            
            // Auto-block if score exceeds threshold
            if (score > 50) {
                await redis.set(`abuse:blocked:${ip}`, '1', { ex: 3600 }); // 1 hour block
                console.warn(`[Abuse Detection] IP ${ip} auto-blocked for type: ${type}`);
            }
        } catch (error) {
            console.error('[Abuse Detector] Error recording failed attempt:', error);
        }
    },

    // Check if IP is blocked
    async isBlocked(ip: string): Promise<boolean> {
        const redis = getRedis();
        if (!redis) return false;

        try {
            const blocked = await redis.get(`abuse:blocked:${ip}`);
            return blocked === '1';
        } catch (error) {
            console.error('[Abuse Detector] Error checking block status:', error);
            return false;
        }
    },

    // Record successful request (to gradually reduce score)
    async recordSuccess(ip: string): Promise<void> {
        const redis = getRedis();
        if (!redis) return;

        try {
            const abuseKey = `abuse:score:${ip}`;
            const currentScore = await redis.get<number>(abuseKey);
            
            // Decay the score slightly on success
            if (currentScore && currentScore > 1) {
                await redis.decr(abuseKey);
            }
        } catch (error) {
            console.error('[Abuse Detector] Error recording success:', error);
        }
    },

    // Clear abuse data for an IP (for admin use)
    async clearAbuseData(ip: string): Promise<void> {
        const redis = getRedis();
        if (!redis) return;

        try {
            await redis.del(`abuse:failed:${ip}`);
            await redis.del(`abuse:score:${ip}`);
            await redis.del(`abuse:blocked:${ip}`);
        } catch (error) {
            console.error('[Abuse Detector] Error clearing abuse data:', error);
        }
    },
};

/**
 * Per-endpoint rate limiting with different limits for anonymous vs authenticated
 */
export async function checkApiRateLimit(
    request: Request,
    endpoint: string,
    userId?: string,
    tier: RateLimitTier = RateLimitTier.STANDARD
): Promise<RateLimitResult> {
    // For anonymous users, use stricter limits on certain endpoints
    if (!userId) {
        const anonymousTier = endpoint.includes('order') || endpoint.includes('trade')
            ? RateLimitTier.STRICT
            : tier;
        return checkRateLimit(request, anonymousTier, undefined, endpoint);
    }
    
    return checkRateLimit(request, tier, userId, endpoint);
}

/**
 * High-frequency trading protection
 * Extra strict rate limiting for order placement
 */
export async function checkTradingRateLimit(
    userId: string,
    marketId: string
): Promise<RateLimitResult> {
    const redis = getRedis();
    if (!redis) {
        return { allowed: true, remaining: 999, limit: 999, resetAt: Date.now() + 60000 };
    }

    const key = `rl:trading:${userId}:${marketId}`;
    const now = Date.now();
    const windowSeconds = 10; // 10 second window for trading

    try {
        // Get current count
        const count = await redis.zcount(key, now - (windowSeconds * 1000), now);
        
        // Clean old entries
        await redis.zremrangebyscore(key, 0, now - (windowSeconds * 1000));
        
        const maxTrades = 5; // Max 5 trades per market per 10 seconds
        const remaining = Math.max(0, maxTrades - count);
        
        if (count >= maxTrades) {
            return {
                allowed: false,
                remaining: 0,
                limit: maxTrades,
                resetAt: now + (windowSeconds * 1000),
                retryAfter: windowSeconds,
            };
        }
        
        // Add this trade attempt
        await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
        await redis.expire(key, windowSeconds + 1);
        
        return {
            allowed: true,
            remaining: remaining - 1,
            limit: maxTrades,
            resetAt: now + (windowSeconds * 1000),
        };
    } catch (error) {
        console.error('[Trading RateLimit] Error:', error);
        return { allowed: true, remaining: 999, limit: 999, resetAt: Date.now() + 60000 };
    }
}

/**
 * Withdrawal-specific rate limiting (most critical)
 */
export async function checkWithdrawalRateLimit(userId: string): Promise<RateLimitResult> {
    const redis = getRedis();
    if (!redis) {
        return { allowed: true, remaining: 999, limit: 999, resetAt: Date.now() + 60000 };
    }

    const key = `rl:withdrawal:${userId}`;
    const now = Date.now();
    const windowSeconds = 3600; // 1 hour window

    try {
        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, now - (windowSeconds * 1000));
        pipeline.zcard(key);
        pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
        pipeline.expire(key, windowSeconds + 1);
        
        const results = await pipeline.exec();
        const count = (results[1] as number) || 0;
        
        const maxWithdrawals = 3; // Max 3 withdrawals per hour
        const remaining = Math.max(0, maxWithdrawals - count - 1);
        
        if (count >= maxWithdrawals) {
            return {
                allowed: false,
                remaining: 0,
                limit: maxWithdrawals,
                resetAt: now + (windowSeconds * 1000),
                retryAfter: windowSeconds,
            };
        }
        
        return {
            allowed: true,
            remaining,
            limit: maxWithdrawals,
            resetAt: now + (windowSeconds * 1000),
        };
    } catch (error) {
        console.error('[Withdrawal RateLimit] Error:', error);
        return { allowed: true, remaining: 999, limit: 999, resetAt: Date.now() + 60000 };
    }
}
