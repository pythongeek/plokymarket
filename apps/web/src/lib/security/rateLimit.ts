/**
 * Rate Limiting Utility — LOCAL IN-MEMORY VERSION
 * No cloud dependencies. Replaced Upstash Redis with in-memory Maps.
 */

const rateLimitStore = new Map<string, { count: number; resetAt: number; timestamps: number[] }>();

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function isRateLimited(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${endpoint}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSeconds;

  let entry = rateLimitStore.get(key);
  if (!entry || now > Math.floor(entry.resetAt / 1000)) {
    entry = { count: 0, resetAt: (now + config.windowSeconds) * 1000, timestamps: [] };
  }

  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);
  const requestCount = entry.timestamps.length;

  if (requestCount >= config.maxRequests) {
    const oldest = entry.timestamps[0] || now;
    const reset = oldest + config.windowSeconds;
    return { success: false, limit: config.maxRequests, remaining: 0, reset };
  }

  entry.timestamps.push(now);
  entry.count = entry.timestamps.length;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.timestamps.length),
    reset: now + config.windowSeconds,
  };
}

export async function recordRequest(identifier: string, endpoint: string, windowSeconds: number): Promise<void> {
  const key = `ratelimit:${endpoint}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  let entry = rateLimitStore.get(key);
  if (!entry || now > Math.floor(entry.resetAt / 1000)) {
    entry = { count: 0, resetAt: (now + windowSeconds) * 1000, timestamps: [] };
  }
  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);
}

export async function resetRateLimit(identifier: string, endpoint: string): Promise<void> {
  rateLimitStore.delete(`ratelimit:${endpoint}:${identifier}`);
}
