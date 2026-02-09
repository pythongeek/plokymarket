import { createClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Activity,
  ActivityAggregation,
  FeedPreferences,
  GetFeedResponse,
  UpdateFeedPreferencesRequest,
  ContentType,
  PriorityLevel,
  MarketMovementActivity,
  TraderActivity,
  SocialInteractionActivity,
  SystemNotificationActivity,
  TrendingMarketActivity
} from '@/types/social';

// ===================================
// ALGORITHMIC WEIGHTING ENGINE
// ===================================

interface WeightConfig {
  market_movements: number;
  trader_activity: number;
  system_notifications: number;
  social_interactions: number;
  trending_markets: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  market_movements: 90,      // High - real-time
  trader_activity: 60,       // Medium - batched hourly
  system_notifications: 100, // High - immediate
  social_interactions: 50,   // Medium - batched
  trending_markets: 30       // Low - daily digest
};

interface ScoredActivity extends Activity {
  calculated_score: number;
  relevance_factors: string[];
}

class FeedAlgorithmEngine {
  private userPreferences: FeedPreferences;
  private followedUsers: Set<string>;
  private followedMarkets: Set<string>;
  private mutedKeywords: Set<string>;
  private mutedUsers: Set<string>;
  private mutedMarkets: Set<string>;

  constructor(
    preferences: FeedPreferences,
    followedUsers: string[] = [],
    followedMarkets: string[] = []
  ) {
    this.userPreferences = preferences;
    this.followedUsers = new Set(followedUsers);
    this.followedMarkets = new Set(followedMarkets);
    this.mutedKeywords = new Set(preferences.muted_keywords.map(k => k.toLowerCase()));
    this.mutedUsers = new Set(preferences.muted_users);
    this.mutedMarkets = new Set(preferences.muted_markets);
  }

  calculateScore(activity: Activity): ScoredActivity {
    let score = activity.algorithmic_weight;
    const factors: string[] = [];

    // Apply user preference weight
    score *= this.getContentTypeWeight(activity.type) / 100;

    // Boost followed users' activities
    const activityUserId = this.extractUserId(activity);
    if (activityUserId && this.followedUsers.has(activityUserId)) {
      score *= 1.5;
      factors.push('followed_user');
    }

    // Boost followed markets
    const activityMarketId = this.extractMarketId(activity);
    if (activityMarketId && this.followedMarkets.has(activityMarketId)) {
      score *= 1.3;
      factors.push('followed_market');
    }

    // Time decay - older activities get lower scores
    const ageHours = (Date.now() - new Date(activity.created_at).getTime()) / (1000 * 60 * 60);
    const timeDecay = Math.max(0.3, 1 - (ageHours / 48)); // Decay over 48 hours
    score *= timeDecay;
    if (timeDecay < 0.7) factors.push('older_content');

    // Boost unread items
    if (!activity.is_read) {
      score *= 1.2;
      factors.push('unread');
    }

    // Apply mute filters
    if (this.isMuted(activity)) {
      score = 0;
      factors.push('muted');
    }

    // Quality indicators
    if (activity.is_highlighted) {
      score *= 1.4;
      factors.push('highlighted');
    }

    return {
      ...activity,
      calculated_score: Math.round(score),
      relevance_factors: factors
    };
  }

  private getContentTypeWeight(type: ContentType): number {
    const weights: Record<ContentType, number> = {
      'market_movement': this.userPreferences.market_movements_weight,
      'trader_activity': this.userPreferences.trader_activity_weight,
      'system_notification': this.userPreferences.system_notifications_weight,
      'social_interaction': this.userPreferences.social_interactions_weight,
      'trending_market': this.userPreferences.trending_markets_weight,
      'comment_reply': this.userPreferences.social_interactions_weight,
      'mention': this.userPreferences.social_interactions_weight * 1.2,
      'follow': this.userPreferences.social_interactions_weight,
      'badge_earned': 70,
      'market_resolve': 100
    };
    return weights[type] || 50;
  }

  private extractUserId(activity: Activity): string | null {
    const data = activity.data as any;
    return data?.traderId || data?.sourceUserId || activity.user_id;
  }

  private extractMarketId(activity: Activity): string | null {
    const data = activity.data as any;
    return data?.marketId;
  }

  private isMuted(activity: Activity): boolean {
    const data = activity.data as any;
    
    // Check muted users
    const userId = this.extractUserId(activity);
    if (userId && this.mutedUsers.has(userId)) return true;

    // Check muted markets
    const marketId = this.extractMarketId(activity);
    if (marketId && this.mutedMarkets.has(marketId)) return true;

    // Check muted keywords in content
    const content = JSON.stringify(data).toLowerCase();
    for (const keyword of this.mutedKeywords) {
      if (content.includes(keyword)) return true;
    }

    return false;
  }
}

