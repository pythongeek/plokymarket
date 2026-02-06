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
    // Default: 100/min (1.66/sec)
    private static DEFAULT_RATE = 100 / 60;
    private static DEFAULT_BURST = 20;

    // Custom Limits by type
    private static LIMITS: Record<string, { rate: number, burst: number }> = {
        'cancel': { rate: 10, burst: 10 }, // 10 cancels/sec
        'place': { rate: 50, burst: 50 }   // Higher limit for placing
    };

    static check(userId: string, type: 'default' | 'cancel' | 'place' = 'default'): boolean {
        const now = Date.now();
        const key = `${userId}:${type}`; // Unique bucket per user + type
        let bucket = buckets.get(key);

        const config = this.LIMITS[type] || { rate: this.DEFAULT_RATE, burst: this.DEFAULT_BURST };

        if (!bucket) {
            bucket = { tokens: config.burst, lastRefill: now };
            buckets.set(key, bucket);
        }

        // Refill
        const elapsedSec = (now - bucket.lastRefill) / 1000;
        const newTokens = elapsedSec * config.rate;

        if (newTokens > 0) {
            bucket.tokens = Math.min(config.burst, bucket.tokens + newTokens);
            bucket.lastRefill = now;
        }

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return true;
        }

        return false;
    }
}

