/**
 * Feedback Loop System for Continuous Improvement
 * Tracks resolution accuracy, collects feedback, triggers retraining
 */

import { 
  ResolutionFeedback, 
  AIResolutionPipeline,
  ModelVersion,
  ABTest,
  ModelPerformanceMetrics 
} from '../types';

interface FeedbackMetrics {
  totalResolutions: number;
  disputedCount: number;
  overturnedCount: number;
  accuracyRate: number;
  avgConfidence: number;
  miscalibrationScore: number; // Difference between confidence and accuracy
}

interface ErrorPattern {
  type: 'false_positive' | 'false_negative' | 'confidence_miscalibration' | 'evidence_miss';
  count: number;
  sampleMarketIds: string[];
  commonFactors: string[];
}

export class FeedbackLoop {
  private feedbackStore: ResolutionFeedback[] = [];
  private readonly minSamplesForRetraining: number;
  private readonly retrainingIntervalDays: number;
  private lastRetrainingDate: Date;
  
  // Model registry
  private modelVersions: Map<string, ModelVersion> = new Map();
  private activeABTests: Map<string, ABTest> = new Map();

  constructor(
    minSamplesForRetraining: number = 1000,
    retrainingIntervalDays: number = 90
  ) {
    this.minSamplesForRetraining = minSamplesForRetraining;
    this.retrainingIntervalDays = retrainingIntervalDays;
    this.lastRetrainingDate = new Date();
  }

  /**
   * Record feedback for a resolution
   */
  recordFeedback(feedback: Omit<ResolutionFeedback, 'id' | 'createdAt'>): ResolutionFeedback {
    const fullFeedback: ResolutionFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    this.feedbackStore.push(fullFeedback);
    
    console.log(`[FeedbackLoop] Recorded feedback for market ${feedback.marketId}: ${feedback.feedbackScore > 0 ? 'CORRECT' : feedback.feedbackScore < 0 ? 'INCORRECT' : 'NEUTRAL'}`);
    
    // Check if retraining is needed
    this.checkRetrainingTrigger();
    
    return fullFeedback;
  }

  /**
   * Process dispute outcome and record feedback
   */
  processDisputeOutcome(
    pipeline: AIResolutionPipeline,
    disputeOutcome: 'upheld' | 'overturned',
    humanCorrectedOutcome?: string,
    humanReviewerId?: string
  ): ResolutionFeedback {
    // Determine error type
    let errorType: ResolutionFeedback['errorType'];
    let feedbackScore: number;
    let rootCause: string;
    
    if (disputeOutcome === 'overturned') {
      feedbackScore = -1;
      
      // Analyze error type
      if (pipeline.finalOutcome === 'YES' && humanCorrectedOutcome === 'NO') {
        errorType = 'false_positive';
        rootCause = 'AI predicted YES when correct answer was NO';
      } else if (pipeline.finalOutcome === 'NO' && humanCorrectedOutcome === 'YES') {
        errorType = 'false_negative';
        rootCause = 'AI predicted NO when correct answer was YES';
      } else {
        errorType = 'confidence_miscalibration';
        rootCause = 'Incorrect outcome with high confidence';
      }
      
      // Check for evidence miss
      if (pipeline.retrieval?.corpus.crossVerificationScore && 
          pipeline.retrieval.corpus.crossVerificationScore < 0.5) {
        errorType = 'evidence_miss';
        rootCause = 'Insufficient evidence retrieval or source quality issues';
      }
    } else {
      // Dispute upheld - AI was correct
      feedbackScore = 1;
      errorType = undefined;
      rootCause = 'AI resolution upheld after human review';
    }
    
    return this.recordFeedback({
      pipelineId: pipeline.pipelineId,
      marketId: pipeline.marketId,
      wasDisputed: true,
      disputeOutcome,
      humanCorrectedOutcome,
      humanReviewerId,
      feedbackScore,
      errorType,
      rootCause
    });
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics(sinceDays?: number): FeedbackMetrics {
    let feedbacks = this.feedbackStore;
    
    // Filter by date if specified
    if (sinceDays) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - sinceDays);
      feedbacks = feedbacks.filter(f => new Date(f.createdAt) >= cutoff);
    }
    
