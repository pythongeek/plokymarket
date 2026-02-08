/**
 * AI Oracle Orchestrator - Bangladesh Context
 * Coordinates specialized agents, multi-source verification, and feedback systems
 * Production-ready with defense-in-depth verification
 */

import { 
  AIResolutionPipeline, 
  AIOracleConfig, 
  DEFAULT_AI_ORACLE_CONFIG,
  CONFIDENCE_THRESHOLDS,
  ConfidenceLevel,
  AgentAPIResponse,
  AIOrchestrationResult,
  BangladeshContext
} from './types';

import { RetrievalAgent } from './agents/RetrievalAgent';
import { SynthesisAgent } from './agents/SynthesisAgent';
import { DeliberationAgent } from './agents/DeliberationAgent';
import { ExplanationAgent } from './agents/ExplanationAgent';

import { CircuitBreaker, getGlobalCircuitBreaker } from './resilience/CircuitBreaker';
import { OracleCache, getGlobalCache, CACHE_KEYS } from './resilience/Cache';
import { getRateLimiter } from './resilience/RateLimiter';

import { getGlobalFeedbackLoop } from './feedback/FeedbackLoop';
import { getGlobalReviewQueue } from './feedback/HumanReviewQueue';

// Verification components
import { getGlobalVerificationEngine } from './verification/CrossVerificationEngine';
import { getGlobalTemporalValidator } from './verification/TemporalValidation';
import { getSourceTier } from './verification/SourceTiers';

export class AIOrchestrator {
  private config: AIOracleConfig;
  
  // Agents
  private retrievalAgent: RetrievalAgent;
  private synthesisAgent: SynthesisAgent;
  private deliberationAgent: DeliberationAgent;
  private explanationAgent: ExplanationAgent;
  
  // Resilience components
  private circuitBreaker: CircuitBreaker;
  private cache: OracleCache;
  
  // Feedback systems
  private feedbackLoop = getGlobalFeedbackLoop();
  private reviewQueue = getGlobalReviewQueue();
  
  // Verification
  private verificationEngine = getGlobalVerificationEngine();
  private temporalValidator = getGlobalTemporalValidator();

  constructor(config: Partial<AIOracleConfig> = {}) {
    this.config = { ...DEFAULT_AI_ORACLE_CONFIG, ...config };
    
    // Initialize agents
    this.retrievalAgent = new RetrievalAgent();
    this.synthesisAgent = new SynthesisAgent();
    this.deliberationAgent = new DeliberationAgent();
    this.explanationAgent = new ExplanationAgent();
    
    // Initialize resilience components
    this.circuitBreaker = getGlobalCircuitBreaker();
    this.cache = getGlobalCache(
      this.config.cache.maxSize,
      this.config.cache.ttlMs
    );
  }

