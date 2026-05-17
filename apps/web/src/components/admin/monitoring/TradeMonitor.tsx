'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity, BarChart3, TrendingUp, TrendingDown, AlertTriangle,
  Shield, Users, DollarSign, Clock, RefreshCw, Search,
  Filter, Eye, Ban, Cancel, CheckCircle, XCircle,
  ArrowUpDown, PieChart, LineChart
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  event_id: string;
  user_id: string;
  outcome: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  batch_id?: string;
  created_at: string;
  user_email?: string;
  market_question?: string;
  is_wash_trade?: boolean;
  is_volume_spike?: boolean;
  is_large_trade?: boolean;
}

interface SuspiciousActivity {
  type: 'wash_trading' | 'market_manipulation' | 'unusual_volume';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userEmail?: string;
  description: string;
  evidence: string[];
  detectedAt: string;
}

interface VolumeDistribution {
  outcome: string;
  buyVolume: number;
  sellVolume: number;
  buyTrades: number;
  sellTrades: number;
  avgBuyPrice: number;
  avgSellPrice: number;
}

interface PriceDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface UserStats {
  userId: string;
  email: string;
  totalTrades: number;
  totalVolume: number;
  buyWinRate: number;
  avgTradeSize: number;
  lastTrade: string;
  isSuspicious: boolean;
}

