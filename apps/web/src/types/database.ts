/**
 * ===================================
 * COMPREHENSIVE DATABASE TYPES
 * Synced with all Supabase migrations
 * ===================================
 */

// ===================================
// ENUM TYPES FROM DATABASE
// ===================================

export type TradingStatus = 'active' | 'paused' | 'resolved' | 'cancelled' | 'pending';
export type OrderTypeDB = 'market' | 'limit' | 'stop_loss' | 'oco';
export type OrderSideDB = 'yes' | 'no' | 'buy' | 'sell';
export type OrderStatusDB = 'pending' | 'filled' | 'partial' | 'cancelled' | 'expired';
export type NotificationType = 
  | 'trade_filled' 
  | 'trade_partial' 
  | 'price_alert' 
  | 'market_resolved' 
  | 'comment_reply' 
  | 'new_follower'
  | 'market_ending' 
  | 'position_update';

export type ResolutionMethod = 'manual_admin' | 'ai_oracle' | 'expert_panel' | 'external_api';
export type ResolutionSystemStatus = 'pending' | 'active' | 'completed' | 'failed';
export type PipelineStatus = 'running' | 'completed' | 'failed' | 'paused';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'escalated';
export type VerificationMethod = 'ai_consensus' | 'expert_panel' | 'hybrid' | 'manual';

export type ExpertStatus = 'active' | 'inactive' | 'suspended';
export type VoteStatus = 'pending' | 'submitted' | 'consensus_reached';

export type DisputeStatus = 'pending' | 'under_review' | 'resolved' | 'rejected';
export type ReviewStatus = 'pending' | 'assigned' | 'in_review' | 'completed';

// ===================================
// USER PROFILES (Enhanced)
// ===================================

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  country_code?: string;
  timezone: string;
  preferred_language: string;
  
  // Verification
  is_verified: boolean;
  is_pro: boolean;
  verification_level: number;
  
  // Statistics
  total_trades: number;
  total_volume: number;
  total_profit: number;
  win_rate: number;
  reputation_score: number;
  
  // Balance
  usdc_balance: number;
  locked_balance: number;
  
  // Notification Settings
  email_notifications: boolean;
  push_notifications: boolean;
  trade_alerts: boolean;
  market_updates: boolean;
  
  // Privacy Settings
  profile_visibility: 'public' | 'followers' | 'private';
  show_trades: boolean;
  show_portfolio: boolean;
  
  // Social
  followers_count: number;
  following_count: number;
  
  // Audit
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

// ===================================
// EVENTS/MARKETS (Enhanced from 093_manual_event_system.sql)
// ===================================

export interface Event {
  id: string;
  slug: string;
  
  // Market Info
  name?: string;
  title?: string;
  question: string;
  description?: string;
  ticker?: string;
  
  // Category & Metadata
  category: string;
  subcategory?: string;
  tags: string[];
  
  // Visual Assets
  image_url?: string;
  thumbnail_url?: string;
  banner_url?: string;
  
  // Verification & Status
  is_verified: boolean;
  is_featured: boolean;
  is_trending: boolean;
  trading_status: TradingStatus;
  
  // Answer Options
  answer1: string;
  answer2: string;
  answer_type: 'binary' | 'multiple' | 'scalar';
  
  // Time Management
  starts_at: string;
  ends_at: string;
  resolution_delay: number;
  closed_time?: string;
  resolved_at?: string;
  
  // Financial Tracking
  initial_liquidity: number;
  current_liquidity: number;
  volume: number;
  total_trades: number;
  unique_traders: number;
  
  // Pricing
  current_yes_price: number;
  current_no_price: number;
  price_24h_change?: number;
  
  // Blockchain Integration
  condition_id?: string;
  token1?: string;
  token2?: string;
  resolver_reference?: string;
  neg_risk: boolean;
  
  // Resolution
  resolved_outcome?: 1 | 2;
  resolved_by?: string;
  winning_token?: string;
  resolution_source?: string;
  
  // Pause Control
  pause_reason?: string;
  paused_at?: string;
  paused_by?: string;
  estimated_resume_at?: string;
  
  // Audit Trail
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Search
  search_vector?: unknown;
}

// ===================================
// RESOLUTION SYSTEMS (from 093_manual_event_system.sql)
// ===================================

export interface ResolutionSystem {
  id: string;
  event_id: string;
  
  // Resolution Method
  primary_method: ResolutionMethod;
  
  // AI Oracle Config
  ai_keywords: string[];
  ai_sources: string[];
  confidence_threshold: number;
  
  // Expert Panel Config
  expert_panel_id?: string;
  min_expert_votes: number;
  
  // External API Config
  external_api_endpoint?: string;
  external_api_key?: string;
  
