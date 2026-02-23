"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export type LeaderboardCategory =
  | 'absoluteProfit'
  | 'returnPercentage'
  | 'riskAdjusted'
  | 'accuracy'
  | 'consistency'
  | 'volume';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'allTime';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  isKycVerified: boolean;

  // Metrics
  absoluteProfit: number;
  absoluteProfitBDT: number;
  returnPercentage: number;
  sharpeRatio: number;
  accuracy: number;
  consistency: number;
  volume: number;
  volumeBDT: number;

  // Anti-gaming stats
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  winRate: number;
  avgPositionTime: number; // in hours
  tradingDays: number;

  // Time-weighted score
  weightedScore: number;

  // Movement
  rankChange: number; // positive = up, negative = down
  previousRank?: number;
}

export interface LeaderboardFilters {
  category: LeaderboardCategory;
  period: TimePeriod;
  minTrades?: number;
  kycOnly?: boolean;
}

export interface UserRank {
  currentRank: number;
  previousRank?: number;
  totalParticipants: number;
  percentile: number;
  category: LeaderboardCategory;
  period: TimePeriod;
  metrics: {
    absoluteProfit: number;
    returnPercentage: number;
    sharpeRatio: number;
    accuracy: number;
    consistency: number;
    volume: number;
  };
  nextRank?: {
    rank: number;
    gap: number;
    userName: string;
  };
  prevRank?: {
    rank: number;
    gap: number;
    userName: string;
  };
  rewardTier?: RewardTier;
}

// ============================================
// REWARD TIER SYSTEM
// ============================================

export type RewardTierId = 'elite' | 'diamond' | 'platinum' | 'gold' | 'silver';

export interface RewardTier {
  id: RewardTierId;
  name: string;
  nameBn: string;
  percentileThreshold: number; // Top X% (e.g., 0.1 for top 0.1%)
  reward: string;
  rewardBn: string;
  monthlyPrize: number; // in BDT
  benefits: string[];
  benefitsBn: string[];
  color: string;
  gradient: string;
  icon: string;
}

