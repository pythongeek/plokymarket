/**
 * Vertex AI Quant Logic Architect — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_Quant_Logic_Architect" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: LMSR-based market design with dynamic classification, quantitative
 * parameters, settlement protocols, and anti-manipulation guardrails.
 */

import type { AgentContext, MarketLogicResult } from './types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface QuantMarketLogic {
    type: 'Binary' | 'Categorical' | 'Scalar';
    title_bn: string;
    rules_summary_bn: string;
    nullification_clause_bn: string;
}

export interface QuantParams {
    initial_b_parameter: number;
    starting_price_yes: number;
    recommended_liquidity_cap: number;
    fee_tier: 'Standard' | 'High Volatility';
}

export interface OracleInstructions {
    primary_trigger: string;
    resolution_timestamp: string;
    verification_method: string;
}

export interface QuantLogicAgentResult {
    market_logic: QuantMarketLogic;
    quant_params: QuantParams;
    oracle_instructions: OracleInstructions;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Senior Quantitative Architect & Prediction Market Engineer
You are the lead logic designer for Plokymarket BD. Your goal is to outperform platforms like Polymarket by providing mathematical precision and clear resolution frameworks that eliminate ambiguity.

# CORE OPERATIONAL PROTOCOLS:

1. DYNAMIC MARKET CLASSIFICATION:
   - Go beyond Binary (Yes/No). Evaluate if the event should be:
     a) Binary: Single event outcome.
     b) Categorical: Multi-choice (e.g., Who will win the 5-nation tournament?).
     c) Scalar: Range-based outcomes (e.g., What will be the USD-BDT rate? Range: 110-130).

2. QUANTITATIVE PARAMETERS (LMSR Engine):
   - Calculate the 'B-Parameter' (Liquidity depth) based on expected volume.
   - Suggest Initial Odds (e.g., 50/50 or weighted based on news sentiment).
   - Apply a dynamic 2% - 3.5% fee structure based on the Risk Score.

3. SETTLEMENT PROTOCOL (Eliminating Ambiguity):
   - Every market must have a "Nullification Clause" (e.g., If the match is abandoned due to rain and no DLS result is produced, the market resolves to 50/50 or refund).
   - Define exact "Resolution Data Points" (e.g., Not just 'news', but 'The closing value on the Bangladesh Bank website at 4:00 PM GMT+6').

4. ANTI-MANIPULATION GUARDRAILS:
   - Identify if the market logic is prone to "Insider Information" (e.g., narrow niche events).
   - Flag any logic that could lead to "Infinite Arbitrage".

# WRITING STYLE & LOCALIZATION:
- Output the 'Title' and 'Resolution Criteria' in high-standard professional Bangla.
- Use native terminology for local context (e.g., "টাকা", "নির্বাচন কমিশন", "বিসিবি নিয়মাবলী").

