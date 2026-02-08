/**
 * Dispute Mechanism Types
 * Escalating bond structure with multi-level resolution
 * Bangladesh-context aware
 */

export type DisputeLevel = 'initial' | 'appeal' | 'final';
export type DisputeStatus = 'pending' | 'active' | 'resolved' | 'rejected' | 'expired';
export type DisputeOutcome = 'upheld' | 'overturned' | 'split' | 'timeout';

export interface DisputeLevelConfig {
  level: DisputeLevel;
  bondPercent: number;
  resolutionMethod: string;
  timelineHours: number;
  description: string;
}

export const DISPUTE_LEVELS: Record<DisputeLevel, DisputeLevelConfig> = {
  initial: {
    level: 'initial',
    bondPercent: 0.02, // 2%
    resolutionMethod: 'automated_reverification',
    timelineHours: 24,
    description: 'Automated re-verification with expanded sources'
  },
  appeal: {
    level: 'appeal',
    bondPercent: 0.05, // 5%
    resolutionMethod: 'expert_panel',
    timelineHours: 48,
    description: 'Expert panel review'
  },
  final: {
    level: 'final',
    bondPercent: 0.10, // 10%
    resolutionMethod: 'decentralized_court',
    timelineHours: 168, // 7 days
    description: 'Decentralized court (Kleros/UMA DVM)'
  }
};

// Bond economics
export interface BondEconomics {
  totalBondAmount: number;
  challengerBond: number;
  proposerBond: number;
  
  // Distribution on successful dispute
  challengerReward: number;      // 25% of forfeited
  treasuryAmount: number;        // Remainder to platform
  
  // Forfeiture
  forfeitureAmount: number;
}

export const BOND_ECONOMICS = {
  // Challenger reward for successful dispute
  CHALLENGER_REWARD_PERCENT: 0.25,
  
  // Treasury fee on successful dispute
  TREASURY_FEE_PERCENT: 0.75,
  
  // Minimum dispute amount (BDT)
  MIN_DISPUTE_AMOUNT_BDT: 1000,
  
  // Maximum dispute amount (BDT)
  MAX_DISPUTE_AMOUNT_BDT: 10000000, // 1 Crore
  
  // Grace period before bond forfeiture (hours)
  FORFEITURE_GRACE_HOURS: 72
};

export interface Dispute {
  id: string;
  marketId: string;
  pipelineId: string;
  
  // Dispute info
  level: DisputeLevel;
  status: DisputeStatus;
  
  // Participants
  challengerId: string;
  proposerId?: string;
  
  // Bonds
  bondAmount: number;
  bondCurrency: 'BDT';
  bondLockedAt: string;
  bondReleasedAt?: string;
  
  // Reasoning
  challengeReason: string;
  evidenceUrls: string[];
  expectedOutcome: string;
  
  // Resolution
  resolutionMethod: string;
  resolutionOutcome?: DisputeOutcome;
  finalOutcome?: string;
  resolutionDetails?: Record<string, any>;
  
  // Timeline
  createdAt: string;
  deadlineAt: string;
  resolvedAt?: string;
  
  // Economics
  rewardDistributed: boolean;
  challengerReward?: number;
  treasuryFee?: number;
  
  // Appeals
  parentDisputeId?: string;
  childDisputeId?: string;
}

export interface DisputeInitiationRequest {
  marketId: string;
  pipelineId: string;
  challengerId: string;
  
  // Challenge details
  challengeReason: string;
  evidenceUrls: string[];
  expectedOutcome: string;
  
  // Level (defaults to initial)
  level?: DisputeLevel;
  
  // Parent dispute (for appeals)
  parentDisputeId?: string;
}

export interface DisputeResolution {
  disputeId: string;
  outcome: DisputeOutcome;
  finalOutcome: string;
  resolvedBy: string; // user id, 'system', or 'decentralized_court'
  resolutionDetails: {
    method: string;
    evidenceConsidered: string[];
    reasoning: string;
    confidenceScore?: number;
  };
}

export interface DisputeStats {
  totalDisputes: number;
  byLevel: Record<DisputeLevel, number>;
  byStatus: Record<DisputeStatus, number>;
  byOutcome: Record<DisputeOutcome, number>;
  
  // Economics
  totalBondsLocked: number;
  totalRewardsDistributed: number;
  totalTreasuryFees: number;
  
  // Success rates
  successRate: number; // Challenger success rate
  avgResolutionTime: number; // Hours
}

// Expert Panel Types
export interface ExpertPanelMember {
  id: string;
  name: string;
  expertise: string[];
  credibilityScore: number;
  totalReviews: number;
  accuracyRate: number;
  isActive: boolean;
}

export interface ExpertPanelReview {
  disputeId: string;
  panelMembers: string[];
  
  // Individual votes
  votes: Array<{
    expertId: string;
    outcome: string;
    confidence: number;
    reasoning: string;
    votedAt: string;
  }>;
  
  // Consensus
  consensusOutcome: string;
  consensusConfidence: number;
  
  // Timeline
  assignedAt: string;
  completedAt?: string;
}
