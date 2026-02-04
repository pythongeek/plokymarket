'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface Market {
    title: string;
    change: string;
    color: string;
}

interface LiveMarketsTickerProps {
    initialMarkets?: Market[];
}

export default function LiveMarketsTicker({ initialMarkets = [] }: LiveMarketsTickerProps) {
    // Fallback to initialMarkets or empty array
    const displayMarkets = initialMarkets.length > 0 ? initialMarkets : [
        { title: "Waiting for live data...", change: "...", color: "text-gray-500" }
    ];

    return (
        <div className="w-full border-y border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden py-3">
            <div className="flex relative">
                <motion.div
                    className="flex gap-8 whitespace-nowrap"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30 // Slower for readability
                    }}
                >
                    {/* Duplicate list 3 times for seamless loop */}
                    {[...displayMarkets, ...displayMarkets, ...displayMarkets].map((market, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground/80 hover:text-white transition-colors cursor-pointer">
                            <span className="flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 opacity-70" />
                                {market.title}
                            </span>
                            <span className={market.color}>{market.change}</span>
                            <div className="w-1 h-1 rounded-full bg-white/20 ml-2" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
