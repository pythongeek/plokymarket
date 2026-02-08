/**
 * Historical Accuracy Tracking
 * Dynamic source weighting based on performance history
 * Automatic downweighting for bias and delay
 */

import { SourceTier } from './SourceTiers';

export interface SourceAccuracyRecord {
  domain: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  
  // Bias metrics
  falsePositives: number;
  falseNegatives: number;
  biasScore: number; // -1 (biased NO) to +1 (biased YES), 0 = neutral
  
  // Delay metrics
  avgReportingDelayMinutes: number;
  isFastSource: boolean;
  
  // Temporal accuracy
  predictionsByMonth: Record<string, {
    total: number;
    correct: number;
  }>;
  
  // Trend
  recentAccuracy: number; // Last 30 days
  accuracyTrend: 'improving' | 'stable' | 'declining';
  
  // Weight adjustment
  currentWeight: number;
  baseWeight: number;
  weightPenalty: number;
  
  // Last updated
  lastUpdated: string;
}

export interface WeightAdjustmentFactors {
  accuracyFactor: number; // 0.5 to 1.5
  biasFactor: number; // 0.7 to 1.0 (penalty for bias)
  delayFactor: number; // 0.8 to 1.0 (penalty for slow reporting)
  recencyFactor: number; // 0.8 to 1.2 (boost for recent good performance)
  combinedFactor: number;
}

// Bangladesh-specific source base weights
const BANGLADESH_SOURCE_BASE_WEIGHTS: Record<string, number> = {
  // Primary - Government (high base weight, rarely penalized)
  'eci.gov.bd': 0.98,
  'bb.org.bd': 0.97,
  'sec.gov.bd': 0.97,
  'dse.com.bd': 0.96,
  'cse.com.bd': 0.95,
  'bmd.gov.bd': 0.97,
  'tigercricket.com.bd': 0.96,
  'bff.com.bd': 0.94,
  
  // Secondary - Tier 1 Media
  'reuters.com': 0.95,
  'bloomberg.com': 0.95,
  'apnews.com': 0.94,
  'thedailystar.net': 0.92,
  'bdnews24.com': 0.91,
  'dhakatribune.com': 0.90,
  'prothomalo.com': 0.93,
  'jugantor.com': 0.90,
  'kalerkantho.com': 0.90,
  'ittefaq.com.bd': 0.89,
  'bbc.com': 0.93,
  
  // Tertiary - Online
  'banglanews24.com': 0.85,
  'banglatribune.com': 0.84,
  'jagonews24.com': 0.84,
  'risingbd.com': 0.83,
  'somoynews.tv': 0.85,
  'channelionline.com': 0.84
};

export class HistoricalAccuracyTracker {
  private records: Map<string, SourceAccuracyRecord> = new Map();
  
  // Configuration
  private readonly MIN_SAMPLES_FOR_ADJUSTMENT = 5;
  private readonly ACCURACY_WINDOW_DAYS = 90;
  private readonly WEIGHT_ADJUSTMENT_RATE = 0.1;

  /**
   * Record a prediction outcome for a source
   */
  recordOutcome(
    domain: string,
    predictedOutcome: string,
    actualOutcome: string,
    reportingDelayMinutes: number,
    timestamp: string = new Date().toISOString()
  ): void {
    const record = this.getOrCreateRecord(domain);
    
    // Update counts
    record.totalPredictions++;
    
    const wasCorrect = predictedOutcome === actualOutcome;
    if (wasCorrect) {
      record.correctPredictions++;
    } else {
      // Track bias
      if (predictedOutcome === 'YES' && actualOutcome === 'NO') {
        record.falsePositives++;
      } else if (predictedOutcome === 'NO' && actualOutcome === 'YES') {
        record.falseNegatives++;
      }
    }
    
    // Update accuracy
    record.accuracy = record.correctPredictions / record.totalPredictions;
    
    // Update delay metrics
    const oldDelay = record.avgReportingDelayMinutes;
    const newDelay = (oldDelay * (record.totalPredictions - 1) + reportingDelayMinutes) / record.totalPredictions;
    record.avgReportingDelayMinutes = newDelay;
    record.isFastSource = newDelay < 60; // Under 1 hour is fast
    
    // Update monthly tracking
    const month = timestamp.substring(0, 7); // YYYY-MM
    if (!record.predictionsByMonth[month]) {
      record.predictionsByMonth[month] = { total: 0, correct: 0 };
    }
    record.predictionsByMonth[month].total++;
    if (wasCorrect) {
      record.predictionsByMonth[month].correct++;
    }
    
    // Recalculate bias
    this.recalculateBias(record);
    
    // Update recent accuracy and trend
    this.updateRecentMetrics(record);
    
    // Adjust weight
    this.adjustWeight(record);
    
    record.lastUpdated = timestamp;
  }

