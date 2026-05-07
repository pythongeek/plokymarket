'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface Summary {
  new_users: number;
  new_orders: number;
  total_volume: number;
  active_markets: number;
  resolved_markets: number;
  deposit_volume: number;
  withdrawal_volume: number;
  trade_count: number;
  active_traders: number;
}

interface DataPoint {
  date: string;
  orders?: number;
  volume?: number;
  users?: number;
}

interface TopMarket {
  name: string;
  volume: number;
  traders: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [volumeSeries, setVolumeSeries] = useState<DataPoint[]>([]);
  const [userGrowth, setUserGrowth] = useState<DataPoint[]>([]);
  const [topMarkets, setTopMarkets] = useState<TopMarket[]>([]);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setVolumeSeries(data.volumeSeries || []);
        setUserGrowth(data.userGrowth || []);
        setTopMarkets(data.topMarkets || []);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [period]);

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card className="bg-[#0f1629] border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {loading ? '-' : typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          </div>
          <div className="flex gap-2">
            {['24h', '7d', '30d'].map(p => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? 'default' : 'outline'}
                className={period === p ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 hover:bg-slate-800'}
                onClick={() => setPeriod(p)}
              >
                {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : '30 Days'}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="New Users" value={summary?.new_users || 0} icon={Users} color="bg-blue-500/20" trend={12} />
          <StatCard title="New Orders" value={summary?.new_orders || 0} icon={Activity} color="bg-emerald-500/20" trend={8} />
          <StatCard title="Total Volume" value={`$${((summary?.total_volume || 0) / 1000).toFixed(1)}k`} icon={DollarSign} color="bg-amber-500/20" />
          <StatCard title="Active Markets" value={summary?.active_markets || 0} icon={TrendingUp} color="bg-purple-500/20" trend={-3} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Active Traders" value={summary?.active_traders || 0} icon={Users} color="bg-cyan-500/20" />
          <StatCard title="Trade Count" value={summary?.trade_count || 0} icon={Activity} color="bg-rose-500/20" />
          <StatCard title="Deposits" value={`$${((summary?.deposit_volume || 0)).toFixed(0)}`} icon={DollarSign} color="bg-emerald-500/20" />
          <StatCard title="Withdrawals" value={`$${((summary?.withdrawal_volume || 0)).toFixed(0)}`} icon={DollarSign} color="bg-orange-500/20" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-[#0f1629] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Trading Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={volumeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1629] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#0f1629] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Top Markets by Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={topMarkets}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="volume"
                  >
                    {topMarkets.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1629', border: '1px solid #1e293b', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {topMarkets.slice(0, 5).map((m, i) => (
                  <Badge key={i} variant="outline" className="text-xs border-slate-700" style={{ borderColor: COLORS[i % COLORS.length] }}>
                    <span className="w-2 h-2 rounded-full mr-1 inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {m.name?.slice(0, 20)}...
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1629] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Market Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Markets</span>
                  <span className="text-emerald-400 font-bold">{summary?.active_markets || 0}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((summary?.active_markets || 0) / 20) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Resolved Markets</span>
                  <span className="text-blue-400 font-bold">{summary?.resolved_markets || 0}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((summary?.resolved_markets || 0) / 50) * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Platform Volume</span>
                  <span className="text-amber-400 font-bold">${((summary?.total_volume || 0)).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Deposit / Withdrawal Ratio</span>
                  <span className="text-cyan-400 font-bold">
                    {summary?.deposit_volume && summary?.withdrawal_volume
                      ? `${((summary.deposit_volume / (summary.withdrawal_volume || 1))).toFixed(1)}x`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
