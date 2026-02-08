/**
 * Order Book Depth Component
 * 
 * Displays:
 * - Price-time priority order book
 * - Bid/ask spread visualization
 * - Volume at each price level
 * - Pro-rata enabled indicators
 */

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useMatchingEngine } from '@/hooks/useMatchingEngine';
import {
  ArrowDown,
  ArrowUp,
  Activity,
  Layers,
  Zap,
} from 'lucide-react';

interface OrderBookDepthProps {
  marketId: string;
  userId: string;
  maxRows?: number;
}

export function OrderBookDepth({
  marketId,
  userId,
  maxRows = 10,
}: OrderBookDepthProps) {
  const { orderBook, isLoading } = useMatchingEngine(marketId, userId);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  // Calculate max volume for scaling
  const maxVolume = useMemo(() => {
    const allVolumes = [
      ...orderBook.bids.map(b => b.totalVolume),
      ...orderBook.asks.map(a => a.totalVolume),
    ];
    return Math.max(...allVolumes, 1);
  }, [orderBook]);

  // Format number with commas
  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Order Book
          </CardTitle>
          <div className="flex items-center gap-2">
            {orderBook.spread > 0 && (
              <Badge variant="outline" className="text-xs">
                Spread: {formatNumber(orderBook.spread)}
              </Badge>
            )}
            {isLoading && (
              <Activity className="h-4 w-4 animate-pulse text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs text-muted-foreground border-b">
          <span>Price</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>

        {/* Asks (Sells) - Reversed to show highest first */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-0">
            {orderBook.asks.slice(0, maxRows).reverse().map((ask) => (
              <div
                key={ask.price}
                className={`relative grid grid-cols-3 gap-2 px-4 py-1 text-sm cursor-pointer transition-colors hover:bg-red-500/5 ${
                  selectedPrice === ask.price ? 'bg-red-500/10' : ''
                }`}
                onClick={() => setSelectedPrice(ask.price)}
              >
                {/* Volume bar background */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-red-500/10"
                  style={{ width: `${(ask.totalVolume / maxVolume) * 100}%` }}
                />
                
                {/* Content */}
                <span className="relative text-red-600 font-medium">
                  {formatNumber(ask.price)}
                </span>
                <span className="relative text-right">
                  {formatNumber(ask.totalVolume, 4)}
                </span>
                <span className="relative text-right text-muted-foreground">
                  {ask.orderCount} orders
                  {ask.proRataEnabled && (
                    <Zap className="inline h-3 w-3 ml-1 text-yellow-500" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Spread Indicator */}
        <div className="border-y bg-muted/50 py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-600">
                {formatNumber(orderBook.bestBid)}
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                Spread: {formatNumber(orderBook.spread)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-red-600">
                {formatNumber(orderBook.bestAsk)}
              </span>
              <ArrowDown className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </div>

        {/* Bids (Buys) */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-0">
            {orderBook.bids.slice(0, maxRows).map((bid) => (
              <div
                key={bid.price}
                className={`relative grid grid-cols-3 gap-2 px-4 py-1 text-sm cursor-pointer transition-colors hover:bg-green-500/5 ${
                  selectedPrice === bid.price ? 'bg-green-500/10' : ''
                }`}
                onClick={() => setSelectedPrice(bid.price)}
              >
                {/* Volume bar background */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                  style={{ width: `${(bid.totalVolume / maxVolume) * 100}%` }}
                />
                
                {/* Content */}
                <span className="relative text-green-600 font-medium">
                  {formatNumber(bid.price)}
                </span>
                <span className="relative text-right">
                  {formatNumber(bid.totalVolume, 4)}
                </span>
                <span className="relative text-right text-muted-foreground">
                  {bid.orderCount} orders
                  {bid.proRataEnabled && (
                    <Zap className="inline h-3 w-3 ml-1 text-yellow-500" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default OrderBookDepth;
