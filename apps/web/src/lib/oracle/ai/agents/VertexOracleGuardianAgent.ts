/**
 * Vertex AI Oracle Guardian BD Prime — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Oracle_Guardian_BD_Prime" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: Final arbiter of truth for market resolution.
 * Uses Tiered Source Authority (TSA) from whitelisted BD news sources,
 * anti-fake news shield, and confidence-based auto/manual resolution.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type OracleOutcome = 'YES' | 'NO' | 'UNRESOLVED' | 'CANCELLED';
export type SourceConsistency = 'CONSISTENT' | 'CONFLICTING';

export interface OracleDecision {
    outcome: OracleOutcome;
    confidence_score: number;
    certainty_level_bn: string;
}

export interface EvidenceVault {
    primary_source: string;
    supporting_sources: string[];
    extracted_quote_bn: string;
}

export interface OracleMetadata {
    processed_at: string;
    source_consistency: SourceConsistency;
}

export interface OracleGuardianResult {
    oracle_decision: OracleDecision;
    evidence_vault: EvidenceVault;
    resolution_summary_bn: string;
    metadata: OracleMetadata;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Chief Truth Officer & Oracle Specialist (Plokymarket BD)
You are the final arbiter of truth for Plokymarket Bangladesh. Your mission is to provide 100% accurate, evidence-backed resolutions for prediction markets using a Tiered Source Strategy.

# CORE OPERATIONAL PROTOCOLS:

1. TIERED SOURCE AUTHORITY (TSA):
   - Tier 1 (Official): Bangladesh Bank, Election Commission BD, Supreme Court, ICC/BCB Official Portals. (Weight: 1.0)
   - Tier 2 (Validated News): Prothom Alo, Daily Star, BDNews24, Ittefaq. (Weight: 0.8)
   - Tier 3 (Broadcasting): Jamuna TV, Somoy News, Independent TV (Verified Portals only). (Weight: 0.6)
   - STRICT RULE: Ignore all Social Media (Facebook, X, TikTok) and unverified blogs.

2. BENGALI KEYWORD TUNING & CONTEXT:
   - Identify local political and social triggers: "হরতাল" (Strike), "অবরোধ" (Blockade), "তত্ত্বাবধায়ক" (Caretaker), "গেজেট" (Gazette).
   - Understand the difference between a "Propose" (প্রস্তাব) and a "Passed/Effective" (কার্যকর) law or event.

3. CONFIDENCE THRESHOLD & RESOLUTION:
   - Political Events: Require 95%+ Confidence and at least two Tier 1 or Tier 2 sources.
   - Sports Events: Require 90%+ Confidence from official scorecards.
   - If Confidence is < 90% due to conflicting reports, set status as "UNRESOLVED".

4. ANTI-FAKE NEWS SHIELD:
   - Scan for "Clickbait" patterns in Bangla news.
   - Cross-check timestamps: If only one source reports something and others don't follow within 2 hours, flag as "SUSPICIOUS".

# OUTPUT SCHEMA (STRICT JSON):
{
  "oracle_decision": {
    "outcome": "YES | NO | UNRESOLVED | CANCELLED",
    "confidence_score": 0.00-1.00,
    "certainty_level_bn": "নিশ্চয়তার মাত্রা (যেমন: অত্যন্ত উচ্চ)"
  },
  "evidence_vault": {
    "primary_source": "URL of the most authoritative source",
    "supporting_sources": ["URL 1", "URL 2"],
    "extracted_quote_bn": "সোর্স থেকে প্রাপ্ত মূল তথ্য বা উক্তি বাংলায়"
  },
  "resolution_summary_bn": "ফলাফল ঘোষণার সপক্ষে চূড়ান্ত যুক্তি বাংলায়",
  "metadata": {
    "processed_at": "ISO 8601",
    "source_consistency": "CONSISTENT | CONFLICTING"
  }
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiOracle(
    userPrompt: string,
    apiKey: string,
    model: string = PRIMARY_MODEL
): Promise<string> {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const body = {
        system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: userPrompt }],
            },
        ],
        tools: [
            {
                google_search: {},
            },
        ],
        generationConfig: {
            temperature: 0.05,   // Near-zero for maximum factual accuracy
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
        },
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();

        if (
            model === PRIMARY_MODEL &&
            (errText.includes('not found') ||
                errText.includes('not supported') ||
                errText.includes('is not available'))
        ) {
            console.warn(
                `[OracleGuardian] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiOracle(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Oracle Guardian Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Oracle Guardian');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseOracleJSON(raw: string): any {
    try {
        return JSON.parse(raw);
    } catch {
        // noop
    }

    const mdMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (mdMatch) {
        try {
            return JSON.parse(mdMatch[1].trim());
        } catch {
            // noop
        }
    }

    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
        return JSON.parse(braceMatch[0]);
    }

    throw new Error('Could not parse JSON from Oracle Guardian response');
}

// ── Outcome normalization ─────────────────────────────────────────────────────

const VALID_OUTCOMES: OracleOutcome[] = ['YES', 'NO', 'UNRESOLVED', 'CANCELLED'];

function normalizeOutcome(raw: string): OracleOutcome {
    const upper = (raw || '').toUpperCase();
    return VALID_OUTCOMES.includes(upper as OracleOutcome)
        ? (upper as OracleOutcome)
        : 'UNRESOLVED';
}

function normalizeConsistency(raw: string): SourceConsistency {
    const upper = (raw || '').toUpperCase();
    if (upper === 'CONSISTENT') return 'CONSISTENT';
    if (upper === 'CONFLICTING') return 'CONFLICTING';
    return 'CONSISTENT';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Oracle Guardian BD Prime.
 *
 * Provides evidence-backed market resolution decisions using
 * Tiered Source Authority from whitelisted BD news and official portals.
 */
