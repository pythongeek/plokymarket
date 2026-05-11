/**
 * Client-side rate limiters
 * LOCAL IN-MEMORY VERSION — no cloud dependencies
 */

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getLoginEntry(key: string) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    return { count: 0, resetAt: now + 900000 };
  }
  return entry;
}

// Login rate limiter - in-memory
export const loginRateLimiter = {
  isRateLimited: async (key: string): Promise<boolean> => {
    const entry = getLoginEntry(key);
    return entry.count >= 5;
  },

  recordAttempt: async (key: string): Promise<void> => {
    const entry = getLoginEntry(key);
    entry.count++;
    loginAttempts.set(key, entry);
  },

  reset: async (key: string): Promise<void> => {
    loginAttempts.delete(key);
  },

  getRemainingTime: async (key: string): Promise<number> => {
    const entry = getLoginEntry(key);
    const remaining = entry.resetAt - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
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
        if (!record) return false;
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
            this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
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

export const registerRateLimiter = new ClientRateLimiter(3, 300000);
