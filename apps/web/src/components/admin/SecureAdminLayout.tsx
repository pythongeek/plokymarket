'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Shield,
  Users,
  TrendingUp,
  BarChart3,
  LogOut,
  Activity,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Gavel,
  ShieldCheck,
  Settings,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Secure paths - consolidated under /sys-cmd-7x9k2
const SECURE_PATHS = {
  dashboard: '/sys-cmd-7x9k2',
  users: '/sys-cmd-7x9k2/users',
  markets: '/sys-cmd-7x9k2/markets',
  events: '/sys-cmd-7x9k2/events',
  resolution: '/sys-cmd-7x9k2/resolution',
  resolutions: '/sys-cmd-7x9k2/resolutions',
  analytics: '/sys-cmd-7x9k2/analytics',
  kyc: '/sys-cmd-7x9k2/kyc',
  p2p: '/sys-cmd-7x9k2/p2p',
  depositSettings: '/sys-cmd-7x9k2/deposit-settings',
  dailyTopics: '/sys-cmd-7x9k2/daily-topics',
  aiConfigs: '/sys-cmd-7x9k2/ai-configs',
  workflows: '/sys-cmd-7x9k2/workflows',
};

interface AdminUser {
  id: string;
  email: string;
  is_super_admin: boolean;
  last_login?: string;
}

export function SecureAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [pendingAlerts, setPendingAlerts] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace('/auth-portal-3m5n8?redirect=' + pathname);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin, email')
        .eq('id', user.id)
        .single();

      if (profileError || (!profile?.is_admin && !profile?.is_super_admin)) {
        await supabase.auth.signOut();
        router.replace('/auth-portal-3m5n8');
        return;
      }

      setAdmin({
        id: user.id,
        email: profile.email || user.email || '',
        is_super_admin: profile.is_super_admin || false,
        last_login: new Date().toISOString(),
      });

      // Log admin session
      await supabase.from('admin_audit_log').insert({
        action: 'admin_page_access',
        user_id: user.id,
        resource: pathname,
      });

    } catch (err: any) {
      if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
        console.error('Auth check error:', err);
        router.replace('/auth-portal-3m5n8');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      let pendingMarkets = 0;
      let supportTickets = 0;

      // Graceful: market_creation_drafts may not exist
      try {
        const { count, error } = await supabase
          .from('market_creation_drafts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'legal_review');
        if (!error) pendingMarkets = count || 0;
      } catch { /* table may not exist */ }

      // Graceful: support_tickets may not exist
      try {
        const { count, error } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        if (!error) supportTickets = count || 0;
      } catch { /* table may not exist */ }

      const totalAlerts = pendingMarkets + supportTickets;
      setPendingAlerts(totalAlerts);

      if (totalAlerts > 10) {
        setSystemStatus('critical');
      } else if (totalAlerts > 5) {
        setSystemStatus('warning');
      } else {
        setSystemStatus('healthy');
      }
    } catch (err) {
      console.error('Failed to fetch system status:', err);
    }
  };

  const handleLogout = async () => {
    try {
      if (admin) {
        await supabase.from('admin_audit_log').insert({
          action: 'admin_logout',
          user_id: admin.id,
          resource: 'system',
        });
      }

      await supabase.auth.signOut();
      toast({ title: 'Logged out', description: 'Admin session terminated' });
      router.replace('/auth-portal-3m5n8');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    {
      path: SECURE_PATHS.dashboard,
      label: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: Shield,
      requiresSuper: false,
    },
    {
      path: SECURE_PATHS.markets,
      label: 'মার্কেট কন্ট্রোল',
      labelEn: 'Market Control',
      icon: TrendingUp,
      requiresSuper: false,
    },
    {
      path: SECURE_PATHS.users,
      label: 'ব্যবহারকারী ব্যবস্থাপনা',
      labelEn: 'User Management',
      icon: Users,
      requiresSuper: false,
    },
    {
      path: SECURE_PATHS.analytics,
      label: 'বিশ্লেষণ',
      labelEn: 'Analytics',
      icon: BarChart3,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.events,
      label: 'ইভেন্ট তালিকা',
      labelEn: 'Events',
      icon: Calendar,
      requiresSuper: false,
    },
    {
      path: SECURE_PATHS.resolution,
      label: 'রেজোলিউশন',
      labelEn: 'Resolution',
      icon: Gavel,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.resolutions,
      label: 'রেজোলিউশন সিস্টেম',
      labelEn: 'Resolution System',
      icon: Gavel,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.dailyTopics,
      label: 'দৈনিক টপিক্স',
      labelEn: 'Daily Topics',
      icon: Calendar,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.aiConfigs,
      label: 'AI কনফিগ',
      labelEn: 'AI Configs',
      icon: Settings,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.kyc,
      label: 'KYC যাচাইকরণ',
      labelEn: 'KYC Verification',
      icon: ShieldCheck,
      requiresSuper: false,
    },
    {
      path: SECURE_PATHS.p2p,
      label: 'P2P ব্যবস্থাপনা',
      labelEn: 'P2P Management',
      icon: TrendingUp,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.depositSettings,
      label: 'ডিপোজিট সেটিংস',
      labelEn: 'Deposit Settings',
      icon: Settings,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.workflows,
      label: 'ওয়ার্কফ্লো',
      labelEn: 'Workflows',
      icon: Workflow,
      requiresSuper: true,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                SYS-CMD
              </span>
              <Badge variant="outline" className={cn(
                "text-xs font-semibold",
                admin.is_super_admin
                  ? "border-amber-400 text-amber-700 bg-amber-50"
                  : "border-primary bg-primary/10"
              )}>
                {admin.is_super_admin ? '⭐ SUPER ADMIN' : '🛡️ ADMIN'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-300">
              {systemStatus === 'healthy' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
              {systemStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {systemStatus === 'critical' && <Activity className="w-4 h-4 text-red-600" />}
              <span className={cn(
                "text-xs font-medium",
                systemStatus === 'healthy' && 'text-emerald-700',
                systemStatus === 'warning' && 'text-amber-700',
                systemStatus === 'critical' && 'text-red-700',
              )}>
                {systemStatus.toUpperCase()}
              </span>
              {pendingAlerts > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {pendingAlerts}
                </Badge>
              )}
            </div>

            <div className="text-sm text-gray-700 font-medium">
              {admin.email}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r border-gray-200 bg-gray-50 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              if (item.requiresSuper && !admin.is_super_admin) return null;

              const isActive = pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/20 text-gray-900 border border-primary/30 shadow-sm shadow-primary/10'
                      : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-gray-500")} />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{item.label}</span>
                    <span className={cn("text-[10px]", isActive ? "text-gray-700" : "text-gray-500")}>{item.labelEn}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Security Notice */}
          <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-gray-900 mb-1">🔒 নিরাপদ সেশন</p>
                <p className="text-gray-700">All actions are logged and monitored.</p>
                <p className="mt-1 text-gray-600">
                  Session: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
