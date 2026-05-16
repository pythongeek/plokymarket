/**
 * Module D Phase 2 Tests — MiniMax Oracle Engine
 * Intent-based tests (Rule 9): encode WHY behavior matters.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  resolveWithMiniMaxOracle,
  meetsAutoResolutionThreshold,
  determineResolutionAction,
  MIN_CONFIDENCE_THRESHOLD,
  type OracleResolutionResult,
} from "./minimax-oracle";
import { OracleParsingError } from "./oracle-parsing-error";

// ─── Mocks ────────────────────────────────────────────────────────────────────
vi.mock("./minimax-client", () => ({
  generateWithMiniMax: vi.fn(),
  checkMiniMaxHealth: vi.fn(),
}));

vi.mock("./vertex-client", () => ({
  getModel: vi.fn(),
  parseJSONResponse: vi.fn((text: string) => JSON.parse(text)),
  executeWithRetry: vi.fn((fn: any) => fn()),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({
      insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'audit-123' } }) }) }),
    }),
  }),
}));

import { generateWithMiniMax } from "./minimax-client";
import { getModel } from "./vertex-client";

const mockMiniMax = generateWithMiniMax as ReturnType<typeof vi.fn>;
const mockGetModel = getModel as ReturnType<typeof vi.fn>;

// ─── Helpers ────────────────────────────────────────────────────────────────────

function mockMiniMaxResponse(content: string) {
  mockMiniMax.mockResolvedValue({
    content,
    usage: { totalTokens: 500 },
  });
}

function mockVertexResponse(responseText: string) {
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

// ─── Test Suite ────────────────────────────────────────────────────────────────────────────
describe("Module D Phase 2 — MiniMax Oracle Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Test A: High Confidence → Auto Resolution ───────────────────────────────────────
  it("Test A: 95% confidence YES → auto-resolution proceeds", async () => {
    mockMiniMaxResponse(JSON.stringify({
      reasoning: "Multiple Tier 1 sources confirm the event occurred.",
      confidence_score: 95,
      resolution: "YES",
      sources: ["https://bdnews24.com/article1", "https://prothomalo.com/article2"],
    }));

    const result = await resolveWithMiniMaxOracle(
      "market-123",
      "Will Bangladesh win the match?"
    );

    expect(result.provider).toBe("minimax");
    expect(result.resolution).toBe("YES");
    expect(result.confidence_score).toBe(95);
    expect(meetsAutoResolutionThreshold(result)).toBe(true);
    expect(determineResolutionAction(result)).toBe("auto_resolve");
  });

  // ─── Test B: Low Confidence → Human Tribunal ──────────────────────────────────────
  it("Test B: 80% confidence YES → routes to Human Tribunal", async () => {
    mockMiniMaxResponse(JSON.stringify({
      reasoning: "Sources are partially conflicting on the outcome.",
      confidence_score: 80,
      resolution: "YES",
      sources: ["https://bdnews24.com/article1"],
    }));

    const result = await resolveWithMiniMaxOracle(
      "market-456",
      "Will the law pass?"
    );

    expect(result.confidence_score).toBe(80);
    expect(meetsAutoResolutionThreshold(result)).toBe(false);
    expect(determineResolutionAction(result)).toBe("human_tribunal");
  });

  // ─── Test C: UNKNOWN → Human Tribunal regardless of confidence ───────────────────
  it("Test C: UNKNOWN resolution → routes to Tribunal regardless of 99% confidence", async () => {
    mockMiniMaxResponse(JSON.stringify({
      reasoning: "Event has not occurred yet. Insufficient data.",
      confidence_score: 99,
      resolution: "UNKNOWN",
      sources: [],
    }));

    const result = await resolveWithMiniMaxOracle(
      "market-789",
      "Will it rain tomorrow?"
    );

    expect(result.resolution).toBe("UNKNOWN");
    expect(result.confidence_score).toBe(99);
    expect(meetsAutoResolutionThreshold(result)).toBe(false);
    expect(determineResolutionAction(result)).toBe("human_tribunal");
  });

  // ─── Test D: Parsing Failure → OracleParsingError, no state change ───────────────────────
  it("Test D: Malformed response → OracleParsingError, no market state change", async () => {
    mockMiniMaxResponse("This is not JSON at all, just plain text explaining the outcome.");
    mockVertexResponse("Also not JSON");

    await expect(
      resolveWithMiniMaxOracle("market-abc", "Test question?")
    ).rejects.toThrow(OracleParsingError);
  });

  // ─── Test E: Missing reasoning field → OracleParsingError ────────────────────────────────
  it("Test E: Missing reasoning field → OracleParsingError", async () => {
    mockMiniMaxResponse(JSON.stringify({
      confidence_score: 90,
      resolution: "YES",
      sources: [],
      // missing "reasoning"
    }));
    mockVertexResponse(JSON.stringify({
      confidence_score: 90,
      resolution: "YES",
      sources: [],
    }));

    await expect(
      resolveWithMiniMaxOracle("market-def", "Test question?")
    ).rejects.toThrow(OracleParsingError);
  });

  // ─── Test F: Confidence score clamped to 0-100 ──────────────────────────────────────
  it("Test F: Confidence score out of range gets clamped to 0-100", async () => {
    mockMiniMaxResponse(JSON.stringify({
      reasoning: "Test reasoning.",
      confidence_score: 150, // out of range
      resolution: "YES",
      sources: [],
    }));

    const result = await resolveWithMiniMaxOracle(
      "market-ghi",
      "Test question?"
    );

    expect(result.confidence_score).toBe(100);
  });

  // ─── Test G: MiniMax 502 → Vertex fallback ───────────────────────────────────────
  it("Test G: MiniMax 502 triggers Vertex fallback", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockMiniMax.mockRejectedValue(new Error("MiniMax API error 502: Bad Gateway"));
    mockVertexResponse(JSON.stringify({
      reasoning: "Fallback reasoning from Vertex.",
      confidence_score: 88,
      resolution: "YES",
      sources: ["https://vertex-source.com"],
    }));

    const result = await resolveWithMiniMaxOracle(
      "market-jkl",
      "Test question?"
    );

    expect(result.provider).toBe("fallback");
    expect(result.fallback_triggered).toBe(true);
    expect(result.confidence_score).toBe(88);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining("ORACLE_FALLBACK_TRIGGERED")
    );
    consoleWarn.mockRestore();
  });

  // ─── Test H: MiniMax 401 → NO fallback, fails loud ────────────────────────────────────
  it("Test H: MiniMax 401 does NOT trigger fallback", async () => {
    mockMiniMax.mockRejectedValue(new Error("MiniMax API error 401: Unauthorized"));

    await expect(
      resolveWithMiniMaxOracle("market-mno", "Test question?")
    ).rejects.toThrow("Unauthorized");

    expect(mockGetModel).not.toHaveBeenCalled();
  });

  // ─── Test I: Threshold constant is 85 ──────────────────────────────────────────────────────
  it("Test I: MIN_CONFIDENCE_THRESHOLD is exactly 85", () => {
    expect(MIN_CONFIDENCE_THRESHOLD).toBe(85);
  });
});
