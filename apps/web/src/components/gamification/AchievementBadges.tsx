'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Target,
  Award,
  Star,
  Crown,
  Lock,
  Check,
  Medal,
  Sparkles,
  Bitcoin,
  BarChart3,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

interface BadgeDefinition {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  icon: React.ReactNode;
  rarity: Rarity;
  condition: string;
  color: string;
  bgColor: string;
}

interface EarnedBadge extends BadgeDefinition {
  earnedAt: string;
  progress?: number;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_trade',
    name: 'First Trade',
    nameBn: 'প্রথম ট্রেড',
    description: 'Placed your first trade',
    descriptionBn: 'আপনার প্রথম ট্রেড সম্পন্ন করুন',
    icon: <TrendingUp className="w-6 h-6" />,
    rarity: 'common',
    condition: 'complete_first_trade',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    id: 'profit_maker',
    name: 'Profit Maker',
    nameBn: 'মুনাফা নির্মাতা',
    description: 'Made your first profit',
    descriptionBn: 'প্রথম মুনাফা অর্জন করুন',
    icon: <BarChart3 className="w-6 h-6" />,
    rarity: 'rare',
    condition: 'make_first_profit',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    nameBn: 'স্ট্রিক মাস্টার',
    description: '7 days active in a row',
    descriptionBn: '৭ দিন ধারাবাহিক সক্রিয় থাকুন',
    icon: <Flame className="w-6 h-6" />,
    rarity: 'rare',
    condition: 'streak_7_days',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
  {
    id: 'top_10',
    name: 'Top 10%',
    nameBn: 'শীর্ষ ১০%',
    description: 'Ranked in top 10% of traders',
    descriptionBn: 'ট্রেডারদের মধ্যে শীর্ষ ১০%-এ অবস্থান',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'epic',
    condition: 'reach_top_10_percent',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  {
    id: 'volume_king',
    name: 'Volume King',
    nameBn: 'ভলিউম কিং',
    description: 'Traded 100,000 BDT total',
    descriptionBn: 'মোট ১,০০,০০০ টাকা ট্রেড করুন',
    icon: <Trophy className="w-6 h-6" />,
    rarity: 'epic',
    condition: 'volume_100k',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    id: 'accuracy_expert',
    name: 'Accuracy Expert',
    nameBn: 'নির্ভুলতা বিশেষজ্ঞ',
    description: '80%+ prediction accuracy',
    descriptionBn: '৮০% এর বেশি ভবিষ্যদ্বাণী সঠিকতা',
    icon: <Target className="w-6 h-6" />,
    rarity: 'legendary',
    condition: 'accuracy_80',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    nameBn: 'প্রাথমিক ব্যবহারকারী',
    description: 'Joined in first month',
    descriptionBn: 'প্রথম মাসে যোগ দিন',
    icon: <Star className="w-6 h-6" />,
    rarity: 'rare',
    condition: 'joined_first_month',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    id: 'biggest_gain',
    name: 'Jackpot',
    nameBn: 'জ্যাকপট',
    description: 'Gained 10,000 BDT in one trade',
    descriptionBn: 'একটি ট্রেডে ১০,০০০ টাকা আয় করুন',
    icon: <Sparkles className="w-6 h-6" />,
    rarity: 'legendary',
    condition: 'gain_10k_single_trade',
    color: 'text-pink-400',
    bgColor: 'bg-pink-400/10',
  },
  {
    id: 'kyc_verified',
    name: 'Verified Trader',
    nameBn: 'যাচাইকৃত ট্রেডার',
    description: 'Completed KYC verification',
    descriptionBn: 'KYC যাচাই সম্পন্ন করুন',
    icon: <Shield className="w-6 h-6" />,
    rarity: 'common',
    condition: 'kyc_completed',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
  },
  {
    id: 'diamond_hand',
    name: 'Diamond Hand',
    nameBn: 'ডায়মন্ড হ্যান্ড',
    description: 'Held a position for 30+ days',
    descriptionBn: '৩০+ দিন একটি পজিশন ধরে রাখুন',
    icon: <Medal className="w-6 h-6" />,
    rarity: 'epic',
    condition: 'hold_30_days',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
  },
];

const RARITY_ORDER: Record<Rarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

export function AchievementBadges() {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock earned badges - in production, fetch from user_badges table
    const mockEarned: EarnedBadge[] = [
      { ...BADGE_DEFINITIONS[0], earnedAt: '2026-03-15' },
      { ...BADGE_DEFINITIONS[8], earnedAt: '2026-03-16' },
    ];
    setEarnedBadges(mockEarned);
    setLoading(false);
  }, []);

  const earnedIds = new Set(earnedBadges.map((b) => b.id));
  const lockedBadges = BADGE_DEFINITIONS.filter((b) => !earnedIds.has(b.id));

  const sortedEarned = [...earnedBadges].sort(
    (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
  );

  const totalBadges = BADGE_DEFINITIONS.length;
  const earnedCount = earnedBadges.length;
  const progressPercent = Math.round((earnedCount / totalBadges) * 100);

  const rarityLabel: Record<Rarity, string> = {
    legendary: 'Legendary',
    epic: 'Epic',
    rare: 'Rare',
    common: 'Common',
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            অর্জন ও ব্যাজ
          </CardTitle>
          <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
            {earnedCount}/{totalBadges}
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-1.5 mt-2" />
        <p className="text-xs text-slate-400 mt-1">{progressPercent}% সম্পূর্ণ</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="earned" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700 w-full">
            <TabsTrigger value="earned" className="text-xs data-[state=active]:bg-slate-700">
              অর্জিত ({earnedCount})
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-xs data-[state=active]:bg-slate-700">
              লক করা ({lockedBadges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="mt-4 space-y-3">
            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-slate-800 rounded-xl h-24"
                  />
                ))}
              </div>
            ) : sortedEarned.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">
                এখনও কোনো ব্যাজ অর্জন করা হয়নি
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                <AnimatePresence>
                  {sortedEarned.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`${badge.bgColor} rounded-xl p-3 flex flex-col items-center gap-2 border border-slate-800`}
                    >
                      <div className={`${badge.color}`}>{badge.icon}</div>
                      <p className="text-xs text-white font-medium text-center leading-tight">
                        {badge.nameBn}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${badge.color} border-current`}
                      >
                        {rarityLabel[badge.rarity]}
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="mt-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center gap-2 border border-slate-800 opacity-50"
                >
                  <div className="text-slate-600 grayscale">
                    <Lock className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium text-center leading-tight">
                    {badge.nameBn}
                  </p>
                  <p className="text-[10px] text-slate-600 text-center">
                    {badge.descriptionBn}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