  /**
   * Execute full AI resolution pipeline with verification
   */
  async resolve(
    marketId: string,
    marketQuestion: string,
    context?: any
  ): Promise<AIOrchestrationResult> {
    const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    console.log(`[AIOrchestrator] Starting resolution pipeline ${pipelineId} for market ${marketId}`);
    
    // Detect Bangladesh context
    const bangladeshContext = this.detectBangladeshContext(marketQuestion, context);
    
    // Initialize pipeline
    const pipeline: AIResolutionPipeline = {
      pipelineId,
      marketId,
      query: marketQuestion,
      status: 'running',
      finalConfidence: 0,
      confidenceLevel: 'escalation',
      recommendedAction: 'pending',
      startedAt: new Date().toISOString(),
      totalExecutionTimeMs: 0,
      modelVersions: {
        synthesis: '2.0.0-bd',
        deliberation: '2.0.0-bd',
        explanation: '2.0.0-bd'
      },
      bangladeshContext
    };
    
    try {
      // Stage 1: Information Retrieval
      const retrievalResult = await this.executeRetrieval(marketQuestion, context);
      if (!retrievalResult.success || !retrievalResult.data) {
        throw new Error(`Retrieval failed: ${retrievalResult.error?.message}`);
      }
      pipeline.retrieval = retrievalResult.data;
      
      // Stage 2: Multi-Source Cross-Verification
      console.log(`[AIOrchestrator] Running cross-verification for ${pipeline.retrieval.corpus.sources.length} sources`);
      
      // Create event timeline for temporal validation
      const eventTimeline = context?.eventDate 
        ? {
            eventId: marketId,
            expectedStartTime: context.eventDate,
            expectedEndTime: context.eventEndDate || context.eventDate,
            timezone: 'Asia/Dhaka',
            isBreakingNews: ['cricket', 'football', 'weather'].includes(bangladeshContext.eventType),
            expectedDurationMinutes: context.durationMinutes || 180
          }
        : undefined;
      
      const verificationResult = await this.verificationEngine.verify(
        pipeline.retrieval.corpus.sources,
        eventTimeline
      );
      
      pipeline.verification = verificationResult;
      
      // If verification fails critical checks, may need to escalate early
      if (verificationResult.blockers.length > 2 && !verificationResult.canAutoResolve) {
        console.warn(`[AIOrchestrator] Critical verification blockers detected: ${verificationResult.blockers.join(', ')}`);
      }
      
      // Stage 3: Synthesis (on verified sources)
      const synthesisResult = await this.executeSynthesis(
        marketQuestion, 
        pipeline.retrieval.corpus, 
        context
      );
      if (!synthesisResult.success || !synthesisResult.data) {
        throw new Error(`Synthesis failed: ${synthesisResult.error?.message}`);
      }
      pipeline.synthesis = synthesisResult.data;
      pipeline.modelVersions.synthesis = synthesisResult.modelVersion || '2.0.0-bd';
      
      // Stage 4: Deliberation
      const deliberationResult = await this.executeDeliberation(
        marketQuestion, 
        pipeline.synthesis, 
        context
      );
      if (!deliberationResult.success || !deliberationResult.data) {
        throw new Error(`Deliberation failed: ${deliberationResult.error?.message}`);
      }
      pipeline.deliberation = deliberationResult.data;
      pipeline.modelVersions.deliberation = deliberationResult.modelVersion || '2.0.0-bd';
      
      // Combine deliberation with verification consensus
      const finalOutcome = verificationResult.consensusOutcome || deliberationResult.data.consensusOutcome;
      const finalConfidence = Math.min(
        verificationResult.confidenceScore,
        deliberationResult.data.consensusProbability
      );
      
      pipeline.finalOutcome = finalOutcome;
      pipeline.finalConfidence = finalConfidence;
      
      // Stage 5: Explanation
      const explanationResult = await this.executeExplanation(marketQuestion, pipeline, context);
      if (explanationResult.success && explanationResult.data) {
        pipeline.explanation = explanationResult.data;
        pipeline.modelVersions.explanation = explanationResult.modelVersion || '2.0.0-bd';
      }
      
      // Determine confidence level and action
      const confidenceLevel = this.determineConfidenceLevel(pipeline.finalConfidence);
      pipeline.confidenceLevel = confidenceLevel.level;
      pipeline.recommendedAction = confidenceLevel.action;
      
      // Complete pipeline
      pipeline.status = 'completed';
      pipeline.completedAt = new Date().toISOString();
      pipeline.totalExecutionTimeMs = Date.now() - startTime;
      
      console.log(`[AIOrchestrator] Pipeline ${pipelineId} completed. Outcome: ${pipeline.finalOutcome}, Confidence: ${(pipeline.finalConfidence * 100).toFixed(1)}%, Verification: ${verificationResult.verificationStatus}`);
      
      // Take action based on confidence level AND verification
      return this.handleResolutionAction(pipeline, confidenceLevel, verificationResult);
      
    } catch (error) {
      console.error(`[AIOrchestrator] Pipeline ${pipelineId} failed:`, error);
      
      pipeline.status = 'failed';
      pipeline.completedAt = new Date().toISOString();
      pipeline.totalExecutionTimeMs = Date.now() - startTime;
      
      return {
        success: false,
        pipeline,
        error: {
          code: 'PIPELINE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        actionTaken: 'failed'
      };
    }
  }

  /**
   * Detect Bangladesh context from query
   */
  private detectBangladeshContext(question: string, context?: any): BangladeshContext {
    const lowerQuestion = question.toLowerCase();
    
    // Bangladesh keywords
    const bdKeywords = [
      'bangladesh', 'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna',
      'বাংলাদেশ', 'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা',
      'bdt', 'taka', 'টাকা', 'awami league', 'bnp', 'shakib', 'tamim'
    ];
    
    const isBangladeshContext = bdKeywords.some(kw => lowerQuestion.includes(kw));
    
    // Event type detection
    let eventType: BangladeshContext['eventType'] = 'general';
    if (lowerQuestion.match(/election|vote|নির্বাচন|ভোট/)) eventType = 'election';
    else if (lowerQuestion.match(/cricket|ক্রিকেট/)) eventType = 'cricket';
    else if (lowerQuestion.match(/football|ফুটবল/)) eventType = 'football';
    else if (lowerQuestion.match(/stock|share|dse|taka|টাকা/)) eventType = 'financial';
    else if (lowerQuestion.match(/budget|gdp|economy/)) eventType = 'economic';
    else if (lowerQuestion.match(/weather|rain|cyclone|বৃষ্টি/)) eventType = 'weather';
    else if (lowerQuestion.match(/government|minister|prime minister/)) eventType = 'political';
    
    // Language detection
    const hasBengali = /[\u0980-\u09FF]/.test(question);
    const hasEnglish = /[a-zA-Z]/.test(question);
    const detectedLanguage: BangladeshContext['detectedLanguage'] = 
      hasBengali && hasEnglish ? 'mixed' : hasBengali ? 'bn' : 'en';
    
    return {
      isBangladeshContext,
      detectedLanguage,
      eventType,
      politicalContext: {
        involvesGovernment: lowerQuestion.includes('government') || lowerQuestion.includes('minister'),
        involvesOpposition: lowerQuestion.includes('bnp') || lowerQuestion.includes('opposition'),
        isSensitiveTopic: lowerQuestion.includes('1971') || lowerQuestion.includes('war crimes')
      }
    };
  }

  /**
   * Execute retrieval agent with resilience patterns
   */
  private async executeRetrieval(
    marketQuestion: string,
    context?: any
  ): Promise<AgentAPIResponse<any>> {
    const cacheKey = OracleCache.generateKey(CACHE_KEYS.EVIDENCE_RETRIEVAL, {
      question: marketQuestion,
      context: JSON.stringify(context)
    });
    
    return this.cache.getOrCompute(
      cacheKey,
      async () => {
        return this.circuitBreaker.execute(
          'retrieval',
          async () => {
            const rateLimiter = getRateLimiter('GDELT');
            return rateLimiter.execute('GDELT', () => 
              this.retrievalAgent.execute(marketQuestion, context)
            );
          },
          () => ({
            success: false,
            error: {
              code: 'CIRCUIT_OPEN',
              message: 'Retrieval service temporarily unavailable',
              retryable: true
            },
            latencyMs: 0
          })
        );
      },
      [CACHE_KEYS.EVIDENCE_RETRIEVAL],
      this.config.cache.ttlMs
    );
  }

  /**
   * Execute synthesis agent with resilience patterns
   */
  private async executeSynthesis(
    marketQuestion: string,
    corpus: any,
    context?: any
  ): Promise<AgentAPIResponse<any>> {
    return this.circuitBreaker.execute(
      'synthesis',
      async () => {
        const rateLimiter = getRateLimiter('GEMINI');
        return rateLimiter.execute('GEMINI', () => 
          this.synthesisAgent.execute(marketQuestion, corpus, context)
        );
      },
      () => ({
        success: true,
        data: {
          agentType: 'synthesis',
          probabilisticAssessment: {
            outcome: 'UNCERTAIN',
            probability: 0.5,
            confidenceInterval: [0.3, 0.7]
          },
          contradictions: [],
          credibilityAnalysis: [],
          modelVersion: 'fallback',
          executionTimeMs: 0
        },
        latencyMs: 0,
        modelVersion: 'fallback'
      })
    );
  }

  /**
   * Execute deliberation agent
   */
  private async executeDeliberation(
    marketQuestion: string,
    synthesisOutput: any,
    context?: any
  ): Promise<AgentAPIResponse<any>> {
    return this.deliberationAgent.execute(marketQuestion, synthesisOutput, context);
  }

  /**
   * Execute explanation agent with resilience patterns
   */
  private async executeExplanation(
    marketQuestion: string,
    pipeline: AIResolutionPipeline,
    context?: any
  ): Promise<AgentAPIResponse<any>> {
    return this.circuitBreaker.execute(
      'explanation',
      async () => {
        const rateLimiter = getRateLimiter('GEMINI');
        return rateLimiter.execute('GEMINI', () => 
          this.explanationAgent.execute(marketQuestion, pipeline, context)
        );
      },
      () => ({
        success: false,
        error: {
          code: 'EXPLANATION_FAILED',
          message: 'Explanation generation failed',
          retryable: false
        },
        latencyMs: 0
      })
    );
  }

  /**
   * Determine confidence level based on score
   */
  private determineConfidenceLevel(confidence: number): {
    level: ConfidenceLevel;
    action: string;
  } {
    for (const threshold of CONFIDENCE_THRESHOLDS) {
      if (confidence >= threshold.min && confidence <= threshold.max) {
        return { level: threshold.level, action: threshold.action };
      }
    }
    return { level: 'escalation', action: 'escalate_to_decentralized' };
  }

  /**
   * Handle resolution based on confidence level and verification
   */
  private handleResolutionAction(
    pipeline: AIResolutionPipeline,
    confidenceLevel: { level: ConfidenceLevel; action: string },
    verificationResult?: any
  ): AIOrchestrationResult {
    // If verification failed, override confidence level
    if (verificationResult && !verificationResult.canAutoResolve) {
      console.log(`[AIOrchestrator] Verification blockers: ${verificationResult.blockers.join(', ')}`);
      
      // If we have primary government sources, we might still auto-resolve
      const hasPrimaryGov = pipeline.retrieval?.corpus.sources.some(
        s => s.url.includes('.gov.bd') && s.credibilityScore > 0.95
      );
      
      if (!hasPrimaryGov) {
        return {
          success: true,
          pipeline,
          actionTaken: 'escalated'
        };
      }
    }
    
    switch (confidenceLevel.level) {
      case 'automated':
        console.log(`[AIOrchestrator] Auto-resolving market ${pipeline.marketId}`);
        return {
          success: true,
          pipeline,
          actionTaken: 'auto_resolved'
        };
        
      case 'human_review':
        console.log(`[AIOrchestrator] Queueing market ${pipeline.marketId} for human review`);
        const priority = pipeline.finalConfidence >= 0.9 ? 'medium' : 'high';
        this.reviewQueue.addToQueue(pipeline, priority);
        return {
          success: true,
          pipeline,
          actionTaken: 'queued_for_review'
        };
        
      case 'escalation':
        console.log(`[AIOrchestrator] Escalating market ${pipeline.marketId} to decentralized oracle`);
        return {
          success: true,
          pipeline,
          actionTaken: 'escalated'
        };
        
      default:
        return {
          success: false,
          pipeline,
          error: {
            code: 'INVALID_CONFIDENCE_LEVEL',
            message: `Unknown confidence level: ${confidenceLevel.level}`
          },
          actionTaken: 'failed'
        };
    }
  }

  /**
   * Get system health status including verification metrics
   */
  getHealthStatus(): {
    circuitBreakers: ReturnType<CircuitBreaker['getAllStates']>;
    cacheStats: ReturnType<OracleCache['getStats']>;
    reviewQueueStats: ReturnType<typeof this.reviewQueue.getStats>;
    feedbackReport: ReturnType<typeof this.feedbackLoop.getFeedbackReport>;
    verificationStatus: {
      totalSourcesTracked: number;
      avgSourceAccuracy: number;
      topPerformers: string[];
    };
  } {
    const accuracyReport = this.verificationEngine['accuracyTracker'].generateReport();
    
    return {
      circuitBreakers: this.circuitBreaker.getAllStates(),
      cacheStats: this.cache.getStats(),
      reviewQueueStats: this.reviewQueue.getStats(),
      feedbackReport: this.feedbackLoop.getFeedbackReport(),
      verificationStatus: {
        totalSourcesTracked: accuracyReport.summary.totalSources,
        avgSourceAccuracy: accuracyReport.summary.avgAccuracy,
        topPerformers: [accuracyReport.summary.topPerformer]
      }
    };
  }

  /**
   * Process human review decision
   */
  processHumanReview(
    reviewId: string,
    decision: 'accept' | 'modify' | 'escalate',
    finalOutcome?: string
  ): boolean {
    const item = this.reviewQueue.getItem(reviewId);
    if (!item) return false;
    
    const success = this.reviewQueue.submitReview(
      reviewId,
      item.assignedTo!,
      decision,
      finalOutcome,
      undefined
    );
    
    if (!success) return false;
    
    // Record feedback
    if (decision === 'accept') {
      this.feedbackLoop.recordFeedback({
        pipelineId: item.pipelineId,
        marketId: item.marketId,
        wasDisputed: false,
        feedbackScore: 1,
        rootCause: 'Human review accepted AI resolution'
      });
    } else if (decision === 'modify') {
      this.feedbackLoop.processDisputeOutcome(
        {
          pipelineId: item.pipelineId,
          marketId: item.marketId,
          query: item.marketQuestion,
          status: 'completed',
          finalOutcome: item.aiOutcome,
          finalConfidence: item.aiConfidence,
          confidenceLevel: 'human_review',
          recommendedAction: 'complete',
          startedAt: item.createdAt,
          totalExecutionTimeMs: 0,
          modelVersions: { synthesis: '2.0.0-bd', deliberation: '2.0.0-bd', explanation: '2.0.0-bd' }
        },
        'overturned',
        finalOutcome,
        item.assignedTo || undefined
      );
    }
    
    return true;
  }

  /**
   * Run maintenance tasks
   */
  async runMaintenance(): Promise<{
    cacheCleaned: number;
    staleAssignmentsReleased: number;
    overdueEscalated: number;
  }> {
    const cacheCleaned = this.cache.cleanup();
    const staleAssignmentsReleased = this.reviewQueue.releaseStaleAssignments();
    const overdueEscalated = this.reviewQueue.autoEscalateOverdue();
    
    return {
      cacheCleaned,
      staleAssignmentsReleased,
      overdueEscalated
    };
  }
}

// Singleton instance
let globalOrchestrator: AIOrchestrator | null = null;

export function getGlobalOrchestrator(config?: Partial<AIOracleConfig>): AIOrchestrator {
  if (!globalOrchestrator) {
    globalOrchestrator = new AIOrchestrator(config);
  }
  return globalOrchestrator;
}
