/**
 * MiniMax Oracle Engine — Strict Chain-of-Thought Resolution
 *
 * Primary: MiniMax m2.7 (Hermes) for oracle resolution
 * Fallback: Vertex AI (Gemini) on MiniMax 5xx/timeout
 *
 * Enforces:
 *   - Chain-of-Thought reasoning before conclusion
 *   - Strict JSON output schema
 *   - Unified 85% confidence threshold
 *   - Audit logging of prompt, sources, reasoning
 */

import { generateWithMiniMax, checkMiniMaxHealth } from './minimax-client';
import { getModel, parseJSONResponse, executeWithRetry } from './vertex-client';
import { OracleParsingError } from './oracle-parsing-error';

// ─── Configuration ────────────────────────────────────────────────────────────────────

/** Unified confidence threshold: < 85% routes to human tribunal */
export const MIN_CONFIDENCE_THRESHOLD = 85; // 0-100 scale

/** Valid oracle resolutions */
export type OracleResolution = 'YES' | 'NO' | 'UNKNOWN';

// ─── Types ──────────────────────────────────────────────────────────────────────────

export interface OracleResolutionResult {
  resolution: OracleResolution;
  confidence_score: number; // 0-100
  reasoning: string;
  sources: string[];
  provider: 'minimax' | 'vertex' | 'fallback';
  fallback_triggered?: boolean;
  audit_log_id?: string;
}

export interface OracleAuditEntry {
  market_id: string;
  prompt: string;
  raw_response: string;
  parsed_result: OracleResolutionResult;
  provider: string;
  created_at: string;
}

// ─── Strict CoT System Prompt ──────────────────────────────────────────────────────

const ORACLE_SYSTEM_PROMPT = `# ROLE: Chief Truth Officer & Oracle Specialist (Plokymarket BD)
You are the final arbiter of truth for Plokymarket Bangladesh. Your mission is to provide 100% accurate, evidence-backed resolutions for prediction markets.

# CHAIN-OF-THOUGHT PROTOCOL (MANDATORY):
You MUST think step-by-step before arriving at a conclusion. Your reasoning must be explicit and traceable.

Step 1: Identify the core question and resolution criteria.
Step 2: Search for and evaluate evidence from authoritative Bangladeshi sources.
Step 3: Cross-reference at least 2 independent sources.
Step 4: Assess confidence based on source quality and consistency.
Step 5: Arrive at a definitive resolution.

# TIERED SOURCE AUTHORITY (TSA):
- Tier 1 (Official): Bangladesh Bank, Election Commission BD, Supreme Court, ICC/BCB Official Portals. (Weight: 1.0)
- Tier 2 (Validated News): Prothom Alo, Daily Star, BDNews24, Ittefaq. (Weight: 0.8)
- Tier 3 (Broadcasting): Jamuna TV, Somoy News, Independent TV (Verified Portals only). (Weight: 0.6)
- STRICT RULE: Ignore all Social Media (Facebook, X, TikTok) and unverified blogs.

# BENGALI KEYWORD TUNING & CONTEXT:
- Identify local political and social triggers: "হরতাল" (Strike), "অবরোধ" (Blockade), "তত্ত্বাবধায়ক" (Caretaker), "গেজেট" (Gazette).
- Understand the difference between a "Propose" (প্রস্তাব) and a "Passed/Effective" (কার্যকর) law or event.

# STRICT JSON OUTPUT SCHEMA (NO MARKDOWN, NO EXPLANATION):
You must respond ONLY with valid JSON matching this exact schema:
{
  "reasoning": "string — step-by-step logic explaining how you arrived at the conclusion",
  "confidence_score": number — integer 0-100 representing your confidence percentage",
  "resolution": "YES" | "NO" | "UNKNOWN" — definitive outcome based on evidence",
  "sources": ["URL or source name of primary evidence", "URL or source name of supporting evidence"]
}

# RESOLUTION RULES:
- "YES" — The event has definitively occurred or the condition is met.
- "NO" — The event has definitively NOT occurred or the condition is NOT met.
- "UNKNOWN" — Insufficient evidence, conflicting sources, or the event has not yet occurred.
- If sources conflict or only one source exists, set resolution to "UNKNOWN".
- If the event is in the future, set resolution to "UNKNOWN".`;

