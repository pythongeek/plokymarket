import React, { useEffect, useRef, useState } from 'react';
import { MarketDataLevel } from '@/lib/clob/types';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface PriceLadderProps {
    marketId: string;
    bids: MarketDataLevel[];
    asks: MarketDataLevel[];
}

export const PriceLadder: React.FC<PriceLadderProps> = ({ marketId, bids, asks }) => {
    const {
        tradingState,
        setTradingPrice,
        setTradingSide,
        placeOrder
    } = useStore();

    const [hoverPrice, setHoverPrice] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Determine precision based on the smallest price increment
    const getPrecision = (levels: MarketDataLevel[]) => {
        if (levels.length === 0) return 2;
        const prices = levels.map(l => l.price);
        const diffs = prices.slice(1).map((p, i) => Math.abs(p - prices[i]));
        const minDiff = Math.min(...diffs, 0.01);
        return minDiff < 0.01 ? 3 : 2;
    };

    const precision = Math.max(getPrecision(bids), getPrecision(asks));

    const handleRowClick = async (price: number, side: 'buy' | 'sell') => {
        if (tradingState.isOneClick) {
            // One-Click Execution
            try {
                await placeOrder(marketId, side, 'YES', price, tradingState.quantity);
                // Ideally show a toast here, but avoiding external deps for now
                console.log('Order placed successfully');
            } catch (e) {
                console.error('Failed to place order', e);
            }
        } else {
            // Standard Selection
            setTradingPrice(price);
            setTradingSide(side);
        }
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!hoverPrice && !tradingState.price) return;
            // ... (rest of logic if needed globally)
        };
        // We use the div onKeyDown instead
    }, [hoverPrice, tradingState.price]);

    return (
        <div
            ref={containerRef}
            className="flex flex-col w-64 bg-background border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    // ArrowUp = Increase Price (Move to Ask side or higher Ask)
                    // ArrowDown = Decrease Price (Move to Bid side or lower Bid)

                    const tick = 1 / Math.pow(10, precision);
                    const current = tradingState.price || (asks[0]?.price || bids[0]?.price || 0.5);
                    let next = current;

                    if (e.key === 'ArrowUp') next += tick;
                    if (e.key === 'ArrowDown') next -= tick;

                    // Round to precision to avoid floating point issues
                    next = parseFloat(next.toFixed(precision));
                    setTradingPrice(next);
                }
            }}
            onWheel={(e) => {
                // Prevent default scrolling of page if focused? 
                // Maybe only if modifying price. 
                // But native div scroll might be desired if list is long.
                // The list is not scrollable (it shows top N).
                // So wheel can map to price change.

                if (Math.abs(e.deltaY) > 0) {
                    const tick = 1 / Math.pow(10, precision);
                    const current = tradingState.price || asks[0]?.price || 0.5;
                    // Scroll Up (negative delta) = Increase Price
                    // Scroll Down (positive delta) = Decrease Price
                    const change = e.deltaY < 0 ? tick : -tick;

                    // Acceleration could be added here based on Math.abs(e.deltaY) magnitude

                    const next = parseFloat((current + change).toFixed(precision));
                    setTradingPrice(next);
                }
            }}
        >
            <div className="grid grid-cols-3 p-2 font-medium border-b text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
            </div>

            <div className="flex flex-col-reverse relative">
                {/* Asks (Low -> High in array). Reverse locally to show High Top. */}
                {[...asks].reverse().map((ask, i) => (
                    <div
                        key={i}
                        className={cn(
                            "grid grid-cols-3 p-1 cursor-pointer relative transition-colors",
                            tradingState.price === ask.price ? "bg-accent" : "hover:bg-muted"
                        )}
                        onClick={() => handleRowClick(ask.price, 'buy')} // Clicking Ask means I want to BUY
                        onMouseEnter={() => setHoverPrice(ask.price)}
                        onMouseLeave={() => setHoverPrice(null)}
                    >
                        <span className="text-red-500">{ask.price.toFixed(precision)}</span>
                        <span className="text-right">{ask.size.toFixed(2)}</span>
                        <span className="text-right text-muted-foreground">{(ask.total || 0).toFixed(2)}</span>
                        <div className="absolute top-0 right-0 h-full bg-red-500/10 pointer-events-none" style={{ width: `${Math.min(ask.size * 10, 100)}%` }} />

                        {/* One Click Indicator */}
                        {tradingState.isOneClick && hoverPrice === ask.price && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 text-green-700 font-bold backdrop-blur-[1px]">
                                BUY
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-2 text-center font-bold border-y bg-muted/50 my-1 text-[10px] text-muted-foreground">
                SPREAD
            </div>

            <div className="flex flex-col relative">
                {bids.map((bid, i) => (
                    <div
                        key={i}
                        className={cn(
                            "grid grid-cols-3 p-1 cursor-pointer relative transition-colors",
                            tradingState.price === bid.price ? "bg-accent" : "hover:bg-muted"
                        )}
                        onClick={() => handleRowClick(bid.price, 'sell')} // Clicking Bid means I want to SELL
                        onMouseEnter={() => setHoverPrice(bid.price)}
                        onMouseLeave={() => setHoverPrice(null)}
                    >
                        <span className="text-green-500">{bid.price.toFixed(precision)}</span>
                        <span className="text-right">{bid.size.toFixed(2)}</span>
                        <span className="text-right text-muted-foreground">{(bid.total || 0).toFixed(2)}</span>
                        <div className="absolute top-0 right-0 h-full bg-green-500/10 pointer-events-none" style={{ width: `${Math.min(bid.size * 10, 100)}%` }} />

                        {/* One Click Indicator */}
                        {tradingState.isOneClick && hoverPrice === bid.price && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-red-700 font-bold backdrop-blur-[1px]">
                                SELL
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
