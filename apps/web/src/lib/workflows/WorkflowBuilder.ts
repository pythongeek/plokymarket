/**
 * Advanced Upstash Workflow Builder
 * Industry-standard verification orchestrator
 * Configurable, chainable, with multi-source consensus
 */

export type VerificationMethod =
  | 'ai_oracle'
  | 'news_consensus'
  | 'api_price_feed'
  | 'sports_api'
  | 'expert_voting'
  | 'community_voting'
  | 'manual_admin'
  | 'chainlink_oracle'
  | 'trusted_sources';

export type WorkflowLogic = 'all' | 'any' | 'weighted_consensus' | 'first_success';

export interface VerificationSource {
  id: string;
  method: VerificationMethod;
  enabled: boolean;
  weight: number; // 0-100, for weighted consensus
  timeout: number; // milliseconds
  fallback: VerificationSource | null;
  config: Record<string, any>;
  minConfidence: number; // 0-100
  retries: number;
  retryBackoff: 'exponential' | 'linear';
}

export interface WorkflowStep {
  id: string;
  name: string;
  sources: VerificationSource[];
  logic: WorkflowLogic;
  requiredConfidence: number; // 0-100
  timeout: number; // Total timeout for this step
  fallbackStep: WorkflowStep | null;
  onSuccess: 'resolve' | 'continue';
  onFailure: 'continue' | 'escalate' | 'manual_review';
}

