/**
 * Vertex AI Sentinel Shield Pro — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Sentinel_Plokymarket_Shield_Pro" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: Elite fraud detection engine for Plokymarket BD.
 * Detects wash trading, sybil attacks, insider trading, and MFS/P2P AML risks.
 * Operates in the trading pipeline as a real-time security gate.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type ThreatType =
    | 'Wash Trading'
    | 'Sybil Attack'
    | 'Insider'
    | 'AML Alert'
    | 'None';

export type EnforcementAction = 'BLOCK' | 'FLAG' | 'NOTIFY' | 'FREEZE';

export interface FraudAssessment {
    risk_score: number;
    threat_type: ThreatType;
    is_actionable: boolean;
}

export interface EvidenceLog {
    reasoning_bn: string;
    linked_accounts: string[];
    suspicious_pattern: string;
}

export interface EnforcementDirective {
    action: EnforcementAction;
    admin_instruction_bn: string;
}

export interface SentinelAgentResult {
    fraud_assessment: FraudAssessment;
    evidence_log: EvidenceLog;
    enforcement_action: EnforcementDirective;
}

export interface SentinelInput {
    userId: string;
    behaviorLog?: UserActivityRecord[];
    currentTrade?: TradeData;
    marketId?: string;
    rawQuery?: string;
}

export interface UserActivityRecord {
    action: string;
    timestamp: string;
    amount?: number;
    marketId?: string;
    side?: 'buy' | 'sell';
    ip?: string;
    device?: string;
}

export interface TradeData {
    marketId: string;
    side: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: string;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Chief Security Intelligence Officer (Sentinel-Shield)
You are the elite fraud detection engine for Plokymarket BD. Your goal is to detect and neutralize market manipulation attempts in real-time, outperforming any centralized or decentralized competitor through behavioral predictive modeling.

# CORE DETECTION PROTOCOLS:

1. WASH TRADING DETECTION (Volume Manipulation):
   - Monitor for "Self-Matching" orders where a user or a group of linked users trade against each other to inflate volume.
   - Analyze frequency and timing: If Buy/Sell occurs within milliseconds between related accounts, flag as HIGH RISK.

2. SYBIL ATTACK & MULTI-ACCOUNT MAPPING:
   - Go beyond IP/Device tracking. Analyze "Behavioral Fingerprinting" (similar betting patterns, withdrawal to same MFS/Wallet).
   - Use Vertex AI Graph Analysis to find clusters of accounts that act as a single entity.

3. INSIDER TRADING & FRONT-RUNNING:
   - Identify "Anomalous Timing": Large bets placed minutes before a major news break or resolution.
   - Correlate news feed arrival time with trade execution timestamps.

4. LOCALIZED FINANCIAL FRAUD (MFS/P2P Risk):
   - Monitor bKash/Nagad/USDT P2P patterns for "Money Laundering" cycles.
   - Detect "Rapid Churn": Immediate withdrawal after winning without further activity.

# ACTION HIERARCHY (The Response Engine):
- Score 1-4 (LOW): Allow trade, log activity.
- Score 5-7 (MEDIUM): Flag for manual Admin review, shadow-ban from leaderboard.
- Score 8-10 (CRITICAL): Block trade instantly, freeze wallet, and trigger "Proof of Humanity" (KYC) re-verification.

# OUTPUT SCHEMA (STRICT JSON):
{
  "fraud_assessment": {
    "risk_score": 1-10,
    "threat_type": "Wash Trading | Sybil Attack | Insider | AML Alert",
    "is_actionable": boolean
  },
  "evidence_log": {
    "reasoning_bn": "কেন এটি জালিয়াতি মনে হচ্ছে তার বিস্তারিত ব্যাখ্যা বাংলায়",
    "linked_accounts": ["user_id_1", "user_id_2"],
    "suspicious_pattern": "Brief technical description of the pattern"
  },
  "enforcement_action": {
    "action": "BLOCK | FLAG | NOTIFY | FREEZE",
    "admin_instruction_bn": "অ্যাডমিনের জন্য পরবর্তী পদক্ষেপের নির্দেশনা বাংলায়"
  }
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiSentinel(
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
            temperature: 0.1,
            maxOutputTokens: 2048,
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
                `[SentinelAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiSentinel(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Sentinel Agent Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Sentinel Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseSentinelJSON(raw: string): any {
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

    throw new Error('Could not parse JSON from Sentinel Agent response');
}

// ── Threat type validation ────────────────────────────────────────────────────

const VALID_THREATS: ThreatType[] = [
    'Wash Trading',
    'Sybil Attack',
    'Insider',
    'AML Alert',
    'None',
];

function normalizeThreatType(raw: string): ThreatType {
    const match = VALID_THREATS.find(
        (t) => t.toLowerCase() === (raw || '').toLowerCase()
    );
    return match || 'None';
}

const VALID_ACTIONS: EnforcementAction[] = ['BLOCK', 'FLAG', 'NOTIFY', 'FREEZE'];

function normalizeAction(raw: string): EnforcementAction {
    const upper = (raw || '').toUpperCase();
    return VALID_ACTIONS.includes(upper as EnforcementAction)
        ? (upper as EnforcementAction)
        : 'NOTIFY';
}

// ── Determine enforcement action from risk score ──────────────────────────────

function deriveActionFromScore(score: number): EnforcementAction {
    if (score >= 8) return 'BLOCK';
    if (score >= 5) return 'FLAG';
    return 'NOTIFY';
}

// ── Main exports ──────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Sentinel Shield Pro Agent.
 *
 * Analyzes user behavior, trade data, and market context to detect
 * wash trading, sybil attacks, insider trading, and AML violations.
 */
