// ===================================
// ADVANCED SOCIAL FEATURES TYPES
// ===================================

// ===================================
// COMMENTS & THREADING
// ===================================

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';
export type VoteType = 'upvote' | 'downvote' | 'none';
export type FlagReason = 
  | 'spam' 
  | 'harassment' 
  | 'hate_speech' 
  | 'misinformation' 
  | 'off_topic' 
  | 'trolling' 
  | 'other';

export interface Comment {
  id: string;
  market_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  content_html?: string; // Rendered markdown
  depth_level: number;
  is_collapsed: boolean;
  upvotes: number;
  downvotes: number;
  score: number; // Weighted by reputation
  sentiment: SentimentType;
  sentiment_score?: number; // -1 to 1
  is_flagged: boolean;
  flag_count: number;
  is_deleted: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  user?: CommentUser;
  replies?: Comment[];
  attachments?: CommentAttachment[];
  user_vote?: VoteType;
  
  // Real-time fields
  is_live?: boolean;
  is_new?: boolean;
}

export interface CommentUser {
  id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  reputation?: UserReputation;
  badges?: UserBadge[];
  is_followed?: boolean;
  is_expert?: boolean;
}

export interface CommentAttachment {
  id: string;
  comment_id: string;
  type: 'image' | 'link' | 'gif' | 'file';
  url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    mime_type?: string;
  };
  created_at: string;
}

export interface CommentVote {
  id: string;
  comment_id: string;
  user_id: string;
  vote_type: VoteType;
  user_reputation_at_vote: number;
  created_at: string;
}

export interface CommentFlag {
  id: string;
  comment_id: string;
  user_id: string;
  reason: FlagReason;
  details?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

// ===================================
// REPUTATION & EXPERT BADGES
// ===================================

export type AccuracyTier = 'novice' | 'apprentice' | 'analyst' | 'expert' | 'master' | 'oracle';
export type BadgeCategory = 'accuracy' | 'volume' | 'streak' | 'community' | 'special' | 'expert';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface UserReputation {
  user_id: string;
  prediction_accuracy: number; // 0-100
  total_predictions: number;
  correct_predictions: number;
  reputation_score: number; // 0-10000
  accuracy_tier: AccuracyTier;
  volume_score: number;
  consistency_score: number;
  social_score: number; // From upvotes, helpful comments
  current_streak: number;
  best_streak: number;
  rank_percentile: number;
  updated_at: string;
}

export interface ExpertBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirements: {
    min_accuracy?: number;
    min_predictions?: number;
    min_streak?: number;
    min_reputation?: number;
    special_condition?: string;
  };
  is_verified: boolean;
  verification_process?: string;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_by?: string;
  is_displayed: boolean;
  display_order: number;
  verification_proof?: string;
  
  // Joined
  badge?: ExpertBadge;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  notify_on_trade: boolean;
  notify_on_comment: boolean;
  notify_on_market: boolean;
  
  // Joined
  following?: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
    reputation?: UserReputation;
  };
}

// ===================================
// ACTIVITY FEED
// ===================================

export type ContentType = 
  | 'market_movement'
  | 'trader_activity'
  | 'system_notification'
  | 'social_interaction'
  | 'trending_market'
  | 'comment_reply'
  | 'mention'
  | 'follow'
  | 'badge_earned'
  | 'market_resolve';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Activity {
  id: string;
  user_id: string;
  type: ContentType;
  data: ActivityData;
  algorithmic_weight: number; // 0-100
  priority_score: number;
  is_read: boolean;
  is_highlighted: boolean;
  created_at: string;
  
  // Joined
  user?: {
    full_name: string;
    username?: string;
    avatar_url?: string;
  };
}

export type ActivityData = 
  | MarketMovementActivity
  | TraderActivity
  | SocialInteractionActivity
  | SystemNotificationActivity
  | TrendingMarketActivity;

export interface MarketMovementActivity {
  marketId: string;
  marketQuestion: string;
  priceChange: number;
  volumeChange: number;
  oldPrice: number;
  newPrice: number;
}

export interface TraderActivity {
  traderId: string;
  traderName: string;
  action: 'bought' | 'sold' | 'commented' | 'created_market';
  marketId?: string;
  marketQuestion?: string;
  amount?: number;
  position?: 'YES' | 'NO';
}

export interface SocialInteractionActivity {
  interactionType: 'reply' | 'mention' | 'follow' | 'upvote';
  sourceUserId: string;
  sourceUserName: string;
  targetId: string;
  targetType: 'comment' | 'market' | 'user';
  content?: string;
}

export interface SystemNotificationActivity {
  notificationType: 'resolution' | 'deposit' | 'withdrawal' | 'price_alert' | 'market_close';
  marketId?: string;
  marketQuestion?: string;
  amount?: number;
  outcome?: 'YES' | 'NO';
  message: string;
}

export interface TrendingMarketActivity {
  marketId: string;
  marketQuestion: string;
  trendReason: 'volume_spike' | 'volatility' | 'social_buzz' | 'news_event';
  volume24h: number;
  priceMovement: number;
}

export interface FeedPreferences {
  user_id: string;
  
