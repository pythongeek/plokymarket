import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useRealtimeTrades } from '@/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PriceChartProps {
  marketId: string;
}

interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
}

export function PriceChart({ marketId }: PriceChartProps) {
  const { markets } = useStore();
  const trades = useRealtimeTrades(marketId);
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');

  const market = markets.find(m => m.id === marketId);

  // Generate chart data from trades
  const chartData = useMemo(() => {
    const marketTrades = trades
      .filter(t => t.outcome === outcome)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (marketTrades.length === 0) {
      // Generate mock data if no trades
      const now = new Date();
      const basePrice = outcome === 'YES' ? (market?.yes_price || 0.5) : (market?.no_price || 0.5);
      const data: ChartDataPoint[] = [];

      for (let i = 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const randomChange = (Math.random() - 0.5) * 0.1;
        data.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          price: Math.max(0.01, Math.min(0.99, basePrice + randomChange)),
          volume: Math.floor(Math.random() * 1000),
        });
      }
      return data;
    }

    return marketTrades.map(trade => ({
      time: new Date(trade.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: trade.price,
      volume: trade.quantity,
    }));
  }, [trades, outcome, market]);

  const currentPrice = chartData[chartData.length - 1]?.price || 0.5;
  const startPrice = chartData[0]?.price || 0.5;
  const priceChange = currentPrice - startPrice;
  const priceChangePercent = (priceChange / startPrice) * 100;
  const isPositive = priceChange >= 0;

  const timeRangeOptions: Array<'1H' | '24H' | '7D' | '30D'> = ['1H', '24H', '7D', '30D'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          <CardTitle className="text-lg">{t('chart.title')}</CardTitle>
          <div className="flex gap-1">
            {(['YES', 'NO'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                  outcome === o
                    ? o === 'YES'
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {o === 'YES' ? t('common.yes') : t('common.no')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Price Display */}
          <div className="text-right">
            <div className="text-2xl font-bold">
              ৳{currentPrice.toFixed(2)}
            </div>
            <div className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? '+' : ''}{priceChange.toFixed(3)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
            </div>
          </div>

          {/* Time Range */}
          <div className="flex gap-1">
            {timeRangeOptions.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded transition-colors",
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`colorPrice-${outcome}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={outcome === 'YES' ? "#22c55e" : "#ef4444"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={outcome === 'YES' ? "#22c55e" : "#ef4444"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />

              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />

              <YAxis
                domain={[0, 1]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `৳${value.toFixed(2)}`}
                width={50}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="text-sm font-medium">
                          {t('chart.price')}: ৳{Number(payload[0].value).toFixed(3)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('chart.time')}: {payload[0].payload.time}
                        </div>
                        {payload[0].payload.volume > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {t('chart.volume')}: {payload[0].payload.volume.toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <ReferenceLine
                y={0.5}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                opacity={0.5}
              />

              <Area
                type="monotone"
                dataKey="price"
                stroke={outcome === 'YES' ? "#22c55e" : "#ef4444"}
                strokeWidth={2}
                fill={`url(#colorPrice-${outcome})`}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
          <div>
            <div className="text-xs text-muted-foreground">{t('chart.volume')}</div>
            <div className="font-medium">৳{market?.total_volume.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('chart.high')}</div>
            <div className="font-medium">
              ৳{Math.max(...chartData.map(d => d.price)).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('chart.low')}</div>
            <div className="font-medium">
              ৳{Math.min(...chartData.map(d => d.price)).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{t('chart.open_interest')}</div>
            <div className="font-medium">
              {(market?.yes_shares_outstanding || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
