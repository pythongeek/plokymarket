/**
 * Token Bucket Rate Limiter for AI Oracle
 * Prevents API quota exhaustion and ensures fair usage
 */

import { RateLimitState } from '../types';

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  burstSize?: number;
}

export class RateLimiter {
  private states: Map<string, RateLimitState> = new Map();
  private readonly config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = {
      burstSize: config.maxRequests,
      ...config
    };
  }

  /**
   * Get or create rate limit state for a service
   */
  private getState(service: string): RateLimitState {
    if (!this.states.has(service)) {
      this.states.set(service, {
        service,
        windowStart: Date.now(),
        requestCount: 0,
        limit: this.config.maxRequests,
        windowMs: this.config.windowMs
      });
    }
    return this.states.get(service)!;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(service: string): boolean {
    const state = this.getState(service);
    const now = Date.now();
    
    // Reset window if expired
    if (now - state.windowStart > state.windowMs) {
      state.windowStart = now;
      state.requestCount = 0;
    }
    
    // Check if under limit
    if (state.requestCount < state.limit) {
      return true;
    }
    
    return false;
  }

  /**
   * Consume a token (increment request count)
   */
  consume(service: string): boolean {
    const state = this.getState(service);
    const now = Date.now();
    
    // Reset window if expired
    if (now - state.windowStart > state.windowMs) {
      state.windowStart = now;
      state.requestCount = 0;
    }
    
    // Check and consume
    if (state.requestCount < state.limit) {
      state.requestCount++;
      return true;
    }
    
    return false;
  }

  /**
   * Get time until next request is allowed (ms)
   */
  getTimeUntilReset(service: string): number {
    const state = this.getState(service);
    const now = Date.now();
    const windowEnd = state.windowStart + state.windowMs;
    
    return Math.max(0, windowEnd - now);
  }

  /**
   * Get remaining requests in current window
   */
  getRemaining(service: string): number {
    const state = this.getState(service);
    const now = Date.now();
    
    // Reset window if expired
    if (now - state.windowStart > state.windowMs) {
      return state.limit;
    }
    
    return Math.max(0, state.limit - state.requestCount);
  }

  /**
   * Execute function with rate limiting
   */
  async execute<T>(
    service: string,
    fn: () => Promise<T>,
    onRateLimit?: () => T
  ): Promise<T> {
    if (!this.consume(service)) {
      const waitTime = this.getTimeUntilReset(service);
      
      if (onRateLimit) {
        console.warn(`[RateLimiter] ${service} rate limited, using fallback`);
        return onRateLimit();
      }
      
      throw new Error(
        `Rate limit exceeded for ${service}. Retry after ${waitTime}ms`
      );
    }
    
    return fn();
  }

  /**
   * Wait for rate limit to reset
   */
  async waitForReset(service: string): Promise<void> {
    const waitTime = this.getTimeUntilReset(service);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Reset rate limit for a service
   */
  reset(service: string): void {
    this.states.delete(service);
  }

  /**
   * Get all rate limit states
   */
  getAllStates(): RateLimitState[] {
    return Array.from(this.states.values());
  }

  /**
   * Get rate limit status for monitoring
   */
  getStatus(service: string): {
    allowed: boolean;
    remaining: number;
    resetInMs: number;
    limit: number;
  } {
    return {
      allowed: this.isAllowed(service),
      remaining: this.getRemaining(service),
      resetInMs: this.getTimeUntilReset(service),
      limit: this.config.maxRequests
    };
  }
}

// Predefined rate limiters for different services
export const AI_SERVICE_LIMITS: Record<string, RateLimiterConfig> = {
  GEMINI: {
    maxRequests: 60, // 60 requests per minute for Gemini 1.5 Flash
    windowMs: 60000,
    burstSize: 10
  },
  OPENAI: {
    maxRequests: 20, // Conservative for GPT-4
    windowMs: 60000,
    burstSize: 5
  },
  ANTHROPIC: {
    maxRequests: 30, // Claude rate limits
    windowMs: 60000,
    burstSize: 5
  },
  NEWSAPI: {
    maxRequests: 100, // Free tier
    windowMs: 86400000, // Per day
    burstSize: 10
  },
  GDELT: {
    maxRequests: 1000, // Generous limits
    windowMs: 60000,
    burstSize: 50
  }
};

// Singleton rate limiters
const limiters: Map<string, RateLimiter> = new Map();

export function getRateLimiter(service: string, config?: RateLimiterConfig): RateLimiter {
  if (!limiters.has(service)) {
    const defaultConfig = AI_SERVICE_LIMITS[service] || { maxRequests: 100, windowMs: 60000 };
    limiters.set(service, new RateLimiter(config || defaultConfig));
  }
  return limiters.get(service)!;
}