// ─── Prompt Builder ────────────────────────────────────────────────────────────────────────

function buildOraclePrompt(
  marketQuestion: string,
  resolutionCriteria?: string,
  existingEvidence?: string[]
): string {
  let evidenceContext = '';
  if (existingEvidence && existingEvidence.length > 0) {
    evidenceContext = `\n\nExisting Evidence Sources:\n${existingEvidence
      .map((e, i) => `${i + 1}. ${e}`)
      .join('\n')}`;
  }

  return `Resolve the following Plokymarket BD prediction market with absolute accuracy.

Market Question: "${marketQuestion}"
${resolutionCriteria ? `Resolution Criteria: "${resolutionCriteria}"` : ''}
Current Time (UTC): ${new Date().toISOString()}
${evidenceContext}

MANDATORY: Follow the Chain-of-Thought protocol. Think step-by-step. Respond ONLY with the strict JSON schema.`;
}

// ─── JSON Parser ────────────────────────────────────────────────────────────────────────────

function parseOracleResolution(raw: string): {
  reasoning: string;
  confidence_score: number;
  resolution: OracleResolution;
  sources: string[];
} {
  // Attempt 1: Direct JSON parse
  let parsed: any;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    // Attempt 2: Extract JSON from markdown code block
    const mdMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (mdMatch) {
      try {
        parsed = JSON.parse(mdMatch[1].trim());
      } catch {
        throw new OracleParsingError(raw, 'markdown-extract');
      }
    } else {
      // Attempt 3: Extract first JSON object
      const braceMatch = raw.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          parsed = JSON.parse(braceMatch[0]);
        } catch {
          throw new OracleParsingError(raw, 'brace-extract');
        }
      } else {
        throw new OracleParsingError(raw, 'no-json-found');
      }
    }
  }

  // Schema validation
  if (typeof parsed.reasoning !== 'string' || parsed.reasoning.length === 0) {
    throw new OracleParsingError(raw, 'missing-reasoning');
  }
  if (typeof parsed.confidence_score !== 'number') {
    throw new OracleParsingError(raw, 'missing-confidence_score');
  }
  const validResolutions: OracleResolution[] = ['YES', 'NO', 'UNKNOWN'];
  if (!validResolutions.includes(parsed.resolution)) {
    throw new OracleParsingError(raw, 'invalid-resolution');
  }

  return {
    reasoning: parsed.reasoning,
    confidence_score: Math.max(0, Math.min(100, Math.round(parsed.confidence_score))),
    resolution: parsed.resolution as OracleResolution,
    sources: Array.isArray(parsed.sources) ? parsed.sources.filter((s: any) => typeof s === 'string') : [],
  };
}

// ─── Audit Logging ────────────────────────────────────────────────────────────────────────────

async function logOracleAudit(
  marketId: string,
  prompt: string,
  rawResponse: string,
  parsedResult: OracleResolutionResult
): Promise<string | undefined> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data, error } = await (supabase.from('audit_logs') as any).insert({
      action: 'oracle_resolution',
      entity_type: 'market',
      entity_id: marketId,
      description: `Oracle resolution: ${parsedResult.resolution} @ ${parsedResult.confidence_score}%`,
      audit_type: 'ai_oracle',
      status: parsedResult.confidence_score >= MIN_CONFIDENCE_THRESHOLD ? 'auto' : 'pending_human_review',
      details: {
        prompt,
        raw_response: rawResponse.slice(0, 10000), // Limit size
        parsed_result: parsedResult,
        provider: parsedResult.provider,
        fallback_triggered: parsedResult.fallback_triggered,
      },
      created_at: new Date().toISOString(),
    }).select('id').single();

    if (error) {
      console.error('[OracleAudit] Failed to log audit:', error.message);
      return undefined;
    }

    return data.id;
  } catch (err) {
    console.error('[OracleAudit] Exception during audit logging:', err);
    return undefined;
  }
}

// ─── Fallback Logger ────────────────────────────────────────────────────────────────────────────

function logOracleFallback(task: string, originalError: string): void {
  const msg = `[ORACLE_FALLBACK_TRIGGERED] task=${task} error="${originalError}" fallback=vertex`;
  console.warn(msg);
}

