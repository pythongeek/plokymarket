'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';

interface TickerMarket {
    id: string;
    title: string;
    question: string;
    yes_price: number;
    no_price: number;
    change_24h: number;
    volume: number;
}

interface LiveMarketsTickerProps {
    initialMarkets?: TickerMarket[];
}

interface RealtimePayload {
    new: {
        id: string;
        total_volume?: number;
        current_yes_price?: number;
        current_no_price?: number;
        price_24h_change?: number;
    };
}

export default function LiveMarketsTicker({ initialMarkets = [] }: LiveMarketsTickerProps) {
    const { t } = useTranslation();
    const [markets, setMarkets] = useState<TickerMarket[]>(initialMarkets);
    const [isPaused, setIsPaused] = useState(false);
    const tickerRef = useRef<HTMLDivElement>(null);
    const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

    // Initialize Supabase client
    useEffect(() => {
        supabaseRef.current = createClient();
    }, []);

    // Subscribe to real-time market updates using Supabase Realtime
    // Updates volume when trades happen on any market
    useEffect(() => {
        if (!supabaseRef.current || markets.length === 0) return;

        const marketIds = markets.map(m => m.id);

        const subscription = supabaseRef.current
            .channel('ticker-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'events',
                    filter: `id=in.(${marketIds.join(',')})`
                },
                (payload: RealtimePayload) => {
                    const updatedEvent = payload.new;
                    setMarkets(prev => prev.map(m =>
                        m.id === updatedEvent.id
                            ? {
                                ...m,
                                volume: updatedEvent.total_volume ?? m.volume,
                                yes_price: updatedEvent.current_yes_price ?? m.yes_price,
                                no_price: updatedEvent.current_no_price ?? m.no_price,
                                change_24h: updatedEvent.price_24h_change ?? m.change_24h
                            }
                            : m
                    ));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [markets.length > 0]); // Only subscribe when we have markets

    // Handle mouse hover to pause animation
    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => setIsPaused(false);

    // Format volume for display
    const formatVolume = (vol: number) => {
        if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
        if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
        return `$${vol.toFixed(0)}`;
    };

    // Format price with color
    const formatPrice = (price: number) => {
        return `${(price * 100).toFixed(1)}¢`;
    };

    // Format change with color
    const formatChange = (change: number) => {
        if (change > 0) return { text: `+${change.toFixed(1)}%`, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' };
        if (change < 0) return { text: `${change.toFixed(1)}%`, color: 'text-red-400', bgColor: 'bg-red-500/20' };
        return { text: '0.0%', color: 'text-slate-400', bgColor: 'bg-slate-500/20' };
    };

    // If no markets, show placeholder
    const displayMarkets = markets.length > 0 ? markets : [
        { id: 'placeholder', title: t('common.waiting_for_data', 'Waiting for live data...'), question: '', yes_price: 0.5, no_price: 0.5, change_24h: 0, volume: 0 }
    ];

    return (
        <div className="w-full border-y border-white/5 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-sm overflow-hidden py-3">
            <div className="flex relative">
                <motion.div
                    ref={tickerRef}
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: isPaused ? 0 : "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 40
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Duplicate list 3 times for seamless loop */}
                    {[...displayMarkets, ...displayMarkets, ...displayMarkets].map((market, i) => {
                        const priceText = formatPrice(market.yes_price);
                        const changeInfo = formatChange(market.change_24h);

                        return (
                            <div
                                key={`${market.id}-${i}`}
                                className="flex items-center gap-3 text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer group"
                            >
                                <span className="flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 opacity-70 text-blue-400" />
                                    <span className="max-w-[180px] truncate">{market.title}</span>
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                                    {priceText}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${changeInfo.bgColor} ${changeInfo.color} font-medium`}>
                                    {changeInfo.text}
                                </span>
                                <div className="w-1 h-1 rounded-full bg-white/20 ml-2" />
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}

