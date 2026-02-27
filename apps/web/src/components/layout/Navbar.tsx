'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, LayoutDashboard, LogOut, User, Menu, X, Shield, Languages, PiggyBank, Search, Calculator, Newspaper, Trophy, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModeToggle } from '../mode-toggle';
import { NotificationBell } from './NotificationBell';
import { useEffect } from 'react';
import { Input } from '../ui/input';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  authOnly?: boolean;
}

export function Navbar() {
  const { currentUser, isAuthenticated, logout, wallet } = useStore();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const languages = [
    { code: 'bn', label: 'বাংলা', flag: 'BD' },
    { code: 'en', label: 'English', flag: 'US' },
    { code: 'hi', label: 'हिन्दी', flag: 'IN' }
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
  };

  const navItems = [
    { label: t('common.markets'), href: '/markets', icon: TrendingUp },
    { label: t('common.leaderboard'), href: '/leaderboard', icon: Trophy },
    { label: 'Levels', href: '/levels', icon: Crown },
    { label: t('common.news'), href: '/news', icon: Newspaper },
    { label: t('common.portfolio'), href: '/portfolio', icon: LayoutDashboard, authOnly: true },
    { label: t('common.wallet'), href: '/wallet', icon: Wallet, authOnly: true },
    { label: 'Verification', href: '/kyc', icon: Shield, authOnly: true },
  ];

  const isActive = (path: string) => pathname?.startsWith(path) || false;

  if (!hasHydrated) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
          <span className="text-xl font-bold font-display tracking-tight text-foreground hidden sm:block">Plokymarket</span>
        </Link>

        {/* Center Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex relative flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search_placeholder')}
            className="pl-10 h-10 bg-muted/50 border-none rounded-full focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-3">
          <ModeToggle />

          {isAuthenticated ? (
            <>
              {wallet && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    ৳{wallet.balance.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.href = '/portfolio'}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all overflow-hidden">
                    {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} alt={currentUser.full_name || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col">
                    <span className="text-sm font-bold leading-none">{currentUser?.full_name || 'User'}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                      {currentUser?.is_admin ? 'Admin' : 'Trader'}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="ml-2 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" asChild className="font-medium">
                  <Link href="/login">{t('auth.sign_in')}</Link>
                </Button>
                <Button asChild className="font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white">
                  <Link href="/register">{t('auth.create_account')}</Link>
                </Button>
              </div>
              <div className="md:hidden">
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Lang Switch */}
          <div className="flex gap-1 mr-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={() => changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')}>
              <Languages className="h-5 w-5" />
            </Button>
          </div>
          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-2">
            {navItems.map((item) => {
              if (item.authOnly && !isAuthenticated) return null;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                <LogOut className="h-5 w-5" />
                {t('common.logout')}
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">{t('common.login')}</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">{t('common.signup')}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
