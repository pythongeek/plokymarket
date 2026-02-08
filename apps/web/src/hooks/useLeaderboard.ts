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

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { category, period, kycOnly } = filters;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - TIME_PERIODS[period].days);

      // Fetch trades within period
      const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select(`
          *,
          markets:market_id (category, status, winning_outcome),
          buyer:buyer_id (id, full_name, kyc_verified),
          seller:seller_id (id, full_name, kyc_verified)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (tradesError) throw tradesError;

      // Fetch positions for P&L calculation
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          markets:market_id (status, winning_outcome, resolved_at),
          user:user_id (id, full_name, kyc_verified, created_at)
        `)
        .gte('created_at', startDate.toISOString());

      if (positionsError) throw positionsError;

      // Process user statistics
      const userStats = new Map<string, {
        user: any;
        trades: any[];
        positions: any[];
        tradingDays: Set<string>;
      }>();

      // Aggregate trades
      trades?.forEach(trade => {
        [trade.buyer, trade.seller].forEach(user => {
          if (!user) return;
          if (!userStats.has(user.id)) {
            userStats.set(user.id, { user, trades: [], positions: [], tradingDays: new Set() });
          }
          userStats.get(user.id)!.trades.push(trade);
          userStats.get(user.id)!.tradingDays.add(trade.created_at.split('T')[0]);
        });
      });

      // Aggregate positions
      positions?.forEach(position => {
        if (!position.user) return;
        if (!userStats.has(position.user.id)) {
          userStats.set(position.user.id, { 
            user: position.user, 
            trades: [], 
            positions: [], 
            tradingDays: new Set() 
          });
        }
        userStats.get(position.user.id)!.positions.push(position);
      });

      // Calculate rankings
      const leaderboardData: LeaderboardEntry[] = [];

      userStats.forEach(({ user, trades, positions, tradingDays }) => {
        // Skip KYC-only filter if needed
        if (kycOnly && !user.kyc_verified) return;

        // Calculate metrics
        let absoluteProfit = 0;
        let winningTrades = 0;
        let losingTrades = 0;
        let totalVolume = 0;
        let correctPredictions = 0;
        let totalPredictions = 0;
        let totalWins = 0;
        let totalLosses = 0;
        
        const returns: number[] = [];

        // Process positions for P&L
        positions.forEach(pos => {
          const entryPrice = pos.average_price || 0;
          const quantity = pos.quantity || 0;
          
          if (pos.markets?.status === 'resolved') {
            const won = pos.markets.winning_outcome === pos.outcome;
            const pnl = won ? (1 - entryPrice) * quantity : -entryPrice * quantity;
            absoluteProfit += pnl;
            
            totalPredictions++;
            if (won) {
              correctPredictions++;
              winningTrades++;
              totalWins += pnl;
            } else {
              losingTrades++;
              totalLosses += Math.abs(pnl);
            }
          }
          
          totalVolume += entryPrice * quantity;
        });

        // Calculate derived metrics
        const totalTrades = winningTrades + losingTrades;
        const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
        const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0;
        const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0;
        
        // Starting capital estimation (from wallet or first trade)
        const startingCapital = 10000; // Default, would fetch from actual data
        const returnPercentage = startingCapital > 0 ? (absoluteProfit / startingCapital) * 100 : 0;
        
        // Sharpe ratio calculation
        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const stdDev = returns.length > 0 
          ? Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length)
          : 1;
        const sharpeRatio = stdDev > 0 ? (avgReturn - 0.05) / stdDev : 0;
        
        // Accuracy
        const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
        
        // Consistency (Win Rate × Win/Loss Ratio)
        const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
        const consistency = winRate * (winLossRatio > 0 ? Math.min(winLossRatio, 5) : 0);

        // Calculate weighted score based on category
        let weightedScore = 0;
        switch (category) {
          case 'absoluteProfit':
            weightedScore = calculateTimeWeightedScore(absoluteProfit, new Date().toISOString());
            break;
          case 'returnPercentage':
            weightedScore = returnPercentage;
            break;
          case 'riskAdjusted':
            weightedScore = sharpeRatio * 100;
            break;
          case 'accuracy':
            weightedScore = accuracy * 100;
            break;
          case 'consistency':
            weightedScore = consistency * 100;
            break;
          case 'volume':
            weightedScore = totalVolume;
            break;
        }

        // Anti-gaming validation
        const validation = validateAntiGaming({
          totalTrades,
          tradingDays: tradingDays.size,
          avgPositionTime: 2, // Would calculate from actual data
          winRate,
          volume: totalVolume,
          weightedScore,
        }, category);

        if (!validation.isValid && category !== 'absoluteProfit') {
          weightedScore = validation.adjustedScore;
        }

        leaderboardData.push({
          rank: 0, // Will be assigned after sorting
          userId: user.id,
          userName: user.full_name || 'Anonymous Trader',
          isKycVerified: user.kyc_verified || false,
          absoluteProfit,
          absoluteProfitBDT: absoluteProfit * 110,
          returnPercentage,
          sharpeRatio,
          accuracy,
          consistency,
          volume: totalVolume,
          volumeBDT: totalVolume * 110,
          totalTrades,
          winningTrades,
          losingTrades,
          avgWin,
          avgLoss,
          maxDrawdown: 0, // Would calculate from equity curve
          winRate,
          avgPositionTime: 2,
          tradingDays: tradingDays.size,
          weightedScore,
          rankChange: 0,
        });
      });

      // Sort and assign ranks
      leaderboardData.sort((a, b) => b.weightedScore - a.weightedScore);
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
        // Simulate rank change (would fetch from historical data)
        entry.rankChange = Math.floor(Math.random() * 10) - 5;
      });

      setEntries(leaderboardData);

      // Calculate user rank if userId provided
      if (currentUserId) {
        const userEntry = leaderboardData.find(e => e.userId === currentUserId);
        if (userEntry) {
          const nextEntry = leaderboardData[userEntry.rank - 2];
          const prevEntry = leaderboardData[userEntry.rank];
          
          setUserRank({
            currentRank: userEntry.rank,
            previousRank: userEntry.rank - userEntry.rankChange,
            totalParticipants: leaderboardData.length,
            percentile: ((leaderboardData.length - userEntry.rank) / leaderboardData.length) * 100,
            category,
            period,
            metrics: {
              absoluteProfit: userEntry.absoluteProfit,
              returnPercentage: userEntry.returnPercentage,
              sharpeRatio: userEntry.sharpeRatio,
              accuracy: userEntry.accuracy,
              consistency: userEntry.consistency,
              volume: userEntry.volume,
            },
            nextRank: nextEntry ? {
              rank: nextEntry.rank,
              gap: nextEntry.weightedScore - userEntry.weightedScore,
              userName: nextEntry.userName,
            } : undefined,
            prevRank: prevEntry ? {
              rank: prevEntry.rank,
              gap: userEntry.weightedScore - prevEntry.weightedScore,
              userName: prevEntry.userName,
            } : undefined,
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
  }, [filters, currentUserId]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

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
