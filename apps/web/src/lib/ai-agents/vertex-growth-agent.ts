/**
 * Vertex AI Viral Growth Machine — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_Viral_Growth_Machine" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: Real-time trend mining in Bangladesh, viral probability scoring,
 * dynamic market proposal generation, and multi-channel Bengali social
 * media content creation (Facebook, Twitter/X, Telegram/WhatsApp).
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TrendAnalysis {
    topic: string;
    viral_score: number;
    source_link: string;
    reasoning_bn: string;
}

export interface MarketSuggestion {
    title_bn: string;
    category: string;
    potential_engagement: 'High' | 'Medium' | 'Low';
}

export interface SocialAssets {
    facebook_post_bn: string;
    twitter_thread_bn: string[];
    telegram_alert_bn: string;
    hashtags: string[];
}

export interface GrowthAgentResult {
    trend_analysis: TrendAnalysis;
    market_suggestions: MarketSuggestion[];
    social_assets: SocialAssets;
}

export interface GrowthInput {
    /** Optional specific topic to analyze */
    topic?: string;
    /** Optional category filter: Sports, Politics, Economy, etc. */
    category?: string;
    /** Optional raw news/trend data to analyze */
    rawTrends?: string;
    /** Optional specific query */
    rawQuery?: string;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Chief Growth Officer & Viral Trend Analyst (Plokymarket BD)
Your mission is to ensure Plokymarket Bangladesh is always at the center of public conversation. You turn news into opportunities and markets into viral content.

# CORE OPERATIONAL PROTOCOLS:

1. REAL-TIME TREND MINING:
   - Scan Whitelisted News APIs, Google Trends (Bangladesh), and Local RSS Feeds.
   - Focus Categories: Sports (BCB/BPL/Football), Politics, Local Memes, and National Economy.
   - Identify "Early Signals": Topics with a 50% increase in search/discussion volume within the last 4 hours.

2. VIRAL PROBABILITY SCORING (VPS):
   - For every trend, calculate a 'Viral Score' (1-10).
   - High Score Criteria: Controversy, High Emotional Impact, or Binary Outcome potential.
   - Suggest 3 specific market titles for any trend with VPS > 7.

3. DYNAMIC MARKET PROPOSAL:
   - Propose market structures: Binary (Yes/No) or Categorical.
   - Example: If a player is under-performing, propose: "Will [Player Name] score a half-century in the next BPL match?"

4. MULTI-CHANNEL CONTENT GENERATION:
   - Generate high-engagement Bangla content for:
     a) Facebook/Instagram (Catchy Title + Emotional Hook + 'How to Trade' guide).
     b) Twitter/X (Professional Thread with data points).
     c) Telegram/WhatsApp (Urgent Alert style).
   - Use 'Gen-Z' and 'Professional' Bangla tones depending on the channel.

# OUTPUT SCHEMA (STRICT JSON):
{
  "trend_analysis": {
    "topic": "ট্রেন্ডিং টপিকের নাম",
    "viral_score": 1-10,
    "source_link": "URL",
    "reasoning_bn": "কেন এটি জনপ্রিয় হচ্ছে তার যুক্তি বাংলায়"
  },
  "market_suggestions": [
    {
      "title_bn": "মার্কেটের শিরোনাম বাংলায়",
      "category": "Sports | Politics | etc",
      "potential_engagement": "High | Medium"
    }
  ],
  "social_assets": {
    "facebook_post_bn": "ফেসবুক ক্যাপশন (ইমোজি সহ)",
    "twitter_thread_bn": ["Tweet 1", "Tweet 2"],
    "telegram_alert_bn": "টেলিগ্রাম এলার্ট টেক্সট",
    "hashtags": ["#PlokymarketBD", "#BangladeshTrends"]
  }
}`;

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiGrowth(
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
            temperature: 0.7,   // Higher creativity for viral content
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
                `[GrowthAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiGrowth(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Growth Agent Gemini error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Growth Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseGrowthJSON(raw: string): any {
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

    throw new Error('Could not parse JSON from Growth Agent response');
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Viral Growth Machine.
 *
 * Mines real-time Bangladesh trends, scores viral potential,
 * proposes prediction markets, and generates multi-channel
 * Bengali social media content.
 */
export async function runGrowthAgent(
    input: GrowthInput
): Promise<GrowthAgentResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GEMINI_API_KEY not configured — cannot run Growth Agent'
        );
    }

    console.log(
        `[GrowthAgent] Mining trends${input.topic ? ` for: ${input.topic}` : ''}${input.category ? ` [${input.category}]` : ''}`
    );

    const userPrompt = `Analyze the current trending topics in Bangladesh and generate prediction market opportunities for Plokymarket BD.

${input.topic ? `Specific Topic to Analyze: "${input.topic}"` : 'Find the HOTTEST trending topic in Bangladesh RIGHT NOW.'}
${input.category ? `Category Focus: ${input.category}` : 'Scan ALL categories: Sports (BPL/BCB/Football), Politics, Economy, Entertainment.'}
${input.rawTrends ? `\nRaw Trend Data:\n${input.rawTrends}` : ''}
${input.rawQuery ? `\nAdditional Context: "${input.rawQuery}"` : ''}
Current Time (UTC): ${new Date().toISOString()}

MANDATORY STEPS:
1. Use Google Search to find what's trending in Bangladesh RIGHT NOW.
2. Calculate the Viral Probability Score (VPS) based on controversy, emotional impact, and binary outcome potential.
3. Suggest at least 3 prediction market titles in Bengali for trends with VPS > 7.
4. Generate viral social media content for Facebook (Gen-Z tone with emojis), Twitter/X (professional thread), and Telegram (urgent alert style).
5. Include relevant Bengali hashtags.
6. Output in strict JSON schema.`;

    const rawResponse = await callGeminiGrowth(userPrompt, apiKey);
    const parsed = parseGrowthJSON(rawResponse);

    const result: GrowthAgentResult = {
        trend_analysis: {
            topic: parsed.trend_analysis?.topic || '',
            viral_score: Math.max(
                1,
                Math.min(10, Number(parsed.trend_analysis?.viral_score) || 1)
            ),
            source_link: parsed.trend_analysis?.source_link || '',
            reasoning_bn: parsed.trend_analysis?.reasoning_bn || '',
        },
        market_suggestions: (parsed.market_suggestions || []).map((s: any) => ({
            title_bn: s.title_bn || '',
            category: s.category || 'General',
            potential_engagement:
                s.potential_engagement === 'High'
                    ? 'High'
                    : s.potential_engagement === 'Low'
                        ? 'Low'
                        : 'Medium',
        })),
        social_assets: {
            facebook_post_bn:
                parsed.social_assets?.facebook_post_bn || '',
            twitter_thread_bn:
                parsed.social_assets?.twitter_thread_bn || [],
            telegram_alert_bn:
                parsed.social_assets?.telegram_alert_bn || '',
            hashtags: parsed.social_assets?.hashtags || [
                '#PlokymarketBD',
            ],
        },
    };

    console.log(
        `[GrowthAgent] Complete — topic: "${result.trend_analysis.topic}", VPS: ${result.trend_analysis.viral_score}/10, markets: ${result.market_suggestions.length}`
    );

    return result;
}

/**
 * Auto-pilot function for cron job integration.
 * Runs trend analysis and returns results for admin notification.
 */
export async function runTrendCatalyst(): Promise<{
    shouldNotify: boolean;
    result: GrowthAgentResult;
}> {
    const result = await runGrowthAgent({});

    return {
        shouldNotify: result.trend_analysis.viral_score > 8,
        result,
    };
}
