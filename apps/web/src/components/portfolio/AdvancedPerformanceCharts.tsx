"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
  PieChart as RechartsPieChart,
  Pie,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart as LineChartIcon,
  Zap,
  BarChart3,
  Calendar,
  Camera,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Share2,
  Maximize2,
  Filter,
  Flame,
  Target,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, formatPercentage } from '@/lib/format';
import { usePerformanceCharts } from '@/hooks/portfolio/usePerformanceCharts';
import html2canvas from 'html2canvas';

// ============================================
// TYPES & INTERFACES
// ============================================

interface AdvancedPerformanceChartsProps {
  userId?: string;
}

type BenchmarkType = 'sp500' | 'crypto' | 'predictionMarket' | 'gold' | 'bangladeshIndex';

interface BenchmarkConfig {
  id: BenchmarkType;
  name: string;
  nameBn: string;
  color: string;
  description: string;
}

const BENCHMARKS: BenchmarkConfig[] = [
  { id: 'sp500', name: 'S&P 500', nameBn: 'এসএন্ডপি ৫০০', color: '#3b82f6', description: 'US Large Cap Index' },
  { id: 'crypto', name: 'Crypto Index', nameBn: 'ক্রিপ্টো ইন্ডেক্স', color: '#f59e0b', description: 'Top 10 Crypto Assets' },
  { id: 'predictionMarket', name: 'PM Aggregate', nameBn: 'প্রেডিকশন মার্কেট', color: '#8b5cf6', description: 'Prediction Market Average' },
  { id: 'gold', name: 'Gold', nameBn: 'স্বর্ণ', color: '#eab308', description: 'Gold Spot Price' },
  { id: 'bangladeshIndex', name: 'DSEX', nameBn: 'ডিএসইএক্স', color: '#10b981', description: 'Dhaka Stock Exchange' },
];

// ============================================
// OFFLINE CACHE HOOK
// ============================================

function useOfflineCache<T>(key: string, data: T | null, enabled: boolean = true) {
  useEffect(() => {
    if (enabled && data && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`portfolio_cache_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache data:', e);
      }
    }
  }, [key, data, enabled]);

  const getCachedData = useCallback((): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(`portfolio_cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to retrieve cached data:', e);
    }
    return null;
  }, [key]);

  return { getCachedData };
}

// ============================================
// SCREENSHOT & SHARING
// ============================================

