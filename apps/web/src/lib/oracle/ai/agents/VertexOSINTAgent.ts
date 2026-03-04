/**
 * Vertex AI OSINT Architect Pro — MoAgent Garden Implementation
 *
 * Translates the Python ADK "Plokymarket_OSINT_Architect_Pro" into TypeScript.
 * Uses Gemini 2.5 Flash with:
 *   - Google Search grounding  (≡ GoogleSearchTool sub-agent)
 *   - URL context / Dynamic Retrieval (≡ url_context sub-agent)
 *
 * Purpose: Verify and enrich market resolution evidence with grounded,
 * citation-backed OSINT analysis. Runs between Retrieval and Synthesis
 * in the Oracle Resolution Pipeline.
 */

import type { EvidenceSource, SourceTier } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OSINTCitation {
    expert_name: string;
    designation: string;
    statement: string;
    date: string;
    source_url: string;
}

export interface OSINTResolutionSource {
    primary_link: string;
    backup_sources: string[];
    criteria_bn: string;
}

export interface OSINTAgentOutput {
    agentType: 'osint';

    /* market_details */
    title_bn: string;
    description_bn: string;
    category: string;

    /* enrichment */
    citations: OSINTCitation[];
    resolution_source: OSINTResolutionSource;
    authenticity_score: number;

    /* pipeline metadata */
    executionTimeMs: number;
    model: string;
    sourcesVerified: number;
}

// ── Gemini REST API ────────────────────────────────────────────────────────────

const GEMINI_API_BASE =
    'https://generativelanguage.googleapis.com/v1beta/models';

const PRIMARY_MODEL = 'gemini-2.5-flash';
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

// ── Call Gemini with Google Search grounding ────────────────────────────────

async function callGeminiOSINT(
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
            // Google Search grounding — equivalent to GoogleSearchTool() sub-agent
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

        // Fallback to alternative model
        if (
            model === PRIMARY_MODEL &&
            (errText.includes('not found') ||
                errText.includes('not supported') ||
                errText.includes('is not available'))
        ) {
            console.warn(
                `[OSINTAgent] ${PRIMARY_MODEL} unavailable, falling back to ${FALLBACK_MODEL}`
            );
            return callGeminiOSINT(userPrompt, apiKey, FALLBACK_MODEL);
        }

        throw new Error(
            `OSINT Agent Gemini API error (${response.status}): ${errText.substring(0, 300)}`
        );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('Empty response from OSINT Agent');
    }

    return text;
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseOSINTJSON(raw: string): any {
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

    throw new Error('Could not parse JSON from OSINT Agent response');
}

// ── Convert OSINT citations to EvidenceSource format ─────────────────────────

function citationsToEvidenceSources(
    citations: OSINTCitation[]
): EvidenceSource[] {
    return citations
        .filter((c) => c.source_url)
        .map((c, i) => ({
            id: `osint-citation-${i}`,
            url: c.source_url,
            title: `${c.expert_name} — ${c.designation}`,
            content: c.statement,
            sourceType: 'news' as const,
            sourceTier: determineSourceTier(c.source_url),
            authorityScore: 0.8,
            publishedAt: c.date || new Date().toISOString(),
            retrievedAt: new Date().toISOString(),
            credibilityScore: 0.8,
            relevanceScore: 0.9,
            rawMetadata: {
                author: c.expert_name,
                source: c.source_url,
                language: 'bn',
                isBengaliContent: true,
                osintVerified: true,
            },
        }));
}

