/**
 * Token Bucket Rate Limiter.
 * Supports burst allowance and smooth refill.
 */

import { redis } from "@/lib/upstash/redis";

const REFILL_RATE_PER_SEC = 100 / 60; // 100 orders per minute = ~1.66 ops/sec
const MAX_BURST = 20; // Burst allowance

export class RateLimiter {
    // Default: 100/min (1.66/sec)
    private static DEFAULT_RATE = 100 / 60;
    private static DEFAULT_BURST = 20;

    // Custom Limits by type
    private static LIMITS: Record<string, { rate: number, burst: number }> = {
        'cancel': { rate: 10, burst: 10 }, // 10 cancels/sec
        'place': { rate: 50, burst: 50 }   // Higher limit for placing
    };

    static async check(userId: string, type: 'default' | 'cancel' | 'place' = 'default'): Promise<boolean> {
        const key = `ratelimit:${userId}:${type}`; // Unique prefix
        const config = this.LIMITS[type] || { rate: this.DEFAULT_RATE, burst: this.DEFAULT_BURST };
        const window = Math.ceil(config.burst / config.rate) || 1; // Simplified to fixed window

        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, window);
            }
            if (current > config.burst) {
                return false;
            }
            return true;
        } catch (error) {
            console.error('RateLimiter Redis Error:', error);
            return true; // Fallback: allow request if Redis fails
        }
    }
}
