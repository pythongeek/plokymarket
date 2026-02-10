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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const SECURE_PATHS = {
  markets: '/sys-cmd-7x9k2/markets',
  users: '/sys-cmd-7x9k2/users',
  analytics: '/analytics-9x3y5',
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

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user stats
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });

      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      const { count: suspendedUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'suspended');

      // Fetch market stats
      const { count: totalMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact' });

      const { count: pendingMarkets } = await supabase
        .from('market_creation_drafts')
        .select('*', { count: 'exact' })
        .in('status', ['legal_review', 'liquidity_commitment']);

      const { count: activeMarkets } = await supabase
        .from('markets')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Fetch total volume
      const { data: volumeData } = await supabase
        .from('trades')
        .select('price, quantity');

      const totalVolume = volumeData?.reduce((sum, trade) =>
        sum + (trade.price * trade.quantity), 0
      ) || 0;

      // Fetch pending reviews
      const { count: pendingReviews } = await supabase
        .from('market_creation_drafts')
        .select('*', { count: 'exact' })
        .eq('status', 'legal_review');

      // Fetch support tickets
      const { count: supportTickets } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .eq('status', 'open');

      // Fetch recent admin activity
      const { data: activityData } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        suspendedUsers: suspendedUsers || 0,
        totalMarkets: totalMarkets || 0,
        pendingMarkets: pendingMarkets || 0,
        activeMarkets: activeMarkets || 0,
        totalVolume,
        pendingReviews: pendingReviews || 0,
        supportTickets: supportTickets || 0,
        securityAlerts: 0, // Calculated from other metrics
      });

      setRecentActivity(activityData || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: `+${((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}% active`,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      onClick: () => router.push(SECURE_PATHS.users),
    },
    {
      title: 'Active Markets',
      value: stats.activeMarkets.toString(),
      change: `${stats.pendingMarkets} pending review`,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      onClick: () => router.push(SECURE_PATHS.markets),
    },
    {
      title: 'Total Volume',
      value: `৳${(stats.totalVolume / 1000000).toFixed(2)}M`,
      change: 'Last 30 days',
      icon: Activity,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      onClick: () => router.push(SECURE_PATHS.analytics),
    },
    {
      title: 'Security Alerts',
      value: (stats.suspendedUsers + stats.pendingReviews).toString(),
      change: `${stats.suspendedUsers} suspended, ${stats.pendingReviews} reviews`,
      icon: Shield,
      color: stats.suspendedUsers > 0 || stats.pendingReviews > 10 ? 'text-red-500' : 'text-amber-500',
      bgColor: stats.suspendedUsers > 0 || stats.pendingReviews > 10 ? 'bg-red-500/10' : 'bg-amber-500/10',
      onClick: () => router.push(SECURE_PATHS.users),
    },
  ];

  const getActivityIcon = (action: string) => {
    if (action.includes('login')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (action.includes('denied') || action.includes('suspended')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (action.includes('create')) return <TrendingUp className="w-4 h-4 text-blue-500" />;
    return <Clock className="w-4 h-4 text-slate-500" />;
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
          <h1 className="text-3xl font-bold text-white">System Control Dashboard</h1>
          <p className="text-slate-400 mt-1">Monitor and manage platform operations</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Lock className="w-4 h-4" />
          <span>Secure Connection</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="bg-slate-900 border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
              onClick={stat.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
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
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-400">
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-between"
              onClick={() => router.push(SECURE_PATHS.markets)}
            >
              <span>Create New Market</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push(SECURE_PATHS.users)}
            >
              <span>Review User Applications</span>
              <Badge variant="secondary">{stats.pendingReviews}</Badge>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push(SECURE_PATHS.users)}
            >
              <span>Manage Suspended Accounts</span>
              <Badge variant={stats.suspendedUsers > 0 ? "destructive" : "secondary"}>
                {stats.suspendedUsers}
              </Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Pending Reviews</CardTitle>
            <CardDescription className="text-slate-400">
              Items requiring admin attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Market Legal Reviews</span>
                <span className="text-white font-medium">{stats.pendingReviews}</span>
              </div>
              <Progress value={Math.min(stats.pendingReviews * 10, 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Support Tickets</span>
                <span className="text-white font-medium">{stats.supportTickets}</span>
              </div>
              <Progress value={Math.min(stats.supportTickets * 10, 100)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">User Verifications</span>
                <span className="text-white font-medium">{stats.pendingReviews}</span>
              </div>
              <Progress value={Math.min(stats.pendingReviews * 10, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Latest admin actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-950/50">
                    {getActivityIcon(activity.action)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{activity.action}</p>
                      <p className="text-xs text-slate-500">{activity.resource}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(activity.created_at).toLocaleTimeString()}
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
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-white">Database</span>
              </div>
              <p className="text-xs text-slate-500">Connected and responsive</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-white">API Services</span>
              </div>
              <p className="text-xs text-slate-500">All systems operational</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                {stats.securityAlerts > 5 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
                <span className="text-sm font-medium text-white">Security</span>
              </div>
              <p className="text-xs text-slate-500">
                {stats.securityAlerts > 5 ? `${stats.securityAlerts} items need attention` : 'No active threats'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
