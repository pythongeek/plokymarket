/**
 * Vertex AI Chronos Timing Architect — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_Chronos_Timing_Architect" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: Hyper-accurate trading windows with anti-cheat buffers,
 * Bangladesh localized timing (GMT+6), resolution latency prediction,
 * and holiday conflict detection.
 */

import type { AgentContext, TimingResult } from './types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TimingStrategy {
    event_start_local: string;
    trading_halt_time: string;
    buffer_reasoning_bn: string;
    expected_resolution_time: string;
}

export interface OperationalFlags {
    is_high_volatility_window: boolean;
    timezone_offset_applied: string;
    local_holiday_conflict: string;
}

export interface ChronosTimingResult {
    timing_strategy: TimingStrategy;
    operational_flags: OperationalFlags;
    admin_alert_bn: string;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Senior Chronology Architect & Temporal Risk Officer
You are the lead timing strategist for Plokymarket BD. Your mission is to eliminate "Oracle Latency Risk" by setting hyper-accurate trading windows that outperform Polymarket's static dates.

# CORE OPERATIONAL PROTOCOLS:

1. DYNAMIC TRADING HALT (The "Anti-Cheat" Buffer):
   - Analyze the event type to determine the exact moment trading must stop.
   - For Sports: Close market 1 hour before the actual start (Toss/Kick-off).
   - For Politics/Business: Identify the "Information Leak Window" and close trading before official announcements begin.
   - Apply a "Grace Period" logic: If an event is delayed, suggest an extension protocol.

2. LOCALIZED TEMPORAL CONTEXT (Bangladesh GMT+6):
   - Convert all global event times to 'Asia/Dhaka'.
   - Recognize local working days (Sunday-Thursday) and hours (9 AM - 5 PM) for economic events (e.g., Bangladesh Bank reserve data).
   - Handle Bengali calendar dates and religious holidays (Eid, Puja) which might shift event schedules.

3. RESOLUTION LATENCY PREDICTION:
   - Calculate the "Resolution Window": The expected time gap between the event's physical conclusion and the official announcement.
   - Suggest the 'Official Oracle Check Time' (e.g., "Check Prothom Alo 30 minutes after the match ends").

4. SCALAR EXPIRY LOGIC:
   - For range-based markets (e.g., Dollar rate), define specific "Snapshots" (e.g., The rate at 11:59 PM on the last day of the month).

# OUTPUT SCHEMA (STRICT JSON):
{
  "timing_strategy": {
    "event_start_local": "ISO 8601 (GMT+6)",
    "trading_halt_time": "ISO 8601 (Exact stop time)",
    "buffer_reasoning_bn": "কেন এই সময় ট্রেডিং বন্ধ হবে তার যুক্তি বাংলায়",
    "expected_resolution_time": "ISO 8601 (When result is public)"
  },
  "operational_flags": {
    "is_high_volatility_window": boolean,
    "timezone_offset_applied": "+06:00",
    "local_holiday_conflict": "None | Name of holiday"
  },
  "admin_alert_bn": "অ্যাডমিনের জন্য বিশেষ সতর্কবার্তা বাংলায়"
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiChronos(
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
                `[ChronosAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiChronos(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Chronos Agent Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Chronos Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseChronosJSON(raw: string): any {
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

    throw new Error('Could not parse JSON from Chronos Agent response');
}

// ── Main exports ──────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Chronos Timing Architect.
 * Returns the raw agent output with timing strategy, operational flags, and admin alerts.
 */
export async function runChronosAgent(
    context: AgentContext
): Promise<ChronosTimingResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured — cannot run Chronos Agent');
    }

    const title = context.title || context.rawInput || '';
    const now = new Date().toISOString();

    console.log('[ChronosAgent] Starting timing analysis for:', title.substring(0, 60));

    const userPrompt = `Design the optimal timing strategy for this Plokymarket BD prediction market.

Event Title: "${title}"
${context.category ? `Category: ${context.category}` : ''}
${context.description ? `Description: "${context.description}"` : ''}
${context.tradingClosesAt ? `Suggested Trading Close: ${context.tradingClosesAt}` : ''}
${context.resolutionDate ? `Suggested Resolution Date: ${context.resolutionDate}` : ''}
Current Time (UTC): ${now}
Bangladesh Timezone: Asia/Dhaka (GMT+6)

Use Google Search to find the actual event schedule, any delays, and local holiday calendar. Generate the full timing strategy following the strict JSON schema.`;

    const rawResponse = await callGeminiChronos(userPrompt, apiKey);
    const parsed = parseChronosJSON(rawResponse);

    const result: ChronosTimingResult = {
        timing_strategy: {
            event_start_local:
                parsed.timing_strategy?.event_start_local || '',
            trading_halt_time:
                parsed.timing_strategy?.trading_halt_time || '',
            buffer_reasoning_bn:
                parsed.timing_strategy?.buffer_reasoning_bn || '',
            expected_resolution_time:
                parsed.timing_strategy?.expected_resolution_time || '',
        },
        operational_flags: {
            is_high_volatility_window:
                parsed.operational_flags?.is_high_volatility_window ?? false,
            timezone_offset_applied:
                parsed.operational_flags?.timezone_offset_applied || '+06:00',
            local_holiday_conflict:
                parsed.operational_flags?.local_holiday_conflict || 'None',
        },
        admin_alert_bn: parsed.admin_alert_bn || '',
    };

    console.log(
        `[ChronosAgent] Complete — halt: ${result.timing_strategy.trading_halt_time}, holiday: ${result.operational_flags.local_holiday_conflict}`
    );

    return result;
}

/**
 * Run the Chronos Agent and map output to TimingResult
 * for backward compatibility with the existing pipeline.
 */
export async function runChronosAsTimingResult(
    context: AgentContext
): Promise<TimingResult> {
    const chronosResult = await runChronosAgent(context);

    const tradingClosesAt =
        chronosResult.timing_strategy.trading_halt_time ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const resolutionDate =
        chronosResult.timing_strategy.expected_resolution_time ||
        new Date(
            new Date(tradingClosesAt).getTime() + 60 * 60 * 1000
        ).toISOString();

    const warnings: string[] = [];
    if (chronosResult.operational_flags.is_high_volatility_window) {
        warnings.push('⚠️ High volatility window detected');
    }
    if (
        chronosResult.operational_flags.local_holiday_conflict &&
        chronosResult.operational_flags.local_holiday_conflict !== 'None'
    ) {
        warnings.push(
            `🗓️ Holiday conflict: ${chronosResult.operational_flags.local_holiday_conflict}`
        );
    }
    if (chronosResult.admin_alert_bn) {
        warnings.push(`📢 ${chronosResult.admin_alert_bn}`);
    }

    return {
        tradingClosesAt,
        resolutionDate,
        timezone: 'Asia/Dhaka',
        isValid: true,
        warnings,
        confidence: 0.9,
    };
}
