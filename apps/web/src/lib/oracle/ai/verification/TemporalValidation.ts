/**
 * Temporal Validation System
 * Ensures source timestamps align with event timing
 * Flags out-of-sequence sources for review
 */

export interface TemporalValidationResult {
  isValid: boolean;
  issues: TemporalIssue[];
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

export interface TemporalIssue {
  type: 'premature_reporting' | 'delayed_reporting' | 'future_dated' | 'inconsistent_sequence';
  severity: 'low' | 'medium' | 'high';
  sourceId: string;
  description: string;
  details: Record<string, any>;
}

export interface EventTimeline {
  eventId: string;
  expectedStartTime: string;
  expectedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  timezone: string;
  isBreakingNews: boolean;
  expectedDurationMinutes?: number;
}

export class TemporalValidator {
  private readonly PREMATURE_THRESHOLD_MINUTES = 30;
  private readonly DELAYED_THRESHOLD_MINUTES = 240; // 4 hours
  private readonly BREAKING_NEWS_WINDOW_MINUTES = 60;

  /**
   * Validate temporal alignment of sources with event
   */
  validate(
    event: EventTimeline,
    sources: Array<{ id: string; publishedAt: string }>
  ): TemporalValidationResult {
    const issues: TemporalIssue[] = [];
    const sourceTimestamps: TemporalValidationResult['sourceTimestamps'] = [];
    const outOfSequenceSources: string[] = [];
    
    const eventStart = new Date(event.actualStartTime || event.expectedStartTime);
    const eventEnd = event.actualEndTime 
      ? new Date(event.actualEndTime)
      : new Date(eventStart.getTime() + (event.expectedDurationMinutes || 120) * 60 * 1000);
    
    // Process each source
    for (const source of sources) {
      const sourceTime = new Date(source.publishedAt);
      const timeDiffMinutes = (sourceTime.getTime() - eventStart.getTime()) / (1000 * 60);
      
      let status: 'before' | 'during' | 'after' | 'unknown';
      
      if (timeDiffMinutes < -this.PREMATURE_THRESHOLD_MINUTES) {
        status = 'before';
      } else if (timeDiffMinutes >= -this.PREMATURE_THRESHOLD_MINUTES && sourceTime <= eventEnd) {
        status = 'during';
      } else {
        status = 'after';
      }
      
      sourceTimestamps.push({
        sourceId: source.id,
        timestamp: source.publishedAt,
        status,
        timeDiffMinutes
      });
      
      // Check for issues
      const issue = this.checkSourceTiming(source.id, sourceTime, eventStart, eventEnd, event.isBreakingNews);
      if (issue) {
        issues.push(issue);
        if (issue.severity === 'high') {
          outOfSequenceSources.push(source.id);
        }
      }
    }
    
    // Calculate consensus window
    const validTimestamps = sourceTimestamps.filter(st => st.status !== 'before');
    const consensusWindow = this.calculateConsensusWindow(validTimestamps);
    
    // Check for inconsistent sequences
    const sequenceIssues = this.detectInconsistentSequence(sourceTimestamps, event);
    issues.push(...sequenceIssues);
    
    return {
      isValid: issues.filter(i => i.severity === 'high').length === 0,
      issues,
      eventTimestamp: event.expectedStartTime,
      sourceTimestamps,
      consensusWindow,
      outOfSequenceSources
    };
  }

  /**
   * Check timing of a single source
   */
  private checkSourceTiming(
    sourceId: string,
    sourceTime: Date,
    eventStart: Date,
    eventEnd: Date,
    isBreakingNews: boolean
  ): TemporalIssue | null {
    const timeDiffMinutes = (sourceTime.getTime() - eventStart.getTime()) / (1000 * 60);
    const now = new Date();
    
    // Check for future-dated sources (indicates error)
    if (sourceTime > now) {
      return {
        type: 'future_dated',
        severity: 'high',
        sourceId,
        description: 'Source timestamp is in the future',
        details: {
          sourceTime: sourceTime.toISOString(),
          currentTime: now.toISOString()
        }
      };
    }
    
    // Check for premature reporting
    if (timeDiffMinutes < -this.PREMATURE_THRESHOLD_MINUTES) {
      // More lenient for breaking news
      if (isBreakingNews && timeDiffMinutes > -this.BREAKING_NEWS_WINDOW_MINUTES) {
        return {
          type: 'premature_reporting',
          severity: 'low',
          sourceId,
          description: 'Source reported slightly before event (possibly breaking news lead)',
          details: {
            minutesBefore: Math.abs(timeDiffMinutes),
            threshold: this.PREMATURE_THRESHOLD_MINUTES
          }
        };
      }
      
      return {
        type: 'premature_reporting',
        severity: 'high',
        sourceId,
        description: 'Source reported before event occurred',
        details: {
          minutesBefore: Math.abs(timeDiffMinutes),
          threshold: this.PREMATURE_THRESHOLD_MINUTES
        }
      };
    }
    
    // Check for delayed reporting (not critical, just informational)
    if (timeDiffMinutes > this.DELAYED_THRESHOLD_MINUTES) {
      return {
        type: 'delayed_reporting',
        severity: 'low',
        sourceId,
        description: 'Source reported significantly after event',
        details: {
          minutesAfter: timeDiffMinutes,
          threshold: this.DELAYED_THRESHOLD_MINUTES
        }
      };
    }
    
    return null;
  }

