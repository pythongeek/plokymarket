'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { isAbortError } from '@/lib/utils';
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
  DollarSign,
  Wallet,
  CreditCard,
  CreditCard,
  ArrowLeftRight,
  History,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

// Secure paths - consolidated under /sys-cmd-7x9k2
const SECURE_PATHS = {
  dashboard: '/sys-cmd-7x9k2',
  users: '/sys-cmd-7x9k2/users',
  markets: '/sys-cmd-7x9k2/markets',
  events: '/sys-cmd-7x9k2/events',
  resolutions: '/sys-cmd-7x9k2/resolutions',
  analytics: '/sys-cmd-7x9k2/analytics',
  kyc: '/sys-cmd-7x9k2/kyc',
  p2p: '/sys-cmd-7x9k2/p2p',
  depositSettings: '/sys-cmd-7x9k2/deposit-settings',
  exchangeRateConfig: '/sys-cmd-7x9k2/exchange-rate',
  deposits: '/sys-cmd-7x9k2/deposits',
  dailyTopics: '/sys-cmd-7x9k2/daily-topics',
  aiConfigs: '/sys-cmd-7x9k2/ai-configs',
  workflows: '/sys-cmd-7x9k2/workflows',
  // Money Operator Paths
  moneyOperator: '/sys-cmd-7x9k2/usdt',
  moneyOperatorTransactions: '/sys-cmd-7x9k2/usdt/transactions',
  moneyOperatorSettings: '/sys-cmd-7x9k2/usdt/settings',
};

interface AdminUser {
  id: string;
  email: string;
  is_super_admin: boolean;
  last_login?: string;
}

