'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import { ArrowUp, ArrowDown, HandCoins, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { OrderBookExplainer } from './OrderBookExplainer';

interface DepthItem {
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

interface Props {
  marketId: string;
}

// রিভার্স ডিপ্ত বার
function toBengaliNum(n: number | string): string {
  const map: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯', '.': '.', '-': '-',
  };
  return String(n).replace(/[0-9.\-]/g, (d) => map[d] || d);
}

export function EnhancedOrderBook({ marketId }: Props) {
  const { t } = useTranslation();
  const { setTradingPrice, setTradingQuantity } = useStore();
  const [data, setData] = useState<{
    bids: DepthItem[];
    asks: DepthItem[];
    trades: Trade[];
    lastPrice: number | null;
    spread: number | null;
    midPrice: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashRow, setFlashRow] = useState<{side: 'bid'|'ask', idx: number} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/markets/${marketId}/orderbook?depth=10`);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.warn('Orderbook fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [marketId]);

  const maxSize = useMemo(() => {
    const sizes = [...(data?.bids || []), ...(data?.asks || [])].map(d => d.size);
    return Math.max(...sizes, 1);
  }, [data]);

  const handleClickPrice = (price: number, side: 'buy' | 'sell') => {
    setTradingPrice(price);
    // Flash visual feedback
    setFlashRow({ side: side === 'buy' ? 'bid' : 'ask', idx: -1 });
    setTimeout(() => setFlashRow(null), 400);
  };

  if (loading) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const bestBid = data.bids[0]?.price ?? null;
  const bestAsk = data.asks[0]?.price ?? null;
  const spread = data.spread ?? (bestAsk && bestBid ? bestAsk - bestBid : null);
  const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : data.lastPrice;

  return (
    <Card className="border-primary/10 overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span>দাম কিনা কাছ করে? (খোলার বহি)</span>
          </CardTitle>
          <OrderBookExplainer bestBid={bestBid ?? undefined} bestAsk={bestAsk ?? undefined} />
        </div>
        {/* Kid-friendly subtitle */}
        <p className="text-[11px] text-muted-foreground mt-1">
          সবুজ নিচে ক্লিক করে দাম সাতে নিজের বাশায় কিনতে পারবেন
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-2">
        {/* ─── SELLERS (Asks) ─── TOP ─── */}
        <div className="space-y-0.5">
          {/* Header */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold px-1 mb-1">
            <ShoppingCart className="w-3 h-3 text-red-500" />
            <span>বিক্রিতা রয়েছে (বিক্রি হলে দাম)</span>
          </div>

          {[...data.asks].reverse().map((ask, i) => {
            const depthPct = Math.min((ask.size / maxSize) * 100, 100);
            const isFlashing = flashRow?.side === 'ask';
            return (
              <div
                key={`ask-${i}`}
                className={cn(
                  "relative flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all",
                  "hover:bg-red-500/5 hover:scale-[1.01]",
                  isFlashing && "bg-red-500/10"
                )}
                onClick={() => handleClickPrice(ask.price, 'sell')}
                title={`ক্লিক করে এই দামে দাম কিনুন`}
              >
                {/* Depth bar background */}
                <div
                  className="absolute top-0 right-0 h-full bg-red-500/15 rounded-r-md transition-all"
                  style={{ width: `${depthPct}%` }}
                />

                {/* Price — left */}
                <span className="relative z-10 w-14 font-mono text-red-600 font-bold text-sm">
                  ৳{ask.price.toFixed(2)}
                </span>

                {/* Size bar */}
                <div className="relative z-10 flex-1 flex items-center gap-2">
                  <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-red-500/50 rounded transition-all"
                      style={{ width: `${depthPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground w-16 text-right">
                    {ask.size.toLocaleString()} শেয়ার
                  </span>
                </div>

                {/* Cumulative */}
                <span className="relative z-10 w-14 text-right font-mono text-[10px] text-muted-foreground">
                  {ask.cumulative.toLocaleString()}
                </span>
              </div>
            );
          })}

          {data.asks.length === 0 && (
            <div className="text-center py-4 bg-red-500/5 rounded-lg">
              <p className="text-xs text-muted-foreground">
                😢 এখনো কোনো বিক্রিতা নাই — আপনি প্রথম হন!
              </p>
            </div>
          )}
        </div>

        {/* ─── MID PRICE / SPREAD ─── */}
        <div className="flex items-center gap-3 py-2">
          <div className="h-px bg-border flex-1" />
          <div className="text-center px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
            <div className="text-lg font-black text-foreground leading-none">
              {midPrice ? `৳${midPrice.toFixed(2)}` : '—'}
            </div>
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {spread !== null ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  স্প্রেড ৳{toBengaliNum(spread.toFixed(2))}
                  <span className="text-[8px] opacity-60">(কিনার এবং বিক্রিতার দামের পার্থক্য)</span>
                </span>
              ) : (
                <span>সর্বশেষ দাম</span>
              )}
            </div>
          </div>
          <div className="h-px bg-border flex-1" />
        </div>

        {/* ─── BUYERS (Bids) ─── BOTTOM ─── */}
        <div className="space-y-0.5">
          {/* Header */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-bold px-1 mb-1">
            <HandCoins className="w-3 h-3 text-green-500" />
            <span>কিনাখ চায় (কিনতে চায়)</span>
          </div>

          {data.bids.map((bid, i) => {
            const depthPct = Math.min((bid.size / maxSize) * 100, 100);
            const isFlashing = flashRow?.side === 'bid';
            return (
              <div
                key={`bid-${i}`}
                className={cn(
                  "relative flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-all",
                  "hover:bg-green-500/5 hover:scale-[1.01]",
                  isFlashing && "bg-green-500/10"
                )}
                onClick={() => handleClickPrice(bid.price, 'buy')}
                title={`ক্লিক করে এই দামে দাম কিনুন`}
              >
                {/* Depth bar background */}
                <div
                  className="absolute top-0 left-0 h-full bg-green-500/15 rounded-l-md transition-all"
                  style={{ width: `${depthPct}%` }}
                />

                {/* Price — left */}
                <span className="relative z-10 w-14 font-mono text-green-600 font-bold text-sm">
                  ৳{bid.price.toFixed(2)}
                </span>

                {/* Size bar */}
                <div className="relative z-10 flex-1 flex items-center gap-2">
                  <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500/50 rounded transition-all"
                      style={{ width: `${depthPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground w-16 text-right">
                    {bid.size.toLocaleString()} শেয়ার
                  </span>
                </div>

                {/* Cumulative */}
                <span className="relative z-10 w-14 text-right font-mono text-[10px] text-muted-foreground">
                  {bid.cumulative.toLocaleString()}
                </span>
              </div>
            );
          })}

          {data.bids.length === 0 && (
            <div className="text-center py-4 bg-green-500/5 rounded-lg">
              <p className="text-xs text-muted-foreground">
                😢 এখনো কোনো কিনাখ নাই — আপনি প্রথম হন!
              </p>
            </div>
          )}
        </div>

        {/* ─── Quick Legend ─── */}
        <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-green-500/60" />
            কিনাখ চায় (সবুঝ খুলা)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500/60" />
            বিক্রিতা রয়েছে (সবুজ বিক্রি)
          </span>
        </div>

        {/* ─── Recent Trades ─── */}
        {data.trades.length > 0 && (
          <div className="border-t border-border pt-3 mt-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              সম্প্রতি লেনদেন ট্রেড ঘটনা
            </div>
            <div className="space-y-0.5 max-h-28 overflow-y-auto hscroll">
              {data.trades.slice(0, 8).map((trade, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[11px] py-1 px-2 rounded hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {trade.side === 'buy' ? (
                      <ArrowUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={trade.side === 'buy' ? 'text-green-600' : 'text-red-600'}>
                      {trade.side === 'buy' ? 'কিনেছে' : 'বিক্রিয়েছে'}
                    </span>
                  </div>
                  <span className="font-mono font-medium">৳{trade.price.toFixed(2)}</span>
                  <span className="text-muted-foreground">{trade.quantity.toLocaleString()} শেয়ার</span>
                  <span className="text-muted-foreground text-[9px]">{new Date(trade.time).toLocaleTimeString('bn-BD', { hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
