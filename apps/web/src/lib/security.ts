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

// ============================================
// SENTINEL SHIELD PRO — TRADING PIPELINE SECURITY GATEWAY
// MoAgent Garden Fraud Detection Integration
// ============================================

import {
    runSentinelAgent,
    type SentinelAgentResult,
    type SentinelInput,
    type UserActivityRecord,
    type TradeData,
} from '@/lib/ai-agents/vertex-sentinel-agent';

/** Score 8-10: Block trade instantly, freeze wallet */
const CRITICAL_THRESHOLD = 8;
/** Score 5-7: Flag for manual admin review */
const WARNING_THRESHOLD = 5;

/**
 * Custom error thrown when Sentinel blocks a trade.
 */
export class SecurityViolationError extends Error {
    public riskScore: number;
    public threatType: string;
    public action: string;
    public evidenceBn: string;

    constructor(result: SentinelAgentResult) {
        super(
            `Security Violation [${result.fraud_assessment.threat_type}]: ${result.evidence_log.reasoning_bn}`
        );
        this.name = 'SecurityViolationError';
        this.riskScore = result.fraud_assessment.risk_score;
        this.threatType = result.fraud_assessment.threat_type;
        this.action = result.enforcement_action.action;
        this.evidenceBn = result.evidence_log.reasoning_bn;
    }
}

/**
 * Fetch recent user activity from the database for behavioral analysis.
 */
async function getUserRecentActivity(
    userId: string
): Promise<UserActivityRecord[]> {
    try {
        // Dynamic import to avoid circular dependencies in client code
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        const { data: trades } = await (supabase
            .from('trades') as any)
            .select('id, market_id, side, amount, price, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        const { data: transactions } = await (supabase
            .from('wallet_transactions') as any)
            .select('id, type, amount, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        const activityLog: UserActivityRecord[] = [];

        if (trades) {
            for (const trade of trades) {
                activityLog.push({
                    action: 'trade',
                    timestamp: trade.created_at,
                    amount: trade.amount,
                    marketId: trade.market_id,
                    side: trade.side as 'buy' | 'sell',
                });
            }
        }

        if (transactions) {
            for (const tx of transactions) {
                activityLog.push({
                    action: tx.type,
                    timestamp: tx.created_at,
                    amount: tx.amount,
                });
            }
        }

        activityLog.sort(
            (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return activityLog;
    } catch (err) {
        console.warn(
            '[Security] Failed to fetch user activity, proceeding with empty log:',
            err instanceof Error ? err.message : err
        );
        return [];
    }
}

/**
 * Production-level Sentinel Shield Pro security gateway.
 * Place this in the trading pipeline BEFORE executing the trade.
 *
 * @throws {SecurityViolationError} if risk score >= 8 (CRITICAL)
 * @returns SentinelAgentResult for logging
 */
export async function validateTradeWithSentinel(
    userId: string,
    tradeData: TradeData
): Promise<SentinelAgentResult> {
    console.log(
        `[Security] Validating trade for user ${userId} — market: ${tradeData.marketId}, ৳${tradeData.amount}`
    );

    const behaviorLog = await getUserRecentActivity(userId);

    const sentinelResponse = await runSentinelAgent({
        userId,
        behaviorLog,
        currentTrade: tradeData,
        marketId: tradeData.marketId,
    });

    console.log(
        `[Security] User ${userId} — risk: ${sentinelResponse.fraud_assessment.risk_score}/10, threat: ${sentinelResponse.fraud_assessment.threat_type}`
    );

    // CRITICAL: Block trade immediately
    if (sentinelResponse.fraud_assessment.risk_score >= CRITICAL_THRESHOLD) {
        console.error(
            `[Security] ⛔ BLOCKING trade for user ${userId} — ${sentinelResponse.fraud_assessment.threat_type}`
        );
        await logSecurityEvent(userId, sentinelResponse);
        throw new SecurityViolationError(sentinelResponse);
    }

    // WARNING: Flag for review but allow trade
    if (sentinelResponse.fraud_assessment.risk_score >= WARNING_THRESHOLD) {
        console.warn(
            `[Security] ⚠️ Flagging user ${userId} for review — ${sentinelResponse.fraud_assessment.threat_type}`
        );
        await logSecurityEvent(userId, sentinelResponse);
    }

    return sentinelResponse;
}

/**
 * Lightweight risk check without full behavioral analysis.
 * Use for high-frequency paths where latency matters.
 */
export async function quickRiskCheck(
    userId: string,
    marketId: string
): Promise<{ safe: boolean; riskScore: number }> {
    try {
        const sentinelResponse = await runSentinelAgent({
            userId,
            marketId,
            rawQuery: `Quick risk assessment for user ${userId} on market ${marketId}`,
        });

        return {
            safe: sentinelResponse.fraud_assessment.risk_score < CRITICAL_THRESHOLD,
            riskScore: sentinelResponse.fraud_assessment.risk_score,
        };
    } catch {
        // Fail-open for availability
        console.warn('[Security] quickRiskCheck failed, defaulting to safe');
        return { safe: true, riskScore: 0 };
    }
}

/**
 * Log a security event to the database for admin audit trail.
 */
async function logSecurityEvent(
    userId: string,
    result: SentinelAgentResult
): Promise<void> {
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();

        await (supabase.from('security_events') as any).insert({
            user_id: userId,
            risk_score: result.fraud_assessment.risk_score,
            threat_type: result.fraud_assessment.threat_type,
            action_taken: result.enforcement_action.action,
            reasoning_bn: result.evidence_log.reasoning_bn,
            linked_accounts: result.evidence_log.linked_accounts,
            suspicious_pattern: result.evidence_log.suspicious_pattern,
            admin_instruction_bn: result.enforcement_action.admin_instruction_bn,
            created_at: new Date().toISOString(),
        });
    } catch (err) {
        // Non-blocking — don't fail trade pipeline if logging fails
        console.error('[Security] Failed to log security event:', err);
    }
}

// Re-export Sentinel types for consumers
export type {
    SentinelAgentResult,
    TradeData,
    UserActivityRecord,
} from '@/lib/ai-agents/vertex-sentinel-agent';
