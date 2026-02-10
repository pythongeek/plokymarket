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

// Secure admin paths mapping
const SECURE_PATHS = {
  admin: '/sys-cmd-7x9k2',
  users: '/usr-mgmt-4p7q1',
  markets: '/mkt-ctl-8v2w4',
  analytics: '/analytics-9x3y5',
};

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

  const supabase = createClient();

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Verify admin status
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin, is_super_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin || profile?.is_super_admin) {
          router.replace(redirectTo);
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
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!user) {
        throw new Error('Authentication failed');
      }

      // Verify admin status
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin, status')
        .eq('id', user.id)
        .single();

      if (profileError || (!profile?.is_admin && !profile?.is_super_admin)) {
        // Log unauthorized attempt
        await supabase.from('admin_audit_log').insert({
          action: 'admin_login_denied',
          user_id: user.id,
          resource: 'auth-portal',
          details: { reason: 'not_admin' },
        });
        
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      if (profile.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('Account suspended. Contact super admin.');
      }

      // Log successful login
      await supabase.from('admin_audit_log').insert({
        action: 'admin_login_success',
        user_id: user.id,
        resource: 'auth-portal',
        details: { 
          admin_level: profile.is_super_admin ? 'super' : 'admin',
          redirect_to: redirectTo,
        },
      });

      // Redirect to requested page or admin dashboard
      router.replace(redirectTo);

    } catch (err: any) {
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
