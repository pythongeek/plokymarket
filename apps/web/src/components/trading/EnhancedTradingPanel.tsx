'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useBetSlipStore } from '@/store/betSlipStore';
import {
  TrendingUp, TrendingDown, Wallet, Zap, HelpCircle,
  ArrowRight, Sparkles, ShieldCheck, Users, Clock, ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Market, OrderSide } from '@/types';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  market: Market;
  isPaused?: boolean;
}

/** Simple animated number counter */
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <span className="tabular-nums">
      {prefix}{value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{suffix}
    </span>
  );
}

/** Visual probability bar with emoji moods */
function ProbabilityBar({ yesPrice }: { yesPrice: number }) {
  const pct = Math.round((yesPrice || 0.5) * 100);
  const mood = pct >= 75 ? '🚀' : pct >= 55 ? '👍' : pct >= 45 ? '🤔' : pct >= 25 ? '😬' : '💀';
  const label = pct >= 75 ? 'Very Likely' : pct >= 55 ? 'Likely' : pct >= 45 ? 'Toss-up' : pct >= 25 ? 'Unlikely' : 'Very Unlikely';

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">Chance of YES</span>
        <span className="font-black">{mood} {label}</span>
      </div>
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black text-white drop-shadow-sm">{pct}%</span>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0% NO</span>
        <span>50/50</span>
        <span>100% YES</span>
      </div>
    </div>
  );
}

/** Kid-friendly explanation tooltip content */
function WhatIsThis({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="absolute z-50 top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl text-sm space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-white flex items-center gap-1"><Sparkles className="w-4 h-4 text-yellow-400" /> How does this work?</span>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>
      <ol className="space-y-1.5 text-slate-300 text-xs list-decimal list-inside">
        <li>You pick <strong className="text-green-400">YES</strong> or <strong className="text-red-400">NO</strong> — what you think will happen.</li>
        <li>Each share costs a little money (like ৳0.60).</li>
        <li>If you are <strong className="text-yellow-400">right</strong>, each share pays you ৳1!</li>
        <li>If you are <strong className="text-red-400">wrong</strong>, you lose what you paid.</li>
        <li>The price shows what others think — higher price = more people believe it.</li>
      </ol>
    </motion.div>
  );
}

