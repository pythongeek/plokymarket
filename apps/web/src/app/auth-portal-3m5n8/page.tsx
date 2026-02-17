'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
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

  // Use shared Supabase client
  const [supabase] = useState(() => createClient());

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();

        if (sessionError) {
          console.log('No existing session:', sessionError.message);
          return;
        }

        if (user) {
          console.log('Existing session found, verifying admin...');

          // Use direct REST API to avoid Supabase client AbortSignal issues
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          const session = await supabase.auth.getSession();
          const accessToken = session.data.session?.access_token;

          if (!supabaseUrl || !anonKey || !accessToken) {
            console.error('Missing credentials for profile fetch');
            return;
          }

          try {
            const response = await fetchWithTimeout(
              `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}&select=is_admin,is_super_admin`,
              {
                headers: {
                  'apikey': anonKey,
                  'Authorization': `Bearer ${accessToken}`,
                },
              },
              8000  // Increased timeout to 8 seconds
            );

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const profile = data[0];

            if (profile?.is_admin || profile?.is_super_admin) {
              console.log('Admin verified, redirecting...');
              router.replace(redirectTo);
            } else {
              console.log('User is not admin, staying on login page');
              await supabase.auth.signOut();
            }
          } catch (fetchErr) {
            console.error('Profile fetch error:', fetchErr);
            // Don't redirect on fetch error, let user try login
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
          console.error('Session check error:', err);
        }
        // Don't redirect on session check error, let user try login
      }
    };
    checkSession();
  }, [router, redirectTo, supabase]);

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
      // Validate credentials before attempting login
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      console.log('Attempting login for:', email);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(authError.message || 'Authentication failed');
      }

      if (!authData?.user) {
        throw new Error('No user returned from authentication');
      }

      const user = authData.user;
      console.log('Login successful, user ID:', user.id);

      // Verify admin status via server API which uses server-side credentials
      let profile: any = null;

      try {
        console.log('Verifying admin via server API...');
        const resp = await fetchWithTimeout('/api/admin/verify', { method: 'GET', credentials: 'include' }, 12000);

        if (resp.status === 401) {
          await supabase.auth.signOut();
          throw new Error('Unauthorized. Please login again.');
        }

        if (resp.status === 403) {
          // If forbidden, attempt an ensure-admin flow for the special admin email
          if (user.email === 'admin@plokymarket.bd') {
            try {
              const ensure = await fetchWithTimeout('/api/admin/ensure-admin', { method: 'POST', credentials: 'include' }, 12000);
              if (ensure.ok) {
                profile = await ensure.json();
                console.log('Ensure-admin created profile:', profile);
              } else {
                const body = await ensure.text().catch(() => '');
                console.error('Ensure-admin failed', ensure.status, body);
              }
            } catch (e) {
              console.error('Ensure-admin error:', e);
            }
          }

          // Re-check verification if ensure-admin attempted
          if (!profile) {
            const retry = await fetchWithTimeout('/api/admin/verify', { method: 'GET', credentials: 'include' }, 12000);
            if (retry.ok) {
              const payload = await retry.json();
              profile = { is_admin: payload.isAdmin, is_super_admin: payload.isSeniorCounsel ?? false, full_name: payload.fullName, email: payload.email };
            }
          }

          if (!profile) {
            throw new Error('Access denied. Admin privileges required.');
          }
        } else if (!resp.ok) {
          const body = await resp.text().catch(() => '');
          throw new Error(`Admin verify failed: ${resp.status} ${body}`);
        } else {
          const payload = await resp.json();
          if (payload?.isAdmin) {
            profile = { is_admin: true, is_super_admin: payload.isSeniorCounsel ?? false, full_name: payload.fullName, email: payload.email };
          } else {
            await supabase.auth.signOut();
            throw new Error('Access denied. Admin privileges required.');
          }
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
        console.warn('Non-admin user attempted access:', user.id, 'Profile:', profile);

        // Log unauthorized attempt
        try {
          await supabase.from('admin_audit_log').insert({
            action: 'admin_login_denied',
            user_id: user.id,
            resource: 'auth-portal',
            details: { reason: 'not_admin', profile },
          });
        } catch (e) {
          console.error('Audit log error:', e);
        }

        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      console.log('Admin verified, level:', profile.is_super_admin ? 'super' : 'admin');

      // Log successful login
      try {
        await supabase.from('admin_audit_log').insert({
          action: 'admin_login_success',
          user_id: user.id,
          resource: 'auth-portal',
          details: {
            admin_level: profile.is_super_admin ? 'super' : 'admin',
            redirect_to: redirectTo,
          },
        });
      } catch (e) {
        console.error('Audit log error:', e);
      }

      // Redirect to requested page or admin dashboard
      console.log('Redirecting to:', redirectTo);
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
                Session ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