export const REWARD_TIERS: RewardTier[] = [
  {
    id: 'elite',
    name: 'Elite Trader',
    nameBn: 'এলিট ট্রেডার',
    percentileThreshold: 0.1, // Top 0.1%
    reward: '100% Fee Rebate + $5,000 Monthly',
    rewardBn: '১০০% ফি রিবেট + ৫,০০০ ডলার মাসিক',
    monthlyPrize: 5000 * 110, // Convert to BDT
    benefits: [
      'Exclusive alpha access',
      'Direct analyst contact',
      'VIP customer support',
      'Priority withdrawals'
    ],
    benefitsBn: [
      'এক্সক্লুসিভ আলফা অ্যাক্সেস',
      'সরাসরি অ্যানালিস্ট যোগাযোগ',
      'ভিআইপি কাস্টমার সাপোর্ট',
      'প্রায়োরিটি উইথড্রয়াল'
    ],
    color: '#8b5cf6',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    icon: 'Crown'
  },
  {
    id: 'diamond',
    name: 'Diamond Trader',
    nameBn: 'ডায়ামন্ড ট্রেডার',
    percentileThreshold: 1, // Top 1%
    reward: '75% Fee Rebate + $1,000 Monthly',
    rewardBn: '৭৫% ফি রিবেট + ১,০০০ ডলার মাসিক',
    monthlyPrize: 1000 * 110,
    benefits: [
      'Early market access',
      'Exclusive merchandise',
      'Priority support',
      'Monthly strategy calls'
    ],
    benefitsBn: [
      'তাড়াতাড়ি মার্কেট অ্যাক্সেস',
      'এক্সক্লুসিভ মার্চান্ডাইজ',
      'প্রায়োরিটি সাপোর্ট',
      'মাসিক স্ট্র্যাটেজি কল'
    ],
    color: '#06b6d4',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    icon: 'Diamond'
  },
  {
    id: 'platinum',
    name: 'Platinum Trader',
    nameBn: 'প্লাটিনাম ট্রেডার',
    percentileThreshold: 5, // Top 5%
    reward: '50% Fee Rebate',
    rewardBn: '৫০% ফি রিবেট',
    monthlyPrize: 0,
    benefits: [
      'Reduced withdrawal fees',
      'Priority support',
      'Advanced analytics',
      'Trading signals'
    ],
    benefitsBn: [
      'কম উইথড্রয়াল ফি',
      'প্রায়োরিটি সাপোর্ট',
      'এডভান্সড অ্যানালিটিক্স',
      'ট্রেডিং সিগন্যাল'
    ],
    color: '#64748b',
    gradient: 'from-slate-400 via-gray-500 to-zinc-500',
    icon: 'Medal'
  },
  {
    id: 'gold',
    name: 'Gold Trader',
    nameBn: 'গোল্ড ট্রেডার',
    percentileThreshold: 10, // Top 10%
    reward: '25% Fee Rebate',
    rewardBn: '২৫% ফি রিবেট',
    monthlyPrize: 0,
    benefits: [
      'Monthly tournament entry',
      'Community recognition',
      'Standard support',
      'Newsletter access'
    ],
    benefitsBn: [
      'মাসিক টুর্নামেন্ট এন্ট্রি',
      'কমিউনিটি রিকগনিশন',
      'স্ট্যান্ডার্ড সাপোর্ট',
      'নিউজলেটার অ্যাক্সেস'
    ],
    color: '#f59e0b',
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    icon: 'Trophy'
  },
  {
    id: 'silver',
    name: 'Silver Trader',
    nameBn: 'সিলভার ট্রেডার',
    percentileThreshold: 25, // Top 25%
    reward: '10% Fee Rebate',
    rewardBn: '১০% ফি রিবেট',
    monthlyPrize: 0,
    benefits: [
      'Community recognition badge',
      'Basic analytics',
      'Email support',
      'Educational content'
    ],
    benefitsBn: [
      'কমিউনিটি রিকগনিশন ব্যাজ',
      'বেসিক অ্যানালিটিক্স',
      'ইমেইল সাপোর্ট',
      'এডুকেশনাল কন্টেন্ট'
    ],
    color: '#94a3b8',
    gradient: 'from-gray-300 via-slate-400 to-gray-500',
    icon: 'Award'
  }
];

// Tournament configuration
export interface Tournament {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  prizePool: number; // in BDT
  entryFee: number;
  duration: number; // days
  category: LeaderboardCategory;
  icon: string;
  color: string;
}

export const MONTHLY_TOURNAMENTS: Tournament[] = [
  {
    id: 'highest-return',
    name: 'Return Masters',
    nameBn: 'রিটার্ন মাস্টার্স',
    description: 'Highest percentage return competition',
    descriptionBn: 'সর্বোচ্চ শতাংশ রিটার্ন প্রতিযোগিতা',
    prizePool: 500000, // 5 lakh BDT
    entryFee: 0,
    duration: 30,
    category: 'returnPercentage',
    icon: 'TrendingUp',
    color: '#10b981'
  },
  {
    id: 'sharpe-challenge',
    name: 'Sharpe Challenge',
    nameBn: 'শার্প চ্যালেঞ্জ',
    description: 'Best risk-adjusted returns',
    descriptionBn: 'সেরা রিস্ক-অ্যাডজাস্টেড রিটার্ন',
    prizePool: 300000, // 3 lakh BDT
    entryFee: 0,
    duration: 30,
    category: 'riskAdjusted',
    icon: 'Shield',
    color: '#8b5cf6'
  },
  {
    id: 'accuracy-cup',
    name: 'Accuracy Cup',
    nameBn: 'অ্যাকুরেসি কাপ',
    description: 'Highest prediction accuracy',
    descriptionBn: 'সর্বোচ্চ পূর্বাভাস সঠিকতা',
    prizePool: 200000, // 2 lakh BDT
    entryFee: 0,
    duration: 30,
    category: 'accuracy',
    icon: 'Target',
    color: '#f59e0b'
  }
];

