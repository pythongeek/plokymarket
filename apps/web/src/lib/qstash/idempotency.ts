/**
 * Idempotency Key System for Automation Triggers
 *
 * Prevents duplicate processing of the same workflow event,
 * even if n8n/QStash fires duplicate webhooks.
 *
 * Redis stores processed keys for 30 days (EX 2592000).
 * Keys are prefixed with `idempotency:` for isolation.
 */

import { redisCommand } from "@/lib/upstash/redis";

const IDEMPOTENCY_PREFIX = "idempotency:";
const IDEMPOTENCY_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Check if a workflow event has already been processed.
 * Returns true if already processed (skip), false if new.
 */
export async function isAlreadyProcessed(workflowId: string): Promise<boolean> {
  const key = `${IDEMPOTENCY_PREFIX}${workflowId}`;
  try {
    const result = await redisCommand("GET", key);
    return result !== null && result !== undefined;
  } catch (error: any) {
    console.error(`[Idempotency] Redis GET error for ${key}:`, error.message);
    // Fail-safe: if Redis is down, allow processing (log warning)
    console.warn(`[Idempotency] Allowing ${workflowId} through due to Redis failure`);
    return false;
  }
}

/**
 * Mark a workflow event as processed.
 * Sets TTL to 30 days so Redis cleans up old keys automatically.
 */
export async function markAsProcessed(
  workflowId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const key = `${IDEMPOTENCY_PREFIX}${workflowId}`;
  const value = JSON.stringify({
    processed_at: new Date().toISOString(),
    ...metadata,
  });
  try {
    await redisCommand("SETEX", key, IDEMPOTENCY_TTL_SECONDS, value);
  } catch (error: any) {
    console.error(`[Idempotency] Redis SETEX error for ${key}:`, error.message);
    // Non-fatal: log but don't fail the workflow
  }
}

/**
 * Atomic check-and-set: returns true if this is the first time,
 * false if already processed. Atomically marks as processed on first call.
 *
 * Uses SET ... NX EX for atomicity.
 */
export async function acquireIdempotencyLock(
  workflowId: string,
  metadata?: Record<string, any>
): Promise<{ acquired: boolean; wasProcessed: boolean }> {
  const key = `${IDEMPOTENCY_PREFIX}${workflowId}`;
  const value = JSON.stringify({
    processed_at: new Date().toISOString(),
    ...metadata,
  });

  try {
    // SET key value EX ttl NX — only sets if key doesn't exist
    const result = await redisCommand("SET", key, value, "EX", IDEMPOTENCY_TTL_SECONDS, "NX");
    if (result === "OK") {
      return { acquired: true, wasProcessed: false };
    }
    // Key already exists → already processed
    return { acquired: false, wasProcessed: true };
  } catch (error: any) {
    console.error(`[Idempotency] Redis SET NX error for ${key}:`, error.message);
    // Fail-safe: allow processing if Redis fails
    return { acquired: true, wasProcessed: false };
  }
}

/**
 * Release an idempotency lock (for testing/recovery use only).
 */
export async function releaseIdempotencyLock(workflowId: string): Promise<void> {
  const key = `${IDEMPOTENCY_PREFIX}${workflowId}`;
  try {
    await redisCommand("DEL", key);
  } catch (error: any) {
    console.error(`[Idempotency] Redis DEL error for ${key}:`, error.message);
  }
}

/**
 * Generate a deterministic idempotency key from workflow payload.
 * Use for market-close, settlement, event-processor triggers.
 */
export function generateIdempotencyKey(
  workflowType: string,
  entityId: string,
  step?: string
): string {
  return `${workflowType}:${entityId}${step ? `:${step}` : ""}`;
}
