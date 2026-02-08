/**
 * Cross-Verification Engine
 * Defense-in-depth verification with source independence checking
 * Bangladesh-context aware with dynamic weighting
 */

import { EvidenceSource } from '../types';
import { 
  SourceTier, 
  getSourceTier, 
  checkSourceRequirements, 
  canAutoResolve,
  SourceRequirementCheck 
} from './SourceTiers';
import { OwnershipAnalyzer, getGlobalOwnershipAnalyzer } from './OwnershipGraph';
import { HistoricalAccuracyTracker, getGlobalAccuracyTracker, WeightAdjustmentFactors } from './HistoricalAccuracy';
import { TemporalValidator, getGlobalTemporalValidator, EventTimeline } from './TemporalValidation';

export interface CrossVerificationResult {
  // Overall status
  canAutoResolve: boolean;
  confidenceScore: number;
  verificationStatus: 'verified' | 'partial' | 'insufficient' | 'rejected';
  
  // Source analysis
  sourcesByTier: Record<SourceTier, EvidenceSource[]>;
  tierRequirements: SourceRequirementCheck[];
  
  // Independence analysis
  independenceScore: number;
  ownershipConflicts: Array<{
    sources: [string, string];
    commonOwner: string;
  }>;
  
  // Weight analysis
  sourceWeights: Array<{
    sourceId: string;
    domain: string;
    tier: SourceTier;
    baseWeight: number;
    adjustedWeight: number;
    adjustmentFactors: WeightAdjustmentFactors;
  }>;
  
  // Temporal analysis
  temporalValidation: {
    isValid: boolean;
    outOfSequenceCount: number;
    consensusWindowMinutes: number;
  };
  
  // Consensus calculation
  consensusOutcome: string;
  consensusConfidence: number;
  weightedVotes: Array<{
    outcome: string;
    weight: number;
    sources: string[];
  }>;
  
  // Explanations
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

export const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
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
};

export class CrossVerificationEngine {
  private ownershipAnalyzer: OwnershipAnalyzer;
  private accuracyTracker: HistoricalAccuracyTracker;
  private temporalValidator: TemporalValidator;
  private config: VerificationConfig;

  constructor(config: Partial<VerificationConfig> = {}) {
    this.ownershipAnalyzer = getGlobalOwnershipAnalyzer();
    this.accuracyTracker = getGlobalAccuracyTracker();
    this.temporalValidator = getGlobalTemporalValidator();
    this.config = { ...DEFAULT_VERIFICATION_CONFIG, ...config };
  }

  /**
   * Execute full cross-verification
   */
  async verify(
    sources: EvidenceSource[],
    eventTimeline?: EventTimeline
  ): Promise<CrossVerificationResult> {
    // 1. Classify sources by tier
    const sourcesByTier = this.classifySourcesByTier(sources);
    
    // 2. Check source requirements
    const tierCounts = {
      primary: sourcesByTier.primary.length,
      secondary: sourcesByTier.secondary.length,
      tertiary: sourcesByTier.tertiary.length
    };
    const tierRequirements = checkSourceRequirements(tierCounts);
    
    // 3. Check independence
    const domains = sources.map(s => new URL(s.url).hostname);
    const independenceAnalysis = this.ownershipAnalyzer.calculateSetIndependence(domains);
    
    // Filter to independent sources
    const independentSelection = this.ownershipAnalyzer.selectIndependentSources(domains);
    const independentSources = sources.filter(s => 
      independentSelection.selected.includes(new URL(s.url).hostname)
    );
    
    // 4. Calculate dynamic weights
    const sourceWeights = this.calculateWeights(independentSources);
    
    // 5. Temporal validation
    let temporalValidation: CrossVerificationResult['temporalValidation'] = {
      isValid: true,
      outOfSequenceCount: 0,
      consensusWindowMinutes: 0
    };
    
    if (this.config.requireTemporalValidation && eventTimeline) {
      const temporalResult = this.temporalValidator.validate(
        eventTimeline,
        independentSources.map(s => ({ id: s.id, publishedAt: s.publishedAt }))
      );
      
      temporalValidation = {
        isValid: temporalResult.isValid,
        outOfSequenceCount: temporalResult.outOfSequenceSources.length,
        consensusWindowMinutes: temporalResult.consensusWindow.durationMinutes
      };
    }
    
    // 6. Calculate consensus
    const consensus = this.calculateConsensus(independentSources, sourceWeights);
    
    // 7. Determine if can auto-resolve
    const blockers = this.identifyBlockers(
      tierRequirements,
      independenceAnalysis.independenceScore,
      temporalValidation,
      consensus.confidence
    );
    
    const canAutoResolveResult = blockers.length === 0;
    
    // 8. Generate recommendations
    const recommendations = this.generateRecommendations(
      tierRequirements,
      independenceAnalysis,
      temporalValidation,
      consensus
    );
    
    return {
      canAutoResolve: canAutoResolveResult,
      confidenceScore: consensus.confidence,
      verificationStatus: this.determineVerificationStatus(
        canAutoResolveResult,
        consensus.confidence,
        independenceAnalysis.independenceScore
      ),
      sourcesByTier,
      tierRequirements,
      independenceScore: independenceAnalysis.independenceScore,
      ownershipConflicts: independenceAnalysis.conflicts,
      sourceWeights,
      temporalValidation,
      consensusOutcome: consensus.outcome,
      consensusConfidence: consensus.confidence,
      weightedVotes: consensus.weightedVotes,
      blockers,
      recommendations
    };
  }

