import React, { useState, useEffect } from 'react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { WebGLDepthChart } from './WebGLDepthChart';
import { PriceLadder } from './PriceLadder';
import { LiquidityHeatMap, HeatMapColorScale } from './LiquidityHeatMap';
import { OrderBookControls } from './OrderBookControls';

interface OrderBookProps {
    marketId: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ marketId }) => {
    // Persistent Settings
    const [zoom, setZoom] = useState(1.0);
    const [granularity, setGranularity] = useState(1);
    const [isLocked, setIsLocked] = useState(false);

    const { bids, asks, loading, midPrice } = useOrderBook(marketId, 100, granularity);

    // Persistence Logic
    useEffect(() => {
        const saved = localStorage.getItem(`clob_zoom_${marketId}`);
        if (saved) {
            try {
                const { z, g, l } = JSON.parse(saved);
                setZoom(z);
                setGranularity(g);
                setIsLocked(l);
            } catch (e) {
                console.error("Error loading orderbook settings", e);
            }
        }
    }, [marketId]);

    useEffect(() => {
        const settings = JSON.stringify({ z: zoom, g: granularity, l: isLocked });
        localStorage.setItem(`clob_zoom_${marketId}`, settings);
    }, [zoom, granularity, isLocked, marketId]);

    if (loading) {
        return <div className="animate-pulse h-64 bg-muted rounded"></div>;
    }

    const handleFitSpread = () => {
        setZoom(1.0);
        setGranularity(1);
    };

    const handleFitDepth = () => {
        setZoom(0.1);
        setGranularity(10);
    };

    return (
        <div className="flex flex-col gap-6">
            <OrderBookControls
                zoom={zoom}
                onZoomChange={setZoom}
                granularity={granularity}
                onGranularityChange={setGranularity}
                isLocked={isLocked}
                onLockToggle={() => setIsLocked(!isLocked)}
                onFitSpread={handleFitSpread}
                onFitDepth={handleFitDepth}
                spreadPct={midPrice && bids[0] ? (asks[0].price - bids[0].price) / midPrice : 0.001}
            />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 flex flex-col gap-6">
                    <WebGLDepthChart
                        bids={bids}
                        asks={asks}
                        midPrice={midPrice}
                        zoomLevel={zoom}
                        granularity={granularity}
                    />
                    <LiquidityHeatMap bids={bids} asks={asks} colorScale={HeatMapColorScale.Professional} />
                </div>
                <div className="xl:col-span-1">
                    <PriceLadder marketId={marketId} bids={bids} asks={asks} />
                </div>
            </div>
        </div>
    );
};
