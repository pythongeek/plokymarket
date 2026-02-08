/**
 * Oracle Type Implementations
 * Complete comparison of oracle strategies for different use cases
 * Bangladesh-context optimized
 */

export type OracleType = 'centralized' | 'chainlink_don' | 'uma_optimistic' | 'ai_powered' | 'manual_admin';

export interface OracleTypeConfig {
  type: OracleType;
  name: string;
  bestFor: string;
  latency: string;
  trustModel: string;
  costRange: string;
  costAmount: { min: number; max: number; currency: string };
  description: string;
  
  // Bangladesh specific
  bdOptimized: boolean;
  bdUseCases: string[];
  bdRegulatoryStatus: string;
  
  // Technical
  requiresBlockchain: boolean;
  requiresToken: boolean;
  decentralized: boolean;
  
  // Performance
  accuracy: number;
  disputeWindow: string;
  finality: 'immediate' | 'delayed' | 'challengeable';
}

export const ORACLE_TYPE_CONFIGS: Record<OracleType, OracleTypeConfig> = {
  centralized: {
    type: 'centralized',
    name: 'Centralized Oracle',
    bestFor: 'Objective, urgent, low-value (<$10K)',
    latency: '15 minutes',
    trustModel: 'Platform reputation + legal',
    costRange: 'Lowest',
    costAmount: { min: 0.5, max: 1, currency: 'USD' },
    description: 'Fast resolution by trusted platform operators for clear-cut outcomes',
    
    bdOptimized: true,
    bdUseCases: [
      'Cricket match results (verified by BCB)',
      'Weather events (BMD data)',
      'Stock prices (DSE/CSE)',
      'Government announcements'
    ],
    bdRegulatoryStatus: 'Fully compliant with Bangladesh regulations',
    
    requiresBlockchain: false,
    requiresToken: false,
    decentralized: false,
    
    accuracy: 0.99,
    disputeWindow: 'None (fast finality)',
    finality: 'immediate'
  },
  
  chainlink_don: {
    type: 'chainlink_don',
    name: 'Chainlink Decentralized Oracle Network',
    bestFor: 'Asset prices, deterministic data',
    latency: '1-5 minutes',
    trustModel: 'Cryptoeconomic (75B+ secured)',
    costRange: 'Low',
    costAmount: { min: 2, max: 5, currency: 'USD' },
    description: 'Decentralized node network providing high-frequency data feeds',
    
    bdOptimized: false,
    bdUseCases: [
      'BDT/USD exchange rates',
      'Cryptocurrency prices',
      'Commodity prices (gold, oil)',
      'Global stock indices'
    ],
    bdRegulatoryStatus: 'Data feeds available, limited local integration',
    
    requiresBlockchain: true,
    requiresToken: true,
    decentralized: true,
    
    accuracy: 0.999,
    disputeWindow: 'None',
    finality: 'immediate'
  },
  
  uma_optimistic: {
    type: 'uma_optimistic',
    name: 'UMA Optimistic Oracle',
    bestFor: 'Subjective, community-verifiable',
    latency: '2-48 hours',
    trustModel: 'Token-weighted voting',
    costRange: 'Medium',
    costAmount: { min: 50, max: 500, currency: 'USD' },
    description: 'Optimistic resolution with challenge period and DVM arbitration',
    
    bdOptimized: true,
    bdUseCases: [
      'Election results verification',
      'Policy outcome predictions',
      'Economic indicator disputes',
      'Complex subjective events'
    ],
    bdRegulatoryStatus: 'Compatible with Bangladesh crypto regulations',
    
    requiresBlockchain: true,
    requiresToken: true,
    decentralized: true,
    
    accuracy: 0.95,
    disputeWindow: '48 hours (extendable)',
    finality: 'challengeable'
  },
  
  ai_powered: {
    type: 'ai_powered',
    name: 'AI-Powered Oracle',
    bestFor: 'Complex natural language, multi-source',
    latency: '2-6 hours',
    trustModel: 'ML confidence + human appeal',
    costRange: 'Medium',
    costAmount: { min: 100, max: 1000, currency: 'USD' },
    description: 'Multi-agent AI system with defense-in-depth verification',
    
    bdOptimized: true,
    bdUseCases: [
      'Bangladesh political analysis',
      'Multi-source news verification',
      'Bengali language content',
      'Complex event interpretation'
    ],
    bdRegulatoryStatus: 'AI guidelines compliant, explainable decisions',
    
    requiresBlockchain: false,
    requiresToken: false,
    decentralized: false,
    
    accuracy: 0.94,
    disputeWindow: '24-48 hours (escalating)',
    finality: 'challengeable'
  },
  
  manual_admin: {
    type: 'manual_admin',
    name: 'Manual Admin Oracle',
    bestFor: 'Emergency, system failure, extraordinary',
    latency: '24-72 hours',
    trustModel: 'Multi-sig + transparency',
    costRange: 'Highest',
    costAmount: { min: 500, max: 2000, currency: 'USD' },
    description: 'Human-administered resolution for edge cases and emergencies',
    
    bdOptimized: true,
    bdUseCases: [
      'System failures',
      'Extraordinary events',
      'Oracle malfunction',
      'Regulatory intervention'
    ],
    bdRegulatoryStatus: 'Emergency powers under platform terms',
    
    requiresBlockchain: false,
    requiresToken: false,
    decentralized: false,
    
    accuracy: 1.0,
    disputeWindow: '72 hours (governance)',
    finality: 'delayed'
  }
};

