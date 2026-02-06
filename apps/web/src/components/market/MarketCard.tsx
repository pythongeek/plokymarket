'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import type { Market } from '@/types';
import { useTranslation } from 'react-i18next';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const { t, i18n } = useTranslation();
  const yesPrice = market.yes_price || 0.5;
  const noPrice = market.no_price || 0.5;
  const volume = market.total_volume;

  // Translate category
  const translateCategory = (cat: string) => {
    const key = `categories.${cat}`;
    const translated = t(key);
    return translated !== key ? translated : cat;
  };

  // Get appropriate locale for date-fns
  const getLocale = () => {
    return i18n.language === 'bn' ? bn : undefined;
  };

  return (
    <Link href={`/markets/${market.id}`} className="block h-full cursor-pointer group">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 border border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Image */}
        {market.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={market.image_url}
              alt={market.question}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <Badge
              className="absolute top-4 left-4 font-bold shadow-lg backdrop-blur-md bg-primary/80 hover:bg-primary"
              variant="default"
            >
              {translateCategory(market.category)}
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-bold line-clamp-2 leading-tight tracking-tight group-hover:text-primary transition-colors">
              {market.question}
            </h3>
          </div>
          {market.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed opacity-80">
              {market.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Price Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-green-500/5 border border-green-500/10 p-4 transition-colors group-hover:bg-green-500/10">
              <div className="flex items-center gap-2 text-xs font-bold text-green-500 uppercase tracking-wider mb-2">
                <TrendingUp className="h-3.5 w-3.5" />
                {t('market_card.yes')}
              </div>
              <div className="text-2xl font-black text-green-500">
                ৳{yesPrice.toFixed(2)}
              </div>
              <div className="mt-1 text-[10px] font-medium text-green-500/60 uppercase">
                {(yesPrice * 100).toFixed(0)}% {t('market_card.chance')}
              </div>
            </div>

            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 transition-colors group-hover:bg-red-500/10">
              <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-wider mb-2">
                <TrendingDown className="h-3.5 w-3.5" />
                {t('market_card.no')}
              </div>
              <div className="text-2xl font-black text-red-500">
                ৳{noPrice.toFixed(2)}
              </div>
              <div className="mt-1 text-[10px] font-medium text-red-500/60 uppercase">
                {(noPrice * 100).toFixed(0)}% {t('market_card.chance')}
              </div>
            </div>
          </div>

          {/* Stats & CTA */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground/70 bg-secondary/30 p-2 rounded-lg">
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-primary/70" />
                <span>{t('market_card.vol')}: <span className="text-foreground font-bold">৳{volume.toLocaleString()}</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-orange-500/70" />
                <span>{t('market_card.closes')} {formatDistanceToNow(new Date(market.trading_closes_at), { addSuffix: true, locale: getLocale() })}</span>
              </div>
            </div>

            <Button className="w-full h-12 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              {t('market_card.trade_now')}
              <TrendingUp className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