  /**
   * Detect inconsistent sequences in source timestamps
   */
  private detectInconsistentSequence(
    timestamps: TemporalValidationResult['sourceTimestamps'],
    event: EventTimeline
  ): TemporalIssue[] {
    const issues: TemporalIssue[] = [];
    
    // Sort by time
    const sorted = [...timestamps].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Check for sources that claim event happened before other sources
    // This is especially important for election results
    const eventEnd = new Date(event.expectedEndTime || event.expectedStartTime);
    
    // Find sources reporting "after" event that have earlier timestamps
    // than sources reporting "during"
    const afterSources = sorted.filter(s => s.status === 'after');
    const duringSources = sorted.filter(s => s.status === 'during');
    
    if (afterSources.length > 0 && duringSources.length > 0) {
      const earliestAfter = afterSources[0];
      const latestDuring = duringSources[duringSources.length - 1];
      
      if (new Date(earliestAfter.timestamp) < new Date(latestDuring.timestamp)) {
        issues.push({
          type: 'inconsistent_sequence',
          severity: 'medium',
          sourceId: earliestAfter.sourceId,
          description: 'Source claims event ended but reported before other sources confirmed it was ongoing',
          details: {
            earlyReporter: earliestAfter.sourceId,
            timestamp: earliestAfter.timestamp,
            conflictingReporter: latestDuring.sourceId,
            conflictingTimestamp: latestDuring.timestamp
          }
        });
      }
    }
    
    return issues;
  }

  /**
   * Calculate consensus window from valid timestamps
   */
  private calculateConsensusWindow(
    timestamps: TemporalValidationResult['sourceTimestamps']
  ): TemporalValidationResult['consensusWindow'] {
    if (timestamps.length === 0) {
      return {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        durationMinutes: 0
      };
    }
    
    const times = timestamps.map(t => new Date(t.timestamp).getTime());
    const start = new Date(Math.min(...times));
    const end = new Date(Math.max(...times));
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      durationMinutes
    };
  }

  /**
   * Check if sources meet temporal requirements for auto-resolution
   */
  meetsTemporalRequirements(
    validation: TemporalValidationResult,
    maxOutOfSequencePercent: number = 0.2
  ): {
    meets: boolean;
    reason?: string;
  } {
    const totalSources = validation.sourceTimestamps.length;
    const outOfSequenceCount = validation.outOfSequenceSources.length;
    const outOfSequencePercent = totalSources > 0 ? outOfSequenceCount / totalSources : 0;
    
    if (outOfSequencePercent > maxOutOfSequencePercent) {
      return {
        meets: false,
        reason: `${Math.round(outOfSequencePercent * 100)}% of sources have temporal issues (max ${Math.round(maxOutOfSequencePercent * 100)}%)`
      };
    }
    
    const highSeverityIssues = validation.issues.filter(i => i.severity === 'high');
    if (highSeverityIssues.length > 0) {
      return {
        meets: false,
        reason: `${highSeverityIssues.length} high-severity temporal issues detected`
      };
    }
    
    return { meets: true };
  }

  /**
   * Create event timeline from market context
   */
  static createEventTimeline(
    marketId: string,
    eventType: string,
    expectedDate: string,
    context?: any
  ): EventTimeline {
    const isBreakingNews = ['cricket', 'football', 'weather', 'disaster'].includes(eventType.toLowerCase());
    
    return {
      eventId: marketId,
      expectedStartTime: expectedDate,
      expectedEndTime: context?.eventEndTime || expectedDate,
      timezone: 'Asia/Dhaka', // Bangladesh timezone
      isBreakingNews,
      expectedDurationMinutes: context?.durationMinutes || (isBreakingNews ? 180 : 1440)
    };
  }
}

// Singleton instance
let globalTemporalValidator: TemporalValidator | null = null;

export function getGlobalTemporalValidator(): TemporalValidator {
  if (!globalTemporalValidator) {
    globalTemporalValidator = new TemporalValidator();
  }
  return globalTemporalValidator;
}