  /**
   * Get accuracy record for a source
   */
  getRecord(domain: string): SourceAccuracyRecord | undefined {
    return this.records.get(domain);
  }

  /**
   * Get all records
   */
  getAllRecords(): SourceAccuracyRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Get weight adjustment factors for a source
   */
  getWeightAdjustment(domain: string): WeightAdjustmentFactors {
    const record = this.records.get(domain);
    
    if (!record || record.totalPredictions < this.MIN_SAMPLES_FOR_ADJUSTMENT) {
      return {
        accuracyFactor: 1.0,
        biasFactor: 1.0,
        delayFactor: 1.0,
        recencyFactor: 1.0,
        combinedFactor: 1.0
      };
    }
    
    // Accuracy factor: 0.5 to 1.5
    const accuracyFactor = 0.5 + record.accuracy;
    
    // Bias factor: 0.7 to 1.0 (penalty for bias)
    const biasPenalty = Math.abs(record.biasScore) * 0.3;
    const biasFactor = 1.0 - biasPenalty;
    
    // Delay factor: 0.8 to 1.0
    const delayFactor = record.isFastSource ? 1.0 : 0.85;
    
    // Recency factor: 0.8 to 1.2
    const recentDiff = record.recentAccuracy - record.accuracy;
    const recencyFactor = 1.0 + Math.max(-0.2, Math.min(0.2, recentDiff));
    
    const combinedFactor = accuracyFactor * biasFactor * delayFactor * recencyFactor;
    
    return {
      accuracyFactor,
      biasFactor,
      delayFactor,
      recencyFactor,
      combinedFactor
    };
  }

  /**
   * Get adjusted weight for a source
   */
  getAdjustedWeight(domain: string): number {
    const baseWeight = BANGLADESH_SOURCE_BASE_WEIGHTS[domain] || 0.70;
    const record = this.records.get(domain);
    
    if (!record || record.totalPredictions < this.MIN_SAMPLES_FOR_ADJUSTMENT) {
      return baseWeight;
    }
    
    return record.currentWeight;
  }

