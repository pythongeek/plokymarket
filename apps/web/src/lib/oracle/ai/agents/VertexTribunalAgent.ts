/**
 * Vertex AI Supreme Tribunal Pro — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_Supreme_Tribunal_Pro" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: Final Court of Appeal for disputed market resolutions.
 * Analyzes evidence with "beyond reasonable doubt" standard,
 * source authority hierarchy, and Bengali legal reasoning.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type TribunalOutcome = 'YES' | 'NO' | 'CANCELLED';
export type AdminAction = 'EXECUTE_PAYOUT' | 'REFUND_ALL' | 'BAN_CHALLENGER';
export type SourceReliability = 'High' | 'Medium';

export interface TribunalVerdict {
    final_outcome: TribunalOutcome;
    verdict_code: string;
    certainty_score: number;
}

export interface EvidenceAnalysisItem {
    source: string;
    reliability: SourceReliability;
    key_finding_bn: string;
}

export interface TribunalResult {
    tribunal_verdict: TribunalVerdict;
    judicial_reasoning_bn: string;
    evidence_analysis: EvidenceAnalysisItem[];
    admin_action: AdminAction;
}

export interface DisputeInput {
    marketId: string;
    marketQuestion: string;
    originalOutcome: string;
    challengerUserId?: string;
    challengeReason?: string;
    evidenceUrls?: string[];
    oracleEvidence?: string;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Supreme Justice & Evidence Synthesis Specialist (Plokymarket BD)
You are the "Final Court of Appeal" for Plokymarket Bangladesh. Your goal is to resolve complex disputes where the initial Oracle resolution is challenged. You must act with absolute neutrality, using a "beyond reasonable doubt" standard.

# CORE DISPUTE RESOLUTION PROTOCOLS:

1. MULTI-MODAL EVIDENCE SYNTHESIS:
   - Analyze diverse data types: Tier-1 News Articles, Official Government Gazettes (PDF/Image), and Verified Video Broadcasts.
   - Cross-examine timestamps: Ensure the evidence provided was true at the time of market expiry.

2. CONFLICT RESOLUTION LOGIC:
   - If Source A says "YES" and Source B says "NO", evaluate their authority. 
   - Hierarchy: Official Gazette > Supreme Court Order > Election Commission > Tier-1 Media (Prothom Alo) > Tier-2 Media.
   - Identify "Contextual Nuance": Did the event actually happen, or was it just announced? (e.g., A player being "selected" vs. actually "playing" in the XI).

3. BENGALI LEGAL REASONING (ভারডিক্ট রাইটিং):
   - Provide a structured "Final Judgment" in professional, high-standard Bangla.
   - Sections: [অভিযোগের সারসংক্ষেপ], [বিশ্লেষিত প্রমাণাদি], [যৌক্তিক সিদ্ধান্ত], [চূড়ান্ত রায়]।

4. ANTI-COLLUSION CHECK:
   - Identify if the dispute itself is an attempt to manipulate the market (Sybil Attack on disputes).
   - Flag "frivolous challenges" that have zero evidence.

# OPERATIONAL RULES:
- If evidence is 100% conclusive: Resolve the market immediately.
- If evidence is 50/50 or ambiguous: Invoke the "Nullification Clause" and refund all trades.
- NEVER rely on social media sentiment or rumors.

# OUTPUT SCHEMA (STRICT JSON):
{
  "tribunal_verdict": {
    "final_outcome": "YES | NO | CANCELLED",
    "verdict_code": "JUDICIAL_CONFIRMATION_001",
    "certainty_score": 0.00-1.00
  },
  "judicial_reasoning_bn": "পূর্ণাঙ্গ রায়ের ব্যাখ্যা বাংলায়",
  "evidence_analysis": [
    {
      "source": "Name of source",
      "reliability": "High | Medium",
      "key_finding_bn": "সোর্স থেকে পাওয়া মূল তথ্য"
    }
  ],
  "admin_action": "EXECUTE_PAYOUT | REFUND_ALL | BAN_CHALLENGER"
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiTribunal(
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
            temperature: 0.05,   // Near-zero for judicial objectivity
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
                `[TribunalAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiTribunal(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Tribunal Agent Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Tribunal Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseTribunalJSON(raw: string): any {
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

    throw new Error('Could not parse JSON from Tribunal Agent response');
}

// ── Normalization ─────────────────────────────────────────────────────────────

const VALID_OUTCOMES: TribunalOutcome[] = ['YES', 'NO', 'CANCELLED'];
const VALID_ACTIONS: AdminAction[] = [
    'EXECUTE_PAYOUT',
    'REFUND_ALL',
    'BAN_CHALLENGER',
];

function normalizeOutcome(raw: string): TribunalOutcome {
    const upper = (raw || '').toUpperCase();
    return VALID_OUTCOMES.includes(upper as TribunalOutcome)
        ? (upper as TribunalOutcome)
        : 'CANCELLED';
}

function normalizeAction(raw: string): AdminAction {
    const upper = (raw || '').toUpperCase().replace(/\s/g, '_');
    return VALID_ACTIONS.includes(upper as AdminAction)
        ? (upper as AdminAction)
        : 'REFUND_ALL';
}

function normalizeReliability(raw: string): SourceReliability {
    return (raw || '').toLowerCase() === 'high' ? 'High' : 'Medium';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Supreme Tribunal Pro.
 *
 * Final Court of Appeal for disputed market resolutions.
 * Analyzes evidence with judicial objectivity and Bengali legal reasoning.
 */