// Get reward tier based on percentile
export function getRewardTier(percentile: number): RewardTier | null {
  // Percentile is 0-100, where 100 is rank 1 (top)
  // Lower percentile threshold = higher rank
  for (const tier of REWARD_TIERS) {
    if (percentile >= (100 - tier.percentileThreshold)) {
      return tier;
    }
  }
  return null;
}

// ============================================
// CATEGORY CONFIGURATION
// ============================================

export const LEADERBOARD_CATEGORIES: Record<LeaderboardCategory, {
  id: LeaderboardCategory;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  icon: string;
  color: string;
  minTrades: number;
  minTradingDays?: number;
  requiresKyc: boolean;
}> = {
  absoluteProfit: {
    id: 'absoluteProfit',
    name: 'Absolute Profit',
    nameBn: 'মোট লাভ',
    description: 'Total P&L in BDT',
    descriptionBn: 'বাংলাদেশী টাকায় মোট লাভ/ক্ষতি',
    icon: 'TrendingUp',
    color: '#10b981',
    minTrades: 10,
    requiresKyc: false,
  },
  returnPercentage: {
    id: 'returnPercentage',
    name: 'Return %',
    nameBn: 'রিটার্ন শতাংশ',
    description: 'P&L / Starting Capital',
    descriptionBn: 'পুঁজির উপর শতাংশ রিটার্ন',
    icon: 'Percent',
    color: '#3b82f6',
    minTrades: 10,
    requiresKyc: false,
  },
  riskAdjusted: {
    id: 'riskAdjusted',
    name: 'Risk-Adjusted',
    nameBn: 'রিস্ক-অ্যাডজাস্টেড',
    description: 'Sharpe Ratio',
    descriptionBn: 'শার্প রেশিও - রিস্ক অনুযায়ী রিটার্ন',
    icon: 'Shield',
    color: '#8b5cf6',
    minTrades: 20,
    minTradingDays: 20,
    requiresKyc: false,
  },
  accuracy: {
    id: 'accuracy',
    name: 'Accuracy',
    nameBn: 'সঠিকতা',
    description: 'Correct Predictions / Total',
    descriptionBn: 'সঠিক পূর্বাভাসের অনুপাত',
    icon: 'Target',
    color: '#f59e0b',
    minTrades: 50,
    requiresKyc: false,
  },
  consistency: {
    id: 'consistency',
    name: 'Consistency',
    nameBn: 'ধারাবাহিকতা',
    description: 'Win Rate × Avg Win/Loss Ratio',
    descriptionBn: 'জয়ের হার × গড় লাভ/ক্ষতি অনুপাত',
    icon: 'Award',
    color: '#ec4899',
    minTrades: 30,
    requiresKyc: false,
  },
  volume: {
    id: 'volume',
    name: 'Volume',
    nameBn: 'ট্রেডিং ভলিউম',
    description: 'Total Traded Notional',
    descriptionBn: 'মোট ট্রেডিং পরিমাণ',
    icon: 'BarChart3',
    color: '#06b6d4',
    minTrades: 5,
    requiresKyc: true,
  },
};

export const TIME_PERIODS: Record<TimePeriod, {
  id: TimePeriod;
  name: string;
  nameBn: string;
  days: number;
}> = {
  daily: { id: 'daily', name: 'Daily', nameBn: 'দৈনিক', days: 1 },
  weekly: { id: 'weekly', name: 'Weekly', nameBn: 'সাপ্তাহিক', days: 7 },
  monthly: { id: 'monthly', name: 'Monthly', nameBn: 'মাসিক', days: 30 },
  allTime: { id: 'allTime', name: 'All Time', nameBn: 'সর্বকাল', days: 3650 },
};

// ============================================
// TIME-WEIGHTED SCORING
// ============================================

function calculateTimeWeightedScore(
  value: number,
  timestamp: string,
  halfLifeDays: number = 30
): number {
  const age = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.exp(-Math.log(2) * age / halfLifeDays);
  return value * decayFactor;
}

// ============================================
// ANTI-GAMING VALIDATION
// ============================================

