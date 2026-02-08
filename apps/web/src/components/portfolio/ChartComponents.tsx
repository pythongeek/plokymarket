"use client";

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
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { LineChart as LineChartIcon, Zap, BarChart3, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';

interface ChartComponentsProps {
  data: {
    equity: Array<{
      date: string;
      value: number;
      drawdown: number;
      benchmarkValue?: number;
    }>;
    rollingSharpe: Array<{
      date: string;
      value: number;
    }>;
    rollingVolatility: Array<{
      date: string;
      value: number;
    }>;
    winLossDistribution: Array<{
      range: string;
      wins: number;
      losses: number;
    }>;
    calendar: Array<{
      date: string;
      pnl: number;
      trades: number;
    }>;
    streaks: {
      currentWinStreak: number;
      currentLossStreak: number;
      maxWinStreak: number;
      maxLossStreak: number;
    };
    benchmarks: {
      sp500: number;
      cryptoIndex: number;
      predictionMarketAvg: number;
    };
  };
  showBenchmark: boolean;
  showBDT: boolean;
  currency: string;
}

export default function ChartComponents({ data, showBenchmark, showBDT, currency }: ChartComponentsProps) {
  const multiplier = showBDT ? 110 : 1;

  return (
    <div className="space-y-6">
      {/* Equity Curve */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-primary" />
              <CardTitle>ইকুইটি কার্ভ</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.equity}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('bn-BD', { month: 'short' })}
                  stroke="#6b7280"
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(val) => formatCurrency(val * multiplier, currency, 0)}
                  stroke="#6b7280"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(val) => `${val.toFixed(1)}%`}
                  stroke="#ef4444"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{formatDate(item.date)}</p>
                          <p className="text-emerald-600">
                            Equity: {formatCurrency(item.value * multiplier, currency)}
                          </p>
                          <p className="text-rose-600">
                            Drawdown: {item.drawdown.toFixed(2)}%
                          </p>
                          {showBenchmark && item.benchmarkValue && (
                            <p className="text-blue-600">
                              Benchmark: {formatCurrency(item.benchmarkValue * multiplier, currency)}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#equityGradient)"
                />
                {showBenchmark && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="benchmarkValue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#ef4444"
                  strokeWidth={1}
                  fill="url(#drawdownGradient)"
                />
                <ReferenceLine y={10000} yAxisId="left" stroke="#6b7280" strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rolling Sharpe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-amber-500" />
              রোলিং শার্প রেশিও (৩০ দিন)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.rollingSharpe}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
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
                            <p className="text-amber-600">
                              Sharpe: {payload[0].value?.toFixed(2)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={1} stroke="#22c55e" strokeDasharray="3 3" />
                  <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                  <ReferenceLine y={-1} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              উইন/লস ডিস্ট্রিবিউশন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.winLossDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="range" type="category" width={100} stroke="#6b7280" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload) {
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{payload[0].payload.range}</p>
                            {payload.map((entry: any) => (
                              <p key={entry.name} style={{ color: entry.color }}>
                                {entry.name}: {entry.value}
                              </p>
                            ))}
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
      </div>

      {/* Calendar Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            দৈনিক P&L ক্যালেন্ডার
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap data={data.calendar} currency={currency} multiplier={multiplier} />
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarHeatmap({ 
  data, 
  currency,
  multiplier 
}: { 
  data: Array<{ date: string; pnl: number; trades: number }>; 
  currency: string;
  multiplier: number;
}) {
  const getColor = (pnl: number) => {
    if (pnl === 0) return 'bg-muted';
    if (pnl > 100) return 'bg-emerald-600';
    if (pnl > 50) return 'bg-emerald-500';
    if (pnl > 0) return 'bg-emerald-400';
    if (pnl > -50) return 'bg-rose-400';
    if (pnl > -100) return 'bg-rose-500';
    return 'bg-rose-600';
  };

  const days = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">লেজেন্ড:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-rose-600" />
          <div className="w-4 h-4 rounded bg-rose-400" />
          <div className="w-4 h-4 rounded bg-muted" />
          <div className="w-4 h-4 rounded bg-emerald-400" />
          <div className="w-4 h-4 rounded bg-emerald-600" />
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground py-2">{day}</div>
        ))}
        
        {data.map((day, idx) => (
          <div
            key={day.date}
            className={cn(
              "aspect-square rounded-lg cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-primary",
              getColor(day.pnl)
            )}
            title={`${formatDate(day.date)}: ${day.pnl >= 0 ? '+' : ''}${formatCurrency(day.pnl * multiplier, currency)} (${day.trades} trades)`}
          />
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
