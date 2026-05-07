/**
 * MiniMax Content Agent
 * Uses MiniMax API for content generation with Bengali language support
 */

import type { AgentContext } from './types';

export interface MiniMaxContentAgentResult {
  title_bn: string;
  description_bn: string;
  category: string;
  subcategory: string;
  tags: string[];
  seoScore: number;
  confidence: number;
  sources: string[];
  citations?: Array<{
    expert_name: string;
    designation: string;
    statement: string;
    date: string;
    source_url: string;
  }>;
  authenticity_score?: number;
}

const SYSTEM_INSTRUCTION = `# ROLE: Senior Market Analyst for Plokymarket BD
You are an expert at creating prediction market content for a Bangladeshi audience.
Transform raw news/topic into a well-structured prediction market.

# GUIDELINES:
- Write in professional Bengali with neutral tone
- Use specific facts, dates, and expert names when available
- Title must be a clear YES/NO question
- Description should include context, relevant parties, and expected outcomes

# OUTPUT (JSON only, no markdown):
{
  "title_bn": "শুদ্ধ বাংলায় শিরোনাম (প্রশ্ন আকারে)",
  "description_bn": "বিস্তারিত বর্ণনা বাংলায়",
  "category": "Economics|Politics|Sports|Crypto|Weather|Entertainment|Other",
  "subcategory": "নির্দিষ্ট সাবক্যাটাগরি",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.85,
  "authenticity_score": 8
}`;

function parseJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // continue
      }
    }
    throw new Error('Cannot parse JSON from MiniMax response');
  }
}

function deriveTags(category: string, title: string): string[] {
  const tags = [category.toLowerCase()];
  const lc = title.toLowerCase();
  if (lc.includes('cricket') || lc.includes('ক্রিকেট')) tags.push('cricket', 'sports');
  if (lc.includes('bitcoin') || lc.includes('বিটকয়েন')) tags.push('crypto');
  if (lc.includes('নির্বাচন') || lc.includes('election')) tags.push('politics');
  if (lc.includes('অর্থনীতি') || lc.includes('economy')) tags.push('economy');
  tags.push('prediction');
  return [...new Set(tags)];
}

export async function runMiniMaxContentAgent(
  context: AgentContext
): Promise<MiniMaxContentAgentResult> {
  const { generateWithMiniMax } = await import('./minimax-client');

  const rawInput = context.rawInput || context.title || '';

  console.log('[MiniMaxContentAgent] Starting for:', rawInput.substring(0, 60));

  const result = await generateWithMiniMax(
    `${SYSTEM_INSTRUCTION}\n\nUser Input: "${rawInput}"`,
    { model: 'abab6.5s-chat', temperature: 0.3, maxTokens: 2048 }
  );

  const parsed = parseJSON(result.content);

  const titleBn = parsed.title_bn || parsed.title || rawInput;
  const descriptionBn = parsed.description_bn || parsed.description || '';
  const category = parsed.category || 'Other';
  const subcategory = parsed.subcategory || '';
  const authenticityScore = parsed.authenticity_score || parsed.confidence * 10 || 5;
  const confidence = parsed.confidence || Math.min(1, authenticityScore / 10);

  const tags = deriveTags(category, titleBn);

  console.log('[MiniMaxContentAgent] Complete — category:', category);

  return {
    title_bn: titleBn,
    description_bn: descriptionBn,
    category,
    subcategory,
    tags,
    seoScore: Math.min(100, 40 + tags.length * 5 + authenticityScore),
    confidence,
    sources: [],
    authenticity_score: authenticityScore,
  };
}