    const total = feedbacks.length;
    if (total === 0) {
      return {
        totalResolutions: 0,
        disputedCount: 0,
        overturnedCount: 0,
        accuracyRate: 0,
        avgConfidence: 0,
        miscalibrationScore: 0
      };
    }
    
    const disputed = feedbacks.filter(f => f.wasDisputed).length;
    const overturned = feedbacks.filter(f => f.disputeOutcome === 'overturned').length;
    const correct = feedbacks.filter(f => f.feedbackScore > 0).length;
    
    return {
      totalResolutions: total,
      disputedCount: disputed,
      overturnedCount: overturned,
      accuracyRate: correct / total,
      avgConfidence: 0, // Would need to store original confidence
      miscalibrationScore: Math.abs((correct / total) - 0.9) // Assuming 90% target confidence
    };
  }

  /**
   * Analyze error patterns
   */
  analyzeErrorPatterns(): ErrorPattern[] {
    const errors = this.feedbackStore.filter(f => f.feedbackScore < 0);
    const patterns: Map<string, ErrorPattern> = new Map();
    
    for (const error of errors) {
      const type = error.errorType || 'unknown';
      
      if (!patterns.has(type)) {
        patterns.set(type, {
          type: type as ErrorPattern['type'],
          count: 0,
          sampleMarketIds: [],
          commonFactors: []
        });
      }
      
      const pattern = patterns.get(type)!;
      pattern.count++;
      
      if (pattern.sampleMarketIds.length < 5) {
        pattern.sampleMarketIds.push(error.marketId);
      }
    }
    
    return Array.from(patterns.values());
  }

  /**
   * Check if retraining should be triggered
   */
  private checkRetrainingTrigger(): void {
    const pendingFeedback = this.feedbackStore.filter(f => !f.processedAt).length;
    
    if (pendingFeedback < this.minSamplesForRetraining) {
      return;
    }
    
    const daysSinceRetraining = 
      (Date.now() - this.lastRetrainingDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRetraining < this.retrainingIntervalDays) {
      return;
    }
    
    // Trigger retraining
    this.triggerRetraining();
  }

  /**
   * Trigger model retraining
   */
  private async triggerRetraining(): Promise<void> {
    console.log('[FeedbackLoop] Triggering model retraining...');
    
    const unprocessedFeedback = this.feedbackStore.filter(f => !f.processedAt);
    
    // Mark as processed
    const now = new Date().toISOString();
    unprocessedFeedback.forEach(f => f.processedAt = now);
    
    // In production, this would:
    // 1. Export feedback data to training pipeline
    // 2. Trigger ML training job
    // 3. Deploy new model version with A/B test
    // 4. Update model registry
    
    console.log(`[FeedbackLoop] Processed ${unprocessedFeedback.length} feedback items for retraining`);
    
    // Create new model version
    await this.createNewModelVersion();
    
    this.lastRetrainingDate = new Date();
  }

  /**
   * Create new model version after retraining
   */
  private async createNewModelVersion(): Promise<void> {
    const version: ModelVersion = {
      id: `model-${Date.now()}`,
      modelType: 'synthesis',
      version: `2.${this.modelVersions.size + 1}.0`,
      deploymentStatus: 'staging',
      performanceMetrics: {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        avgLatencyMs: 0
      },
      trainingDate: new Date().toISOString(),
      datasetSize: this.feedbackStore.length,
      isCanary: true,
      canaryTrafficPercent: 5
    };
    
    this.modelVersions.set(version.id, version);
    
    // Start A/B test
    this.startABTest(version);
    
    console.log(`[FeedbackLoop] Created new model version: ${version.version}`);
  }

  /**
   * Start A/B test for new model version
   */
  private startABTest(newVersion: ModelVersion): void {
    const previousVersion = Array.from(this.modelVersions.values())
      .filter(v => v.modelType === newVersion.modelType && v.deploymentStatus === 'active')
      .pop();
    
    if (!previousVersion) {
      // First version, no A/B test needed
      newVersion.deploymentStatus = 'active';
      return;
    }
    
    const test: ABTest = {
      id: `ab-test-${Date.now()}`,
      name: `${previousVersion.version} vs ${newVersion.version}`,
      modelA: previousVersion.id,
      modelB: newVersion.id,
      trafficSplit: [95, 5], // 5% canary
      status: 'running',
      startDate: new Date().toISOString(),
      metrics: {
        modelA: this.initializeMetrics(),
        modelB: this.initializeMetrics()
      }
    };
    
    this.activeABTests.set(test.id, test);
    
    console.log(`[FeedbackLoop] Started A/B test: ${test.name}`);
  }

  /**
   * Evaluate A/B test results
   */
  evaluateABTest(testId: string): { winner: string | null; shouldPromote: boolean } {
    const test = this.activeABTests.get(testId);
    if (!test) {
      throw new Error(`A/B test ${testId} not found`);
    }
    
    const modelA = test.metrics.modelA;
    const modelB = test.metrics.modelB;
    
    // Require minimum sample size
    const minSamples = 100;
    if (modelA.totalResolutions < minSamples || modelB.totalResolutions < minSamples) {
      return { winner: null, shouldPromote: false };
    }
    
    // Compare accuracy
    const accuracyDiff = modelB.accuracy - modelA.accuracy;
    
    // Statistical significance threshold (simplified)
    if (Math.abs(accuracyDiff) > 0.05) {
      const winner = accuracyDiff > 0 ? test.modelB : test.modelA;
      const shouldPromote = accuracyDiff > 0;
      
      test.winner = winner;
      test.status = 'completed';
      test.endDate = new Date().toISOString();
      
      return { winner, shouldPromote };
    }
    
    return { winner: null, shouldPromote: false };
  }

  /**
   * Get model for request (respecting A/B test traffic split)
   */
  getModelForRequest(modelType: string): string {
    // Find active A/B tests for this model type
    const activeTests = Array.from(this.activeABTests.values())
      .filter(t => t.status === 'running');
    
    for (const test of activeTests) {
      const modelAVersion = this.modelVersions.get(test.modelA);
      if (modelAVersion?.modelType === modelType) {
        // Route based on traffic split
        const random = Math.random() * 100;
        return random < test.trafficSplit[0] ? test.modelA : test.modelB;
      }
    }
    
    // Return active model version
    const activeModel = Array.from(this.modelVersions.values())
      .filter(v => v.modelType === modelType && v.deploymentStatus === 'active')
      .pop();
    
    return activeModel?.id || 'default';
  }

  /**
   * Record A/B test metrics
   */
  recordABTestMetrics(testId: string, modelId: string, metrics: Partial<ModelPerformanceMetrics>): void {
    const test = this.activeABTests.get(testId);
    if (!test) return;
    
    const targetMetrics = test.modelA === modelId ? test.metrics.modelA : test.metrics.modelB;
    
    Object.assign(targetMetrics, metrics);
  }

  /**
   * Get feedback summary report
   */
  getFeedbackReport(): {
    metrics: FeedbackMetrics;
    errorPatterns: ErrorPattern[];
    modelVersions: ModelVersion[];
    activeTests: ABTest[];
  } {
    return {
      metrics: this.calculateMetrics(),
      errorPatterns: this.analyzeErrorPatterns(),
      modelVersions: Array.from(this.modelVersions.values()),
      activeTests: Array.from(this.activeABTests.values())
    };
  }

  private initializeMetrics(): ModelPerformanceMetrics {
    return {
      totalResolutions: 0,
      accuracy: 0,
      disputedRate: 0,
      avgConfidence: 0,
      humanOverrideRate: 0,
      avgExecutionTimeMs: 0
    };
  }
}

// Singleton instance
let globalFeedbackLoop: FeedbackLoop | null = null;

export function getGlobalFeedbackLoop(): FeedbackLoop {
  if (!globalFeedbackLoop) {
    globalFeedbackLoop = new FeedbackLoop();
  }
  return globalFeedbackLoop;
}
