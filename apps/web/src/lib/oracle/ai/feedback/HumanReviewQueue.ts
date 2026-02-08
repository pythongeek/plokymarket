/**
 * Human Review Queue System
 * Manages AI resolutions requiring human oversight
 */

import { HumanReviewItem, AIResolutionPipeline, EvidenceSource } from '../types';

type ReviewCallback = (item: HumanReviewItem) => void;

export class HumanReviewQueue {
  private queue: Map<string, HumanReviewItem> = new Map();
  private assignedItems: Map<string, string> = new Map(); // userId -> itemId
  private subscribers: ReviewCallback[] = [];
  
  // SLA configuration
  private readonly defaultDeadlineHours = 24;
  private readonly priorityDeadlines: Record<string, number> = {
    low: 48,
    medium: 24,
    high: 8,
    critical: 2
  };

  /**
   * Add item to review queue
   */
  addToQueue(
    pipeline: AIResolutionPipeline,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): HumanReviewItem {
    const id = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const deadlineHours = this.priorityDeadlines[priority];
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);
    
    const item: HumanReviewItem = {
      id,
      pipelineId: pipeline.pipelineId,
      marketId: pipeline.marketId,
      marketQuestion: pipeline.query,
      
      aiOutcome: pipeline.finalOutcome || 'UNCERTAIN',
      aiConfidence: pipeline.finalConfidence,
      aiExplanation: pipeline.explanation?.naturalLanguageReasoning || '',
      evidenceSummary: pipeline.retrieval?.corpus.sources.slice(0, 5) || [],
      
      status: 'pending',
      priority,
      
      createdAt: new Date().toISOString(),
      deadlineAt: deadline.toISOString()
    };
    
    this.queue.set(id, item);
    
    console.log(`[HumanReviewQueue] Added item ${id} for market ${pipeline.marketId} (priority: ${priority})`);
    
    // Notify subscribers
    this.notifySubscribers(item);
    
