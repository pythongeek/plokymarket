import { useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { SpreadIndicator } from '@/components/market/SpreadIndicator';

interface OrderBookProps {
  marketId: string;
}

export function OrderBook({ marketId }: OrderBookProps) {
  const { orders, fetchOrders, subscribeToMarket } = useStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchOrders(marketId);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToMarket(marketId);

    return () => unsubscribe();
  }, [marketId, fetchOrders, subscribeToMarket]);

  // Group and sort orders
  const { yesBids, yesAsks, noBids, noAsks, spread } = useMemo(() => {
    const yesOrders = orders.filter(o => o.outcome === 'YES' && ['open', 'partially_filled'].includes(o.status));
    const noOrders = orders.filter(o => o.outcome === 'NO' && ['open', 'partially_filled'].includes(o.status));

    // YES orders
    const yesBids = yesOrders
      .filter(o => o.side === 'buy')
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);

    const yesAsks = yesOrders
      .filter(o => o.side === 'sell')
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    // NO orders
    const noBids = noOrders
      .filter(o => o.side === 'buy')
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);

    const noAsks = noOrders
      .filter(o => o.side === 'sell')
      .sort((a, b) => a.price - b.price)
      .slice(0, 5);

    // Calculate spread
    const bestYesBid = yesBids[0]?.price || 0;
    const bestYesAsk = yesAsks[0]?.price || 1;
    const spread = bestYesAsk - bestYesBid;

    return { yesBids, yesAsks, noBids, noAsks, spread };
  }, [orders]);

  const OrderRow = ({
    price,
    size,
    side,
    total,
    maxTotal
  }: {
    price: number;
    size: number;
    side: 'buy' | 'sell';
    total: number;
    maxTotal: number;
  }) => {
    const depthPercent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

    return (
      <div className="relative grid grid-cols-3 gap-2 py-1 text-sm hover:bg-muted/50 cursor-pointer">
        {/* Depth bar */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 opacity-20 transition-all",
            side === 'buy' ? "bg-green-500" : "bg-red-500"
          )}
          style={{ width: `${depthPercent}%` }}
        />

        <span className={cn(
          "relative z-10 font-medium",
          side === 'buy' ? "text-green-600" : "text-red-600"
        )}>
          ৳{price.toFixed(2)}
        </span>
        <span className="relative z-10 text-right text-muted-foreground">
          {size.toLocaleString()}
        </span>
        <span className="relative z-10 text-right text-muted-foreground">
          {total.toLocaleString()}
        </span>
      </div>
    );
  };

  const OrderBookSide = ({
    title,
    bids,
    asks,
    outcome
  }: {
    title: string;
    bids: typeof yesBids;
    asks: typeof yesAsks;
    outcome: 'YES' | 'NO';
  }) => {
    const maxTotal = Math.max(
      ...bids.map((_, i) => bids.slice(0, i + 1).reduce((sum, o) => sum + (o.quantity - o.filled_quantity), 0)),
      ...asks.map((_, i) => asks.slice(0, i + 1).reduce((sum, o) => sum + (o.quantity - o.filled_quantity), 0)),
      1
    );

    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const midPrice = (bestBid + bestAsk) / 2;

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            {outcome === 'YES' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            {t(`common.${outcome.toLowerCase()}`, { defaultValue: title })}
          </h4>
          <Badge variant="outline" className="font-mono">
            ৳{midPrice.toFixed(2)}
          </Badge>
        </div>

        {/* Asks (Sells) - Red */}
        <div className="space-y-0.5 mb-2">
          {[...asks].reverse().map((order, i) => {
            const cumulative = asks.slice(0, asks.length - i).reduce(
              (sum, o) => sum + (o.quantity - o.filled_quantity), 0
            );
            return (
              <OrderRow
                key={order.id}
                price={order.price}
                size={order.quantity - order.filled_quantity}
                side="sell"
                total={cumulative}
                maxTotal={maxTotal}
              />
            );
          })}
        </div>

        {/* Spread indicator */}
        <div className="py-2 text-center text-xs text-muted-foreground border-y flex justify-center">
          <SpreadIndicator spread={spread} bestAsk={bestAsk} />
        </div>

        {/* Bids (Buys) - Green */}
        <div className="space-y-0.5 mt-2">
          {bids.map((order, i) => {
            const cumulative = bids.slice(0, i + 1).reduce(
              (sum, o) => sum + (o.quantity - o.filled_quantity), 0
            );
            return (
              <OrderRow
                key={order.id}
                price={order.price}
                size={order.quantity - order.filled_quantity}
                side="buy"
                total={cumulative}
                maxTotal={maxTotal}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('order_book.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium">
            <span>{t('order_book.price')}</span>
            <span className="text-right">{t('order_book.size')}</span>
            <span className="text-right">{t('order_book.total')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground font-medium">
            <span>{t('order_book.price')}</span>
            <span className="text-right">{t('order_book.size')}</span>
            <span className="text-right">{t('order_book.total')}</span>
          </div>
        </div>

        {/* Order Books */}
        <div className="flex gap-6">
          <OrderBookSide
            title="YES"
            bids={yesBids}
            asks={yesAsks}
            outcome="YES"
          />
          <div className="w-px bg-border" />
          <OrderBookSide
            title="NO"
            bids={noBids}
            asks={noAsks}
            outcome="NO"
          />
        </div>
      </CardContent>
    </Card>
  );
}