  /**
   * Classify sources by tier
   */
  private classifySourcesByTier(sources: EvidenceSource[]): Record<SourceTier, EvidenceSource[]> {
    const result: Record<SourceTier, EvidenceSource[]> = {
      primary: [],
      secondary: [],
      tertiary: []
    };
    
    for (const source of sources) {
      const domain = new URL(source.url).hostname.replace(/^www\./, '');
      const tier = getSourceTier(domain);
      result[tier].push(source);
    }
    
    return result;
  }

  /**
   * Calculate adjusted weights for all sources
   */
  private calculateWeights(sources: EvidenceSource[]): CrossVerificationResult['sourceWeights'] {
    return sources.map(source => {
      const domain = new URL(source.url).hostname.replace(/^www\./, '');
      const tier = getSourceTier(domain);
      
      let baseWeight = 0.70;
      switch (tier) {
        case 'primary': baseWeight = 0.95; break;
        case 'secondary': baseWeight = 0.85; break;
        case 'tertiary': baseWeight = 0.70; break;
      }
      
      // Get dynamic adjustment
      const adjustmentFactors = this.config.enableDynamicWeighting
        ? this.accuracyTracker.getWeightAdjustment(domain)
        : {
            accuracyFactor: 1.0,
            biasFactor: 1.0,
            delayFactor: 1.0,
            recencyFactor: 1.0,
            combinedFactor: 1.0
          };
      
      const adjustedWeight = Math.min(0.99, baseWeight * adjustmentFactors.combinedFactor);
      
      return {
        sourceId: source.id,
        domain,
        tier,
        baseWeight,
        adjustedWeight,
        adjustmentFactors
      };
    });
  }

  /**
   * Calculate weighted consensus
   */
  private calculateConsensus(
    sources: EvidenceSource[],
    weights: CrossVerificationResult['sourceWeights']
  ): {
    outcome: string;
    confidence: number;
    weightedVotes: Array<{ outcome: string; weight: number; sources: string[] }>;
  } {
    // Extract outcomes from source content
    const outcomeVotes: Record<string, { weight: number; sources: string[] }> = {};
    
    for (const source of sources) {
      const content = source.content.toLowerCase();
      const domain = new URL(source.url).hostname;
      const weightEntry = weights.find(w => w.domain === domain.replace(/^www\./, ''));
      const weight = weightEntry?.adjustedWeight || 0.5;
      
      // Simple outcome extraction
      let outcome = 'UNCERTAIN';
      if (content.includes('yes') || content.includes('will') || content.includes('confirmed')) {
        outcome = 'YES';
      } else if (content.includes('no') || content.includes('not') || content.includes('denied')) {
        outcome = 'NO';
      }
      
      if (!outcomeVotes[outcome]) {
        outcomeVotes[outcome] = { weight: 0, sources: [] };
      }
      outcomeVotes[outcome].weight += weight;
      outcomeVotes[outcome].sources.push(source.id);
    }
    
    // Find winner
    const sorted = Object.entries(outcomeVotes)
      .sort((a, b) => b[1].weight - a[1].weight);
    
    const winner = sorted[0];
    const totalWeight = Object.values(outcomeVotes).reduce((sum, v) => sum + v.weight, 0);
    const confidence = totalWeight > 0 ? winner[1].weight / totalWeight : 0.5;
    
    return {
      outcome: winner[0],
      confidence,
      weightedVotes: sorted.map(([outcome, data]) => ({
        outcome,
        weight: data.weight,
        sources: data.sources
      }))
    };
  }

