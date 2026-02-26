/**
 * Market Proposal Agent
 * Analyzes event context and proposes optimal markets
 * Supports Binary, Categorical, and Scalar market types
 */

import { AgentContext } from './types';
import { executeWithFailover } from './provider-switcher';

export type MarketType = 'binary' | 'categorical' | 'scalar';

export interface ProposedMarket {
  id: string;
  name: string;
  question: string;
  description: string;
  type: MarketType;
  outcomes: string[];
  suggestedLiquidity: number;
  tradingFee: number;
  category: string;
  confidence: number;
  reasoning: string;
}

export interface MarketProposalResult {
  primaryMarket: ProposedMarket;
  secondaryMarkets: ProposedMarket[];
  totalSuggestedLiquidity: number;
  provider: 'vertex' | 'kimi' | 'rule-based';
}

// Market type detection patterns
const MARKET_PATTERNS = {
  binary: {
    indicators: ['হবে কি', 'হবে', 'কি', 'কি?', 'will', 'will it', 'yes/no', 'হ্যাঁ/না'],
    outcomes: ['হ্যাঁ (Yes)', 'না (No)'],
  },
  categorical: {
    indicators: ['কে জিতবে', 'কে হবে', 'কোন দল', 'কোনটি', 'who will win', 'which team', 'winner'],
    teamIndicators: ['বনাম', 'vs', 'বনামে', 'against', 'ম্যাচ', 'ম্যাচে'],
  },
  scalar: {
    indicators: ['কত', 'দাম কত', 'স্কোর', 'রান', 'গোল', 'how many', 'price', 'score', 'runs'],
    rangeIndicators: ['০-', '0-', 'বেশি', 'কম', 'over', 'under', 'above', 'below'],
  },
};

/**
 * Detect market type from event context
 */
export function detectMarketType(title: string, description?: string): MarketType {
  const text = `${title} ${description || ''}`.toLowerCase();
  
  // Check for scalar indicators first (more specific)
  if (MARKET_PATTERNS.scalar.indicators.some(i => text.includes(i.toLowerCase()))) {
    return 'scalar';
  }
  
  // Check for categorical indicators
  if (MARKET_PATTERNS.categorical.indicators.some(i => text.includes(i.toLowerCase()))) {
    return 'categorical';
  }
  
  // Default to binary
  return 'binary';
}

/**
 * Extract teams/entities for categorical markets
 */
function extractEntities(text: string): string[] {
  const entities: string[] = [];
  
  // Common BPL teams
  const bplTeams = [
    'ঢাকা', 'কুমিল্লা', 'রংপুর', 'চট্টগ্রাম', 'সিলেট', 'খুলনা', 'বরিশাল',
    'Dhaka', 'Comilla', 'Rangpur', 'Chittagong', 'Sylhet', 'Khulna', 'Barisal'
  ];
  
  // International teams
  const intlTeams = [
    'বাংলাদেশ', 'ভারত', 'পাকিস্তান', 'অস্ট্রেলিয়া', 'ইংল্যান্ড', 
    'Bangladesh', 'India', 'Pakistan', 'Australia', 'England'
  ];
  
  // Check for teams
  [...bplTeams, ...intlTeams].forEach(team => {
    if (text.includes(team)) {
      entities.push(team);
    }
  });
  
  return [...new Set(entities)];
}

/**
 * Generate outcomes based on market type
 */
function generateOutcomes(type: MarketType, title: string, description?: string): string[] {
  switch (type) {
    case 'binary':
      return ['হ্যাঁ (Yes)', 'না (No)'];
    
    case 'categorical': {
      const entities = extractEntities(`${title} ${description || ''}`);
      if (entities.length >= 2) {
        return entities.slice(0, 4); // Max 4 outcomes
      }
      return ['অপশন ১', 'অপশন ২', 'অপশন ৩'];
    }
    
    case 'scalar':
      return ['Over', 'Under', 'Exact'];
    
    default:
      return ['হ্যাঁ (Yes)', 'না (No)'];
  }
}

