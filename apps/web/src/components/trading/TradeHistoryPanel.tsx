'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Clock, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeTrades } from '@/hooks/useRealtime';

interface Props {
  marketId: string;
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TradeHistoryPanel({ marketId }: Props) {
  const trades = useRealtimeTrades(marketId);

  const stats = useMemo(() => {
    if (trades.length === 0) return null;
    const last = trades[0];
    const yesTrades = trades.filter(t => t.outcome === 'YES');
    const noTrades = trades.filter(t => t.outcome === 'NO');
    const avgPrice = trades.reduce((s, t) => s + Number(t.price), 0) / trades.length;
    const volume = trades.reduce((s, t) => s + Number(t.quantity), 0);
    return { last, yesCount: yesTrades.length, noCount: noTrades.length, avgPrice, volume };
  }, [trades]);

  if (trades.length === 0) {
    return (
      <Card className="border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-6 text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No trades yet</p>
            <p className="text-xs">Be the first to trade!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Trades
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full animate-pulse">
              LIVE
            </span>
          </CardTitle>
          {stats && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last: {timeSince(stats.last.executed_at)}
            </div>
          )}
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            <span className="inline-flex items-center gap-1 text-green-600 font-bold">
              <ArrowUp className="w-3 h-3" /> {stats.yesCount} YES
            </span>
            <span className="inline-flex items-center gap-1 text-red-600 font-bold">
              <ArrowDown className="w-3 h-3" /> {stats.noCount} NO
            </span>
            <span className="text-muted-foreground">
              Vol: {stats.volume.toLocaleString()} shares
            </span>
            <span className="text-muted-foreground">
              Avg: ৳{stats.avgPrice.toFixed(2)}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {/* Header row */}
        <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] text-muted-foreground uppercase font-bold border-b border-border">
          <span>Time</span>
          <span>Side</span>
          <span className="text-right">Price</span>
          <span className="text-right">Size</span>
          <span className="text-right hidden sm:block">Outcome</span>
        </div>

        {/* Trade rows */}
        <div className="max-h-48 overflow-y-auto">
          {trades.slice(0, 15).map((trade, i) => {
            const isYes = trade.outcome === 'YES';
            const isRecent = i < 3;
            return (
              <motion.div
                key={trade.id || i}
                initial={isRecent ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'grid grid-cols-5 gap-2 px-4 py-1.5 text-xs items-center border-b border-border/50',
                  'hover:bg-muted/40 transition-colors',
                  isRecent && 'bg-primary/5'
                )}
              >
                <span className="text-muted-foreground text-[10px] font-mono">
                  {timeSince(trade.executed_at)}
                </span>
                <span className={cn('font-bold', isYes ? 'text-green-600' : 'text-red-600')}>
                  {isYes ? (
                    <span className="inline-flex items-center gap-0.5">
                      <ArrowUp className="w-3 h-3" /> YES
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5">
                      <ArrowDown className="w-3 h-3" /> NO
                    </span>
                  )}
                </span>
                <span className="text-right font-mono font-medium">
                  ৳{Number(trade.price).toFixed(2)}
                </span>
                <span className="text-right text-muted-foreground">
                  {Number(trade.quantity).toLocaleString()}
                </span>
                <span className="text-right hidden sm:block">
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    isYes ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {isYes ? 'YES' : 'NO'}
                  </span>
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 text-[10px] text-muted-foreground text-center border-t border-border">
          Showing last {Math.min(trades.length, 15)} of {trades.length} trades
        </div>
      </CardContent>
    </Card>
  );
}
