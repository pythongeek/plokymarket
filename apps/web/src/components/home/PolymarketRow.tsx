'use client';

import Link from 'next/link';
import { BarChart2, Clock, TrendingUp } from 'lucide-react';

interface PolymarketCardProps {
    id: string;
    title?: string;
    question: string;
    image_url?: string;
    yes_price?: number;
    no_price?: number;
    current_yes_price?: number;
    current_no_price?: number;
    volume_total?: number;
    total_volume?: number;
    unique_traders?: number;
    category?: string;
    trading_closes_at?: string;
    is_featured?: boolean;
}

function formatVolume(vol: number): string {
    if (vol >= 100000) return `৳${(vol / 100000).toFixed(1)} লাখ`;
    if (vol >= 1000) return `৳${(vol / 1000).toFixed(1)}K`;
    return `৳${vol}`;
}

function getTimeLeft(dateString?: string): string {
    if (!dateString) return '';
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return 'শেষ';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 30) return `${Math.floor(days / 30)} মাস`;
    if (days > 0) return `${days}দি`;
    return `${hours}ঘ`;
}

export function PolymarketCard({ market }: { market: PolymarketCardProps }) {
    const yesPrice = market.current_yes_price ?? market.yes_price ?? 50;
    const noPrice = market.current_no_price ?? market.no_price ?? 50;
    const volume = market.volume_total ?? market.total_volume ?? 0;
    const displayTitle = market.title || market.question;
    const timeLeft = getTimeLeft(market.trading_closes_at);

    return (
        <Link href={`/markets/${market.id}`} className="block">
            <div className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full flex flex-col">
                {/* Top: Round Thumbnail + Title */}
                <div className="flex items-start gap-3 mb-3 flex-1">
                    {/* Shiny Round Thumbnail */}
                    <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 ring-2 ring-white shadow-lg">
                            {market.image_url ? (
                                <img src={market.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500">
                                    <BarChart2 className="w-5 h-5 text-white/90" />
                                </div>
                            )}
                        </div>
                        {/* Shiny ring effect */}
                        <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/60 pointer-events-none" />
                        <div className="absolute -inset-[1px] rounded-full bg-gradient-to-tr from-blue-400/20 via-transparent to-purple-400/20 pointer-events-none" />
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {displayTitle}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                            {market.category && (
                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded">
                                    {market.category}
                                </span>
                            )}
                            {timeLeft && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5" />
                                    {timeLeft}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom: Yes/No + Volume */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.preventDefault(); window.location.href = `/markets/${market.id}?side=yes`; }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors"
                    >
                        <span className="text-[10px] text-emerald-600 font-bold">হ্যাঁ</span>
                        <span className="text-[13px] font-black text-emerald-600">{yesPrice.toFixed(0)}%</span>
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); window.location.href = `/markets/${market.id}?side=no`; }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                    >
                        <span className="text-[10px] text-red-500 font-bold">না</span>
                        <span className="text-[13px] font-black text-red-500">{noPrice.toFixed(0)}%</span>
                    </button>
                    <div className="flex flex-col items-center px-2 min-w-[50px]">
                        <span className="text-[11px] font-semibold text-gray-600">{formatVolume(volume)}</span>
                        <span className="text-[9px] text-gray-400">ভলিউম</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function PolymarketCardSkeleton() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-gray-200" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
            </div>
            <div className="flex gap-2">
                <div className="flex-1 h-9 rounded-lg bg-gray-100" />
                <div className="flex-1 h-9 rounded-lg bg-gray-100" />
                <div className="w-[50px] h-9 bg-gray-50 rounded" />
            </div>
        </div>
    );
}

// Also export the old row-style for backward compat
export { PolymarketCard as PolymarketRow };
export { PolymarketCardSkeleton as PolymarketRowSkeleton };
