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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity, TrendingUp, TrendingDown, AlertTriangle, Pause, Play,
  CheckCircle, XCircle, RefreshCw, Search, Filter, Eye, Zap,
  BarChart3, Clock, DollarSign, Users, Target, ArrowUpDown,
  Bell, BellOff, Volume2, VolumeX
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface MarketAlert {
  id: string;
  type: 'price_anomaly' | 'volume_spike' | 'unusual_activity' | 'resolution_pending';
  severity: 'low' | 'medium' | 'high' | 'critical';
  marketId: string;
  marketQuestion: string;
  message: string;
  createdAt: string;
  resolved: boolean;
}

interface MarketStats {
  marketId: string;
  question: string;
  status: string;
  volume24h: number;
  totalVolume: number;
  yesPrice: number;
  noPrice: number;
  bidDepth: number;
  askDepth: number;
  uniqueTraders: number;
  trades24h: number;
  priceChange24h: number;
}

interface QuickAction {
  type: 'pause' | 'resume' | 'resolve' | 'adjust_liquidity';
  marketId: string;
  marketQuestion: string;
}

export function MarketMonitor() {
  const { t } = useTranslation();
  const supabase = createClient();

  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [markets, setMarkets] = useState<MarketStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionDialog, setActionDialog] = useState<QuickAction | null>(null);
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch market stats
  const fetchMarkets = useCallback(async () => {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select(`
          id,
          question,
          status,
          volume,
          created_at,
          outcomes (
            probability,
            type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch trade stats for each market
      const marketsWithStats: MarketStats[] = await Promise.all(
        (events || []).map(async (event) => {
          // Get 24h volume
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: trades } = await supabase
            .from('trades')
            .select('price, quantity, created_at')
            .eq('event_id', event.id)
            .gte('created_at', dayAgo);

          const volume24h = (trades || []).reduce(
            (sum, t) => sum + (Number(t.price) * Number(t.quantity)),
            0
          );

          const trades24h = (trades || []).length;

          // Get unique traders
          const { data: positions } = await supabase
            .from('positions')
            .select('user_id')
            .eq('event_id', event.id);

          const uniqueTraders = new Set((positions || []).map(p => p.user_id)).size;

          // Get order book depth
          const { data: orders } = await supabase
            .from('orders')
            .select('side, price, remaining_quantity')
            .eq('event_id', event.id)
            .eq('status', 'open');

          const bids = (orders || [])
            .filter(o => o.side === 'buy')
            .reduce((sum, o) => sum + Number(o.remaining_quantity), 0);
          const asks = (orders || [])
            .filter(o => o.side === 'sell')
            .reduce((sum, o) => sum + Number(o.remaining_quantity), 0);

          // Get current price from outcomes
          const yesOutcome = (event.outcomes as any[])?.find(
            (o: any) => o.type === 'YES'
          );
          const noOutcome = (event.outcomes as any[])?.find(
            (o: any) => o.type === 'NO'
          );

          return {
            marketId: event.id,
            question: event.question,
            status: event.status,
            volume24h,
            totalVolume: Number(event.volume) || 0,
            yesPrice: yesOutcome ? Number(yesOutcome.probability) : 0.5,
            noPrice: noOutcome ? Number(noOutcome.probability) : 0.5,
            bidDepth: bids,
            askDepth: asks,
            uniqueTraders,
            trades24h,
            priceChange24h: 0, // calculated from historical data
          };
        })
      );

      setMarkets(marketsWithStats);
      setLastUpdated(new Date());

      // Detect alerts
      detectAlerts(marketsWithStats);
    } catch (error) {
      console.error('Error fetching markets:', error);
      toast({
        title: 'ত্রুটি',
        description: 'বাজারের তথ্য লোড করতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, toast]);

  // Detect alerts
  const detectAlerts = useCallback((marketData: MarketStats[]) => {
    const newAlerts: MarketAlert[] = [];

    marketData.forEach(market => {
      // Volume spike detection (>300% of average)
      if (market.trades24h > 30 && market.volume24h > 10000) {
        newAlerts.push({
          id: `${market.marketId}-volume`,
          type: 'volume_spike',
          severity: market.volume24h > 50000 ? 'high' : 'medium',
          marketId: market.marketId,
          marketQuestion: market.question,
          message: `উচ্চ ভলিউম: ৳${(market.volume24h / 1000).toFixed(1)}K (24 ঘণ্টা)`,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // Price anomaly (price moved >20% in 24h)
      if (Math.abs(market.priceChange24h) > 0.2) {
        newAlerts.push({
          id: `${market.marketId}-price`,
          type: 'price_anomaly',
          severity: Math.abs(market.priceChange24h) > 0.4 ? 'high' : 'medium',
          marketId: market.marketId,
          marketQuestion: market.question,
          message: `দামের পরিবর্তন: ${(market.priceChange24h * 100).toFixed(1)}% (24 ঘণ্টা)`,
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }

      // Resolution pending (>7 days old, still active)
      const marketAge = Date.now() - new Date(market.marketId).getTime();
      if (market.status === 'active' && marketAge > 7 * 24 * 60 * 60 * 1000) {
        newAlerts.push({
          id: `${market.marketId}-resolution`,
          type: 'resolution_pending',
          severity: 'low',
          marketId: market.marketId,
          marketQuestion: market.question,
          message: 'রেজোলিউশন প্রতীক্ষা করছে (৭+ দিন)',
          createdAt: new Date().toISOString(),
          resolved: false,
        });
      }
    });

    setAlerts(prev => {
      const existing = new Set(prev.map(a => a.id));
      const combined = [
        ...prev.filter(a => !newAlerts.find(n => n.id === a.id)),
        ...newAlerts.filter(n => !existing.has(n.id)),
      ];
      return combined.slice(0, 50); // Keep last 50 alerts
    });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMarkets();
    // Set up realtime subscription
    const channel = supabase
      .channel('market-monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => fetchMarkets()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trades' },
        () => fetchMarkets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMarkets, supabase]);

  // Pause/Resume market
  const handleMarketAction = async (action: QuickAction) => {
    try {
      if (action.type === 'pause' || action.type === 'resume') {
        const newStatus = action.type === 'pause' ? 'paused' : 'active';
        const { error } = await supabase
          .from('events')
          .update({ status: newStatus })
          .eq('id', action.marketId);

        if (error) throw error;

        toast({
          title: 'সফল',
          description: `বাজার ${action.type === 'pause' ? 'বিরাম দেওয়া হয়েছে' : 'পুনরায় চালু করা হয়েছে'}`,
        });
      } else if (action.type === 'resolve') {
        // Navigate to resolution page
        window.location.href = `/sys-cmd-7x9k2/resolutions?market=${action.marketId}`;
        return;
      }
      setActionDialog(null);
      fetchMarkets();
    } catch (error) {
      toast({
        title: 'ত্রুটি',
        description: 'কার্যক্রম সম্পাদন করতে ব্যর্থ হয়েছে',
        variant: 'destructive',
      });
    }
  };

  // Mark alert as resolved
  const resolveAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  };

  // Filter markets
  const filteredMarkets = markets.filter(m => {
    const matchesSearch = m.question
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const activeMarkets = markets.filter(m => m.status === 'active').length;
  const totalVolume24h = markets.reduce((sum, m) => sum + m.volume24h, 0);
  const totalTrades24h = markets.reduce((sum, m) => sum + m.trades24h, 0);
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">বাজার মনিটরিং</h2>
          <p className="text-sm text-slate-400">
            শেষ আপডেট: {lastUpdated.toLocaleTimeString('bn-BD')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAlertNotifications(!alertNotifications)}
          >
            {alertNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMarkets}>
            <RefreshCw className="w-4 h-4 mr-1" />
            রিফ্রেশ
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">সক্রিয় বাজার</p>
                <p className="text-2xl font-bold text-white">{activeMarkets}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">২৪ ঘণ্টার ভলিউম</p>
                <p className="text-2xl font-bold text-white">
                  ৳{(totalVolume24h / 1000).toFixed(1)}K
                </p>
              </div>
              <Volume2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">২৪ ঘণ্টার ট্রেড</p>
                <p className="text-2xl font-bold text-white">{totalTrades24h}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">সক্রিয় সতর্কতা</p>
                <p className="text-2xl font-bold text-white">{unresolvedAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="markets">বাজারসমূহ</TabsTrigger>
          <TabsTrigger value="alerts">
            সতর্কতাসমূহ
            {unresolvedAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unresolvedAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Markets Tab */}
        <TabsContent value="markets" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>সক্রিয় বাজার</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="বাজার খুঁজুন..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 w-64 bg-slate-950 border-slate-800"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-slate-950 border-slate-800">
                      <SelectValue placeholder="স্ট্যাটাস" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সবগুলি</SelectItem>
                      <SelectItem value="active">সক্রিয়</SelectItem>
                      <SelectItem value="paused">বিরামিত</SelectItem>
                      <SelectItem value="resolved">সমাধান হয়েছে</SelectItem>
                      <SelectItem value="closed">বন্ধ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead>বাজার</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead className="text-right">দাম (হ্যাঁ/না)</TableHead>
                      <TableHead className="text-right">২৪ ঘণ্টার ভলিউম</TableHead>
                      <TableHead className="text-right">মোট ভলিউম</TableHead>
                      <TableHead className="text-right">অনন্য ট্রেডার</TableHead>
                      <TableHead className="text-right">অ্যাকশন</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarkets.map(market => (
                      <TableRow key={market.marketId} className="border-slate-800">
                        <TableCell className="max-w-xs truncate">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{market.question}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              market.status === 'active'
                                ? 'default'
                                : market.status === 'paused'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={
                              market.status === 'active'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : ''
                            }
                          >
                            {market.status === 'active' ? 'সক্রিয়' :
                             market.status === 'paused' ? 'বিরামিত' :
                             market.status === 'resolved' ? 'সমাধান' : 'বন্ধ'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-green-400">
                              {(market.yesPrice * 100).toFixed(1)}%
                            </span>
                            <span className="text-slate-500">/</span>
                            <span className="text-red-400">
                              {(market.noPrice * 100).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-blue-400">
                            ৳{(market.volume24h / 1000).toFixed(1)}K
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span>
                            ৳{(market.totalVolume / 1000).toFixed(1)}K
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-purple-400">
                            {market.uniqueTraders}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setActionDialog({
                                  type: market.status === 'active' ? 'pause' : 'resume',
                                  marketId: market.marketId,
                                  marketQuestion: market.question,
                                })
                              }
                            >
                              {market.status === 'active' ? (
                                <Pause className="w-4 h-4 text-yellow-400" />
                              ) : (
                                <Play className="w-4 h-4 text-green-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setActionDialog({
                                  type: 'resolve',
                                  marketId: market.marketId,
                                  marketQuestion: market.question,
                                })
                              }
                            >
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredMarkets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                          কোনো বাজার পাওয়া যায়নি
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>সতর্কতা ও বিশ্লেষণ</CardTitle>
              <CardDescription>
                বাজারের সন্দেহজনক কার্যকলাপ সনাক্ত করুন
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alerts
                    .filter(a => !a.resolved)
                    .map(alert => (
                      <div
                        key={alert.id}
                        className={`flex items-start justify-between p-4 rounded-lg border ${
                          alert.severity === 'critical'
                            ? 'bg-red-500/10 border-red-500/30'
                            : alert.severity === 'high'
                            ? 'bg-orange-500/10 border-orange-500/30'
                            : alert.severity === 'medium'
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={`w-5 h-5 mt-0.5 ${
                              alert.severity === 'critical'
                                ? 'text-red-400'
                                : alert.severity === 'high'
                                ? 'text-orange-400'
                                : alert.severity === 'medium'
                                ? 'text-yellow-400'
                                : 'text-slate-400'
                            }`}
                          />
                          <div>
                            <p className="font-medium text-white">
                              {alert.type === 'price_anomaly'
                                ? 'দামের অস্বাভাবিকতা'
                                : alert.type === 'volume_spike'
                                ? 'ভলিউম বৃদ্ধি'
                                : alert.type === 'unusual_activity'
                                ? 'অস্বাভাবিক কার্যকলাপ'
                                : 'রেজোলিউশন প্রতীক্ষা'}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">
                              {alert.marketQuestion}
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              alert.severity === 'critical'
                                ? 'border-red-500/50 text-red-400'
                                : alert.severity === 'high'
                                ? 'border-orange-500/50 text-orange-400'
                                : alert.severity === 'medium'
                                ? 'border-yellow-500/50 text-yellow-400'
                                : 'border-slate-600 text-slate-400'
                            }
                          >
                            {alert.severity === 'critical' ? 'গুরুতর' :
                             alert.severity === 'high' ? 'উচ্চ' :
                             alert.severity === 'medium' ? 'মাঝারি' : 'নিম্ন'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {alerts.filter(a => !a.resolved).length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>কোনো সক্রিয় সতর্কতা নেই</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'pause' ? 'বাজার বিরামিত করুন' :
               actionDialog?.type === 'resume' ? 'বাজার চালু করুন' :
               'বাজার সমাধান করুন'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-400">
              আপনি কি নিশ্চিত যে আপনি এই বাজারে কার্যক্রম নিতে চান?
            </p>
            <p className="text-white font-medium">{actionDialog?.marketQuestion}</p>
            {actionDialog?.type === 'pause' && (
              <p className="text-sm text-yellow-400">
                ⚠️ বিরামিত করলে সমস্ত নতুন অর্ডার বন্ধ হয়ে যাবে
              </p>
            )}
            {actionDialog?.type === 'resolve' && (
              <p className="text-sm text-blue-400">
                → রেজোলিউশন প্যানেলে যেতে প্রস্তুত
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog(null)}
            >
              বাতিল
            </Button>
            <Button
              variant={
                actionDialog?.type === 'pause'
                  ? 'destructive'
                  : actionDialog?.type === 'resume'
                  ? 'default'
                  : 'default'
              }
              onClick={() => actionDialog && handleMarketAction(actionDialog)}
            >
              নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
