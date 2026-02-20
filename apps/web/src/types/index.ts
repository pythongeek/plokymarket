// ===================================
// ENUM TYPES
// ===================================

export type MarketStatus = 'active' | 'closed' | 'resolved' | 'cancelled' | 'paused';
export type TradingPhase = 'PRE_OPEN' | 'CONTINUOUS' | 'AUCTION' | 'HALTED' | 'CLOSED';
export type OutcomeType = 'YES' | 'NO';
export type OrderType = 'limit' | 'market';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelling' | 'cancelled' | 'expired';
export type TIFType = 'FOK' | 'IOC' | 'GTC' | 'GTD' | 'AON';
export type TransactionType = 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'settlement' | 'refund' | 'collateral_release';
export type OracleStatus = 'pending' | 'verified' | 'disputed' | 'finalized';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'bkash' | 'nagad' | 'bank_transfer';
export type MatchingOperationType = 'ENQUEUE' | 'DEQUEUE' | 'MATCH' | 'NOTIFY';
export type OrderNodeStatus = 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';

// ===================================
// USER & WALLET
// ===================================

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
  kyc_verified: boolean;
  kyc_level: number;
  account_status: string;
  last_login_at?: string;
  avatar_url?: string;
  current_level_id?: number;
  current_level_name?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

// ===================================
// MARKETS
// ===================================

export interface Market {
  id: string;
  event_id?: string;
  question: string;
  description?: string;
  category: string;
  source_url?: string;
  image_url?: string;
  creator_id?: string;
  status: MarketStatus;
  resolution_source?: string;
  min_price: number;
  max_price: number;
  tick_size: number;
  created_at: string;
  trading_closes_at: string;
  event_date: string;
  resolved_at?: string;
  winning_outcome?: OutcomeType;
  resolution_source_type?: string;
  resolution_data?: Record<string, any>;
  resolution_details?: Record<string, any>;
  trading_phase?: TradingPhase;
  next_phase_time?: string;
  auction_data?: {
    indicative_price: number;
    indicative_volume: number;
  };
  total_volume: number;
  yes_shares_outstanding: number;
  no_shares_outstanding: number;
  fee_percent?: number;
  initial_liquidity?: number;
  maker_rebate_percent?: number;
  // Computed fields
  yes_price?: number;
  no_price?: number;

  // Pause Control
  trading_status?: 'active' | 'paused' | 'resolved' | 'cancelled';
  pause_reason?: string;
  paused_at?: string;
  paused_by?: string;
  estimated_resume_at?: string;
}

// ===================================
// ORDERS & TRADES
// ===================================

export interface Order {
  id: string;
  market_id: string;
  user_id: string;
  order_type: OrderType;
  side: OrderSide;
  outcome: OutcomeType;
  price: number;
  quantity: number;
  filled_quantity: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  expires_at?: string;

  // TIF (Time In Force) fields
  tif?: TIFType;
  gtd_expiry?: string;
  original_quantity?: number;
  avg_fill_price?: number;
  fill_count?: number;
  last_fill_at?: string;
  time_priority?: number;
  is_re_entry?: boolean;
  parent_order_id?: string;
}

export interface Trade {
  id: string;
  market_id: string;
  buy_order_id?: string;
  sell_order_id?: string;
  outcome: OutcomeType;
  price: number;
  quantity: number;
  maker_id?: string;
  taker_id?: string;
  created_at: string;
}

// ===================================
// POSITIONS & TRANSACTIONS
// ===================================

