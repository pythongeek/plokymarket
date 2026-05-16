'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Secure admin paths mapping - all routes under sys-cmd-7x9k2
const SECURE_PATHS = {
  admin: '/sys-cmd-7x9k2',
  users: '/sys-cmd-7x9k2/users',
  markets: '/sys-cmd-7x9k2/markets',
  analytics: '/sys-cmd-7x9k2/analytics',
};

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export default function SecureAuthPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || SECURE_PATHS.admin;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [securityCheck, setSecurityCheck] = useState(false);
  const [sessionId, setSessionId] = useState('--------');

  // Generate session ID client-side only to prevent hydration mismatch
  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 10).toUpperCase());
  }, []);

  // Check for existing session — with redirect-loop breaker
  useEffect(() => {
    const redirectCount = Number(sessionStorage.getItem('pm_auth_redirect_count') || '0');
    const lastRedirect = Number(sessionStorage.getItem('pm_auth_redirect_time') || '0');
    const now = Date.now();

    // Reset counter if > 30s since last redirect
    if (now - lastRedirect > 30000) {
      sessionStorage.setItem('pm_auth_redirect_count', '0');
    }

    // If we've been redirected > 2 times in 30s, we're in a loop — stop
    if (redirectCount >= 2) {
      setError('Authentication loop detected. Please clear cookies and try again, or contact support.');
      return;
    }

    const checkSession = async () => {
      try {
        const resp = await fetchWithTimeout('/api/auth/session', {
          credentials: 'include',
        }, 8000);

        if (resp.status === 200) {
          const data = await resp.json();
          if (data.user && (data.user.is_admin || data.user.is_super_admin)) {
            sessionStorage.setItem('pm_auth_redirect_count', String(redirectCount + 1));
            sessionStorage.setItem('pm_auth_redirect_time', String(now));
            router.replace(redirectTo);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
          console.error('Session check error:', err);
        }
      }
    };
    checkSession();
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockedUntil && lockedUntil > new Date()) {
      setError(`Account locked. Try again in ${Math.ceil((lockedUntil.getTime() - Date.now()) / 60000)} minutes.`);
      return;
    }

    if (!securityCheck) {
      setError('Please confirm security check.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      console.log('Attempting login for:', email);

      // Call local auth API instead of Supabase cloud
      const loginResp = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: 'include',
      }, 12000);

      const loginData = await loginResp.json();

      if (!loginResp.ok) {
        throw new Error(loginData.error || 'Authentication failed');
      }

      if (!loginData.user) {
        throw new Error('No user returned from authentication');
      }

      const user = loginData.user;
      console.log('Login successful, user ID:', user.id);

      // Verify admin via server-side session
      let profile: any = null;

      try {
        console.log('Verifying admin via server API...');
        const resp = await fetchWithTimeout('/api/auth/session', {
          credentials: 'include',
        }, 12000);

        if (resp.status === 401) {
          throw new Error('Unauthorized. Please login again.');
        }

        if (resp.status === 200) {
          const sessionData = await resp.json();
          if (sessionData.user?.is_admin || sessionData.user?.is_super_admin) {
            profile = {
              is_admin: sessionData.user.is_admin,
              is_super_admin: sessionData.user.is_super_admin,
              full_name: sessionData.user.full_name,
              email: sessionData.user.email,
            };
          }
        }

        if (!profile) {
          throw new Error('Access denied. Admin privileges required.');
        }
      } catch (err: any) {
        console.error('Profile verification error:', err);
        throw err;
      }

      if (!profile) {
        console.error('No profile found for user:', user.id);
        throw new Error('User profile not found. Please contact support.');
      }

      if (!profile.is_admin && !profile.is_super_admin) {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        throw new Error('Access denied. Admin privileges required.');
      }

      console.log('Admin verified, level:', profile.is_super_admin ? 'super' : 'admin');
      console.log('Redirecting to:', redirectTo);
      // Reset redirect loop counter on successful manual login
      sessionStorage.removeItem('pm_auth_redirect_count');
      sessionStorage.removeItem('pm_auth_redirect_time');
      router.replace(redirectTo);

    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        // Redirection might have happened, ignore
        return;
      }
      console.error('Login error:', err);

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        const lockTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        setLockedUntil(lockTime);
        setError('Too many failed attempts. Account locked for 15 minutes.');
      } else {
        setError(err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Secure Access Portal
              </CardTitle>
              <CardDescription className="text-slate-400">
                Authorized personnel only
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-950/50 border-red-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Administrator Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@plokymarket.com"
                  required
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                  disabled={loading || !!lockedUntil}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Secure Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 pr-10"
                    disabled={loading || !!lockedUntil}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="security-check"
                  checked={securityCheck}
                  onChange={(e) => setSecurityCheck(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-950 text-primary"
                />
                <Label htmlFor="security-check" className="text-sm text-slate-400 font-normal cursor-pointer">
                  I confirm this is an authorized administrative session and I am accessing from a secure location.
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !!lockedUntil}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Authenticate
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-500">
                This access portal is monitored and logged.
                <br />
                Unauthorized access attempts will be prosecuted.
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Session ID: {sessionId}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
