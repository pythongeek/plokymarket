"use client";

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Percent,
  Activity,
  Award,
  Calendar,
  TrendingUp as TrendIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { usePnL, type TimeHorizon, USD_TO_BDT } from '@/hooks/portfolio/usePnL';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage } from '@/lib/format';

interface PnLDashboardProps {
  userId?: string;
}

const timeHorizonLabels: Record<TimeHorizon, { en: string; bn: string }> = {
  intraday: { en: 'Today', bn: 'আজ' },
  daily: { en: '24H', bn: '২৪ ঘন্টা' },
  weekly: { en: '7 Days', bn: '৭ দিন' },
  monthly: { en: '30 Days', bn: '৩০ দিন' },
  quarterly: { en: '3 Months', bn: '৩ মাস' },
  annual: { en: '1 Year', bn: '১ বছর' },
  allTime: { en: 'All Time', bn: 'সর্বকাল' }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
} as const;

// Using motion's `AnimationProps['animate']` equivalent
const pulseAnimation: any = {
  scale: [1, 1.02, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export function PnLDashboard({ userId }: PnLDashboardProps) {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('monthly');
  const [showBDT, setShowBDT] = useState(true);
  const { pnlData, attribution, taxSuggestions, loading } = usePnL(userId, timeHorizon);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!pnlData) return null;

  const isProfit = pnlData.total >= 0;
  const currency = showBDT ? 'BDT' : 'USD';
  const totalValue = showBDT ? pnlData.totalBDT : pnlData.total;
  const realizedValue = showBDT ? pnlData.realizedBDT : pnlData.realized;
  const unrealizedValue = showBDT ? pnlData.unrealizedBDT : pnlData.unrealized;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with Time Selection */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            📊 আপনার পোর্টফোলিও বিশ্লেষণ
          </h2>
          <p className="text-muted-foreground">
            Track your investments and maximize returns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBDT(!showBDT)}
            className="font-medium"
          >
            {showBDT ? '৳ BDT' : '$ USD'}
          </Button>

          <div className="flex bg-muted rounded-lg p-1">
            {(['intraday', 'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'allTime'] as TimeHorizon[]).map((h) => (
              <button
                key={h}
                onClick={() => setTimeHorizon(h)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeHorizon === h
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {timeHorizonLabels[h].bn}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main PnL Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total PnL */}
        <Card className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
          isProfit ? "border-emerald-200 dark:border-emerald-800" : "border-rose-200 dark:border-rose-800"
        )}>
          <div className={cn(
            "absolute inset-0 opacity-10",
            isProfit ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-rose-500 to-orange-500"
          )} />
          <CardContent className="relative p-6">
            <motion.div
              // Use type assertion to avoid strict literal scale errors
              // @ts-expect-error valid framer motion payload 
              animate={isProfit && totalValue > 1000 ? pulseAnimation : undefined}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  isProfit ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
                )}>
                  {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <span className="text-sm font-medium text-muted-foreground">মোট লাভ/ক্ষতি</span>
              </div>
              {isProfit && totalValue > 5000 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Excellent!
                </Badge>
              )}
            </motion.div>
            <div className="mt-4">
              <motion.div
                key={totalValue}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "text-3xl font-bold",
                  isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {isProfit ? '+' : ''}{formatCurrency(totalValue, currency)}
              </motion.div>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn(
                  "text-sm font-medium",
                  isProfit ? "text-emerald-600" : "text-rose-600"
                )}>
                  {isProfit ? '+' : ''}{formatPercentage(pnlData.returnPercentage)}
                </span>
                <span className="text-xs text-muted-foreground">রিটার্ন</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Realized PnL */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-5" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">রিয়েলাইজড P&L</span>
            </div>
            <div className="mt-4">
              <motion.div
                key={realizedValue}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "text-3xl font-bold",
                  realizedValue >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {realizedValue >= 0 ? '+' : ''}{formatCurrency(realizedValue, currency)}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                {pnlData.winningTrades} জয় • {pnlData.losingTrades} পরাজয়
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unrealized PnL */}
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5" />
          <CardContent className="relative p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">আনরিয়েলাইজড P&L</span>
            </div>
            <div className="mt-4">
              <motion.div
                key={unrealizedValue}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "text-3xl font-bold",
                  unrealizedValue >= 0 ? "text-purple-600 dark:text-purple-400" : "text-rose-600 dark:text-rose-400"
                )}
              >
                {unrealizedValue >= 0 ? '+' : ''}{formatCurrency(unrealizedValue, currency)}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                খোলা পজিশনে সম্ভাব্য লাভ/ক্ষতি
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* PnL Performance Chart */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              PnL ইতিহাস
            </CardTitle>
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
              {timeHorizonLabels[timeHorizon].bn} পারফরম্যান্স
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pnlData.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isProfit ? "#10b981" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" opacity={0.2} />
                  <XAxis
                    dataKey="date"
                    hide
                  />
                  <YAxis
                    hide
                    domain={['auto', 'auto']}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border border-primary/20 p-2 rounded-lg shadow-xl text-xs">
                            <p className="font-bold opacity-70 mb-1">
                              {new Date(payload[0].payload.date).toLocaleDateString('bn-BD', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className={cn("font-black", isProfit ? "text-emerald-500" : "text-rose-500")}>
                              {formatCurrency(showBDT ? payload[0].payload.bdtValue : payload[0].payload.value, currency)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={showBDT ? "bdtValue" : "value"}
                    stroke={isProfit ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pnlGradient)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              পারফরম্যান্স মেট্রিক্স
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="জয়ের হার"
                value={`${pnlData.winRate.toFixed(1)}%`}
                icon={Award}
                color="amber"
                subtext={`${pnlData.totalTrades} ট্রেড`}
              />
              <MetricCard
                label="শার্প রেশিও"
                value={pnlData.sharpeRatio.toFixed(2)}
                icon={TrendIcon}
                color="emerald"
                subtext="রিস্ক-অ্যাডজাস্টেড রিটার্ন"
              />
              <MetricCard
                label="ম্যাক্স ড্রয়ডাউন"
                value={`-${pnlData.maxDrawdown.toFixed(1)}%`}
                icon={AlertTriangle}
                color="rose"
                subtext="সর্বোচ্চ ক্ষতি"
              />
              <MetricCard
                label="প্রফিট ফ্যাক্টর"
                value={pnlData.profitFactor.toFixed(2)}
                icon={BarChart3}
                color="blue"
                subtext="উইন/লস অনুপাত"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Attribution & Tax Sections */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PnL Attribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              বিভাগ অনুযায়ী P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attribution && (
              <div className="space-y-3">
                {Object.entries(attribution.byCategory)
                  .filter(([, value]) => value !== 0) // Only show categories with activity
                  .map(([category, value]) => {
                    const isPositive = value >= 0;
                    const totalValue = Math.abs(pnlData.realized) + Math.abs(pnlData.unrealized) || 1;
                    const percentage = Math.abs(value) / totalValue * 100;
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize text-muted-foreground">
                            {category === 'politics' && 'রাজনীতি'}
                            {category === 'cricket' && 'ক্রিকেট'}
                            {category === 'sports' && 'খেলাধুলা'}
                            {category === 'economy' && 'অর্থনীতি'}
                            {category === 'crypto' && 'ক্রিপ্টো'}
                            {category === 'technology' && 'প্রযুক্তি'}
                            {category === 'weather' && 'আবহাওয়া'}
                            {category === 'entertainment' && 'বিনোদন'}
                            {category === 'other' && 'অন্যান্য'}
                            {!['politics', 'cricket', 'sports', 'economy', 'crypto', 'technology', 'weather', 'entertainment', 'other'].includes(category) && category}
                          </span>
                          <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
                            {isPositive ? '+' : ''}{formatCurrency(value * (showBDT ? USD_TO_BDT : 1), currency)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={cn(
                              "h-full rounded-full",
                              isPositive ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                {Object.values(attribution.byCategory).every(v => v === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p>এখনো কোনো ট্রেড নেই</p>
                    <p className="text-sm">ট্রেডিং শুরু করলে বিভাগ অনুযায়ী P&L দেখা যাবে</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Loss Harvesting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              ট্যাক্স সেভিং সুপারিশ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taxSuggestions.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {taxSuggestions.slice(0, 3).map((suggestion, index) => (
                    <motion.div
                      key={suggestion.marketId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{suggestion.marketName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.reason}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-rose-600 font-medium text-sm">
                            -{formatCurrency(suggestion.unrealizedLossBDT, 'BDT')}
                          </p>
                          <Badge
                            variant="secondary"
                            className="mt-1 text-xs bg-emerald-100 text-emerald-700"
                          >
                            সেভিংস: {formatCurrency(suggestion.potentialTaxSavingsBDT, 'BDT')}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p>কোনো ট্যাক্স সেভিং সুযোগ নেই</p>
                <p className="text-sm">আপনার পোর্টফোলিও ভালো অবস্থায় আছে!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  subtext
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtext: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colors.bg)}>
        <Icon className={cn("w-5 h-5", colors.text)} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
    </div>
  );
}
