'use client';

import { useExchangeRate } from '@/hooks/useExchangeRate';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function ExchangeRateBadge() {
    const { rate, isLoading, isError, source, refetch, cached } = useExchangeRate();

    if (isLoading && source === 'initializing') {
        return (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-400">Loading Market Rate...</span>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all duration-300 ${isError
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                }`}
            title={`Price Source: ${source}${cached ? ' (Cached)' : ''}`}
        >
            {isError ? (
                <AlertTriangle className="w-3 h-3" />
            ) : (
                <div className={`w-2 h-2 rounded-full bg-emerald-500 ${isLoading ? 'animate-ping' : 'animate-pulse'}`} />
            )}

            <span className="text-xs font-bold whitespace-nowrap">
                1 USDT ≈ {rate.toFixed(2)} BDT
                {isError && <span className="ml-1 text-[10px] opacity-70">(est.)</span>}
            </span>

            <button
                onClick={() => refetch()}
                disabled={isLoading}
                aria-label="Refresh exchange rate"
                className={`hover:bg-black/20 rounded-full p-0.5 transition-transform ${isLoading ? 'animate-spin' : 'hover:rotate-180 duration-500'}`}
            >
                <RefreshCcw className="w-3 h-3" />
            </button>
        </motion.div>
    );
}
