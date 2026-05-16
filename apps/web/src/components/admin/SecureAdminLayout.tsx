// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { isAbortError } from '@/lib/utils';

async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
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
  ArrowLeftRight,
  History,
  Menu,
  Zap,
  FolderOpen,
  FileText,
  BookOpen,
  MessageSquare,
  Star,
  Sparkles,
  Target,
  Send,
  Bot,
  BarChart,
  ChevronRight,
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
  monitoring: '/sys-cmd-7x9k2/monitoring',
  dailyTopics: '/sys-cmd-7x9k2/daily-topics',
  aiConfigs: '/sys-cmd-7x9k2/ai-configs',
  workflows: '/sys-cmd-7x9k2/workflows',
  // Money Operator Paths
  moneyOperator: '/sys-cmd-7x9k2/usdt',
  moneyOperatorTransactions: '/sys-cmd-7x9k2/usdt/transactions',
  moneyOperatorSettings: '/sys-cmd-7x9k2/usdt/settings',
  // New v2 features
  auditLog: '/sys-cmd-7x9k2/audit-log',
  comments: '/sys-cmd-7x9k2/comments',
  orderbook: '/sys-cmd-7x9k2/orderbook',
  categories: '/sys-cmd-7x9k2/categories',
  templates: '/sys-cmd-7x9k2/templates',
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

  // Keep Supabase browser client for auth methods only

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

      // FIRST: Try our custom session endpoint (reads sb-access-token cookie)
      // This MUST be checked first because middleware and login API use sb-access-token
      let user: any = null;
      try {
        const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.user) {
            user = sessionData.user;
            console.log('[AdminAuth] Session found via /api/auth/session');
          }
        }
      } catch (e) {
        console.log('[AdminAuth] /api/auth/session failed, falling back to Supabase...');
      }

      // FALLBACK: Try Supabase native session (for backward compatibility)
      if (!user) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.log('[AdminAuth] getUser failed, trying getSession...', userError?.message);
          const { data: sessionData } = await supabase.auth.getSession();
          user = sessionData?.session?.user;
        } else {
          user = userData.user;
        }
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
      const isSuperAdmin = user.is_super_admin || false;
      const isAdmin = user.is_admin || isSuperAdmin;

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

      // SECOND: If admin flags are in the session/user object, use them
      if (isAdmin) {
        const adminData = {
          id: user.id,
          email: userEmail,
          is_super_admin: isSuperAdmin,
          last_login: new Date().toISOString(),
        };
        setAdmin(adminData);
      } else {
        // THIRD: Check user_profiles table for admin flags (fallback)
        const profileRes = await fetch(`/api/admin/users/me?user_id=${user.id}`);
        const profileData = profileRes.ok ? await profileRes.json() : { data: null };
        const profile = profileData.data;

        const isProfileAdmin = profile?.is_admin || profile?.is_super_admin;
        if (isProfileAdmin) {
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
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
            router.replace('/auth-portal-3m5n8');
          }
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
        const statusRes = await fetch('/api/admin/system-status');
        const statusData = statusRes.ok ? await statusRes.json() : { pending_markets: 0 };
        pendingMarkets = statusData.pending_markets || 0;

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
        await adminFetch('/api/admin/users/me', {
          method: 'POST',
          body: JSON.stringify({ action: 'logout', user_id: admin.id })
        });
      }

      await supabase.auth.signOut();
      // Also clear the custom sb-access-token cookie
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
      toast({ title: 'Logged out', description: 'Admin session terminated' });
      router.replace('/auth-portal-3m5n8');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ─── Grouped Navigation Structure ─────────────────────────────────────────────
  type NavGroup = {
    title: string;
    titleBn?: string;
    icon: React.ElementType;
    items: {
      path: string;
      label: string;
      labelBn?: string;
      icon: React.ElementType;
      badge?: string;
      requiresSuper?: boolean;
    }[];
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      icon: BarChart3,
      items: [
        { path: SECURE_PATHS.dashboard, label: 'Dashboard', icon: Shield },
      ]
    },
    {
      title: 'Core Operations',
      icon: Target,
      items: [
        { path: SECURE_PATHS.markets, label: 'Market Control', icon: TrendingUp },
        { path: SECURE_PATHS.events, label: 'Events', icon: Calendar },
        { path: SECURE_PATHS.users, label: 'User Management', icon: Users },
        { path: SECURE_PATHS.categories, label: 'Categories', icon: FolderOpen },
        { path: SECURE_PATHS.templates, label: 'Templates', icon: FileText },
        { path: SECURE_PATHS.orderbook, label: 'Order Book', icon: BookOpen },
      ]
    },
    {
      title: 'Financial',
      icon: DollarSign,
      items: [
        { path: SECURE_PATHS.deposits, label: 'Deposits', icon: CreditCard },
        { path: SECURE_PATHS.withdrawals, label: 'Withdrawals', icon: Send },
        { path: SECURE_PATHS.moneyOperator, label: 'USDT Operations', icon: Wallet },
        { path: SECURE_PATHS.exchangeRateConfig, label: 'Exchange Rate', icon: ArrowLeftRight },
      ]
    },
    {
      title: 'Compliance',
      icon: ShieldCheck,
      items: [
        { path: SECURE_PATHS.kyc, label: 'KYC Verification', icon: ShieldCheck },
        { path: SECURE_PATHS.disputes, label: 'Disputes', icon: Gavel },
        { path: SECURE_PATHS.levels, label: 'User Levels', icon: Star },
        { path: SECURE_PATHS.comments, label: 'Comments', icon: MessageSquare },
        { path: SECURE_PATHS.auditLog, label: 'Audit Log', icon: Shield },
      ]
    },
    {
      title: 'Intelligence',
      icon: Bot,
      items: [
        { path: SECURE_PATHS.aiConfigs, label: 'AI Config', icon: Settings, requiresSuper: true, badge: '2 AI' },
        { path: SECURE_PATHS.dailyTopics, label: 'Daily Topics', icon: Sparkles, requiresSuper: true },
        { path: SECURE_PATHS.resolutions, label: 'Resolution System', icon: Gavel, requiresSuper: true },
      ]
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      items: [
        { path: SECURE_PATHS.analytics, label: 'Analytics', icon: Activity, requiresSuper: true },
        { path: SECURE_PATHS.monitoring, label: 'System Monitor', icon: Activity, requiresSuper: true },
        { path: SECURE_PATHS.workflows, label: 'Cron Jobs', icon: Zap, requiresSuper: true },
        { path: SECURE_PATHS.p2p, label: 'P2P Management', icon: TrendingUp, requiresSuper: true },
      ]
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
                    navGroups={navGroups}
                    pathname={pathname}
                    router={router}
                    admin={admin}
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
              navGroups={navGroups}
              pathname={pathname}
              router={router}
              admin={admin}
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

// Reusable Grouped Navigation List Component
function NavItemsList({ navGroups, pathname, router, admin }: {
  navGroups: NavGroup[];
  pathname: string;
  router: any;
  admin: any;
}) {
  return (
    <nav className="space-y-5">
      {navGroups.map((group, gi) => {
        const GroupIcon = group.icon;
        return (
          <div key={group.title}>
            {/* Section Header */}
            <div className="flex items-center gap-2 px-3 mb-2">
              <GroupIcon className="w-3.5 h-3.5 text-primary/60" />
              <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                {group.title}
              </span>
            </div>

            {/* Section Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                if (item.requiresSuper && !admin.is_super_admin) return null;

                const isActive = pathname === item.path ||
                  (item.path !== '/sys-cmd-7x9k2' && pathname.startsWith(item.path));
                const ItemIcon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={cn(
                      'w-full flex items-center justify-between text-left gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      isActive
                        ? 'bg-primary/15 text-primary font-semibold border border-primary/20'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ItemIcon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-gray-400")} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* AI Providers Status */}
      <div className="mt-4 px-3">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-3.5 h-3.5 text-primary/60" />
          <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">
            AI Providers
          </span>
        </div>
        <div className="space-y-1">
          {[
            { label: 'Vertex AI (Gemini)', color: 'blue', active: false },
            { label: 'MiniMax AI', color: 'violet', active: false },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                color === 'blue' ? "bg-blue-500" : "bg-violet-500"
              )} />
              <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
              <span className="ml-auto text-[10px] text-gray-400">Check</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-3 rounded-xl bg-blue-50 border border-blue-100">
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-[11px]">
            <p className="font-semibold text-gray-900 mb-0.5">Secure Session</p>
            <p className="text-gray-600">All admin actions are logged and audited.</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

