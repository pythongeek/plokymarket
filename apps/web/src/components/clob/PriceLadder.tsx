import React from 'react';
import { OrderLevel } from '@/lib/clob/types';

interface PriceLadderProps {
    bids: OrderLevel[];
    asks: OrderLevel[];
}

export const PriceLadder: React.FC<PriceLadderProps> = ({ bids, asks }) => {
    return (
        <div className="flex flex-col w-64 bg-background border rounded-lg text-xs">
            <div className="grid grid-cols-3 p-2 font-medium border-b text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
            </div>

            {/* Asks (Sell) - Red - Render reversed (High -> Low) so lowest ask is at bottom near spread? 
          Usually Price Ladder: High prices at top.
          Asks: 12, 11, 10 (Lowest).
          Bids: 9 (Highest), 8, 7.
          So we need Asks Reversed -> Bids.
      */}
            <div className="flex flex-col-reverse">
                {/* Asks (Low -> High in array). Reverse locally to show High Top. */}
                {[...asks].reverse().map((ask, i) => (
                    <div key={i} className="grid grid-cols-3 p-1 hover:bg-muted relative">
                        <span className="text-red-500">{ask.price.toFixed(2)}</span>
                        <span className="text-right">{ask.size.toFixed(2)}</span>
                        <span className="text-right">--</span>
                        <div className="absolute top-0 right-0 h-full bg-red-500/10" style={{ width: `${Math.min(ask.size * 10, 100)}%` }} />
                    </div>
                ))}
            </div>

            <div className="p-2 text-center font-bold border-y bg-muted/50 my-1">
                Spread
            </div>

            <div className="flex flex-col">
                {bids.map((bid, i) => (
                    <div key={i} className="grid grid-cols-3 p-1 hover:bg-muted relative">
                        <span className="text-green-500">{bid.price.toFixed(2)}</span>
                        <span className="text-right">{bid.size.toFixed(2)}</span>
                        <span className="text-right">--</span>
                        <div className="absolute top-0 right-0 h-full bg-green-500/10" style={{ width: `${Math.min(bid.size * 10, 100)}%` }} />
                    </div>
                ))}
            </div>
        </div>
    );
};