  // Content type weights (0-100)
  market_movements_weight: number;
  trader_activity_weight: number;
  system_notifications_weight: number;
  social_interactions_weight: number;
  trending_markets_weight: number;
  
  // Mutes
  muted_keywords: string[];
  muted_users: string[];
  muted_markets: string[];
  
  // Notifications
  notifications_paused: boolean;
  notifications_pause_until?: string;
  email_notifications: boolean;
  push_notifications: boolean;
  
  // Display
  compact_mode: boolean;
  auto_expand_threads: boolean;
  default_thread_depth: number;
  
  updated_at: string;
}

export interface ActivityAggregation {
  id: string;
  user_id: string;
  aggregation_type: 'daily' | 'market_update' | 'social_digest';
  date_bucket: string;
  activities: Activity[];
  summary: {
    total_activities: number;
    by_type: Record<ContentType, number>;
    highlights: string[];
  };
  is_read: boolean;
  created_at: string;
}

// ===================================
// MODERATION
// ===================================

export type ModerationStatus = 'clean' | 'pending_review' | 'flagged' | 'removed' | 'appealed';

export interface CommentModerationQueue {
  id: string;
  comment_id: string;
  user_id: string;
  toxicity_score: number;
  spam_score: number;
  sentiment_mismatch: boolean;
  flagged_categories: string[];
  ai_confidence: number;
  ai_reasoning?: string;
  status: ModerationStatus;
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface UserModerationStatus {
  user_id: string;
  total_strikes: number;
  active_strikes: number;
  last_strike_at?: string;
  is_comment_banned: boolean;
  comment_ban_until?: string;
  is_trade_restricted: boolean;
  trade_restriction_until?: string;
  restriction_reason?: string;
  appeal_count: number;
  last_appeal_at?: string;
  created_at: string;
  updated_at: string;
}

// ===================================
// REAL-TIME WEBSOCKET TYPES
// ===================================

export interface RealtimeCommentEvent {
  type: 'new_comment' | 'updated_comment' | 'deleted_comment' | 'new_reply' | 'vote_update';
  comment: Comment;
  parent_id?: string;
  market_id: string;
  timestamp: string;
}

export interface RealtimeActivityEvent {
  type: 'new_activity' | 'activity_read' | 'batch_update';
  activity?: Activity;
  activities?: Activity[];
  unread_count?: number;
  timestamp: string;
}

export interface BatchUpdatePayload {
  comments?: RealtimeCommentEvent[];
  activities?: RealtimeActivityEvent[];
  batch_timestamp: string;
}

// ===================================
// API REQUEST/RESPONSE TYPES
// ===================================

export interface PostCommentRequest {
  marketId: string;
  content: string;
  parentId?: string;
  attachments?: Omit<CommentAttachment, 'id' | 'comment_id' | 'created_at'>[];
}

export interface VoteCommentRequest {
  commentId: string;
  voteType: VoteType;
}

export interface FlagCommentRequest {
  commentId: string;
  reason: FlagReason;
  details?: string;
}

export interface GetCommentsResponse {
  comments: Comment[];
  total_count: number;
  has_more: boolean;
  user_reputation?: UserReputation;
}

export interface GetFeedResponse {
  activities: Activity[];
  aggregations?: ActivityAggregation[];
  preferences: FeedPreferences;
  unread_count: number;
  has_more: boolean;
  next_cursor?: string;
}

export interface UpdateFeedPreferencesRequest {
  market_movements_weight?: number;
  trader_activity_weight?: number;
  system_notifications_weight?: number;
  social_interactions_weight?: number;
  trending_markets_weight?: number;
  muted_keywords?: string[];
  muted_users?: string[];
  muted_markets?: string[];
  notifications_paused?: boolean;
  notifications_pause_until?: string;
  compact_mode?: boolean;
  auto_expand_threads?: boolean;
  default_thread_depth?: number;
}

// ===================================
// UI COMPONENT PROPS
// ===================================

export interface CommentThreadProps {
  marketId: string;
  marketQuestion: string;
  initialComments?: Comment[];
  maxDepth?: number;
  defaultCollapsedDepth?: number;
  enableRealtime?: boolean;
  className?: string;
}

export interface CommentComposerProps {
  marketId: string;
  parentId?: string;
  placeholder?: string;
  onSubmit: (content: string, attachments?: CommentAttachment[]) => Promise<void>;
  onCancel?: () => void;
  isReply?: boolean;
  maxLength?: number;
}

export interface ActivityFeedProps {
  userId?: string;
  filterTypes?: ContentType[];
  enableInfiniteScroll?: boolean;
  batchSize?: number;
  className?: string;
}

export interface FeedControlsProps {
  preferences: FeedPreferences;
  onUpdatePreferences: (prefs: Partial<FeedPreferences>) => Promise<void>;
  unreadCount: number;
  onMarkAllRead: () => Promise<void>;
  onPauseNotifications: (duration?: number) => Promise<void>;
}

export interface ReputationBadgeProps {
  reputation: UserReputation;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ExpertBadgeDisplayProps {
  badges: UserBadge[];
  maxDisplayed?: number;
  showRarity?: boolean;
}