export async function runOracleGuardianAgent(
    marketQuestion: string,
    resolutionCriteria?: string,
    existingEvidence?: string[]
): Promise<OracleGuardianResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY not configured — cannot run Oracle Guardian'
        );
    }

    console.log(
        '[OracleGuardian] Starting resolution analysis for:',
        marketQuestion.substring(0, 80)
    );

    let evidenceContext = '';
    if (existingEvidence && existingEvidence.length > 0) {
        evidenceContext = `\n\nExisting Evidence Sources:\n${existingEvidence
            .map((e, i) => `${i + 1}. ${e}`)
            .join('\n')}`;
    }

    const userPrompt = `Resolve the following Plokymarket BD prediction market with absolute accuracy.

Market Question: "${marketQuestion}"
${resolutionCriteria ? `Resolution Criteria: "${resolutionCriteria}"` : ''}
Current Time (UTC): ${new Date().toISOString()}
${evidenceContext}

MANDATORY STEPS:
1. Use Google Search to find the LATEST information from Tier 1 and Tier 2 Bangladesh sources.
2. Cross-reference at least 2 independent sources before making a decision.
3. If sources conflict or the event hasn't occurred yet, set outcome to "UNRESOLVED".
4. Extract a direct Bengali quote from the primary source.
5. Generate the full Oracle decision following the strict JSON schema.`;

    const rawResponse = await callGeminiOracle(userPrompt, apiKey);
    const parsed = parseOracleJSON(rawResponse);

    const result: OracleGuardianResult = {
        oracle_decision: {
            outcome: normalizeOutcome(parsed.oracle_decision?.outcome),
            confidence_score: Math.max(
                0,
                Math.min(1, Number(parsed.oracle_decision?.confidence_score) || 0)
            ),
            certainty_level_bn:
                parsed.oracle_decision?.certainty_level_bn || '',
        },
        evidence_vault: {
            primary_source: parsed.evidence_vault?.primary_source || '',
            supporting_sources: parsed.evidence_vault?.supporting_sources || [],
            extracted_quote_bn:
                parsed.evidence_vault?.extracted_quote_bn || '',
        },
        resolution_summary_bn: parsed.resolution_summary_bn || '',
        metadata: {
            processed_at:
                parsed.metadata?.processed_at || new Date().toISOString(),
            source_consistency: normalizeConsistency(
                parsed.metadata?.source_consistency
            ),
        },
    };

    console.log(
        `[OracleGuardian] Complete — outcome: ${result.oracle_decision.outcome}, confidence: ${result.oracle_decision.confidence_score}, consistency: ${result.metadata.source_consistency}`
    );

    return result;
}

// ── Auto-resolution threshold constants ───────────────────────────────────────

/** Political events require 95%+ confidence from 2+ Tier 1/2 sources */
export const POLITICAL_THRESHOLD = 0.95;

/** Sports events require 90%+ confidence */
export const SPORTS_THRESHOLD = 0.90;

/** Default threshold for other categories */
export const DEFAULT_THRESHOLD = 0.95;

/**
 * Check if the Oracle result meets the auto-resolution threshold.
 */
export function meetsAutoResolutionThreshold(
    result: OracleGuardianResult,
    category?: string
): boolean {
    const threshold =
        category?.toLowerCase() === 'sports'
            ? SPORTS_THRESHOLD
            : category?.toLowerCase() === 'politics'
                ? POLITICAL_THRESHOLD
                : DEFAULT_THRESHOLD;

    return (
        result.oracle_decision.confidence_score >= threshold &&
        result.oracle_decision.outcome !== 'UNRESOLVED' &&
        result.oracle_decision.outcome !== 'CANCELLED' &&
        result.metadata.source_consistency === 'CONSISTENT'
    );
}
