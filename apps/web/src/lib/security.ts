import { Redis } from '@upstash/redis';

// Security utilities for authentication

// Password strength requirements
export const PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
        errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    } else {
        score++;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
    }

    // Check uppercase
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
        score++;
    }

    // Check lowercase
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
        score++;
    }

    // Check number
    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    } else if (/[0-9]/.test(password)) {
        score++;
    }

    // Check special character
    if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*...)');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score++;
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 4) strength = 'medium';
    if (score >= 6) strength = 'strong';

    return {
        isValid: errors.length === 0,
        errors,
        strength,
    };
}

// Email validation
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Rate limiting helper (client-side)
class RateLimiter {
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

// Global rate limiter instances
export const loginRateLimiter = {
    isRateLimited: async (key: string): Promise<boolean> => {
        try {
            const redis = getRedis();
            if (!redis) return false;
            const count = await redis.get<number>(`ratelimit:login:${key}`);
            return (count ?? 0) >= 5; // Limit to 5 attempts
        } catch (e) { console.error('Redis error', e); return false; }
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

export const withdrawalRateLimiter = {
    isRateLimited: async (userId: string): Promise<boolean> => {
        try {
            const redis = getRedis();
            if (!redis) return false;
            const count = await redis.get<number>(`ratelimit:withdrawal:${userId}`);
            return (count ?? 0) >= 3; // Strict: Max 3 withdrawals per hour
        } catch (e) { console.error('Redis error', e); return false; }
    },

    recordAttempt: async (userId: string): Promise<void> => {
        try {
            const redis = getRedis();
            if (!redis) return;
            const k = `ratelimit:withdrawal:${userId}`;
            await redis.incr(k);
            await redis.expire(k, 3600); // 1 hour TTL
        } catch (e) { console.error('Redis error', e); }
    },
};

export const registerRateLimiter = new RateLimiter(3, 300000); // 3 attempts per 5 minutes

// CSRF token generation (for forms)
export function generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