export function TradeMonitor() {
  const { t } = useTranslation();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [freezeDialog, setFreezeDialog] = useState<UserStats | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{ orderIds: string[] } | null>(null);
  const [volumeDist, setVolumeDist] = useState<VolumeDistribution[]>([]);
  const [priceDist, setPriceDist] = useState<PriceDistribution[]>([]);

  // Fetch trades via API route (uses local PostgreSQL)
  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/monitoring/trades');
      if (!res.ok) throw new Error('Failed to fetch trades');
      const result = await res.json();
      const mappedTrades: Trade[] = (result.data || []).map((t: any) => ({
        ...t,
        user_email: t.user_email,
        market_question: t.market_question,
        is_wash_trade: !!t.is_wash_trade,
        is_volume_spike: !!t.is_volume_spike,
        is_large_trade: !!t.is_large_trade,
      }));
      setTrades(mappedTrades);
      buildSuspiciousActivity(mappedTrades);
      calculateVolumeDistribution(mappedTrades);
      calculatePriceDistribution(mappedTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast({ title: 'ত্রুটি', description: 'ট্রেডের তথ্য লোড করতে ব্যর্থ হয়েছে', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch user stats via API (uses local PostgreSQL)
  const fetchUserStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/monitoring/trades?tab=users');
      if (!res.ok) throw new Error('Failed to fetch user stats');
      const result = await res.json();
      const stats: UserStats[] = (result.data || []).map((r: any) => ({
        userId: r.user_id,
        email: r.email || '',
        totalTrades: Number(r.trade_count) || 0,
        totalVolume: Number(r.total_volume) || 0,
        buyWinRate: 0,
        avgTradeSize: Number(r.total_volume) / Math.max(Number(r.trade_count), 1),
        lastTrade: r.last_trade || '',
        isSuspicious: r.risk_level === 'high_risk',
        // positions from joined query
        positions: [],
      }));
      setUserStats(stats.slice(0, 50));
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, []);

  // Build suspicious activity from SERVER flags (not client thresholds)
  const buildSuspiciousActivity = useCallback((tradeData: Trade[]) => {
    const activity: SuspiciousActivity[] = [];
    const seenUsers = new Set<string>();

    tradeData.forEach(t => {
      if (t.is_wash_trade && !seenUsers.has(`${t.user_id}-wash`)) {
        seenUsers.add(`${t.user_id}-wash`);
        activity.push({
          type: 'wash_trading',
          severity: 'high',
          userId: t.user_id,
          userEmail: t.user_email,
          description: `একই ব্যবহারকারী দ্বি-দিক ট্রেড করছেন (AI নির্ণযিত)`,
          evidence: [
            `তারিখ: ${new Date(t.created_at).toLocaleString('bn-BD')}`,
            `বাজার: ${t.market_question || t.event_id.slice(0, 12)}`,
            `দাম: ৽${(t.price * t.quantity).toFixed(0)}`,
          ],
          detectedAt: t.created_at,
        });
      }
      if (t.is_volume_spike && !seenUsers.has(`${t.user_id}-spike`)) {
        seenUsers.add(`${t.user_id}-spike`);
        activity.push({
          type: 'unusual_volume',
          severity: 'high',
          userId: t.user_id,
          userEmail: t.user_email,
          description: `অস্বাভাবিক ভলিউম স্পাইক (AI নির্ণযিত)`,
          evidence: [
            `তারিখ: ${new Date(t.created_at).toLocaleString('bn-BD')}`,
            `মোট দাম: ৽${(t.price * t.quantity).toFixed(0)}`,
          ],
          detectedAt: t.created_at,
        });
      }
    });

    setSuspiciousActivity(activity.slice(0, 20));
  }, []);

  // Calculate volume distribution by outcome
  const calculateVolumeDistribution = useCallback((tradeData: Trade[]) => {
    const distMap = new Map<string, VolumeDistribution>();

    tradeData.forEach(t => {
      const existing = distMap.get(t.outcome) || {
        outcome: t.outcome,
        buyVolume: 0,
        sellVolume: 0,
        buyTrades: 0,
        sellTrades: 0,
        avgBuyPrice: 0,
        avgSellPrice: 0,
      };

      if (t.side === 'buy') {
        existing.buyVolume += Number(t.price) * Number(t.quantity);
        existing.buyTrades += 1;
      } else {
        existing.sellVolume += Number(t.price) * Number(t.quantity);
        existing.sellTrades += 1;
      }

      distMap.set(t.outcome, existing);
    });

    setVolumeDist(Array.from(distMap.values()));
  }, []);

  // Calculate price distribution histogram
  const calculatePriceDistribution = useCallback((tradeData: Trade[]) => {
    const ranges = [
      '0-10%', '10-20%', '20-30%', '30-40%', '40-50%',
      '50-60%', '60-70%', '70-80%', '80-90%', '90-100%',
    ];
    const counts = new Array(10).fill(0);

    tradeData.forEach(t => {
      const price = Number(t.price) * 100;
      const bucket = Math.min(Math.floor(price / 10), 9);
      counts[bucket]++;
    });

    const total = tradeData.length || 1;
    const distribution: PriceDistribution[] = ranges.map((range, i) => ({
      range,
      count: counts[i],
      percentage: (counts[i] / total) * 100,
    }));

    setPriceDist(distribution);
  }, []);

  // Initial fetch (no realtime - uses API polling)
  useEffect(() => {
    fetchTrades();
    fetchUserStats();
  }, [fetchTrades, fetchUserStats]);

  // Freeze user
  const handleFreezeUser = async () => {
    if (!freezeDialog) return;
    try {
      const freezeRes = await fetch('/api/admin/monitoring/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'freeze_user', userId: freezeDialog.userId })
      });
      if (!freezeRes.ok) throw new Error('Failed to freeze user');

      toast({
        title: 'সফল',
        description: 'ব্যবহারকারীর অ্যাকাউন্ট হিমায়িত করা হয়েছে',
      });
      setFreezeDialog(null);
      fetchUserStats();
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'ব্যবহারকারী হিমায়িত করতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    }
  };

  // Cancel orders
  const handleCancelOrders = async () => {
    if (!cancelDialog) return;
    try {
      const cancelRes = await fetch('/api/admin/monitoring/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_orders', orderIds: cancelDialog.orderIds })
      });
      if (!cancelRes.ok) throw new Error('Failed to cancel orders');

      toast({
        title: 'সফল',
        description: `${cancelDialog.orderIds.length}টি অর্ডার বাতিল করা হয়েছে`,
      });
      setCancelDialog(null);
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'অর্ডার বাতিল করতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    }
  };

  // Stats
  const totalVolume = trades.reduce(
    (sum, t) => sum + Number(t.price) * Number(t.quantity),
    0
  );
  const totalTrades = trades.length;
  const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
  const suspiciousCount = suspiciousActivity.filter(a => a.severity === 'high' || a.severity === 'critical').length;

  // Filter trades by search
  const filteredTrades = trades.filter(t =>
    (t.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (t.market_question?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">ট্রেড মনিটরিং</h2>
          <p className="text-sm text-slate-400">
            বাজার ট্রেড এবং সন্দেহজনক কার্যকলাপ পর্যবেক্ষণ
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchTrades(); fetchUserStats(); }}>
          <RefreshCw className="w-4 h-4 mr-1" />
          রিফ্রেশ
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">মোট ট্রেড</p>
                <p className="text-2xl font-bold text-white">{totalTrades}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">মোট ভলিউম</p>
                <p className="text-2xl font-bold text-white">
                  ৳{(totalVolume / 1000).toFixed(1)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">গড় ট্রেড সাইজ</p>
                <p className="text-2xl font-bold text-white">
                  ৳{avgTradeSize.toFixed(0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">সন্দেহজনক কার্যকলাপ</p>
                <p className="text-2xl font-bold text-red-400">{suspiciousCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trades">সাম্প্রতিক ট্রেড</TabsTrigger>
          <TabsTrigger value="analytics">অ্যানালিটিক্স</TabsTrigger>
          <TabsTrigger value="users">ব্যবহারকারী</TabsTrigger>
          <TabsTrigger value="suspicious">
            সন্দেহজনক
            {suspiciousCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {suspiciousCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Trades Tab */}
        <TabsContent value="trades">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>সাম্প্রতিক ট্রেড</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="ব্যবহারকারী বা বাজার খুঁজুন..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 w-64 bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead>সময়</TableHead>
                      <TableHead>ব্যবহারকারী</TableHead>
                      <TableHead>বাজার</TableHead>
                      <TableHead>দিক</TableHead>
                      <TableHead>ব্যাচ</TableHead>
                      <TableHead className="text-right">দাম</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                      <TableHead className="text-right">মোট</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.slice(0, 50).map(trade => (
                      <TableRow key={trade.id} className={cn(
                        "border-slate-800",
                        trade.is_wash_trade && "bg-red-900/5",
                        trade.is_volume_spike && "bg-amber-900/5",
                      )}>
                        <TableCell className="text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(trade.created_at).toLocaleTimeString('bn-BD', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{trade.user_email || trade.user_id.slice(0, 8)}</span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          <span className="text-sm truncate">{trade.market_question || trade.event_id.slice(0, 12)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.side === 'buy' ? 'default' : 'destructive'}
                            className={
                              trade.side === 'buy'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }
                          >
                            {trade.side === 'buy' ? 'ক্রয়' : 'বিক্রয়'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trade.batch_id ? (
                            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                              Batch {trade.batch_id.slice(0, 8)}
                            </Badge>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                            {(Number(trade.price) * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {trade.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ৳{(Number(trade.price) * Number(trade.quantity)).toFixed(2)}
                          {(trade.is_wash_trade || trade.is_volume_spike || trade.is_large_trade) && (
                            <div className="flex gap-1 mt-1 justify-end">
                              {trade.is_wash_trade && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1 py-0">
                                  Wash
                                </Badge>
                              )}
                              {trade.is_volume_spike && (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1 py-0">
                                  Spike
                                </Badge>
                              )}
                              {trade.is_large_trade && (
                                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px] px-1 py-0">
                                  Large
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTrades.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                          কোনো ট্রেড পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Volume by Outcome */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">ভলিউম বিশ্লেষণ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {volumeDist.map(vd => (
                    <div key={vd.outcome} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{vd.outcome}</span>
                        <span className="text-slate-400">
                          ৳{((vd.buyVolume + vd.sellVolume) / 1000).toFixed(1)}K
                        </span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(vd.buyVolume / (vd.buyVolume + vd.sellVolume + 1)) * 100}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${(vd.sellVolume / (vd.buyVolume + vd.sellVolume + 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>ক্রয়: ৳{(vd.buyVolume / 1000).toFixed(1)}K</span>
                        <span>বিক্রয়: ৳{(vd.sellVolume / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Distribution */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg">দাম বিতরণ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {priceDist.map((pd, i) => (
                    <div key={pd.range} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-16">{pd.range}</span>
                      <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500/70 rounded"
                          style={{ width: `${pd.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-12 text-right">
                        {pd.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>ব্যবহারকারী পরিসংখ্যান</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead>ব্যবহারকারী</TableHead>
                      <TableHead className="text-right">ট্রেড</TableHead>
                      <TableHead className="text-right">ভলিউম</TableHead>
                      <TableHead className="text-right">গড় সাইজ</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead>অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStats.map(user => (
                      <TableRow key={user.userId} className="border-slate-800">
                        <TableCell>
                          <span className="text-sm">{user.email || user.userId.slice(0, 12)}</span>
                        </TableCell>
                        <TableCell className="text-right">{user.totalTrades}</TableCell>
                        <TableCell className="text-right">
                          ৳{(user.totalVolume / 1000).toFixed(1)}K
                        </TableCell>
                        <TableCell className="text-right">
                          ৳{user.avgTradeSize.toFixed(0)}
                        </TableCell>
                        <TableCell>
                          {user.isSuspicious ? (
                            <Badge variant="destructive">সন্দেহজনক</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500/20 text-green-400">
                              স্বাভাবিক
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFreezeDialog(user)}
                              title="হিমায়িত করুন"
                            >
                              <Ban className="w-4 h-4 text-blue-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {userStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                          কোনো ব্যবহারকারী পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspicious Tab */}
        <TabsContent value="suspicious">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>সন্দেহজনক কার্যকলাপ</CardTitle>
              <CardDescription>
                সনাক্তকৃত সন্দেহজনক ট্রেডিং প্যাটার্ন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {suspiciousActivity.map((activity, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border ${
                        activity.severity === 'critical'
                          ? 'bg-red-500/10 border-red-500/30'
                          : activity.severity === 'high'
                          ? 'bg-orange-500/10 border-orange-500/30'
                          : 'bg-yellow-500/10 border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`w-5 h-5 mt-0.5 ${
                              activity.severity === 'critical'
                                ? 'text-red-400'
                                : 'text-orange-400'
                            }`}
                          />
                          <div>
                            <p className="font-medium text-white">
                              {activity.type === 'wash_trading'
                                ? 'ওয়াশ ট্রেডিং'
                                : activity.type === 'market_manipulation'
                                ? 'বাজার কারসাজি'
                                : 'অস্বাভাবিক ভলিউম'}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              ব্যবহারকারী: {activity.userEmail || activity.userId.slice(0, 12)}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {activity.description}
                            </p>
                            <div className="mt-2 space-y-1">
                              {activity.evidence.map((e, j) => (
                                <p key={j} className="text-xs text-slate-500">
                                  • {e}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              activity.severity === 'critical'
                                ? 'border-red-500/50 text-red-400'
                                : 'border-orange-500/50 text-orange-400'
                            }
                          >
                            {activity.severity === 'critical' ? 'গুরুতর' : 'উচ্চ'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFreezeDialog({
                              ...activity,
                              email: activity.userEmail || '',
                              totalTrades: 0,
                              totalVolume: 0,
                              buyWinRate: 0,
                              avgTradeSize: 0,
                              lastTrade: activity.detectedAt,
                              isSuspicious: true,
                            })}
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {suspiciousActivity.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>কোনো সন্দেহজনক কার্যকলাপ সনাক্ত হয়নি</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Freeze User Dialog */}
      <Dialog open={!!freezeDialog} onOpenChange={() => setFreezeDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>ব্যবহারকারী হিমায়িত করুন</DialogTitle>
            <DialogDescription>
              এই ব্যবহারকারীর অ্যাকাউন্ট সাময়িকভাবে হিমায়িত করা হবে।
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white font-medium">
              {freezeDialog?.email || freezeDialog?.userId.slice(0, 12)}
            </p>
            <p className="text-sm text-yellow-400">
              ⚠️ হিমায়িত ব্যবহারকারী ট্রেড বা জমা/উত্তোলন করতে পারবে না।
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeDialog(null)}>
              বাতিল
            </Button>
            <Button variant="destructive" onClick={handleFreezeUser}>
              হিমায়িত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
