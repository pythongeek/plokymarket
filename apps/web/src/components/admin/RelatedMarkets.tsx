'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface RelatedMarketsProps {
  currentMarketId: string;
  category: string;
}

interface MarketSummary {
  id: string;
  question: string;
  category: string;
  yes_price: number;
  total_volume: number;
  image_url?: string;
  trading_closes_at: string;
  status: string;
}

function formatBDT(amount: number): string {
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(1)} লাখ`;
  if (amount >= 1000) return `৳${(amount / 1000).toFixed(1)}K`;
  return `৳${amount.toFixed(0)}`;
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    sports: '🏏',
    politics: '🏛️',
    economy: '💰',
    entertainment: '🎬',
    technology: '💻',
    international: '🌍',
    social: '👥',
    weather: '🌦️',
    crypto: '₿',
  };
  return <span className="text-lg">{icons[category] ?? '📊'}</span>;
}

export function RelatedMarkets({ currentMarketId, category }: RelatedMarketsProps) {
  const router = useRouter();
  const [markets, setMarkets] = useState<MarketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      const { data, error } = await supabase
        .from('markets')
        .select('id, question, category, yes_price, total_volume, image_url, trading_closes_at, status')
        .eq('category', category)
        .neq('id', currentMarketId)
        .in('status', ['active', 'open'])
        .order('total_volume', { ascending: false })
        .limit(4);

      if (!error && data) setMarkets(data as MarketSummary[]);
      setLoading(false);
    }

    fetchRelated();
  }, [currentMarketId, category]);

  if (loading || markets.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-primary/10">
      <h3 className="text-base font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        সম্পর্কিত মার্কেট
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {markets.map((m) => {
          const yesPercent = Math.round((m.yes_price ?? 0.5) * 100);
          const closesAt = new Date(m.trading_closes_at);
          const daysLeft = Math.ceil((closesAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          return (
            <Card
              key={m.id}
              className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur-sm border-primary/10"
              onClick={() => router.push(`/markets/${m.id}`)}
            >
              <CardContent className="p-3 space-y-2">
                {/* Thumbnail + Category */}
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {m.image_url ? (
                      <img src={m.image_url} alt="" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <CategoryIcon category={m.category} />
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    {m.category}
                  </Badge>
                </div>

                {/* Question */}
                <p className="text-xs font-medium leading-tight line-clamp-2">{m.question}</p>

                {/* Stats row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm font-bold tabular-nums ${yesPercent >= 50 ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {yesPercent}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">YES</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground tabular-nums">{formatBDT(m.total_volume)}</p>
                    {daysLeft > 0 && (
                      <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {daysLeft}d
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
