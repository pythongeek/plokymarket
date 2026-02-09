import { createClient } from '@/lib/supabase/server';
import { 
  UserReputation, 
  ExpertBadge, 
  UserBadge, 
  AccuracyTier,
  BadgeCategory,
  BadgeRarity 
} from '@/types/social';

// ===================================
// REPUTATION CALCULATION ENGINE
// ===================================

interface ReputationMetrics {
  accuracy: number;
  volume: number;
  consistency: number;
  social: number;
}

class ReputationCalculator {
  /**
   * Calculate accuracy tier based on prediction accuracy
   */
  static getAccuracyTier(accuracy: number, totalPredictions: number): AccuracyTier {
    if (accuracy >= 80 && totalPredictions >= 100) return 'oracle';
    if (accuracy >= 70 && totalPredictions >= 50) return 'master';
    if (accuracy >= 65 && totalPredictions >= 25) return 'expert';
    if (accuracy >= 60 && totalPredictions >= 10) return 'analyst';
    if (accuracy >= 55 && totalPredictions >= 5) return 'apprentice';
    return 'novice';
  }

  /**
   * Calculate overall reputation score (0-10000)
   */
  static calculateReputationScore(metrics: ReputationMetrics): number {
    // Weight factors
    const weights = {
      accuracy: 0.4,
      volume: 0.25,
      consistency: 0.2,
      social: 0.15
    };

    const score = 
      metrics.accuracy * weights.accuracy +
      metrics.volume * weights.volume +
      metrics.consistency * weights.consistency +
      metrics.social * weights.social;

    return Math.min(10000, Math.max(0, Math.round(score)));
  }

  /**
   * Calculate percentile rank among all users
   */
  static calculatePercentile(score: number, allScores: number[]): number {
    const below = allScores.filter(s => s < score).length;
    return Math.round((below / allScores.length) * 100);
  }
}

// ===================================
// BADGE AWARD ENGINE
// ===================================

