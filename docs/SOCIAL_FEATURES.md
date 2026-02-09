# Plokymarket - Advanced Social Features

This document provides a comprehensive overview of the production-ready social features implemented in Plokymarket.

## Table of Contents

1. [Comments with Threading](#1-comments-with-threading)
2. [Activity Feed](#2-activity-feed)
3. [Reputation System](#3-reputation-system)
4. [Expert Badges](#4-expert-badges)
5. [Moderation System](#5-moderation-system)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)

---

## 1. Comments with Threading

### Features

#### Unlimited Depth Threading
- **Implementation**: Nested comments with `parent_id` and `depth_level` tracking
- **Auto-collapse**: Threads automatically collapse at depth >= 3 for readability
- **Visual indicators**: Indentation and connecting lines show thread hierarchy
- **Expand/Collapse**: Users can expand collapsed threads with one click

#### Rich Text Support
- **Markdown**: Bold (`**text**`), Italic (`*text*`), Code (`` `code` ``), Blockquotes (`> quote`)
- **Auto-link preview**: URLs automatically converted to clickable links
- **Image embedding**: Direct image URLs render as embedded images
- **Mentions**: `@username` syntax for mentioning users
- **Character limit**: 2000 characters per comment

#### Real-time Updates
- **WebSocket integration**: Live comment updates via Supabase Realtime
- **100ms batching**: Updates are batched to reduce network overhead
- **Visual indicators**: New comments highlighted with animation
- **Optimistic UI**: Immediate feedback while syncing with server

#### Voting System
- **Weighted voting**: Vote weight based on user reputation tier
  - Oracle (8000+ rep): 3x weight
  - Master (6000+ rep): 2.5x weight
  - Expert (4000+ rep): 2x weight
  - Analyst (2000+ rep): 1.5x weight
  - Apprentice (500+ rep): 1.2x weight
  - Novice: 1x weight

- **Wilson score algorithm**: Comment ranking uses Wilson score for statistical confidence
- **Vote visibility**: Users can see their vote state on each comment

#### Quality Surfacing
- **Accuracy-based visibility**: Comments from users with >60% prediction accuracy get enhanced visibility
- **Score calculation**: `(upvotes - downvotes) × reputation_multiplier`
- **Sorting options**: Newest, Top (by score), Controversial (high engagement, balanced votes)

### Rate Limiting
- **10 posts per minute**: Prevents spam
- **User-specific tracking**: Rate limits applied per user
- **Clear feedback**: Users see remaining wait time

### Usage

```tsx
import { CommentThread } from '@/components/social';

// In your market detail page
<CommentThread 
  marketId="market-uuid"
  marketQuestion="Will Bitcoin exceed $100K?"
  maxDepth={10}
  defaultCollapsedDepth={3}
  enableRealtime={true}
/>
```

---

## 2. Activity Feed

### Personalized Aggregation

The activity feed uses an algorithmic approach to surface relevant content:

#### Content Types & Weights

| Content Type | Default Weight | Update Frequency | Description |
|--------------|----------------|------------------|-------------|
| Market Movements | 90 (High) | Real-time | Price changes in followed markets |
| Trader Activity | 60 (Medium) | Hourly batch | Actions from followed users |
| System Notifications | 100 (High) | Immediate | Resolutions, deposits, withdrawals |
| Social Interactions | 50 (Medium) | Batched | Replies, mentions, follows |
| Trending Markets | 30 (Low) | Daily digest | Platform-wide trending content |

#### Personalization Factors

1. **Followed Users Boost**: 1.5x weight for activities from followed users
2. **Followed Markets Boost**: 1.3x weight for followed market activities
3. **Time Decay**: Score decreases over 48 hours (minimum 30%)
4. **Unread Boost**: 1.2x weight for unread items
5. **Highlighted Content**: 1.4x weight for admin-highlighted items

#### Batching System

Similar activities are automatically aggregated:
- **Daily Summary**: Combined view of daily activities
- **Market Updates**: Grouped market movement notifications
- **Social Digest**: Combined social interactions

### User Controls

#### Feed Composition Sliders
Users can adjust content priorities (0-100):
- Market Movements weight
- Trader Activity weight
- System Notifications weight
- Social Interactions weight
- Trending Markets weight

#### Mute Options
- **Muted Keywords**: Hide activities containing specific words
- **Muted Users**: Hide all activities from specific users
- **Muted Markets**: Hide activities from specific markets

#### Notification Controls
- **Pause Notifications**: Temporary pause with duration selection
- **Compact Mode**: Reduced UI for dense information display
- **Auto-expand Threads**: Automatically expand comment threads

### Infinite Scroll & Virtualization

- **Virtualized rendering**: Only visible items rendered for performance
- **Windowing**: 5-item overscan for smooth scrolling
- **Estimated heights**: 100px average for accurate scrollbar
- **Dynamic loading**: Auto-load more when approaching end

### Usage

```tsx
import { ActivityFeed } from '@/components/social';

// In your activity page
<ActivityFeed 
  enableInfiniteScroll={true}
  batchSize={20}
/>
```

---

## 3. Reputation System

### Calculation Metrics

#### Prediction Accuracy (40% weight)
```
accuracy = (correct_predictions / total_predictions) × 100
```

#### Volume Score (25% weight)
```
volume_score = min(2500, (total_predictions / 500) × 2500)
```

#### Consistency Score (20% weight)
```
consistency_score = min(2000, (best_streak / 20) × 2000)
```

#### Social Score (15% weight)
- Comment upvotes: +5 points each
- Helpful comments: +20 points each
- Valid reports: +50 points each

### Accuracy Tiers

| Tier | Accuracy | Min Predictions | Reputation Score |
|------|----------|-----------------|------------------|
| Oracle | ≥80% | 100 | 8000+ |
| Master | ≥70% | 50 | 6000+ |
| Expert | ≥65% | 25 | 4000+ |
| Analyst | ≥60% | 10 | 2000+ |
| Apprentice | ≥55% | 5 | 500+ |
| Novice | <55% | <5 | 0-499 |

### Reputation Display

- **Tier Badge**: Color-coded badge showing current tier
- **Tooltip Details**: Hover shows accuracy, predictions, streaks
- **Leaderboard Integration**: Reputation shown on leaderboards

---

## 4. Expert Badges

### Badge Categories

1. **Accuracy Badges**: For prediction accuracy achievements
2. **Volume Badges**: For trading volume milestones
3. **Streak Badges**: For consecutive correct predictions
4. **Community Badges**: For social contributions
5. **Special Badges**: Limited-time or event-based
6. **Expert Badges**: Verified domain expertise

### Rarity Levels

| Rarity | Color | Description |
|--------|-------|-------------|
| Common | Gray | Easy to obtain |
| Uncommon | Green | Moderate effort |
| Rare | Blue | Significant achievement |
| Epic | Purple | Exceptional performance |
| Legendary | Gold | Extremely rare |

### Verification Process

1. **Automatic**: Most badges awarded automatically based on metrics
2. **Expert Verification**: Domain expert badges require manual verification
3. **Proof Submission**: Users can submit credentials for verification
4. **Admin Review**: Manual review queue for expert badges

### Badge Display

- **Profile Display**: Up to 5 badges shown on user profiles
- **Comment Indicators**: Badges shown next to username in comments
- **Hover Details**: Full badge information on hover

---

## 5. Moderation System

### AI Toxicity Detection

#### Detection Categories
- **Toxicity**: Hate speech, harassment, personal attacks
- **Spam**: Promotional content, repetitive posting
- **Misinformation**: False claims without evidence
- **Off-topic**: Content not related to market discussion

#### Auto-Actions
- **Auto-flag**: Content with >70% toxicity or >80% spam score
- **Queue for Review**: Flagged content enters moderation queue
- **Rate Limiting**: Reduced posting for flagged users
- **Auto-hide**: Comments hidden after 3+ user flags

### Community Flagging

- **Flag Reasons**: Spam, Harassment, Hate Speech, Misinformation, Off-topic, Trolling, Other
- **One flag per user**: Cannot flag same comment multiple times
- **Flag threshold**: 3+ flags trigger auto-hide
- **Resolution tracking**: All flags tracked with resolution notes

### Strike System

| Strikes | Action | Duration |
|---------|--------|----------|
| 1 | Warning | - |
| 2 | Comment Ban | 24 hours |
| 3 | Comment Ban | 7 days |
| 4 | Trade Restriction | 30 days |
| 5+ | Account Review | Permanent |

### Appeal Process

1. User submits appeal with explanation
2. Admin reviews original content and context
3. Decision rendered within 48 hours
4. Appeal count tracked per user

---

## 6. API Reference

### Comments API

#### GET /api/comments
```
Query Parameters:
- marketId (required): UUID of market
- sortBy: 'newest' | 'top' | 'controversial'
- limit: number (default: 50)
- offset: number (default: 0)

Response:
{
  comments: Comment[]
  total_count: number
  has_more: boolean
  user_reputation: UserReputation
}
```

#### POST /api/comments
```
Body:
{
  marketId: string
  content: string
  parentId?: string
  marketQuestion?: string
}

Response:
{
  data: Comment
}
```

#### POST /api/comments/vote
```
Body:
{
  commentId: string
  voteType: 'upvote' | 'downvote' | 'none'
}

Response:
{
  data: {
    success: boolean
    newScore: number
  }
}
```

#### POST /api/comments/flag
```
Body:
{
  commentId: string
  reason: string
  details?: string
}
```

### Feed API

#### GET /api/feed
```
Query Parameters:
- cursor?: string (pagination)
- limit?: number (default: 50)
- type?: ContentType (filter)

Response:
{
  activities: Activity[]
  aggregations: ActivityAggregation[]
  preferences: FeedPreferences
  unread_count: number
  has_more: boolean
  next_cursor?: string
}
```

#### PATCH /api/feed/preferences
```
Body: Partial<FeedPreferences>
```

#### POST /api/feed/read
```
Body:
{
  activityIds?: string[] // If empty, marks all as read
}
```

---

## 7. Database Schema

### Key Tables

#### market_comments
- `id`: UUID PRIMARY KEY
- `market_id`: UUID REFERENCES markets
- `user_id`: UUID REFERENCES users
- `parent_id`: UUID (self-reference for threading)
- `content`: TEXT
- `content_html`: TEXT (rendered markdown)
- `depth_level`: INTEGER
- `is_collapsed`: BOOLEAN
- `upvotes`: INTEGER
- `downvotes`: INTEGER
- `score`: INTEGER (weighted)
- `sentiment`: sentiment_type
- `is_flagged`: BOOLEAN
- `flag_count`: INTEGER
- `is_deleted`: BOOLEAN
- `edited_at`: TIMESTAMP
- `created_at`: TIMESTAMP

#### user_reputation
- `user_id`: UUID PRIMARY KEY
- `prediction_accuracy`: NUMERIC(5,2)
- `total_predictions`: INTEGER
- `correct_predictions`: INTEGER
- `reputation_score`: INTEGER (0-10000)
- `accuracy_tier`: accuracy_tier
- `volume_score`: INTEGER
- `consistency_score`: INTEGER
- `social_score`: INTEGER
- `current_streak`: INTEGER
- `best_streak`: INTEGER
- `rank_percentile`: INTEGER

#### expert_badges
- `id`: UUID PRIMARY KEY
- `name`: TEXT
- `description`: TEXT
- `icon`: TEXT
- `category`: badge_category
- `rarity`: badge_rarity
- `requirements`: JSONB
- `is_verified`: BOOLEAN

#### feed_preferences
- `user_id`: UUID PRIMARY KEY
- `market_movements_weight`: INTEGER (0-100)
- `trader_activity_weight`: INTEGER (0-100)
- `system_notifications_weight`: INTEGER (0-100)
- `social_interactions_weight`: INTEGER (0-100)
- `trending_markets_weight`: INTEGER (0-100)
- `muted_keywords`: TEXT[]
- `muted_users`: UUID[]
- `muted_markets`: UUID[]
- `notifications_paused`: BOOLEAN
- `compact_mode`: BOOLEAN
- `auto_expand_threads`: BOOLEAN

---

## Implementation Notes

### Performance Optimizations

1. **Database Indexes**: 
   - `market_comments(market_id, is_deleted, created_at)`
   - `comment_votes(comment_id, user_id)`
   - `activities(user_id, created_at)`

2. **Caching**:
   - User reputation cached for 5 minutes
   - Feed preferences cached per session
   - Comment threads cached with stale-while-revalidate

3. **Batch Operations**:
   - Vote updates batched in 100ms windows
   - Activity logging fire-and-forget
   - Reputation calculations deferred

### Security Considerations

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Rate Limiting**: 10 posts/minute enforced at API level
3. **Content Sanitization**: HTML escaped before storage
4. **XSS Prevention**: DOMPurify-style sanitization on client

### Future Enhancements

1. **Real-time Notifications**: WebSocket push for mentions/replies
2. **Mobile Optimizations**: Touch-friendly interactions
3. **Search**: Full-text search across comments
4. **Analytics**: Dashboard for moderators
5. **Machine Learning**: Better toxicity detection with custom models
