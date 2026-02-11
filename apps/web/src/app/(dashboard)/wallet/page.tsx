'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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
                <div className={cn('font-semibold', txn.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                  {txn.amount > 0 ? '+' : ''}৳{Math.abs(txn.amount).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('wallet.balance_after')}: ৳{txn.balance_after.toLocaleString()}
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
  const { isAuthenticated, wallet, transactions, fetchWallet, fetchTransactions } = useStore();
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

      {/* KYC Status Banner */}
      {kycGate && (
        <Card className={cn(
          'border',
          kycGate.kyc_status === 'verified'
            ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900'
            : kycGate.needs_kyc
              ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900'
              : 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900'
        )}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {kycGate.kyc_status === 'verified' ? (
                <ShieldCheck className="h-6 w-6 text-green-600" />
              ) : kycGate.needs_kyc ? (
                <ShieldAlert className="h-6 w-6 text-amber-600" />
              ) : (
                <Shield className="h-6 w-6 text-blue-600" />
              )}
              <div>
                {kycGate.kyc_status === 'verified' ? (
                  <p className="font-medium text-green-700 dark:text-green-400">
                    KYC যাচাইকৃত / KYC Verified ✓
                  </p>
                ) : kycGate.needs_kyc ? (
                  <>
                    <p className="font-medium text-amber-700 dark:text-amber-400">
                      উত্তোলনের জন্য KYC প্রয়োজন / KYC Required for Withdrawals
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {kycGate.reason === 'threshold_exceeded'
                        ? `আপনার মোট উত্তোলন ৳${kycGate.threshold.toLocaleString()} সীমা অতিক্রম করেছে / Total withdrawn exceeds ৳${kycGate.threshold.toLocaleString()} limit`
                        : kycGate.reason === 'admin_forced'
                          ? 'অ্যাডমিন দ্বারা KYC বাধ্যতামূলক / KYC mandated by admin'
                          : 'সব ব্যবহারকারীর জন্য KYC প্রয়োজন / KYC required for all users'}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-blue-700 dark:text-blue-400">
                      KYC ছাড়া উত্তোলন সীমা / KYC-Free Withdrawal Limit
                    </p>
                    <p className="text-sm text-muted-foreground">
                      বাকি আছে ৳{(kycGate.remaining || 0).toLocaleString()} / ৳{kycGate.threshold.toLocaleString()} —
                      Remaining: ৳{(kycGate.remaining || 0).toLocaleString()} of ৳{kycGate.threshold.toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>
            {kycGate.kyc_status !== 'verified' && (
              <Link href="/kyc">
                <Button size="sm" variant={kycGate.needs_kyc ? 'default' : 'outline'} className="gap-2">
                  <Shield className="h-4 w-4" />
                  {kycGate.needs_kyc ? 'KYC সম্পন্ন করুন / Complete KYC' : 'KYC শুরু করুন / Start KYC'}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

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
            <div className="text-3xl font-bold">৳{totalBalance.toLocaleString()}</div>
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
            <div className="text-3xl font-bold text-green-500">৳{availableBalance.toLocaleString()}</div>
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
            <div className="text-3xl font-bold text-amber-500">৳{lockedBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button size="lg" className="gap-2">
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
          <Button size="lg" variant="outline" className="gap-2">
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

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>{t('wallet.payment_methods')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
              <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <div className="font-semibold">bKash</div>
                <div className="text-sm text-muted-foreground">{t('wallet.instant_deposit')}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
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
