"use client";

import { useState, useEffect, Suspense } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  PieChart,
  BarChart3,
  History,
  Sparkles,
  Trophy,
  Target,
  Zap,
  ChevronRight,
  Flame,
  Award,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/hooks/useUser';
import { PnLDashboard } from '@/components/portfolio/PnLDashboard';
import { PositionHistory } from '@/components/portfolio/PositionHistory';
import { PerformanceCharts } from '@/components/portfolio/PerformanceCharts';
import { PortfolioErrorBoundary } from '@/components/portfolio/ErrorBoundary';
import { cn } from '@/lib/utils';

// Motivational quotes in Bangla
const motivationalQuotes = [
  { text: "ধৈর্য্য ধারণ করুন, সফলতা আসবেই।", author: "প্রফেশনাল ট্রেডার" },
  { text: "ছোট লাভ বারবার = বড় সফলতা", author: "ওয়ারেন বাফেট" },
  { text: "বাজার সবসময় সুযোগ দেয়, সঠিক সময়ে কাজ করুন।", author: "বাংলাদেশ ট্রেডিং একাডেমি" },
  { text: "আপনার স্ট্র্যাটেজিতে বিশ্বাস রাখুন।", author: "টপ ট্রেডার" },
  { text: "প্রতিটি লস শেখার সুযোগ।", author: "রেয়া দালিও" }
];

// Achievement badges
const achievements = [
  { id: 'first_trade', name: 'প্রথম ট্রেড', icon: Target, color: 'blue', requirement: '১টি ট্রেড সম্পন্ন' },
  { id: 'profit_streak', name: 'প্রফিট স্ট্রীক', icon: Flame, color: 'amber', requirement: '৩টি কনসেকিউটিভ উইন' },
  { id: 'big_winner', name: 'বিগ উইনার', icon: Trophy, color: 'emerald', requirement: 'এক ট্রেডে ১০০০+ BDT লাভ' },
  { id: 'consistent', name: 'কনসিস্টেন্ট', icon: Award, color: 'purple', requirement: '৩০ দিন পজিটিভ রিটার্ন' },
  { id: 'master', name: 'মাস্টার ট্রেডার', icon: Crown, color: 'rose', requirement: '১০০টি সফল ট্রেড' }
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  exit: { opacity: 0, y: -20 }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

// Loading fallback
function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse h-40" />
        ))}
      </div>
      <Card className="animate-pulse h-96" />
    </div>
  );
}

