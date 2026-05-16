/**
 * Module E Phase 1 Tests — QStash Security & Idempotency
 * Intent-based tests (Rule 9): encode WHY behavior matters.
 */

// Set mock signing key BEFORE importing verify module
process.env.QSTASH_CURRENT_SIGNING_KEY = "test-signing-key-123";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @upstash/qstash
vi.mock("@upstash/qstash", () => ({
  Receiver: function MockReceiver({ currentSigningKey }: any) {
    return {
      verify: vi.fn(async ({ signature, body }: any) => {
        return signature?.startsWith("valid_");
      }),
    };
  },
}));

// Mock Redis
vi.mock("@/lib/upstash/redis", () => ({
  redisCommand: vi.fn(),
}));

import { verifyQStashSignature, withQStashAuth } from "./verify";
import {
  isAlreadyProcessed,
  markAsProcessed,
  acquireIdempotencyLock,
  generateIdempotencyKey,
} from "./idempotency";
import { redisCommand } from "@/lib/upstash/redis";
import { NextRequest, NextResponse } from "next/server";

describe("QStash Signature Verification", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("1: Missing signature header → returns 401", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      body: JSON.stringify({ test: true }),
    });

    const handler = withQStashAuth(async () =>
      NextResponse.json({ success: true })
    );
    const res = await handler(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Unauthorized");
  });

  it("2: Invalid signature → returns 401", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "upstash-signature": "invalid_sig" },
      body: JSON.stringify({ test: true }),
    });

    const handler = withQStashAuth(async () =>
      NextResponse.json({ success: true })
    );
    const res = await handler(req);
    expect(res.status).toBe(401);
  });

  it("3: Valid signature → handler executes", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      method: "POST",
      headers: { "upstash-signature": "valid_sig_123" },
      body: JSON.stringify({ test: true }),
    });

    const handler = withQStashAuth(async () =>
      NextResponse.json({ success: true })
    );
    const res = await handler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe("Idempotency Key System", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("4: isAlreadyProcessed returns true if key exists in Redis", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce("some-value");
    const result = await isAlreadyProcessed("workflow-123");
    expect(result).toBe(true);
  });

  it("5: isAlreadyProcessed returns false if key missing", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce(null);
    const result = await isAlreadyProcessed("workflow-new");
    expect(result).toBe(false);
  });

  it("6: markAsProcessed stores key with 30-day TTL", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce("OK");
    await markAsProcessed("workflow-456", { step: "validate" });
    expect(redisCommand).toHaveBeenCalledWith(
      "SETEX",
      "idempotency:workflow-456",
      2592000,
      expect.stringContaining("validate")
    );
  });

  it("7: acquireIdempotencyLock acquires on first call", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce("OK");
    const result = await acquireIdempotencyLock("workflow-789");
    expect(result.acquired).toBe(true);
    expect(result.wasProcessed).toBe(false);
  });

  it("8: acquireIdempotencyLock fails on duplicate", async () => {
    vi.mocked(redisCommand).mockResolvedValueOnce(null); // SET NX returns null if key exists
    const result = await acquireIdempotencyLock("workflow-789");
    expect(result.acquired).toBe(false);
    expect(result.wasProcessed).toBe(true);
  });

  it("9: generateIdempotencyKey creates deterministic keys", () => {
    const key1 = generateIdempotencyKey("market-close", "mkt-1", "step-a");
    const key2 = generateIdempotencyKey("market-close", "mkt-1", "step-a");
    expect(key1).toBe(key2);
    expect(key1).toBe("market-close:mkt-1:step-a");
  });

  it("10: Redis failure → fail-safe allows processing", async () => {
    vi.mocked(redisCommand).mockRejectedValueOnce(new Error("Redis down"));
    const result = await acquireIdempotencyLock("workflow-fail");
    expect(result.acquired).toBe(true); // Fail-safe: allow through
  });
});
