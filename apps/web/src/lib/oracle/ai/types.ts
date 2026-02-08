/**
 * Advanced AI-Powered Oracle System Types - Bangladesh Context
 * With Multi-Source Verification Architecture
 */

// ============================================
// SOURCE TIER TYPES
// ============================================

export type SourceTier = 'primary' | 'secondary' | 'tertiary';

export interface SourceTierConfig {
  tier: SourceTier;
  minRequired: number;
  defaultWeight: number;
  maxWeight: number;
  minWeight: number;
  description: string;
}

export const SOURCE_TIER_CONFIGS: Record<SourceTier, SourceTierConfig> = {
  primary: {
    tier: 'primary',
    minRequired: 1,
    defaultWeight: 0.40,
    maxWeight: 0.50,
    minWeight: 0.30,
    description: 'Official statements, legal documents, direct measurements'
  },
  secondary: {
    tier: 'secondary',
    minRequired: 2,
    defaultWeight: 0.35,
    maxWeight: 0.40,
    minWeight: 0.25,
    description: 'Established news organizations'
  },
  tertiary: {
    tier: 'tertiary',
    minRequired: 2,
    defaultWeight: 0.25,
    maxWeight: 0.30,
    minWeight: 0.15,
    description: 'Social media consensus, expert panels, prediction markets'
  }
};

// ============================================
// CONFIDENCE LEVELS
// ============================================

export type ConfidenceLevel = 'automated' | 'human_review' | 'escalation';

export interface ConfidenceThreshold {
  min: number;
  max: number;
  level: ConfidenceLevel;
  action: string;
}

export const CONFIDENCE_THRESHOLDS: ConfidenceThreshold[] = [
  { min: 0.95, max: 1.0, level: 'automated', action: 'auto_resolve' },
  { min: 0.85, max: 0.95, level: 'human_review', action: 'queue_for_review' },
  { min: 0.0, max: 0.85, level: 'escalation', action: 'escalate_to_decentralized' }
];

// ============================================
// BANGLADESH CONTEXT
// ============================================

export type BangladeshDivision = 'dhaka' | 'chittagong' | 'sylhet' | 'rajshahi' | 'khulna' | 'barisal' | 'rangpur' | 'mymensingh';
export type BangladeshEventType = 'general' | 'election' | 'cricket' | 'football' | 'financial' | 'economic' | 'weather' | 'political';
export type SupportedLanguage = 'en' | 'bn' | 'mixed';

export interface BangladeshContext {
  isBangladeshContext: boolean;
  detectedLanguage: SupportedLanguage;
  division?: BangladeshDivision;
  eventType: BangladeshEventType;
  politicalContext?: {
    involvesGovernment: boolean;
    involvesOpposition: boolean;
    isSensitiveTopic: boolean;
  };
}

// ============================================
// EVIDENCE AND SOURCES
// ============================================

export type SourceType = 'news' | 'social' | 'official' | 'database' | 'academic';
export type BangladeshSourceCategory = 
  | 'government_bd' 
  | 'media_english_bd' 
  | 'media_bengali_bd' 
  | 'sports_bd' 
  | 'financial_bd' 
  | 'weather_bd';

export interface EvidenceSource {
  id: string;
  url: string;
  title: string;
  content: string;
  sourceType: SourceType;
  sourceTier?: SourceTier;
  bangladeshCategory?: BangladeshSourceCategory;
  authorityScore: number;
  publishedAt: string;
  retrievedAt: string;
  credibilityScore: number;
  relevanceScore: number;
  rawMetadata: {
    author?: string;
    source?: string;
    country?: string;
    language?: string;
    isBengaliContent?: boolean;
    ownerName?: string;
    ownerType?: string;
    [key: string]: any;
  };
}

export interface EvidenceCorpus {
  query: string;
  sources: EvidenceSource[];
  totalSources: number;
  crossVerificationScore: number;
  temporalProximity: number;
  bangladeshContext: BangladeshContext;
}

// ============================================
// VERIFICATION TYPES
// ============================================

export interface SourceRequirementCheck {
  tier: SourceTier;
  required: number;
  actual: number;
  satisfied: boolean;
  weight: number;
}

export interface SourceIndependenceResult {
  sourceA: string;
  sourceB: string;
  areIndependent: boolean;
  commonOwner?: string;
  independenceScore: number;
  relationshipPath: string[];
}

export interface WeightAdjustmentFactors {
  accuracyFactor: number;
  biasFactor: number;
  delayFactor: number;
  recencyFactor: number;
  combinedFactor: number;
}

export interface TemporalValidationResult {
  isValid: boolean;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    sourceId: string;
    description: string;
  }>;
  eventTimestamp: string;
  sourceTimestamps: Array<{
    sourceId: string;
    timestamp: string;
    status: 'before' | 'during' | 'after' | 'unknown';
    timeDiffMinutes: number;
  }>;
  consensusWindow: {
    start: string;
    end: string;
    durationMinutes: number;
  };
  outOfSequenceSources: string[];
}

