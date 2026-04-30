"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  BarChart3,
  Percent,
  Star,
  Rocket,
  BadgeCheck,
  Crown,
  Flame,
  Zap,
  ChevronUp,
  ChevronDown,
  Filter,
  Clock,
  Users,
  Activity,
  Share2,
  Info,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  Diamond,
  Gem,
  Gift,
  Wallet,
  Ticket,
  Crown as CrownIcon,
  CircleDollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/format';
import { FollowButton } from '@/components/social/FollowButton';
import {
  useLeaderboard,
  LEADERBOARD_CATEGORIES,
  TIME_PERIODS,
  LEADERBOARD_ACHIEVEMENTS,
  REWARD_TIERS,
  MONTHLY_TOURNAMENTS,
  getRewardTier,
  type LeaderboardCategory,
  type TimePeriod,
  type LeaderboardEntry,
  type RewardTier,
} from '@/hooks/useLeaderboard';
import { useUser } from '@/hooks/useUser';

// ============================================
// ANIMATION VARIANTS
// ============================================

import type { Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const podiumVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: i * 0.2, type: 'spring', stiffness: 200 },
  }),
};

// ============================================
// MOTIVATIONAL QUOTES
// ============================================

const MOTIVATIONAL_QUOTES = [
  { text: "শীর্ষে পৌঁছতে হলে প্রথমে আপনাকে বিশ্বাস করতে হবে যে আপনি পারবেন!", author: "প্রফেশনাল ট্রেডার" },
  { text: "প্রতিটি লস একটি নতুন শিক্ষা, প্রতিটি জয় একটি নতুন সুযোগ।", author: "ওয়ারেন বাফেট" },
  { text: "সবচেয়ে বড় ঝুঁকি হলো কোনো ঝুঁকি না নেওয়া।", author: "মার্ক জাকারবার্গ" },
  { text: "ধৈর্য্য এবং বিশ্লেষণ - এগুলোই সফল ট্রেডারের মূল হাতিয়ার।", author: "বাংলাদেশ ট্রেডিং একাডেমি" },
  { text: "আজকের ছোট লাভ, আগামী দিনের বড় সফলতার ভিত্তি।", author: "রেয়া দালিও" },
];

// ============================================
// TOP TRADERS PODIUM COMPONENT
// ============================================

