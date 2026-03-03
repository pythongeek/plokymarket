'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AreaChart,
    ComposedChart,
    LineChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Activity,
    BarChart3,
    Settings,
    Maximize2,
    Minimize2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ChartType = 'line' | 'area' | 'candlestick';
type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

interface OHLCData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface AdvancedChartProps {
    marketId: string;
    outcome?: 'YES' | 'NO';
    initialType?: ChartType;
    initialTimeframe?: TimeFrame;
    showVolume?: boolean;
    showIndicators?: boolean;
    height?: number;
}

export function AdvancedChart({
    marketId,
    outcome = 'YES',
    initialType = 'area',
    initialTimeframe = '1h',
    showVolume = true,
    showIndicators = true,
    height = 400,
}: AdvancedChartProps) {
    const { t } = useTranslation();
    const supabase = createClient();

    const [chartType, setChartType] = useState<ChartType>(initialType);
    const [timeframe, setTimeframe] = useState<TimeFrame>(initialTimeframe);
    const [data, setData] = useState<OHLCData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [showSMA, setShowSMA] = useState(false);
    const [showEMA, setShowEMA] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const now = Date.now();
            const ranges: Record<TimeFrame, number> = {
                '1m': 60 * 60 * 1000,
                '5m': 4 * 60 * 60 * 1000,
                '15m': 12 * 60 * 60 * 1000,
                '1h': 24 * 60 * 60 * 1000,
                '4h': 7 * 24 * 60 * 60 * 1000,
                '1d': 30 * 24 * 60 * 60 * 1000,
                '1w': 90 * 24 * 60 * 60 * 1000,
            };

            const startTime = new Date(now - ranges[timeframe]).toISOString();

            const { data: priceData, error } = await supabase
                .from('price_history')
                .select('*')
                .eq('market_id', marketId)
                .eq('outcome', outcome)
                .gte('timestamp', startTime)
                .order('timestamp', { ascending: true });

            if (error || !priceData?.length) {
                setData(generateMockData());
                return;
            }

            const ohlcData = convertToOHLC(priceData, timeframe);
            setData(ohlcData);
        } catch (error) {
            console.error('Error fetching price history:', error);
            setData(generateMockData());
        } finally {
            setIsLoading(false);
        }
    }, [marketId, outcome, timeframe, supabase]);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel(`price-chart:${marketId}:${outcome}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'trades', filter: `market_id=eq.${marketId}` },
                () => fetchData()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [marketId, outcome, fetchData, supabase]);

    const indicators = useMemo(() => {
        if (data.length === 0) return null;
        const closes = data.map(d => d.close);
        return {
            sma20: calculateSMA(closes, 20),
            sma50: calculateSMA(closes, 50),
            ema12: calculateEMA(closes, 12),
            ema26: calculateEMA(closes, 26),
        };
    }, [data]);

    const chartData = useMemo(() => {
        if (!data.length) return [];
        return data.map((d, i) => {
            const point: any = { ...d, time: new Date(d.time).toLocaleTimeString() };
            if (indicators) {
                if (i >= 19) point.sma20 = indicators.sma20[i - 19];
                if (i >= 49) point.sma50 = indicators.sma50[i - 49];
                if (i >= 11) point.ema12 = indicators.ema12[i - 11];
                if (i >= 25) point.ema26 = indicators.ema26[i - 25];
            }
            return point;
        });
    }, [data, indicators]);

    const stats = useMemo(() => {
        if (data.length < 2) return { change: 0, changePercent: 0, high: 0, low: 0, volume: 0 };
        const first = data[0].close;
        const last = data[data.length - 1].close;
        return {
            change: last - first,
            changePercent: ((last - first) / first) * 100,
            high: Math.max(...data.map(d => d.high)),
            low: Math.min(...data.map(d => d.low)),
            volume: data.reduce((sum, d) => sum + d.volume, 0),
        };
    }, [data]);

    const timeframes: { value: TimeFrame; label: string }[] = [
        { value: '1m', label: '1M' },
        { value: '5m', label: '5M' },
        { value: '15m', label: '15M' },
        { value: '1h', label: '1H' },
        { value: '4h', label: '4H' },
        { value: '1d', label: '1D' },
        { value: '1w', label: '1W' },
    ];

    return (
        <Card className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            {t('Price Chart', 'Price Chart')}
                            <span className="text-sm font-normal text-muted-foreground">({outcome})</span>
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm">
                            <span className={stats.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                ${stats.change >= 0 ? '+' : ''}{stats.change.toFixed(4)} ({stats.changePercent.toFixed(2)}%)
                            </span>
                            <span className="text-muted-foreground">H: ${stats.high.toFixed(2)} L: ${stats.low.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-muted rounded-md p-1">
                            {timeframes.map((tf) => (
                                <button
                                    key={tf.value}
                                    onClick={() => setTimeframe(tf.value)}
                                    className={`px-2 py-1 text-xs rounded ${timeframe === tf.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/20'}`}
                                >
                                    {tf.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex bg-muted rounded-md p-1">
                            <button onClick={() => setChartType('area')} className={`p-1 rounded ${chartType === 'area' ? 'bg-primary text-primary-foreground' : ''}`}>
                                <AreaChart className="w-4 h-4" />
                            </button>
                            <button onClick={() => setChartType('line')} className={`p-1 rounded ${chartType === 'line' ? 'bg-primary text-primary-foreground' : ''}`}>
                                <TrendingUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => setChartType('candlestick')} className={`p-1 rounded ${chartType === 'candlestick' ? 'bg-primary text-primary-foreground' : ''}`}>
                                <BarChart3 className="w-4 h-4" />
                            </button>
                        </div>

                        {showIndicators && (
                            <div className="relative group">
                                <button className="p-1 rounded bg-muted hover:bg-muted-foreground/20">
                                    <Settings className="w-4 h-4" />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-card border rounded-md p-2 shadow-lg hidden group-hover:block z-10">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} />
                                        SMA (20, 50)
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={showEMA} onChange={(e) => setShowEMA(e.target.checked)} />
                                        EMA (12, 26)
                                    </label>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1 rounded hover:bg-muted-foreground/20">
                            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center" style={{ height }}>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={height}>
                        {chartType === 'area' ? (
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={50} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                                <ReferenceLine y={0.5} stroke="#666" strokeDasharray="3 3" />
                                <Area type="monotone" dataKey="close" stroke="#10b981" fillOpacity={1} fill="url(#colorPrice)" name="Price" />
                                {showSMA && <><Line type="monotone" dataKey="sma20" stroke="#f59e0b" dot={false} strokeWidth={1} name="SMA 20" /><Line type="monotone" dataKey="sma50" stroke="#8b5cf6" dot={false} strokeWidth={1} name="SMA 50" /></>}
                                {showEMA && <><Line type="monotone" dataKey="ema12" stroke="#06b6d4" dot={false} strokeWidth={1} name="EMA 12" /><Line type="monotone" dataKey="ema26" stroke="#ec4899" dot={false} strokeWidth={1} name="EMA 26" /></>}
                                {showVolume && <Bar dataKey="volume" fill="#6b7280" opacity={0.3} yAxisId="volume" />}
                            </AreaChart>
                        ) : chartType === 'line' ? (
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={50} />
                                <Tooltip />
                                <Line type="monotone" dataKey="close" stroke="#10b981" dot={false} strokeWidth={2} />
                                {showSMA && <><Line type="monotone" dataKey="sma20" stroke="#f59e0b" dot={false} strokeWidth={1} /><Line type="monotone" dataKey="sma50" stroke="#8b5cf6" dot={false} strokeWidth={1} /></>}
                                {showEMA && <><Line type="monotone" dataKey="ema12" stroke="#06b6d4" dot={false} strokeWidth={1} /><Line type="monotone" dataKey="ema26" stroke="#ec4899" dot={false} strokeWidth={1} /></>}
                            </LineChart>
                        ) : (
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} width={50} />
                                <Tooltip />
                                <Bar dataKey="close" fill={(d: any) => d.close >= d.open ? '#10b981' : '#ef4444'} />
                            </ComposedChart>
                        )}
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

function convertToOHLC(priceData: any[], timeframe: TimeFrame): OHLCData[] {
    const groups: Record<number, OHLCData> = {};
    const bucketSizes: Record<TimeFrame, number> = {
        '1m': 60 * 1000, '5m': 5 * 60 * 1000, '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000, '4h': 4 * 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000, '1w': 7 * 24 * 60 * 60 * 1000,
    };
    const bucketSize = bucketSizes[timeframe];

    priceData.forEach((point) => {
        const time = new Date(point.timestamp).getTime();
        const bucket = Math.floor(time / bucketSize) * bucketSize;
        if (!groups[bucket]) {
            groups[bucket] = { time: bucket, open: point.price, high: point.price, low: point.price, close: point.price, volume: point.volume || 0 };
        } else {
            groups[bucket].high = Math.max(groups[bucket].high, point.price);
            groups[bucket].low = Math.min(groups[bucket].low, point.price);
            groups[bucket].close = point.price;
            groups[bucket].volume += point.volume || 0;
        }
    });
    return Object.values(groups).sort((a, b) => a.time - b.time);
}

function generateMockData(): OHLCData[] {
    const data: OHLCData[] = [];
    let price = 0.5;
    const now = Date.now();
    for (let i = 50; i >= 0; i--) {
        const time = now - i * 60 * 60 * 1000;
        const change = (Math.random() - 0.5) * 0.05;
        price = Math.max(0.01, Math.min(0.99, price + change));
        data.push({ time, open: price, high: price + Math.random() * 0.02, low: price - Math.random() * 0.02, close: price, volume: Math.floor(Math.random() * 10000) });
    }
    return data;
}

function calculateSMA(data: number[], period: number): number[] {
    return data.map((_, i) => i < period - 1 ? NaN : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period);
}

function calculateEMA(data: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    data.forEach((price, i) => {
        if (i < period - 1) { result.push(NaN); }
        else if (i === period - 1) { result.push(data.slice(0, period).reduce((a, b) => a + b, 0) / period); }
        else { result.push((price - result[i - 1]) * multiplier + result[i - 1]); }
    });
    return result;
}

export default AdvancedChart;