export interface CrossVerificationResult {
  canAutoResolve: boolean;
  confidenceScore: number;
  verificationStatus: 'verified' | 'partial' | 'insufficient' | 'rejected';
  sourcesByTier: Record<SourceTier, EvidenceSource[]>;
  tierRequirements: SourceRequirementCheck[];
  independenceScore: number;
  ownershipConflicts: Array<{
    sources: [string, string];
    commonOwner: string;
  }>;
  sourceWeights: Array<{
    sourceId: string;
    domain: string;
    tier: SourceTier;
    baseWeight: number;
    adjustedWeight: number;
    adjustmentFactors: WeightAdjustmentFactors;
  }>;
  temporalValidation: {
    isValid: boolean;
    outOfSequenceCount: number;
    consensusWindowMinutes: number;
  };
  consensusOutcome: string;
  consensusConfidence: number;
  weightedVotes: Array<{
    outcome: string;
    weight: number;
    sources: string[];
  }>;
  blockers: string[];
  recommendations: string[];
}

export interface VerificationConfig {
  minIndependenceScore: number;
  minSourcesPerTier: Record<SourceTier, number>;
  maxOutOfSequencePercent: number;
  minConsensusConfidence: number;
  requireTemporalValidation: boolean;
  enableDynamicWeighting: boolean;
}

// ============================================
// AGENT OUTPUTS
// ============================================

export interface RetrievalAgentOutput {
  agentType: 'retrieval';
  corpus: EvidenceCorpus;
  executionTimeMs: number;
  sourcesByType: Record<string, number>;
  sourcesByBangladeshCategory?: Record<BangladeshSourceCategory, number>;
  sourcesByTier?: Record<SourceTier, number>;
}

export interface SynthesisAgentOutput {
  agentType: 'synthesis';
  probabilisticAssessment: {
    outcome: string;
    probability: number;
    confidenceInterval: [number, number];
  };
  contradictions: Array<{
    sourceA: string;
    sourceB: string;
    contradiction: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  credibilityAnalysis: Array<{
    sourceId: string;
    factors: string[];
    adjustedScore: number;
  }>;
  biasIndicators?: {
    hasBiasIndicators: boolean;
    conflictingNarratives: boolean;
    dominantNarrative?: string;
  };
  modelVersion: string;
  executionTimeMs: number;
}

export interface DeliberationAgentOutput {
  agentType: 'deliberation';
  consensusOutcome: string;
  consensusProbability: number;
  agentVotes: Array<{
    agentModel: string;
    outcome: string;
    probability: number;
    weight: number;
  }>;
  disagreementAnalysis?: string;
  ensembleMethod: 'weighted_vote' | 'bayesian' | 'max_likelihood';
  executionTimeMs: number;
}

export interface ExplanationAgentOutput {
  agentType: 'explanation';
  naturalLanguageReasoning: string;
  keyEvidenceCitations: string[];
  confidenceExplanation: string;
  uncertaintyAcknowledgment?: string;
  bangladeshContextNote?: string;
  modelUsed: string;
  executionTimeMs: number;
}

// ============================================
// RESOLUTION PIPELINE
// ============================================

export interface AIResolutionPipeline {
  pipelineId: string;
  marketId: string;
  query: string;
  status: 'running' | 'completed' | 'failed' | 'escalated';
  
  // Agent Outputs
  retrieval?: RetrievalAgentOutput;
  synthesis?: SynthesisAgentOutput;
  deliberation?: DeliberationAgentOutput;
  explanation?: ExplanationAgentOutput;
  
  // Verification Results
  verification?: CrossVerificationResult;
  
  // Bangladesh Context
  bangladeshContext?: BangladeshContext;
  
  // Final Result
  finalOutcome?: string;
  finalConfidence: number;
  confidenceLevel: ConfidenceLevel;
  recommendedAction: string;
  
  // Metadata
  startedAt: string;
  completedAt?: string;
  totalExecutionTimeMs: number;
  modelVersions: {
    synthesis: string;
    deliberation: string;
    explanation: string;
  };
}

// ============================================
// MODEL VERSIONING & A/B TESTING
// ============================================

export interface ModelVersion {
  id: string;
  modelType: 'synthesis' | 'deliberation' | 'explanation' | 'retrieval';
  version: string;
  deploymentStatus: 'staging' | 'active' | 'deprecated';
  performanceMetrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    avgLatencyMs: number;
    bangladeshSpecificAccuracy?: number;
  };
  trainingDate: string;
  datasetSize: number;
  isCanary: boolean;
  canaryTrafficPercent: number;
}

export interface ModelPerformanceMetrics {
  totalResolutions: number;
  accuracy: number;
  disputedRate: number;
  avgConfidence: number;
  humanOverrideRate: number;
  avgExecutionTimeMs: number;
}

