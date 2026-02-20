"'use client';

import { useState } from 'react';
import { useBinancePrice } from '@/hooks/useBinancePrice';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  DollarSign,
  Activity
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface USDTPriceDisplayProps {
  detailed?: boolean;
  compact?: boolean;
  showRefresh?: boolean;
  showConnection?: boolean;
  className?: string;
  onPriceClick?: () => void;
}

export function USDTPriceDisplay({
  detailed = false,
  compact = false,
  showRefresh = true,
  showConnection = true,
  className,
  onPriceClick,
}: USDTPriceDisplayProps) {
  const { 
    price, 
    priceValue, 
    loading, 
    error, 
    isConnected, 
    refresh, 
    change24h,
    lastUpdated,
  } = useBinancePrice({
    realtime: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isPositiveChange = (change24h ?? 0) >= 0;

  if (compact) {
    return (
      <div 
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors',
          className
        )}
        onClick={onPriceClick}
      >
        <DollarSign className=\"h-4 w-4 text-muted-foreground\" />
        <span className=\"font-medium\">
          {loading ? (
            <span className=\"text-muted-foreground\">--</span>
          ) : (
            <span>৳{priceValue?.toFixed(2)}</span>
          )}
        </span>
        {change24h !== null && (
          <span className={cn(
            'text-xs',
            isPositiveChange ? 'text-green-500' : 'text-red-500'
          )}>
            {isPositiveChange ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        )}
        {showConnection && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {isConnected ? (
                  <Wifi className=\"h-3 w-3 text-green-500\" />
                ) : (
                  <WifiOff className=\"h-3 w-3 text-yellow-500\" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {isConnected ? 'Live connection' : 'Reconnecting...'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 shadow-sm',
      className
    )}>
      <div className=\"flex items-center justify-between mb-3\">
        <div className=\"flex items-center gap-2\">
          <div className=\"p-2 rounded-lg bg-primary/10\">
            <DollarSign className=\"h-5 w-5 text-primary\" />
          </div>
          <div>
            <h3 className=\"font-semibold\">USDT/BDT Rate</h3>
            <p className=\"text-xs text-muted-foreground\">
              {price?.source === 'p2p' ? 'Binance P2P' : 
               price?.source === 'websocket' ? 'Live Stream' : 
               price?.source === 'spot' ? 'Spot Market' : 'Loading...'}
            </p>
          </div>
        </div>
        
        <div className=\"flex items-center gap-2\">
          {showConnection && (
            <Badge 
              variant={isConnected ? 'default' : 'secondary'}
              className=\"gap-1\"
            >
              {isConnected ? (
                <>
                  <Activity className=\"h-3 w-3 animate-pulse\" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className=\"h-3 w-3\" />
                  Offline
                </>
              )}
            </Badge>
          )}
          
          {showRefresh && (
            <Button
              variant=\"ghost\"
              size=\"icon\"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
            >
              <RefreshCw className={cn(
                'h-4 w-4',
                (loading || isRefreshing) && 'animate-spin'
              )} />
            </Button>
          )}
        </div>
      </div>

      <div className=\"space-y-2\">
        <div className=\"flex items-end gap-3\">
          <span className=\"text-4xl font-bold tracking-tight\">
            {loading ? (
              <span className=\"text-muted-foreground animate-pulse\">---.--</span>
            ) : error ? (
              <span className=\"text-destructive\">Error</span>
            ) : (
              <>৳{priceValue?.toFixed(2)}</>
            )}
          </span>
          
          {change24h !== null && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
              isPositiveChange 
                ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            )}>
              {isPositiveChange ? (
                <TrendingUp className=\"h-4 w-4\" />
              ) : (
                <TrendingDown className=\"h-4 w-4\" />
              )}
              <span>{isPositiveChange ? '+' : ''}{change24h.toFixed(2)}%</span>
            </div>
          )}
        </div>

        {detailed && price && (
          <div className=\"grid grid-cols-2 gap-4 pt-3 border-t\">
            <div>
              <p className=\"text-xs text-muted-foreground\">24h High</p>
              <p className=\"font-medium\">৳{price.high24h?.toFixed(2) ?? '--'}</p>
            </div>
            <div>
              <p className=\"text-xs text-muted-foreground\">24h Low</p>
              <p className=\"font-medium\">৳{price.low24h?.toFixed(2) ?? '--'}</p>
            </div>
            <div>
              <p className=\"text-xs text-muted-foreground\">Volume (24h)</p>
              <p className=\"font-medium\">
                {price.volume24h 
                  ? `$${(price.volume24h / 1e9).toFixed(2)}B`
                  : '--'}
              </p>
            </div>
            <div>
              <p className=\"text-xs text-muted-foreground\">Last Updated</p>
              <p className=\"font-medium\">{formatTime(lastUpdated)}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className=\"mt-3 p-2 rounded-lg bg-destructive/10 text-destructive text-sm\">
          {error}
        </div>
      )}
    </div>
  );
}

export function USDTPriceTicker({ className }: { className?: string }) {
  const { priceValue, change24h, isConnected } = useBinancePrice({
    realtime: true,
  });

  const isPositiveChange = (change24h ?? 0) >= 0;

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm',
      className
    )}>
      <span className=\"font-medium\">USDT</span>
      <span className=\"font-bold\">৳{priceValue?.toFixed(2) ?? '--.--'}</span>
      {change24h !== null && (
        <span className={cn(
          'text-xs',
          isPositiveChange ? 'text-green-500' : 'text-red-500'
        )}>
          {isPositiveChange ? '↑' : '↓'} {Math.abs(change24h).toFixed(2)}%
        </span>
      )}
      <span className={cn(
        'w-2 h-2 rounded-full',
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
      )} />
    </div>
  );
}

export default USDTPriceDisplay;"