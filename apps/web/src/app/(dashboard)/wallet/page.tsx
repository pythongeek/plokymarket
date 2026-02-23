'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Smartphone,
  Building2,
  Clock,
  CheckCircle2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import { DepositForm } from '@/components/wallet/DepositForm';
import { WithdrawalForm } from '@/components/wallet/WithdrawalForm';
import { P2PRateDisplay } from '@/components/wallet/P2PRateDisplay';
import { ExchangeRateBadge } from '@/components/ExchangeRateBadge';


function TransactionList({ transactions }: { transactions: any[] }) {
  const { t, i18n } = useTranslation();

  const getLocale = () => {
    return i18n.language === 'bn' ? bn : undefined;
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: t('wallet.deposit'),
      withdrawal: t('wallet.withdraw'),
      trade_buy: t('common.trade') + ' (Buy)',
      trade_sell: t('common.trade') + ' (Sell)',
      settlement: 'Settlement',
    };
    return labels[type] || type.replace('_', ' ');
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <WalletIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('wallet.no_transactions')}</h3>
          <p className="text-muted-foreground">{t('wallet.transaction_history_here')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    txn.type === 'deposit' && 'bg-green-500/10',
                    txn.type === 'withdrawal' && 'bg-red-500/10',
                    txn.type === 'trade_buy' && 'bg-amber-500/10',
                    txn.type === 'trade_sell' && 'bg-blue-500/10',
                    txn.type === 'settlement' && 'bg-purple-500/10'
                  )}
                >
                  {txn.type === 'deposit' && <ArrowDownLeft className="h-5 w-5 text-green-500" />}
                  {txn.type === 'withdrawal' && <ArrowUpRight className="h-5 w-5 text-red-500" />}
                  {txn.type === 'trade_buy' && <TrendingUp className="h-5 w-5 text-amber-500" />}
                  {txn.type === 'trade_sell' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                  {txn.type === 'settlement' && <CheckCircle2 className="h-5 w-5 text-purple-500" />}
                </div>
                <div>
                  <div className="font-medium">{getTransactionTypeLabel(txn.type)}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(txn.created_at), 'MMM d, yyyy h:mm a', { locale: getLocale() })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn('font-semibold', (txn.amount || 0) > 0 ? 'text-green-500' : 'text-red-500')}>
                  {(txn.amount || 0) > 0 ? '+' : ''}৳{Math.abs(txn.amount || 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('wallet.balance_after')}: ৳{Number(txn.balance_after || 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WalletPage() {
  const { isAuthenticated, currentUser: user, wallet, transactions, fetchWallet, fetchTransactions } = useStore();
  const { t } = useTranslation();
  const [kycGate, setKycGate] = useState<{
    needs_kyc: boolean;
    reason: string;
    kyc_status: string;
    total_withdrawn: number;
    threshold: number;
    remaining?: number;
    override_type?: string;
  } | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'deposit' | 'withdraw'>('overview');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };


  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
      fetchTransactions();
      // Check KYC gate
      fetch('/api/kyc/check')
        .then(r => r.ok ? r.json() : null)
        .then(data => data && setKycGate(data))
        .catch(() => { });
    }
  }, [isAuthenticated, fetchWallet, fetchTransactions]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('common.login_required')}</h2>
        <p className="text-muted-foreground mb-6">{t('wallet.login_to_view')}</p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">{t('common.login')}</Button>
          </Link>
          <Link href="/register">
            <Button>{t('common.get_started')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalBalance = (wallet?.balance || 0) + (wallet?.locked_balance || 0);
  const availableBalance = wallet?.balance || 0;
  const lockedBalance = wallet?.locked_balance || 0;

  // Filter transactions
  const deposits = transactions.filter((t) => t.type === 'deposit');
  const withdrawals = transactions.filter((t) => t.type === 'withdrawal');
  const trades = transactions.filter((t) => t.type === 'trade_buy' || t.type === 'trade_sell');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('wallet.title')}</h1>
        <p className="text-muted-foreground">{t('wallet.subtitle')}</p>
      </div>

      {/* Real-time Exchange Rates */}
      <div className="flex flex-wrap items-center gap-4">
        <P2PRateDisplay showCalculator />
        <div className="flex-1 flex justify-end">
          <ExchangeRateBadge />
        </div>
      </div>

      {/* Smart Withdraw Limits Progress Bar */}
      {kycGate && (
        <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                  উইথড্রাল লিমিট / Withdrawal Limit
                </span>
              </div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-500">
                ৳{Number(kycGate.total_withdrawn || 0).toLocaleString()} / ৳{Number(kycGate.threshold || 0).toLocaleString()}
              </span>
            </div>
            <Progress
              value={(Number(kycGate.total_withdrawn || 0) / Number(kycGate.threshold || 1)) * 100}
              className="h-2 bg-amber-200 dark:bg-amber-900/40"
            />
            <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-2">
              আপনার বর্তমান KYC লেভেলে আপনি দৈনিক সর্বোচ্চ ৳{Number(kycGate.threshold || 0).toLocaleString()} তুলতে পারবেন।
              {kycGate.kyc_status !== 'verified' && (
                <> লিট বাড়াতে <Link href="/kyc" className="underline font-bold">এখানে ক্লিক করে KYC সম্পন্ন করুন</Link>।</>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Governance & Compliance Alerts */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Governance & Compliance Alerts */}
        {(user?.account_status === 'dormant' || (user as any)?.id_expiry) && (
          <div className="space-y-3">
            {user?.account_status === 'dormant' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start"
              >
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-800">অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় (Dormant)</h3>
                  <p className="text-sm text-amber-700">
                    আপনি ৯০ দিনের বেশি সময় লগ-ইন না করায় আপনার অ্যাকাউন্টটি নিরাপত্তার জন্য নিষ্ক্রিয় করা হয়েছে। অ্যাকাউন্টের পূর্ণ সুবিধা পেতে ইমেইল ভেরিফিকেশন করুন।
                  </p>
                </div>
              </motion.div>
            )}

            {(() => {
              if (!(user as any)?.id_expiry) return null;

              const expiryDate = new Date((user as any).id_expiry);
              if (isNaN(expiryDate.getTime())) return null; // Safe check for invalid date strings

              const daysRemaining = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

              if (daysRemaining > 30) return null;

              return (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start"
                >
                  <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-800">কেওয়াইসি (KYC) মেয়াদ শেষ হতে চলেছে</h3>
                    <p className="text-sm text-red-700">
                      আপনার এনআইডি বা পাসপোর্টের মেয়ার আগামী {daysRemaining} দিনের মধ্যে শেষ হবে। নিরবচ্ছিন্ন সেবার জন্য ডকুমেন্ট আপডেট করুন।
                    </p>
                    <Button variant="outline" size="sm" className="mt-2 border-red-200 hover:bg-red-100 text-red-700" asChild>
                      <Link href="/portfolio">আপডেট করুন</Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </motion.div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-primary-foreground/80">{t('wallet.total_balance')}</div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <WalletIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold">৳{Number(totalBalance || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-muted-foreground">{t('wallet.available')}</div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-500">৳{Number(availableBalance || 0).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-muted-foreground">{t('wallet.locked_in_orders')}</div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-500">৳{Number(lockedBalance || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Automated Nudge for Unfilled Orders */}
      {lockedBalance > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">অর্ডার ম্যাচ হচ্ছে না? / Order not matching?</p>
            <p className="text-xs text-muted-foreground mt-1">
              আপনার ৳{Number(lockedBalance || 0).toLocaleString()} বর্তমানে অর্ডারগুলোতে লক করা আছে। যদি আপনার অর্ডার ম্যাচ না হয়, তবে মার্কেটের বর্তমান প্রাইস চেক করুন এবং প্রয়োজনে অর্ডার বাতিল করে নতুন প্রাইসে প্লেস করুন।
            </p>
            <Link href="/portfolio">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-2 underline">
                আপনার ওপেন অর্ডার গুলো দেখুন / View your open orders
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          size="lg"
          className="gap-2"
          variant={activeView === 'deposit' ? 'default' : 'outline'}
          onClick={() => setActiveView(activeView === 'deposit' ? 'overview' : 'deposit')}
        >
          <ArrowDownLeft className="h-5 w-5" />
          {t('wallet.deposit')}
        </Button>
        {kycGate?.needs_kyc ? (
          <Link href="/kyc">
            <Button size="lg" variant="outline" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30">
              <ShieldAlert className="h-5 w-5" />
              KYC প্রয়োজন / KYC Required
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            variant={activeView === 'withdraw' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setActiveView(activeView === 'withdraw' ? 'overview' : 'withdraw')}
          >
            <ArrowUpRight className="h-5 w-5" />
            {t('wallet.withdraw')}
          </Button>
        )}
        <Link href="/markets">
          <Button size="lg" variant="secondary" className="gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('wallet.trade')}
          </Button>
        </Link>
      </div>

      {/* Dynamic View Area: Deposit / Withdraw Forms */}
      {activeView === 'deposit' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <DepositForm onSuccess={() => setActiveView('overview')} />
        </motion.div>
      )}

      {activeView === 'withdraw' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <WithdrawalForm onSuccess={() => setActiveView('overview')} />
        </motion.div>
      )}

      {/* Payment Methods (Hidden when form active) */}
      {activeView === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('wallet.payment_methods')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                onClick={() => setActiveView('deposit')}
              >
                <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <div className="font-semibold">bKash</div>
                  <div className="text-sm text-muted-foreground">{t('wallet.instant_deposit')}</div>
                </div>
              </div>

              <div
                className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                onClick={() => setActiveView('deposit')}
              >
                <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold">Nagad</div>
                  <div className="text-sm text-muted-foreground">{t('wallet.instant_deposit')}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold">Bank Transfer</div>
                  <div className="text-sm text-muted-foreground">{t('wallet.business_days')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t('common.all')} ({transactions.length})</TabsTrigger>
          <TabsTrigger value="deposits">{t('wallet.deposits')} ({deposits.length})</TabsTrigger>
          <TabsTrigger value="withdrawals">{t('wallet.withdrawals')} ({withdrawals.length})</TabsTrigger>
          <TabsTrigger value="trades">{t('wallet.trades')} ({trades.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TransactionList transactions={transactions} />
        </TabsContent>

        <TabsContent value="deposits">
          <TransactionList transactions={deposits} />
        </TabsContent>

        <TabsContent value="withdrawals">
          <TransactionList transactions={withdrawals} />
        </TabsContent>

        <TabsContent value="trades">
          <TransactionList transactions={trades} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
