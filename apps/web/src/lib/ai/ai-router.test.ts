/**
 * Module D Phase 1 Tests — Strict AI Router & Rate Limiting
 * Intent-based tests (Rule 9): encode WHY behavior matters.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { routeAITask, getRouterHealth, type AITaskType } from "./ai-router";
import {
  checkKYCRateLimit,
  checkOracleRateLimit,
  checkAssistantRateLimit,
} from "../upstash/rateLimit";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("./minimax-client", () => ({
  generateWithMiniMax: vi.fn(),
  checkMiniMaxHealth: vi.fn(),
}));

vi.mock("./vertex-client", () => ({
  getModel: vi.fn(),
  parseJSONResponse: vi.fn((text: string) => JSON.parse(text)),
  executeWithRetry: vi.fn((fn: any) => fn()),
  checkVertexHealth: vi.fn(),
}));

import { generateWithMiniMax, checkMiniMaxHealth } from "./minimax-client";
import { getModel, checkVertexHealth } from "./vertex-client";

const mockMiniMax = generateWithMiniMax as ReturnType<typeof vi.fn>;
const mockMiniMaxHealth = checkMiniMaxHealth as ReturnType<typeof vi.fn>;
const mockGetModel = getModel as ReturnType<typeof vi.fn>;
const mockVertexHealth = checkVertexHealth as ReturnType<typeof vi.fn>;

// ─── Helpers ────────────────────────────────────────────────────────────────────
function mockRequest(ip = "127.0.0.1"): Request {
  return new Request("http://localhost", {
    headers: { "x-forwarded-for": ip },
  });
}

function setupMockModel(responseText: string) {
  mockGetModel.mockReturnValue({
    generateContent: vi.fn().mockResolvedValue({
      response: {
        candidates: [
          {
            content: { parts: [{ text: responseText }] },
          },
        ],
      },
    }),
  });
}

// ─── Test Suite ────────────────────────────────────────────────────────────────────
describe("Module D — Strict AI Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Test A: Oracle routes ONLY to MiniMax ─────────────────────────────────────
  it("Test A: oracle_resolution routes ONLY to MiniMax", async () => {
    mockMiniMax.mockResolvedValue({
      content: JSON.stringify({ outcome: "YES", confidence: 0.95 }),
      usage: { totalTokens: 100 },
    });

    const result = await routeAITask("oracle_resolution", "test evidence");

    expect(mockMiniMax).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe("minimax");
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ outcome: "YES", confidence: 0.95 });
    expect(mockGetModel).not.toHaveBeenCalled(); // Vertex not touched
  });

  // ─── Test B: KYC routes ONLY to Vertex ────────────────────────────────────────────
  it("Test B: kyc_verification routes ONLY to Vertex", async () => {
    setupMockModel(JSON.stringify({ verified: true, confidence: 0.88 }));

    const result = await routeAITask("kyc_verification", "test document");

    expect(mockGetModel).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe("vertex");
    expect(result.success).toBe(true);
    expect(mockMiniMax).not.toHaveBeenCalled(); // MiniMax not touched
  });

  // ─── Test C: MiniMax 5xx triggers Vertex fallback ──────────────────────────
  it("Test C: MiniMax 502 triggers Vertex fallback with ORACLE_FALLBACK_TRIGGERED log", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockMiniMax.mockRejectedValue(new Error("MiniMax API error 502: Bad Gateway"));
    setupMockModel(JSON.stringify({ outcome: "YES", confidence: 0.8 }));

    const result = await routeAITask("oracle_resolution", "test evidence");

    expect(result.provider).toBe("fallback");
    expect(result.fallbackTriggered).toBe(true);
    expect(result.success).toBe(true);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("ORACLE_FALLBACK_TRIGGERED")
    );
    consoleWarn.mockRestore();
  });

  // ─── Test D: KYC rate limit throws 429 ──────────────────────────────────────────
  it("Test D: Exceeding 3 KYC requests from one IP throws 429", async () => {
    const req = mockRequest("192.168.1.50");

    // 3 requests should succeed
    for (let i = 0; i < 3; i++) {
      const result = await checkKYCRateLimit(req);
      expect(result.allowed).toBe(true);
    }

    // 4th request should be blocked
    const blocked = await checkKYCRateLimit(req);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.limit).toBe(3);
  });

  // ─── Test E: Oracle rate limit per market ────────────────────────────────────────
  it("Test E: Oracle rate limit is per-market, not global", async () => {
    const req = mockRequest("192.168.1.51");
    const marketA = "market-abc";
    const marketB = "market-xyz";

    // 10 requests to market A should succeed
    for (let i = 0; i < 10; i++) {
      const r = await checkOracleRateLimit(req, marketA);
      expect(r.allowed).toBe(true);
    }

    // 11th to market A blocked
    const blockedA = await checkOracleRateLimit(req, marketA);
    expect(blockedA.allowed).toBe(false);

    // But market B should still work
    const rB = await checkOracleRateLimit(req, marketB);
    expect(rB.allowed).toBe(true);
  });

  // ─── Test F: Assistant rate limit per user ───────────────────────────────────────
  it("Test F: Assistant rate limit is per-user", async () => {
    const req = mockRequest("192.168.1.52");
    const userAlice = "user-alice";
    const userBob = "user-bob";

    // 20 requests from Alice
    for (let i = 0; i < 20; i++) {
      const r = await checkAssistantRateLimit(req, userAlice);
      expect(r.allowed).toBe(true);
    }

    // 21st blocked for Alice
    const blockedAlice = await checkAssistantRateLimit(req, userAlice);
    expect(blockedAlice.allowed).toBe(false);

    // Bob unaffected
    const rBob = await checkAssistantRateLimit(req, userBob);
    expect(rBob.allowed).toBe(true);
  });

  // ─── Test G: 4xx errors do NOT trigger fallback ────────────────────────────────
  it("Test G: MiniMax 4xx error does NOT trigger fallback", async () => {
    mockMiniMax.mockRejectedValue(new Error("MiniMax API error 401: Unauthorized"));

    const result = await routeAITask("market_analysis", "test data");

    expect(result.provider).toBe("minimax");
    expect(result.success).toBe(false);
    expect(result.fallbackTriggered).toBeUndefined();
    expect(mockGetModel).not.toHaveBeenCalled();
  });

  // ─── Test H: Health check returns both providers ───────────────────────────────
  it("Test H: getRouterHealth returns both MiniMax and Vertex status", async () => {
    mockMiniMaxHealth.mockResolvedValue({ healthy: true, latencyMs: 150 });
    mockVertexHealth.mockResolvedValue({ healthy: true, latencyMs: 200, model: "gemini" });

    const health = await getRouterHealth();

    expect(health.minimax.healthy).toBe(true);
    expect(health.vertex.healthy).toBe(true);
  });
});
