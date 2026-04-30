/**
 * Rate Limiting Utility using Upstash Redis
 * For protecting public API endpoints from abuse
 */
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

interface RateLimitConfig {
  maxRequests: number;  // Maximum requests per window
  windowSeconds: number;  // Time window in seconds
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;  // Unix timestamp when the limit resets
}

/**
 * Check if a key is rate limited
 */
export async function isRateLimited(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${endpoint}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSeconds;

  try {
    // Use Redis sorted set for sliding window rate limiting
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count requests in current window
    const requestCount = await redis.zcard(key);
    
    if (requestCount >= config.maxRequests) {
      // Get oldest entry to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, { withScores: true });
      const reset = oldest.length > 0 
        ? Number(oldest[0]) + config.windowSeconds 
        : now + config.windowSeconds;
      
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset,
      };
    }

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - requestCount - 1,
      reset: now + config.windowSeconds,
    };
  } catch (error) {
    console.error('[RateLimit] Redis error:', error);
    // Fail open - allow request if Redis is unavailable
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + config.windowSeconds,
    };
  }
}

/**
 * Record a request in the rate limit window
 */
export async function recordRequest(
  identifier: string,
  endpoint: string
): Promise<void> {
  const key = `ratelimit:${endpoint}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // Add current request with timestamp as score
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    
    // Set expiry on the key to auto-cleanup
    await redis.expire(key, 3600); // 1 hour max
  } catch (error) {
    console.error('[RateLimit] Redis error:', error);
    // Silent fail - don't block requests
  }
}

/**
 * Create a rate limit middleware for API routes
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: Request,
    identifier?: string
  ): Promise<RateLimitResult> {
    // Use IP address as identifier if not provided
    const id = identifier || request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || request.headers.get('x-real-ip') 
      || 'unknown';
    
    const endpoint = new URL(request.url).pathname;
    
    const result = await isRateLimited(id, endpoint, config);
    
    if (!result.success) {
      await recordRequest(id, endpoint);
    }
    
    return result;
  };
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // Public endpoints - more restrictive
  public: {
    maxRequests: 60,
    windowSeconds: 60, // 60 requests per minute
  },
  // Authenticated endpoints - less restrictive  
  authenticated: {
    maxRequests: 120,
    windowSeconds: 60, // 120 requests per minute
  },
  // Write operations - very restrictive
  write: {
    maxRequests: 10,
    windowSeconds: 60, // 10 requests per minute
  },
} as const;