  // Status
  status: ResolutionSystemStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AIResolutionPipeline {
  id: string;
  market_id: string;
  pipeline_id?: string;
  
  // Query Data
  query?: Record<string, any>;
  retrieval_output?: Record<string, any>;
  synthesis_output?: Record<string, any>;
  deliberation_output?: Record<string, any>;
  explanation_output?: Record<string, any>;
  
  // Results
  final_outcome?: string;
  final_confidence?: number;
  confidence_level?: string;
  recommended_action?: string;
  
  // Status
  status: PipelineStatus;
  
  // Timing
  started_at: string;
  completed_at?: string;
  total_execution_time_ms?: number;
  
  // Model Info
  synthesis_model_version?: string;
  deliberation_model_version?: string;
  explanation_model_version?: string;
  
  created_at: string;
}

// ===================================
// WORKFLOW SYSTEMS (from 029_create_verification_workflows.sql)
// ===================================

export interface VerificationWorkflow {
  id: string;
  name: string;
  description?: string;
  
  // Configuration
  event_category: string;
  verification_method: VerificationMethod;
  
  // Timing
  check_interval_minutes: number;
  max_execution_time_minutes: number;
  
  // AI Config
  ai_agent_count: number;
  min_confidence_threshold: number;
  consensus_threshold: number;
  
  // Escalation
  auto_escalate: boolean;
  escalation_delay_minutes: number;
  
  // Status
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
  
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  event_id: string;
  
  // Status
  status: WorkflowStatus;
  stage: string;
  
  // Timing
  started_at: string;
  completed_at?: string;
  scheduled_for?: string;
  
  // Results
  result?: Record<string, any>;
  error_message?: string;
  
  // AI Results
  ai_consensus_reached?: boolean;
  ai_confidence_score?: number;
  ai_recommended_outcome?: string;
  
  // Retry
  retry_count: number;
  max_retries: number;
  
  // Escalation
  escalated_to?: string;
  escalated_at?: string;
  escalation_reason?: string;
  
  // Notification
  notified: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface WorkflowAnalyticsDaily {
  id: string;
  date: string;
  workflow_id?: string;
  
  // Counts
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  escalated_executions: number;
  
  // Timing
  avg_execution_time_ms: number;
  
  // AI Metrics
  avg_confidence_score: number;
  consensus_rate: number;
  
  created_at: string;
}

// ===================================
// EXPERT PANEL SYSTEM (from 088_expert_panel_system.sql)
// ===================================

export interface ExpertPanel {
  id: string;
  user_id: string;
  
  // Expert Info
  expertise_areas: string[];
  credentials?: string;
  reputation_score: number;
  
  // Status
  status: ExpertStatus;
  
  // Statistics
  total_votes: number;
  accurate_votes: number;
  accuracy_rate: number;
  
  // Availability
  is_available: boolean;
  max_daily_assignments: number;
  current_assignments: number;
  
  created_at: string;
  updated_at: string;
}

export interface ExpertVote {
  id: string;
  expert_id: string;
  market_id: string;
  
  // Vote
  outcome: string;
  confidence: number;
  reasoning?: string;
  
  // Status
  status: VoteStatus;
  
  // Timing
  submitted_at?: string;
  
  // Verification
  was_accurate?: boolean;
  verified_at?: string;
  
  created_at: string;
}

export interface ExpertAssignment {
  id: string;
  expert_id: string;
  market_id: string;
  
  // Status
  status: 'assigned' | 'in_progress' | 'completed' | 'expired';
  
  // Timing
  assigned_at: string;
  deadline_at: string;
  completed_at?: string;
  
  created_at: string;
}

// ===================================
// DISPUTE SYSTEM (from combined_089_090.sql)
// ===================================

export interface DisputeRecord {
  id: string;
  market_id: string;
  pipeline_id?: string;
  
  // Dispute Info
  disputed_outcome: string;
  dispute_reason: string;
  evidence?: Record<string, any>;
  
  // Status
  status: DisputeStatus;
  
  // Resolution
  resolution_outcome?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  
  // Timing
  created_at: string;
  updated_at: string;
}

export interface ManualReviewQueue {
  id: string;
  market_id: string;
  pipeline_id?: string;
  
  // Review Info
  ai_outcome?: string;
  ai_confidence?: number;
  ai_explanation?: string;
  
  // Status
  status: ReviewStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Assignment
  assigned_to?: string;
  assigned_at?: string;
  
  // Resolution
  reviewer_decision?: 'accept' | 'modify' | 'escalate';
  final_outcome?: string;
  reviewer_notes?: string;
  reviewed_at?: string;
  
  // Timing
  deadline_at: string;
  created_at: string;
}

export interface DisputeVote {
  id: string;
  dispute_id: string;
  user_id: string;
  
  // Vote
  outcome: string;
  confidence: number;
  reasoning?: string;
  