async function captureChartWithWatermark(
  element: HTMLElement,
  username: string = 'Trader'
): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  // Add watermark
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const width = canvas.width;
    const height = canvas.height;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(16, 185, 129, 0.03)';
    ctx.fillRect(0, 0, width, height);

    // Plokymarket branding
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText('PLOKYMARKET', 0, 0);
    ctx.restore();

    // Header banner
    const gradient = ctx.createLinearGradient(0, 0, width, 60);
    gradient.addColorStop(0, '#059669');
    gradient.addColorStop(1, '#10b981');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 60);

    // Logo text
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('📊 Plokymarket', 20, 38);

    // User info
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${username} • ${new Date().toLocaleDateString('bn-BD')}`, width - 20, 38);

    // Bangladesh flag colors border
    ctx.fillStyle = '#006a4e'; // Green
    ctx.fillRect(0, height - 4, width, 4);
    ctx.fillStyle = '#f42a41'; // Red circle indicator
    ctx.beginPath();
    ctx.arc(30, height - 2, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Footer
    ctx.font = '12px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('🇧🇩 বাংলাদেশের প্রথম প্রেডিকশন মার্কেট | plokymarket.com', width / 2, height - 20);
  }

  return canvas.toDataURL('image/png');
}

// ============================================
// EQUITY CURVE COMPONENT
// ============================================

interface EquityCurveProps {
  data: any[];
  showBenchmark: boolean;
  activeBenchmarks: BenchmarkType[];
  showBDT: boolean;
  currency: string;
  onZoom?: (domain: [number, number]) => void;
  annotations?: Array<{
    date: string;
    label: string;
    type: 'trade' | 'milestone' | 'alert';
  }>;
}

function EquityCurve({
  data,
  showBenchmark,
  activeBenchmarks,
  showBDT,
  currency,
  annotations = []
}: EquityCurveProps) {
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [panMode, setPanMode] = useState(false);
  const [showDrawdown, setShowDrawdown] = useState(true);
  const multiplier = showBDT ? 110 : 1;

  const displayData = useMemo(() => {
    if (!zoomDomain) return data;
    return data.slice(zoomDomain[0], zoomDomain[1]);
  }, [data, zoomDomain]);

  const handleZoomIn = () => {
    if (!zoomDomain) {
      const mid = Math.floor(data.length / 2);
      setZoomDomain([mid - 10, mid + 10]);
    } else {
      const [start, end] = zoomDomain;
      const range = end - start;
      setZoomDomain([start + Math.floor(range * 0.2), end - Math.floor(range * 0.2)]);
    }
  };

  const handleZoomOut = () => {
    if (!zoomDomain) return;
    const [start, end] = zoomDomain;
    const range = end - start;
    const newStart = Math.max(0, start - Math.floor(range * 0.3));
    const newEnd = Math.min(data.length, end + Math.floor(range * 0.3));
    if (newEnd - newStart >= data.length) {
      setZoomDomain(null);
    } else {
      setZoomDomain([newStart, newEnd]);
    }
  };

  const handleReset = () => setZoomDomain(null);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">ইকুইটি কার্ভ</CardTitle>
              <p className="text-sm text-muted-foreground">কিউমুলেটিভ P&L উইথ ড্রয়ডাউন</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch checked={showDrawdown} onCheckedChange={setShowDrawdown} size="sm" />
                <span className="text-xs">ড্রয়ডাউন</span>
              </label>
            </div>
          </div>
        </div>

        {/* Benchmark Legend */}
        {showBenchmark && (
          <div className="flex flex-wrap gap-2 mt-3">
            {BENCHMARKS.filter(b => activeBenchmarks.includes(b.id)).map(benchmark => (
              <Badge
                key={benchmark.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: benchmark.color, color: benchmark.color }}
              >
                {benchmark.nameBn}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="h-[450px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="equityGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="drawdownGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />

              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('bn-BD', {
                  month: 'short',
                  day: 'numeric'
                })}
                stroke="#6b7280"
                fontSize={12}
              />

              <YAxis
                yAxisId="left"
                tickFormatter={(val) => formatCurrency(val * multiplier, currency, 0)}
                stroke="#10b981"
                fontSize={12}
              />

              {showDrawdown && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(val) => `${val.toFixed(1)}%`}
                  stroke="#ef4444"
                  fontSize={12}
                />
              )}

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-background/95 backdrop-blur border rounded-lg p-4 shadow-xl">
                        <p className="font-semibold mb-2">{formatDate(item.date)}</p>
                        <div className="space-y-1">
                          <p className="text-emerald-600 font-medium">
                            📈 ইকুইটি: {formatCurrency(item.value * multiplier, currency)}
                          </p>
                          {showDrawdown && (
                            <p className="text-rose-600">
                              📉 ড্রয়ডাউন: {item.drawdown.toFixed(2)}%
                            </p>
                          )}
                          {activeBenchmarks.map(bm => {
                            const key = `${bm}Value`;
                            if (item[key]) {
                              const config = BENCHMARKS.find(b => b.id === bm);
                              return (
                                <p key={bm} style={{ color: config?.color }}>
                                  📊 {config?.nameBn}: {formatCurrency(item[key] * multiplier, currency)}
                                </p>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Benchmark Lines */}
              {showBenchmark && activeBenchmarks.map(bm => {
                const key = `${bm}Value`;
                const config = BENCHMARKS.find(b => b.id === bm);
                return (
                  <Line
                    key={bm}
                    yAxisId="left"
                    type="monotone"
                    dataKey={key}
                    stroke={config?.color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                  />
                );
              })}

              {/* Equity Area */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#equityGradient2)"
              />

              {/* Drawdown Area */}
              {showDrawdown && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  strokeWidth={1}
                  fill="url(#drawdownGradient2)"
                />
              )}

              {/* Reference Line for initial capital */}
              <ReferenceLine y={10000} yAxisId="left" stroke="#6b7280" strokeDasharray="3 3" />

              {/* Annotations */}
              {annotations.map((ann, idx) => (
                <ReferenceLine
                  key={idx}
                  x={ann.date}
                  stroke={ann.type === 'milestone' ? '#f59e0b' : ann.type === 'alert' ? '#ef4444' : '#3b82f6'}
                  strokeDasharray="3 3"
                  label={{ value: ann.label, position: 'top', fontSize: 10 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// BENCHMARK COMPARISON COMPONENT
// ============================================

interface BenchmarkComparisonProps {
  data: any[];
  showBDT: boolean;
  currency: string;
}

function BenchmarkComparison({ data, showBDT, currency }: BenchmarkComparisonProps) {
  const [activeBenchmarks, setActiveBenchmarks] = useState<BenchmarkType[]>(['sp500', 'crypto']);
  const [correlationData, setCorrelationData] = useState<any[]>([]);
  const multiplier = showBDT ? 110 : 1;

  const toggleBenchmark = (id: BenchmarkType) => {
    setActiveBenchmarks(prev =>
      prev.includes(id)
        ? prev.filter(b => b !== id)
        : [...prev, id]
    );
  };

  // Calculate correlation between portfolio and benchmarks
  useEffect(() => {
    if (data.length > 0) {
      const correlations = activeBenchmarks.map(bm => {
        const bmKey = `${bm}Value`;
        const portfolioReturns = data.slice(1).map((d, i) =>
          (d.value - data[i].value) / data[i].value
        );
        const benchmarkReturns = data.slice(1).map((d, i) =>
          ((d[bmKey] || d.value) - (data[i][bmKey] || data[i].value)) / (data[i][bmKey] || data[i].value)
        ).filter(r => !isNaN(r));

        if (benchmarkReturns.length === 0) return null;

        const avgPort = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
        const avgBench = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;

        const numerator = portfolioReturns.reduce((sum, p, i) =>
          sum + (p - avgPort) * (benchmarkReturns[i] - avgBench), 0
        );
        const denomPort = Math.sqrt(portfolioReturns.reduce((sum, p) => sum + Math.pow(p - avgPort, 2), 0));
        const denomBench = Math.sqrt(benchmarkReturns.reduce((sum, b) => sum + Math.pow(b - avgBench, 2), 0));

        const correlation = denomPort && denomBench ? numerator / (denomPort * denomBench) : 0;

        return {
          benchmark: BENCHMARKS.find(b => b.id === bm),
          correlation: correlation,
          beta: correlation * (denomBench / denomPort) || 0
        };
      }).filter(Boolean);

      setCorrelationData(correlations);
    }
  }, [data, activeBenchmarks]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">বেঞ্চমার্ক কম্পেয়ারিজন</CardTitle>
              <p className="text-sm text-muted-foreground">বাজার ইন্ডেক্সের সাথে তুলনা</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Benchmark Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {BENCHMARKS.map(benchmark => (
            <button
              key={benchmark.id}
              onClick={() => toggleBenchmark(benchmark.id)}
              className={cn(
                "p-3 rounded-xl border-2 transition-all text-left",
                activeBenchmarks.includes(benchmark.id)
                  ? "border-opacity-100 bg-opacity-10"
                  : "border-muted opacity-50 hover:opacity-75"
              )}
              style={{
                borderColor: activeBenchmarks.includes(benchmark.id) ? benchmark.color : undefined,
                backgroundColor: activeBenchmarks.includes(benchmark.id) ? `${benchmark.color}15` : undefined
              }}
            >
              <p className="font-semibold text-sm" style={{ color: benchmark.color }}>
                {benchmark.nameBn}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{benchmark.description}</p>
            </button>
          ))}
        </div>

        {/* Correlation Matrix */}
        {correlationData.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              করেলেশন অ্যানালাইসিস
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {correlationData.map((item: any) => (
                <div key={item.benchmark.id} className="bg-background rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.benchmark.color }}
                    />
                    <span className="font-medium">{item.benchmark.nameBn}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">করেলেশন</p>
                      <p className={cn(
                        "text-lg font-bold",
                        Math.abs(item.correlation) > 0.7 ? "text-emerald-600" :
                          Math.abs(item.correlation) > 0.4 ? "text-amber-600" : "text-rose-600"
                      )}>
                        {item.correlation.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">বেটা</p>
                      <p className="text-lg font-bold">{item.beta.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// ROLLING SHARPE COMPONENT
// ============================================

interface RollingSharpeProps {
  data: any[];
  showBDT: boolean;
  currency: string;
}

function RollingSharpe({ data, showBDT, currency }: RollingSharpeProps) {
  const [windowSize, setWindowSize] = useState(30);
  const [calculatedData, setCalculatedData] = useState<any[]>([]);

  useEffect(() => {
    if (data.length > windowSize) {
      const newData = [];
      for (let i = windowSize; i < data.length; i++) {
        const windowData = data.slice(i - windowSize, i);
        const returns = windowData.slice(1).map((d, idx) =>
          (d.value - windowData[idx].value) / windowData[idx].value
        );

        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length);
        const sharpe = stdDev > 0 ? (avgReturn * 365 - 0.05) / (stdDev * Math.sqrt(365)) : 0;

        newData.push({
          date: data[i].date,
          value: sharpe,
          window: windowSize
        });
      }
      setCalculatedData(newData);
    }
  }, [data, windowSize]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">রোলিং শার্প রেশিও</CardTitle>
              <p className="text-sm text-muted-foreground">রিস্ক-অ্যাডজাস্টেড রিটার্ন</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/50 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">উইন্ডো:</span>
            <Slider
              value={[windowSize]}
              onValueChange={(v) => setWindowSize(v[0])}
              min={7}
              max={90}
              step={1}
              className="w-32"
            />
            <Badge variant="secondary">{windowSize} দিন</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={calculatedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('bn-BD', { month: 'short' })}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{formatDate(payload[0].payload.date)}</p>
                        <p className="text-amber-600 font-bold">
                          শার্প: {payload[0].value?.toFixed(3)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payload[0].payload.window} দিনের উইন্ডো
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={1} stroke="#22c55e" strokeDasharray="3 3" label="Good" />
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
              <ReferenceLine y={-1} stroke="#ef4444" strokeDasharray="3 3" label="Poor" />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="#f59e0b"
                fillOpacity={0.1}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
          <span>📊 শার্প রেশিও &gt; 1 = ভালো পারফরম্যান্স</span>
          <span>বর্তমান উইন্ডো: {windowSize} দিন</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// WIN/LOSS DISTRIBUTION COMPONENT
// ============================================

interface WinLossDistributionProps {
  data: any[];
  positions: any[];
}

function WinLossDistribution({ data, positions }: WinLossDistributionProps) {
  const [marketTypeFilter, setMarketTypeFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (marketTypeFilter !== 'all') {
      // Filter by market category
      filtered = filtered.filter((item: any) => item.category === marketTypeFilter);
    }

    if (sizeFilter !== 'all') {
      // Filter by trade size
      filtered = filtered.filter((item: any) => {
        const total = (item.wins || 0) + (item.losses || 0);
        if (sizeFilter === 'small') return total < 5;
        if (sizeFilter === 'medium') return total >= 5 && total < 20;
        if (sizeFilter === 'large') return total >= 20;
        return true;
      });
    }

    return filtered;
  }, [data, marketTypeFilter, sizeFilter]);

  const streakData = useMemo(() => {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    positions.forEach((pos: any) => {
      if (pos.pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if (pos.pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    return { currentWinStreak, currentLossStreak, maxWinStreak, maxLossStreak };
  }, [positions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">উইন/লস ডিস্ট্রিবিউশন</CardTitle>
              <p className="text-sm text-muted-foreground">প্রফিট/লস হিস্টোগ্রাম উইথ স্ট্রীক অ্যানালাইসিস</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={marketTypeFilter} onValueChange={setMarketTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="মার্কেট টাইপ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব মার্কেট</SelectItem>
                <SelectItem value="sports">খেলাধুলা</SelectItem>
                <SelectItem value="politics">রাজনীতি</SelectItem>
                <SelectItem value="crypto">ক্রিপ্টো</SelectItem>
                <SelectItem value="economy">অর্থনীতি</SelectItem>
                <SelectItem value="entertainment">বিনোদন</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="ট্রেড সাইজ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব সাইজ</SelectItem>
                <SelectItem value="small">ছোট (&lt;5)</SelectItem>
                <SelectItem value="medium">মাঝারি (5-20)</SelectItem>
                <SelectItem value="large">বড় (&gt;20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Streak Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-700">বর্তমান উইন স্ট্রীক</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{streakData.currentWinStreak}W</p>
          </div>

          <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-rose-600" />
              <span className="text-sm text-rose-700">বর্তমান লস স্ট্রীক</span>
            </div>
            <p className="text-3xl font-bold text-rose-600">{streakData.currentLossStreak}L</p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">সর্বোচ্চ উইন স্ট্রীক</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{streakData.maxWinStreak}W</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-700">সর্বোচ্চ লস স্ট্রীক</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">{streakData.maxLossStreak}L</p>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="range" type="category" width={100} stroke="#6b7280" fontSize={12} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{payload[0].payload.range}</p>
                        <p className="text-emerald-600">✓ জয়: {payload[0].payload.wins || 0}</p>
                        <p className="text-rose-600">✗ পরাজয়: {payload[0].payload.losses || 0}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="wins" name="জয়" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="losses" name="পরাজয়" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CALENDAR HEATMAP COMPONENT
// ============================================

interface CalendarHeatmapProps {
  data: Array<{ date: string; pnl: number; trades: number }>;
  currency: string;
  multiplier: number;
}

function CalendarHeatmapAdvanced({ data, currency, multiplier }: CalendarHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<typeof data[0] | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getColor = (pnl: number) => {
    if (pnl === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (pnl > 500) return 'bg-emerald-700';
    if (pnl > 200) return 'bg-emerald-600';
    if (pnl > 100) return 'bg-emerald-500';
    if (pnl > 50) return 'bg-emerald-400';
    if (pnl > 0) return 'bg-emerald-300';
    if (pnl > -50) return 'bg-rose-300';
    if (pnl > -100) return 'bg-rose-400';
    if (pnl > -200) return 'bg-rose-500';
    if (pnl > -500) return 'bg-rose-600';
    return 'bg-rose-700';
  };

  const getTextColor = (pnl: number) => {
    return Math.abs(pnl) > 100 ? 'text-white' : 'text-gray-800';
  };

  const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

  // Group data by month
  const monthlyData = useMemo(() => {
    const grouped: Record<string, typeof data> = {};
    data.forEach(day => {
      const date = new Date(day.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(day);
    });
    return grouped;
  }, [data]);

  const currentKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  const currentData = monthlyData[currentKey] || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">দৈনিক P&L ক্যালেন্ডার</CardTitle>
              <p className="text-sm text-muted-foreground">ক্লিক করে ডিটেল দেখুন</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              ←
            </Button>
            <span className="font-medium min-w-[120px] text-center">
              {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              →
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <span className="text-sm text-muted-foreground">লেজেন্ড:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-rose-700" />
            <div className="w-4 h-4 rounded bg-rose-500" />
            <div className="w-4 h-4 rounded bg-rose-300" />
            <div className="w-4 h-4 rounded bg-gray-100" />
            <div className="w-4 h-4 rounded bg-emerald-300" />
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <div className="w-4 h-4 rounded bg-emerald-700" />
          </div>
          <span className="text-xs text-muted-foreground">লোস → প্রফিট</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground py-2 font-medium">
              {day}
            </div>
          ))}

          {currentData.map((day) => (
            <Dialog key={day.date}>
              <DialogTrigger asChild>
                <button
                  className={cn(
                    "aspect-square rounded-lg transition-all hover:scale-110 hover:ring-2 hover:ring-primary flex items-center justify-center text-xs font-medium",
                    getColor(day.pnl),
                    getTextColor(day.pnl)
                  )}
                >
                  {new Date(day.date).getDate()}
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{formatDate(day.date)}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className={cn(
                    "text-3xl font-bold",
                    day.pnl >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {day.pnl >= 0 ? '+' : ''}{formatCurrency(day.pnl * multiplier, currency)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">ট্রেড সংখ্যা</p>
                      <p className="text-xl font-semibold">{day.trades}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">গড় P&L</p>
                      <p className="text-xl font-semibold">
                        {day.trades > 0 ? formatCurrency((day.pnl / day.trades) * multiplier, currency) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CATEGORY PERFORMANCE COMPONENT
// ============================================

interface CategoryPerformanceProps {
  data: any[];
  showBDT: boolean;
  currency: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Sports': '#3b82f6',
  'Politics': '#ef4444',
  'Crypto': '#f59e0b',
  'Economy': '#10b981',
  'Entertainment': '#8b5cf6',
  'Other': '#6b7280'
};

function CategoryPerformanceChart({ data, showBDT, currency }: CategoryPerformanceProps) {
  const multiplier = showBDT ? 110 : 1;

  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <PieChart className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-lg">ক্যাটাগরি অনুযায়ী পারফরম্যান্স</CardTitle>
            <p className="text-sm text-muted-foreground">কোন ক্যাটাগরিতে কেমন লাভ/ক্ষতি</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                dataKey="pnl"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other']} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value * multiplier, currency)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {data.map((cat, i) => (
            <div key={i} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['Other'] }} />
                <div>
                  <p className="font-semibold text-sm">{cat.category}</p>
                  <p className="text-xs text-muted-foreground">{cat.totalTrades}টি ট্রেড ({cat.winRate.toFixed(1)}% উইন রেট)</p>
                </div>
              </div>
              <div className={cn("font-bold text-right", cat.pnl >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {cat.pnl >= 0 ? '+' : ''}{formatCurrency(cat.pnl * multiplier, currency)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AdvancedPerformanceCharts({ userId }: AdvancedPerformanceChartsProps) {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('6M');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showBDT, setShowBDT] = useState(true);
  const [activeBenchmarks, setActiveBenchmarks] = useState<BenchmarkType[]>(['sp500', 'crypto']);
  const [isCapturing, setIsCapturing] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const { data, stats, loading, error } = usePerformanceCharts(userId, timeframe);
  const { getCachedData } = useOfflineCache(`perf_${userId}_${timeframe}`, data);

  const currency = showBDT ? 'BDT' : 'USD';
  const multiplier = showBDT ? 110 : 1;

  // Load cached data if offline
  useEffect(() => {
    if (!data && !loading && typeof window !== 'undefined') {
      const cached = getCachedData();
      if (cached) {
        console.log('Using cached performance data');
      }
    }
  }, [data, loading, getCachedData]);

  const handleShare = async () => {
    if (!chartContainerRef.current) return;

    setIsCapturing(true);
    try {
      const imageUrl = await captureChartWithWatermark(chartContainerRef.current, userId || 'Trader');

      // Copy to clipboard or download
      if (navigator.share) {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], 'plokymarket-performance.png', { type: 'image/png' });
        await navigator.share({
          title: 'My Plokymarket Performance',
          text: `📊 Trading Performance on Plokymarket\nReturn: ${stats?.totalReturn.toFixed(2)}%`,
          files: [file]
        });
      } else {
        // Download
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `plokymarket-performance-${new Date().toISOString().split('T')[0]}.png`;
        a.click();
      }
    } catch (err) {
      console.error('Failed to capture/share:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownload = async () => {
    if (!chartContainerRef.current) return;

    setIsCapturing(true);
    try {
      const imageUrl = await captureChartWithWatermark(chartContainerRef.current, userId || 'Trader');
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `plokymarket-performance-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
    } catch (err) {
      console.error('Failed to download:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-32" />
          ))}
        </div>
        <Card className="h-96 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="py-12">
        <CardContent className="text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-rose-500" />
          <h3 className="text-lg font-medium">ডাটা লোড করতে সমস্যা</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || !stats) {
    return (
      <Card className="py-12">
        <CardContent className="text-center">
          <LineChartIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium">ডাটা পাওয়া যায়নি</h3>
          <p className="text-muted-foreground">ট্রেডিং শুরু করলে চার্ট দেখা যাবে</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={chartContainerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            📈 এডভান্সড পারফরম্যান্স চার্ট
          </h2>
          <p className="text-muted-foreground">প্রফেশনাল গ্রেড ট্রেডিং অ্যানালাইসিস</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBDT(!showBDT)}
            className="font-medium"
          >
            {showBDT ? '৳ BDT' : '$ USD'}
          </Button>

          {/* Timeframe Selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeframe === tf
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tf === '1M' && '১ মাস'}
                {tf === '3M' && '৩ মাস'}
                {tf === '6M' && '৬ মাস'}
                {tf === '1Y' && '১ বছর'}
                {tf === 'ALL' && 'সর্বকাল'}
              </button>
            ))}
          </div>

          {/* Share & Download */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            disabled={isCapturing}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDownload}
            disabled={isCapturing}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-200"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold">{stats.totalReturn >= 0 ? '+' : ''}{formatPercentage(stats.totalReturn)}</p>
          <p className="text-sm text-muted-foreground">টোটাল রিটার্ন</p>
          <p className="text-xs text-emerald-600 mt-1">{formatCurrency(stats.finalValueBDT, 'BDT')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-200"
        >
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-2xl font-bold">-{formatPercentage(stats.maxDrawdown)}</p>
          <p className="text-sm text-muted-foreground">ম্যাক্স ড্রয়ডাউন</p>
          <p className="text-xs text-rose-600 mt-1">সর্বোচ্চ ক্ষতি</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold">{data.streaks.currentWinStreak}W</p>
          <p className="text-sm text-muted-foreground">কারেন্ট স্ট্রীক</p>
          <p className="text-xs text-amber-600 mt-1">ম্যাক্স: {data.streaks.maxWinStreak}W</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-200"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">
            {data.rollingSharpe[data.rollingSharpe.length - 1]?.value.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-muted-foreground">শার্প রেশিও</p>
          <p className="text-xs text-blue-600 mt-1">রিস্ক-অ্যাডজাস্টেড</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <EquityCurve
          data={data.equity}
          showBenchmark={showBenchmark}
          activeBenchmarks={activeBenchmarks}
          showBDT={showBDT}
          currency={currency}
        />

        <BenchmarkComparison
          data={data.equity}
          showBDT={showBDT}
          currency={currency}
        />

        <RollingSharpe
          data={data.equity}
          showBDT={showBDT}
          currency={currency}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WinLossDistribution
            data={data.winLossDistribution}
            positions={[]}
          />
          <CalendarHeatmapAdvanced
            data={data.calendar}
            currency={currency}
            multiplier={multiplier}
          />
        </div>

        {/* Category Performance Breakdown */}
        <CategoryPerformanceChart
          data={data.categoryBreakdown}
          showBDT={showBDT}
          currency={currency}
        />
      </div>
    </div>
  );
}

export default AdvancedPerformanceCharts;