# OUTPUT SCHEMA (STRICT JSON):
{
  "market_logic": {
    "type": "Binary | Categorical | Scalar",
    "title_bn": "মার্কেটের শিরোনাম (বাংলা)",
    "rules_summary_bn": "খুবই স্পষ্ট এবং আইনি ভাষায় শর্তাবলী",
    "nullification_clause_bn": "বাতিল হওয়ার শর্ত বাংলায়"
  },
  "quant_params": {
    "initial_b_parameter": number,
    "starting_price_yes": 0.00-1.00,
    "recommended_liquidity_cap": number,
    "fee_tier": "Standard | High Volatility"
  },
  "oracle_instructions": {
    "primary_trigger": "URL or Data Point",
    "resolution_timestamp": "ISO 8601",
    "verification_method": "Step-by-step resolution process for Admin"
  }
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiQuantLogic(
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
            temperature: 0.2,
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
                `[QuantLogicAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiQuantLogic(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Quant Logic Agent Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Quant Logic Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseQuantJSON(raw: string): any {
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

    throw new Error('Could not parse JSON from Quant Logic Agent response');
}

// ── Map quant type to MarketLogicResult type ──────────────────────────────────

function mapMarketType(
    quantType: string
): 'binary' | 'categorical' | 'scalar' {
    const lc = (quantType || '').toLowerCase();
    if (lc.includes('categorical')) return 'categorical';
    if (lc.includes('scalar')) return 'scalar';
    return 'binary';
}

// ── Derive fee from fee tier ──────────────────────────────────────────────────

function feeFromTier(tier: string): number {
    if (tier === 'High Volatility') return 0.035;
    return 0.02;
}

// ── Derive outcomes from market type ──────────────────────────────────────────

function deriveOutcomes(
    marketType: 'binary' | 'categorical' | 'scalar',
    context: AgentContext
): string[] {
    if (context.outcomes && context.outcomes.length > 0) {
        return context.outcomes;
    }
    if (marketType === 'binary') {
        return ['হ্যাঁ', 'না'];
    }
    return ['হ্যাঁ', 'না'];
}

// ── Main exports ──────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Quant Logic Architect.
 * Returns the raw agent output with LMSR params, nullification clauses, etc.
 */
export async function runQuantLogicAgent(
    context: AgentContext
): Promise<QuantLogicAgentResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY not configured — cannot run Quant Logic Agent'
        );
    }

    const title = context.title || context.rawInput || '';

    console.log(
        '[QuantLogicAgent] Starting analysis for:',
        title.substring(0, 60)
    );

    const userPrompt = `Design the optimal prediction market structure for the following event on Plokymarket BD.

Event Title: "${title}"
${context.category ? `Category: ${context.category}` : ''}
${context.description ? `Description: "${context.description}"` : ''}
${context.outcomes && context.outcomes.length > 0 ? `Current Outcomes: ${JSON.stringify(context.outcomes)}` : ''}
${context.tradingClosesAt ? `Trading Closes: ${context.tradingClosesAt}` : ''}

Use Google Search to find the latest odds, sentiment data, and relevant context for calibrating the LMSR parameters. Generate the full market design following the strict JSON schema.`;

    const rawResponse = await callGeminiQuantLogic(userPrompt, apiKey);
    const parsed = parseQuantJSON(rawResponse);

    // Normalize the output
    const result: QuantLogicAgentResult = {
        market_logic: {
            type: parsed.market_logic?.type || 'Binary',
            title_bn: parsed.market_logic?.title_bn || title,
            rules_summary_bn: parsed.market_logic?.rules_summary_bn || '',
            nullification_clause_bn:
                parsed.market_logic?.nullification_clause_bn || '',
        },
        quant_params: {
            initial_b_parameter: Number(parsed.quant_params?.initial_b_parameter) || 100,
            starting_price_yes:
                Number(parsed.quant_params?.starting_price_yes) || 0.5,
            recommended_liquidity_cap:
                Number(parsed.quant_params?.recommended_liquidity_cap) || 5000,
            fee_tier: parsed.quant_params?.fee_tier || 'Standard',
        },
        oracle_instructions: {
            primary_trigger: parsed.oracle_instructions?.primary_trigger || '',
            resolution_timestamp:
                parsed.oracle_instructions?.resolution_timestamp || '',
            verification_method:
                parsed.oracle_instructions?.verification_method || '',
        },
    };

    console.log(
        `[QuantLogicAgent] Complete — type: ${result.market_logic.type}, B: ${result.quant_params.initial_b_parameter}, fee: ${result.quant_params.fee_tier}`
    );

    return result;
}

/**
 * Run the Quant Logic Agent and map output to MarketLogicResult
 * for backward compatibility with the existing pipeline.
 */
export async function runQuantLogicAsMarketLogic(
    context: AgentContext
): Promise<MarketLogicResult> {
    const quantResult = await runQuantLogicAgent(context);

    const marketType = mapMarketType(quantResult.market_logic.type);
    const outcomes = deriveOutcomes(marketType, context);
    const fee = feeFromTier(quantResult.quant_params.fee_tier);

    return {
        marketType,
        outcomes,
        outcomeCount: outcomes.length,
        liquidityRecommendation: quantResult.quant_params.recommended_liquidity_cap,
        tradingFee: fee,
        minTradeAmount: 10,
        maxTradeAmount: Math.round(
            quantResult.quant_params.recommended_liquidity_cap * 0.5
        ),
        bParameter: quantResult.quant_params.initial_b_parameter,
        confidence: Math.min(1, Math.max(0.5, quantResult.quant_params.starting_price_yes + 0.3)),
    };
}
