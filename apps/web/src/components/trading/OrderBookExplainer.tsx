'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronRight, HandCoins, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  bestBid?: number;
  bestAsk?: number;
}

const STEPS = [
  {
    emoji: '🟢',
    icon: HandCoins,
    title: 'Buyers want YES cheap',
    text: 'Green side = people who want to BUY shares. They hope the price goes DOWN so they can buy more.',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    emoji: '🔴',
    icon: ShoppingCart,
    title: 'Sellers want YES expensive',
    text: 'Red side = people who want to SELL shares. They hope the price goes UP so they get more money.',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
  },
  {
    emoji: '⚡',
    icon: ArrowRightLeft,
    title: 'When they agree = TRADE!',
    text: 'When a buyer price meets a seller price, BOOM! A trade happens. Both people swap shares instantly.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
  },
];

export function OrderBookExplainer({ bestBid, bestAsk }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); setStep(0); }}
        className={cn(
          'flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-all',
          open
            ? 'bg-primary text-primary-foreground'
            : 'bg-primary/10 text-primary hover:bg-primary/20'
        )}
      >
        <Lightbulb className="w-3 h-3" />
        {open ? 'Close help' : 'What does this mean?'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                How the Order Book Works
              </span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step content */}
            <div className={cn('p-4 space-y-3', current.bg)}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{current.emoji}</div>
                <div>
                  <div className={cn('font-bold text-sm flex items-center gap-1', current.color)}>
                    <Icon className="w-4 h-4" />
                    {current.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {current.text}
                  </p>
                </div>
              </div>

              {/* Live example */}
              {bestBid !== undefined && bestAsk !== undefined && (
                <div className={cn('rounded-lg p-2.5 text-xs space-y-1 border', current.border, current.bg)}>
                  <div className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Live example</div>
                  {step === 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-bold">Top buyer offers</span>
                      <span className="font-mono font-black">৳{bestBid.toFixed(2)}</span>
                    </div>
                  )}
                  {step === 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-600 font-bold">Top seller asks</span>
                      <span className="font-mono font-black">৳{bestAsk.toFixed(2)}</span>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="text-center">
                      <span className="text-green-600 font-bold">Buyer @ ৳{bestBid.toFixed(2)}</span>
                      <span className="mx-1 text-muted-foreground">+</span>
                      <span className="text-red-600 font-bold">Seller @ ৳{bestAsk.toFixed(2)}</span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {bestBid >= bestAsk
                          ? '✅ They would trade right now!'
                          : '⏳ Waiting for someone to meet in the middle...'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <div className="flex gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i === step ? 'bg-primary w-4' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Back
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className="flex items-center gap-1 text-xs font-bold bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => setOpen(false)}
                    className="text-xs font-bold bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                  >
                    Got it! 🎉
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
