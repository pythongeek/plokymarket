/**
 * Gemini Search Agent — Real-time web search for market resolution
 * Uses Gemini 2.5 Flash with Google Search grounding
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash';

export interface SearchResult {
  fact: string;
  source: string;
  url?: string;
  date?: string;
  relevance: number; // 0-1
}

export interface GeminiSearchOutput {
  query: string;
  facts: string[];
  sources: Array<{ title: string; url: string; snippet: string }>;
  keyEvents: string[];
  conflictingInfo: string[];
  overallSummary: string;
  searchTimestamp: string;
  rawResponse?: string;
}

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  return key;
}

/**
 * Search the web for facts about a prediction market question
 */
export async function searchMarketFacts(
  marketQuestion: string,
  category?: string,
  resolutionDate?: string
): Promise<GeminiSearchOutput> {
  const apiKey = getGeminiKey();

  const searchPrompt = `You are a real-time research agent for a prediction market platform.

MISSION: Search the web for the DEFINITIVE facts about this prediction market question.

MARKET QUESTION: "${marketQuestion}"
${category ? `CATEGORY: ${category}` : ''}
${resolutionDate ? `RESOLUTION DATE: ${resolutionDate}` : ''}

INSTRUCTIONS:
1. Use Google Search to find the LATEST authoritative information
2. For Bangladesh events: prioritize Bangladesh Bank, Election Commission, BCB, Prothom Alo, Daily Star, BDNews24
3. For sports: prioritize official scorecards, ESPNcricinfo, FIFA/ICC official results
4. For crypto: prioritize CoinMarketCap, official project announcements, blockchain explorers
5. For politics: prioritize official government portals, Reuters, BBC
6. Extract specific facts with dates, numbers, and direct quotes
7. Note any CONFLICTING information between sources
8. If the event hasn't happened yet, state that clearly

RESPOND ONLY in this JSON format:
{
  "facts": [
    {"fact": "specific fact with date/number", "source": "source name", "url": "https://...", "date": "2026-01-15", "relevance": 0.95}
  ],
  "keyEvents": ["Event 1 on Jan 15", "Event 2 on Jan 20"],
  "conflicts": ["Source A says X, Source B says Y"],
  "overallSummary": "2-3 sentence summary of what happened",
  "eventOccurred": true,
  "confidenceInSources": 0.9
}`;

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: 'You are a factual research agent. Use Google Search to verify claims. Always cite sources. Prefer primary sources over secondary. Respond ONLY in valid JSON format.' }],
      },
      contents: [{ role: 'user', parts: [{ text: searchPrompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini search error (${response.status}): ${err.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Parse JSON from response
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed) {
    // Fallback: return raw text as summary
    return {
      query: marketQuestion,
      facts: [text.slice(0, 500)],
      sources: [],
      keyEvents: [],
      conflictingInfo: [],
      overallSummary: text.slice(0, 500),
      searchTimestamp: new Date().toISOString(),
      rawResponse: text,
    };
  }

  const facts: string[] = (parsed.facts || []).map((f: any) => String(f.fact || '')).filter(Boolean);
  const sources = (parsed.facts || [])
    .filter((f: any) => f.source || f.url)
    .map((f: any) => ({
      title: String(f.source || 'Unknown Source'),
      url: String(f.url || ''),
      snippet: String(f.fact || '').slice(0, 200),
    }));

  return {
    query: marketQuestion,
    facts,
    sources,
    keyEvents: (parsed.keyEvents || []).map(String),
    conflictingInfo: (parsed.conflicts || []).map(String),
    overallSummary: String(parsed.overallSummary || ''),
    searchTimestamp: new Date().toISOString(),
    rawResponse: text,
  };
}
