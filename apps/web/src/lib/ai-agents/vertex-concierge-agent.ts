/**
 * Vertex AI Concierge Mentor Pro — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_Concierge_Mentor_Pro" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: White-glove user support, trading education, deposit/withdrawal
 * troubleshooting, dispute mediation, and responsible gaming alerts.
 * All responses in native, friendly, professional Bangla.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SuggestedAction {
    label_bn: string;
    action: string;
    url?: string;
}

export interface ConciergeResponse {
    text_bn: string;
    suggested_actions: SuggestedAction[];
    category: 'education' | 'operational' | 'dispute' | 'safety' | 'general';
    is_escalation_needed: boolean;
    responsible_gaming_alert?: string;
}

export interface ConciergeInput {
    message: string;
    userId?: string;
    userContext?: UserAccountSummary;
    conversationHistory?: ConversationTurn[];
    dataStore?: string;
}

export interface UserAccountSummary {
    balance?: number;
    lockedBalance?: number;
    totalTrades?: number;
    recentWins?: number;
    recentLosses?: number;
    depositMethod?: string;
    memberSince?: string;
}

export interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Senior Concierge & Prediction Market Mentor (Plokymarket BD)
Your mission is to provide "White-Glove" support to users. You are not just a chatbot; you are a financial educator and a dispute mediator. Your goal is to simplify complex concepts and ensure a friction-less user experience.

# CORE INTERACTION PROTOCOLS:

1. TRADING EDUCATION (The Mentor Role):
   - Explain 'Odds' using simple Bangladeshi analogies (e.g., "১০ টাকার টিকিটে ৮ টাকা জেতার সম্ভাবনা").
   - Simplify 'Order Books' and 'Limit Orders' for beginners. 
   - If a user asks "How much can I win?", calculate potential profit based on current market prices.

2. OPERATIONAL GUIDANCE (Deposit/Withdrawal):
   - Provide step-by-step instructions for bKash, Nagad, and Rocket deposits.
   - If a transaction is delayed, explain the "Transaction Mining" or "Manual Verification" process clearly in Bangla.
   - Proactively offer troubleshooting steps if a user mentions a failed payment.

3. EMPATHETIC DISPUTE MEDIATION:
   - When a user is upset about a lost market, do not be robotic. 
   - Use the 'Oracle Evidence' to explain exactly why the market resolved the way it did. 
   - Provide links to official sources (Prothom Alo, Daily Star) to back up the resolution.

4. USER RETENTION & SAFETY:
   - Identify signs of "Gambling Addiction" or distress and provide responsible gaming reminders.
   - Encourage users to check 'Risk Scores' before placing large trades.

# TONE & LANGUAGE:
- Language: Native, friendly, and professional Bangla (শুদ্ধ ও প্রাঞ্জল বাংলা).
- Tone: Empathetic, patient, and authoritative.
- Avoid technical jargon unless you explain it immediately after.

# RAG & GROUNDING RULES:
- Always prioritize information from the 'Plokymarket Implementation Guide' and 'FAQ' data store.
- If the information is not in the data store, explicitly state that you are connecting them to a human admin.

# OUTPUT SCHEMA (STRICT JSON):
{
  "text_bn": "ব্যবহারকারীর প্রশ্নের বিস্তারিত উত্তর বাংলায়",
  "suggested_actions": [
    {
      "label_bn": "বাটনের টেক্সট বাংলায়",
      "action": "action_type (e.g., open_url, navigate, contact_admin)",
      "url": "optional URL"
    }
  ],
  "category": "education | operational | dispute | safety | general",
  "is_escalation_needed": false,
  "responsible_gaming_alert": "optional alert message in Bangla if needed"
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiConcierge(
    messages: Array<{ role: string; parts: Array<{ text: string }> }>,
    apiKey: string,
    model: string = PRIMARY_MODEL
): Promise<string> {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const body = {
        system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: messages,
        tools: [
            {
                google_search: {},
            },
        ],
        generationConfig: {
            temperature: 0.4,
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
                `[ConciergeAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiConcierge(messages, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Concierge Agent Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Concierge Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseConciergeJSON(raw: string): any {
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

    // If no JSON, wrap the raw text as a simple response
    return {
        text_bn: raw,
        suggested_actions: [],
        category: 'general',
        is_escalation_needed: false,
    };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Concierge Mentor Pro.
 *
 * Provides white-glove user support with:
 * - Trading education in Bengali
 * - bKash/Nagad deposit troubleshooting
 * - Dispute mediation with oracle evidence
 * - Responsible gaming alerts
 */
export async function runConciergeAgent(
    input: ConciergeInput
): Promise<ConciergeResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY not configured — cannot run Concierge Agent'
        );
    }

    console.log(
        '[ConciergeAgent] Handling query:',
        input.message.substring(0, 60)
    );

    // Build conversation context
    const messages: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history if available
    if (input.conversationHistory) {
        for (const turn of input.conversationHistory) {
            messages.push({
                role: turn.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: turn.content }],
            });
        }
    }

    // Build user context string
    let contextStr = '';
    if (input.userContext) {
        const ctx = input.userContext;
        contextStr = `\n\n[USER CONTEXT — INTERNAL, DO NOT SHARE RAW DATA]
- Balance: ৳${ctx.balance ?? 'N/A'}
- Locked: ৳${ctx.lockedBalance ?? 0}
- Total Trades: ${ctx.totalTrades ?? 0}
- Recent: ${ctx.recentWins ?? 0} wins, ${ctx.recentLosses ?? 0} losses
- Deposit Method: ${ctx.depositMethod || 'unknown'}
- Member Since: ${ctx.memberSince || 'unknown'}`;
    }

    // Add the current user message
    messages.push({
        role: 'user',
        parts: [
            {
                text: `${input.message}${contextStr}${input.dataStore ? `\n\n[Data Store: ${input.dataStore}]` : ''}`,
            },
        ],
    });

    const rawResponse = await callGeminiConcierge(messages, apiKey);
    const parsed = parseConciergeJSON(rawResponse);

    const VALID_CATEGORIES = [
        'education',
        'operational',
        'dispute',
        'safety',
        'general',
    ] as const;
    const category = VALID_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : 'general';

    const result: ConciergeResponse = {
        text_bn: parsed.text_bn || parsed.text || '',
        suggested_actions: (parsed.suggested_actions || []).map((a: any) => ({
            label_bn: a.label_bn || a.label || '',
            action: a.action || 'navigate',
            url: a.url,
        })),
        category,
        is_escalation_needed: parsed.is_escalation_needed ?? false,
        responsible_gaming_alert: parsed.responsible_gaming_alert || undefined,
    };

    console.log(
        `[ConciergeAgent] Complete — category: ${result.category}, escalate: ${result.is_escalation_needed}, actions: ${result.suggested_actions.length}`
    );

    return result;
}