// ============================================
// FEEDBACK & REVIEW
// ============================================

export interface ResolutionFeedback {
  id: string;
  pipelineId: string;
  marketId: string;
  wasDisputed: boolean;
  disputeOutcome?: 'upheld' | 'overturned';
  humanCorrectedOutcome?: string;
  humanReviewerId?: string;
  feedbackScore: number;
  errorType?: 'false_positive' | 'false_negative' | 'confidence_miscalibration' | 'evidence_miss';
  rootCause?: string;
  createdAt: string;
  processedAt?: string;
}

export interface HumanReviewItem {
  id: string;
  pipelineId: string;
  marketId: string;
  marketQuestion: string;
  aiOutcome: string;
  aiConfidence: number;
  aiExplanation: string;
  evidenceSummary: EvidenceSource[];
  status: 'pending' | 'assigned' | 'completed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  assignedAt?: string;
  reviewerDecision?: 'accept' | 'modify' | 'escalate';
  finalOutcome?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  deadlineAt: string;
}

// ============================================
// RESILIENCE PATTERNS
// ============================================

export interface CircuitBreakerState {
  service: string;
  status: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  lastFailureAt?: string;
  lastSuccessAt?: string;
  openedAt?: string;
  threshold: number;
  timeoutMs: number;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  tags: string[];
}

// ============================================
// API RESPONSES
// ============================================

export interface AgentAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  latencyMs: number;
  modelVersion?: string;
}

export interface AIOrchestrationResult {
  success: boolean;
  pipeline?: AIResolutionPipeline;
  error?: {
    code: string;
    message: string;
    stage?: string;
  };
  actionTaken: 'auto_resolved' | 'queued_for_review' | 'escalated' | 'failed';
}

// ============================================
// CONFIGURATION
// ============================================

export interface AIOracleConfig {
  retrieval: {
    maxSources: number;
    minSourcesPerType: number;
    timeoutMs: number;
    prioritizeBangladeshSources: boolean;
  };
  synthesis: {
    modelName: string;
    temperature: number;
    maxTokens: number;
    detectPoliticalBias: boolean;
  };
  deliberation: {
    ensembleMethod: 'weighted_vote' | 'bayesian' | 'max_likelihood';
    minConsensusThreshold: number;
  };
  explanation: {
    modelName: string;
    maxTokens: number;
    includeBengaliTranslation: boolean;
  };
  circuitBreaker: {
    failureThreshold: number;
    timeoutMs: number;
    halfOpenMaxCalls: number;
  };
  cache: {
    ttlMs: number;
    maxSize: number;
  };
  rateLimit: {
    maxRequestsPerMinute: number;
    windowMs: number;
  };
  feedback: {
    minSamplesForRetraining: number;
    retrainingIntervalDays: number;
  };
  bangladesh: {
    enabled: boolean;
    governmentSourcesPriority: boolean;
    mediaSources: string[];
    divisions: BangladeshDivision[];
  };
  verification: VerificationConfig;
}

export const DEFAULT_AI_ORACLE_CONFIG: AIOracleConfig = {
  retrieval: {
    maxSources: 25,
    minSourcesPerType: 2,
    timeoutMs: 30000,
    prioritizeBangladeshSources: true
  },
  synthesis: {
    modelName: 'google/gemini-1.5-pro',
    temperature: 0.1,
    maxTokens: 4096,
    detectPoliticalBias: true
  },
  deliberation: {
    ensembleMethod: 'weighted_vote',
    minConsensusThreshold: 0.7
  },
  explanation: {
    modelName: 'google/gemini-1.5-pro',
    maxTokens: 2048,
    includeBengaliTranslation: false
  },
  circuitBreaker: {
    failureThreshold: 5,
    timeoutMs: 60000,
    halfOpenMaxCalls: 3
  },
  cache: {
    ttlMs: 300000,
    maxSize: 1000
  },
  rateLimit: {
    maxRequestsPerMinute: 100,
    windowMs: 60000
  },
  feedback: {
    minSamplesForRetraining: 1000,
    retrainingIntervalDays: 90
  },
  bangladesh: {
    enabled: true,
    governmentSourcesPriority: true,
    mediaSources: [
      'prothomalo.com',
      'thedailystar.net',
      'bdnews24.com',
      'dhakatribune.com',
      'jugantor.com',
      'kalerkantho.com'
    ],
    divisions: ['dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'rangpur', 'mymensingh']
  },
  verification: {
    minIndependenceScore: 0.8,
    minSourcesPerTier: {
      primary: 1,
      secondary: 2,
      tertiary: 0
    },
    maxOutOfSequencePercent: 0.2,
    minConsensusConfidence: 0.7,
    requireTemporalValidation: true,
    enableDynamicWeighting: true
  }
};
