import React from 'react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { DepthChart } from './DepthChart';
import { PriceLadder } from './PriceLadder';

interface OrderBookProps {
    marketId: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ marketId }) => {
    const { bids, asks, loading } = useOrderBook(marketId);

    if (loading) {
        return <div className="animate-pulse h-64 bg-muted rounded"></div>;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="flex-1">
                    <DepthChart bids={bids} asks={asks} />
                </div>
                <div className="flex-none">
                    <PriceLadder bids={bids} asks={asks} />
                </div>
            </div>
        </div>
    );
};