  /**
   * Get top sources by accuracy
   */
  getTopSources(limit: number = 10): SourceAccuracyRecord[] {
    return this.getAllRecords()
      .filter(r => r.totalPredictions >= this.MIN_SAMPLES_FOR_ADJUSTMENT)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit);
  }

  /**
   * Get problematic sources (low accuracy or high bias)
   */
  getProblematicSources(): Array<{
    domain: string;
    issue: 'low_accuracy' | 'high_bias' | 'slow_reporting';
    value: number;
  }> {
    const problematic: Array<{ domain: string; issue: 'low_accuracy' | 'high_bias' | 'slow_reporting'; value: number }> = [];
    
    for (const [domain, record] of this.records.entries()) {
      if (record.totalPredictions < this.MIN_SAMPLES_FOR_ADJUSTMENT) continue;
      
      if (record.accuracy < 0.7) {
        problematic.push({ domain, issue: 'low_accuracy', value: record.accuracy });
      }
      
      if (Math.abs(record.biasScore) > 0.3) {
        problematic.push({ domain, issue: 'high_bias', value: record.biasScore });
      }
      
      if (!record.isFastSource) {
        problematic.push({ domain, issue: 'slow_reporting', value: record.avgReportingDelayMinutes });
      }
    }
    
    return problematic;
  }

  /**
   * Generate accuracy report
   */
  generateReport(): {
    summary: {
      totalSources: number;
      avgAccuracy: number;
      topPerformer: string;
      mostBiased: string;
    };
    tierBreakdown: Record<SourceTier, {
      count: number;
      avgAccuracy: number;
    }>;
    recommendations: string[];
  } {
    const records = this.getAllRecords().filter(r => r.totalPredictions >= this.MIN_SAMPLES_FOR_ADJUSTMENT);
    
    const totalAccuracy = records.reduce((sum, r) => sum + r.accuracy, 0);
    const avgAccuracy = records.length > 0 ? totalAccuracy / records.length : 0;
    
    const topPerformer = records.length > 0 
      ? records.reduce((best, r) => r.accuracy > best.accuracy ? r : best, records[0])
      : undefined;
    
    const mostBiased = records.length > 0
      ? records.reduce((worst, r) => Math.abs(r.biasScore) > Math.abs(worst.biasScore) ? r : worst, records[0])
      : undefined;
    
    return {
      summary: {
        totalSources: records.length,
        avgAccuracy,
        topPerformer: topPerformer?.domain || 'N/A',
        mostBiased: mostBiased?.domain || 'N/A'
      },
      tierBreakdown: {
        primary: { count: 0, avgAccuracy: 0 },
        secondary: { count: 0, avgAccuracy: 0 },
        tertiary: { count: 0, avgAccuracy: 0 }
      },
      recommendations: this.generateRecommendations(records)
    };
  }

  private getOrCreateRecord(domain: string): SourceAccuracyRecord {
    if (!this.records.has(domain)) {
      const baseWeight = BANGLADESH_SOURCE_BASE_WEIGHTS[domain] || 0.70;
      
      this.records.set(domain, {
        domain,
        totalPredictions: 0,
        correctPredictions: 0,
        accuracy: 0,
        falsePositives: 0,
        falseNegatives: 0,
        biasScore: 0,
        avgReportingDelayMinutes: 0,
        isFastSource: true,
        predictionsByMonth: {},
        recentAccuracy: 0,
        accuracyTrend: 'stable',
        currentWeight: baseWeight,
        baseWeight,
        weightPenalty: 0,
        lastUpdated: new Date().toISOString()
      });
    }
    
    return this.records.get(domain)!;
  }

  private recalculateBias(record: SourceAccuracyRecord): void {
    const totalErrors = record.falsePositives + record.falseNegatives;
    if (totalErrors === 0) {
      record.biasScore = 0;
      return;
    }
    
    // Positive = biased toward YES (more false positives)
    // Negative = biased toward NO (more false negatives)
    record.biasScore = (record.falsePositives - record.falseNegatives) / totalErrors;
  }

  private updateRecentMetrics(record: SourceAccuracyRecord): void {
    // Calculate last 30 days accuracy
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let recentTotal = 0;
    let recentCorrect = 0;
    
    for (const [month, data] of Object.entries(record.predictionsByMonth)) {
      const monthDate = new Date(month + '-01');
      if (monthDate >= thirtyDaysAgo) {
        recentTotal += data.total;
        recentCorrect += data.correct;
      }
    }
    
    record.recentAccuracy = recentTotal > 0 ? recentCorrect / recentTotal : record.accuracy;
    
    // Determine trend
    const diff = record.recentAccuracy - record.accuracy;
    if (Math.abs(diff) < 0.05) {
      record.accuracyTrend = 'stable';
    } else if (diff > 0) {
      record.accuracyTrend = 'improving';
    } else {
      record.accuracyTrend = 'declining';
    }
  }

  private adjustWeight(record: SourceAccuracyRecord): void {
    const factors = this.getWeightAdjustment(record.domain);
    const targetWeight = record.baseWeight * factors.combinedFactor;
    
    // Smooth adjustment
    const diff = targetWeight - record.currentWeight;
    record.currentWeight += diff * this.WEIGHT_ADJUSTMENT_RATE;
    
    // Clamp weight
    const minWeight = record.baseWeight * 0.5;
    const maxWeight = record.baseWeight * 1.2;
    record.currentWeight = Math.max(minWeight, Math.min(maxWeight, record.currentWeight));
    
    // Calculate penalty
    record.weightPenalty = record.baseWeight - record.currentWeight;
  }

  private generateRecommendations(records: SourceAccuracyRecord[]): string[] {
    const recommendations: string[] = [];
    
    const lowAccuracy = records.filter(r => r.accuracy < 0.7);
    if (lowAccuracy.length > 0) {
      recommendations.push(`Consider reducing weight for ${lowAccuracy.length} low-accuracy sources`);
    }
    
    const biased = records.filter(r => Math.abs(r.biasScore) > 0.3);
    if (biased.length > 0) {
      recommendations.push(`Review ${biased.length} sources showing systematic bias`);
    }
    
    const slow = records.filter(r => !r.isFastSource);
    if (slow.length > 0) {
      recommendations.push(`${slow.length} sources consistently report with delay`);
    }
    
    const improving = records.filter(r => r.accuracyTrend === 'improving');
    if (improving.length > 0) {
      recommendations.push(`${improving.length} sources showing accuracy improvement`);
    }
    
    return recommendations;
  }
}

// Singleton instance
let globalAccuracyTracker: HistoricalAccuracyTracker | null = null;

export function getGlobalAccuracyTracker(): HistoricalAccuracyTracker {
  if (!globalAccuracyTracker) {
    globalAccuracyTracker = new HistoricalAccuracyTracker();
  }
  return globalAccuracyTracker;
}
