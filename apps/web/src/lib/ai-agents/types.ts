/**
 * AI Agent System - Types and Interfaces
 * Multi-agent orchestration for event creation
 */

export type AgentType = 'content' | 'logic' | 'timing' | 'risk' | 'idle';

export type AgentStatus = 'idle' | 'processing' | 'completed' | 'error';

export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  progress: number;
  message?: string;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentContext {
  title?: string;
  description?: string;
  category?: string;
  outcomes?: string[];
  tradingClosesAt?: string;
  resolutionDate?: string;
  rawInput?: string;
  existingEvents?: string[];
}

export interface ContentAgentResult {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  tags: string[];
  seoScore: number;
  confidence: number;
  sources?: string[];
}

export interface MarketLogicResult {
  marketType: 'binary' | 'categorical' | 'scalar';
  outcomes: string[];
  outcomeCount: number;
  liquidityRecommendation: number;
  tradingFee: number;
  minTradeAmount: number;
  maxTradeAmount: number;
  bParameter: number;
  confidence: number;
}

export interface TimingResult {
  tradingClosesAt: string;
  resolutionDate: string;
  timezone: string;
  isValid: boolean;
  warnings: string[];
  confidence: number;
}

export interface RiskAssessmentResult {
  isSafe: boolean;
  riskScore: number;
  violations: string[];
  warnings: string[];
  recommendations: string[];
  policyChecks: {
    cyberSecurityLaw: boolean;
    termsOfService: boolean;
    gamblingPolicy: boolean;
    politicalSensitivity: boolean;
  };
  confidence: number;
}

export interface AgentOrchestrationResult {
  success: boolean;
  content?: ContentAgentResult;
  marketLogic?: MarketLogicResult;
  timing?: TimingResult;
  riskAssessment?: RiskAssessmentResult;
  errors: string[];
  warnings: string[];
  metadata: {
    totalTime: number;
    agentsUsed: AgentType[];
    providerUsed: 'vertex' | 'kimi' | 'rule-based';
  };
}

export interface ProviderConfig {
  name: 'vertex' | 'kimi';
  priority: number;
  isAvailable: boolean;
  lastError?: string;
  rateLimitRemaining?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  matchedEvent?: {
    id: string;
    title: string;
    slug: string;
  };
  suggestions: string[];
}