// ===================================
// BATCHING & AGGREGATION ENGINE
// ===================================

class AggregationEngine {
  /**
   * Batch similar activities together for cleaner feed display
   */
  aggregateActivities(activities: ScoredActivity[]): (ScoredActivity | ActivityAggregation)[] {
    const groups = new Map<string, ScoredActivity[]>();
    const singles: ScoredActivity[] = [];

    // Group activities by type and related entity
    for (const activity of activities) {
      if (this.shouldAggregate(activity)) {
        const key = this.getAggregationKey(activity);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(activity);
      } else {
        singles.push(activity);
      }
    }

    const result: (ScoredActivity | ActivityAggregation)[] = [...singles];

    // Create aggregations for groups with multiple items
    for (const [key, group] of groups) {
      if (group.length >= 3) {
        result.push(this.createAggregation(group, key));
      } else {
        result.push(...group);
      }
    }

    // Sort by calculated score
    return result.sort((a, b) => {
      const scoreA = 'calculated_score' in a ? a.calculated_score : 0;
      const scoreB = 'calculated_score' in b ? b.calculated_score : 0;
      return scoreB - scoreA;
    });
  }

  private shouldAggregate(activity: ScoredActivity): boolean {
    // Only aggregate certain types
    return ['trader_activity', 'social_interaction', 'market_movement'].includes(activity.type);
  }

  private getAggregationKey(activity: ScoredActivity): string {
    const data = activity.data as any;
    
    if (activity.type === 'market_movement') {
      return `market:${data?.marketId}:movement`;
    }
    
    if (activity.type === 'trader_activity') {
      return `trader:${data?.traderId}:activity`;
    }
    
    if (activity.type === 'social_interaction') {
      return `social:${activity.user_id}:${data?.interactionType}`;
    }

    return `${activity.type}:${activity.user_id}`;
  }

  private createAggregation(group: ScoredActivity[], key: string): ActivityAggregation {
    const first = group[0];
    const type = first.type;
    
    // Determine aggregation type
    let aggType: ActivityAggregation['aggregation_type'] = 'daily';
    if (type === 'market_movement') aggType = 'market_update';
    if (type === 'social_interaction') aggType = 'social_digest';

    return {
      id: `agg:${key}:${Date.now()}`,
      user_id: first.user_id,
      aggregation_type: aggType,
      date_bucket: new Date().toISOString().split('T')[0],
      activities: group,
      summary: {
        total_activities: group.length,
        by_type: group.reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        }, {} as Record<ContentType, number>),
        highlights: this.generateHighlights(group)
      },
      is_read: group.every(a => a.is_read),
      created_at: first.created_at
    };
  }

  private generateHighlights(group: ScoredActivity[]): string[] {
    const highlights: string[] = [];
    const type = group[0].type;
    const data = group[0].data as any;

    if (type === 'market_movement' && data?.marketQuestion) {
      highlights.push(`${data.marketQuestion} has significant activity`);
    }

    if (type === 'trader_activity') {
      highlights.push(`${group.length} trading activities from followed users`);
    }

    if (type === 'social_interaction') {
      highlights.push(`${group.length} social interactions`);
    }

    return highlights;
  }
}

// ===================================
// MAIN FEED SERVICE
// ===================================

export class FeedService {
  private aggregationEngine: AggregationEngine;

  constructor() {
    this.aggregationEngine = new AggregationEngine();
  }

  // ===================================
  // FEED RETRIEVAL
  // ===================================