export default function PortfolioPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentQuote, setCurrentQuote] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(['first_trade']);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Rotate quotes
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Simulate achievement unlocks
  useEffect(() => {
    if (!isMounted) return;
    const mockUnlocks = ['first_trade', 'profit_streak'];
    setUnlockedAchievements(mockUnlocks);
  }, [isMounted]);

  if (!isMounted) {
    return <LoadingFallback />;
  }

  return (
    <PortfolioErrorBoundary>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20"
      >
        {/* Welcome Banner */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white"
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">🎉 স্বাগতম, {user?.name || 'ট্রেডার'}!</h3>
                      <p className="text-white/80 text-sm">আপনার ট্রেডিং যাত্রা শুরু হোক। প্রতিদিন নতুন সুযোগ!</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                    onClick={() => setShowWelcome(false)}
                  >
                    বন্ধ করুন
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* User Profile Card */}
              <motion.div variants={itemVariants}>
                <Card className="h-full bg-gradient-to-br from-card to-muted/50 border-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                            {user?.name?.charAt(0) || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                          Lvl {user?.current_level_id || 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold">{user?.name || 'ট্রেডার'}</h2>
                        <p className="text-muted-foreground text-sm">{user?.email || 'trader@example.com'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Link href="/levels">
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {user?.current_level_name || 'Novice'}
                            </Badge>
                          </Link>
                          {user?.kycLevel && user.kycLevel > 0 && (
                            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Verified Trader
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trust Score & XP Progress */}
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Trust Score</span>
                          <span className="font-bold text-emerald-600">{user?.kycLevel && user.kycLevel > 0 ? '১০০%' : '৬০%'}</span>
                        </div>
                        <Progress value={user?.kycLevel && user.kycLevel > 0 ? 100 : 60} className="h-2 bg-emerald-100 dark:bg-emerald-900/30" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">XP Progress</span>
                          <span className="font-medium">750 / 1000</span>
                        </div>
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          লেভেল 4-এ আপগ্রেড করতে আরও ২৫০ XP লাগবে
                        </p>
                      </div>

                      {(user as any)?.idExpiry && !isNaN(new Date((user as any).idExpiry).getTime()) && (
                        <div className="pt-2 border-t border-primary/5">
                          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                            <span>Document Expiry</span>
                            <span className={cn(
                              "font-bold",
                              (new Date((user as any).idExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 30 ? "text-red-500" : "text-emerald-500"
                            )}>
                              {format(new Date((user as any).idExpiry), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {(new Date((user as any).idExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 30 && (
                            <p className="text-[10px] text-red-500 font-medium">
                              মেয়াদ শেষ হওয়ার আগে আপডেট করুন
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                  <QuickStatCard
                    label="পোর্টফোলিও ভ্যালু"
                    value="৳1,25,000"
                    change="+12.5%"
                    icon={Wallet}
                    color="emerald"
                  />
                  <QuickStatCard
                    label="আজকের P&L"
                    value="৳5,200"
                    change="+4.3%"
                    icon={TrendingUp}
                    color="blue"
                  />
                  <QuickStatCard
                    label="অ্যাক্টিভ পজিশন"
                    value="8"
                    change="3 winning"
                    icon={PieChart}
                    color="purple"
                  />
                  <QuickStatCard
                    label="উইন রেট"
                    value="68%"
                    change="+2.1%"
                    icon={Target}
                    color="amber"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Motivational Quote */}
            <motion.div variants={itemVariants} className="mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuote}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/50 p-6"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Sparkles className="w-24 h-24" />
                  </div>
                  <blockquote className="relative">
                    <p className="text-xl font-medium text-foreground mb-2">
                      &ldquo;{motivationalQuotes[currentQuote].text}&rdquo;
                    </p>
                    <footer className="text-sm text-muted-foreground">
                      — {motivationalQuotes[currentQuote].author}
                    </footer>
                  </blockquote>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Achievement Showcase */}
            <motion.div variants={itemVariants} className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    আপনার অ্যাচিভমেন্টস
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {achievements.map((achievement) => {
                      const isUnlocked = unlockedAchievements.includes(achievement.id);
                      const Icon = achievement.icon;

                      return (
                        <motion.div
                          key={achievement.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "relative group cursor-pointer",
                            !isUnlocked && "opacity-50 grayscale"
                          )}
                        >
                          <div className={cn(
                            "p-4 rounded-xl border-2 transition-all",
                            isUnlocked
                              ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30"
                              : "bg-muted border-muted"
                          )}>
                            <Icon className={cn(
                              "w-8 h-8",
                              isUnlocked && "text-emerald-600"
                            )} />
                          </div>
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <div className="bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-lg border">
                              <p className="font-medium">{achievement.name}</p>
                              <p className="text-muted-foreground">{achievement.requirement}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content Tabs */}
            <motion.div variants={itemVariants}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <TabsList className="bg-muted/50 p-1">
                    <TabsTrigger value="overview" className="gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">ওভারভিউ</span>
                    </TabsTrigger>
                    <TabsTrigger value="positions" className="gap-2">
                      <History className="w-4 h-4" />
                      <span className="hidden sm:inline">পজিশন হিস্টরি</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="gap-2">
                      <PieChart className="w-4 h-4" />
                      <span className="hidden sm:inline">পারফরম্যান্স</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <AnimatePresence mode="wait">
                  <TabsContent value="overview" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <PortfolioErrorBoundary>
                        <PnLDashboard userId={user?.id} />
                      </PortfolioErrorBoundary>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="positions" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <PortfolioErrorBoundary>
                        <PositionHistory userId={user?.id} />
                      </PortfolioErrorBoundary>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="charts" className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <PortfolioErrorBoundary>
                        <PerformanceCharts userId={user?.id} />
                      </PortfolioErrorBoundary>
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              variants={itemVariants}
              className="mt-12"
            >
              <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="1" fill="white" />
                    </pattern>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
                <CardContent className="p-8 relative">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2">🚀 নতুন মার্কেটে ট্রেড করুন!</h3>
                      <p className="text-white/80">
                        বাংলাদেশ ক্রিকেট, রাজনীতি, এবং আরও অনেক কিছুতে সুযোগ রয়েছে।
                      </p>
                    </div>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="gap-2 bg-white text-emerald-600 hover:bg-white/90"
                    >
                      মার্কেট দেখুন
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div >
    </PortfolioErrorBoundary >
  );
}

function QuickStatCard({
  label,
  value,
  change,
  icon: Icon,
  color
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-200',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-200',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-200',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-200'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        "p-4 rounded-xl border bg-gradient-to-br transition-all",
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-emerald-600 mt-1">{change}</p>
        </div>
        <div className="p-2 bg-background/50 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
