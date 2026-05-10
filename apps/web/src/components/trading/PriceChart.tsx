import { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  ComposedChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface PriceChartProps {
  marketId: string;
}

interface OhlcPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function PriceChart({ marketId }: PriceChartProps) {
  const { markets } = useStore();
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [chartData, setChartData] = useState<OhlcPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'area' | 'candle'>('area');

  const market = markets.find(m => m.id === marketId);

  // Fetch real price history from API
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/markets/${marketId}/price-history?range=${timeRange}&outcome=${outcome}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled && json.data) {
            setChartData(json.data);
          }
        }
      } catch (e) {
        console.warn('Price history fetch failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();

    // Refresh every 30s
    const interval = setInterval(fetchData, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [marketId, timeRange, outcome]);

  // Format time labels based on range
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    switch (timeRange) {
      case '1H': return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '24H': return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      case '7D': return d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
      case '30D': return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default: return d.toLocaleTimeString();
    }
  };

  const displayData = useMemo(() => {
    return chartData.map(d => ({
      ...d,
      label: formatTime(d.time),
      price: d.close,
      color: d.close >= d.open ? '#22c55e' : '#ef4444',
    }));
  }, [chartData]);

  const currentPrice = displayData[displayData.length - 1]?.price || (outcome === 'YES' ? market?.yes_price : market?.no_price) || 0.5;
  const startPrice = displayData[0]?.price || currentPrice;
  const priceChange = currentPrice - startPrice;
  const priceChangePercent = startPrice > 0 ? (priceChange / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const timeRangeOptions: Array<'1H' | '24H' | '7D' | '30D'> = ['1H', '24H', '7D', '30D'];

  // Kid-friendly trend description
  const trendEmoji = isPositive ? '📈' : '📉';
  const trendLabel = isPositive
    ? priceChangePercent > 10 ? 'Going up fast!' : priceChangePercent > 0 ? 'Going up' : 'Staying flat'
    : priceChangePercent < -10 ? 'Going down fast!' : priceChangePercent < 0 ? 'Going down' : 'Staying flat';

  // Calculate stats
  const prices = displayData.map(d => d.price);
  const high = prices.length ? Math.max(...prices) : currentPrice;
  const low = prices.length ? Math.min(...prices) : currentPrice;
  const totalVolume = displayData.reduce((sum, d) => sum + (d.volume || 0), 0);

  return (
    <Card className="border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between pb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">📈 {t('chart.title', 'Price Chart')}</CardTitle>
          <div className="flex gap-1">
            {(['YES', 'NO'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded-full transition-colors border",
                  outcome === o
                    ? o === 'YES'
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-red-500 text-white border-red-500"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                )}
              >
                {o === 'YES' ? '✅ YES' : '❌ NO'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Price Display */}
          <div className="text-right">
            <div className="text-xl font-black">
              ৳{currentPrice.toFixed(2)}
            </div>
            <div className={cn(
              "text-xs font-bold",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trendEmoji} {isPositive ? '+' : ''}{priceChange.toFixed(3)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(1)}%)
            </div>
            <div className="text-[10px] text-muted-foreground">{trendLabel}</div>
          </div>

          {/* View toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('area')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded transition-colors",
                viewMode === 'area' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Line
            </button>
            <button
              onClick={() => setViewMode('candle')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded transition-colors",
                viewMode === 'candle' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Candles
            </button>
          </div>

          {/* Time Range */}
          <div className="flex gap-1">
            {timeRangeOptions.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded transition-colors",
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

      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-pulse space-y-2 w-full px-8">
              <div className="h-40 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
            </div>
          </div>
        ) : displayData.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
            <span className="text-3xl">📊</span>
            <p className="text-sm font-medium">No trades yet</p>
            <p className="text-xs">Be the first to trade this market!</p>
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'area' ? (
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`colorPrice-${outcome}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={outcome === 'YES' ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={outcome === 'YES' ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${Number(v).toFixed(2)}`} width={50} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md text-xs space-y-1">
                          <div className="font-bold">৳{Number(p.price).toFixed(3)}</div>
                          <div className="text-muted-foreground">{p.label}</div>
                          {p.volume > 0 && <div className="text-muted-foreground">Vol: {p.volume.toLocaleString()}</div>}
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <ReferenceLine y={0.5} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.4} />
                  <Area type="monotone" dataKey="price" stroke={outcome === 'YES' ? "#22c55e" : "#ef4444"} strokeWidth={2} fill={`url(#colorPrice-${outcome})`} animationDuration={500} />
                </AreaChart>
              ) : (
                <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${Number(v).toFixed(2)}`} width={50} />
                  <Tooltip content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const p = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md text-xs space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <span className={p.close >= p.open ? 'text-green-500' : 'text-red-500'}>■</span>
                            ৳{p.close.toFixed(3)}
                          </div>
                          <div className="text-muted-foreground">O: ৳{p.open.toFixed(2)} H: ৳{p.high.toFixed(2)}</div>
                          <div className="text-muted-foreground">L: ৳{p.low.toFixed(2)} V: {p.volume.toLocaleString()}</div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <ReferenceLine y={0.5} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" opacity={0.4} />
                  {/* Candlestick using Bar for body + Line for wicks */}
                  {displayData.map((d, i) => {
                    const isGreen = d.close >= d.open;
                    const bodyTop = Math.max(d.open, d.close);
                    const bodyBottom = Math.min(d.open, d.close);
                    const color = isGreen ? '#22c55e' : '#ef4444';
                    return (
                      <g key={i}>
                        {/* Wick */}
                        <line x1={0} y1={0} x2={0} y2={0} stroke={color} strokeWidth={1} />
                      </g>
                    );
                  })}
                  {/* Simplified: show as bars with color */}
                  <Bar dataKey="high" fill="transparent" />
                  <Line type="step" dataKey="close" stroke={outcome === 'YES' ? "#22c55e" : "#ef4444"} strokeWidth={2} dot={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Kid-friendly stats row */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground uppercase">{t('chart.volume', 'Volume')}</div>
            <div className="text-sm font-bold">{totalVolume.toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground">shares traded</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground uppercase">{t('chart.high', 'High')}</div>
            <div className="text-sm font-bold text-green-600">৳{high.toFixed(2)}</div>
            <div className="text-[9px] text-muted-foreground">highest price</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground uppercase">{t('chart.low', 'Low')}</div>
            <div className="text-sm font-bold text-red-600">৳{low.toFixed(2)}</div>
            <div className="text-[9px] text-muted-foreground">lowest price</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground uppercase">Traders</div>
            <div className="text-sm font-bold">{market?.unique_traders?.toLocaleString() || 0}</div>
            <div className="text-[9px] text-muted-foreground">people betting</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