export interface Position {
  id: string;
  market_id: string;
  user_id: string;
  outcome: OutcomeType;
  quantity: number;
  average_price: number;
  realized_pnl: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  market?: Market;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  order_id?: string;
  trade_id?: string;
  market_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ===================================
// ORACLE & PAYMENTS
// ===================================

export interface OracleVerification {
  id: string;
  market_id: string;
  ai_result?: OutcomeType;
  ai_confidence?: number;
  ai_reasoning?: string;
  scraped_data?: Record<string, any>;
  admin_id?: string;
  admin_decision?: OutcomeType;
  admin_notes?: string;
  status: OracleStatus;
  created_at: string;
  finalized_at?: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transaction_id?: string;
  sender_number?: string;
  receiver_number?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

// ===================================
// MARKET SUGGESTIONS
// ===================================

export interface MarketSuggestion {
  id: string;
  title: string;
  description?: string;
  source_url?: string;
  ai_confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  metadata?: Record<string, any>;
}

// ===================================
// CANCELLATION SYSTEM TYPES
// ===================================

export type CancelType = 'SOFT' | 'HARD' | 'EXPIRY';
export type RaceResolution = 'CANCEL_WON' | 'FILL_WON' | 'PARTIAL_FILL';

export interface CancellationRecord {
  id: string;
  order_id: string;
  cancel_type: CancelType;
  requested_at: string;
  soft_cancelled_at?: string;
  hard_cancelled_at?: string;
  filled_quantity_before: number;
  remaining_quantity: number;
  average_fill_price?: number;
  final_filled_quantity?: number;
  final_cancelled_quantity?: number;
  released_collateral: number;
  race_condition_detected: boolean;
  race_resolution?: RaceResolution;
  sequence_number: number;
  cancellation_signature?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  client_request_id?: string;
  created_at: string;
}

export interface CancellationConfirmation {
  orderId: string;
  cancellationTimestamp: number; // nanoseconds
  filledQuantity: string;
  remainingQuantity: string;
  averageFillPrice: string;
  releasedCollateral: string;
  sequenceNumber: number;
  cancelType: CancelType;
  raceCondition: boolean;
  timestamp: string;
}

export interface CancelResult {
  success: boolean;
  cancelRecordId?: string;
  sequenceNumber: number;
  message: string;
  currentStatus?: OrderStatus;
  releasedCollateral?: number;
  finalStatus?: OrderStatus;
  filledDuringCancel?: number;
}

export interface ReconcileOrderState {
  orderId: string;
  currentStatus: OrderStatus;
  filledQuantity: number;
  cancelledQuantity: number;
  sequenceNumber: number;
  changesSinceSequence: CancellationChange[];
}

export interface CancellationChange {
  sequence: number;
  type: CancelType;
  timestamp: string;
  filled_before: number;
  remaining: number;
}

export interface BatchCancelResult {
  orderId: string;
  success: boolean;
  message: string;
  sequenceNumber: number;
}

// ===================================
// PARTIAL FILL MANAGEMENT TYPES
// ===================================

export interface FillRecord {
  id: string;
  order_id: string;
  quantity: number;
  price: number;
  total_value: number;
  counterparty_order_id?: string;
  counterparty_user_id?: string;
  trade_id?: string;
  fill_number: number;
  is_maker: boolean;
  transaction_hash?: string;
  blockchain_reference?: string;
  filled_at: string;
  created_at: string;
}

export interface PartialFillState {
  orderId: string;
  userId: string;
  marketId: string;
  side: OrderSide;
  price: number;
  originalQuantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  avgFillPrice: number;
  fillCount: number;
  lastFillAt?: string;
  tif: TIFType;
  gtdExpiry?: string;
  status: OrderStatus;
  timePriority: number;
  isReEntry: boolean;
  parentOrderId?: string;
  fillHistory: FillHistoryItem[];
}

export interface FillHistoryItem {
  fillId: string;
  quantity: number;
  price: number;
  totalValue: number;
  isMaker: boolean;
  filledAt: string;
  fillNumber: number;
}

export interface TIFOrderResult {
  orderId: string;
  status: OrderStatus;
  message: string;
  filled?: number;
  remaining?: number;
  avgPrice?: number;
}

export interface ReEntryResult {
  newOrderId: string;
  preservedPriority: boolean;
  message: string;
}

export interface VWAPResult {
  totalValue: number;
  totalQuantity: number;
  averagePrice: number;
  fills: FillRecord[];
}

// ===================================
// ADVANCED MATCHING ENGINE TYPES
// ===================================

export interface OrderNode {
  id: string;
  prevNodeId?: string;
  nextNodeId?: string;
  priceLevelId: string;
  orderId: string;
  accountId: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  remainingSize: number;
  placedAtNs: number; // Nanoseconds
  sequenceNumber: number;
  workerId: number;
  numaNode: number;
  status: OrderNodeStatus;
  cancelRequested: boolean;
  cancelRequestedAt?: string;
  isProRataEligible: boolean;
  proRataAllocation: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceLevel {
  id: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number;
  headNodeId?: string;
  tailNodeId?: string;
  totalVolume: number;
  orderCount: number;
  proRataEnabled: boolean;
  proRataMinVolume: number;
  createdAt: string;
  updatedAt: string;
}

export interface FIFOQueue {
  head: OrderNode | null;
  tail: OrderNode | null;
  size: number;
  totalVolume: number;
}

export interface ProRataFill {
  nodeId: string;
  orderId: string;
  allocatedSize: number;
  isRemainder: boolean;
}

export interface MatchResult {
  matchedOrderId: string;
  matchedAccountId: string;
  fillSize: number;
  fillPrice: number;
  isMaker: boolean;
}

export interface FillNotification {
  id: string;
  fillId: string;
  orderId: string;
  userId: string;
  marketId: string;
  quantity: number;
  price: number;
  totalValue: number;
  side: OrderSide;
  websocketSent: boolean;
  websocketSentAt?: string;
  persistentStored: boolean;
  emailSent: boolean;
  webhookDelivered: boolean;
  auditLogged: boolean;
  analyticsStreamed: boolean;
  retryCount: number;
  sequenceNumber: number;
  createdAt: string;
  completedAt?: string;
}

export interface LatencyMetric {
  id: string;
  operationType: MatchingOperationType;
  marketId?: string;
  latencyUs: number;
  queueDepth?: number;
  workerId: number;
  numaNode: number;
  createdAt: string;
}

export interface MatchingPerformance {
  operationType: MatchingOperationType;
  p50LatencyUs: number;
  p99LatencyUs: number;
  p999LatencyUs: number;
  avgLatencyUs: number;
  minLatencyUs: number;
  maxLatencyUs: number;
  operationCount: number;
  timeBucket: string;
}

export interface OrderBookDepth {
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number;
  totalVolume: number;
  orderCount: number;
  proRataEnabled: boolean;
  orderIds: string[];
  isBestQuote: boolean;
}

export interface EnqueueResult {
  nodeId: string;
  sequenceNumber: number;
  placedAtNs: number;
}

// ===================================
// UI TYPES
// ===================================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  adminOnly?: boolean;
}

export interface ChartDataPoint {
  time: string;
  price: number;
  volume?: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

// ===================================
// TRADE LEDGER IMMUTABILITY TYPES
// ===================================

export interface TradeLedger {
  id: string;
  tradeId: string;
  marketId: string;
  buyerId: string;
  sellerId: string;
  makerId?: string;
  takerId?: string;
  price: number;
  quantity: number;
  totalValue: number;
  previousHash: string;
  tradeDataHash: string;
  combinedHash: string;
  merkleLeafHash?: string;
  merkleRootHash?: string;
  merkleTreeLevel?: number;
  merkleSiblingHash?: string;
  blockchainTxHash?: string;
  blockchainAnchorHeight?: number;
  anchoredAt?: string;
  sequenceNumber: number;
  ledgerSequence: number;
  checkpointId?: string;
  executedAtNs: number;
  recordedAt: string;
  isSealed: boolean;
  sealedAt?: string;
}

export interface LedgerCheckpoint {
  id: string;
  checkpointSequence: number;
  startTradeSequence: number;
  endTradeSequence: number;
  startHash: string;
  endHash: string;
  merkleRoot: string;
  blockchainTxHash?: string;
  anchorTimestamp?: string;
  verifiedAt?: string;
  verificationStatus: 'pending' | 'verified' | 'corrupted';
  corruptionDetectedAt?: string;
  createdAt: string;
}

export interface LedgerVerificationResult {
  isValid: boolean;
  corruptedAtSequence?: number;
  corruptedTradeId?: string;
  expectedHash?: string;
  actualHash?: string;
}

// ===================================
// SETTLEMENT QUEUE TYPES
// ===================================

export type SettlementPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type SettlementStatus = 'pending' | 'processing' | 'submitted' | 'confirmed' | 'failed' | 'manual_review';

export interface SettlementQueue {
  id: string;
  tradeId: string;
  ledgerId?: string;
  priority: SettlementPriority;
  status: SettlementStatus;
  tradeValue: number;
  isMarketClosing: boolean;
  hasUserWithdrawal: boolean;
  isRetry: boolean;
  retryCount: number;
  blockchainNetwork: string;
  txHash?: string;
  txNonce?: number;
  gasPriceGwei?: number;
  gasUsed?: number;
  blockNumber?: number;
  blockTimestamp?: string;
  submittedAt?: string;
  confirmedAt?: string;
  failedAt?: string;
  failureReason?: string;
  batchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementStats {
  totalPending: number;
  p0Pending: number;
  p1Pending: number;
  p2Pending: number;
  p3Pending: number;
  avgConfirmationTime: number;
  totalGasUsed: number;
}

// ===================================
// SELF-TRADE PREVENTION TYPES
// ===================================

export type STPMode = 'prevent' | 'decrease' | 'cancel_both' | 'allow';
export type STPViolationType = 'self_match' | 'cross_market' | 'organizational' | 'wash_trade';

export interface UserSTPConfig {
  id: string;
  userId: string;
  stpMode: STPMode;
  crossMarketStpEnabled: boolean;
  organizationalStpEnabled: boolean;
  isWashTradingMonitored: boolean;
  washTradeAlertThreshold: number;
  beneficialOwnerId?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface STPViolation {
  id: string;
  orderAId: string;
  orderBId: string;
  userId: string;
  beneficialOwnerId?: string;
  violationType: STPViolationType;
  detectionMethod: string;
  actionTaken: string;
  mlConfidence?: number;
  mlFeatures?: Record<string, any>;
  detectedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface STPCheckResult {
  isViolation: boolean;
  violationType?: STPViolationType;
  actionTaken?: string;
  matchedOrderId?: string;
  reason?: string;
}

// ===================================
// WASH TRADING DETECTION TYPES
// ===================================

export interface WashTradingScore {
  id: string;
  userId: string;
  detectionWindowStart: string;
  detectionWindowEnd: string;
  temporalCorrelationScore: number;
  sizeRelationshipScore: number;
  priceImpactScore: number;
  networkAnalysisScore: number;
  behavioralScore: number;
  overallConfidence: number;
  suspiciousTrades: string[];
  featureBreakdown: Record<string, any>;
  alertLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  actionTaken?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CrossMarketRelationship {
  id: string;
  marketAId: string;
  marketBId: string;
  relationshipType: 'inverse' | 'correlated' | 'synthetic';
  correlationCoefficient?: number;
  createdAt: string;
}

// ===================================
// REGULATORY REPORTING TYPES
// ===================================

export type ReportType = 'SAR_US' | 'STR_EU' | 'FIU_GLOBAL' | 'INTERNAL_REVIEW';
export type ReportStatus = 'draft' | 'pending_review' | 'submitted' | 'acknowledged' | 'closed';
export type ReportTrigger = 'confirmed_wash_trading' | 'suspicious_pattern' | 'cross_platform_coordination' | 'manual_review';

export interface RegulatoryReport {
  id: string;
  reportType: ReportType;
  reportNumber: string;
  triggerType: ReportTrigger;
  triggerTradeIds: string[];
  triggerAmount: number;
  subjectUserId: string;
  subjectAccountIds: string[];
  beneficialOwnerId?: string;
  reportContent: Record<string, any>;
  tradeHistory?: Record<string, any>;
  accountRelationships?: Record<string, any>;
  detectionMethodology?: Record<string, any>;
  riskScore: number;
  detectedAt: string;
  reportDueDate: string;
  submittedAt?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  transmissionMethod?: string;
  transmissionConfirmationId?: string;
  transmissionConfirmedAt?: string;
  jurisdiction: string;
  filingInstitution: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerExchange {
  id: string;
  name: string;
  jurisdiction: string;
  apiEndpoint?: string;
  encryptionPublicKey?: string;
  agreementType?: string;
  informationSharingEnabled: boolean;
  responseTimeSla?: number;
  createdAt: string;
}

export interface CrossPlatformAlert {
  id: string;
  alertType: string;
  subjectIdentifier?: string;
  subjectUserId?: string;
  originatingExchange?: string;
  recipientExchange?: string;
  alertData: Record<string, any>;
  riskIndicators: string[];
  sharedAt?: string;
  acknowledgedAt?: string;
  responseReceivedAt?: string;
  status: 'pending' | 'shared' | 'acknowledged' | 'responded' | 'closed';
  createdAt: string;
}

// ===================================
// SCALABILITY & SHARDING TYPES
// ===================================

export type ShardStrategy = 'activity_based' | 'correlation_based' | 'geographic' | 'hybrid';
export type StorageLayerType = 'hot' | 'warm' | 'cold' | 'archive';
export type RecoveryStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface MarketShard {
  id: string;
  shardNumber: number;
  shardName: string;
  strategy: ShardStrategy;
  marketIdRangeStart?: number;
  marketIdRangeEnd?: number;
  marketCategoryFilter?: string[];
  geographicRegion?: string;
  primaryNode: string;
  secondaryNode?: string;
  databaseConnectionString?: string;
  isActive: boolean;
  isReadOnly: boolean;
  totalMarkets: number;
  totalOrders: number;
  avgLatencyMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarketShardAssignment {
  id: string;
  marketId: string;
  shardId: string;
  assignedAt: string;
}

export interface StorageLayerConfig {
  id: string;
  layer: StorageLayerType;
  technology: string;
  storageFormat?: string;
  durabilityDescription: string;
  maxDataLossMs: number;
  recoveryTimeSla: number;
  recoveryProcedure?: string;
  replicationFactor: number;
  replicationRegions?: string[];
  targetLatencyMs: number;
  maxThroughputOps: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderBookCheckpoint {
  id: string;
  shardId?: string;
  checkpointSequence: number;
  stateHash: string;
  orderCount: number;
  totalVolume: number;
  hotStorageReference?: string;
  warmStoragePath?: string;
  verifiedAt?: string;
  verificationHash?: string;
  createdAt: string;
}

export interface RecoveryOperation {
  id: string;
  shardId?: string;
  recoveryType: string;
  sourceCheckpoint?: string;
  status: RecoveryStatus;
  totalOperations?: number;
  completedOperations: number;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  consistencyVerified: boolean;
  verificationResult?: Record<string, any>;
  createdAt: string;
}

export interface HotStandbyNode {
  id: string;
  shardId?: string;
  nodeName: string;
  nodeAddress: string;
  isPrimary: boolean;
  replicationLagMs: number;
  lastSyncAt?: string;
  failoverPriority: number;
  autoFailoverEnabled: boolean;
  status: 'syncing' | 'synced' | 'lagging' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface ShardDistribution {
  shardNumber: number;
  shardName: string;
  strategy: ShardStrategy;
  primaryNode: string;
  isActive: boolean;
  assignedMarkets: number;
  totalOrders: number;
  avgLatencyMs?: number;
}


// ===================================
// ADVANCED AI ORACLE SYSTEM
// ===================================

// Confidence Levels
export type AIConfidenceLevel = 'automated' | 'human_review' | 'escalation';

export interface AIConfidenceThreshold {
  min: number;
  max: number;
  level: AIConfidenceLevel;
  action: string;
}

// Evidence and Sources
export interface AIEvidenceSource {
  id: string;
  url: string;
  title: string;
  content: string;
  sourceType: 'news' | 'social' | 'official' | 'database' | 'academic';
  authorityScore: number;
  publishedAt: string;
  retrievedAt: string;
  credibilityScore: number;
  relevanceScore: number;
  rawMetadata: Record<string, any>;
}

export interface AIEvidenceCorpus {
  query: string;
  sources: AIEvidenceSource[];
  totalSources: number;
  crossVerificationScore: number;
  temporalProximity: number;
}

// Agent Outputs
export interface AIRetrievalOutput {
  agentType: 'retrieval';
  corpus: AIEvidenceCorpus;
  executionTimeMs: number;
  sourcesByType: Record<string, number>;
}

export interface AISynthesisOutput {
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
  modelVersion: string;
  executionTimeMs: number;
}

export interface AIDeliberationOutput {
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

export interface AIExplanationOutput {
  agentType: 'explanation';
  naturalLanguageReasoning: string;
  keyEvidenceCitations: string[];
  confidenceExplanation: string;
  uncertaintyAcknowledgment?: string;
  modelUsed: string;
  executionTimeMs: number;
}

// Complete Resolution Pipeline
export interface AIResolutionPipeline {
  pipelineId: string;
  marketId: string;
  query: string;
  status: 'running' | 'completed' | 'failed' | 'escalated';

  // Agent Outputs
  retrieval?: AIRetrievalOutput;
  synthesis?: AISynthesisOutput;
  deliberation?: AIDeliberationOutput;
  explanation?: AIExplanationOutput;

  // Final Result
  finalOutcome?: string;
  finalConfidence: number;
  confidenceLevel: AIConfidenceLevel;
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

// Model Versioning
export interface AIModelVersion {
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
  };
  trainingDate: string;
  datasetSize: number;
  isCanary: boolean;
  canaryTrafficPercent: number;
}

// A/B Testing
export interface AIABTest {
  id: string;
  name: string;
  modelA: string;
  modelB: string;
  trafficSplit: [number, number];
  status: 'running' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  metrics: {
    modelA: AIModelPerformanceMetrics;
    modelB: AIModelPerformanceMetrics;
  };
  winner?: string;
}

export interface AIModelPerformanceMetrics {
  totalResolutions: number;
  accuracy: number;
  disputedRate: number;
  avgConfidence: number;
  humanOverrideRate: number;
  avgExecutionTimeMs: number;
}

// Feedback Loop
export interface AIResolutionFeedback {
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

// Human Review Queue
export interface AIHumanReviewItem {
  id: string;
  pipelineId: string;
  marketId: string;
  marketQuestion: string;
  aiOutcome: string;
  aiConfidence: number;
  aiExplanation: string;
  evidenceSummary: AIEvidenceSource[];
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

// Oracle Orchestration Result
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

// Circuit Breaker State
export interface AICircuitBreakerState {
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