export function EnhancedTradingPanel({ market, isPaused }: Props) {
  const { wallet, placeOrder, isAuthenticated } = useStore();
  const { addItem: addToSlip } = useBetSlipStore();
  const { t } = useTranslation();

  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<string>('');

  const yesPrice = market.yes_price || 0.5;
  const noPrice = market.no_price || 0.5;
  const currentPrice = outcome === 'YES' ? yesPrice : noPrice;

  const shares = useMemo(() => {
    if (currentPrice <= 0) return 0;
    return Math.floor(amount / currentPrice);
  }, [amount, currentPrice]);

  const potentialWin = shares;
  const profit = potentialWin - amount;
  const roi = currentPrice > 0 ? Math.round(((1 / currentPrice) - 1) * 100) : 0;

  const balance = wallet?.balance || 0;
  const canAfford = amount <= balance;

  const quickAmounts = [100, 500, 1000, 5000];
  const maxAmount = currentPrice > 0 ? Math.floor(balance / currentPrice) * currentPrice : 0;

  const handleQuickAmount = (amt: number) => setAmount(amt);
  const handleMax = () => {
    if (maxAmount > 0) setAmount(Math.floor(maxAmount));
  };

  const handlePlaceOrder = async () => {
    if (isPaused) { toast.error('Trading is paused'); return; }
    if (!isAuthenticated) { toast.error('Please log in first'); return; }
    if (!canAfford) { toast.error('Insufficient balance'); return; }
    if (shares <= 0) { toast.error('Amount too small'); return; }

    setIsSubmitting(true);
    try {
      const price = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : currentPrice;
      const success = await placeOrder(
        market.id,
        'buy' as OrderSide,
        outcome,
        price,
        shares,
        orderType,
        orderType === 'limit' ? parseFloat(limitPrice || '0') : undefined
      );
      if (success) {
        toast.success(`✅ Bought ${shares} ${outcome} shares!`);
      } else {
        toast.error('Order failed. Try again.');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToSlip = () => {
    addToSlip({
      marketId: market.id,
      marketTitle: market.question,
      outcome,
      side: 'buy',
      price: currentPrice,
      quantity: shares,
      orderType,
    });
    toast.success('Added to bet slip');
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Start Trading</h3>
            <p className="text-sm text-muted-foreground">Log in to place your predictions</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild><a href="/login">Log In</a></Button>
            <Button asChild><a href="/register">Get Started</a></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-xl shadow-primary/5 overflow-visible">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-sm">Trade</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wallet className="w-3 h-3" />
            ৳{balance.toLocaleString()}
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* Probability Visual */}
          <ProbabilityBar yesPrice={yesPrice} />

          {/* YES / NO Big Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOutcome('YES')}
              className={cn(
                'relative overflow-hidden rounded-xl p-4 transition-all duration-200 border-2 text-center group',
                outcome === 'YES'
                  ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/20 scale-[1.02]'
                  : 'border-green-200 bg-green-50 text-green-700 hover:border-green-400 dark:bg-green-950/20 dark:border-green-800'
              )}
            >
              <div className="text-2xl mb-1">{outcome === 'YES' ? '✅' : '☑️'}</div>
              <div className="font-black text-lg">YES</div>
              <div className={cn('text-sm font-medium', outcome === 'YES' ? 'text-green-100' : 'text-green-600')}>
                ৳{yesPrice.toFixed(2)}
              </div>
              {outcome === 'YES' && (
                <motion.div layoutId="activeGlow" className="absolute inset-0 bg-white/10 rounded-xl" />
              )}
            </button>

            <button
              onClick={() => setOutcome('NO')}
              className={cn(
                'relative overflow-hidden rounded-xl p-4 transition-all duration-200 border-2 text-center group',
                outcome === 'NO'
                  ? 'border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20 scale-[1.02]'
                  : 'border-red-200 bg-red-50 text-red-700 hover:border-red-400 dark:bg-red-950/20 dark:border-red-800'
              )}
            >
              <div className="text-2xl mb-1">{outcome === 'NO' ? '❌' : '✖️'}</div>
              <div className="font-black text-lg">NO</div>
              <div className={cn('text-sm font-medium', outcome === 'NO' ? 'text-red-100' : 'text-red-600')}>
                ৳{noPrice.toFixed(2)}
              </div>
              {outcome === 'NO' && (
                <motion.div layoutId="activeGlow" className="absolute inset-0 bg-white/10 rounded-xl" />
              )}
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <button onClick={handleMax} className="text-xs text-primary font-bold hover:underline">
                Max ৳{Math.floor(maxAmount).toLocaleString()}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">৳</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(10, parseInt(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-3 text-xl font-black bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
                min={10}
                step={10}
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex gap-2 flex-wrap">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                    amount === amt
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
                  )}
                >
                  ৳{amt}
                </button>
              ))}
              <button
                onClick={handleMax}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all"
              >
                All In
              </button>
            </div>
          </div>

          {/* Order Type Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            {(['market', 'limit'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-md transition-all capitalize',
                  orderType === type
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Limit Price Input */}
          <AnimatePresence>
            {orderType === 'limit' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 pb-1">
                  <span className="text-xs text-muted-foreground">Limit Price (৳)</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">৳</span>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder={currentPrice.toFixed(2)}
                      step={0.01}
                      min={0.01}
                      max={0.99}
                      className="w-full pl-8 pr-4 py-2 text-lg font-bold bg-muted rounded-xl border-2 border-transparent focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Card — what happens */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 space-y-3 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">You pay</span>
                <span className="font-bold">৳{amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">You get</span>
                <span className="font-bold text-green-400">{shares.toLocaleString()} shares</span>
              </div>
              <div className="h-px bg-slate-700" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">If {outcome} wins</span>
                <span className="text-xl font-black text-green-400">
                  ৳{potentialWin.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Your profit</span>
                <span className="text-green-400 font-bold">+৳{profit.toLocaleString()} ({roi}%)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">If wrong, you lose</span>
                <span className="text-red-400 font-bold">৳{amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Kid-friendly explanation */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 relative">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <span className="font-bold">💡 Easy math:</span> Each share costs ৳{currentPrice.toFixed(2)}.
            {' '}If {outcome} happens, each share = ৳1. Buy {shares} shares → win ৳{potentialWin.toLocaleString()}!
            <AnimatePresence>
              {showHelp && <WhatIsThis open={showHelp} onClose={() => setShowHelp(false)} />}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              size="lg"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !canAfford || shares <= 0 || isPaused}
              className={cn(
                'w-full h-14 rounded-xl font-black text-base shadow-xl transition-all',
                outcome === 'YES'
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20',
                isPaused && 'bg-slate-500 cursor-not-allowed'
              )}
            >
              {isPaused ? (
                <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Trading Paused</span>
              ) : isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : !canAfford ? (
                <span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Insufficient Balance</span>
              ) : (
                <span className="flex items-center gap-2">
                  {outcome === 'YES' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  Buy {outcome} — ৳{amount.toLocaleString()}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleAddToSlip}
              disabled={shares <= 0 || isPaused}
              className="w-full h-12 rounded-xl font-bold border-dashed"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Bet Slip
            </Button>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground justify-center">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            Funds secured. Instant settlement. 2% platform fee.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
