'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  User,
  Mail,
  Lock,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  validatePassword,
  validateEmail,
  sanitizeInput,
  registerRateLimiter,
} from '@/lib/security';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  const { register, loginWithGoogle } = useStore();
  const router = useRouter();
  const { t } = useTranslation();

  // Password strength validation
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordStrengthPercent = useMemo(() => {
    if (passwordValidation.strength === 'weak') return 33;
    if (passwordValidation.strength === 'medium') return 66;
    return 100;
  }, [passwordValidation.strength]);

  const getStrengthLabel = (strength: string) => {
    switch (strength) {
      case 'weak': return t('auth.password_weak');
      case 'medium': return t('auth.password_medium');
      case 'strong': return t('auth.password_strong');
      default: return strength;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check rate limit
    if (registerRateLimiter.isRateLimited('register')) {
      const remaining = registerRateLimiter.getRemainingTime('register');
      setRateLimitSeconds(remaining);
      setError(t('auth.too_many_attempts', { seconds: remaining }));
      return;
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(fullName.trim());
    const sanitizedEmail = email.trim().toLowerCase();

    // Validate email
    if (!validateEmail(sanitizedEmail)) {
      setError(t('auth.invalid_email'));
      return;
    }

    // Validate password strength
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    // Validation
    if (password !== confirmPassword) {
      setError(t('auth.passwords_not_match'));
      return;
    }

    if (!agreeTerms) {
      setError(t('auth.agree_terms_error'));
      return;
    }

    // Record attempt for rate limiting
    registerRateLimiter.recordAttempt('register');
    setIsLoading(true);

    try {
      const result = await register(sanitizedEmail, password, sanitizedName);
      if (result === true) {
        registerRateLimiter.reset('register');
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/markets');
        }, 1500);
      } else if (typeof result === 'string') {
        // Display the specific error message from Supabase
        setError(result);
      } else {
        setError(t('auth.registration_failed'));
      }
    } catch (err) {
      setError(t('auth.error_occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('auth.account_created')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('auth.welcome_redirect')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Plokymarket</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('auth.create_an_account')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.start_trading_today')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.full_name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t('auth.full_name_placeholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.create_strong_password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={passwordStrengthPercent}
                        className={`h-2 flex-1 ${passwordValidation.strength === 'weak' ? '[&>div]:bg-red-500' :
                          passwordValidation.strength === 'medium' ? '[&>div]:bg-yellow-500' :
                            '[&>div]:bg-green-500'
                          }`}
                      />
                      <span className={`text-xs font-medium ${passwordValidation.strength === 'weak' ? 'text-red-500' :
                        passwordValidation.strength === 'medium' ? 'text-yellow-500' :
                          'text-green-500'
                        }`}>
                        {getStrengthLabel(passwordValidation.strength)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{t('auth.password_hint')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.confirm_password_placeholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                  {t('auth.i_agree_to')}{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    {t('auth.terms')}
                  </Link>{' '}
                  {t('auth.and')}{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    {t('auth.privacy')}
                  </Link>
                  {t('auth.agree_terms_suffix')}
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  t('auth.creating_account')
                ) : (
                  <>
                    {t('auth.create_account')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('auth.or_continue_with')}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => loginWithGoogle()}
                disabled={isLoading}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="mr-2 h-4 w-4"
                />
                Sign up with Google
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {t('auth.already_have_account')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('auth.sign_in')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
