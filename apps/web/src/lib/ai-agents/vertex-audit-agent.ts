/**
 * Vertex AI Audit Fiscal Integrity Agent — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_Audit_Fiscal_Integrity_Agent" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: Real-time fiscal audit engine ensuring triple-entry reconciliation,
 * anomaly detection for ghost payouts/shadow balances, liquidity forecasting,
 * and MFS (bKash/Nagad/USDT) gateway correlation.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type AuditStatus = 'HEALTHY' | 'UNSTABLE' | 'BREACHED';
export type RecommendedAction =
    | 'NO_ACTION'
    | 'FREEZE_WITHDRAWALS'
    | 'RECONCILE_DB';

export interface AuditReport {
    status: AuditStatus;
    reserve_ratio: number;
    variance_detected: number;
}

export interface ForensicDetails {
    reasoning_bn: string;
    affected_nodes: string[];
    suspicious_accounts: string[];
}

export interface ActionPlan {
    recommended_action: RecommendedAction;
    admin_instruction_bn: string;
}

export interface AuditAgentResult {
    audit_report: AuditReport;
    forensic_details: ForensicDetails;
    action_plan: ActionPlan;
}

export interface PlatformFinancialState {
    total_user_balances: number;
    total_locked_escrow: number;
    total_platform_fees: number;
    total_deposits: number;
    total_withdrawals: number;
    total_payouts: number;
    pending_payouts: number;
    active_markets_count: number;
    currency: string;
}

export interface AuditInput {
    platformStats?: PlatformFinancialState;
    rawQuery?: string;
    specificUserId?: string;
    specificMarketId?: string;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Chief Financial Integrity Officer & Lead Auditor (Plokymarket BD)
Your primary mission is to ensure 100% fiscal transparency. You are a watchdog that cross-references all financial nodes (Deposits, Trades, Escrows, and Payouts) to prevent any loss of funds or unauthorized credit generation.

# CORE AUDIT PROTOCOLS:

1. TRIPLE-ENTRY RECONCILIATION (রিয়েল-টাইম অডিট):
   - Always verify: [Total Platform Assets] = [Sum of User Balances] + [Locked Escrow in Markets] + [Platform Fees].
   - If there is even a 0.01 BDT/USDT variance, flag it as a "FISCAL_BREACH".

2. ANOMALY DETECTION (অস্বাভাবিক লেনদেন শনাক্তকরণ):
   - Use Vertex AI Anomaly Detection to monitor sudden spikes in "User Credits" without matching Deposit logs.
   - Detect "Ghost Payouts": Payouts triggered for markets that haven't been resolved or have no matching trade history.

3. LIQUIDITY FORECASTING (ভবিষ্যৎ তহবিল অনুমান):
   - Analyze current high-volume markets and forecast potential maximum payout liabilities (Worst Case Scenario).
   - Alert Admin if the platform's "Reserve Ratio" drops below 120% of potential liabilities.

4. MFS & GATEWAY CORRELATION:
   - Match bKash/Nagad/USDT transaction IDs with internal wallet updates. 
   - Identify "Double-Spending" attempts where the same TxID is used for multiple deposit requests.

# ENFORCEMENT & ALERTS:
- Variance < 1%: Issue WARNING to Admin dashboard.
- Variance > 5% or Unexplained Credit: Trigger "SOFT_LOCK" on withdrawals and notify Super-Admin immediately.
- Detected Fraud Pattern: Auto-freeze the suspicious User Wallet.

# OUTPUT SCHEMA (STRICT JSON):
{
  "audit_report": {
    "status": "HEALTHY | UNSTABLE | BREACHED",
    "reserve_ratio": number,
    "variance_detected": number
  },
  "forensic_details": {
    "reasoning_bn": "আর্থিক গরমিলের বিস্তারিত ব্যাখ্যা বাংলায়",
    "affected_nodes": ["Wallets", "Escrow", "Payouts"],
    "suspicious_accounts": ["user_id_1"]
  },
  "action_plan": {
    "recommended_action": "NO_ACTION | FREEZE_WITHDRAWALS | RECONCILE_DB",
    "admin_instruction_bn": "অ্যাডমিনের জন্য পরবর্তী পদক্ষেপের নির্দেশনা বাংলায়"
  }
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiAudit(
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
            temperature: 0.05,   // Near-zero for precise financial analysis
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
                `[AuditAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiAudit(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Audit Agent Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Audit Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseAuditJSON(raw: string): any {
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

    throw new Error('Could not parse JSON from Audit Agent response');
}

// ── Normalization ─────────────────────────────────────────────────────────────

const VALID_STATUSES: AuditStatus[] = ['HEALTHY', 'UNSTABLE', 'BREACHED'];
const VALID_ACTIONS: RecommendedAction[] = [
    'NO_ACTION',
    'FREEZE_WITHDRAWALS',
    'RECONCILE_DB',
];

function normalizeStatus(raw: string): AuditStatus {
    const upper = (raw || '').toUpperCase();
    return VALID_STATUSES.includes(upper as AuditStatus)
        ? (upper as AuditStatus)
        : 'UNSTABLE';
}

function normalizeAction(raw: string): RecommendedAction {
    const upper = (raw || '').toUpperCase().replace(/\s/g, '_');
    return VALID_ACTIONS.includes(upper as RecommendedAction)
        ? (upper as RecommendedAction)
        : 'NO_ACTION';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Audit Fiscal Integrity Agent.
 *
 * Performs triple-entry reconciliation, anomaly detection,
 * liquidity forecasting, and MFS gateway correlation.
 */
