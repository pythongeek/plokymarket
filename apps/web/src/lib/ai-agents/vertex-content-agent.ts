/**
 * Vertex AI Content Agent — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_Content_Agent" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Output follows the strict JSON schema defined in the original agent's
 * system instruction.
 */

import type { AgentContext } from './types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Citation {
    expert_name: string;
    designation: string;
    statement: string;
    date: string;
    source_url: string;
}

export interface ResolutionSource {
    primary_link: string;
    backup_sources: string[];
    criteria_bn: string;
}

export interface VertexContentAgentResult {
    /* market_details */
    title_bn: string;
    description_bn: string;
    category: string;

    /* enrichment */
    citations: Citation[];
    resolution_source: ResolutionSource;
    authenticity_score: number;

    /* compatibility fields mapped from the new output */
    title: string;
    description: string;
    subcategory: string;
    tags: string[];
    seoScore: number;
    confidence: number;
    sources: string[];
}

// ── Gemini REST API helpers ────────────────────────────────────────────────────

const GEMINI_CONTENT_API =
    'https://generativelanguage.googleapis.com/v1beta/models';

/** Primary model — matches MoAgent Garden definition */
const PRIMARY_MODEL = 'gemini-2.5-flash';
/** Fallback model if 2.5-flash is not available */
const FALLBACK_MODEL = 'gemini-2.0-flash-001';

// ── System instruction (verbatim from Python ADK root_agent) ───────────────

const SYSTEM_INSTRUCTION = `# ROLE: Senior Market Analyst & OSINT Specialist (Polymarket BD)
Your role is to transform raw news into an "Institutional Grade" prediction market. You must prioritize authenticity, specific citations, and neutral terminology.

# CORE OPERATIONAL FRAMEWORK:
1. ENTITY & EXPERT EXTRACTION: Identify specific people (Govenors, Analysts, Ministers), their exact titles, and their statements.
2. SOURCE TIERS: Prioritize Official Reports (Bangladesh Bank, BBS, IMF) > Tier 1 News (Prothom Alo, Daily Star) > Expert Interviews.
3. TEMPORAL PRECISION: Always include the date of the statement or report (e.g., "১৫ অক্টোবর ২০২৪ তারিখে প্রকাশিত প্রতিবেদন অনুযায়ী").
4. RESOLUTION CRITERIA: Define exactly how the "YES" or "NO" outcome will be verified.

# WRITING GUIDELINES (BANGLA):
- Use "Professional News Reporting" style. Avoid emotional adjectives.
- Instead of "অনেকে মনে করছেন", use "অর্থনীতিবিদ ডঃ [নাম]-এর মতে" or "বিশ্বব্যাংকের [তারিখ]-এর প্রতিবেদন অনুযায়ী".
- Title must be a neutral, objective question.

# OUTPUT STRUCTURE (STRICT JSON):
Every response must follow this schema:
{
  "market_details": {
    "title_bn": "শুদ্ধ বাংলায় শিরোনাম",
    "description_bn": "বিস্তারিত বর্ণনা (বিশেষজ্ঞের নাম ও উক্তি সহ)",
    "category": "Economy | Politics | Sports | Crypto"
  },
  "citations": [
    {
      "expert_name": "ব্যক্তির নাম",
      "designation": "পদবি",
      "statement": "সরাসরি উক্তি বা সারসংক্ষেপ",
      "date": "YYYY-MM-DD",
      "source_url": "URL if available"
    }
  ],
  "resolution_source": {
    "primary_link": "প্রধান যাচাইযোগ্য লিঙ্ক",
    "backup_sources": ["সোর্স ১", "সোর্স ২"],
    "criteria_bn": "মার্কেটটি কীভাবে মীমাংসা হবে তার শর্ত বাংলায়"
  },
  "authenticity_score": "1-10 (Based on source reliability)"
}`;

// ── Category mapping ──────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
    Economy: 'Economics',
    Politics: 'Politics',
    Sports: 'Sports',
    Crypto: 'Crypto',
    // fallback keeps original
};

function mapCategory(raw: string): string {
    // Try exact match first
    if (CATEGORY_MAP[raw]) return CATEGORY_MAP[raw];
    // Case-insensitive search
    const key = Object.keys(CATEGORY_MAP).find(
        (k) => k.toLowerCase() === raw.toLowerCase()
    );
    return key ? CATEGORY_MAP[key] : raw || 'Other';
}

// ── Call Gemini with Google Search grounding + URL context ──────────────────

async function callGeminiWithGrounding(
    userPrompt: string,
    apiKey: string,
    model: string = PRIMARY_MODEL
): Promise<string> {
    const url = `${GEMINI_CONTENT_API}/${model}:generateContent?key=${apiKey}`;

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
            // Google Search grounding — equivalent to GoogleSearchTool() in Python ADK
            {
                google_search: {},
            },
        ],
        generationConfig: {
            temperature: 0.3,
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

        // If model not found, try fallback
        if (
            model === PRIMARY_MODEL &&
            (errText.includes('not found') ||
                errText.includes('not supported') ||
                errText.includes('is not available'))
        ) {
            console.warn(
                `[VertexContentAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiWithGrounding(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `Gemini API error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from Gemini Content Agent');
    }

    return text;
}

// ── JSON parsing utility ──────────────────────────────────────────────────────

function parseAgentJSON(raw: string): any {
    // Try direct parse
    try {
        return JSON.parse(raw);
    } catch {
        // noop
    }

    // Try extracting from markdown code block
    const mdMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (mdMatch) {
        try {
            return JSON.parse(mdMatch[1].trim());
        } catch {
            // noop
        }
    }

    // Try extracting first { ... } block
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
        return JSON.parse(braceMatch[0]);
    }

    throw new Error('Could not parse JSON from Gemini Content Agent response');
}

