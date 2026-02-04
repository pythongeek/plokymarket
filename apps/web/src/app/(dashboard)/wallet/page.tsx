'use client';

import { useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function TransactionList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <WalletIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
          <p className="text-muted-foreground">Your transaction history will appear here</p>
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
                  <div className="font-medium capitalize">{txn.type.replace('_', ' ')}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(txn.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn('font-semibold', txn.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                  {txn.amount > 0 ? '+' : ''}৳{Math.abs(txn.amount).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Balance: ৳{txn.balance_after.toLocaleString()}
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
      fetchTransactions();
    }
  }, [isAuthenticated, fetchWallet, fetchTransactions]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">Please login to view your wallet</p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
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
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your funds and view transaction history</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-primary-foreground/80">Total Balance</div>
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
              <div className="text-muted-foreground">Available</div>
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
              <div className="text-muted-foreground">Locked in Orders</div>
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
          Deposit
        </Button>
        <Button size="lg" variant="outline" className="gap-2">
          <ArrowUpRight className="h-5 w-5" />
          Withdraw
        </Button>
        <Link href="/markets">
          <Button size="lg" variant="secondary" className="gap-2">
            <TrendingUp className="h-5 w-5" />
            Trade
          </Button>
        </Link>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
              <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <div className="font-semibold">bKash</div>
                <div className="text-sm text-muted-foreground">Instant deposit</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="font-semibold">Nagad</div>
                <div className="text-sm text-muted-foreground">Instant deposit</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <div className="font-semibold">Bank Transfer</div>
                <div className="text-sm text-muted-foreground">1-2 business days</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
          <TabsTrigger value="deposits">Deposits ({deposits.length})</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
          <TabsTrigger value="trades">Trades ({trades.length})</TabsTrigger>
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