class BadgeAwardEngine {
  /**
   * Check if user qualifies for any new badges
   */
  static checkQualifications(
    reputation: UserReputation,
    currentBadges: UserBadge[],
    allBadges: ExpertBadge[]
  ): ExpertBadge[] {
    const currentBadgeIds = new Set(currentBadges.map(b => b.badge_id));
    const newBadges: ExpertBadge[] = [];

    for (const badge of allBadges) {
      if (currentBadgeIds.has(badge.id)) continue;

      if (this.meetsRequirements(reputation, badge)) {
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  private static meetsRequirements(reputation: UserReputation, badge: ExpertBadge): boolean {
    const req = badge.requirements;

    if (req.min_accuracy && reputation.prediction_accuracy < req.min_accuracy) {
      return false;
    }

    if (req.min_predictions && reputation.total_predictions < req.min_predictions) {
      return false;
    }

    if (req.min_streak && reputation.current_streak < req.min_streak) {
      return false;
    }

    if (req.min_reputation && reputation.reputation_score < req.min_reputation) {
      return false;
    }

    return true;
  }
}

// ===================================
// MAIN REPUTATION SERVICE
// ===================================

export class ReputationService {
  
  // ===================================
  // REPUTATION RETRIEVAL
  // ===================================

  async getUserReputation(userId: string): Promise<UserReputation | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching reputation:', error);
      return null;
    }

    return data as UserReputation;
  }

  async getLeaderboard(
    options: {
      limit?: number;
      offset?: number;
      tier?: AccuracyTier;
      category?: 'accuracy' | 'volume' | 'streak' | 'reputation';
    } = {}
  ): Promise<(UserReputation & { user: { full_name: string; username?: string; avatar_url?: string } })[]> {
    const supabase = await createClient();
    const { limit = 50, offset = 0, tier, category = 'reputation' } = options;

    let query = supabase
      .from('user_reputation')
      .select(`
        *,
        user:users (
          full_name,
          username,
          avatar_url
        )
      `);

    if (tier) {
      query = query.eq('accuracy_tier', tier);
    }

    // Sort by category
    const sortColumn = category === 'reputation' ? 'reputation_score' :
                      category === 'accuracy' ? 'prediction_accuracy' :
                      category === 'volume' ? 'total_predictions' :
                      'best_streak';

    query = query.order(sortColumn, { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as any[];
  }

  // ===================================
  // REPUTATION UPDATES
  // ===================================

  async updatePredictionAccuracy(
    userId: string,
    predictionResult: { correct: boolean; marketId: string }
  ): Promise<UserReputation> {
    const supabase = await createClient();

    // Get current reputation
    const { data: current } = await supabase
      .from('user_reputation')
      .select('*')
      .eq('user_id', userId)
      .single();

    const totalPredictions = (current?.total_predictions || 0) + 1;
    const correctPredictions = (current?.correct_predictions || 0) + (predictionResult.correct ? 1 : 0);
    const accuracy = (correctPredictions / totalPredictions) * 100;

    // Update streak
    let currentStreak = current?.current_streak || 0;
    let bestStreak = current?.best_streak || 0;

    if (predictionResult.correct) {
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    // Calculate new tier
    const accuracyTier = ReputationCalculator.getAccuracyTier(accuracy, totalPredictions);

    // Calculate volume score (max 2500 points for 500+ predictions)
    const volumeScore = Math.min(2500, (totalPredictions / 500) * 2500);

    // Calculate consistency score based on streak
    const consistencyScore = Math.min(2000, (bestStreak / 20) * 2000);

    // Keep existing social score or calculate new
    const socialScore = current?.social_score || 0;

    // Calculate total reputation
    const reputationScore = ReputationCalculator.calculateReputationScore({
      accuracy: accuracy * 40, // Max 4000 points for 100% accuracy
      volume: volumeScore,
      consistency: consistencyScore,
      social: socialScore
    });

    // Get percentile
    const { data: allScores } = await supabase
      .from('user_reputation')
      .select('reputation_score');

    const rankPercentile = ReputationCalculator.calculatePercentile(
      reputationScore,
      allScores?.map(s => s.reputation_score) || [reputationScore]
    );

    // Upsert reputation
    const { data: updated, error } = await supabase
      .from('user_reputation')
      .upsert({
        user_id: userId,
        prediction_accuracy: accuracy,
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        reputation_score: reputationScore,
        accuracy_tier: accuracyTier,
        volume_score: volumeScore,
        consistency_score: consistencyScore,
        social_score: socialScore,
        current_streak: currentStreak,
        best_streak: bestStreak,
        rank_percentile: rankPercentile,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Check for new badges
    await this.checkAndAwardBadges(userId);

    return updated as UserReputation;
  }

  async updateSocialScore(
    userId: string,
    activity: 'comment_upvote' | 'helpful_comment' | 'report_valid'
  ): Promise<void> {
    const supabase = await createClient();

    const scoreDelta = {
      'comment_upvote': 5,
      'helpful_comment': 20,
      'report_valid': 50
    }[activity];

    await supabase.rpc('increment_social_score', {
      p_user_id: userId,
      p_delta: scoreDelta
    });
  }

  // ===================================
  // BADGE MANAGEMENT
  // ===================================

  async getAllBadges(): Promise<ExpertBadge[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('expert_badges')
      .select('*')
      .order('rarity', { ascending: false });

    if (error) throw error;
    return data as ExpertBadge[];
  }

  async getUserBadges(userId: string): Promise<(UserBadge & { badge: ExpertBadge })[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:expert_badges (*)
      `)
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data || []) as any[];
  }

  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    const supabase = await createClient();

    // Get user's reputation
    const reputation = await this.getUserReputation(userId);
    if (!reputation) return [];

    // Get current badges
    const currentBadges = await this.getUserBadges(userId);

    // Get all available badges
    const allBadges = await this.getAllBadges();

    // Check qualifications
    const newBadges = BadgeAwardEngine.checkQualifications(
      reputation,
      currentBadges,
      allBadges
    );

    // Award new badges
    const awarded: UserBadge[] = [];
    for (const badge of newBadges) {
      const { data: awardedBadge, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          is_displayed: true,
          display_order: currentBadges.length + awarded.length
        })
        .select()
        .single();

      if (!error && awardedBadge) {
        awarded.push(awardedBadge as UserBadge);

        // Log badge earned activity
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'badge_earned',
          data: { badgeId: badge.id, badgeName: badge.name },
          algorithmic_weight: 70,
          priority_score: 80
        });
      }
    }

    return awarded;
  }

  async updateBadgeDisplay(
    userId: string,
    badgeId: string,
    updates: { isDisplayed?: boolean; displayOrder?: number }
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('user_badges')
      .update({
        is_displayed: updates.isDisplayed,
        display_order: updates.displayOrder
      })
      .eq('user_id', userId)
      .eq('badge_id', badgeId);
  }

  // ===================================
  // FOLLOWING SYSTEM
  // ===================================

  async followUser(
    followerId: string,
    followingId: string,
    preferences: {
      notifyOnTrade?: boolean;
      notifyOnComment?: boolean;
      notifyOnMarket?: boolean;
    } = {}
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('user_follows')
      .upsert({
        follower_id: followerId,
        following_id: followingId,
        notify_on_trade: preferences.notifyOnTrade ?? true,
        notify_on_comment: preferences.notifyOnComment ?? true,
        notify_on_market: preferences.notifyOnMarket ?? true
      });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
  }

  async getFollowers(userId: string): Promise<any[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_follows')
      .select(`
        *,
        follower:users!follower_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('following_id', userId);

    return data || [];
  }

  async getFollowing(userId: string): Promise<any[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('user_follows')
      .select(`
        *,
        following:users!following_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('follower_id', userId);

    return data || [];
  }

  // ===================================
  // EXPERT VERIFICATION
  // ===================================

  async requestExpertVerification(
    userId: string,
    badgeId: string,
    proof: string
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('user_badges')
      .upsert({
        user_id: userId,
        badge_id: badgeId,
        verification_proof: proof,
        awarded_by: null // Pending verification
      });
  }

  async verifyExpertBadge(
    adminId: string,
    userId: string,
    badgeId: string,
    approved: boolean
  ): Promise<void> {
    const supabase = await createClient();

    if (approved) {
      await supabase
        .from('user_badges')
        .update({
          awarded_by: adminId,
          awarded_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('badge_id', badgeId);
    } else {
      await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', userId)
        .eq('badge_id', badgeId);
    }
  }
}

export const reputationService = new ReputationService();