/**
 * Calculate suggested liquidity based on category and type
 */
function calculateLiquidity(category: string, marketType: MarketType, isPrimary: boolean): number {
  const baseLiquidity: Record<string, number> = {
    'sports': 10000,
    'politics': 5000,
    'crypto': 5000,
    'entertainment': 3000,
    'other': 2000,
  };
  
  let liquidity = baseLiquidity[category.toLowerCase()] || 2000;
  
  // Adjust for market type
  if (marketType === 'categorical') {
    liquidity *= 1.5; // More liquidity for multi-outcome
  } else if (marketType === 'scalar') {
    liquidity *= 1.2;
  }
  
  // Primary market gets more liquidity
  if (isPrimary) {
    liquidity *= 1.5;
  }
  
  return Math.round(liquidity);
}

/**
 * Rule-based market proposal
 */
function generateRuleBasedProposals(context: AgentContext): MarketProposalResult {
  const title = context.title || '';
  const description = context.description || '';
  const category = context.category || 'other';
  
  const marketType = detectMarketType(title, description);
  const outcomes = generateOutcomes(marketType, title, description);
  
  // Primary market
  const primaryMarket: ProposedMarket = {
    id: 'primary',
    name: marketType === 'binary' ? 'মূল বাজার (Main Market)' : 'বিজয়ী বাজার (Winner Market)',
    question: title,
    description: description || `${title} - এই ইভেন্টের ফলাফল ভবিষ্যৎবাণী করুন`,
    type: marketType,
    outcomes,
    suggestedLiquidity: calculateLiquidity(category, marketType, true),
    tradingFee: 0.02,
    category,
    confidence: 0.7,
    reasoning: `Detected ${marketType} market type from title analysis`,
  };
  
  // Secondary markets based on context
  const secondaryMarkets: ProposedMarket[] = [];
  
  // For sports events, add over/under market
  if (category.toLowerCase() === 'sports' || title.toLowerCase().includes('ক্রিকেট') || title.toLowerCase().includes('cricket')) {
    secondaryMarkets.push({
      id: 'secondary-1',
      name: 'রান সংখ্যা (Total Runs)',
      question: `মোট রান কত হবে?`,
      description: 'ম্যাচে মোট রান সংখ্যা ভবিষ্যৎবাণী করুন',
      type: 'scalar',
      outcomes: ['Over 300', 'Under 300', 'Exactly 300'],
      suggestedLiquidity: calculateLiquidity(category, 'scalar', false),
      tradingFee: 0.025,
      category,
      confidence: 0.6,
      reasoning: 'Sports events often have run-based side markets',
    });
  }
  
  // For crypto, add price range market
  if (category.toLowerCase() === 'crypto' || title.toLowerCase().includes('bitcoin') || title.toLowerCase().includes('বিটকয়েন')) {
    secondaryMarkets.push({
      id: 'secondary-crypto',
      name: 'মূল্য পরিসর (Price Range)',
      question: `দাম কোন পরিসরে থাকবে?`,
      description: 'নির্দিষ্ট সময়ে দামের পরিসর ভবিষ্যৎবাণী করুন',
      type: 'scalar',
      outcomes: ['$40k-$45k', '$45k-$50k', '$50k+'],
      suggestedLiquidity: calculateLiquidity(category, 'scalar', false),
      tradingFee: 0.025,
      category,
      confidence: 0.65,
      reasoning: 'Crypto markets benefit from price range predictions',
    });
  }
  
  const totalLiquidity = primaryMarket.suggestedLiquidity + 
    secondaryMarkets.reduce((sum, m) => sum + m.suggestedLiquidity, 0);
  
  return {
    primaryMarket,
    secondaryMarkets,
    totalSuggestedLiquidity: totalLiquidity,
    provider: 'rule-based',
  };
}

