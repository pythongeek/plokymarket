/**
 * Market Logic Agent
 * - Decision Tree Logic for market type determination
 * - Binary vs Categorical market detection
 * - Liquidity and fee recommendations
 */

import { MarketLogicResult, AgentContext } from './types';
import { executeWithFailover } from './provider-switcher';

/**
 * Detect market type based on outcomes
 */
function detectMarketType(outcomes: string[]): 'binary' | 'categorical' | 'scalar' {
  if (!outcomes || outcomes.length === 0) {
    return 'binary'; // Default
  }
  
  // Binary: exactly 2 outcomes
  if (outcomes.length === 2) {
    // Check if it's Yes/No type
    const normalized = outcomes.map(o => o.toLowerCase().trim());
    const yesNoVariants = [
      ['হ্যাঁ', 'না'],
      ['yes', 'no'],
      ['হ্যা', 'না'],
      ['true', 'false'],
    ];
    
    for (const variant of yesNoVariants) {
      if (
        normalized.includes(variant[0].toLowerCase()) &&
        normalized.includes(variant[1].toLowerCase())
      ) {
        return 'binary';
      }
    }
    
    // 2 outcomes but not yes/no - still binary
    return 'binary';
  }
  
  // Categorical: 3-10 outcomes
  if (outcomes.length >= 3 && outcomes.length <= 10) {
    return 'categorical';
  }
  
  // Scalar: numeric ranges or >10 outcomes
  return 'scalar';
}

/**
 * Calculate recommended liquidity based on category and market type
 */
function calculateLiquidity(
  category: string,
  marketType: 'binary' | 'categorical' | 'scalar',
  outcomeCount: number
): number {
  // Base liquidity by category
  const baseLiquidity: Record<string, number> = {
    'Sports': 5000,
    'Politics': 3000,
    'Crypto': 2000,
    'Entertainment': 1500,
    'Weather': 1000,
    'Other': 1000,
  };
  
  let liquidity = baseLiquidity[category] || 1000;
  
  // Adjust by market type
  if (marketType === 'categorical') {
    // More outcomes = more liquidity needed
    liquidity *= (1 + (outcomeCount - 2) * 0.2);
  } else if (marketType === 'scalar') {
    liquidity *= 1.5;
  }
  
  return Math.round(liquidity);
}

/**
 * Calculate trading fee based on market type
 */
function calculateTradingFee(marketType: 'binary' | 'categorical' | 'scalar'): number {
  switch (marketType) {
    case 'binary':
      return 0.02; // 2%
    case 'categorical':
      return 0.025; // 2.5%
    case 'scalar':
      return 0.03; // 3%
    default:
      return 0.02;
  }
}

/**
 * Calculate trade amount limits
 */
function calculateTradeLimits(liquidity: number): {
  minTradeAmount: number;
  maxTradeAmount: number;
} {
  // Min trade: 1% of liquidity or 10, whichever is higher
  const minTradeAmount = Math.max(10, Math.round(liquidity * 0.01));
  
  // Max trade: 10% of liquidity or 10000, whichever is lower
  const maxTradeAmount = Math.min(10000, Math.round(liquidity * 0.1));
  
  return { minTradeAmount, maxTradeAmount };
}

/**
 * Calculate B parameter for LMSR (Logarithmic Market Scoring Rule)
 */
function calculateBParameter(liquidity: number, outcomeCount: number): number {
  // B = liquidity / ln(outcome_count)
  // This ensures proper price sensitivity
  const lnOutcomes = Math.log(outcomeCount);
  return Math.round(liquidity / lnOutcomes);
}

/**
 * Generate default outcomes based on title
 */
function generateDefaultOutcomes(title: string): string[] {
  const normalized = title.toLowerCase();
  
  // Check for specific patterns
  if (normalized.includes('বিজয়') || normalized.includes('জিতবে') || normalized.includes('হবে')) {
    // Winner prediction - needs teams
    return ['Team A', 'Team B', 'Draw'];
  }
  
  if (normalized.includes('দাম') || normalized.includes('মূল্য') || normalized.includes('price')) {
    // Price prediction
    return ['বাড়বে (Up)', 'কমবে (Down)', 'অপরিবর্তিত (Same)'];
  }
  
  // Default binary
  return ['হ্যাঁ (Yes)', 'না (No)'];
}

