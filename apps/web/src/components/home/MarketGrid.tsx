'use client';

import { useTranslation } from 'react-i18next';
import { Activity, ChevronRight, BarChart2, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface MarketCardProps {
    id: string;
    question: string;
    image_url?: string;
    yes_price: number;
    no_price: number;
    volume_total: number;
    category: string;
}

export function MarketCard({ market }: { market: MarketCardProps }) {
    const { t } = useTranslation();

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group bg-card text-card-foreground rounded-2xl border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
        >
            <div className="relative h-48 overflow-hidden bg-muted">
                {market.image_url ? (
                    <img
                        src={market.image_url}
                        alt={market.question}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <BarChart2 className="w-16 h-16" />
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md">
                    {market.category}
                </div>
                {/* Live Indicator */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] text-white font-bold uppercase tracking-tight">Live</span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-base font-bold mb-6 leading-relaxed line-clamp-2 min-h-[3rem]">
                    {market.question}
                </h3>

                <div className="flex gap-2 mb-4">
                    <Link href={`/markets/${market.id}?side=yes`} className="flex-1">
                        <button className="w-full bg-[#f0f9f4] hover:bg-green-100 border border-green-100 rounded-xl py-3 px-2 transition-colors">
                            <span className="block text-[11px] text-green-600 font-bold mb-1 uppercase tracking-tight">হ্যাঁ (Yes)</span>
                            <span className="block text-lg font-black text-green-600">৳{(market.yes_price ?? 0).toFixed(2)}</span>
                        </button>
                    </Link>
                    <Link href={`/markets/${market.id}?side=no`} className="flex-1">
                        <button className="w-full bg-[#fff5f5] hover:bg-red-100 border border-red-100 rounded-xl py-3 px-2 transition-colors">
                            <span className="block text-[11px] text-red-600 font-bold mb-1 uppercase tracking-tight">না (No)</span>
                            <span className="block text-lg font-black text-red-600">৳{(market.no_price ?? 0).toFixed(2)}</span>
                        </button>
                    </Link>
                </div>

                <div className="mt-auto flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {(market.volume_total ?? 0).toLocaleString()} ট্রেডার্স
                    </span>
                    <Link href={`/markets/${market.id}`} className="text-primary/70 hover:text-primary flex items-center gap-0.5 font-bold">
                        ট্রেড করুন <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

export default function MarketGrid({ title, icon: Icon, markets, tag }: { title: string, icon: any, markets: any[], tag?: string }) {
    const { t } = useTranslation();

    return (
        <section className="py-2">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-3">
                    <Icon className="w-5 h-5 text-green-500" />
                    {title} {tag && <span className="text-muted-foreground font-normal">({tag})</span>}
                </h2>
                <Link href="/markets" className="text-primary hover:underline text-[13px] font-bold flex items-center gap-0.5">
                    {t('premium_home.see_all')} <ChevronRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {markets.map((market) => (
                    <MarketCard key={market.id} market={{ ...market, category: market.category_label || market.category }} />
                ))}
            </div>
        </section>
    );
}
