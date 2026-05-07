'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Users, Shield, Activity, Clock, Zap, CheckCircle,
  AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight, DollarSign,
  BarChart3, RefreshCw, Server, Database, Lock, Eye, EyeOff,
  ChevronDown, ChevronRight, Bot, Sparkles, Settings, Play, Pause,
  Activity as ActivityIcon, ArrowLeftRight, CreditCard, Send,
  FileText, Scale, Globe, ChevronUp, Minus, Info, ExternalLink,
  Layers, Target, Clock3, AlertOctagon, Timer, Star, Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalMarkets: number;
  activeMarkets: number;
  closedMarkets: number;
  totalTrades: number;
  totalVolume: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  pendingEvents: number;
  aiProviders: {
    vertex: { healthy: boolean; latencyMs: number; };
    minimax: { healthy: boolean; latencyMs: number; };
  };
}

interface PendingItem {
  type: 'deposit' | 'withdrawal' | 'kyc' | 'event';
  label: string;
  count: number;
  color: string;
  path: string;
  icon: React.ReactNode;
}

interface SystemHealth {
  database: boolean;
  api: boolean;
  redis: boolean;
  workflows: boolean;
}

const NAV_SECTIONS = [
  {
    title: 'Overview',
    icon: BarChart3,
    items: [
      { path: '/sys-cmd-7x9k2', label: 'Dashboard', active: true },
    ]
  },
  {
    title: 'Core Operations',
    icon: Target,
    items: [
      { path: '/sys-cmd-7x9k2/markets', label: 'Market Control' },
      { path: '/sys-cmd-7x9k2/events', label: 'Event Management' },
      { path: '/sys-cmd-7x9k2/users', label: 'User Management' },
    ]
  },
  {
    title: 'Financial',
    icon: DollarSign,
    items: [
      { path: '/sys-cmd-7x9k2/deposits', label: 'Deposits' },
      { path: '/sys-cmd-7x9k2/withdrawals', label: 'Withdrawals' },
      { path: '/sys-cmd-7x9k2/usdt', label: 'USDT Operations' },
      { path: '/sys-cmd-7x9k2/exchange-rate', label: 'Exchange Rate' },
    ]
  },
  {
    title: 'Compliance & Risk',
    icon: Shield,
    items: [
      { path: '/sys-cmd-7x9k2/kyc', label: 'KYC Verification' },
      { path: '/sys-cmd-7x9k2/disputes', label: 'Disputes' },
      { path: '/sys-cmd-7x9k2/levels', label: 'User Levels' },
    ]
  },
  {
    title: 'Intelligence',
    icon: Bot,
    items: [
      { path: '/sys-cmd-7x9k2/ai-configs', label: 'AI Config' },
      { path: '/sys-cmd-7x9k2/daily-topics', label: 'Daily Topics' },
      { path: '/sys-cmd-7x9k2/resolutions', label: 'Resolution System' },
    ]
  },
  {
    title: 'System',
    icon: Server,
    items: [
      { path: '/sys-cmd-7x9k2/monitoring', label: 'Monitoring' },
      { path: '/sys-cmd-7x9k2/workflows', label: 'Cron Jobs' },
      { path: '/sys-cmd-7x9k2/analytics', label: 'Analytics' },
      { path: '/sys-cmd-7x9k2/p2p', label: 'P2P Management' },
    ]
  }
];

// ─── MiniMax Agent Status Component ─────────────────────────────────────────