  created_at: string;
}

// ===================================
// AI TRUST SCORES (from combined_089_090.sql)
// ===================================

export interface AITrustScore {
  id: string;
  source_domain: string;
  
  // Scores
  accuracy_score: number;
  credibility_score: number;
  recency_score: number;
  overall_score: number;
  
  // Statistics
  total_verifications: number;
  correct_predictions: number;
  
  // Metadata
  last_used_at?: string;
  category_scores?: Record<string, number>;
  
  created_at: string;
  updated_at: string;
}

// ===================================
// ADMIN ACTIVITY LOGS (from 091_admin_activity_logs.sql)
// ===================================

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  
  // Action Info
  action: string;
  entity_type: string;
  entity_id?: string;
  
  // Data
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  
  // Context
  ip_address?: string;
  user_agent?: string;
  
  created_at: string;
}

// ===================================
// AI DAILY TOPICS (from 092_ai_daily_topics_system.sql)
// ===================================

export interface AIDailyTopic {
  id: string;
  title: string;
  description?: string;
  category: string;
  
  // AI Generated
  ai_confidence: number;
  source_urls?: string[];
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  
  // Conversion
  converted_market_id?: string;
  converted_at?: string;
  converted_by?: string;
  
  created_at: string;
  scheduled_for?: string;
}

export interface AdminAISettings {
  id: string;
  
  // Generation Settings
  auto_generate: boolean;
  generation_time: string;
  topics_per_day: number;
  
  // Category Weights
  category_weights?: Record<string, number>;
  
  // Confidence Threshold
  min_confidence_threshold: number;
  
  updated_at: string;
  updated_by?: string;
}

// ===================================
// SOCIAL FEATURES (from social.ts)
// ===================================

export interface Comment {
  id: string;
  event_id: string;
  user_id: string;
  parent_id?: string;
  
  content: string;
  
  // Reactions
  likes_count: number;
  dislikes_count: number;
  replies_count: number;
  
  // Status
  is_deleted: boolean;
  is_edited: boolean;
  is_pinned: boolean;
  
  // Moderation
  is_reported: boolean;
  report_count: number;
  
  created_at: string;
  updated_at: string;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  event_id: string;
  
  // Alert Settings
  price_alert_enabled: boolean;
  target_yes_price?: number;
  target_no_price?: number;
  
  // Notes
  personal_notes?: string;
  
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  
  title: string;
  message: string;
  
  // References
  event_id?: string;
  trade_id?: string;
  comment_id?: string;
  
  // Status
  is_read: boolean;
  is_seen: boolean;
  
  created_at: string;
  read_at?: string;
}

// ===================================
// TRADES (Enhanced)
// ===================================

export interface TradeDB {
  id: string;
  event_id: string;
  user_id: string;
  
  // Order Details
  order_type: OrderTypeDB;
  side: OrderSideDB;
  
  // Amount & Price
  shares: number;
  price: number;
  total_cost: number;
  fee: number;
  
  // Limit Order
  limit_price?: number;
  stop_price?: number;
  
  // Execution
  status: OrderStatusDB;
  filled_shares: number;
  average_price?: number;
  
  // Timing
  created_at: string;
  filled_at?: string;
  expires_at?: string;
  cancelled_at?: string;
  
  // Advanced
  slippage_tolerance: number;
  price_impact?: number;
  
  // Metadata
  tx_hash?: string;
  error_message?: string;
}

// ===================================
// POSITIONS (Enhanced)
// ===================================

export interface PositionDB {
  id: string;
  user_id: string;
  event_id: string;
  side: OrderSideDB;
  
  // Shares & Pricing
  total_shares: number;
  average_entry_price: number;
  total_invested: number;
  
  // Current Valuation
  current_value?: number;
  unrealized_pnl?: number;
  realized_pnl: number;
  
  // Performance
  roi?: number;
  
  // Timestamps
  opened_at: string;
  updated_at: string;
  closed_at?: string;
  
  // Status
  is_active: boolean;
}

// ===================================
// DATABASE RESPONSE TYPES
// ===================================

export type DbResult<T> = {
  data: T | null;
  error: Error | null;
};

export type DbListResult<T> = {
  data: T[];
  error: Error | null;
  count: number | null;
};

// ===================================
// REAL-TIME SUBSCRIPTION TYPES
// ===================================

export type RealtimeChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T> {
  eventType: RealtimeChangeType;
  new: T;
  old: T;
  schema: string;
  table: string;
  commit_timestamp: string;
}

// ===================================
// API RESPONSE TYPES
// ===================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===================================
// WORKFLOW API TYPES
// ===================================

export interface WorkflowSchedule {
  id: string;
  name: string;
  description: string;
  cron: string;
  endpoint: string;
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface WorkflowStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  last24Hours: {
    executions: number;
    successRate: number;
  };
}
