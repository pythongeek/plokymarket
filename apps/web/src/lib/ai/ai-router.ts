/**
 * Strict AI Router for Module D
 * Enforces architectural boundary:
 *   - MiniMax m2.7 → Oracle Resolution, Market Analysis, User Assistant
 *   - Vertex AI    → KYC Verification ONLY
 *   - Fallback     → MiniMax 5xx/timeout → Vertex (logged as ORACLE_FALLBACK_TRIGGERED)
 *
 * Rule 5 compliance: All routing is deterministic code, not AI logic.
 */

import { generateWithMiniMax, checkMiniMaxHealth } from "./minimax-client";
import { getModel, parseJSONResponse, executeWithRetry } from "./vertex-client";

// ─── Task Types ───────────────────────────────────────────────────────────────
export type AITaskType =
  | "oracle_resolution"   // MiniMax primary
  | "market_analysis"     // MiniMax primary
  | "user_assistant"      // MiniMax primary
  | "kyc_verification";   // Vertex ONLY

// ─── Router Result ────────────────────────────────────────────────────────────
export interface RouterResult<T = any> {
  success: boolean;
  data?: T;
  provider: "minimax" | "vertex" | "fallback";
  error?: string;
  fallbackTriggered?: boolean;
}

// ─── Fallback Logger ──────────────────────────────────────────────────────────
function logFallbackTriggered(task: AITaskType, originalError: string): void {
  const msg = `[ORACLE_FALLBACK_TRIGGERED] task=${task} error="${originalError}" fallback=vertex`;
  console.warn(msg);
  // Sentry capture if available
  if (typeof (globalThis as any).__SENTRY__ !== "undefined") {
    // eslint-disable-next-line no-console
    console.error("Sentry would capture:", msg);
  }
}

// ─── Prompt Templates ─────────────────────────────────────────────────────────
const ORACLE_PROMPT = `You are an oracle resolver for Plokymarket, a Bangladeshi prediction market.
Analyze the provided evidence and determine the outcome.

Respond ONLY in valid JSON:
{
  "outcome": "YES|NO|DISPUTED|UNRESOLVED",
  "confidence": 0.0-1.0,
  "reasoning": "detailed reasoning in English",
  "evidence_summary": "summary of key evidence points"
}`;

const MARKET_ANALYSIS_PROMPT = `You are a market analyst for Plokymarket.
Analyze the prediction market data and provide insights.

Respond ONLY in valid JSON:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 0.0-1.0,
  "key_factors": ["factor1", "factor2"],
  "risk_assessment": "low|medium|high",
  "recommendation": "brief recommendation"
}`;

const USER_ASSISTANT_PROMPT = `You are a helpful assistant for Plokymarket users.
Answer questions about prediction markets, trading, and the platform.
Be concise and helpful. Respond in the same language as the user's query.`;

const KYC_PROMPT = `You are a KYC verification analyst.
Analyze the provided identity document and user information.

Respond ONLY in valid JSON:
{
  "verified": true|false,
  "confidence": 0.0-1.0,
  "issues": ["issue1", "issue2"],
  "recommendation": "APPROVE|REJECT|MANUAL_REVIEW"
}`;

// ─── MiniMax Execution ────────────────────────────────────────────────────────
async function executeWithMiniMax(
  task: AITaskType,
  payload: string
): Promise<RouterResult> {
  let systemPrompt: string;
  let temperature = 0.3;

  switch (task) {
    case "oracle_resolution":
      systemPrompt = ORACLE_PROMPT;
      temperature = 0.2;
      break;
    case "market_analysis":
      systemPrompt = MARKET_ANALYSIS_PROMPT;
      temperature = 0.3;
      break;
    case "user_assistant":
      systemPrompt = USER_ASSISTANT_PROMPT;
      temperature = 0.7;
      break;
    default:
      throw new Error(`MiniMax does not handle task type: ${task}`);
  }

  const result = await generateWithMiniMax(payload, {
    model: "MiniMax-M2.7",
    temperature,
    maxTokens: 2048,
    systemPrompt,
  });

  // Parse JSON from response
  const text = result.content.trim();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      return {
        success: false,
        provider: "minimax",
        error: "Failed to parse MiniMax response as JSON: " + text.slice(0, 200),
      };
    }
  }

  return {
    success: true,
    data: parsed,
    provider: "minimax",
  };
}