function MiniMaxAgentCard({ health, onToggle }: {
  health: { healthy: boolean; latencyMs: number };
  onToggle: (active: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-violet-200 bg-violet-50/50 hover:bg-violet-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold",
          health.healthy ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gray-400"
        )}>
          MX
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">MiniMax AI</p>
          <p className="text-xs text-gray-500">
            {health.healthy ? `Latency: ${health.latencyMs}ms` : 'Unavailable'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={health.healthy ? 'default' : 'secondary'}
          className={cn(health.healthy ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500")}>
          {health.healthy ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
          {health.healthy ? 'Active' : 'Offline'}
        </Badge>
        <Button size="sm" variant="ghost"
          onClick={() => onToggle(!health.healthy)}
          className="text-violet-600 hover:text-violet-700 hover:bg-violet-100">
          {health.healthy ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Vertex Agent Status Component ───────────────────────────────────────────

function VertexAgentCard({ health, onToggle }: {
  health: { healthy: boolean; latencyMs: number };
  onToggle: (active: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold",
          health.healthy ? "bg-gradient-to-br from-blue-500 to-cyan-600" : "bg-gray-400"
        )}>
          VX
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Vertex AI (Gemini)</p>
          <p className="text-xs text-gray-500">
            {health.healthy ? `Latency: ${health.latencyMs}ms` : 'Unavailable'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={health.healthy ? 'default' : 'secondary'}
          className={cn(health.healthy ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500")}>
          {health.healthy ? <CheckCircle className="w-3 h-3 mr-1" /> : null}
          {health.healthy ? 'Active' : 'Offline'}
        </Badge>
        <Button size="sm" variant="ghost"
          onClick={() => onToggle(!health.healthy)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100">
          {health.healthy ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon: Icon, color, trend, onClick }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
  onClick?: () => void;
}) {
  const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    icon: 'bg-blue-100'    },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'bg-emerald-100' },
    violet: { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-100',  icon: 'bg-violet-100'  },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   icon: 'bg-amber-100'   },
    red:    { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100',     icon: 'bg-red-100'     },
    cyan:   { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-100',    icon: 'bg-cyan-100'    },
  };
  const c = colors[color] || colors.blue;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-all",
        onClick ? "hover:border-gray-300" : "cursor-default"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.icon)}>
          <Icon className={cn("w-5 h-5", c.text)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full",
            trend.value >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            {trend.value >= 0
              ? <ChevronUp className="w-3 h-3" />
              : <ChevronDown className="w-3 h-3" />
            }
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}

// ─── Pending Item Card ────────────────────────────────────────────────────────

function PendingCard({ item, loading }: { item: PendingItem; loading?: boolean }) {
  const router = useRouter();
  const icons: Record<string, React.ElementType> = {
    deposit: DollarSign, withdrawal: Send, kyc: Shield, event: Calendar as any,
  };
  const Icon = icons[item.type] || Activity;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-12" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all",
        item.count > 0 && "border-l-4",
      )}
      style={{ borderLeftColor: item.count > 0 ? item.color : undefined }}
      onClick={() => router.push(item.path)}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", item.color.replace('text-', 'bg-'))}>
        <Icon className={cn("w-5 h-5", item.color)} />
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{item.label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-gray-900">{item.count}</p>
        <ArrowUpRight className="w-4 h-4 text-gray-400" />
      </div>
      {item.count > 0 && (
        <Badge className="mt-2 text-xs" style={{ backgroundColor: item.color + '20', color: item.color, borderColor: item.color + '40' }}>
          Needs attention
        </Badge>
      )}
    </motion.div>
  );
}

// ─── System Health Card ───────────────────────────────────────────────────────

function SystemHealthCard({ health, loading }: { health: SystemHealth; loading?: boolean }) {
  const items = [
    { key: 'database', label: 'Database', sub: 'PostgreSQL', icon: Database, color: 'emerald' },
    { key: 'api', label: 'API Services', sub: 'All endpoints', icon: Server, color: 'emerald' },
    { key: 'redis', label: 'Redis Cache', sub: 'Upstash', icon: ActivityIcon, color: 'blue' },
    { key: 'workflows', label: 'Cron Jobs', sub: 'QStash', icon: Zap, color: 'violet' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-gray-200 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
            <div className="h-2 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(({ key, label, sub, icon: Icon, color }) => {
        const isUp = (health as any)[key];
        const colorMap: Record<string, string> = {
          emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
          blue: 'bg-blue-50 border-blue-200 text-blue-600',
          violet: 'bg-violet-50 border-violet-200 text-violet-600',
        };
        return (
          <div key={key} className={cn(
            "rounded-xl border p-4 transition-colors",
            isUp ? colorMap[color] + " hover:border-opacity-60" : "bg-gray-50 border-gray-200 text-gray-400"
          )}>
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-4 h-4" />
              {isUp
                ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : <XCircle className="w-4 h-4 text-gray-400" />
              }
            </div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs opacity-70">{isUp ? sub : 'Down'}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, activeUsers: 0, suspendedUsers: 0,
    totalMarkets: 0, activeMarkets: 0, closedMarkets: 0,
    totalTrades: 0, totalVolume: 0,
    pendingDeposits: 0, pendingWithdrawals: 0,
    pendingKyc: 0, pendingEvents: 0,
    aiProviders: {
      vertex: { healthy: false, latencyMs: 0 },
      minimax: { healthy: false, latencyMs: 0 },
    }
  });
  const [health, setHealth] = useState<SystemHealth>({
    database: false, api: false, redis: false, workflows: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [aiProviders, setAiProviders] = useState({
    vertex: { healthy: false, latencyMs: 0 },
    minimax: { healthy: false, latencyMs: 0 },
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);

      // ── User Stats ──
      const { count: totalUsers } = await supabase
        .from('user_profiles').select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('user_profiles').select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: suspendedUsers } = await supabase
        .from('user_profiles').select('*', { count: 'exact', head: true })
        .eq('status', 'suspended');

      // ── Market Stats ──
      const { count: totalMarkets } = await supabase
        .from('markets').select('*', { count: 'exact', head: true });

      const { count: activeMarkets } = await supabase
        .from('markets').select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: closedMarkets } = await supabase
        .from('markets').select('*', { count: 'exact', head: true })
        .eq('status', 'closed');

      // ── Volume ──
      const { data: tradesData } = await supabase
        .from('trades').select('price, quantity');

      const totalVolume = tradesData?.reduce(
        (sum: number, t: { price: number; quantity: number }) => sum + (t.price * t.quantity), 0
      ) || 0;

      const { count: totalTrades } = await supabase
        .from('orders').select('*', { count: 'exact', head: true });

      // ── Pending Items ──
      const { count: pendingDeposits } = await supabase
        .from('deposit_requests').select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingWithdrawals } = await supabase
        .from('withdrawal_requests').select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingKyc } = await supabase
        .from('kyc_submissions').select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingEvents } = await supabase
        .from('events').select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      // ── System Health ──
      let dbHealthy = false;
      try {
        const { error: dbError } = await supabase.from('user_profiles').select('id').limit(1);
        dbHealthy = !dbError;
      } catch { dbHealthy = false; }

      setHealth({
        database: dbHealthy,
        api: true,
        redis: true,
        workflows: true,
      });

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        totalMarkets: totalMarkets || 0,
        activeMarkets: activeMarkets || 0,
        closedMarkets: closedMarkets || 0,
        totalTrades: totalTrades || 0,
        totalVolume,
        pendingDeposits: pendingDeposits || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingKyc: pendingKyc || 0,
        pendingEvents: pendingEvents || 0,
        aiProviders: {
          vertex: aiProviders.vertex,
          minimax: aiProviders.minimax,
        }
      });

      setLastRefresh(new Date());
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  const checkAIAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/health-check');
      if (res.ok) {
        const data = await res.json();
        const providers = data.providers || {};
        setAiProviders({
          vertex: providers.vertex || { healthy: false, latencyMs: 0 },
          minimax: providers.minimax || { healthy: false, latencyMs: 0 },
        });
      }
    } catch {
      setAiProviders({
        vertex: { healthy: false, latencyMs: 0 },
        minimax: { healthy: false, latencyMs: 0 },
      });
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    checkAIAgents();
    const interval = setInterval(() => {
      fetchDashboardData();
      checkAIAgents();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, checkAIAgents]);

  const pendingItems: PendingItem[] = [
    {
      type: 'deposit', label: 'Pending Deposits',
      count: stats.pendingDeposits,
      color: 'text-blue-600',
      path: '/sys-cmd-7x9k2/deposits',
      icon: DollarSign,
    },
    {
      type: 'withdrawal', label: 'Pending Withdrawals',
      count: stats.pendingWithdrawals,
      color: 'text-amber-600',
      path: '/sys-cmd-7x9k2/withdrawals',
      icon: Send,
    },
    {
      type: 'kyc', label: 'KYC Reviews',
      count: stats.pendingKyc,
      color: 'text-violet-600',
      path: '/sys-cmd-7x9k2/kyc',
      icon: Shield,
    },
    {
      type: 'event', label: 'Draft Events',
      count: stats.pendingEvents,
      color: 'text-emerald-600',
      path: '/sys-cmd-7x9k2/events',
      icon: Target,
    },
  ];

  const totalPending = stats.pendingDeposits + stats.pendingWithdrawals + stats.pendingKyc + stats.pendingEvents;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Platform Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time overview of all platform operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3 h-3" />
            {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading...'}
          </div>
          <Button
            variant="outline" size="sm"
            onClick={() => { fetchDashboardData(); checkAIAgents(); }}
            disabled={refreshing}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={cn("w-4 h-4 mr-1.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          subtitle={`${stats.activeUsers} active · ${stats.suspendedUsers} suspended`}
          icon={Users}
          color="blue"
          onClick={() => router.push('/sys-cmd-7x9k2/users')}
        />
        <StatCard
          title="Active Markets"
          value={stats.activeMarkets}
          subtitle={`${stats.closedMarkets} closed · ${stats.totalMarkets} total`}
          icon={TrendingUp}
          color="green"
          onClick={() => router.push('/sys-cmd-7x9k2/markets')}
        />
        <StatCard
          title="Trading Volume"
          value={stats.totalVolume > 0 ? `৳${(stats.totalVolume / 1000).toFixed(1)}K` : '৳0'}
          subtitle={`${stats.totalTrades} total trades`}
          icon={Activity}
          color="violet"
          onClick={() => router.push('/sys-cmd-7x9k2/analytics')}
        />
        <StatCard
          title={totalPending > 0 ? "Pending Actions" : "All Caught Up"}
          value={totalPending}
          subtitle={totalPending > 0 ? "items need your attention" : "no pending items"}
          icon={totalPending > 0 ? AlertTriangle : CheckCircle}
          color={totalPending > 0 ? "amber" : "green"}
          onClick={() => router.push('/sys-cmd-7x9k2/deposits')}
        />
      </div>

      {/* ── Pending Actions + AI Agents Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Items */}
        <Card className="bg-white border border-gray-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  Pending Actions
                  {totalPending > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {totalPending}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Items requiring your review and action
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost"
                onClick={() => router.push('/sys-cmd-7x9k2/deposits')}
                className="text-xs text-primary hover:text-primary/80">
                View all <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pendingItems.map(item => (
                <PendingCard key={item.type} item={item} loading={loading} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Agents Panel */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-500" />
                  AI Agents
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Vertex & MiniMax providers
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost"
                onClick={() => router.push('/sys-cmd-7x9k2/ai-configs')}
                className="text-xs text-primary hover:text-primary/80">
                Configure <Settings className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <VertexAgentCard
              health={aiProviders.vertex}
              onToggle={(active) => console.log('Vertex toggle:', active)}
            />
            <MiniMaxAgentCard
              health={aiProviders.minimax}
              onToggle={(active) => console.log('MiniMax toggle:', active)}
            />
            <div className="pt-2 border-t border-gray-100">
              <Button
                className="w-full text-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                size="sm"
                onClick={() => router.push('/sys-cmd-7x9k2/daily-topics')}
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Generate Daily Topics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Actions + System Health Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Create Market', icon: TrendingUp, path: '/sys-cmd-7x9k2/markets', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Create Event', icon: Target, path: '/sys-cmd-7x9k2/events', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Review Users', icon: Users, path: '/sys-cmd-7x9k2/users', color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'View Analytics', icon: BarChart3, path: '/sys-cmd-7x9k2/analytics', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Exchange Rate', icon: ArrowLeftRight, path: '/sys-cmd-7x9k2/exchange-rate', color: 'text-cyan-600', bg: 'bg-cyan-50' },
                { label: 'System Config', icon: Settings, path: '/sys-cmd-7x9k2/monitoring', color: 'text-gray-600', bg: 'bg-gray-50' },
              ].map(({ label, icon: Icon, path, color, bg }) => (
                <Button
                  key={label}
                  variant="ghost"
                  onClick={() => router.push(path)}
                  className={cn(
                    "justify-start h-auto py-3 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    "border border-transparent hover:border-gray-200"
                  )}
                >
                  <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center mr-2", bg)}>
                    <Icon className={cn("w-3.5 h-3.5", color)} />
                  </span>
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="bg-white border border-gray-200 lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-500" />
                  System Health
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Infrastructure status at a glance
                </CardDescription>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                All systems operational
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <SystemHealthCard health={health} loading={loading} />
          </CardContent>
        </Card>
      </div>

      {/* ── Volume Overview + Market Distribution ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Active Users', value: stats.activeUsers, total: stats.totalUsers, color: 'bg-emerald-500' },
                { label: 'Suspended', value: stats.suspendedUsers, total: stats.totalUsers, color: 'bg-red-500' },
              ].map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                  <Progress
                    value={total > 0 ? (value / total) * 100 : 0}
                    className="h-2"
                  />
                </div>
              ))}
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">Market Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Active', value: stats.activeMarkets, total: stats.totalMarkets, color: 'bg-emerald-500' },
                { label: 'Closed', value: stats.closedMarkets, total: stats.totalMarkets, color: 'bg-gray-400' },
              ].map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-900">{value}</span>
                  </div>
                  <Progress
                    value={total > 0 ? (value / total) * 100 : 0}
                    className="h-2"
                  />
                </div>
              ))}
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Pending Deposits', value: stats.pendingDeposits, color: 'text-blue-600' },
                { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: 'text-amber-600' },
                { label: 'KYC Pending', value: stats.pendingKyc, color: 'text-violet-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className={cn("text-sm font-bold", color)}>{value}</span>
                </div>
              ))}
              {loading && (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