// Oracle selection helper
export interface OracleSelectionCriteria {
  marketValue: number;
  isUrgent: boolean;
  isSubjective: boolean;
  requiresBangladeshContext: boolean;
  requiresBlockchainFinality: boolean;
  maxAcceptableCost: number;
}

export function recommendOracleType(criteria: OracleSelectionCriteria): OracleTypeConfig {
  const { 
    marketValue, 
    isUrgent, 
    isSubjective, 
    requiresBangladeshContext,
    requiresBlockchainFinality,
    maxAcceptableCost 
  } = criteria;
  
  // Decision tree
  
  // Emergency/system failure -> Manual Admin
  if (marketValue === 0 && isUrgent) {
    return ORACLE_TYPE_CONFIGS.manual_admin;
  }
  
  // Low value + urgent + objective -> Centralized
  if (marketValue < 10000 && isUrgent && !isSubjective) {
    return ORACLE_TYPE_CONFIGS.centralized;
  }
  
  // Asset prices + deterministic -> Chainlink
  if (!isSubjective && requiresBlockchainFinality) {
    return ORACLE_TYPE_CONFIGS.chainlink_don;
  }
  
  // Bangladesh context + complex -> AI Powered
  if (requiresBangladeshContext && isSubjective) {
    return ORACLE_TYPE_CONFIGS.ai_powered;
  }
  
  // Community-verifiable + blockchain -> UMA
  if (isSubjective && requiresBlockchainFinality && !requiresBangladeshContext) {
    return ORACLE_TYPE_CONFIGS.uma_optimistic;
  }
  
  // Default: AI Powered for Bangladesh markets
  return ORACLE_TYPE_CONFIGS.ai_powered;
}

// Oracle comparison table for UI
export interface OracleComparisonRow {
  feature: string;
  centralized: string;
  chainlink: string;
  uma: string;
  ai: string;
  manual: string;
}

export const ORACLE_COMPARISON_TABLE: OracleComparisonRow[] = [
  {
    feature: 'Best For',
    centralized: 'Objective, urgent, low-value (<$10K)',
    chainlink: 'Asset prices, deterministic data',
    uma: 'Subjective, community-verifiable',
    ai: 'Complex natural language, multi-source',
    manual: 'Emergency, system failure'
  },
  {
    feature: 'Latency',
    centralized: '15 minutes',
    chainlink: '1-5 minutes',
    uma: '2-48 hours',
    ai: '2-6 hours',
    manual: '24-72 hours'
  },
  {
    feature: 'Trust Model',
    centralized: 'Platform reputation + legal',
    chainlink: 'Cryptoeconomic (75B+ secured)',
    uma: 'Token-weighted voting',
    ai: 'ML confidence + human appeal',
    manual: 'Multi-sig + transparency'
  },
  {
    feature: 'Cost (USD)',
    centralized: '$0.50-1',
    chainlink: '$2-5',
    uma: '$50-500',
    ai: '$100-1000',
    manual: '$500-2000'
  },
  {
    feature: 'Bangladesh Optimized',
    centralized: '✅ Yes',
    chainlink: '⚠️ Limited',
    uma: '✅ Yes',
    ai: '✅ Yes',
    manual: '✅ Yes'
  },
  {
    feature: 'Decentralized',
    centralized: '❌ No',
    chainlink: '✅ Yes',
    uma: '✅ Yes',
    ai: '❌ No',
    manual: '❌ No'
  },
  {
    feature: 'Dispute Window',
    centralized: 'None',
    chainlink: 'None',
    uma: '48 hours',
    ai: '24-48 hours',
    manual: '72 hours'
  },
  {
    feature: 'Accuracy',
    centralized: '99%',
    chainlink: '99.9%',
    uma: '95%',
    ai: '94%',
    manual: '100%'
  }
];

// Cost calculator for Bangladesh markets
export function calculateOracleCost(
  oracleType: OracleType,
  marketValueBDT: number,
  complexity: 'low' | 'medium' | 'high'
): {
  baseCost: number;
  complexityMultiplier: number;
  totalCost: number;
  currency: string;
} {
  const config = ORACLE_TYPE_CONFIGS[oracleType];
  let baseCost = config.costAmount.min;
  
  // Complexity multiplier
  const multipliers = { low: 1, medium: 1.5, high: 2 };
  const complexityMultiplier = multipliers[complexity];
  
  // Scale with market value for high-value markets
  if (marketValueBDT > 1000000) { // > 10 lakh
    baseCost *= 1.5;
  }
  
  return {
    baseCost,
    complexityMultiplier,
    totalCost: baseCost * complexityMultiplier,
    currency: config.costAmount.currency
  };
}
