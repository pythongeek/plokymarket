'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Props {
  yesPrice: number;
  noPrice: number;
  marketQuestion: string;
}

export function SimpleBetCalculator({ yesPrice, noPrice, marketQuestion }: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(100);
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');

  const price = outcome === 'YES' ? yesPrice : noPrice;
  const potentialReturn = useMemo(() => {
    if (price <= 0) return 0;
    return Math.round(amount / price);
  }, [amount, price]);

  const profit = potentialReturn - amount;
  const roi = price > 0 ? Math.round(((1 / price) - 1) * 100) : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <span className="text-lg">💰</span>
          {t('market.bet_calculator', 'Bet Calculator')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {/* Outcome Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOutcome('YES')}
            className={cn(
              'py-2 rounded-lg text-sm font-bold transition-all border-2',
              outcome === 'YES'
                ? 'border-green-500 bg-green-500 text-white shadow-md'
                : 'border-green-200 bg-green-50 text-green-700 hover:border-green-400 dark:bg-green-950/30 dark:border-green-800'
            )}
          >
            ✅ YES
          </button>
          <button
            onClick={() => setOutcome('NO')}
            className={cn(
              'py-2 rounded-lg text-sm font-bold transition-all border-2',
              outcome === 'NO'
                ? 'border-red-500 bg-red-500 text-white shadow-md'
                : 'border-red-200 bg-red-50 text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:border-red-800'
            )}
          >
            ❌ NO
          </button>
        </div>

        {/* Amount Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Bet amount</span>
            <span className="font-bold text-foreground">৳{amount}</span>
          </div>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>৳10</span>
            <span>৳5,000</span>
          </div>
        </div>

        {/* Result */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-center">
          <div className="text-xs text-muted-foreground">
            If {outcome} wins, you get:
          </div>
          <div className={cn('text-2xl font-black', profit > 0 ? 'text-green-600' : 'text-red-600')}>
            ৳{potentialReturn.toLocaleString()}
          </div>
          <div className="text-xs">
            <span className="text-green-600 font-bold">+৳{profit.toLocaleString()}</span>
            <span className="text-muted-foreground"> profit ({roi}% return)</span>
          </div>
          <div className="text-[10px] text-red-500">
            ⚠️ If wrong, you lose ৳{amount}
          </div>
        </div>

        {/* Kid-friendly explanation */}
        <div className="text-[11px] text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2 border border-blue-100 dark:border-blue-900">
          <span className="font-bold text-blue-600 dark:text-blue-400">💡 How it works:</span>{' '}
          Each share costs ৳{price.toFixed(2)}. If you guess right, each share pays ৳1.
          Buy {Math.round(amount / price)} shares → win ৳{potentialReturn.toLocaleString()}!
        </div>
      </CardContent>
    </Card>
  );
}