  /**
   * Identify blockers for auto-resolution
   */
  private identifyBlockers(
    tierRequirements: SourceRequirementCheck[],
    independenceScore: number,
    temporalValidation: CrossVerificationResult['temporalValidation'],
    consensusConfidence: number
  ): string[] {
    const blockers: string[] = [];
    
    // Check tier requirements
    const primary = tierRequirements.find(r => r.tier === 'primary');
    const secondary = tierRequirements.find(r => r.tier === 'secondary');
    
    const hasPrimary = primary && primary.actual >= this.config.minSourcesPerTier.primary;
    const hasSecondary = secondary && secondary.actual >= this.config.minSourcesPerTier.secondary;
    
    if (!hasPrimary && !hasSecondary) {
      blockers.push(`Insufficient sources: Need ${this.config.minSourcesPerTier.primary} primary OR ${this.config.minSourcesPerTier.secondary} secondary sources`);
    }
    
    // Check independence
    if (independenceScore < this.config.minIndependenceScore) {
      blockers.push(`Source independence too low: ${(independenceScore * 100).toFixed(1)}% (need ${(this.config.minIndependenceScore * 100).toFixed(0)}%)`);
    }
    
    // Check temporal validation
    if (this.config.requireTemporalValidation) {
      const outOfSequencePercent = temporalValidation.outOfSequenceCount > 0
        ? temporalValidation.outOfSequenceCount / (primary?.actual || 1 + secondary?.actual || 1)
        : 0;
      
      if (outOfSequencePercent > this.config.maxOutOfSequencePercent) {
        blockers.push(`Too many out-of-sequence sources: ${(outOfSequencePercent * 100).toFixed(0)}%`);
      }
    }
    
    // Check consensus confidence
    if (consensusConfidence < this.config.minConsensusConfidence) {
      blockers.push(`Consensus confidence too low: ${(consensusConfidence * 100).toFixed(1)}% (need ${(this.config.minConsensusConfidence * 100).toFixed(0)}%)`);
    }
    
    return blockers;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    tierRequirements: SourceRequirementCheck[],
    independenceAnalysis: { independenceScore: number; conflicts: any[] },
    temporalValidation: CrossVerificationResult['temporalValidation'],
    consensus: { confidence: number }
  ): string[] {
    const recommendations: string[] = [];
    
    // Tier recommendations
    const primary = tierRequirements.find(r => r.tier === 'primary');
    if (primary && primary.actual < primary.required) {
      recommendations.push(`Add ${primary.required - primary.actual} more primary source(s) for stronger verification`);
    }
    
    // Independence recommendations
    if (independenceAnalysis.independenceScore < 0.9) {
      const conflictCount = independenceAnalysis.conflicts.length;
      if (conflictCount > 0) {
        recommendations.push(`${conflictCount} source ownership conflicts detected - consider diversifying sources`);
      }
    }
    
    // Temporal recommendations
    if (temporalValidation.outOfSequenceCount > 0) {
      recommendations.push(`${temporalValidation.outOfSequenceCount} sources have timing issues - manual review recommended`);
    }
    
    // Confidence recommendations
    if (consensus.confidence < 0.8) {
      recommendations.push('Low consensus confidence - consider human review');
    }
    
    return recommendations;
  }

  /**
   * Determine verification status
   */
  private determineVerificationStatus(
    canAutoResolve: boolean,
    confidence: number,
    independence: number
  ): CrossVerificationResult['verificationStatus'] {
    if (canAutoResolve && confidence >= 0.9 && independence >= 0.9) {
      return 'verified';
    }
    if (canAutoResolve) {
      return 'partial';
    }
    if (confidence < 0.5) {
      return 'rejected';
    }
    return 'insufficient';
  }

  /**
   * Record outcome for accuracy tracking
   */
  recordOutcome(
    sources: EvidenceSource[],
    actualOutcome: string,
    eventTime: string
  ): void {
    for (const source of sources) {
      const domain = new URL(source.url).hostname.replace(/^www\./, '');
      const content = source.content.toLowerCase();
      
      // Extract predicted outcome
      let predictedOutcome = 'UNCERTAIN';
      if (content.includes('yes') || content.includes('will')) {
        predictedOutcome = 'YES';
      } else if (content.includes('no') || content.includes('not')) {
        predictedOutcome = 'NO';
      }
      
      // Calculate reporting delay
      const reportTime = new Date(source.publishedAt);
      const eventDate = new Date(eventTime);
      const delayMinutes = (reportTime.getTime() - eventDate.getTime()) / (1000 * 60);
      
      this.accuracyTracker.recordOutcome(
        domain,
        predictedOutcome,
        actualOutcome,
        delayMinutes,
        new Date().toISOString()
      );
    }
  }
}

// Singleton instance
let globalVerificationEngine: CrossVerificationEngine | null = null;

export function getGlobalVerificationEngine(
  config?: Partial<VerificationConfig>
): CrossVerificationEngine {
  if (!globalVerificationEngine) {
    globalVerificationEngine = new CrossVerificationEngine(config);
  }
  return globalVerificationEngine;
}
