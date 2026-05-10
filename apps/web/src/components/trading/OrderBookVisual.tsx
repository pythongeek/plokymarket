// @ts-nocheck
/**
 * 🎯 Kid-Friendly Order Book Visualization
 *
 * Makes the order book understandable even for an 8-year-old:
 * - YES/NO as big colored buttons (green/red)
 * - "What people think" progress bar (sentiment meter)
 * - Simple language: "People think YES will win" instead of "Bid/Ask"
 * - Emoji indicators for confidence levels
 * - "You pay X to win Y" simple math display
 * - Visual "thermometer" showing market confidence
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OrderBookLevel {
  price: number;
  size: number;
  cumulative: number;
}

interface Trade {
  price: number;
  quantity: number;
  time: string;
  side: string;
}

interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: { bestBid: number | null; bestAsk: number | null };
  trades: Trade[];
  summary: {
    totalBidDepth: number;
    totalAskDepth: number;
  };
  marketInfo: {
    yesPrice: number;
    noPrice: number;
  };
}

interface OrderBookVisualProps {
  marketId: string;
  marketName: string;
  className?: string;
}

/**
 * 🎯 Simple "How Confident Are People?" Meter
 * Converts the YES/NO prices into a visual confidence gauge
 */
function ConfidenceMeter({ yesPrice }: { yesPrice: number }) {
  const percent = Math.round(yesPrice * 100);
  const confidence = percent >= 70 ? '✅ Very Likely' : percent >= 50 ? '🟢 Likely' : percent >= 30 ? '🗾 Maybe' : '🔴 Unlikely';
  const emoji = percent >= 70 ? '🚀' : percent >= 50 ? '👍' : percent >= 30 ? '🤔' : '👎';
  const color = percent >= 50 ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">What people think</span>
        <span className="text-sm font-bold">{emoji} {confidence}</span>
      </div>
      <div className="h-4 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500 rounded-full", color)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>NO — {100 - percent}%</span>
        <span>{percent}% — YES</span>
      </div>
    </div>
  );
}

/**
 * 💰 Simple "If you bet X, you win Y" calculator
 */
function SimpleBetCalculator({ yesPrice }: { yesPrice: number }) {
  const [betAmount, setBetAmount] = useState(100);
  const potentialWin = Math.round(betAmount / yesPrice);
  const profit = potentialWin - betAmount;

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-1">
        <span className="text-lg">💰</span> Simple Bet Calculator
      </h4>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">If you bet:</span>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
          className="w-20 text-sm px-2 py-1 rounded border bg-background"
          min={10}
          step={10}
        />
        <span className="text-xs">BDT</span>
      </div>
      <div className="text-sm">
        You could win: <span className="font-bold text-green-600">৳{potentialWin.toLocaleString()}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        Profit: ৳{profit.toLocaleString()} ({((profit / betAmount) * 100).toFixed(0)}% return)
      </div>
      <div className="text-xs text-orange-600">
        ⚠️ But if you’re wrong, you lose your ৳{betAmount}
      </div>
    </div>
  );
}

/**
 * 📊 Depth Bar — visual horizontal bar showing order size
 */
function DepthBar({ size, maxSize, color }: { size: number; maxSize: number; color: string }) {
  const width = maxSize > 0 ? (size / maxSize) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-5 bg-muted rounded overflow-hidden relative">
        <div
          className={cn("h-full absolute top-0 left-0 rounded transition-all", color)}
          style={{ width: `${Math.max(width, 2)}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-medium text-white/90">
          {size.toLocaleString()} shares
        </span>
      </div>
    </div>
  );
}

/**
 * 📈 Recent Trades List — shows last few trades with arrow indicators
 */
function RecentTrades({ trades }: { trades: Trade[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Recent Activity
      </h4>
      <div className="space-y-0.5">
        {trades.slice(0, 5).map((trade, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-0.5 px-2 rounded hover:bg-muted/50">
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span>{trade.side === 'buy' ? '↑ Bought' : '↓ Sold'}</span>
            </div>
            <div className="flex gap-3 text-muted-foreground">
              <span>৳{Number(trade.price).toFixed(2)}</span>
              <span>{Number(trade.quantity).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {trades.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No trades yet — be the first!</p>
        )}
      </div>
    </div>
  );
}

export function OrderBookVisual({ marketId, marketName, className }: OrderBookVisualProps) {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/markets/${marketId}/orderbook?depth=10`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.warn('Order book fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, [marketId]);

  const maxDepth = useMemo(() => {
    if (!data) return 1;
    const allSizes = [
      ...data.bids.map(b => b.size),
      ...data.asks.map(a => a.size),
    ];
    return Math.max(...allSizes, 1);
  }, [data]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Could not load order book
        </CardContent>
      </Card>
    );
  }

  const yesPrice = data.marketInfo.yesPrice || 0.5;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">📊 Live Market View</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {/* Confidence Meter */}
        <ConfidenceMeter yesPrice={yesPrice} />

        {/* Simple Bet Calculator */}
        <SimpleBetCalculator yesPrice={yesPrice} />

        {/* Bid / Ask Visual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-600">✅ People buying YES</span>
            <span className="text-xs text-muted-foreground">{data.summary.totalBidDepth.toLocaleString()} shares waiting</span>
          </div>
          <div className="space-y-1">
            {data.bids.slice(0, 5).map((bid, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-mono text-green-600 font-medium">৳{bid.price.toFixed(2)}</span>
                <DepthBar size={bid.size} maxSize={maxDepth} color="bg-green-500/80" />
              </div>
            ))}
            {data.bids.length === 0 && (
              <p className="text-xs text-muted-foreground py-1">No buyers yet — be the first!</p>
            )}
          </div>
        </div>

        {/* Spread Indicator */}
        {data.spread.spread && (
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] text-muted-foreground font-mono">
              Spread: ৳{Number(data.spread.spread).toFixed(2)} ({data.spread.spreadPercent})
            </span>
            <div className="h-px bg-border flex-1" />
          </div>
        )}

        {/* Ask side */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600">❌ People selling YES</span>
            <span className="text-xs text-muted-foreground">{data.summary.totalAskDepth.toLocaleString()} shares waiting</span>
          </div>
          <div className="space-y-1">
            {data.asks.slice(0, 5).map((ask, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-mono text-red-600 font-medium">৳{ask.price.toFixed(2)}</span>
                <DepthBar size={ask.size} maxSize={maxDepth} color="bg-red-500/80" />
              </div>
            ))}
            {data.asks.length === 0 && (
              <p className="text-xs text-muted-foreground py-1">No sellers yet — be the first!</p>
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <RecentTrades trades={data.trades} />
      </CardContent>
    </Card>
  );
}
