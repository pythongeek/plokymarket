"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Target,
  Zap,
  Download,
  Share2,
  Trophy,
  Flame,
  BarChart3,
  PieChart,
  LineChart as LineChartIcon,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { usePerformanceCharts, type PerformanceData } from '@/hooks/portfolio/usePerformanceCharts';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/format';

// Dynamic import for charts to avoid SSR issues
const DynamicChart = dynamic(
  () => import('./ChartComponents'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }
);

interface PerformanceChartsProps {
  userId?: string;
}

type ChartType = 'equity' | 'sharpe' | 'distribution' | 'calendar';
type Timeframe = '1M' | '3M' | '6M' | '1Y' | 'ALL';

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

const timeframeLabels: Record<Timeframe, { en: string; bn: string }> = {
  '1M': { en: '1 Month', bn: '১ মাস' },
  '3M': { en: '3 Months', bn: '৩ মাস' },
  '6M': { en: '6 Months', bn: '৬ মাস' },
  '1Y': { en: '1 Year', bn: '১ বছর' },
  ALL: { en: 'All Time', bn: 'সর্বকাল' }
};

export function PerformanceCharts({ userId }: PerformanceChartsProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showBDT, setShowBDT] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const { data, stats, loading, error } = usePerformanceCharts(userId, timeframe);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `📊 My Polymarket Bangladesh Performance\n` +
        `Return: ${stats?.totalReturn.toFixed(2)}%\n` +
        `Max Drawdown: ${stats?.maxDrawdown.toFixed(2)}%\n` +
        `#PolymarketBD #Trading`
      );
      alert('Performance summary copied to clipboard!');
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
        <Card className="h-96 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="py-12">
        <CardContent className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-rose-500" />
          <h3 className="text-lg font-medium">ডাটা লোড করতে সমস্যা</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
        <Card className="h-96 animate-pulse" />
      </div>
    );
  }

  if (!data || !stats) {
    return (
      <Card className="py-12">
        <CardContent className="text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">ডাটা পাওয়া যায়নি</h3>
          <p className="text-muted-foreground">ট্রেডিং শুরু করলে চার্ট দেখা যাবে</p>
        </CardContent>
      </Card>
    );
  }

  const currency = showBDT ? 'BDT' : 'USD';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📈 পারফরম্যান্স চার্ট
          </h2>
          <p className="text-muted-foreground">ইন্টারঅ্যাক্টিভ ভিজুয়ালাইজেশন এবং বেঞ্চমার্ক কম্পেয়ারিজন</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBDT(!showBDT)}
          >
            {showBDT ? '৳ BDT' : '$ USD'}
          </Button>

          <div className="flex bg-muted rounded-lg p-1">
            {(Object.keys(timeframeLabels) as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeframe === tf
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {timeframeLabels[tf].bn}
              </button>
            ))}
          </div>

          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="টোটাল রিটার্ন"
          value={`${stats.totalReturn >= 0 ? '+' : ''}${formatPercentage(stats.totalReturn)}`}
          icon={stats.totalReturn >= 0 ? TrendingUp : TrendingDown}
          color={stats.totalReturn >= 0 ? 'emerald' : 'rose'}
          subtext={formatCurrency(showBDT ? stats.finalValueBDT : stats.finalValue, currency)}
        />
        <StatCard
          label="ম্যাক্স ড্রয়ডাউন"
          value={`-${formatPercentage(stats.maxDrawdown)}`}
          icon={Activity}
          color="orange"
          subtext="সর্বোচ্চ ক্ষতি"
        />
        <StatCard
          label="কারেন্ট স্ট্রীক"
          value={`${data.streaks.currentWinStreak}W`}
          icon={Flame}
          color="amber"
          subtext={`ম্যাক্স: ${data.streaks.maxWinStreak}W`}
        />
        <StatCard
          label="শার্প রেশিও"
          value={data.rollingSharpe[data.rollingSharpe.length - 1]?.value.toFixed(2) || '0.00'}
          icon={Target}
          color="blue"
          subtext="রিস্ক-অ্যাডজাস্টেড"
        />
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants}>
        <DynamicChart 
          data={data} 
          showBenchmark={showBenchmark}
          showBDT={showBDT}
          currency={currency}
        />
      </motion.div>
    </motion.div>
  );
}

function StatCard({ 
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
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", colors.bg)}>
        <Icon className={cn("w-5 h-5", colors.text)} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
    </motion.div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
