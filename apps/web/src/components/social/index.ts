// ===================================
// SOCIAL FEATURES - EXPORTS
// ===================================

// Components
export { CommentThread } from './CommentThread';
export { ActivityFeed } from './ActivityFeed';
export { FollowButton, FollowStats } from './FollowButton';

// Types (re-export from types/social for convenience)
export type {
  // Comments
  Comment,
  CommentAttachment,
  CommentVote,
  CommentFlag,
  SentimentType,
  VoteType,
  FlagReason,
  
  // Reputation
  UserReputation,
  ExpertBadge,
  UserBadge,
  AccuracyTier,
  BadgeCategory,
  BadgeRarity,
  UserFollow,
  
  // Activity Feed
  Activity,
  ActivityAggregation,
  FeedPreferences,
  ContentType,
  PriorityLevel,
  MarketMovementActivity,
  TraderActivity,
  SocialInteractionActivity,
  SystemNotificationActivity,
  TrendingMarketActivity,
  
  // API
  GetCommentsResponse,
  GetFeedResponse,
  PostCommentRequest,
  UpdateFeedPreferencesRequest,
  
  // Real-time
  RealtimeCommentEvent,
  RealtimeActivityEvent
} from '@/types/social';

// Services (for server components)
export { CommentsService, commentsService } from '@/lib/social/comments-service';
export { FeedService, feedService } from '@/lib/social/feed-service';
export { ReputationService, reputationService } from '@/lib/social/reputation-service';