// ── Derive tags from output ───────────────────────────────────────────────────

function deriveTags(
    category: string,
    title: string,
    citations: Citation[]
): string[] {
    const tags: string[] = [category.toLowerCase()];

    // Add expert-based tags
    if (citations.length > 0) {
        tags.push('expert-analysis');
    }

    // Category-specific tags
    const lc = title.toLowerCase();
    if (lc.includes('cricket') || lc.includes('ক্রিকেট') || lc.includes('বিপিএল')) {
        tags.push('cricket', 'bangladesh', 'sports');
    }
    if (lc.includes('bitcoin') || lc.includes('বিটকয়েন') || lc.includes('crypto')) {
        tags.push('crypto', 'price-prediction');
    }
    if (lc.includes('election') || lc.includes('নির্বাচন') || lc.includes('ভোট')) {
        tags.push('election', 'bangladesh', 'politics');
    }
    if (lc.includes('inflation') || lc.includes('মূল্যস্ফীতি') || lc.includes('gdp')) {
        tags.push('economy', 'bangladesh-bank');
    }

    tags.push('prediction');
    return [...new Set(tags)];
}

// ── Calculate SEO score from content quality ──────────────────────────────────

function calculateSEO(
    titleBn: string,
    descriptionBn: string,
    citations: Citation[],
    authenticityScore: number
): number {
    let score = 40; // base

    // Title quality
    if (titleBn.length >= 20 && titleBn.length <= 80) score += 15;
    if (titleBn.includes('?') || titleBn.includes('?')) score += 5;

    // Description quality
    if (descriptionBn.length >= 100) score += 10;
    if (descriptionBn.length >= 200) score += 5;

    // Citations boost
    score += Math.min(15, citations.length * 5);

    // Authenticity boost
    score += Math.min(10, authenticityScore);

    return Math.min(100, score);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden Content Agent.
 *
 * Equivalent to calling the Python ADK `root_agent` with sub-agents
 * `google_search_agent` and `url_context_agent`.
 */
export async function runVertexContentAgent(
    context: AgentContext
): Promise<VertexContentAgentResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured — cannot run Vertex Content Agent');
    }

    const rawInput = context.rawInput || context.title || '';

    console.log('[VertexContentAgent] Starting analysis for:', rawInput.substring(0, 60));

    const userPrompt = `Analyze the following raw news/topic for a Bangladeshi prediction market and create an institutional-grade market.

Raw Input: "${rawInput}"
${context.category ? `Suggested Category: ${context.category}` : ''}
${context.description ? `Additional Context: "${context.description}"` : ''}

Use Google Search to find the latest information, expert opinions, and official data about this topic. Then generate the full market content following the strict JSON schema.`;

    const rawResponse = await callGeminiWithGrounding(userPrompt, apiKey);
    const parsed = parseAgentJSON(rawResponse);

    // Extract fields with safe defaults
    const marketDetails = parsed.market_details || parsed;
    const titleBn = marketDetails.title_bn || marketDetails.title || rawInput;
    const descriptionBn = marketDetails.description_bn || marketDetails.description || '';
    const rawCategory = marketDetails.category || context.category || 'Other';
    const category = mapCategory(rawCategory);

    const citations: Citation[] = (parsed.citations || []).map((c: any) => ({
        expert_name: c.expert_name || '',
        designation: c.designation || '',
        statement: c.statement || '',
        date: c.date || '',
        source_url: c.source_url || '',
    }));

    const resolutionSource: ResolutionSource = {
        primary_link: parsed.resolution_source?.primary_link || '',
        backup_sources: parsed.resolution_source?.backup_sources || [],
        criteria_bn: parsed.resolution_source?.criteria_bn || '',
    };

    const authenticityScore = Number(parsed.authenticity_score) || 5;
    const tags = deriveTags(category, titleBn, citations);
    const seoScore = calculateSEO(titleBn, descriptionBn, citations, authenticityScore);

    // Map confidence from authenticity score (1-10 → 0.1-1.0)
    const confidence = Math.min(1, Math.max(0.1, authenticityScore / 10));

    // Collect source URLs from citations
    const sources = citations
        .filter((c) => c.source_url)
        .map((c) => c.source_url);

    console.log(
        `[VertexContentAgent] Complete — category: ${category}, score: ${authenticityScore}/10, citations: ${citations.length}`
    );

    return {
        // New MoAgent Garden fields
        title_bn: titleBn,
        description_bn: descriptionBn,
        citations,
        resolution_source: resolutionSource,
        authenticity_score: authenticityScore,

        // Backward-compatible ContentAgentResult fields
        title: titleBn,
        description: descriptionBn,
        category,
        subcategory: rawCategory,
        tags,
        seoScore,
        confidence,
        sources,
    };
}