export interface VerificationWorkflow {
  id: string;
  name: string;
  description: string;
  eventCategory: string; // 'crypto', 'sports', 'politics', 'news', etc.
  steps: WorkflowStep[];
  globalTimeout: number;
  finalOutcomeLogic: WorkflowLogic;
  escalationThreshold: number; // Confidence threshold for escalation
  auditTrail: boolean;
  alertOnMismatch: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowResult {
  eventId: string;
  workflowId: string;
  outcome: 'yes' | 'no' | 'uncertain' | 'escalated';
  confidence: number; // 0-100
  reasoning: string;
  sources: {
    method: VerificationMethod;
    result: 'yes' | 'no' | 'uncertain';
    confidence: number;
    evidence: Record<string, any>;
    executionTime: number;
  }[];
  mismatch: boolean;
  mismatchDetails: string | null;
  escalationReason: string | null;
  executedAt: Date;
  totalExecutionTime: number;
}

/**
 * Build a workflow step with verification sources
 */
export function buildWorkflowStep(config: {
  name: string;
  sources: Array<{
    method: VerificationMethod;
    weight?: number;
    timeout?: number;
    minConfidence?: number;
    retries?: number;
    config?: Record<string, any>;
  }>;
  logic?: WorkflowLogic;
  requiredConfidence?: number;
  timeout?: number;
}): WorkflowStep {
  return {
    id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: config.name,
    sources: config.sources.map((src, idx) => ({
      id: `source_${idx}`,
      method: src.method,
      enabled: true,
      weight: src.weight ?? 100 / config.sources.length,
      timeout: src.timeout ?? 30000,
      fallback: null,
      config: src.config ?? {},
      minConfidence: src.minConfidence ?? 0,
      retries: src.retries ?? 2,
      retryBackoff: 'exponential',
    })),
    logic: config.logic ?? 'weighted_consensus',
    requiredConfidence: config.requiredConfidence ?? 85,
    timeout: config.timeout ?? 60000,
    fallbackStep: null,
    onSuccess: 'resolve',
    onFailure: 'escalate',
  };
}

/**
 * Build complete verification workflow
 */
export function buildWorkflow(config: {
  name: string;
  description: string;
  eventCategory: string;
  steps: WorkflowStep[];
  finalOutcomeLogic?: WorkflowLogic;
  escalationThreshold?: number;
}): VerificationWorkflow {
  return {
    id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: config.name,
    description: config.description,
    eventCategory: config.eventCategory,
    steps: config.steps,
    globalTimeout: 300000, // 5 minutes max
    finalOutcomeLogic: config.finalOutcomeLogic ?? 'weighted_consensus',
    escalationThreshold: config.escalationThreshold ?? 75,
    auditTrail: true,
    alertOnMismatch: true,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Pre-configured workflows for common scenarios
 */
export const DEFAULT_WORKFLOWS = {
  crypto: buildWorkflow({
    name: 'Cryptocurrency Price Verification',
    description: 'Multi-source price verification for crypto predictions',
    eventCategory: 'crypto',
    steps: [
      buildWorkflowStep({
        name: 'Primary Price Sources',
        sources: [
          {
            method: 'api_price_feed',
            weight: 40,
            timeout: 20000,
            config: { exchange: 'coinbase', requireMultiple: true },
          },
          {
            method: 'chainlink_oracle',
            weight: 40,
            timeout: 15000,
            config: { network: 'ethereum', confirmations: 3 },
          },
          {
            method: 'news_consensus',
            weight: 20,
            timeout: 10000,
            config: { keywords: 'bitcoin price', sources: 5 },
          },
        ],
        logic: 'weighted_consensus',
        requiredConfidence: 90,
        timeout: 45000,
      }),
    ],
    escalationThreshold: 85,
  }),

  sports: buildWorkflow({
    name: 'Sports Event Verification',
    description: 'Multi-source sports result verification',
    eventCategory: 'sports',
    steps: [
      buildWorkflowStep({
        name: 'Official Sports APIs',
        sources: [
          {
            method: 'sports_api',
            weight: 50,
            timeout: 15000,
            config: { apis: ['cricinfo', 'espn'], requireBoth: true },
          },
          {
            method: 'news_consensus',
            weight: 30,
            timeout: 20000,
            config: { keywords: 'match result', sources: 10, trustScore: 0.8 },
          },
          {
            method: 'trusted_sources',
            weight: 20,
            timeout: 15000,
            config: { sources: ['official_board', 'news_agencies'] },
          },
        ],
        logic: 'weighted_consensus',
        requiredConfidence: 95,
        timeout: 50000,
      }),
    ],
    escalationThreshold: 90,
  }),

  politics: buildWorkflow({
    name: 'Political Event Verification',
    description: 'Multi-source political event with expert consensus',
    eventCategory: 'politics',
    steps: [
      buildWorkflowStep({
        name: 'News Consensus',
        sources: [
          {
            method: 'news_consensus',
            weight: 40,
            timeout: 30000,
            config: { sources: 20, trustThreshold: 0.7 },
          },
          {
            method: 'trusted_sources',
            weight: 40,
            timeout: 20000,
            config: { sources: ['government', 'international_bodies'] },
          },
          {
            method: 'ai_oracle',
            weight: 20,
            timeout: 15000,
            config: { model: 'gemini-1.5-flash', context: 'political' },
          },
        ],
        logic: 'weighted_consensus',
        requiredConfidence: 85,
        timeout: 70000,
      }),
      buildWorkflowStep({
        name: 'Expert Validation (Fallback)',
        sources: [
          {
            method: 'expert_voting',
            weight: 100,
            timeout: 60000,
            config: { minVotes: 5, consensusThreshold: 0.7 },
          },
        ],
        logic: 'first_success',
        requiredConfidence: 80,
        timeout: 120000,
      }),
    ],
    escalationThreshold: 80,
  }),

  news: buildWorkflow({
    name: 'News-Based Event Verification',
    description: 'AI + news consensus for general events',
    eventCategory: 'news',
    steps: [
      buildWorkflowStep({
        name: 'AI + News Consensus',
        sources: [
          {
            method: 'ai_oracle',
            weight: 50,
            timeout: 25000,
            config: { model: 'gemini-1.5-flash' },
          },
          {
            method: 'news_consensus',
            weight: 50,
            timeout: 25000,
            config: { sources: 15, trustThreshold: 0.75 },
          },
        ],
        logic: 'weighted_consensus',
        requiredConfidence: 85,
        timeout: 60000,
      }),
    ],
    escalationThreshold: 80,
  }),

  expert_panel: buildWorkflow({
    name: 'Expert Panel Verification',
    description: 'Specialist expert voting on complex topics',
    eventCategory: 'complex',
    steps: [
      buildWorkflowStep({
        name: 'Expert Voting',
        sources: [
          {
            method: 'expert_voting',
            weight: 100,
            timeout: 120000,
            config: { minVotes: 5, consensusThreshold: 0.6 },
          },
        ],
        logic: 'first_success',
        requiredConfidence: 75,
        timeout: 180000,
      }),
    ],
    escalationThreshold: 70,
  }),

  community: buildWorkflow({
    name: 'Community Consensus',
    description: 'Community voting verification',
    eventCategory: 'community',
    steps: [
      buildWorkflowStep({
        name: 'Community Vote',
        sources: [
          {
            method: 'community_voting',
            weight: 100,
            timeout: 180000,
            config: { minVoters: 100, consensusThreshold: 0.65 },
          },
        ],
        logic: 'first_success',
        requiredConfidence: 70,
        timeout: 240000,
      }),
    ],
    escalationThreshold: 75,
  }),
};

/**
 * Calculate weighted outcome from multiple sources
 */
export function calculateWeightedOutcome(results: Array<{
  result: 'yes' | 'no' | 'uncertain';
  confidence: number;
  weight: number;
}>): { outcome: 'yes' | 'no' | 'uncertain'; confidence: number } {
  let yesScore = 0;
  let noScore = 0;
  let uncertainScore = 0;
  let totalWeight = 0;

  for (const r of results) {
    if (r.result === 'yes') {
      yesScore += (r.confidence / 100) * r.weight;
    } else if (r.result === 'no') {
      noScore += (r.confidence / 100) * r.weight;
    } else {
      uncertainScore += (r.confidence / 100) * r.weight;
    }
    totalWeight += r.weight;
  }

  // Normalize
  yesScore = yesScore / totalWeight;
  noScore = noScore / totalWeight;
  uncertainScore = uncertainScore / totalWeight;

  const maxScore = Math.max(yesScore, noScore, uncertainScore);

  let outcome: 'yes' | 'no' | 'uncertain';
  if (maxScore === yesScore) outcome = 'yes';
  else if (maxScore === noScore) outcome = 'no';
  else outcome = 'uncertain';

  return {
    outcome,
    confidence: Math.round(maxScore * 100),
  };
}

/**
 * Detect workflow mismatch between sources
 */
export function detectMismatch(results: Array<{
  result: 'yes' | 'no' | 'uncertain';
  confidence: number;
}>): { hasMismatch: boolean; details: string | null } {
  const yesResults = results.filter((r) => r.result === 'yes');
  const noResults = results.filter((r) => r.result === 'no');

  // If we have both yes and no with high confidence, that's a mismatch
  const hasHighConfidenceYes = yesResults.some((r) => r.confidence >= 80);
  const hasHighConfidenceNo = noResults.some((r) => r.confidence >= 80);

  if (hasHighConfidenceYes && hasHighConfidenceNo) {
    return {
      hasMismatch: true,
      details: `Conflicting results: ${yesResults.length} sources say YES (avg confidence: ${Math.round(yesResults.reduce((sum, r) => sum + r.confidence, 0) / yesResults.length)}%), ${noResults.length} sources say NO (avg confidence: ${Math.round(noResults.reduce((sum, r) => sum + r.confidence, 0) / noResults.length)}%)`,
    };
  }

  return { hasMismatch: false, details: null };
}
