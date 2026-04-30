'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAutoRefreshRate } from '@/lib/realtime/exchange-rate-sse';

interface ExchangeRate {
  usdt_to_bdt: number;
  bdt_to_usdt: number;
  source: 'binance_p2p' | 'binance_spot' | 'manual';
  fetched_at: string;
  buy_rate?: number;
  sell_rate?: number;
}

interface RateHistory {
  usdt_to_bdt: number;
  source: string;
  fetched_at: string;
}

export function AdminP2PRateDisplay() {
  const { rate, loading, error, lastUpdated, refresh } = useAutoRefreshRate(30);
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([]);
  const [prevRate, setPrevRate] = useState<number | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const supabase = createClient();

  // Fetch rate history
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('exchange_rates_live')
        .select('usdt_to_bdt, source, fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(24);
      if (data) setRateHistory(data);
    };
    fetchHistory();
  }, []);

  const currentRate = rate?.usdt_to_bdt || 120;
  const rateChange = prevRate ? ((currentRate - prevRate) / prevRate) * 100 : 0;
  const isPositive = rateChange >= 0;

  // Track rate changes
  useEffect(() => {
    if (currentRate !== prevRate && prevRate !== null) {
      // Rate changed!
    }
    setPrevRate(currentRate);
  }, [currentRate]);

  const handleManualRefresh = async () => {
    try {
      const response = await fetch('/api/exchange-rate/refresh', { method: 'POST' });
      const data = await response.json();
      if (data.rate) {
        setPrevRate(currentRate);
      }
      await refresh();
    } catch (e) {
      console.error('Manual refresh error:', e);
    }
  };

  // Calculate stats
  const rates = rateHistory.map(r => r.usdt_to_bdt);
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : currentRate;
  const minRate = rates.length > 0 ? Math.min(...rates) : currentRate;
  const maxRate = rates.length > 0 ? Math.max(...rates) : currentRate;

  return (
    <div className="space-y-6">
      {/* Main Rate Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-blue-100">Real-time USDT/BDT Rate</p>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-bold">৳{currentRate.toFixed(2)}</span>
                  {rateChange !== 0 && (
                    <Badge className={`${isPositive ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                      {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {Math.abs(rateChange).toFixed(2)}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex gap-2">
                <Button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  রিফ্রেশ
                </Button>
                <Button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  variant={isAutoRefresh ? 'default' : 'outline'}
                  className={isAutoRefresh ? 'bg-green-500 hover:bg-green-600' : 'border-white/30 text-white hover:bg-white/10'}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {isAutoRefresh ? 'Auto: ON' : 'Auto: OFF'}
                </Button>
              </div>
              <p className="text-blue-200 text-sm mt-2">
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString('bn-BD') : 'Just now'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Buy Rate</p>
                <p className="text-2xl font-bold text-green-600">৳{(rate?.buy_rate || currentRate).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sell Rate</p>
                <p className="text-2xl font-bold text-red-600">৳{(rate?.sell_rate || currentRate * 0.99).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg (24h)</p>
                <p className="text-2xl font-bold">৳{avgRate.toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Spread</p>
                <p className="text-2xl font-bold">
                  ৳{((rate?.buy_rate || currentRate) - (rate?.sell_rate || currentRate * 0.99)).toFixed(2)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Rate History (Last 24 Updates)</span>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-4">
              <div className="h-64 flex items-end gap-1">
                {rateHistory.map((r, i) => {
                  const height = ((r.usdt_to_bdt - minRate) / (maxRate - minRate || 1)) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-t transition-colors"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${r.usdt_to_bdt.toFixed(2)} BDT - ${new Date(r.fetched_at).toLocaleTimeString()}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Min: ৳{minRate.toFixed(2)}</span>
                <span>Max: ৳{maxRate.toFixed(2)}</span>
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Time</th>
                      <th className="text-right p-2">Rate (BDT)</th>
                      <th className="text-left p-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateHistory.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-2">{new Date(r.fetched_at).toLocaleString('bn-BD')}</td>
                        <td className="p-2 text-right font-mono">৳{r.usdt_to_bdt.toFixed(2)}</td>
                        <td className="p-2">
                          <Badge variant={r.source === 'binance_p2p' ? 'default' : 'secondary'}>
                            {r.source}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {error} - Using fallback rate
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}