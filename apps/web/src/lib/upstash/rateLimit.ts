/**
 * Server-Side API Rate Limiting and Abuse Protection
 * LOCAL IN-MEMORY VERSION — no cloud dependencies
 * For single-instance PM2 fork mode, in-memory is sufficient.
 * If scaling to multi-instance, install local Redis and swap this out.
 */

// In-memory storage
const rateLimitStore = new Map<string, { count: number; resetAt: number; timestamps: number[] }>();
const abuseStore = new Map<string, { score: number; failed: number; resetAt: number }>();
const blockedIps = new Map<string, number>(); // ip -> unblock timestamp

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
  for (const [ip, unblockAt] of blockedIps) {
    if (now > unblockAt) blockedIps.delete(ip);
  }
  for (const [key, entry] of abuseStore) {
    if (now > entry.resetAt) abuseStore.delete(key);
  }
}, 300000);

// Rate limit tiers
export enum RateLimitTier {
  STRICT = 'strict',
  STANDARD = 'standard',
  LENIENT = 'lenient',
  CRITICAL = 'critical',
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

function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
}

export async function checkRateLimit(
  request: Request,
  tier: RateLimitTier,
  userId?: string,
  customKey?: string
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[tier];
  const clientId = getClientIdentifier(request, userId);
  const key = customKey ? `${config.keyPrefix}:${customKey}:${clientId}` : `${config.keyPrefix}:${clientId}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, timestamps: [] };
  }

  // Clean old timestamps
  entry.timestamps = entry.timestamps.filter(ts => ts > now - windowMs);
  const currentCount = entry.timestamps.length;

  if (currentCount >= config.maxRequests) {
    const oldest = entry.timestamps[0] || now;
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAt: entry.resetAt,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  entry.timestamps.push(now);
  entry.count = entry.timestamps.length;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, config.maxRequests - entry.timestamps.length),
    limit: config.maxRequests,
    resetAt: entry.resetAt,
  };
}

export function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
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

export const abuseDetector = {
  async recordFailedAttempt(ip: string, _type: string): Promise<void> {
    const now = Date.now();
    let entry = abuseStore.get(ip);
    if (!entry || now > entry.resetAt) {
      entry = { score: 0, failed: 0, resetAt: now + 86400000 };
    }
    entry.failed++;
    entry.score += 2;
    abuseStore.set(ip, entry);

    if (entry.score > 50) {
      blockedIps.set(ip, now + 3600000);
      console.warn(`[Abuse Detection] IP ${ip} auto-blocked`);
    }
  },

  async isBlocked(ip: string): Promise<boolean> {
    const unblockAt = blockedIps.get(ip);
    if (!unblockAt) return false;
    if (Date.now() > unblockAt) {
      blockedIps.delete(ip);
      return false;
    }
    return true;
  },

  async recordSuccess(ip: string): Promise<void> {
    const entry = abuseStore.get(ip);
    if (entry && entry.score > 1) {
      entry.score = Math.max(0, entry.score - 1);
      abuseStore.set(ip, entry);
    }
  },

  async clearAbuseData(ip: string): Promise<void> {
    abuseStore.delete(ip);
    blockedIps.delete(ip);
  },
};

export async function checkApiRateLimit(
  request: Request,
  endpoint: string,
  userId?: string,
  tier: RateLimitTier = RateLimitTier.STANDARD
): Promise<RateLimitResult> {
  if (!userId) {
    const anonymousTier = endpoint.includes('order') || endpoint.includes('trade') ? RateLimitTier.STRICT : tier;
    return checkRateLimit(request, anonymousTier, undefined, endpoint);
  }
  return checkRateLimit(request, tier, userId, endpoint);
}

export async function checkTradingRateLimit(userId: string, marketId: string): Promise<RateLimitResult> {
  const key = `rl:trading:${userId}:${marketId}`;
  const now = Date.now();
  const windowSeconds = 10;
  const windowMs = windowSeconds * 1000;
  const maxTrades = 5;

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, timestamps: [] };
  }

  entry.timestamps = entry.timestamps.filter(ts => ts > now - windowMs);
  const count = entry.timestamps.length;

  if (count >= maxTrades) {
    return {
      allowed: false,
      remaining: 0,
      limit: maxTrades,
      resetAt: now + windowMs,
      retryAfter: windowSeconds,
    };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, maxTrades - entry.timestamps.length),
    limit: maxTrades,
    resetAt: now + windowMs,
  };
}

export async function checkWithdrawalRateLimit(userId: string): Promise<RateLimitResult> {
  const key = `rl:withdrawal:${userId}`;
  const now = Date.now();
  const windowSeconds = 3600;
  const windowMs = windowSeconds * 1000;
  const maxWithdrawals = 3;

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, timestamps: [] };
  }

  entry.timestamps = entry.timestamps.filter(ts => ts > now - windowMs);
  const count = entry.timestamps.length;

  if (count >= maxWithdrawals) {
    return {
      allowed: false,
      remaining: 0,
      limit: maxWithdrawals,
      resetAt: now + windowMs,
      retryAfter: windowSeconds,
    };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, maxWithdrawals - entry.timestamps.length),
    limit: maxWithdrawals,
    resetAt: now + windowMs,
  };
}

// ─── Module D: AI Rate Limits ───────────────────────────────────────────────────────────────────────

/**
 * KYC Verification: Max 3 requests per IP per 10 minutes.
 * Returns 429 with Retry-After if exceeded.
 */
export async function checkKYCRateLimit(request: Request): Promise<RateLimitResult> {
  const ip = getIp(request);
  const key = `rl:kyc:${ip}`;
  const now = Date.now();
  const windowSeconds = 600; // 10 minutes
  const windowMs = windowSeconds * 1000;
  const maxRequests = 3;

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, timestamps: [] };
  }

  entry.timestamps = entry.timestamps.filter(ts => ts > now - windowMs);
  const count = entry.timestamps.length;

  if (count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit: maxRequests,
      resetAt: entry.resetAt,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    limit: maxRequests,
    resetAt: entry.resetAt,
  };
}

/**
 * Oracle Resolution: Max 10 requests per Market ID per 5 minutes.
 */
export async function checkOracleRateLimit(
  request: Request,
  marketId: string
): Promise<RateLimitResult> {
  const ip = getIp(request);
  const key = `rl:oracle:${marketId}:${ip}`;
  const now = Date.now();
  const windowSeconds = 300; // 5 minutes
  const windowMs = windowSeconds * 1000;
  const maxRequests = 10;

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, timestamps: [] };
  }

  entry.timestamps = entry.timestamps.filter(ts => ts > now - windowMs);
  const count = entry.timestamps.length;

  if (count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit: maxRequests,
      resetAt: entry.resetAt,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    limit: maxRequests,
    resetAt: entry.resetAt,
  };
}

/**
 * AI Assistant: Max 20 requests per User ID per minute.
 */
export async function checkAssistantRateLimit(
  request: Request,
  userId: string
): Promise<RateLimitResult> {
  const key = `rl:assistant:${userId}`;
  const now = Date.now();
  const windowSeconds = 60; // 1 minute
  const windowMs = windowSeconds * 1000;
  const maxRequests = 20;

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, timestamps: [] };
  }

  entry.timestamps = entry.timestamps.filter(ts => ts > now - windowMs);
  const count = entry.timestamps.length;

  if (count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      limit: maxRequests,
      resetAt: entry.resetAt,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    limit: maxRequests,
    resetAt: entry.resetAt,
  };
}

// Auth rate limit for middleware
export async function checkAuthRateLimit(ip: string, maxAttempts = 10, windowSeconds = 3600): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const key = `ratelimit:auth:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, timestamps: [] };
  }

  entry.timestamps = entry.timestamps.filter(ts => ts > now - windowMs);
  const count = entry.timestamps.length;

  if (count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return { allowed: true, remaining: Math.max(0, maxAttempts - entry.timestamps.length) };
}
