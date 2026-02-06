'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Activity,
  Award,
  BarChart3,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { PerformanceChart } from '@/components/portfolio/PerformanceChart';
import { AchievementCard } from '@/components/leaderboard/AchievementCard';
import { CopyTradingSettings } from '@/components/portfolio/CopyTradingSettings';
import { calculatePortfolioMetrics } from '@/lib/analytics/portfolio';
import { motion } from 'framer-motion';
import { WalletDashboard } from '@/components/wallet/WalletDashboard';

function PositionCard({ position }: { position: any }) {
  const { t } = useTranslation();
  const market = position.market;
  const currentPrice = position.outcome === 'YES' ? market?.yes_price : market?.no_price;
  const currentValue = position.quantity * (currentPrice || position.average_price);
  const investedValue = position.quantity * position.average_price;
  const pnl = currentValue - investedValue;
  const pnlPercentage = (pnl / investedValue) * 100;

  // Translate category
  const translateCategory = (cat: string) => {
    const key = `categories.${cat}`;
    const translated = t(key);
    return translated !== key ? translated : cat;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={position.outcome === 'YES' ? 'default' : 'destructive'}
                className={position.outcome === 'YES' ? 'bg-green-500' : ''}
              >
                {position.outcome === 'YES' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {position.outcome === 'YES' ? t('common.yes') : t('common.no')}
              </Badge>
              <Badge variant="secondary">{translateCategory(market?.category)}</Badge>
            </div>
            <h3 className="font-semibold text-lg mb-1">{market?.question}</h3>
            <p className="text-sm text-muted-foreground">
              {position.quantity.toLocaleString()} {t('portfolio.shares_at_avg', { quantity: '', price: position.average_price.toFixed(2) }).replace('{{quantity}}', '').replace('{{price}}', '')}
              {position.quantity.toLocaleString()} শেয়ার @ ৳{position.average_price.toFixed(2)} গড়ে
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-right">
            <div>
              <p className="text-sm text-muted-foreground">{t('portfolio.invested')}</p>
              <p className="font-semibold">৳{investedValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('portfolio.current_value')}</p>
              <p className="font-semibold">৳{currentValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('portfolio.pnl')}</p>
              <p className={cn('font-semibold', pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                {pnl >= 0 ? '+' : ''}৳{pnl.toLocaleString()}
                <span className="text-xs ml-1">
                  ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>

          <Link href={`/markets/${market?.id}`}>
            <Button variant="outline" size="sm">
              {t('common.trade')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPositionsState() {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <PieChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('portfolio.no_positions')}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {t('portfolio.no_positions_desc')}
        </p>
        <Link href="/markets">
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('portfolio.browse_markets')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function PortfolioPage() {
  const { isAuthenticated, positions, fetchPositions } = useStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPositions();
    }
  }, [isAuthenticated, fetchPositions]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('common.login_required')}</h2>
        <p className="text-muted-foreground mb-6">{t('portfolio.login_to_view')}</p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">{t('common.login')}</Button>
          </Link>
          <Link href="/register">
            <Button>{t('common.get_started')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate portfolio stats
  const totalPositions = positions.length;
  const yesPositions = positions.filter((p) => p.outcome === 'YES');
  const noPositions = positions.filter((p) => p.outcome === 'NO');

  // Hardcoded wallet for demo/simplification (should come from store)
  const metrics = calculatePortfolioMetrics(positions, [], 5000);

  const ACHIEVEMENTS_DEMO = [
    { id: '1', name: 'Rookie Trader', description: 'Placed first trade', rarity: 'COMMON' as const },
    { id: '2', name: 'Unstoppable', description: '10 consecutive wins', rarity: 'LEGENDARY' as const, isLocked: true },
    { id: '3', name: 'Whale', description: 'Traded $1M volume', rarity: 'EPIC' as const, isLocked: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('portfolio.title')}</h1>
        <p className="text-muted-foreground">{t('portfolio.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Value', value: metrics.totalValue, icon: Wallet, color: 'text-primary' },
          { label: 'Sharpe Ratio', value: metrics.sharpeRatio.toFixed(2), icon: Activity, color: 'text-blue-500' },
          { label: 'Max Drawdown', value: `-${(metrics.maxDrawdown * 100).toFixed(1)}%`, icon: TrendingDown, color: 'text-red-500' },
          { label: 'Total Return', value: `${(metrics.totalReturn * 100).toFixed(1)}%`, icon: Percent, color: 'text-green-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold">
                      {typeof stat.value === 'number' ? `৳${stat.value.toLocaleString()}` : stat.value}
                    </p>
                  </div>
                  <div className={cn("h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center", stat.color)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <PerformanceChart />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Achievements
          </h3>
          {ACHIEVEMENTS_DEMO.map(a => (
            <AchievementCard key={a.id} {...a} />
          ))}
          <div className="pt-4">
            <CopyTradingSettings />
          </div>
        </div>
      </div>

      {/* Positions Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            {t('portfolio.all_positions')} ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="yes">
            <TrendingUp className="h-4 w-4 mr-1" />
            {t('common.yes')} ({yesPositions.length})
          </TabsTrigger>
          <TabsTrigger value="no">
            <TrendingDown className="h-4 w-4 mr-1" />
            {t('common.no')} ({noPositions.length})
          </TabsTrigger>
          <TabsTrigger value="wallet" className="ml-auto bg-indigo-500/10 text-indigo-400 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
            <Wallet className="h-4 w-4 mr-1" />
            Advanced Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {positions.length > 0 ? (
            positions.map((position) => <PositionCard key={position.id} position={position} />)
          ) : (
            <EmptyPositionsState />
          )}
        </TabsContent>

        <TabsContent value="yes" className="space-y-4">
          {yesPositions.length > 0 ? (
            yesPositions.map((position) => <PositionCard key={position.id} position={position} />)
          ) : (
            <EmptyPositionsState />
          )}
        </TabsContent>

        <TabsContent value="no" className="space-y-4">
          {noPositions.length > 0 ? (
            noPositions.map((position) => <PositionCard key={position.id} position={position} />)
          ) : (
            <EmptyPositionsState />
          )}
        </TabsContent>

        <TabsContent value="wallet">
          <WalletDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
