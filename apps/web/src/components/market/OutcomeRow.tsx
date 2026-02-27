'use client';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MarketOutcome } from '@/types';
import { useBetSlipStore } from '@/store/betSlipStore';
import { toast } from 'sonner';

interface OutcomeRowProps {
    outcome: MarketOutcome;
    marketId: string;
    marketTitle: string;
    isSelected: boolean;
    onTrade: (outcome: MarketOutcome, direction: 'YES' | 'NO') => void;
    disabled: boolean;
}

export function OutcomeRow({ outcome, marketId, marketTitle, isSelected, onTrade, disabled }: OutcomeRowProps) {
    const { addItem: addToSlip } = useBetSlipStore();
    const pct = Math.round(outcome.current_price * 100);
    const isUp = (outcome.price_change_24h ?? 0) >= 0;

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl border transition-colors
      ${isSelected ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70'}`}>
            {outcome.image_url && (
                <img src={outcome.image_url} alt={outcome.label}
                    className="w-8 h-8 rounded-full object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{outcome.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg font-bold text-white">{pct}¢</span>
                    {isUp
                        ? <span className="text-green-400 text-xs flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" />+{Math.abs(outcome.price_change_24h ?? 0).toFixed(1)}¢</span>
                        : <span className="text-red-400 text-xs flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" />-{Math.abs(outcome.price_change_24h ?? 0).toFixed(1)}¢</span>
                    }
                </div>
            </div>
            {/* Probability bar */}
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${pct}%` }} />
            </div>
            <div className="flex gap-1 shrink-0">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        addToSlip({
                            marketId,
                            marketTitle,
                            outcome: outcome.label,
                            side: 'buy',
                            price: outcome.current_price,
                            quantity: 100, // Default batch quantity
                            orderType: 'market'
                        });
                        toast.success('স্লিপে যোগ করা হয়েছে');
                    }}
                    className="p-1.5 h-7 w-7 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                    <ShoppingCart className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" disabled={disabled}
                    onClick={() => onTrade(outcome, 'YES')}
                    className="bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/40 text-xs h-7 px-2">
                    কিনুন {pct}¢
                </Button>
                <Button size="sm" disabled={disabled}
                    onClick={() => onTrade(outcome, 'NO')}
                    className="bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/40 text-xs h-7 px-2">
                    বিক্রি {100 - pct}¢
                </Button>
            </div>
        </div>
    );
}
