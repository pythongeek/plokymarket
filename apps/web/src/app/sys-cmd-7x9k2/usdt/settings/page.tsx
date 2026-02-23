import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/server';
import { RefreshCw, Settings, Clock, TrendingUp } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get current exchange rate
  const { data: exchangeRate } = await supabase
    .from('exchange_rates_live')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  // Get rate history for last 24 hours
  const { data: rateHistory } = await supabase
    .from('exchange_rates_live')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(24);

  // Get settings from database or use defaults
  const settings = {
    autoRefreshInterval: 300, // 5 minutes
    fallbackRate: 120,
    source: 'binance_p2p',
    threshold: 0.5
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">এক্সচেঞ্জ রেট সেটিংস</h1>
          <p className="text-muted-foreground">USDT/BDT রেট কনফিগারেশন</p>
        </div>
      </div>

      {/* Current Rate */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">বর্তমান রেট</p>
              <p className="text-4xl font-bold">১ USDT = {exchangeRate?.usdt_to_bdt?.toFixed(2) || '120.00'} BDT</p>
              <p className="text-sm text-blue-100 mt-1">
                সোর্স: {exchangeRate?.source === 'binance_p2p' ? 'Binance P2P' : 'ডিফল্ট'} | 
                আপডেট: {exchangeRate?.fetched_at ? new Date(exchangeRate.fetched_at).toLocaleTimeString('bn-BD') : 'N/A'}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manual Refresh */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              ম্যানুয়াল রিফ্রেশ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Binance P2P API থেকে এখনই নতুন রেট আনুন।
            </p>
            <form action="/api/exchange-rate/refresh" method="POST">
              <Button type="submit" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                রেট রিফ্রেশ করুন
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Auto Refresh Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              অটো রিফ্রেশ সেটিংস
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>অটো রিফ্রেশ চালু</Label>
                <p className="text-xs text-muted-foreground">
                  প্রতি {settings.autoRefreshInterval / 60} মিনিটে রেট আপডেট
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">রিফ্রেশ ইন্টারভাল (সেকেন্ড)</Label>
              <Input
                id="interval"
                type="number"
                defaultValue={settings.autoRefreshInterval}
                placeholder="300"
              />
              <p className="text-xs text-muted-foreground">
                সাজেস্টেড: 300 (৫ মিনিট), 10800 (৩ ঘণ্টা)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">পরিবর্তন থ্রেশহোল্ড (%)</Label>
              <Input
                id="threshold"
                type="number"
                step="0.1"
                defaultValue={settings.threshold}
                placeholder="0.5"
              />
              <p className="text-xs text-muted-foreground">
                রেট এত % বদলালে অটো আপডেট
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fallback Rate */}
        <Card>
          <CardHeader>
            <CardTitle>ফলব্যাক রেট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fallback">ডিফল্ট রেট (BDT per USDT)</Label>
              <Input
                id="fallback"
                type="number"
                step="0.01"
                defaultValue={settings.fallbackRate}
                placeholder="120"
              />
              <p className="text-xs text-muted-foreground">
                API ব্যর্থ হলে এই রেট ব্যবহার হবে
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rate Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              রেট সোর্স
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>সোর্স নির্বাচন করুন</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="radio"
                    name="source"
                    value="binance_p2p"
                    defaultChecked={settings.source === 'binance_p2p'}
                  />
                  <div>
                    <p className="font-medium">Binance P2P</p>
                    <p className="text-xs text-muted-foreground">
                      Binance P2P মার্কেট থেকে রিয়েলটাইম রেট
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="radio"
                    name="source"
                    value="manual"
                    defaultChecked={settings.source === 'manual'}
                  />
                  <div>
                    <p className="font-medium">ম্যানুয়াল</p>
                    <p className="text-xs text-muted-foreground">
                      অ্যাডমিন দ্বারা নির্ধারিত রেট
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate History */}
      <Card>
        <CardHeader>
          <CardTitle>রেট হিস্ট্রি (সর্বশেষ ২৪টি)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">সময়</th>
                  <th className="text-right p-3">USDT → BDT</th>
                  <th className="text-right p-3">BDT → USDT</th>
                  <th className="text-left p-3">সোর্স</th>
                </tr>
              </thead>
              <tbody>
                {rateHistory?.map((r: any, i: number) => (
                  <tr key={r.id || i} className="border-b">
                    <td className="p-3">
                      {new Date(r.fetched_at).toLocaleString('bn-BD')}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {r.usdt_to_bdt?.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {r.bdt_to_usdt?.toFixed(6)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        r.source === 'binance_p2p' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {r.source}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!rateHistory || rateHistory.length === 0) && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      কোনো হিস্ট্রি নেই
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