// ─── Vertex Execution ─────────────────────────────────────────────────────────
async function executeWithVertex(
  task: AITaskType,
  payload: string
): Promise<RouterResult> {
  let systemInstruction: string;
  let modelName = "gemini-1.5-flash-002";

  switch (task) {
    case "kyc_verification":
      systemInstruction = KYC_PROMPT;
      modelName = "gemini-1.5-pro-002"; // Pro for document analysis
      break;
    case "oracle_resolution":
      systemInstruction = ORACLE_PROMPT;
      break;
    case "market_analysis":
      systemInstruction = MARKET_ANALYSIS_PROMPT;
      break;
    case "user_assistant":
      systemInstruction = USER_ASSISTANT_PROMPT;
      break;
    default:
      throw new Error(`Vertex does not handle task type: ${task}`);
  }

  const model = getModel({
    modelName,
    systemInstruction,
    temperature: 0.2,
    maxOutputTokens: 2048,
  });

  const result = await executeWithRetry(
    () => model.generateContent(payload),
    { retries: 2, backoffMs: 1000 }
  );

  const response = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!response) {
    return {
      success: false,
      provider: "vertex",
      error: "Empty response from Vertex AI",
    };
  }

  const parsed = parseJSONResponse(response);
  return {
    success: true,
    data: parsed,
    provider: "vertex",
  };
}

// ─── Strict Router (Deterministic — Rule 5) ───────────────────────────────────
/**
 * Route AI task to the correct provider.
 *
 * - oracle_resolution, market_analysis, user_assistant → MiniMax (primary)
 * - kyc_verification → Vertex (mandatory)
 * - If MiniMax fails with 5xx/timeout → fallback to Vertex (logged)
 */
export async function routeAITask(
  task: AITaskType,
  payload: string
): Promise<RouterResult> {
  // KYC MUST go to Vertex — no MiniMax involvement
  if (task === "kyc_verification") {
    return executeWithVertex("kyc_verification", payload);
  }

  // Oracle/Assistant tasks → MiniMax primary
  try {
    return await executeWithMiniMax(task, payload);
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const is5xx =
      errorMessage.includes("500") ||
      errorMessage.includes("502") ||
      errorMessage.includes("503") ||
      errorMessage.includes("504") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("ETIMEDOUT") ||
      errorMessage.includes("ECONNREFUSED");

    if (is5xx) {
      logFallbackTriggered(task, errorMessage);
      try {
        const fallbackResult = await executeWithVertex(task, payload);
        return {
          ...fallbackResult,
          provider: "fallback",
          fallbackTriggered: true,
        };
      } catch (fallbackError: any) {
        return {
          success: false,
          provider: "minimax",
          error: `MiniMax failed: ${errorMessage}. Vertex fallback also failed: ${fallbackError.message}`,
          fallbackTriggered: true,
        };
      }
    }

    // 4xx errors are client errors — don't fallback, fail loud
    return {
      success: false,
      provider: "minimax",
      error: errorMessage,
    };
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────
export async function getRouterHealth(): Promise<{
  minimax: { healthy: boolean; latencyMs: number; error?: string };
  vertex: { healthy: boolean; latencyMs: number; error?: string };
}> {
  const [minimaxHealth, vertexHealth] = await Promise.all([
    checkMiniMaxHealth(),
    (async () => {
      const { checkVertexHealth } = await import("./vertex-client");
      return checkVertexHealth();
    })(),
  ]);

  return {
    minimax: minimaxHealth,
    vertex: {
      healthy: vertexHealth.healthy,
      latencyMs: vertexHealth.latencyMs,
      error: vertexHealth.error,
    },
  };
}
