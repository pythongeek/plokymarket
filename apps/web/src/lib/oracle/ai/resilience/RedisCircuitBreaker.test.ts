/**
 * Module E Phase 2 — Circuit Breaker Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canProceed,
  recordSuccess,
  recordFailure,
  executeWithCircuitBreaker,
  resetCircuit,
  getCircuitState,
} from "./RedisCircuitBreaker";

vi.mock("@/lib/upstash/redis", () => ({
  redisCommand: vi.fn(),
}));

vi.mock("@/lib/monitoring/alerts", () => ({
  sendCircuitBreakerAlert: vi.fn(),
}));

import { redisCommand } from "@/lib/upstash/redis";
import { sendCircuitBreakerAlert } from "@/lib/monitoring/alerts";

describe("Redis Circuit Breaker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("A: Closed circuit allows requests", async () => {
    vi.mocked(redisCommand).mockResolvedValue(null); // no state
    const ok = await canProceed("minimax");
    expect(ok).toBe(true);
  });

  it("B: 3 failures trip circuit to OPEN", async () => {
    // First 2 failures: circuit stays closed
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null) // GET state
      .mockResolvedValueOnce(1) // ZADD
      .mockResolvedValueOnce(0) // ZREMRANGE
      .mockResolvedValueOnce(1) // ZCARD (1 failure)
      .mockResolvedValueOnce("OK"); // EXPIRE

    await recordFailure("minimax");

    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce("OK");

    await recordFailure("minimax");

    // 3rd failure should trip
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce("OK")
      .mockResolvedValueOnce("OK"); // SETEX for open state

    await recordFailure("minimax");

    expect(sendCircuitBreakerAlert).toHaveBeenCalledWith("minimax", 3, 300000);
  });

  it("C: OPEN circuit blocks requests", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce(
      JSON.stringify({ status: "open", failures: 3, openedAt: Date.now() })
    );
    const ok = await canProceed("minimax");
    expect(ok).toBe(false);
  });

  it("D: executeWithCircuitBreaker uses fallback when OPEN", async () => {
    vi.mocked(redisCommand).mockResolvedValue(
      JSON.stringify({ status: "open", failures: 3, openedAt: Date.now() })
    );

    const fallback = vi.fn().mockReturnValue("fallback-result");
    const result = await executeWithCircuitBreaker(
      "minimax",
      async () => "real-result",
      fallback
    );

    expect(result).toBe("fallback-result");
    expect(fallback).toHaveBeenCalled();
  });

  it("E: Success resets failure count in closed state", async () => {
    vi.mocked(redisCommand)
      .mockResolvedValueOnce(null) // GET state
      .mockResolvedValueOnce("OK"); // DEL failures

    await recordSuccess("minimax");
    expect(redisCommand).toHaveBeenCalledWith("DEL", "cb:minimax:failures");
  });

  it("F: Redis failure trips circuit fail-safe", async () => {
    vi.mocked(redisCommand).mockRejectedValue(new Error("Redis down"));

    await recordFailure("minimax");
    // Should not throw — fail-safe
  });
});