export function SecureAdminLayout({
  children,
  initialAdmin = null
}: {
  children: React.ReactNode;
  initialAdmin?: AdminUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(initialAdmin);
  const [loading, setLoading] = useState(!initialAdmin);
  const [authError, setAuthError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [mounted, setMounted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    // If we have initialAdmin, we can skip the blocking check but still refresh in background
    if (initialAdmin) {
      setAdmin(initialAdmin);
      setLoading(false);
      // Optional: Verify in background without blocking UI
      checkAuth(true);
    } else {
      checkAuth(false);
    }

    // Run system status check in background (non-blocking)
    fetchSystemStatus().catch(() => { });
    const interval = setInterval(() => fetchSystemStatus().catch(() => { }), 30000);
    return () => clearInterval(interval);
  }, [initialAdmin]);

  const checkAuth = async (isBackground = false) => {
    try {
      console.log(`[AdminAuth] ${isBackground ? 'Refreshing' : 'Starting'} auth check...`);

      // Try getUser first, then fallback to getSession
      let user: any = null;
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        console.log('[AdminAuth] getUser failed, trying getSession...', userError?.message);
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user;
      } else {
        user = userData.user;
      }

      if (!user) {
        console.log('[AdminAuth] No authenticated user found');
        if (!isBackground) {
          setAuthError('Not authenticated. Please log in.');
          router.replace('/auth-portal-3m5n8?redirect=' + pathname);
        }
        return;
      }

      const userEmail = (user.email || '').toLowerCase();

      // FIRST: Check email-based admin whitelist (most reliable)
      const adminEmails = ['admin@plokymarket.bd', 'admin@polymarket.bd'];
      if (adminEmails.includes(userEmail)) {
        const adminData = {
          id: user.id,
          email: userEmail,
          is_super_admin: true,
          last_login: new Date().toISOString(),
        };
        setAdmin(adminData);
        if (!isBackground) setLoading(false);
        return;
      }

      // SECOND: Check user_profiles table for admin flags
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, is_admin, is_super_admin')
        .eq('id', user.id)
        .maybeSingle();

      const isAdmin = profile?.is_admin || profile?.is_super_admin;

      if (isAdmin) {
        const adminData = {
          id: user.id,
          email: profile?.email || userEmail,
          is_super_admin: profile?.is_super_admin || false,
          last_login: new Date().toISOString(),
        };
        setAdmin(adminData);
      } else {
        console.log('[AdminAuth] ❌ Access denied — not an admin');
        if (!isBackground) {
          setAuthError('Access denied. Admin privileges required.');
          await supabase.auth.signOut();
          router.replace('/auth-portal-3m5n8');
        }
      }

    } catch (err: any) {
      // Use centralized utility for AbortError handling
      if (isAbortError(err)) {
        console.log('[AdminAuth] Auth check aborted, likely due to navigation');
        return;
      }

      console.error('[AdminAuth] Auth check error:', err);
      if (!isBackground) {
        setAuthError('Authentication error: ' + (err?.message || 'Unknown error'));
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      let pendingMarkets = 0;
      let supportTickets = 0;

      // Check market_creation_drafts - use correct field name legal_review_status
      // This query may fail if table doesn't exist or RLS blocks access - handle gracefully
      try {
        const { count, error } = await supabase
          .from('market_creation_drafts')
          .select('*', { count: 'exact', head: true })
          .eq('legal_review_status', 'pending');

        if (error) {
          // Log but don't fail - RLS might block unauthenticated requests
          console.warn('market_creation_drafts query blocked by RLS:', error.message);
          pendingMarkets = 0;
        } else {
          pendingMarkets = count || 0;
        }
      } catch (err: any) {
        // Table may not exist or network error - graceful degradation
        console.warn('market_creation_drafts table unavailable:', err?.message);
        pendingMarkets = 0;
      }

      // support_tickets table doesn't exist in production — skip query to avoid 404 noise
      // supportTickets remains 0

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
      path: SECURE_PATHS.resolutions,
      label: 'মার্কেট রেজোলিউশন সিস্টেম',
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
      path: SECURE_PATHS.exchangeRateConfig,
      label: 'এক্সচেঞ্জ রেট',
      labelEn: 'Exchange Rate',
      icon: ArrowLeftRight,
      requiresSuper: true,
    },
    {
      path: SECURE_PATHS.deposits,
      label: 'ডিপোজিট ম্যানেজমেন্ট',
      labelEn: 'Deposits',
      icon: DollarSign,
      requiresSuper: false,
    },
    {
      path: SECURE_PATHS.workflows,
      label: 'সিস্টেম ক্রন জবস',
      labelEn: 'System Cron Jobs',
      icon: Activity,
      requiresSuper: true,
    },
    // Money Operator Section
    {
      path: SECURE_PATHS.moneyOperator,
      label: 'Money Operator',
      labelEn: 'Money Operator',
      icon: Wallet,
      requiresSuper: false,
      isSection: true,
    },
    {
      path: SECURE_PATHS.moneyOperator,
      label: 'USDT ড্যাশবোর্ড',
      labelEn: 'USDT Dashboard',
      icon: DollarSign,
      requiresSuper: false,
    },

    {
      path: SECURE_PATHS.moneyOperatorTransactions,
      label: 'ট্রানজেকশন লগ',
      labelEn: 'Transactions',
      icon: History,
      requiresSuper: false,
    },
    {
      path: SECURE_PATHS.moneyOperatorSettings,
      label: 'রেট সেটিংস',
      labelEn: 'Rate Settings',
      icon: ArrowLeftRight,
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

  if (!admin) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Admin Access Required</h2>
          <p className="text-gray-500 mt-2">{authError || 'Verifying admin permissions...'}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setLoading(true); setAuthError(null); checkAuth(); }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
          >
            Retry
          </button>
          <button
            onClick={() => router.replace('/auth-portal-3m5n8?redirect=' + pathname)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-gray-50 flex flex-col pt-12">
                <SheetTitle className="sr-only">এডমিন নেভিগেশন</SheetTitle>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <NavItemsList
                    navItems={navItems}
                    pathname={pathname}
                    router={router}
                    admin={admin}
                    mounted={mounted}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-gray-900 tracking-tight hidden sm:block">
                SYS-CMD
              </span>
              <Badge variant="outline" className={cn(
                "text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5",
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

            <div className="text-sm text-gray-700 font-medium hidden md:block">
              {admin.email}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 md:px-3"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-4rem)] border-r border-gray-200 bg-gray-50 overflow-y-auto custom-scrollbar">
          <div className="p-4 flex-1">
            <NavItemsList
              navItems={navItems}
              pathname={pathname}
              router={router}
              admin={admin}
              mounted={mounted}
            />
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

// Reusable Navigation List Component
function NavItemsList({ navItems, pathname, router, admin, mounted }: any) {
  return (
    <>
      <nav className="space-y-1">
        {navItems.map((item: any, index: number) => {
          if (item.requiresSuper && !admin.is_super_admin) return null;

          // Section header (like Money Operator)
          if (item.isSection) {
            return (
              <div key={item.path + index} className="mt-4 mb-2 px-3">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                <div className="h-px bg-gradient-to-r from-primary/50 to-transparent mt-2" />
              </div>
            );
          }

          const isActive = pathname === item.path || (item.path !== SECURE_PATHS.dashboard && pathname.startsWith(item.path));
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                'w-full flex items-center justify-start text-left gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/20 text-gray-900 border border-primary/30 shadow-sm shadow-primary/10'
                  : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-gray-500")} />
              <div className="flex flex-col items-start justify-center truncate overflow-hidden text-left w-full">
                <span className="font-semibold truncate w-full text-left text-ellipsis">{item.label}</span>
                <span className={cn("text-[10px] truncate w-full text-left", isActive ? "text-gray-700" : "text-gray-500")}>{item.labelEn}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Security Notice */}
      <div className="mt-8 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-gray-900 mb-1">🔒 নিরাপদ সেশন</p>
            <p className="text-gray-700 line-clamp-2">All actions are logged and authenticated.</p>
            <p className="mt-1 text-gray-600">
              Session: {mounted ? new Date().toLocaleTimeString('bn-BD') : '...'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

