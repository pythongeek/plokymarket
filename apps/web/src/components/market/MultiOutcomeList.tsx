'use client';
import { useState } from 'react';
import { OutcomeRow } from './OutcomeRow';
import { TradingPanel } from '@/components/trading/TradingPanel';
import type { Market, MarketOutcome } from '@/types';

interface MultiOutcomeListProps {
    outcomes: MarketOutcome[];
    market: Market;
    marketStatus: string;
}

export function MultiOutcomeList({ outcomes, market, marketStatus }: MultiOutcomeListProps) {
    const [selectedOutcome, setSelectedOutcome] = useState<MarketOutcome | null>(null);
    const [tradeDirection, setTradeDirection] = useState<'YES' | 'NO'>('YES');

    const handleTrade = (outcome: MarketOutcome, direction: 'YES' | 'NO') => {
        setSelectedOutcome(outcome);
        setTradeDirection(direction);
    };

    return (
        <div className="space-y-2">
            <div className="grid gap-2">
                {outcomes.map((outcome) => (
                    <OutcomeRow
                        key={outcome.id}
                        outcome={outcome}
                        marketId={market.id}
                        marketTitle={market.question || market.title || 'Market'}
                        isSelected={selectedOutcome?.id === outcome.id}
                        onTrade={handleTrade}
                        disabled={marketStatus !== 'active'}
                    />
                ))}
            </div>
            {selectedOutcome && (
                <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-400 text-sm">
                            ট্রেড করুন: <span className="text-white font-medium">{selectedOutcome.label}</span>
                        </p>
                        <button
                            onClick={() => setSelectedOutcome(null)}
                            className="text-xs text-slate-500 hover:text-white"
                        >
                            বন্ধ করুন
                        </button>
                    </div>
                    <TradingPanel
                        market={market}
                        selectedOutcomeId={selectedOutcome.id}
                        forcedDirection={tradeDirection}
                        isPaused={marketStatus !== 'active'}
                    />
                </div>
            )}
        </div>
    );
}
