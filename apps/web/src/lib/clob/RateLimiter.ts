/**
 * Token Bucket Rate Limiter.
 * Supports burst allowance and smooth refill.
 */

const REFILL_RATE_PER_SEC = 100 / 60; // 100 orders per minute = ~1.66 ops/sec
const MAX_BURST = 20; // Burst allowance

interface Bucket {
    tokens: number;
    lastRefill: number;
}

const buckets = new Map<string, Bucket>();

export class RateLimiter {
    static check(userId: string): boolean {
        const now = Date.now();
        let bucket = buckets.get(userId);

        if (!bucket) {
            bucket = { tokens: MAX_BURST, lastRefill: now };
            buckets.set(userId, bucket);
        }

        // Refill tokens based on time elapsed
        const elapsedSec = (now - bucket.lastRefill) / 1000;
        const newTokens = elapsedSec * REFILL_RATE_PER_SEC;

        if (newTokens > 0) {
            bucket.tokens = Math.min(MAX_BURST, bucket.tokens + newTokens);
            bucket.lastRefill = now;
        }

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return true;
        }

        return false;
    }
}