  async getPersonalizedFeed(
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      includeAggregated?: boolean;
      filterTypes?: ContentType[];
    } = {}
  ): Promise<GetFeedResponse> {
    const supabase = await createClient();
    const { 
      limit = 50, 
      cursor,
      includeAggregated = true,
      filterTypes 
    } = options;

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError);
    }

    const userPrefs = preferences || this.getDefaultPreferences(userId);

    // Get followed users and markets for personalization
    const [{ data: follows }, { data: marketFollows }] = await Promise.all([
      supabase.from('user_follows').select('following_id').eq('follower_id', userId),
      supabase.from('market_follows').select('market_id').eq('user_id', userId)
    ]);

    const followedUsers = follows?.map(f => f.following_id) || [];
    const followedMarkets = marketFollows?.map(m => m.market_id) || [];

    // Build query for activities
    let query = supabase
      .from('activities')
      .select(`
        *,
        users (
          full_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    // Apply cursor pagination
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Apply type filter
    if (filterTypes?.length) {
      query = query.in('type', filterTypes);
    }

    // Get more than limit for scoring/aggregation
    query = query.limit(limit * 2);

    const { data: rawActivities, error } = await query;
    if (error) throw error;

    // Score and rank activities
    const algorithm = new FeedAlgorithmEngine(
      userPrefs,
      followedUsers,
      followedMarkets
    );

    const scoredActivities = (rawActivities || [])
      .map(a => algorithm.calculateScore(a as Activity))
      .filter(a => a.calculated_score > 0)
      .sort((a, b) => b.calculated_score - a.calculated_score)
      .slice(0, limit);

    // Aggregate if enabled
    let finalFeed: (Activity | ActivityAggregation)[] = scoredActivities;
    if (includeAggregated) {
      finalFeed = this.aggregationEngine.aggregateActivities(scoredActivities);
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    // Get next cursor
    const nextCursor = scoredActivities.length >= limit 
      ? scoredActivities[scoredActivities.length - 1]?.created_at
      : undefined;

    return {
      activities: finalFeed.filter(a => !('aggregation_type' in a)) as Activity[],
      aggregations: finalFeed.filter(a => 'aggregation_type' in a) as ActivityAggregation[],
      preferences: userPrefs,
      unread_count: unreadCount || 0,
      has_more: !!nextCursor,
      next_cursor: nextCursor
    };
  }

  async getGlobalFeed(
    options: {
      limit?: number;
      cursor?: string;
      filterTypes?: ContentType[];
    } = {}
  ): Promise<Pick<GetFeedResponse, 'activities' | 'has_more' | 'next_cursor'>> {
    const supabase = await createClient();
    const { limit = 50, cursor, filterTypes } = options;

    let query = supabase
      .from('activities')
      .select(`
        *,
        users (
          full_name,
          username,
          avatar_url
        )
      `)
      .order('priority_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (cursor) {
      query = query.or(`priority_score.lt.${cursor},and(priority_score.eq.${cursor},created_at.lt.${cursor})`);
    }

    if (filterTypes?.length) {
      query = query.in('type', filterTypes);
    }

    const { data: activities, error } = await query.limit(limit);
    if (error) throw error;

    const nextCursor = activities?.length >= limit
      ? activities[activities.length - 1]?.priority_score
      : undefined;

    return {
      activities: (activities || []) as Activity[],
      has_more: !!nextCursor,
      next_cursor: nextCursor
    };
  }

  // ===================================
  // PREFERENCES MANAGEMENT
  // ===================================

  async getPreferences(userId: string): Promise<FeedPreferences> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || this.getDefaultPreferences(userId);
  }

  async updatePreferences(
    userId: string,
    updates: UpdateFeedPreferencesRequest
  ): Promise<FeedPreferences> {
    const supabase = await createClient();

    // Merge with existing or create new
    const { data: existing } = await supabase
      .from('feed_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const prefs: FeedPreferences = {
      ...this.getDefaultPreferences(userId),
      ...(existing || {}),
      ...updates,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('feed_preferences')
      .upsert(prefs)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===================================
  // ACTIVITY MANAGEMENT
  // ===================================

  async markAsRead(userId: string, activityIds?: string[]): Promise<void> {
    const supabase = await createClient();

    let query = supabase
      .from('activities')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (activityIds?.length) {
      query = query.in('id', activityIds);
    }

    await query;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('activities')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  }

  async pauseNotifications(userId: string, durationMinutes?: number): Promise<void> {
    const supabase = await createClient();

    const pauseUntil = durationMinutes
      ? new Date(Date.now() + durationMinutes * 60000).toISOString()
      : null;

    await supabase
      .from('feed_preferences')
      .upsert({
        user_id: userId,
        notifications_paused: !!durationMinutes,
        notifications_pause_until: pauseUntil,
        updated_at: new Date().toISOString()
      });
  }

  // ===================================
  // REAL-TIME SUBSCRIPTION
  // ===================================

  subscribeToFeed(
    userId: string,
    onUpdate: (payload: any) => void
  ) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    return supabase
      .channel(`user-feed:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onUpdate({ type: 'new_activity', payload });
        }
      )
      .subscribe();
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  private getDefaultPreferences(userId: string): FeedPreferences {
    return {
      user_id: userId,
      market_movements_weight: DEFAULT_WEIGHTS.market_movements,
      trader_activity_weight: DEFAULT_WEIGHTS.trader_activity,
      system_notifications_weight: DEFAULT_WEIGHTS.system_notifications,
      social_interactions_weight: DEFAULT_WEIGHTS.social_interactions,
      trending_markets_weight: DEFAULT_WEIGHTS.trending_markets,
      muted_keywords: [],
      muted_users: [],
      muted_markets: [],
      notifications_paused: false,
      email_notifications: true,
      push_notifications: true,
      compact_mode: false,
      auto_expand_threads: false,
      default_thread_depth: 3,
      updated_at: new Date().toISOString()
    };
  }
}

export const feedService = new FeedService();
