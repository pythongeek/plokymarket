'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Shield,
  Activity,
  Lock,
  Database,
  Server,
  Zap,
  BarChart3,
  RefreshCw,
  Workflow,
  Plus,
} from 'lucide-react';
import { QStashWorkflowManager } from '@/components/admin/QStashWorkflowManager';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const SECURE_PATHS = {
  markets: '/sys-cmd-7x9k2/markets',
  users: '/sys-cmd-7x9k2/users',
  analytics: '/sys-cmd-7x9k2/analytics',
};

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalMarkets: number;
  pendingMarkets: number;
  activeMarkets: number;
  totalVolume: number;
  pendingReviews: number;
  supportTickets: number;
  securityAlerts: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user_id: string;
  resource: string;
  created_at: string;
  user_email?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalMarkets: 0,
    pendingMarkets: 0,
    activeMarkets: 0,
    totalVolume: 0,
    pendingReviews: 0,
    supportTickets: 0,
    securityAlerts: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);

      // Fetch total user count (always works - no status column)
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active/suspended from user_status table (not user_profiles)
      let activeUsers = 0;
      let suspendedUsers = 0;
      try {
        const { count: active } = await supabase
          .from('user_status')
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'active');
        activeUsers = active || 0;

        const { count: suspended } = await supabase
          .from('user_status')
          .select('*', { count: 'exact', head: true })
          .eq('account_status', 'suspended');
        suspendedUsers = suspended || 0;
      } catch {
        // user_status table may not exist yet
        activeUsers = totalUsers || 0;
      }

      // Fetch market stats
      const { count: totalMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true });

      const { count: activeMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch pending market reviews (graceful fallback if table missing)
      let pendingMarkets = 0;
      try {
        const { count, error } = await supabase
          .from('market_creation_drafts')
          .select('*', { count: 'exact', head: true })
          .in('status', ['legal_review', 'liquidity_commitment']);
        if (!error) pendingMarkets = count || 0;
      } catch {
        // table may not exist
      }

      // Fetch total volume
      let totalVolume = 0;
      try {
        const { data: volumeData } = await supabase
          .from('trades')
          .select('price, quantity');
        totalVolume = volumeData?.reduce((sum: number, trade: { price: number; quantity: number }) =>
          sum + (trade.price * trade.quantity), 0
        ) || 0;
      } catch {
        // trades table may not exist
      }

      // Fetch pending reviews (graceful fallback)
      let pendingReviews = 0;
      try {
        const { count, error } = await supabase
          .from('market_creation_drafts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'legal_review');
        if (!error) pendingReviews = count || 0;
      } catch {
        // table may not exist
      }

      // Fetch support tickets (graceful fallback)
      let supportTickets = 0;
      try {
        const { count, error } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        if (!error) supportTickets = count || 0;
      } catch {
        // table may not exist
      }

      // Fetch recent admin activity
      let activityData: RecentActivity[] = [];
      try {
        const { data, error } = await supabase
          .from('admin_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (!error && data) activityData = data;
      } catch {
        // table may not exist
      }

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers,
        suspendedUsers,
        totalMarkets: totalMarkets || 0,
        pendingMarkets,
        activeMarkets: activeMarkets || 0,
        totalVolume,
        pendingReviews,
        supportTickets,
        securityAlerts: suspendedUsers + pendingReviews,
      });

      setRecentActivity(activityData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const statCards = [
    {
      title: 'মোট ব্যবহারকারী',
      titleEn: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: `${stats.activeUsers} active`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-500/20',
      onClick: () => router.push(SECURE_PATHS.users),
    },
    {
      title: 'সক্রিয় মার্কেট',
      titleEn: 'Active Markets',
      value: stats.activeMarkets.toString(),
      change: `${stats.totalMarkets} total, ${stats.pendingMarkets} pending`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
      borderColor: 'border-emerald-500/20',
      onClick: () => router.push(SECURE_PATHS.markets),
    },
    {
      title: 'মোট ভলিউম',
      titleEn: 'Total Volume',
      value: `৳${(stats.totalVolume / 1000000).toFixed(2)}M`,
      change: 'Last 30 days',
      icon: Activity,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/15',
      borderColor: 'border-violet-500/20',
      onClick: () => router.push(SECURE_PATHS.analytics),
    },
    {
      title: 'নিরাপত্তা সতর্কতা',
      titleEn: 'Security Alerts',
      value: stats.securityAlerts.toString(),
      change: `${stats.suspendedUsers} suspended, ${stats.pendingReviews} reviews`,
      icon: Shield,
      color: stats.securityAlerts > 0 ? 'text-red-400' : 'text-amber-400',
      bgColor: stats.securityAlerts > 0 ? 'bg-red-500/15' : 'bg-amber-500/15',
      borderColor: stats.securityAlerts > 0 ? 'border-red-500/20' : 'border-amber-500/20',
      onClick: () => router.push(SECURE_PATHS.users),
    },
  ];

  const getActivityIcon = (action: string) => {
    if (action.includes('login')) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (action.includes('denied') || action.includes('suspended')) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (action.includes('create')) return <TrendingUp className="w-4 h-4 text-blue-400" />;
    if (action.includes('access')) return <Shield className="w-4 h-4 text-violet-400" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            সিস্টেম কন্ট্রোল ড্যাশবোর্ড
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage platform operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-300">
            <Lock className="w-3 h-3" />
            <span>Last sync: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.titleEn}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "bg-white border cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
                stat.borderColor
              )}
              onClick={stat.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">{stat.title}</p>
                    <p className="text-xs text-gray-500">{stat.titleEn}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              দ্রুত কার্যক্রম
            </CardTitle>
            <CardDescription className="text-gray-600">
              Quick Actions — Common tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-between bg-primary hover:bg-primary/90 text-white font-medium"
              onClick={() => router.push(SECURE_PATHS.markets)}
            >
              <span>🏪 Create New Market</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => router.push('/sys-cmd-7x9k2/events')}
            >
              <span>➕ Create New Event</span>
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => router.push(SECURE_PATHS.users)}
            >
              <span>👥 Review User Applications</span>
              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                {stats.pendingReviews}
              </Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => router.push(SECURE_PATHS.users)}
            >
              <span>🚫 Manage Suspended Accounts</span>
              <Badge className={cn(
                stats.suspendedUsers > 0
                  ? "bg-red-100 text-red-700 border-red-300"
                  : "bg-gray-200 text-gray-700 border-gray-300"
              )}>
                {stats.suspendedUsers}
              </Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => router.push(SECURE_PATHS.markets)}
            >
              <span>📊 View All Markets</span>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                {stats.totalMarkets}
              </Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              পেন্ডিং রিভিউ
            </CardTitle>
            <CardDescription className="text-gray-600">
              Pending Reviews — Items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">📋 Market Legal Reviews</span>
                <span className="text-gray-900 font-semibold">{stats.pendingReviews}</span>
              </div>
              <Progress value={Math.min(stats.pendingReviews * 10, 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">🎫 Support Tickets</span>
                <span className="text-gray-900 font-semibold">{stats.supportTickets}</span>
              </div>
              <Progress value={Math.min(stats.supportTickets * 10, 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">✅ User Verifications</span>
                <span className="text-gray-900 font-semibold">{stats.pendingReviews}</span>
              </div>
              <Progress value={Math.min(stats.pendingReviews * 10, 100)} className="h-2" />
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total pending items</span>
                <span className="text-amber-600 font-bold">
                  {stats.pendingReviews + stats.supportTickets}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              সাম্প্রতিক কার্যকলাপ
            </CardTitle>
            <CardDescription className="text-gray-600">
              Recent Activity — Latest admin actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-auto pr-1">
              {recentActivity.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400">Actions will appear here</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatAction(activity.action)}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {activity.resource || 'system'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            সিস্টেম স্বাস্থ্য
            <span className="text-sm font-normal text-gray-600 ml-2">System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Database className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Database</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <p className="text-sm text-emerald-700">Connected</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">Supabase PostgreSQL</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Server className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">API Services</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <p className="text-sm text-emerald-700">Operational</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">All endpoints active</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Security</span>
              </div>
              <div className="flex items-center gap-2">
                {stats.securityAlerts > 0 ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                    <p className="text-sm text-amber-700">{stats.securityAlerts} alerts</p>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <p className="text-sm text-emerald-700">No threats</p>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">RLS enforced</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-violet-200 cursor-pointer hover:border-violet-400 transition-colors" onClick={() => router.push('/sys-cmd-7x9k2/workflows')}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Workflow className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Workflows</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <p className="text-sm text-emerald-700">Manage</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">QStash Cron Jobs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QStash Workflow Manager Section */}
      <QStashWorkflowManager />
    </div>
  );
}
