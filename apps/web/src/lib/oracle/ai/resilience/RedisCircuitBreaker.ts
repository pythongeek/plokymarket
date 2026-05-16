/**
 * Redis-backed Circuit Breaker
 *
 * Distributed state across serverless instances via Redis.
 * Trip: 3 failures within 60s rolling window.
 * Open duration: 5 minutes (300,000ms).
 * Emits CRITICAL alert when circuit opens.
 */

import { redisCommand } from "@/lib/upstash/redis";
import { sendCircuitBreakerAlert } from "@/lib/monitoring/alerts";

export type CircuitStatus = "closed" | "open" | "half_open";

export interface RedisCircuitState {
  status: CircuitStatus;
  failures: number;
  openedAt?: number; // timestamp ms
  halfOpenCalls: number;
}

const DEFAULT_THRESHOLD = 3;
const DEFAULT_WINDOW_MS = 60000; // 60s rolling window
const DEFAULT_OPEN_MS = 300000; // 5 minutes
const DEFAULT_HALF_OPEN_MAX = 2;

const CB_PREFIX = "cb:";

async function getState(service: string): Promise<RedisCircuitState> {
  const key = `${CB_PREFIX}${service}`;
  try {
    const raw = await redisCommand("GET", key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        status: parsed.status || "closed",
        failures: parsed.failures || 0,
        openedAt: parsed.openedAt,
        halfOpenCalls: parsed.halfOpenCalls || 0,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { status: "closed", failures: 0, halfOpenCalls: 0 };
}

async function setState(
  service: string,
  state: RedisCircuitState,
  ttlSeconds: number = 3600
): Promise<void> {
  const key = `${CB_PREFIX}${service}`;
  try {
    await redisCommand("SETEX", key, ttlSeconds, JSON.stringify(state));
  } catch (error: any) {
    console.error(`[CircuitBreaker] Failed to write state to Redis: ${error.message}`);
  }
}

async function incrementFailures(service: string, windowMs: number): Promise<number> {
  const key = `${CB_PREFIX}${service}:failures`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Add current timestamp to sorted set, remove old entries
    await redisCommand("ZADD", key, now, String(now));
    await redisCommand("ZREMRANGEBYSCORE", key, 0, windowStart);
    // Count failures in window
    const count = await redisCommand("ZCARD", key);
    // Set TTL on the key so it auto-expires
    await redisCommand("EXPIRE", key, Math.ceil(windowMs / 1000) + 60);
    return count || 0;
  } catch (error: any) {
    console.error(`[CircuitBreaker] Redis failure tracking error: ${error.message}`);
    // Fail-safe: return high count to trip circuit if Redis is down
    return DEFAULT_THRESHOLD + 1;
  }
}

async function clearFailures(service: string): Promise<void> {
  try {
    await redisCommand("DEL", `${CB_PREFIX}${service}:failures`);
  } catch {
    // ignore
  }
}

/**
 * Check if request can proceed through circuit breaker.
 */
export async function canProceed(service: string): Promise<boolean> {
  const state = await getState(service);
  const now = Date.now();

  switch (state.status) {
    case "closed":
      return true;

    case "open":
      if (state.openedAt && now - state.openedAt > DEFAULT_OPEN_MS) {
        // Transition to half-open
        await setState(service, {
          status: "half_open",
          failures: 0,
          halfOpenCalls: 0,
        });
        return true;
      }
      return false;

    case "half_open":
      return state.halfOpenCalls < DEFAULT_HALF_OPEN_MAX;

    default:
      return false;
  }
}

/**
 * Record a successful call.
 */
export async function recordSuccess(service: string): Promise<void> {
  const state = await getState(service);

  switch (state.status) {
    case "closed":
      // Reset failure tracking on success
      await clearFailures(service);
      break;

    case "half_open": {
      const newHalfOpen = state.halfOpenCalls + 1;
      if (newHalfOpen >= DEFAULT_HALF_OPEN_MAX) {
        await setState(service, {
          status: "closed",
          failures: 0,
          halfOpenCalls: 0,
        });
        await clearFailures(service);
        console.log(`[CircuitBreaker] ${service} CLOSED`);
      } else {
        await setState(service, {
          ...state,
          halfOpenCalls: newHalfOpen,
        });
      }
      break;
    }
  }
}

/**
 * Record a failed call.
 * If threshold reached within window, OPEN the circuit and send alert.
 */
export async function recordFailure(service: string): Promise<void> {
  const state = await getState(service);
  const now = Date.now();

  switch (state.status) {
    case "closed": {
      const failureCount = await incrementFailures(service, DEFAULT_WINDOW_MS);
      if (failureCount >= DEFAULT_THRESHOLD) {
        await setState(service, {
          status: "open",
          failures: failureCount,
          openedAt: now,
          halfOpenCalls: 0,
        });
        console.error(
          `[CircuitBreaker] ${service} OPENED (${failureCount} failures in ${DEFAULT_WINDOW_MS}ms)`
        );
        await sendCircuitBreakerAlert(service, failureCount, DEFAULT_OPEN_MS);
      }
      break;
    }

    case "half_open":
      // Any failure in half-open immediately re-opens
      await setState(service, {
        status: "open",
        failures: state.failures + 1,
        openedAt: now,
        halfOpenCalls: 0,
      });
      await sendCircuitBreakerAlert(service, state.failures + 1, DEFAULT_OPEN_MS);
      break;

    case "open":
      // Already open, just increment failure count
      await setState(service, {
        ...state,
        failures: state.failures + 1,
      });
      break;
  }
}

/**
 * Execute a function with circuit breaker protection.
 */
export async function executeWithCircuitBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  const allowed = await canProceed(service);
  if (!allowed) {
    if (fallback) {
      console.warn(`[CircuitBreaker] ${service} OPEN — using fallback`);
      return fallback();
    }
    throw new Error(`Circuit breaker OPEN for ${service}`);
  }

  try {
    const result = await fn();
    await recordSuccess(service);
    return result;
  } catch (error) {
    await recordFailure(service);
    throw error;
  }
}

/**
 * Get current circuit state for monitoring.
 */
export async function getCircuitState(
  service: string
): Promise<RedisCircuitState> {
  return getState(service);
}

/**
 * Reset a circuit breaker (for admin/maintenance use).
 */
export async function resetCircuit(service: string): Promise<void> {
  await setState(service, { status: "closed", failures: 0, halfOpenCalls: 0 });
  await clearFailures(service);
  console.log(`[CircuitBreaker] ${service} manually reset`);
}