interface AntiGamingResult {
  isValid: boolean;
  violations: string[];
  adjustedScore: number;
}

function validateAntiGaming(
  entry: Partial<LeaderboardEntry>,
  category: LeaderboardCategory
): AntiGamingResult {
  const violations: string[] = [];
  const config = LEADERBOARD_CATEGORIES[category];

  // Minimum trades check
  if ((entry.totalTrades || 0) < config.minTrades) {
    violations.push(`Minimum ${config.minTrades} trades required`);
  }

  // Minimum trading days check
  if (config.minTradingDays && (entry.tradingDays || 0) < config.minTradingDays) {
    violations.push(`Minimum ${config.minTradingDays} trading days required`);
  }

  // Position time check (for absolute profit)
  if (category === 'absoluteProfit' && (entry.avgPositionTime || 0) < 1) {
    violations.push('Average position time must be > 1 hour');
  }

  // Win rate variance check (for consistency)
  if (category === 'consistency') {
    const winRate = entry.winRate || 0;
    if (winRate > 0.95 || winRate < 0.05) {
      violations.push('Suspicious win rate variance');
    }
  }

  // Wash trading detection (for volume)
  if (category === 'volume' && entry.totalTrades) {
    const avgTradeSize = (entry.volume || 0) / entry.totalTrades;
    // Flag if too many identical size trades
    if (avgTradeSize < 10 && entry.totalTrades > 100) {
      violations.push('Potential wash trading detected');
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    adjustedScore: violations.length > 0 ? 0 : (entry.weightedScore || 0),
  };
}

// ============================================
// MAIN HOOK
// ============================================

export function useLeaderboard(
  filters: LeaderboardFilters,
  currentUserId?: string
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Destructure filters to use individual values in dependency arrays
  const { category, period, kycOnly } = filters;

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Fetch from leaderboard_cache
      let query = supabase
        .from('leaderboard_cache')
        .select(`
          *,
          user:user_id (
            id, 
            full_name, 
            kyc_verified,
            avatar_url
          )
        `)
        .eq('timeframe', period === 'allTime' ? 'all_time' : period);

      // Apply Filters
      if (kycOnly) {
        query = query.eq('user:user_id.kyc_verified', true);
      }

      // Sort by chosen category/score
      if (category === 'absoluteProfit') {
        query = query.order('realized_pnl', { ascending: false });
      } else if (category === 'volume') {
        query = query.order('trading_volume', { ascending: false });
      } else if (category === 'riskAdjusted') {
        query = query.order('risk_score', { ascending: true }); // Lower is better
      } else {
        query = query.order('score', { ascending: false });
      }

      const { data: cacheData, error: cacheError } = await query.limit(100);

      if (cacheError) throw cacheError;

      // 2. Map to LeaderboardEntry
      const leaderboardData: LeaderboardEntry[] = (cacheData || []).map((item: any, index: number) => ({
        rank: index + 1,
        userId: item.user_id,
        userName: item.user?.full_name || 'Anonymous Trader',
        userAvatar: item.user?.avatar_url,
        isKycVerified: item.user?.kyc_verified || false,

        absoluteProfit: (item.realized_pnl || 0) / 100,
        absoluteProfitBDT: ((item.realized_pnl || 0) / 100) * 110,
        returnPercentage: item.roi || 0,
        sharpeRatio: 0, // Would need more granular data for true Sharpe
        accuracy: 0,
        consistency: 0,
        volume: (item.trading_volume || 0) / 100,
        volumeBDT: ((item.trading_volume || 0) / 100) * 110,

        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        winRate: 0,
        avgPositionTime: 0,
        tradingDays: 0,

        weightedScore: item.score || 0,
        rankChange: Math.floor(Math.random() * 6) - 3, // Mocked for now
      }));

      setEntries(leaderboardData);

      // 3. User Specific Rank
      if (currentUserId) {
        const userItem = leaderboardData.find(e => e.userId === currentUserId);
        if (userItem) {
          const percentile = ((leaderboardData.length - userItem.rank) / leaderboardData.length) * 100;
          setUserRank({
            currentRank: userItem.rank,
            totalParticipants: leaderboardData.length,
            percentile,
            category,
            period,
            metrics: {
              absoluteProfit: userItem.absoluteProfit,
              returnPercentage: userItem.returnPercentage,
              sharpeRatio: 0,
              accuracy: 0,
              consistency: 0,
              volume: userItem.volume,
            },
            rewardTier: getRewardTier(percentile) ?? undefined,
          });
        }
      }

      setError(null);
    } catch (err) {
      console.error('Leaderboard Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [category, period, kycOnly, currentUserId]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, period, kycOnly, currentUserId]);

  return {
    entries,
    userRank,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
}

// ============================================
// ACHIEVEMENTS & MILESTONES
// ============================================

export interface LeaderboardAchievement {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  icon: string;
  color: string;
  condition: (entry: LeaderboardEntry) => boolean;
}

export const LEADERBOARD_ACHIEVEMENTS: LeaderboardAchievement[] = [
  {
    id: 'top10',
    name: 'Top 10 Trader',
    nameBn: 'শীর্ষ ১০ ট্রেডার',
    description: 'Rank in top 10',
    descriptionBn: 'শীর্ষ ১০-এ স্থান',
    icon: 'Trophy',
    color: '#f59e0b',
    condition: (e) => e.rank <= 10,
  },
  {
    id: 'top100',
    name: 'Elite Trader',
    nameBn: 'এলিট ট্রেডার',
    description: 'Rank in top 100',
    descriptionBn: 'শীর্ষ ১০০-এ স্থান',
    icon: 'Award',
    color: '#3b82f6',
    condition: (e) => e.rank <= 100,
  },
  {
    id: 'profitStreak',
    name: 'Profit Master',
    nameBn: 'প্রফিট মাস্টার',
    description: '10+ consecutive winning trades',
    descriptionBn: '১০+ ধারাবাহিক লাভজনক ট্রেড',
    icon: 'TrendingUp',
    color: '#10b981',
    condition: (e) => e.winningTrades >= 10 && e.winRate > 0.7,
  },
  {
    id: 'highVolume',
    name: 'Volume King',
    nameBn: 'ভলিউম কিং',
    description: '₹10L+ trading volume',
    descriptionBn: '১০ লাখ+ টাকা ট্রেডিং ভলিউম',
    icon: 'BarChart3',
    color: '#8b5cf6',
    condition: (e) => e.volumeBDT >= 1000000,
  },
  {
    id: 'sharpeStar',
    name: 'Sharpe Star',
    nameBn: 'শার্প স্টার',
    description: 'Sharpe ratio > 2.0',
    descriptionBn: 'শার্প রেশিও ২.০ এর বেশি',
    icon: 'Star',
    color: '#ec4899',
    condition: (e) => e.sharpeRatio > 2.0,
  },
  {
    id: 'accuracyExpert',
    name: 'Prediction Expert',
    nameBn: 'পূর্বাভাস বিশেষজ্ঞ',
    description: '70%+ prediction accuracy',
    descriptionBn: '৭০%+ পূর্বাভাস সঠিকতা',
    icon: 'Target',
    color: '#06b6d4',
    condition: (e) => e.accuracy >= 0.7 && e.totalTrades >= 20,
  },
  {
    id: 'kycVerified',
    name: 'Verified Trader',
    nameBn: 'ভেরিফায়েড ট্রেডার',
    description: 'KYC verification complete',
    descriptionBn: 'কেওয়াইসি ভেরিফিকেশন সম্পূর্ণ',
    icon: 'BadgeCheck',
    color: '#10b981',
    condition: (e) => e.isKycVerified,
  },
  {
    id: 'risingStar',
    name: 'Rising Star',
    nameBn: 'রাইজিং স্টার',
    description: 'Rank improved by 5+ positions',
    descriptionBn: '৫+ ধাপ এগিয়েছেন',
    icon: 'Rocket',
    color: '#f97316',
    condition: (e) => e.rankChange >= 5,
  },
];

export default useLeaderboard;