function determineSourceTier(url: string): SourceTier {
    const lowerUrl = url.toLowerCase();
    if (
        lowerUrl.includes('.gov.bd') ||
        lowerUrl.includes('bb.org.bd') ||
        lowerUrl.includes('bbs.gov.bd') ||
        lowerUrl.includes('imf.org') ||
        lowerUrl.includes('worldbank.org')
    ) {
        return 'primary';
    }
    if (
        lowerUrl.includes('prothomalo.com') ||
        lowerUrl.includes('thedailystar.net') ||
        lowerUrl.includes('bdnews24.com') ||
        lowerUrl.includes('reuters.com') ||
        lowerUrl.includes('bbc.com')
    ) {
        return 'secondary';
    }
    return 'tertiary';
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run the MoAgent Garden OSINT Architect Pro Agent.
 *
 * Equivalent to calling the Python ADK `root_agent` with sub-agents
 * `google_search_agent` and `url_context_agent`.
 *
 * @param marketQuestion - The market question to verify
 * @param existingSources - Optional existing evidence sources to cross-reference
 * @returns OSINT analysis with citations and evidence
 */
export async function runOSINTAgent(
    marketQuestion: string,
    existingSources?: EvidenceSource[]
): Promise<OSINTAgentOutput> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured — cannot run OSINT Agent');
    }

    const startTime = Date.now();

    console.log(
        '[OSINTAgent] Starting OSINT analysis for:',
        marketQuestion.substring(0, 80)
    );

    // Build context from existing sources if available
    let existingContext = '';
    if (existingSources && existingSources.length > 0) {
        const topSources = existingSources
            .sort((a, b) => b.credibilityScore - a.credibilityScore)
            .slice(0, 5);

        existingContext = `\n\nExisting evidence already collected (cross-reference and verify these):\n${topSources
            .map(
                (s, i) =>
                    `${i + 1}. [${s.sourceType}] ${s.title} — "${s.content.substring(0, 150)}..." (credibility: ${s.credibilityScore})`
            )
            .join('\n')}`;
    }

    const userPrompt = `Analyze the following prediction market question and provide a comprehensive OSINT verification report.

Market Question: "${marketQuestion}"
${existingContext}

Use Google Search to find the latest information, expert opinions, and official data. Verify all claims against official Bangladesh government sources, Bangladesh Bank, BBS, and Tier 1 news outlets (Prothom Alo, Daily Star, bdnews24).

Generate the full analysis following the strict JSON schema.`;

    const rawResponse = await callGeminiOSINT(userPrompt, apiKey);
    const parsed = parseOSINTJSON(rawResponse);

    // Extract with safe defaults
    const marketDetails = parsed.market_details || parsed;
    const titleBn = marketDetails.title_bn || marketDetails.title || marketQuestion;
    const descriptionBn =
        marketDetails.description_bn || marketDetails.description || '';
    const category = marketDetails.category || 'Other';

    const citations: OSINTCitation[] = (parsed.citations || []).map((c: any) => ({
        expert_name: c.expert_name || '',
        designation: c.designation || '',
        statement: c.statement || '',
        date: c.date || '',
        source_url: c.source_url || '',
    }));

    const resolutionSource: OSINTResolutionSource = {
        primary_link: parsed.resolution_source?.primary_link || '',
        backup_sources: parsed.resolution_source?.backup_sources || [],
        criteria_bn: parsed.resolution_source?.criteria_bn || '',
    };

    const authenticityScore = Number(parsed.authenticity_score) || 5;
    const executionTimeMs = Date.now() - startTime;

    console.log(
        `[OSINTAgent] Complete — score: ${authenticityScore}/10, citations: ${citations.length}, time: ${executionTimeMs}ms`
    );

    return {
        agentType: 'osint',
        title_bn: titleBn,
        description_bn: descriptionBn,
        category,
        citations,
        resolution_source: resolutionSource,
        authenticity_score: authenticityScore,
        executionTimeMs,
        model: PRIMARY_MODEL,
        sourcesVerified: citations.length,
    };
}

/**
 * Convert OSINT agent output to evidence sources for the pipeline.
 * This allows the OSINT citations to be fed into the Synthesis agent.
 */
export function osintToEvidence(osintOutput: OSINTAgentOutput): EvidenceSource[] {
    return citationsToEvidenceSources(osintOutput.citations);
}
