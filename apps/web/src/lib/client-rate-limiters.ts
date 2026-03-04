/**
 * Client-side rate limiters
 * This file contains only client-safe rate limiting using Redis
 * (no server-side imports like next/headers)
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

// Login rate limiter - client-safe
export const loginRateLimiter = {
    isRateLimited: async (key: string): Promise<boolean> => {
        try {
            const redis = getRedis();
            if (!redis) return false;
            const count = await redis.get<number>(`ratelimit:login:${key}`);
            return (count ?? 0) >= 5; // Limit to 5 attempts
        } catch (e) {
            console.error('Redis error', e);
            return false;
        }
    },

    recordAttempt: async (key: string): Promise<void> => {
        try {
            const redis = getRedis();
            if (!redis) return;
            const k = `ratelimit:login:${key}`;
            await redis.incr(k);
            await redis.expire(k, 900); // 15 min TTL (Security standard)
        } catch (e) { console.error('Redis error', e); }
    },

    reset: async (key: string): Promise<void> => {
        try {
            const redis = getRedis();
            if (!redis) return;
            await redis.del(`ratelimit:login:${key}`);
        } catch (e) { console.error('Redis error', e); }
    },

    getRemainingTime: async (key: string): Promise<number> => {
        try {
            const redis = getRedis();
            if (!redis) return 0;
            const ttl = await redis.pttl(`ratelimit:login:${key}`);
            return ttl > 0 ? Math.ceil(ttl / 1000) : 0;
        } catch (e) {
            console.error('Redis error', e);
            return 0;
        }
    }
};

// Client-side only rate limiter (in-memory)
class ClientRateLimiter {
    private attempts: Map<string, { count: number; resetTime: number }> = new Map();
    private readonly maxAttempts: number;
    private readonly windowMs: number;

    constructor(maxAttempts: number = 5, windowMs: number = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    isRateLimited(key: string): boolean {
        const now = Date.now();
        const record = this.attempts.get(key);

        if (!record) {
            return false;
        }

        if (now > record.resetTime) {
            this.attempts.delete(key);
            return false;
        }

        return record.count >= this.maxAttempts;
    }

    recordAttempt(key: string): void {
        const now = Date.now();
        const record = this.attempts.get(key);

        if (!record || now > record.resetTime) {
            this.attempts.set(key, {
                count: 1,
                resetTime: now + this.windowMs,
            });
        } else {
            record.count++;
        }
    }

    getRemainingTime(key: string): number {
        const record = this.attempts.get(key);
        if (!record) return 0;
        const remaining = record.resetTime - Date.now();
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }

    reset(key: string): void {
        this.attempts.delete(key);
    }
}

export const registerRateLimiter = new ClientRateLimiter(3, 300000); // 3 attempts per 5 minutes