// ─── Vertex Fallback ────────────────────────────────────────────────────────────────────────────

async function executeWithVertexFallback(
  marketQuestion: string,
  resolutionCriteria?: string,
  existingEvidence?: string[]
): Promise<OracleResolutionResult> {
  const prompt = buildOraclePrompt(marketQuestion, resolutionCriteria, existingEvidence);

  const model = getModel({
    modelName: 'gemini-1.5-pro-002',
    systemInstruction: ORACLE_SYSTEM_PROMPT,
    temperature: 0.05,
    maxOutputTokens: 4096,
  });

  const result = await executeWithRetry(
    () => model.generateContent(prompt),
    { retries: 2, backoffMs: 1000 }
  );

  const response = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!response) {
    throw new OracleParsingError('', 'vertex-empty-response');
  }

  const parsed = parseOracleResolution(response);

  return {
    ...parsed,
    provider: 'fallback',
    fallback_triggered: true,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a prediction market using MiniMax m2.7 (primary) with Vertex fallback.
 *
 * Returns the oracle resolution result. Callers must check confidence_score
 * against MIN_CONFIDENCE_THRESHOLD to decide auto-resolve vs human tribunal.
 */
export async function resolveWithMiniMaxOracle(
  marketId: string,
  marketQuestion: string,
  resolutionCriteria?: string,
  existingEvidence?: string[]
): Promise<OracleResolutionResult> {
  const prompt = buildOraclePrompt(marketQuestion, resolutionCriteria, existingEvidence);

  // Try MiniMax first
  let rawResponse: string;
  let parsed: ReturnType<typeof parseOracleResolution>;
  let provider: 'minimax' | 'fallback' = 'minimax';
  let fallbackTriggered = false;

  try {
    const result = await generateWithMiniMax(prompt, {
      model: 'MiniMax-M2.7',
      temperature: 0.1, // Low temperature for factual accuracy
      maxTokens: 4096,
      systemPrompt: ORACLE_SYSTEM_PROMPT,
    });

    rawResponse = result.content;
    parsed = parseOracleResolution(rawResponse);
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    const is5xx =
      errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('ECONNREFUSED');

    if (is5xx || error instanceof OracleParsingError) {
      logOracleFallback('oracle_resolution', errorMessage);
      try {
        const fallbackResult = await executeWithVertexFallback(
          marketQuestion,
          resolutionCriteria,
          existingEvidence
        );
        rawResponse = ''; // We don't have raw response from fallback in this flow
        parsed = fallbackResult;
        provider = 'fallback';
        fallbackTriggered = true;
      } catch (fallbackError: any) {
        throw new OracleParsingError(
          `MiniMax failed: ${errorMessage}. Vertex fallback also failed: ${fallbackError.message}`,
          'both-failed'
        );
      }
    } else {
      // 4xx or other errors — fail loud
      throw error;
    }
  }

  const result: OracleResolutionResult = {
    resolution: parsed.resolution,
    confidence_score: parsed.confidence_score,
    reasoning: parsed.reasoning,
    sources: parsed.sources,
    provider,
    fallback_triggered: fallbackTriggered,
  };

  // Audit log
  const auditLogId = await logOracleAudit(marketId, prompt, rawResponse || '', result);
  if (auditLogId) {
    result.audit_log_id = auditLogId;
  }

  return result;
}

// ─── Threshold Check ────────────────────────────────────────────────────────────────────────────

/**
 * Check if an oracle result meets the auto-resolution threshold.
 * Returns true if the market can be auto-resolved.
 */
export function meetsAutoResolutionThreshold(result: OracleResolutionResult): boolean {
  return (
    result.resolution !== 'UNKNOWN' &&
    result.confidence_score >= MIN_CONFIDENCE_THRESHOLD
  );
}

/**
 * Determine the next action based on oracle result.
 * Returns 'auto_resolve' | 'human_tribunal' | 'failed'.
 */
export function determineResolutionAction(result: OracleResolutionResult): 'auto_resolve' | 'human_tribunal' | 'failed' {
  if (result.resolution === 'UNKNOWN' || result.confidence_score < MIN_CONFIDENCE_THRESHOLD) {
    return 'human_tribunal';
  }
  return 'auto_resolve';
}
