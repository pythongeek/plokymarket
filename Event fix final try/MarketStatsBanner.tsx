'use client';

// components/market/MarketStatsBanner.tsx
// Real-time market stats strip — Volume · Liquidity · Traders · Trades · Live

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Droplets, Users, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MarketStatsBannerProps {
  market: {
    id: string;
    total_volume?: number;
    liquidity?: number;
    yes_price?: number;
    no_price?: number;
  };
}

// ── Bangla-aware BDT formatter ─────────────────────────────────────────────
function formatBDT(amount: number): string {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(1)} কোটি`;
  if (amount >= 100000)   return `৳${(amount / 100000).toFixed(1)} লাখ`;
  if (amount >= 1000)     return `৳${(amount / 1000).toFixed(1)}K`;
  return `৳${Math.round(amount)}`;
}

export function MarketStatsBanner({ market }: MarketStatsBannerProps) {
  const [stats, setStats] = useState({
    volume:   market.total_volume ?? 0,
    liquidity: market.liquidity   ?? 0,
    traders:  0,
    trades:   0,
    yesPrice: market.yes_price    ?? 0.5,
    priceDelta: 0,    // 24h change
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // ── Trades: handle both schema variants ──────────────────────────────
        // Old schema:  trades.user_id (via positions)
        // New schema:  trades.buyer_id + trades.seller_id
        const { data: tradeRows, error } = await supabase
          .from('trades')
          .select('price, quantity, buyer_id, seller_id')
          .eq('market_id', market.id)
          .order('created_at', { ascending: false })
          .limit(500);

        if (!error && tradeRows) {
          // Collect unique trader IDs (works for both schema variants)
          const traderSet = new Set<string>();
          let totalVolume = 0;

          tradeRows.forEach((t: any) => {
            if (t.buyer_id)  traderSet.add(t.buyer_id);
            if (t.seller_id) traderSet.add(t.seller_id);
            if (t.user_id)   traderSet.add(t.user_id);      // fallback
            totalVolume += (t.price ?? 0) * (t.quantity ?? 0);
          });

          // 24h price delta: compare latest vs 24h-ago trade price
          const latestPrice = tradeRows[0]?.price ?? market.yes_price ?? 0.5;
          const cutoff = new Date(Date.now() - 86_400_000).toISOString();
          const oldRows = tradeRows.filter((t: any) =>
            new Date(t.created_at ?? 0) <= new Date(cutoff)
          );
          const oldPrice = oldRows[oldRows.length - 1]?.price ?? latestPrice;
          const delta = latestPrice - oldPrice;

          setStats(prev => ({
            ...prev,
            volume:     totalVolume || market.total_volume || 0,
            traders:    traderSet.size,
            trades:     tradeRows.length,
            yesPrice:   latestPrice,
            priceDelta: delta,
          }));
        }
      } catch (e) {
        console.warn('[MarketStatsBanner] fetch error:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // ── Real-time subscription for new trades ─────────────────────────────────
    const channel = supabase
      .channel(`mkt-stats-${market.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `market_id=eq.${market.id}`,
        },
        (payload) => {
          const t = payload.new as any;
          setStats(prev => ({
            ...prev,
            volume: prev.volume + (t.price ?? 0) * (t.quantity ?? 0),
            trades: prev.trades + 1,
            yesPrice: t.outcome === 'YES' ? (t.price ?? prev.yesPrice) : prev.yesPrice,
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [market.id, market.total_volume]);

  const yesPercent  = Math.round(stats.yesPrice * 100);
  const priceUp     = stats.priceDelta > 0;
  const priceFlat   = Math.abs(stats.priceDelta) < 0.001;
  const deltaLabel  = priceFlat
    ? ''
    : `${priceUp ? '+' : ''}${(stats.priceDelta * 100).toFixed(1)}%`;

  const items = [
    {
      icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />,
      label: 'ভলিউম',
      value: formatBDT(stats.volume),
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: <Droplets className="h-3.5 w-3.5 text-blue-500" />,
      label: 'লিকুইডিটি',
      value: formatBDT(stats.liquidity),
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: <Users className="h-3.5 w-3.5 text-violet-500" />,
      label: 'ট্রেডার',
      value: loading ? '…' : stats.traders.toLocaleString('bn-BD'),
      color: 'text-violet-600 dark:text-violet-400',
    },
    {
      icon: <Activity className="h-3.5 w-3.5 text-orange-500" />,
      label: 'ট্রেড',
      value: loading ? '…' : stats.trades.toLocaleString('bn-BD'),
      color: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 py-1.5">
      {/* YES price pill */}
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
          ${yesPercent >= 50
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
          }`}
      >
        {yesPercent}% YES
        {deltaLabel && (
          <span className={priceUp ? 'text-emerald-600' : 'text-red-600'}>
            {priceUp ? <TrendingUp className="h-2.5 w-2.5 inline" /> : <TrendingDown className="h-2.5 w-2.5 inline" />}
            {deltaLabel}
          </span>
        )}
      </span>

      {/* Separator */}
      <span className="text-muted-foreground/30 select-none">·</span>

      {/* Stat items */}
      {items.map((item, idx) => (
        <span key={item.label} className="flex items-center gap-1 text-sm">
          {idx > 0 && <span className="text-muted-foreground/30 select-none mx-0.5">·</span>}
          {item.icon}
          <span className={`font-bold tabular-nums ${item.color}`}>{item.value}</span>
          <span className="text-muted-foreground text-xs">{item.label}</span>
        </span>
      ))}

      {/* Live pulse */}
      <span className="ml-1 flex items-center gap-1 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        লাইভ
      </span>
    </div>
  );
}
