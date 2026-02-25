import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/server';
import { RefreshCw, Settings, Clock, TrendingUp } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get current exchange rate
  const { data: exchangeRate } = await (supabase
    .from('exchange_rates_live')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single() as any);

  // Get rate history for last 24 hours
  const { data: rateHistory } = await (supabase
    .from('exchange_rates_live')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(24) as any);

  // Get settings from database or use defaults
  const settings = {
    autoRefreshInterval: 300, // 5 minutes
    fallbackRate: 120,
    source: 'binance_p2p',
    threshold: 0.5,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">USDT Exchange Rate Settings</h1>
      </div>

      {/* Current Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Rate (BDT)</Label>
              <p className="text-2xl font-bold">
                {exchangeRate?.rate ? `৳${Number(exchangeRate.rate).toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Source</Label>
              <p className="text-lg">
                <span className={`inline-block px-2 py-1 rounded text-sm ${exchangeRate?.source === 'binance_p2p'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {exchangeRate?.source === 'binance_p2p' ? 'Binance P2P' : (exchangeRate?.source || 'N/A')}
                </span>
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Last Update</Label>
              <p className="text-sm">
                {exchangeRate?.fetched_at
                  ? new Date(exchangeRate.fetched_at).toLocaleString('en-BD')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <form action="/api/exchange-rate/refresh" method="POST">
                <Button type="submit" variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Rate
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Rate Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Auto Refresh Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                defaultValue={settings.autoRefreshInterval}
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallback">Fallback Rate (BDT)</Label>
              <Input
                id="fallback"
                type="number"
                defaultValue={settings.fallbackRate}
                placeholder="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threshold">Alert Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                step="0.1"
                defaultValue={settings.threshold}
                placeholder="0.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rate History (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Rate (BDT)</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rateHistory && rateHistory.length > 0 ? (
                  rateHistory.map((r: any) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-2">
                        {new Date(r.fetched_at).toLocaleString('en-BD')}
                      </td>
                      <td className="p-2 font-mono">
                        ৳{Number(r.rate).toFixed(2)}
                      </td>
                      <td className="p-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs ${r.source === 'binance_p2p'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {r.source}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-green-600">✓</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No rate history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}