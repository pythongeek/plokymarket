/**
 * MiniMax Resolution Agent — Final arbiter using MiniMax-M2.7
 * Takes search results from Gemini, outputs structured resolution decision
 */

import { generateWithMiniMax } from '@/lib/ai/minimax-client';
import { GeminiSearchOutput } from './GeminiSearchAgent';

export type ResolutionOutcome = 'YES' | 'NO' | 'UNRESOLVED' | 'CANCELLED';

export interface MiniMaxResolutionResult {
  outcome: ResolutionOutcome;
  confidence: number; // 0.0 - 1.0
  reasoning: string;
  reasoningBn: string;
  sources: Array<{ name: string; url?: string; tier: number }>;
  certaintyLevel: string;
  certaintyBn: string;
  recommendedAction: 'AUTO_RESOLVE' | 'HUMAN_REVIEW' | 'ESCALATE';
}

const SYSTEM_PROMPT = `You are the Oracle Resolution Agent for Plokymarket Bangladesh — a prediction market platform.

Your job: Determine the DEFINITIVE outcome of a closed prediction market using provided research facts.

TIERED SOURCE AUTHORITY:
- Tier 1 (Official): Bangladesh Bank, Election Commission BD, BCB, ICC, FIFA, Supreme Court, .gov.bd portals → Weight 1.0
- Tier 2 (Validated News): Prothom Alo, Daily Star, BDNews24, Reuters, BBC → Weight 0.8
- Tier 3 (Broadcasting): Jamuna TV, Somoy News, ESPNcricinfo → Weight 0.6
- IGNORE: Social media, unverified blogs, Wikipedia without citation

CONFIDENCE RULES:
- 0.95+: Definitive outcome with 2+ Tier 1/2 independent sources
- 0.85-0.94: Strong outcome, minor uncertainty
- 0.70-0.84: Moderate confidence, flag for human review
- <0.70: Insufficient evidence → UNRESOLVED

BENGALI CONTEXT:
- Understand “হরতাল” (Strike), “অবরোধ” (Blockade), “গেজেট” (Gazette)
- Distinguish between “Propose” (প্রস্তাব) and “Passed/Effective” (কার্যকর)

RESPOND ONLY IN JSON:
{
  "outcome": "YES" | "NO" | "UNRESOLVED" | "CANCELLED",
  "confidence": 0.0-1.0,
  "reasoning": "detailed evidence-based reasoning in English",
  "reasoningBn": "বাংলায় সম্পূর্ণ যুক্তি",
  "sources": [{"name": "source name", "url": "https://...", "tier": 1|2|3}],
  "certaintyLevel": "Definitive | Strong | Moderate | Uncertain",
  "certaintyBn": "নিশ্চিত মাত্রা",
  "recommendedAction": "AUTO_RESOLVE" | "HUMAN_REVIEW" | "ESCALATE"
}`;

/**
 * Run MiniMax resolution agent with provided search evidence
 */
export async function resolveWithMiniMax(
  marketQuestion: string,
  category: string,
  searchResults: GeminiSearchOutput
): Promise<MiniMaxResolutionResult> {
  const evidenceBlock = searchResults.facts
    .map((f, i) => `${i + 1}. ${f}`)
    .join('\n');

  const conflictsBlock = searchResults.conflictingInfo.length > 0
    ? `\nCONFLICTING INFORMATION:\n${searchResults.conflictingInfo.map(c => '- ' + c).join('\n')}`
    : '';

  const sourcesBlock = searchResults.sources.length > 0
    ? `\nSOURCES:\n${searchResults.sources.map(s => `- ${s.title}${s.url ? ' (' + s.url + ')' : ''}`).join('\n')}`
    : '';

  const prompt = `Resolve this prediction market using the provided research evidence.

MARKET QUESTION: "${marketQuestion}"
CATEGORY: ${category}
SEARCH TIME: ${searchResults.searchTimestamp}

RESEARCH FINDINGS:
${evidenceBlock || 'No specific facts retrieved.'}
${conflictsBlock}
${sourcesBlock}

SUMMARY: ${searchResults.overallSummary || 'No summary available.'}

Your task: Analyze the evidence, apply Tiered Source Authority, determine the outcome, and provide confidence score.
`;

  const response = await generateWithMiniMax(prompt, {
    model: 'MiniMax-M2.7',
    temperature: 0.05,
    maxTokens: 2048,
    systemPrompt: SYSTEM_PROMPT,
  });

  // Strip <think> blocks (MiniMax-M2.7 reasoning tags)
  const text = response.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Extract JSON
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
    return {
      outcome: 'UNRESOLVED',
      confidence: 0,
      reasoning: 'Failed to parse MiniMax response: ' + text.slice(0, 300),
      reasoningBn: 'মিনিম্যাকস প্রতিক্রিয়া বিলম্বিত হয়েছে',
      sources: [],
      certaintyLevel: 'Uncertain',
      certaintyBn: 'অনিশ্চিত',
      recommendedAction: 'ESCALATE',
    };
  }

  // Normalize outcome
  const rawOutcome = (parsed.outcome || 'UNRESOLVED').toUpperCase();
  const validOutcomes: ResolutionOutcome[] = ['YES', 'NO', 'UNRESOLVED', 'CANCELLED'];
  const outcome = validOutcomes.includes(rawOutcome as ResolutionOutcome)
    ? (rawOutcome as ResolutionOutcome)
    : 'UNRESOLVED';

  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

  // Determine action from confidence
  let recommendedAction: 'AUTO_RESOLVE' | 'HUMAN_REVIEW' | 'ESCALATE' = 'ESCALATE';
  if (confidence >= 0.95 && outcome !== 'UNRESOLVED') {
    recommendedAction = 'AUTO_RESOLVE';
  } else if (confidence >= 0.75 && outcome !== 'UNRESOLVED') {
    recommendedAction = 'HUMAN_REVIEW';
  }

  return {
    outcome,
    confidence,
    reasoning: String(parsed.reasoning || parsed.reasoningBn || 'No reasoning provided'),
    reasoningBn: String(parsed.reasoningBn || parsed.reasoning || 'কোনো যুক্তি দেয়া হয়নি'),
    sources: (parsed.sources || []).map((s: any) => ({
      name: String(s.name || s.source || ''),
      url: s.url ? String(s.url) : undefined,
      tier: Math.max(1, Math.min(3, Number(s.tier) || 2)),
    })),
    certaintyLevel: String(parsed.certaintyLevel || 'Uncertain'),
    certaintyBn: String(parsed.certaintyBn || 'অনিশ্চিত'),
    recommendedAction,
  };
}