export async function runTribunalAgent(
    input: DisputeInput
): Promise<TribunalResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY not configured — cannot run Tribunal Agent'
        );
    }

    console.log(
        `[TribunalAgent] Opening dispute case for market ${input.marketId}: "${input.marketQuestion.substring(0, 60)}"`
    );

    let evidenceContext = '';
    if (input.evidenceUrls && input.evidenceUrls.length > 0) {
        evidenceContext = `\n\nChallenger's Evidence URLs:\n${input.evidenceUrls
            .map((u, i) => `${i + 1}. ${u}`)
            .join('\n')}`;
    }

    const userPrompt = `# DISPUTE CASE — SUPREME TRIBUNAL REVIEW

Market ID: ${input.marketId}
Market Question: "${input.marketQuestion}"
Original Oracle Outcome: ${input.originalOutcome}
${input.challengerUserId ? `Challenger User ID: ${input.challengerUserId}` : ''}
${input.challengeReason ? `Challenge Reason: "${input.challengeReason}"` : ''}
${input.oracleEvidence ? `Original Oracle Evidence: "${input.oracleEvidence}"` : ''}
${evidenceContext}
Current Time (UTC): ${new Date().toISOString()}

INSTRUCTIONS:
1. Use Google Search to independently verify the original Oracle outcome.
2. Cross-reference with Tier-1 official BD sources (Bangladesh Bank, ICC/BCB, Election Commission, official gazettes).
3. Evaluate the challenger's evidence against the source authority hierarchy.
4. Write a structured Bengali judicial reasoning with sections: [অভিযোগের সারসংক্ষেপ], [বিশ্লেষিত প্রমাণাদি], [যৌক্তিক সিদ্ধান্ত], [চূড়ান্ত রায়]
5. Check for anti-collusion: Is this a frivolous challenge?
6. Generate the full verdict following the strict JSON schema.`;

    const rawResponse = await callGeminiTribunal(userPrompt, apiKey);
    const parsed = parseTribunalJSON(rawResponse);

    const result: TribunalResult = {
        tribunal_verdict: {
            final_outcome: normalizeOutcome(
                parsed.tribunal_verdict?.final_outcome
            ),
            verdict_code:
                parsed.tribunal_verdict?.verdict_code ||
                'JUDICIAL_CONFIRMATION_001',
            certainty_score: Math.max(
                0,
                Math.min(1, Number(parsed.tribunal_verdict?.certainty_score) || 0)
            ),
        },
        judicial_reasoning_bn: parsed.judicial_reasoning_bn || '',
        evidence_analysis: (parsed.evidence_analysis || []).map((e: any) => ({
            source: e.source || '',
            reliability: normalizeReliability(e.reliability),
            key_finding_bn: e.key_finding_bn || '',
        })),
        admin_action: normalizeAction(parsed.admin_action),
    };

    console.log(
        `[TribunalAgent] Verdict — outcome: ${result.tribunal_verdict.final_outcome}, certainty: ${result.tribunal_verdict.certainty_score}, action: ${result.admin_action}`
    );

    return result;
}
