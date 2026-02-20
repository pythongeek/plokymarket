'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, BarChart3, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import type { Market } from '@/types';
import { useTranslation } from 'react-i18next';
import { formatCompactNumber } from '@/lib/utils/format';
import { motion } from 'framer-motion';

// Skeleton and Error states would normally be separate components or handled by parent,
// but we will build the card to handle loading gracefully if data is missing.
interface MarketCardProps {
  market: Market;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

const categoryColors: Record<string, string> = {
  Sports: 'bg-green-100 text-green-800 border-green-200',
  Politics: 'bg-blue-100 text-blue-800 border-blue-200',
  Crypto: 'bg-orange-100 text-orange-800 border-orange-200',
  Economics: 'bg-purple-100 text-purple-800 border-purple-200',
  Technology: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Entertainment: 'bg-pink-100 text-pink-800 border-pink-200',
  'World Events': 'bg-red-100 text-red-800 border-red-200',
  Science: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Culture: 'bg-amber-100 text-amber-800 border-amber-200',
  Business: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export function MarketCard({ market, isLoading, isError, onRetry }: MarketCardProps) {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <div className="h-[320px] bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse overflow-hidden">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 w-full" />
        <div className="p-4 space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-[320px] bg-white dark:bg-gray-800 rounded-xl border border-red-200 border-dashed flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-4">{t('events.error_loading', 'Failed to load market')}</p>
        <button onClick={onRetry} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors">
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const yesPrice = market.yes_price || 0.5;
  const volume = market.total_volume || 0;

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

  const endsAtTs = new Date(market.trading_closes_at);
  const isPast = endsAtTs.getTime() < Date.now();

  // Custom Time Remaining
  const timeRemainingText = isPast
    ? t('market_card.closed', 'Closed')
    : formatDistanceToNow(endsAtTs, { addSuffix: true, locale: getLocale() });

  return (
    <Link href={`/markets/${market.id}`} className="block h-full cursor-pointer focus:outline-none">
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="group relative h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col"
      >
        {/* Image Header with Category Badge */}
        <div className="relative h-32 bg-gray-100 dark:bg-gray-900 shrink-0">
          {market.image_url ? (
            <Image
              src={market.image_url}
              alt={market.question}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
              <BarChart3 className="w-12 h-12" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          <span className={`absolute top-2 left-2 px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-md shadow-sm border ${categoryColors[market.category] || 'bg-white/90 text-gray-800 border-gray-200 dark:bg-gray-800/90 dark:text-gray-200 dark:border-gray-700'}`}>
            {translateCategory(market.category)}
          </span>

          {(market.is_verified || market.status === 'resolved') && (
            <BadgeCheck className="absolute top-2 right-2 w-5 h-5 text-blue-500 drop-shadow-sm bg-white/50 rounded-full" />
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-4 group-hover:text-primary transition-colors leading-snug flex-1">
            {market.question}
          </h3>

          {/* Price and Volume Row */}
          <div className="flex items-center justify-between mt-auto mb-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('market_card.yes', 'Yes')}</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold text-green-600 dark:text-green-500 tracking-tight">
                  ৳{(yesPrice * 100).toFixed(1)}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {t('market_card.probability_short', 'prob')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('market_card.vol', 'Vol')}</span>
              <div className="font-semibold text-gray-900 dark:text-gray-100 mt-0.5 text-lg">
                ৳{formatCompactNumber(volume)}
              </div>
            </div>
          </div>

          {/* Countdown Footer */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/60 pt-3">
            <Clock className="w-4 h-4 opacity-70" />
            <span className="truncate">{timeRemainingText}</span>
            {market.status === 'paused' && (
              <span className="ml-auto text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-sm">Paused</span>
            )}
            {market.status === 'resolved' && (
              <span className="ml-auto text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-sm">Resolved</span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