export async function runSentinelAgent(
    input: SentinelInput
): Promise<SentinelAgentResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY not configured — cannot run Sentinel Agent'
        );
    }

    console.log(
        `[SentinelAgent] Analyzing user ${input.userId} for fraud indicators`
    );

    // Build behavior context
    let behaviorContext = '';
    if (input.behaviorLog && input.behaviorLog.length > 0) {
        const recentActivity = input.behaviorLog.slice(-20); // Last 20 actions
        behaviorContext = `\n\nRecent User Activity (last ${recentActivity.length} actions):\n${recentActivity
            .map(
                (a, i) =>
                    `${i + 1}. [${a.timestamp}] ${a.action}${a.amount ? ` — ৳${a.amount}` : ''}${a.side ? ` (${a.side})` : ''}${a.marketId ? ` market:${a.marketId}` : ''}`
            )
            .join('\n')}`;
    }

    let tradeContext = '';
    if (input.currentTrade) {
        tradeContext = `\n\nCurrent Trade Being Evaluated:
- Market: ${input.currentTrade.marketId}
- Side: ${input.currentTrade.side}
- Amount: ৳${input.currentTrade.amount}
- Price: ${input.currentTrade.price}
- Timestamp: ${input.currentTrade.timestamp}`;
    }

    const userPrompt = `Perform a real-time fraud analysis for the following trading activity on Plokymarket BD.

User ID: ${input.userId}
${input.marketId ? `Market ID: ${input.marketId}` : ''}
${input.rawQuery ? `Context: "${input.rawQuery}"` : ''}
${behaviorContext}
${tradeContext}

Analyze for:
1. Wash Trading — self-matching or coordinated volume inflation
2. Sybil Attack — multi-account behavioral fingerprinting
3. Insider Trading — anomalous timing relative to news/resolution events
4. AML (bKash/Nagad/USDT) — rapid churn or layering patterns

Use Google Search to check if there's any recent news about the related market that could indicate insider information timing. Generate the full fraud assessment following the strict JSON schema.`;

    const rawResponse = await callGeminiSentinel(userPrompt, apiKey);
    const parsed = parseSentinelJSON(rawResponse);

    // Normalize output
    const riskScore = Math.max(1, Math.min(10, Number(parsed.fraud_assessment?.risk_score) || 1));
    const threatType = normalizeThreatType(parsed.fraud_assessment?.threat_type);
    const isActionable = parsed.fraud_assessment?.is_actionable ?? riskScore >= 5;
    const action = normalizeAction(
        parsed.enforcement_action?.action || deriveActionFromScore(riskScore)
    );

    const result: SentinelAgentResult = {
        fraud_assessment: {
            risk_score: riskScore,
            threat_type: threatType,
            is_actionable: isActionable,
        },
        evidence_log: {
            reasoning_bn: parsed.evidence_log?.reasoning_bn || '',
            linked_accounts: parsed.evidence_log?.linked_accounts || [],
            suspicious_pattern: parsed.evidence_log?.suspicious_pattern || '',
        },
        enforcement_action: {
            action,
            admin_instruction_bn:
                parsed.enforcement_action?.admin_instruction_bn || '',
        },
    };

    console.log(
        `[SentinelAgent] Complete — risk: ${riskScore}/10, threat: ${threatType}, action: ${action}`
    );

    return result;
}
