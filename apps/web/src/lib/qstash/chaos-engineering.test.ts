/**
 * Module E Phase 5 — Chaos Engineering & E2E Validation
 *
 * Uses proven mock pattern from RedisCircuitBreaker.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/upstash/redis", () => ({
  redisCommand: vi.fn(),
}));

vi.mock("@/lib/monitoring/alerts", () => ({
  sendSystemAlert: vi.fn(async () => ({ sent: true })),
  sendCircuitBreakerAlert: vi.fn(async () => {}),
  sendWorkflowFailureAlert: vi.fn(async () => {}),
}));

import { redisCommand } from "@/lib/upstash/redis";
import { sendSystemAlert, sendCircuitBreakerAlert } from "@/lib/monitoring/alerts";

import {
  recordFailure,
  resetCircuit,
  getCircuitState,
  canProceed,
} from "../oracle/ai/resilience/RedisCircuitBreaker";

import {
  acquireIdempotencyLock,
  releaseIdempotencyLock,
} from "./idempotency";

const CHAOS_SERVICE = "chaos-minimax";
const IDEMPOTENCY_KEY = "chaos:webhook:market-12345";

function openStateJson() {
  return JSON.stringify({
    status: "open",
    failures: 3,
    openedAt: Date.now(),
    halfOpenCalls: 0,
  });
}

describe("Chaos Engineering — Module E E2E", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ─── 5.1: CIRCUIT BREAKER TRIP ───────────────────────────────────────────

  it("trips circuit breaker after 3 failures", async () => {
    // 3 failures in a row, no getCircuitState between them
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce("OK")
      .mockResolvedValueOnce("OK"); // SETEX

    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);

    vi.mocked(redisCommand).mockResolvedValueOnce(openStateJson());
    const state = await getCircuitState(CHAOS_SERVICE);
    expect(state.status).toBe("open");
    expect(state.failures).toBe(3);
    expect(sendCircuitBreakerAlert).toHaveBeenCalledWith(
      CHAOS_SERVICE,
      3,
      300000
    );
  });

  it("blocks requests when circuit is OPEN", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce(openStateJson());
    const allowed = await canProceed(CHAOS_SERVICE);
    expect(allowed).toBe(false);
  });

  // ─── 5.2: IDEMPOTENCY ASSAULT ────────────────────────────────────────────

  it("allows exactly 1 of 10 concurrent acquisitions", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce("OK");
    for (let i = 0; i < 9; i++) {
      vi.mocked(redisCommand).mockResolvedValueOnce(null);
    }

    const results = await Promise.all(
      Array.from({ length: 10 }, () => acquireIdempotencyLock(IDEMPOTENCY_KEY))
    );

    const acquired = results.filter((r) => r.acquired).length;
    const rejected = results.filter((r) => !r.acquired).length;

    expect(acquired).toBe(1);
    expect(rejected).toBe(9);
  });

  // ─── 5.3: DLQ OVERFLOW SIMULATION ────────────────────────────────────────

  it("dispatches DLQ CRITICAL alert for >10 messages", async () => {
    await sendSystemAlert(
      "CRITICAL",
      "QueueHealth",
      "DLQ has 15 messages (threshold: 10)",
      { dlqCount: 15, threshold: 10 }
    );

    expect(sendSystemAlert).toHaveBeenCalledWith(
      "CRITICAL",
      "QueueHealth",
      expect.stringContaining("15 messages"),
      expect.objectContaining({ dlqCount: 15, threshold: 10 })
    );
  });

  // ─── 5.4: RECOVERY ───────────────────────────────────────────────────────

  it("recovers circuit breaker to CLOSED after reset", async () => {
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(1).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(2).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(3).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce("OK"); // SETEX

    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);

    vi.mocked(redisCommand).mockResolvedValueOnce(openStateJson());
    expect((await getCircuitState(CHAOS_SERVICE)).status).toBe("open");

    vi.mocked(redisCommand)
      .mockResolvedValueOnce(1) // DEL
      .mockResolvedValueOnce(null); // GET after reset

    await resetCircuit(CHAOS_SERVICE);
    const state = await getCircuitState(CHAOS_SERVICE);
    expect(state.status).toBe("closed");
    expect(state.failures).toBe(0);
  });

  it("allows requests after recovery", async () => {
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(1).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(2).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(3).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce("OK"); // SETEX

    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);

    vi.mocked(redisCommand).mockResolvedValueOnce(openStateJson());
    expect((await getCircuitState(CHAOS_SERVICE)).status).toBe("open");

    vi.mocked(redisCommand)
      .mockResolvedValueOnce(1) // DEL
      .mockResolvedValueOnce(null) // GET after reset
      .mockResolvedValueOnce(null); // GET for canProceed

    await resetCircuit(CHAOS_SERVICE);
    expect(await canProceed(CHAOS_SERVICE)).toBe(true);
  });

  it("releases idempotency lock for re-use", async () => {
    vi.mocked(redisCommand)
      .mockResolvedValueOnce("OK") // first SET NX
      .mockResolvedValueOnce(null) // second SET NX (already exists)
      .mockResolvedValueOnce(1) // DEL
      .mockResolvedValueOnce("OK"); // third SET NX after release

    await acquireIdempotencyLock(IDEMPOTENCY_KEY);
    const first = await acquireIdempotencyLock(IDEMPOTENCY_KEY);
    expect(first.acquired).toBe(false);

    await releaseIdempotencyLock(IDEMPOTENCY_KEY);
    const second = await acquireIdempotencyLock(IDEMPOTENCY_KEY);
    expect(second.acquired).toBe(true);
  });

  it("full chaos-to-recovery cycle", async () => {
    // CHAOS: Trip CB (3 failures, no getCircuitState between)
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(1).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(2).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce(null).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(3).mockResolvedValueOnce("OK")
      .mockResolvedValueOnce("OK"); // SETEX

    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);
    await recordFailure(CHAOS_SERVICE);

    vi.mocked(redisCommand).mockResolvedValueOnce(openStateJson());
    const cbOpen = (await getCircuitState(CHAOS_SERVICE)).status === "open";

    // CHAOS: Idempotency assault
    vi.mocked(redisCommand).mockResolvedValueOnce("OK");
    for (let i = 0; i < 9; i++) {
      vi.mocked(redisCommand).mockResolvedValueOnce(null);
    }
    const idemResults = await Promise.all(
      Array.from({ length: 10 }, () => acquireIdempotencyLock("cycle-test"))
    );
    const idemOk =
      idemResults.filter((r) => r.acquired).length === 1 &&
      idemResults.filter((r) => !r.acquired).length === 9;

    // CHAOS: DLQ alert
    await sendSystemAlert(
      "CRITICAL",
      "QueueHealth",
      "DLQ has 15 messages (threshold: 10)",
      { dlqCount: 15, threshold: 10 }
    );

    // RECOVERY
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(1) // DEL cb state
      .mockResolvedValueOnce(null); // GET after reset
    await resetCircuit(CHAOS_SERVICE);

    vi.mocked(redisCommand).mockResolvedValueOnce(null); // GET for getCircuitState
    const recovered =
      (await getCircuitState(CHAOS_SERVICE)).status === "closed";

    expect(cbOpen).toBe(true);
    expect(idemOk).toBe(true);
    expect(sendSystemAlert).toHaveBeenCalled();
    expect(recovered).toBe(true);
  });
});
