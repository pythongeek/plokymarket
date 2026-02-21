import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderBook } from '@/hooks/useOrderBook';

interface OrderBookMiniProps {
    marketId: string;
}

export function OrderBookMini({ marketId }: OrderBookMiniProps) {
    const { t } = useTranslation();
    const { bids, asks, loading } = useOrderBook(marketId, 5, 1);

    const spread = useMemo(() => {
        if (bids.length > 0 && asks.length > 0) {
            const bestBid = bids[0].price;
            const bestAsk = asks[0].price;
            const spreadVal = bestAsk - bestBid;
            const spreadPct = (spreadVal / ((bestAsk + bestBid) / 2)) * 100;
            return { value: spreadVal, pct: spreadPct };
        }
        return null;
    }, [bids, asks]);

    if (loading) {
        return <div className="animate-pulse h-32 bg-muted/50 rounded-lg"></div>;
    }

    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden text-xs">
            <div className="grid grid-cols-4 px-3 py-2 border-b bg-muted/30 text-muted-foreground font-medium">
                <div className="col-span-1">Price</div>
                <div className="col-span-1 text-right">Yes Shares</div>
                <div className="col-span-1 text-right">No Shares</div>
                <div className="col-span-1 text-right">Cumulative</div>
            </div>

            <div className="flex flex-col">
                {/* Asks (Sellers of Yes / Buyers of No) - Red */}
                <div className="flex flex-col-reverse">
                    {asks.slice(0, 5).map((ask, i) => {
                        const cumulative = asks.slice(0, i + 1).reduce((acc, curr) => acc + curr.size, 0);
                        const intensity = Math.min(100, (cumulative / 5000) * 100);
                        return (
                            <div key={`ask-${ask.price}`} className="grid grid-cols-4 px-3 py-1 relative hover:bg-muted/50 transition-colors">
                                <div
                                    className="absolute right-0 top-0 bottom-0 bg-red-500/10 -z-10"
                                    style={{ width: `${intensity}%` }}
                                />
                                <div className="col-span-1 text-red-500 font-medium">{ask.price.toFixed(2)}</div>
                                <div className="col-span-1 text-right">—</div>
                                <div className="col-span-1 text-right">{ask.size.toLocaleString()}</div>
                                <div className="col-span-1 text-right text-muted-foreground">{cumulative.toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Spread Indicator */}
                {spread ? (
                    <div className="flex items-center justify-center gap-2 py-1.5 my-1 bg-muted/30 text-[10px] text-muted-foreground backdrop-blur-sm border-y border-border/50">
                        <span>Spread</span>
                        <span className="font-mono">{spread.value.toFixed(2)}</span>
                        <span className="text-primary/70">({spread.pct.toFixed(1)}%)</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-1.5 my-1 bg-muted/30 text-[10px] text-muted-foreground border-y border-border/50">
                        No spread data
                    </div>
                )}

                {/* Bids (Buyers of Yes / Sellers of No) - Green */}
                <div className="flex flex-col">
                    {bids.slice(0, 5).map((bid, i) => {
                        const cumulative = bids.slice(0, i + 1).reduce((acc, curr) => acc + curr.size, 0);
                        const intensity = Math.min(100, (cumulative / 5000) * 100);
                        return (
                            <div key={`bid-${bid.price}`} className="grid grid-cols-4 px-3 py-1 relative hover:bg-muted/50 transition-colors">
                                <div
                                    className="absolute right-0 top-0 bottom-0 bg-green-500/10 -z-10"
                                    style={{ width: `${intensity}%` }}
                                />
                                <div className="col-span-1 text-green-500 font-medium">{bid.price.toFixed(2)}</div>
                                <div className="col-span-1 text-right">{bid.size.toLocaleString()}</div>
                                <div className="col-span-1 text-right">—</div>
                                <div className="col-span-1 text-right text-muted-foreground">{cumulative.toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