/**
 * Vertex AI market proposal
 */
async function generateWithVertexAI(context: AgentContext): Promise<MarketProposalResult> {
  const response = await fetch('/api/ai/vertex-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'market-proposal',
      context,
    }),
  });

  if (!response.ok) {
    throw new Error('Vertex AI market proposal failed');
  }

  const data = await response.json();
  return {
    ...data.result,
    provider: 'vertex',
  };
}

/**
 * Kimi API market proposal
 */
async function generateWithKimi(context: AgentContext): Promise<MarketProposalResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not set');
  }
  
  const prompt = `
Analyze this Bangladeshi prediction market event and propose optimal markets.

Event Title: "${context.title}"
Description: "${context.description || ''}"
Category: ${context.category || 'Unknown'}

Propose:
1. Primary market (main prediction)
2. 1-2 secondary markets (side predictions)

For each market provide:
- name (Bengali)
- question
- type (binary/categorical/scalar)
- outcomes (array)
- suggestedLiquidity (BDT)
- reasoning

Respond in JSON:
{
  "primaryMarket": { "name": "...", "question": "...", "type": "...", "outcomes": [...], "suggestedLiquidity": 10000, "reasoning": "..." },
  "secondaryMarkets": [{ ... }],
  "totalSuggestedLiquidity": 15000
}
`;

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-latest',
      messages: [
        { role: 'system', content: 'You propose prediction markets for Bangladeshi events.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from Kimi');
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON from Kimi');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    primaryMarket: {
      ...parsed.primaryMarket,
      id: 'primary',
      tradingFee: 0.02,
      category: context.category || 'other',
      confidence: 0.8,
    },
    secondaryMarkets: (parsed.secondaryMarkets || []).map((m: any, i: number) => ({
      ...m,
      id: `secondary-${i}`,
      tradingFee: 0.025,
      category: context.category || 'other',
      confidence: 0.75,
    })),
    totalSuggestedLiquidity: parsed.totalSuggestedLiquidity,
    provider: 'kimi',
  };
}

/**
 * Main market proposal function
 */
export async function proposeMarkets(
  context: AgentContext
): Promise<MarketProposalResult> {
  console.log('[MarketProposalAgent] Analyzing event:', context.title);
  
  const { result, provider } = await executeWithFailover(
    () => generateWithVertexAI(context),
    () => generateWithKimi(context),
    () => generateRuleBasedProposals(context)
  );
  
  console.log(`[MarketProposalAgent] Proposed ${1 + result.secondaryMarkets.length} markets using ${provider}`);
  
  return result;
}

/**
 * Quick market type detection (for UI)
 */
export function quickMarketTypeDetect(title: string): {
  type: MarketType;
  confidence: number;
} {
  const type = detectMarketType(title);
  return { type, confidence: 0.7 };
}

/**
 * Get default markets for category
 */
export function getDefaultMarketsForCategory(category: string): Partial<ProposedMarket>[] {
  const defaults: Record<string, Partial<ProposedMarket>[]> = {
    'sports': [
      { name: 'বিজয়ী (Winner)', type: 'categorical', suggestedLiquidity: 10000 },
      { name: 'মোট রান (Total Runs)', type: 'scalar', suggestedLiquidity: 5000 },
    ],
    'politics': [
      { name: 'নির্বাচনী ফলাফল (Election Result)', type: 'categorical', suggestedLiquidity: 8000 },
    ],
    'crypto': [
      { name: 'দাম বৃদ্ধি (Price Up)', type: 'binary', suggestedLiquidity: 5000 },
      { name: 'মূল্য পরিসর (Price Range)', type: 'scalar', suggestedLiquidity: 3000 },
    ],
  };
  
  return defaults[category.toLowerCase()] || [
    { name: 'মূল বাজার (Main Market)', type: 'binary', suggestedLiquidity: 2000 },
  ];
}
