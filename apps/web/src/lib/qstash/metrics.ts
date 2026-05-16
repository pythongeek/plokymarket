/**
 * Queue Metrics & DLQ Service
 *
 * Fetches Dead Letter Queue count from Upstash QStash API.
 * Scans Redis for OPEN circuit breakers.
 */

import { redisCommand } from "@/lib/upstash/redis";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_BASE_URL = "https://qstash.upstash.io/v2";

export interface DLQMetrics {
  messageCount: number;
  oldestMessageAgeMs?: number;
}

export interface CircuitBreakerMetrics {
  service: string;
  status: "closed" | "open" | "half_open";
  failures: number;
  openedAt?: number;
}

export interface QueueHealthSnapshot {
  dlq: DLQMetrics;
  circuitBreakers: CircuitBreakerMetrics[];
  timestamp: string;
}

/**
 * Fetch DLQ message count from Upstash QStash REST API.
 */
export async function fetchDLQMetrics(): Promise<DLQMetrics> {
  if (!QSTASH_TOKEN) {
    console.warn("[Metrics] QSTASH_TOKEN not configured");
    return { messageCount: 0 };
  }

  try {
    const response = await fetch(`${QSTASH_BASE_URL}/dlq`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`[Metrics] DLQ fetch failed: HTTP ${response.status}`);
      return { messageCount: 0 };
    }

    const data = await response.json();
    // QStash DLQ list response: array of messages
    const messages = Array.isArray(data) ? data : [];
    return {
      messageCount: messages.length,
      oldestMessageAgeMs: messages.length > 0
        ? Date.now() - new Date(messages[messages.length - 1].createdAt || Date.now()).getTime()
        : undefined,
    };
  } catch (error: any) {
    console.error(`[Metrics] DLQ fetch error: ${error.message}`);
    return { messageCount: 0 };
  }
}

/**
 * Scan Redis for all circuit breaker states.
 */
export async function fetchCircuitBreakerMetrics(): Promise<
  CircuitBreakerMetrics[]
> {
  try {
    // Use KEYS to find all cb:* keys (safe for small keyspace)
    const keys = await redisCommand("KEYS", "cb:*");
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return [];
    }

    const results: CircuitBreakerMetrics[] = [];

    for (const key of keys) {
      if (key.endsWith(":failures")) continue; // skip failure tracking keys
      const raw = await redisCommand("GET", key);
      if (raw) {
        try {
          const state = JSON.parse(raw);
          const service = key.replace("cb:", "");
          results.push({
            service,
            status: state.status || "closed",
            failures: state.failures || 0,
            openedAt: state.openedAt,
          });
        } catch {
          // ignore parse errors
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error(`[Metrics] Circuit breaker scan error: ${error.message}`);
    return [];
  }
}

/**
 * Get full queue health snapshot.
 */
export async function getQueueHealthSnapshot(): Promise<QueueHealthSnapshot> {
  const [dlq, circuitBreakers] = await Promise.all([
    fetchDLQMetrics(),
    fetchCircuitBreakerMetrics(),
  ]);

  return {
    dlq,
    circuitBreakers,
    timestamp: new Date().toISOString(),
  };
}