/**
 * Rule-based market logic
 */
function analyzeMarketRuleBased(context: AgentContext): MarketLogicResult {
  const outcomes = context.outcomes || generateDefaultOutcomes(context.title || '');
  const category = context.category || 'Other';
  
  const marketType = detectMarketType(outcomes);
  const liquidity = calculateLiquidity(category, marketType, outcomes.length);
  const tradingFee = calculateTradingFee(marketType);
  const { minTradeAmount, maxTradeAmount } = calculateTradeLimits(liquidity);
  const bParameter = calculateBParameter(liquidity, outcomes.length);
  
  return {
    marketType,
    outcomes,
    outcomeCount: outcomes.length,
    liquidityRecommendation: liquidity,
    tradingFee,
    minTradeAmount,
    maxTradeAmount,
    bParameter,
    confidence: 0.7,
  };
}

/**
 * Vertex AI market analysis (SERVER-SIDE ONLY)
 */
async function analyzeWithVertexAI(context: AgentContext): Promise<MarketLogicResult> {
  const response = await fetch('/api/ai/vertex-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'market-logic',
      context,
    }),
  });

  if (!response.ok) {
    throw new Error('Vertex AI API call failed');
  }

  const data = await response.json();
  return {
    ...data.result,
    bParameter: calculateBParameter(data.result.liquidity, data.result.outcomes.length),
    confidence: 0.85,
  };
}

/**
 * Kimi API market analysis
 */
async function analyzeWithKimi(context: AgentContext): Promise<MarketLogicResult> {
  const apiKey = process.env.KIMI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIMI_API_KEY not set');
  }
  
  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-latest',
      messages: [
        {
          role: 'system',
          content: 'You analyze prediction markets and recommend optimal settings.',
        },
        {
          role: 'user',
          content: `Analyze this market: "${context.title}"
Category: ${context.category}

Return JSON:
{
  "marketType": "binary",
  "outcomes": ["হ্যাঁ", "না"],
  "liquidity": 1000,
  "tradingFee": 0.02,
  "minTrade": 10,
  "maxTrade": 5000
}`,
        },
      ],
      temperature: 0.2,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Kimi API error: ${response.status}`);
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response');
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  return {
    marketType: parsed.marketType,
    outcomes: parsed.outcomes,
    outcomeCount: parsed.outcomes.length,
    liquidityRecommendation: parsed.liquidity,
    tradingFee: parsed.tradingFee,
    minTradeAmount: parsed.minTrade,
    maxTradeAmount: parsed.maxTrade,
    bParameter: calculateBParameter(parsed.liquidity, parsed.outcomes.length),
    confidence: 0.8,
  };
}

/**
 * Main Market Logic Agent
 */
export async function runMarketLogicAgent(
  context: AgentContext
): Promise<MarketLogicResult> {
  console.log('[MarketLogicAgent] Analyzing:', context.title);
  
  const { result, provider } = await executeWithFailover(
    () => analyzeWithVertexAI(context),
    () => analyzeWithKimi(context),
    () => analyzeMarketRuleBased(context)
  );
  
  console.log(`[MarketLogicAgent] Completed using ${provider}`);
  
  return result;
}

/**
 * Quick market type detection (for real-time UI)
 */
export function quickDetectMarketType(outcomes: string[]): 'binary' | 'categorical' | 'scalar' {
  return detectMarketType(outcomes);
}

/**
 * Get default market config for category
 */
export function getDefaultMarketConfig(category: string): Partial<MarketLogicResult> {
  const configs: Record<string, Partial<MarketLogicResult>> = {
    'Sports': {
      liquidityRecommendation: 5000,
      tradingFee: 0.02,
      minTradeAmount: 50,
      maxTradeAmount: 5000,
    },
    'Politics': {
      liquidityRecommendation: 3000,
      tradingFee: 0.025,
      minTradeAmount: 100,
      maxTradeAmount: 3000,
    },
    'Crypto': {
      liquidityRecommendation: 2000,
      tradingFee: 0.02,
      minTradeAmount: 10,
      maxTradeAmount: 2000,
    },
  };
  
  return configs[category] || {
    liquidityRecommendation: 1000,
    tradingFee: 0.02,
    minTradeAmount: 10,
    maxTradeAmount: 1000,
  };
}