    return item;
  }

  /**
   * Get next available item for reviewer
   */
  getNextItem(reviewerId: string, preferredPriority?: string): HumanReviewItem | null {
    // Check if reviewer already has an assigned item
    const existingAssignment = this.assignedItems.get(reviewerId);
    if (existingAssignment) {
      const item = this.queue.get(existingAssignment);
      if (item && item.status === 'assigned') {
        return item;
      }
    }
    
    // Find available items
    const availableItems = Array.from(this.queue.values())
      .filter(item => item.status === 'pending')
      .filter(item => !preferredPriority || item.priority === preferredPriority);
    
    if (availableItems.length === 0) return null;
    
    // Sort by priority and deadline
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    availableItems.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
    });
    
    // Assign top item
    const item = availableItems[0];
    this.assignItem(item.id, reviewerId);
    
    return item;
  }

  /**
   * Assign item to reviewer
   */
  assignItem(itemId: string, reviewerId: string): boolean {
    const item = this.queue.get(itemId);
    if (!item || item.status !== 'pending') return false;
    
    item.status = 'assigned';
    item.assignedTo = reviewerId;
    item.assignedAt = new Date().toISOString();
    
    this.assignedItems.set(reviewerId, itemId);
    
    console.log(`[HumanReviewQueue] Assigned item ${itemId} to reviewer ${reviewerId}`);
    
    return true;
  }

  /**
   * Submit review decision
   */
  submitReview(
    itemId: string,
    reviewerId: string,
    decision: 'accept' | 'modify' | 'escalate',
    finalOutcome?: string,
    notes?: string
  ): boolean {
    const item = this.queue.get(itemId);
    if (!item || item.assignedTo !== reviewerId) return false;
    
    item.reviewerDecision = decision;
    item.finalOutcome = finalOutcome;
    item.reviewerNotes = notes;
    item.reviewedAt = new Date().toISOString();
    
    switch (decision) {
      case 'accept':
        item.status = 'completed';
        break;
      case 'modify':
        item.status = 'completed';
        break;
      case 'escalate':
        item.status = 'escalated';
        item.priority = this.getEscalatedPriority(item.priority);
        break;
    }
    
    // Remove assignment
    this.assignedItems.delete(reviewerId);
    
    console.log(`[HumanReviewQueue] Review submitted for ${itemId}: ${decision}`);
    
    return true;
  }

  /**
   * Get item by ID
   */
  getItem(itemId: string): HumanReviewItem | undefined {
    return this.queue.get(itemId);
  }

  /**
   * Get items by status
   */
  getItemsByStatus(status: HumanReviewItem['status']): HumanReviewItem[] {
    return Array.from(this.queue.values()).filter(item => item.status === status);
  }

  /**
   * Get items assigned to reviewer
   */
  getAssignedItems(reviewerId: string): HumanReviewItem[] {
    return Array.from(this.queue.values())
      .filter(item => item.assignedTo === reviewerId);
  }

  /**
   * Get overdue items
   */
  getOverdueItems(): HumanReviewItem[] {
    const now = new Date().toISOString();
    return Array.from(this.queue.values())
      .filter(item => item.status === 'pending' || item.status === 'assigned')
      .filter(item => item.deadlineAt < now);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    avgWaitTimeMinutes: number;
  } {
    const items = Array.from(this.queue.values());
    const now = Date.now();
    
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    items.forEach(item => {
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
    });
    
    const overdue = items.filter(item => 
      (item.status === 'pending' || item.status === 'assigned') &&
      new Date(item.deadlineAt).getTime() < now
    ).length;
    
    // Calculate average wait time for pending items
    const pendingItems = items.filter(item => item.status === 'pending');
    const avgWaitTimeMinutes = pendingItems.length > 0
      ? pendingItems.reduce((sum, item) => 
          sum + (now - new Date(item.createdAt).getTime()) / (1000 * 60), 0) / pendingItems.length
      : 0;
    
    return {
      total: items.length,
      byStatus,
      byPriority,
      overdue,
      avgWaitTimeMinutes: Math.round(avgWaitTimeMinutes)
    };
  }

  /**
   * Subscribe to new items
   */
  subscribe(callback: ReviewCallback): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify subscribers of new item
   */
  private notifySubscribers(item: HumanReviewItem): void {
    this.subscribers.forEach(callback => {
      try {
        callback(item);
      } catch (error) {
        console.error('[HumanReviewQueue] Subscriber error:', error);
      }
    });
  }

  /**
   * Escalate priority
   */
  private getEscalatedPriority(current: string): 'low' | 'medium' | 'high' | 'critical' {
    const escalation: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      low: 'medium',
      medium: 'high',
      high: 'critical',
      critical: 'critical'
    };
    return escalation[current] || 'critical';
  }

  /**
   * Auto-escalate overdue items
   */
  autoEscalateOverdue(): number {
    const overdue = this.getOverdueItems();
    let escalated = 0;
    
    for (const item of overdue) {
      if (item.priority !== 'critical') {
        item.priority = this.getEscalatedPriority(item.priority);
        
        // Extend deadline
        const newDeadline = new Date();
        newDeadline.setHours(newDeadline.getHours() + this.priorityDeadlines[item.priority]);
        item.deadlineAt = newDeadline.toISOString();
        
        console.log(`[HumanReviewQueue] Auto-escalated item ${item.id} to ${item.priority}`);
        escalated++;
      }
    }
    
    return escalated;
  }

  /**
   * Release stale assignments (reviewer inactive)
   */
  releaseStaleAssignments(maxAssignmentMinutes: number = 60): number {
    const now = Date.now();
    let released = 0;
    
    for (const item of this.queue.values()) {
      if (item.status === 'assigned' && item.assignedAt) {
        const assignedTime = new Date(item.assignedAt).getTime();
        const minutesAssigned = (now - assignedTime) / (1000 * 60);
        
        if (minutesAssigned > maxAssignmentMinutes) {
          item.status = 'pending';
          item.assignedTo = undefined;
          item.assignedAt = undefined;
          
          if (item.assignedTo) {
            this.assignedItems.delete(item.assignedTo);
          }
          
          console.log(`[HumanReviewQueue] Released stale assignment for item ${item.id}`);
          released++;
        }
      }
    }
    
    return released;
  }

  /**
   * Create review item from pipeline result
   */
  static createFromPipeline(
    pipeline: AIResolutionPipeline,
    reason: string
  ): Omit<HumanReviewItem, 'id' | 'createdAt' | 'deadlineAt' | 'status'> {
    return {
      pipelineId: pipeline.pipelineId,
      marketId: pipeline.marketId,
      marketQuestion: pipeline.query,
      aiOutcome: pipeline.finalOutcome || 'UNCERTAIN',
      aiConfidence: pipeline.finalConfidence,
      aiExplanation: pipeline.explanation?.naturalLanguageReasoning || '',
      evidenceSummary: pipeline.retrieval?.corpus.sources.slice(0, 5) || [],
      priority: pipeline.finalConfidence >= 0.9 ? 'medium' : 'high'
    };
  }
}

// Singleton instance
let globalReviewQueue: HumanReviewQueue | null = null;

export function getGlobalReviewQueue(): HumanReviewQueue {
  if (!globalReviewQueue) {
    globalReviewQueue = new HumanReviewQueue();
  }
  return globalReviewQueue;
}
