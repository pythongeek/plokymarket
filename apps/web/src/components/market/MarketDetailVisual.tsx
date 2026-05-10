import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Trade {
  price: number;
  quantity: number;
  time: string;
  side: string;
}

interface DepthLevel {
  price: number;
  size: number;
  cumulative: number;
}

interface MarketData {
  id: string;
  question: string;
  yes_price: number;
  no_price: number;
  total_volume: number;
  unique_traders: number;
  bids: DepthLevel[];
  asks: DepthLevel[];
  trades: Trade[];
}

/**
 * 🎯 Kid-Friendly Market Detail Page
 * Makes prediction markets understandable for anyone, even kids
 */
export function MarketDetailVisual({ marketId }: { marketId: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedOutcome, setSelectedOutcome] = useState<'YES' | 'NO'>('YES');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketRes, bookRes] = await Promise.all([
          fetch(`/api/markets/${marketId}`),
          fetch(`/api/markets/${marketId}/orderbook?depth=10`),
        ]);
        const market = marketRes.ok ? await marketRes.json() : null;
        const book = bookRes.ok ? await bookRes.json() : null;
        setData({
          ...market,
          bids: book?.bids || [],
          asks: book?.asks || [],
          trades: book?.trades || [],
        });
      } catch (e) {
        console.warn('Market fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [marketId]);

  const yesPercent = useMemo(() => Math.round((data?.yes_price || 0.5) * 100), [data]);
  const maxDepth = useMemo(() => {
    const sizes = [...(data?.bids || []), ...(data?.asks || [])].map((d) => d.size);
    return Math.max(...sizes, 1);
  }, [data]);

  const potentialWin = useMemo(() => {
    const price = selectedOutcome === 'YES' ? (data?.yes_price || 0.5) : (data?.no_price || 0.5);
    if (price <= 0) return 0;
    return Math.round(betAmount / price);
  }, [betAmount, selectedOutcome, data]);

  const profit = potentialWin - betAmount;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!data) return <div className="text-center text-muted-foreground">Failed to load market</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 🏰 Big Question */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold leading-tight">{data.question}</h1>
        <p className="text-sm text-muted-foreground">
          {t('market.traders_count', '{{count}} people trading', { count: data.unique_traders || 0 })}
        </p>
      </div>

      {/* 📊 Big YES/NO Price Cards */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedOutcome('YES')}
          className={cn(
            'relative overflow-hidden rounded-2xl p-6 text-center transition-all border-2',
            selectedOutcome === 'YES'
              ? 'border-green-500 bg-green-500/10 shadow-lg scale-105'
              : 'border-border bg-card hover:border-green-500/50'
          )}
        >
          <div className="text-4xl font-bold text-green-600">৳{(data.yes_price || 0).toFixed(2)}</div>
          <div className="text-sm font-medium text-green-700 mt-1">✅ {t('common.yes')}</div>
          <div className="text-xs text-muted-foreground mt-1">{yesPercent}% think YES</div>
        </button>

        <button
          onClick={() => setSelectedOutcome('NO')}
          className={cn(
            'relative overflow-hidden rounded-2xl p-6 text-center transition-all border-2',
            selectedOutcome === 'NO'
              ? 'border-red-500 bg-red-500/10 shadow-lg scale-105'
              : 'border-border bg-card hover:border-red-500/50'
          )}
        >
          <div className="text-4xl font-bold text-red-600">৳{(data.no_price || 0).toFixed(2)}</div>
          <div className="text-sm font-medium text-red-700 mt-1">❌ {t('common.no')}</div>
          <div className="text-xs text-muted-foreground mt-1">{100 - yesPercent}% think NO</div>
        </button>
      </div>

      {/* 🌡️ Confidence Thermometer */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">📊 What people think</span>
            <span className="text-sm font-bold">
              {yesPercent >= 70 ? '🚀 Very Likely' : yesPercent >= 50 ? '👍 Likely' : yesPercent >= 30 ? '🤔 Maybe' : '👎 Unlikely'}
            </span>
          </div>
          <div className="h-6 bg-muted rounded-full overflow-hidden relative">
            <div
              className={cn('h-full transition-all duration-700 rounded-full', yesPercent >= 50 ? 'bg-green-500' : 'bg-red-500')}
              style={{ width: `${yesPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">{yesPercent}% YES</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0% — Everyone says NO</span>
            <span>100% — Everyone says YES</span>
          </div>
        </CardContent>
      </Card>

      {/* 💰 Simple Bet Calculator */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">💰</span> {t('market.bet_calculator', 'Bet Calculator')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('market.bet_explain', 'If you bet on {{outcome}} and you are right, you win:', { outcome: selectedOutcome })}
          </p>

          <div className="flex items-center gap-3">
            <span className="text-sm">Bet:</span>
            <input
              type="range"
              min={10}
              max={5000}
              step={10}
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-bold w-20 text-right">৳{betAmount}</span>
          </div>

          <div className="bg-muted rounded-lg p-4 text-center space-y-2">
            <div className="text-3xl font-bold text-green-600">৳{potentialWin.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">You could win this much!</div>
            <div className="text-xs">
              Profit: <span className="font-bold text-green-600">৳{profit.toLocaleString()}</span>
              <span className="text-muted-foreground"> ({((profit / betAmount) * 100).toFixed(0)}% return)</span>
            </div>
            <div className="text-xs text-red-600">⚠️ But if wrong, you lose ৳{betAmount}</div>
          </div>
        </CardContent>
      </Card>

      {/* 📈 Live Order Book */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">📈 {t('market.order_book', 'Live Order Book')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {/* Asks (sellers) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-red-600 font-semibold">
              <span>❌ People selling {selectedOutcome}</span>
              <span>Price → Size</span>
            </div>
            {data.asks.slice(0, 5).map((ask, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-mono text-red-600 font-medium">৳{ask.price.toFixed(2)}</span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-red-500/70 rounded" style={{ width: `${(ask.size / maxDepth) * 100}%` }} />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] text-white font-medium">{ask.size.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {data.asks.length === 0 && <p className="text-xs text-muted-foreground py-1">No sellers yet — be first!</p>}
          </div>

          {/* Spread */}
          <div className="flex items-center gap-2 py-1">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] text-muted-foreground font-mono">Spread</span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Bids (buyers) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-green-600 font-semibold">
              <span>✅ People buying {selectedOutcome}</span>
              <span>Price → Size</span>
            </div>
            {data.bids.slice(0, 5).map((bid, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-mono text-green-600 font-medium">৳{bid.price.toFixed(2)}</span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-green-500/70 rounded" style={{ width: `${(bid.size / maxDepth) * 100}%` }} />
                  <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] text-white font-medium">{bid.size.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {data.bids.length === 0 && <p className="text-xs text-muted-foreground py-1">No buyers yet — be first!</p>}
          </div>
        </CardContent>
      </Card>

      {/* 🔥 Recent Trades */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">🔥 {t('market.recent_trades', 'Recent Trades')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-1">
            {data.trades.slice(0, 8).map((trade, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500')} />
                  <span>{trade.side === 'buy' ? '↑ Bought' : '↓ Sold'}</span>
                </div>
                <div className="flex gap-4 text-muted-foreground">
                  <span>৳{trade.price.toFixed(2)}</span>
                  <span>{trade.quantity.toLocaleString()} shares</span>
                  <span>{new Date(trade.time).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {data.trades.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No trades yet — be the first!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 📖 How It Works (Kid-Friendly) */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-lg font-semibold">🤔 How does this work?</h3>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-xl">1️⃣</span>
              <p><strong>Pick YES or NO</strong> — Do you think the event will happen?</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">2️⃣</span>
              <p><strong>Bet some money</strong> — The more you bet, the more you can win!</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">3️⃣</span>
              <p><strong>Wait for the answer</strong> — If you guessed right, you get your money back PLUS extra!</p>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">❓</span>
              <p className="text-muted-foreground">
                Example: If YES costs ৳0.60 and you bet ৳60, you get ৳100 back if YES wins! (৳40 profit)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