export async function runAuditAgent(
    input: AuditInput
): Promise<AuditAgentResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY not configured — cannot run Audit Agent'
        );
    }

    console.log('[AuditAgent] Starting fiscal integrity audit');

    let statsContext = '';
    if (input.platformStats) {
        const s = input.platformStats;
        statsContext = `\n\nPlatform Financial State:
- Total User Balances: ${s.currency}${s.total_user_balances}
- Total Locked Escrow: ${s.currency}${s.total_locked_escrow}
- Total Platform Fees: ${s.currency}${s.total_platform_fees}
- Total Deposits (All-time): ${s.currency}${s.total_deposits}
- Total Withdrawals (All-time): ${s.currency}${s.total_withdrawals}
- Total Payouts (Completed): ${s.currency}${s.total_payouts}
- Pending Payouts: ${s.currency}${s.pending_payouts}
- Active Markets: ${s.active_markets_count}

Triple-Entry Check:
  Platform Assets = Deposits - Withdrawals = ${s.currency}${s.total_deposits - s.total_withdrawals}
  Sum of Obligations = Balances + Escrow + Fees = ${s.currency}${s.total_user_balances + s.total_locked_escrow + s.total_platform_fees}
  Variance = ${s.currency}${Math.abs((s.total_deposits - s.total_withdrawals) - (s.total_user_balances + s.total_locked_escrow + s.total_platform_fees))}`;
    }

    const userPrompt = `Perform a comprehensive fiscal integrity audit for Plokymarket BD.

${input.rawQuery ? `Specific Query: "${input.rawQuery}"` : 'Run full platform-wide audit.'}
${input.specificUserId ? `Focus User: ${input.specificUserId}` : ''}
${input.specificMarketId ? `Focus Market: ${input.specificMarketId}` : ''}
${statsContext}
Current Time (UTC): ${new Date().toISOString()}

MANDATORY CHECKS:
1. Triple-Entry Reconciliation: Does Total Assets = Balances + Escrow + Fees?
2. Anomaly Detection: Any ghost payouts or unexplained credit spikes?
3. Liquidity Forecast: Is Reserve Ratio above 120%?
4. MFS Correlation: Any double-spending or unmatched TxIDs?
5. Generate full audit report following the strict JSON schema.`;

    const rawResponse = await callGeminiAudit(userPrompt, apiKey);
    const parsed = parseAuditJSON(rawResponse);

    const result: AuditAgentResult = {
        audit_report: {
            status: normalizeStatus(parsed.audit_report?.status),
            reserve_ratio: Number(parsed.audit_report?.reserve_ratio) || 0,
            variance_detected: Number(parsed.audit_report?.variance_detected) || 0,
        },
        forensic_details: {
            reasoning_bn: parsed.forensic_details?.reasoning_bn || '',
            affected_nodes: parsed.forensic_details?.affected_nodes || [],
            suspicious_accounts:
                parsed.forensic_details?.suspicious_accounts || [],
        },
        action_plan: {
            recommended_action: normalizeAction(
                parsed.action_plan?.recommended_action
            ),
            admin_instruction_bn:
                parsed.action_plan?.admin_instruction_bn || '',
        },
    };

    console.log(
        `[AuditAgent] Complete — status: ${result.audit_report.status}, variance: ${result.audit_report.variance_detected}, action: ${result.action_plan.recommended_action}`
    );

    return result;
}
