/**
 * EventCard Component
 * Production-ready market/event card with real-time price updates
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  BadgeCheck,
  Flame,
  PauseCircle,
  CheckCircle2,
  XCircle,
  Volume2,
  Users
} from 'lucide-react';
import { useRealtimePrice } from '@/hooks/useRealtimePrice';
import { formatCompactNumber, formatTimeRemaining } from '@/lib/utils/format';
import type { Event } from '@/types/database';

interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'featured';
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

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  active: { icon: null, color: '', label: 'Active' },
  draft: { icon: Clock, color: 'text-gray-500', label: 'Draft' },
  pending: { icon: Clock, color: 'text-blue-500', label: 'Pending' },
  paused: { icon: PauseCircle, color: 'text-amber-500', label: 'Paused' },
  closed: { icon: XCircle, color: 'text-blue-500', label: 'Closed' },
  resolved: { icon: CheckCircle2, color: 'text-green-500', label: 'Resolved' },
  cancelled: { icon: XCircle, color: 'text-red-500', label: 'Cancelled' },
};

export function EventCard({ event, variant = 'default' }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const yesPrice = useRealtimePrice(event.id, 'yes');

  const timeRemaining = useMemo(() =>
    formatTimeRemaining(event.trading_closes_at || event.ends_at || ''),
    [event.trading_closes_at, event.ends_at]
  );

  const priceChange = event.price_24h_change || 0;
  const status = statusConfig[event.status || event.trading_status || 'active'] || statusConfig.active;
  const StatusIcon = status.icon;

  if (variant === 'compact') {
    return (
      <Link to={`/markets/${event.slug}`}>
        <motion.div
          className="group flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          whileHover={{ x: 4 }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {event.question}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[event.category] || 'bg-gray-100 text-gray-800'}`}>
                {event.category}
              </span>
              <span className="text-xs text-gray-500">{timeRemaining}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {(yesPrice * 100).toFixed(1)}¢
            </p>
            <p className="text-xs text-gray-500">
              ${formatCompactNumber(event.total_volume || event.volume || 0)}
            </p>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/markets/${event.slug}`}>
      <motion.div
        className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700 ${variant === 'featured' ? 'ring-2 ring-blue-500/20' : ''
          }`}
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className={`relative ${variant === 'featured' ? 'h-48' : 'h-40'} bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800`}>
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title || event.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <TrendingUp className="w-16 h-16 text-gray-400" />
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 ${categoryColors[event.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              {event.category}
            </span>

            {event.is_verified && (
              <BadgeCheck className="w-6 h-6 text-blue-500 bg-white/90 dark:bg-gray-800/90 rounded-full p-0.5" />
            )}

            {event.is_trending && (
              <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
                <Flame className="w-3 h-3" />
                Trending
              </span>
            )}
          </div>

          {/* Status Overlay */}
          {(event.status || event.trading_status) !== 'active' && StatusIcon && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/95 dark:bg-gray-800/95 ${status.color}`}>
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{status.label}</span>
              </div>
            </div>
          )}

          {/* Featured Badge */}
          {variant === 'featured' && (
            <div className="absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full bg-blue-500 text-white">
              Featured
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Question */}
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {event.question}
          </h3>

          {/* Price Section */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Yes</span>
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={yesPrice}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold text-green-600 dark:text-green-400"
                >
                  {(yesPrice * 100).toFixed(1)}¢
                </motion.span>
                {priceChange !== 0 && (
                  <span className={`text-sm flex items-center ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange > 0 ? (
                      <TrendingUp className="w-4 h-4 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-0.5" />
                    )}
                    {Math.abs(priceChange * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Volume</span>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${formatCompactNumber(event.total_volume || event.volume || 0)}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{formatCompactNumber(event.unique_traders)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" />
              <span>{formatCompactNumber(event.total_trades)} trades</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{timeRemaining}</span>
            </div>
          </div>
        </div>

        {/* Hover Effect */}
        {isHovered && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          />
        )}
      </motion.div>
    </Link>
  );
}
