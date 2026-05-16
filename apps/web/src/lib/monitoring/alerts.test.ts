/**
 * Module E Phase 2 Tests — Alerting, Circuit Breaker, n8n Hardening
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sendSystemAlert,
  sendCircuitBreakerAlert,
  sendWorkflowFailureAlert,
  type AlertLevel,
} from "./alerts";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("sendSystemAlert", () => {
  beforeEach(() => {
    vi.stubEnv("ALERT_WEBHOOK_URL", "https://discord.com/api/webhooks/test");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("1: sends Discord embed for CRITICAL alert", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 } as Response);

    const result = await sendSystemAlert(
      "CRITICAL",
      "CircuitBreaker",
      "MiniMax is down",
      { service: "minimax", failures: 3 }
    );

    expect(result.sent).toBe(true);
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe("https://discord.com/api/webhooks/test");
    const body = JSON.parse(call[1].body);
    expect(body.embeds[0].title).toContain("CRITICAL");
    expect(body.embeds[0].color).toBe(15158332); // red
  });

  it("2: sends yellow embed for WARN alert", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 } as Response);

    await sendSystemAlert("WARN", "RateLimiter", "High traffic detected");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.embeds[0].color).toBe(16776960); // yellow
  });

  it("3: handles missing webhook URL gracefully", async () => {
    vi.unstubAllEnvs();
    delete process.env.ALERT_WEBHOOK_URL;

    const result = await sendSystemAlert("CRITICAL", "Test", "message");
    expect(result.sent).toBe(false);
    expect(result.reason).toContain("not configured");
  });

  it("4: handles webhook HTTP error gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    } as Response);

    const result = await sendSystemAlert("CRITICAL", "Test", "message");
    expect(result.sent).toBe(false);
    expect(result.reason).toContain("500");
  });

  it("5: sendCircuitBreakerAlert formats correctly", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 } as Response);

    await sendCircuitBreakerAlert("minimax", 3, 300000);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.embeds[0].title).toContain("CRITICAL");
    expect(body.embeds[0].description).toContain("minimax");
    expect(body.embeds[0].description).toContain("300");
  });

  it("6: sendWorkflowFailureAlert formats correctly", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 } as Response);

    await sendWorkflowFailureAlert("oracle-resolution", "Timeout", "Gemini Node");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.embeds[0].description).toContain("oracle-resolution");
    expect(body.embeds[0].description).toContain("Gemini Node");
  });
});
