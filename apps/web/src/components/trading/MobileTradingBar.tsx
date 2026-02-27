'use client';
import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { TradingBottomSheet } from './TradingBottomSheet';

interface MobileTradingBarProps {
    marketId: string;
    yesPrice: number;
    noPrice: number;
    disabled?: boolean;
}

export function MobileTradingBar({ marketId, yesPrice, noPrice, disabled }: MobileTradingBarProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-900 border-t border-slate-700 p-3 flex items-center gap-3 safe-area-pb">
                <div className="flex-1">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">বর্তমান মূল্য</p>
                    <div className="flex gap-3">
                        <span className="text-emerald-400 font-black">YES {Math.round(yesPrice * 100)}¢</span>
                        <span className="text-rose-400 font-black">NO {Math.round(noPrice * 100)}¢</span>
                    </div>
                </div>
                <button
                    disabled={disabled}
                    onClick={() => setOpen(true)}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    <TrendingUp className="w-4 h-4" /> ট্রেড করুন
                </button>
            </div>
            <TradingBottomSheet open={open} onClose={() => setOpen(false)} marketId={marketId} />
            {/* Spacer to prevent content from hiding behind bar on mobile */}
            <div className="h-20 lg:hidden" />
        </>
    );
}
