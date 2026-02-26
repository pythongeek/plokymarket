/**
 * AI Agents Module
 * Multi-agent orchestration system for event creation
 */

// Types
export * from './types';

// Agents
export { runContentAgent, quickEnhanceTitle } from './content-agent';
export { runMarketLogicAgent, quickDetectMarketType, getDefaultMarketConfig } from './market-logic-agent';
export { runTimingAgent, quickTimingSuggestion, formatDuration, convertToDhakaTime, convertFromDhakaToUTC } from './timing-agent';
export { runRiskAgent, quickRiskCheck, getSafetyBadgeColor } from './risk-agent';

// Duplicate Detection
export { checkForDuplicates, findSimilarEvents, levenshteinDistance, similarityRatio, quickSimilarityCheck } from './duplicate-detector';

// Provider Management
export { getBestProvider, rotateProvider, markProviderUnavailable, getProviderHealth, executeWithFailover } from './provider-switcher';

// Orchestrator
export { AgentOrchestrator, getOrchestrator, resetOrchestrator } from './orchestrator';

// Re-export types for convenience
export type {
  AgentType,
  AgentStatus,
  AgentState,
  AgentContext,
  ContentAgentResult,
  MarketLogicResult,
  TimingResult,
  RiskAssessmentResult,
  AgentOrchestrationResult,
  DuplicateCheckResult,
} from './types';