function TopTradersPodium({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(triggerConfetti, 500);
    return () => clearTimeout(timer);
  }, [triggerConfetti]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-amber-400 to-amber-600';
    if (rank === 2) return 'from-slate-300 to-slate-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-gray-400 to-gray-600';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-8 h-8 text-amber-500" />;
    if (rank === 2) return <Medal className="w-7 h-7 text-slate-400" />;
    if (rank === 3) return <Award className="w-7 h-7 text-orange-500" />;
    return null;
  };

  return (
    <div className="relative">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent rounded-3xl blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 py-8 md:py-12">
        {/* 2nd Place */}
        {top3[1] && (
          <motion.div
            custom={1}
            variants={podiumVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
            onMouseEnter={() => setHoveredRank(2)}
            onMouseLeave={() => setHoveredRank(null)}
          >
            <div className={cn(
              "relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br",
              getRankColor(2)
            )}>
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarFallback className="text-2xl font-bold bg-slate-100">
                    {top3[1].userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -top-2 -right-2 bg-slate-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                2
              </div>
            </div>
            <motion.div
              className="mt-4 text-center"
              animate={{ y: hoveredRank === 2 ? -5 : 0 }}
            >
              <p className="font-bold text-lg truncate max-w-[150px]">{top3[1].userName}</p>
              <p className="text-slate-500 font-semibold">{formatCurrency(top3[1].absoluteProfitBDT, 'BDT')}</p>
            </motion.div>
            <div className="w-20 md:w-28 h-24 md:h-32 bg-gradient-to-t from-slate-300/50 to-slate-400/30 rounded-t-lg mt-4 flex items-end justify-center pb-4">
              <span className="text-2xl font-bold text-slate-600">2</span>
            </div>
          </motion.div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <motion.div
            custom={0}
            variants={podiumVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center -mt-8 md:-mt-12 z-10"
            onMouseEnter={() => setHoveredRank(1)}
            onMouseLeave={() => setHoveredRank(null)}
          >
            {/* Crown Animation */}
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-2"
            >
              <Crown className="w-10 h-10 text-amber-500 fill-amber-500" />
            </motion.div>

            <div className={cn(
              "relative w-28 h-28 md:w-40 md:h-40 rounded-full p-1.5 bg-gradient-to-br shadow-2xl",
              getRankColor(1)
            )}>
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden ring-4 ring-amber-400/30">
                <Avatar className="w-full h-full">
                  <AvatarFallback className="text-3xl font-bold bg-amber-50">
                    {top3[0].userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full px-3 py-1 text-sm font-bold flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                #1
              </div>
            </div>

            <motion.div
              className="mt-6 text-center"
              animate={{ scale: hoveredRank === 1 ? 1.05 : 1 }}
            >
              <p className="font-bold text-xl md:text-2xl truncate max-w-[200px] bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {top3[0].userName}
              </p>
              <p className="text-amber-600 font-bold text-lg mt-1">
                {formatCurrency(top3[0].absoluteProfitBDT, 'BDT')}
              </p>
              <Badge className="mt-2 bg-amber-100 text-amber-700">
                🏆 চ্যাম্পিয়ন
              </Badge>
            </motion.div>

            <div className="w-24 md:w-36 h-32 md:h-40 bg-gradient-to-t from-amber-400/50 to-amber-500/30 rounded-t-lg mt-4 flex items-end justify-center pb-4 shadow-lg">
              <span className="text-3xl font-bold text-amber-700">1</span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <motion.div
            custom={2}
            variants={podiumVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
            onMouseEnter={() => setHoveredRank(3)}
            onMouseLeave={() => setHoveredRank(null)}
          >
            <div className={cn(
              "relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br",
              getRankColor(3)
            )}>
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <Avatar className="w-full h-full">
                  <AvatarFallback className="text-2xl font-bold bg-orange-50">
                    {top3[2].userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                3
              </div>
            </div>
            <motion.div
              className="mt-4 text-center"
              animate={{ y: hoveredRank === 3 ? -5 : 0 }}
            >
              <p className="font-bold text-lg truncate max-w-[150px]">{top3[2].userName}</p>
              <p className="text-orange-500 font-semibold">{formatCurrency(top3[2].absoluteProfitBDT, 'BDT')}</p>
            </motion.div>
            <div className="w-20 md:w-28 h-20 md:h-28 bg-gradient-to-t from-orange-400/50 to-orange-500/30 rounded-t-lg mt-4 flex items-end justify-center pb-4">
              <span className="text-2xl font-bold text-orange-700">3</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================
// USER RANK CARD COMPONENT
// ============================================

function UserRankCard({ userRank }: { userRank: any }) {
  if (!userRank) return null;

  const getMotivationalMessage = () => {
    if (userRank.currentRank <= 10) return "🌟 আপনি শীর্ষ ১০-এ! চমৎকার পারফরম্যান্স!";
    if (userRank.currentRank <= 100) return "🔥 শীর্ষ ১০০-তে আছেন! আরও এগিয়ে যান!";
    if (userRank.percentile >= 80) return "💪 আপনি সেরা ২০%-এ! চালিয়ে যান!";
    if (userRank.percentile >= 50) return "📈 ভালো করছেন! আরও ট্রেড করুন!";
    return "🚀 নতুন শুরু! প্রতিদিন শেখা এবং ট্রেড করুন!";
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <CardContent className="p-6 relative">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                #{userRank.currentRank}
              </div>
              {userRank.rankChange > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-green-400 text-green-900">
                  <ChevronUp className="w-3 h-3" />
                  {userRank.rankChange}
                </Badge>
              )}
            </div>

            <div>
              <p className="text-white/80 text-sm">আপনার বর্তমান র‌্যাঙ্ক</p>
              <p className="text-3xl font-bold">#{formatNumber(userRank.currentRank)}</p>
              <p className="text-white/80 text-sm mt-1">
                মোট {formatNumber(userRank.totalParticipants)} জন ট্রেডারের মধ্যে
              </p>
            </div>
          </div>

          <div className="flex-1 w-full lg:w-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80">টপ {userRank.percentile.toFixed(0)}%-এ আছেন</span>
              <span className="font-bold">{userRank.percentile.toFixed(1)}%</span>
            </div>
            <Progress value={userRank.percentile} className="h-3 bg-white/20" />
            <p className="text-white/90 text-sm mt-3">{getMotivationalMessage()}</p>
          </div>

          {userRank.nextRank && (
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
              <p className="text-white/80 text-sm">পরবর্তী র‌্যাঙ্কে যেতে</p>
              <p className="font-bold text-lg">
                #{userRank.nextRank.rank} {userRank.nextRank.userName}
              </p>
              <p className="text-emerald-200 text-sm">
                আরও {formatCurrency(userRank.nextRank.gap * 110, 'BDT')} লাফ দিন
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// REWARD TIER CARD COMPONENT
// ============================================

function RewardTierCard({ tier, percentile }: { tier: RewardTier; percentile: number }) {
  const getTierIcon = () => {
    switch (tier.id) {
      case 'elite': return <CrownIcon className="w-8 h-8" />;
      case 'diamond': return <Diamond className="w-8 h-8" />;
      case 'platinum': return <Medal className="w-8 h-8" />;
      case 'gold': return <Trophy className="w-8 h-8" />;
      case 'silver': return <Award className="w-8 h-8" />;
      default: return <Star className="w-8 h-8" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring' as const, stiffness: 200 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br",
        tier.gradient
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white">
              {getTierIcon()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{tier.nameBn}</h3>
              <p className="text-white/80 text-sm">{tier.name}</p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0 backdrop-blur">
            Top {tier.percentileThreshold}%
          </Badge>
        </div>

        {/* Reward Amount */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
            <Gift className="w-4 h-4" />
            <span>মাসিক পুরস্কার</span>
          </div>
          <p className="text-2xl font-bold text-white">{tier.rewardBn}</p>
          <p className="text-white/60 text-sm">{tier.reward}</p>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <p className="text-white/80 text-sm font-medium">বিশেষ সুবিধাসমূহ:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tier.benefitsBn.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-white/90 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Percentile Progress */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-white/80 text-sm mb-2">
            <span>আপনার অবস্থান</span>
            <span>Top {percentile.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentile}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// TOURNAMENT CARD COMPONENT
// ============================================

function TournamentCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-white">মাসিক টুর্নামেন্ট</CardTitle>
            <p className="text-white/80 text-sm">প্রতি মাসে ১০ লাখ+ টাকা পুরস্কার</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4">
          {MONTHLY_TOURNAMENTS.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${tournament.color}20` }}
              >
                {tournament.category === 'returnPercentage' && <TrendingUp className="w-7 h-7" style={{ color: tournament.color }} />}
                {tournament.category === 'riskAdjusted' && <Shield className="w-7 h-7" style={{ color: tournament.color }} />}
                {tournament.category === 'accuracy' && <Target className="w-7 h-7" style={{ color: tournament.color }} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-lg">{tournament.nameBn}</h4>
                <p className="text-muted-foreground text-sm">{tournament.descriptionBn}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Wallet className="w-3 h-3 mr-1" />
                    {formatCurrency(tournament.prizePool, 'BDT', 0)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {tournament.duration} দিন
                  </Badge>
                </div>
              </div>
              <Button size="sm" className="flex-shrink-0" style={{ backgroundColor: tournament.color }}>
                জয়েন
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Prize Pool Info */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
            <Info className="w-4 h-4" />
            <span className="font-medium">পুরস্কার তহবিল সম্পর্কে</span>
          </div>
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            টুর্নামেন্টের পুরস্কার তহবিল প্ল্যাটফর্মের মোট রাজস্বের ১% থেকে আসে।
            প্রতি মাসে প্রায় ১০ লাখ টাকার পুরস্কার বিতরণ করা হয়।
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// ACHIEVEMENT BADGES COMPONENT
// ============================================

function AchievementBadges({ entry }: { entry?: LeaderboardEntry }) {
  const earnedAchievements = LEADERBOARD_ACHIEVEMENTS.filter(a =>
    entry ? a.condition(entry) : false
  );

  if (earnedAchievements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>ট্রেডিং শুরু করুন এবং অর্জন অর্জন করুন!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {earnedAchievements.map((achievement) => (
        <TooltipProvider key={achievement.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${achievement.color}20, ${achievement.color}40)`,
                    border: `2px solid ${achievement.color}`
                  }}
                >
                  <Star className="w-7 h-7" style={{ color: achievement.color, fill: achievement.color }} />
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                  <div className="bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-lg border">
                    <p className="font-bold">{achievement.nameBn}</p>
                    <p className="text-muted-foreground">{achievement.descriptionBn}</p>
                  </div>
                </div>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-bold">{achievement.nameBn}</p>
              <p className="text-xs text-muted-foreground">{achievement.descriptionBn}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// ============================================
// LEADERBOARD TABLE ROW COMPONENT
// ============================================

function LeaderboardRow({
  entry,
  category,
  index,
  isCurrentUser
}: {
  entry: LeaderboardEntry;
  category: LeaderboardCategory;
  index: number;
  isCurrentUser: boolean;
}) {
  const getCategoryValue = () => {
    switch (category) {
      case 'absoluteProfit': return formatCurrency(entry.absoluteProfitBDT, 'BDT');
      case 'returnPercentage': return formatPercentage(entry.returnPercentage);
      case 'riskAdjusted': return entry.sharpeRatio.toFixed(2);
      case 'accuracy': return formatPercentage(entry.accuracy * 100);
      case 'consistency': return entry.consistency.toFixed(2);
      case 'volume': return formatCurrency(entry.volumeBDT, 'BDT', 0);
      default: return '';
    }
  };

  const getRankIcon = () => {
    if (entry.rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (entry.rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (entry.rank === 3) return <Award className="w-5 h-5 text-orange-500" />;
    return <span className="font-bold text-muted-foreground w-5 text-center">{entry.rank}</span>;
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "border-b hover:bg-muted/50 transition-colors",
        isCurrentUser && "bg-emerald-50 hover:bg-emerald-100"
      )}
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {getRankIcon()}
          {entry.rankChange !== 0 && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                entry.rankChange > 0 ? "text-green-600 border-green-200" : "text-red-600 border-red-200"
              )}
            >
              {entry.rankChange > 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {Math.abs(entry.rankChange)}
            </Badge>
          )}
        </div>
      </td>

      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className={cn(
              "font-bold",
              entry.rank <= 3 ? "bg-gradient-to-br from-amber-100 to-orange-100" : "bg-muted"
            )}>
              {entry.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium flex items-center gap-2 flex-wrap">
              {entry.userName}
              {entry.isKycVerified && (
                <BadgeCheck className="w-4 h-4 text-blue-500" />
              )}
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs">আপনি</Badge>
              )}
              {/* Follow Button */}
              {!isCurrentUser && entry.userId && (
                <FollowButton
                  targetUserId={entry.userId}
                  targetUserName={entry.userName}
                  size="sm"
                  variant="ghost"
                />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {entry.totalTrades} ট্রেড • {entry.winRate.toFixed(0)}% জয়
            </p>
          </div>
        </div>
      </td>

      <td className="py-4 px-4 text-right">
        <p className={cn(
          "font-bold text-lg",
          category === 'absoluteProfit' && entry.absoluteProfit >= 0 ? "text-emerald-600" :
            category === 'absoluteProfit' ? "text-rose-600" : "text-foreground"
        )}>
          {getCategoryValue()}
        </p>
      </td>

      <td className="py-4 px-4 text-right hidden md:table-cell">
        <div className="flex items-center justify-end gap-2">
          <AchievementBadges entry={entry} />
        </div>
      </td>
    </motion.tr>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LeaderboardPage() {
  const { user } = useUser();
  const [category, setCategory] = useState<LeaderboardCategory>('absoluteProfit');
  const [period, setPeriod] = useState<TimePeriod>('weekly');
  const [kycOnly, setKycOnly] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  // Memoize filters to prevent infinite re-renders
  const filters = useMemo(() => ({ category, period, kycOnly }), [category, period, kycOnly]);

  const { entries, userRank, loading, error } = useLeaderboard(
    filters,
    user?.id
  );

  // Rotate motivational quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const categoryConfig = LEADERBOARD_CATEGORIES[category];

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Header Skeleton */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white rounded-lg">
            <div className="container mx-auto px-4 py-8 text-center">
              <div className="h-10 w-48 bg-white/20 rounded mx-auto mb-2 animate-shimmer bg-[length:200%_100%]" />
              <div className="h-5 w-64 bg-white/20 rounded mx-auto animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
          <Card className="h-32">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-shimmer bg-[length:200%_100%]" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-shimmer bg-[length:200%_100%]" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-shimmer bg-[length:200%_100%]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-48">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:200%_100%]" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="h-96">
            <CardContent className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
                  <div className="h-10 w-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer bg-[length:200%_100%]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:200%_100%]" />
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/4 animate-shimmer bg-[length:200%_100%]" />
                  </div>
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-shimmer bg-[length:200%_100%]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white">
          <div className="container mx-auto px-4 py-8">
            <motion.div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">🏆 লিডারবোর্ড</h1>
              <p className="text-white/80">বাংলাদেশের সেরা ট্রেডারদের সাথে প্রতিযোগিতা করুন</p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">কিছু সমস্যা হয়েছে</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                <RotateCcw className="w-4 h-4 mr-2" />
                পুনরায় চেষ্টা করুন
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20"
    >
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <motion.div variants={itemVariants} className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">🏆 লিডারবোর্ড</h1>
            <p className="text-white/80">বাংলাদেশের সেরা ট্রেডারদের সাথে প্রতিযোগিতা করুন</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Motivational Quote */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/50 rounded-2xl p-6 text-center"
            >
              <p className="text-lg font-medium text-foreground mb-2">
                "{MOTIVATIONAL_QUOTES[currentQuote].text}"
              </p>
              <p className="text-sm text-muted-foreground">
                — {MOTIVATIONAL_QUOTES[currentQuote].author}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* User Rank Card */}
        {userRank && (
          <motion.div variants={itemVariants}>
            <UserRankCard userRank={userRank} />
          </motion.div>
        )}

        {/* Reward Tier Card */}
        {userRank?.rewardTier && (
          <motion.div variants={itemVariants}>
            <RewardTierCard
              tier={userRank.rewardTier}
              percentile={userRank.percentile}
            />
          </motion.div>
        )}

        {/* Filters */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-4">
          <Card className="flex-1">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category Select */}
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">র‌্যাঙ্কিং ক্যাটেগরি</label>
                  <Select value={category} onValueChange={(v) => setCategory(v as LeaderboardCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(LEADERBOARD_CATEGORIES).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span>{cat.nameBn}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Select */}
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-2 block">সময়কাল</label>
                  <div className="flex bg-muted rounded-lg p-1">
                    {Object.values(TIME_PERIODS).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPeriod(p.id)}
                        className={cn(
                          "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all",
                          period === p.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {p.nameBn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KYC Toggle */}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-muted/50 rounded-lg px-4 py-3">
                    <Switch checked={kycOnly} onCheckedChange={setKycOnly} />
                    <span className="text-sm">শুধু KYC ভেরিফায়েড</span>
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Info */}
        <motion.div variants={itemVariants}>
          <Card className="border-l-4" style={{ borderLeftColor: categoryConfig.color }}>
            <CardContent className="p-4 flex items-start gap-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${categoryConfig.color}20` }}
              >
                <Info className="w-6 h-6" style={{ color: categoryConfig.color }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{categoryConfig.nameBn}</h3>
                <p className="text-sm text-muted-foreground">{categoryConfig.descriptionBn}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    ন্যূনতম {categoryConfig.minTrades} ট্রেড
                  </Badge>
                  {categoryConfig.requiresKyc && (
                    <Badge variant="outline" className="text-xs text-blue-600">
                      KYC প্রয়োজন
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top 3 Podium or Empty State */}
        {entries.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="py-16">
              <CardContent className="text-center">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">এখনো কোনো ডাটা নেই</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  এই ক্যাটেগরিতে এখনো কোনো ট্রেডার যোগ্যতা অর্জন করেনি।
                  ট্রেডিং শুরু করুন এবং লিডারবোর্ডে আপনার স্থান অর্জন করুন!
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-4 py-2">
                    <BadgeCheck className="w-4 h-4" />
                    ন্যূনতম {categoryConfig.minTrades} ট্রেড করুন
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-4 py-2">
                    <Clock className="w-4 h-4" />
                    {TIME_PERIODS[period].nameBn} অপেক্ষা করুন
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <TopTradersPodium entries={entries} />
          </motion.div>
        )}

        {/* Full Leaderboard Table - Only show if there are more than 3 entries */}
        {entries.length > 3 && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  সম্পূর্ণ লিডারবোর্ড
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium">র‌্যাঙ্ক</th>
                        <th className="text-left py-3 px-4 font-medium">ট্রেডার</th>
                        <th className="text-right py-3 px-4 font-medium">{categoryConfig.nameBn}</th>
                        <th className="text-right py-3 px-4 font-medium hidden md:table-cell">অর্জন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice(3).map((entry, index) => (
                        <LeaderboardRow
                          key={entry.userId}
                          entry={entry}
                          category={category}
                          index={index}
                          isCurrentUser={entry.userId === user?.id}
                        />
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reward Tiers Showcase */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-violet-500" />
                রিওয়ার্ড টিয়ার
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {REWARD_TIERS.map((tier, index) => (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl border hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${tier.color}20, ${tier.color}40)` }}
                    >
                      {tier.id === 'elite' && <CrownIcon className="w-7 h-7" style={{ color: tier.color }} />}
                      {tier.id === 'diamond' && <Diamond className="w-7 h-7" style={{ color: tier.color }} />}
                      {tier.id === 'platinum' && <Medal className="w-7 h-7" style={{ color: tier.color }} />}
                      {tier.id === 'gold' && <Trophy className="w-7 h-7" style={{ color: tier.color }} />}
                      {tier.id === 'silver' && <Award className="w-7 h-7" style={{ color: tier.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold">{tier.nameBn}</h4>
                        <Badge variant="secondary" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                          Top {tier.percentileThreshold}%
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">{tier.rewardBn}</p>
                    </div>
                    {tier.monthlyPrize > 0 && (
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-muted-foreground">মাসিক পুরস্কার</p>
                        <p className="font-bold" style={{ color: tier.color }}>
                          {formatCurrency(tier.monthlyPrize, 'BDT', 0)}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Tournament Section */}
        <motion.div variants={itemVariants}>
          <TournamentCard />
        </motion.div>

        {/* Achievement Showcase */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                অর্জনসমূহ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {LEADERBOARD_ACHIEVEMENTS.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-xl border-2 border-dashed border-muted hover:border-solid hover:border-primary/50 transition-all text-center group cursor-pointer"
                  >
                    <div
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${achievement.color}20` }}
                    >
                      <Star className="w-6 h-6" style={{ color: achievement.color }} />
                    </div>
                    <p className="font-medium text-sm">{achievement.nameBn}</p>
                    <p className="text-xs text-muted-foreground mt-1">{achievement.descriptionBn}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
