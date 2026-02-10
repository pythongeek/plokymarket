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
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Secure paths - consolidated under /sys-cmd-7x9k2
const SECURE_PATHS = {
  dashboard: '/sys-cmd-7x9k2',
  users: '/sys-cmd-7x9k2/users',
  markets: '/sys-cmd-7x9k2/markets',
  analytics: '/analytics-9x3y5',
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

    } catch (err) {
      console.error('Auth check error:', err);
      router.replace('/auth-portal-3m5n8');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      // Fetch pending market reviews
      const { count: pendingMarkets } = await supabase
        .from('market_creation_drafts')
        .select('*', { count: 'exact' })
        .eq('status', 'legal_review');

      // Fetch user support tickets
      const { count: supportTickets } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .eq('status', 'open');

      const totalAlerts = (pendingMarkets || 0) + (supportTickets || 0);
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
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-950">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-white tracking-tight">
                SYS-CMD
              </span>
              <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                {admin.is_super_admin ? 'SUPER ADMIN' : 'ADMIN'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              {systemStatus === 'healthy' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
              {systemStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
              {systemStatus === 'critical' && <Activity className="w-4 h-4 text-red-500" />}
              <span className={cn(
                "text-xs font-medium",
                systemStatus === 'healthy' && 'text-emerald-500',
                systemStatus === 'warning' && 'text-amber-500',
                systemStatus === 'critical' && 'text-red-500',
              )}>
                {systemStatus.toUpperCase()}
              </span>
              {pendingAlerts > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {pendingAlerts}
                </Badge>
              )}
            </div>

            <div className="text-sm text-slate-400">
              {admin.email}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] border-r border-slate-800 bg-slate-900/30 p-4">
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
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex flex-col items-start">
                    <span>{item.label}</span>
                    <span className="text-[10px] opacity-60">{item.labelEn}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Security Notice */}
          <div className="mt-8 p-4 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-xs text-slate-400">
                <p className="font-medium text-slate-300 mb-1">Secure Session</p>
                <p>All actions are logged and monitored.</p>
                <p className="mt-1 text-slate-500">
                  Session: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
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
