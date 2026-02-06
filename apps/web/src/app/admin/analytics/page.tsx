'use client';

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
    AreaChart,
    Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    TrendingUp,
    Users,
    DollarSign,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MOCK_ANALYTICS = {
    dailyVolume: 1250000,
    dailyTrades: 4520,
    activeMarkets: 156,
    activeUsers: 890,
    tvl: 5800000,
    feesGenerated: 25000,
    retentionRate: 68.5,
};

const VOLUME_DATA = [
    { name: 'Mon', volume: 400000 },
    { name: 'Tue', volume: 300000 },
    { name: 'Wed', volume: 600000 },
    { name: 'Thu', volume: 800000 },
    { name: 'Fri', volume: 1200000 },
    { name: 'Sat', volume: 900000 },
    { name: 'Sun', volume: 1100000 },
];

const USER_ACTIVITY = [
    { time: '00:00', users: 120 },
    { time: '04:00', users: 80 },
    { time: '08:00', users: 450 },
    { time: '12:00', users: 820 },
    { time: '16:00', users: 950 },
    { time: '20:00', users: 600 },
];

export default function AdminAnalyticsPage() {
    return (
        <div className="p-8 space-y-8 bg-[#020617] min-h-screen text-slate-100">
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    Platform Analytics
                </h1>
                <p className="text-slate-400">Real-time oversight of Plokymarket health and liquidity metrics.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Value Locked', value: `৳${MOCK_ANALYTICS.tvl.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', trend: '+12%' },
                    { label: 'Daily Trading Volume', value: `৳${MOCK_ANALYTICS.dailyVolume.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400', trend: '+5%' },
                    { label: 'Active Traders', value: MOCK_ANALYTICS.activeUsers.toLocaleString(), icon: Users, color: 'text-indigo-400', trend: '+18%' },
                    { label: 'Retention Rate', value: `${MOCK_ANALYTICS.retentionRate}%`, icon: Activity, color: 'text-purple-400', trend: '+2%' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md relative overflow-hidden group">
                            <div className={cn("absolute top-0 left-0 w-1 h-full", stat.color.replace('text', 'bg'))} />
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-2xl font-black">{stat.value}</p>
                                    </div>
                                    <div className={cn("h-12 w-12 rounded-2xl bg-slate-800/50 flex items-center justify-center group-hover:scale-110 transition-transform", stat.color)}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> {stat.trend}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">vs last 24h</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Volume Chart */}
                <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Trading Volume (7D)</CardTitle>
                        <CardDescription className="text-slate-500">Daily aggregate across all markets</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={VOLUME_DATA}>
                                    <defs>
                                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(v) => `৳${v / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="volume"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#volumeGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* User Activity Chart */}
                <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Network Traffic</CardTitle>
                        <CardDescription className="text-slate-500">Live concurrent traders</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={USER_ACTIVITY}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <YAxis
                                        hide
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#1e293b' }}
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    />
                                    <Bar
                                        dataKey="users"
                                        fill="#818cf8"
                                        radius={[4, 4, 0, 0]}
                                        barSize={30}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-indigo-400" />
                            Revenue Stream
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30">
                            <span className="text-sm text-slate-400">Trading Fees Collected</span>
                            <span className="font-bold">৳18,450.00</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30">
                            <span className="text-sm text-slate-400">Withdrawal Fees</span>
                            <span className="font-bold">৳6,550.00</span>
                        </div>
                        <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                            <span className="font-bold">Total Platform Revenue</span>
                            <span className="text-xl font-black text-emerald-400">৳25,000.00</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-400" />
                            Top Growth Sectors
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { name: 'Crypto Markets', share: '45%' },
                            { name: 'Politics (BD)', share: '30%' },
                            { name: 'Sports', share: '15%' },
                            { name: 'Entertainment', share: '10%' },
                        ].map((sector) => (
                            <div key={sector.name} className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>{sector.name}</span>
                                    <span className="text-slate-400">{sector.share}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: sector.share }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
