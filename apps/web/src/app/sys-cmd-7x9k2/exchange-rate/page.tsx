'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
    Loader2, RefreshCw, DollarSign, Settings, TrendingUp, TrendingDown,
    Clock, Activity, AlertTriangle, Save, BarChart3, Shield
} from 'lucide-react';

interface ExchangeRateConfig {
    default_usdt_to_bdt: number;
    min_usdt_to_bdt: number;
    max_usdt_to_bdt: number;
    auto_update_enabled: boolean;
    update_interval_minutes: number;
    last_updated?: string;
}

interface LiveRate {
    usdt_to_bdt: number;
    bdt_to_usdt: number;
    source: string;
    fetched_at: string;
    is_active: boolean;
}

interface RateHistory {
    usdt_to_bdt: number;
    source: string;
    recorded_at: string;
}

export default function ExchangeRateConfigPage() {
    const [config, setConfig] = useState<ExchangeRateConfig>({
        default_usdt_to_bdt: 119,
        min_usdt_to_bdt: 95,
        max_usdt_to_bdt: 130,
        auto_update_enabled: false,
        update_interval_minutes: 5,
    });
    const [liveRate, setLiveRate] = useState<LiveRate | null>(null);
    const [history, setHistory] = useState<RateHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [manualRate, setManualRate] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/exchange-rate-config');
            if (!res.ok) throw new Error('Failed to fetch config');
            const data = await res.json();

            if (data.success) {
                setConfig(data.config);
                setLiveRate(data.liveRate);
                setHistory(data.history || []);
            }
        } catch (err) {
            console.error('Error fetching exchange rate config:', err);
            toast({ title: 'ত্রুটি', description: 'কনফিগ লোড করা যায়নি', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveConfig = async () => {
        setSaving(true);
        try {
            const payload: any = { ...config };

            // If manual rate is set, include it
            if (manualRate && parseFloat(manualRate) > 0) {
                payload.manual_rate = parseFloat(manualRate);
            }

            const res = await fetch('/api/admin/exchange-rate-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');

            toast({ title: 'সফল', description: 'কনফিগ আপডেট হয়েছে' });
            setManualRate('');
            fetchData(); // Refresh
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleForceRefresh = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/exchange-rate/refresh', { method: 'POST' });
            const data = await res.json();

            if (data.rate) {
                toast({
                    title: 'রেট আপডেট',
                    description: `নতুন রেট: ৳${data.rate.usdt_to_bdt?.toFixed(2) || data.rate}`,
                });
                fetchData(); // Refresh display
            }
        } catch (err) {
            toast({ title: 'ত্রুটি', description: 'রিফ্রেশ ব্যর্থ', variant: 'destructive' });
        } finally {
            setRefreshing(false);
        }
    };

    const getSourceBadge = (source: string) => {
        const sourceMap: Record<string, { label: string; color: string }> = {
            binance_p2p: { label: 'Binance P2P', color: 'bg-emerald-500/20 text-emerald-400' },
            binance_spot: { label: 'Binance Spot', color: 'bg-blue-500/20 text-blue-400' },
            coingecko: { label: 'CoinGecko', color: 'bg-purple-500/20 text-purple-400' },
            admin_manual: { label: 'Admin Manual', color: 'bg-amber-500/20 text-amber-400' },
            manual: { label: 'Manual', color: 'bg-orange-500/20 text-orange-400' },
            default: { label: 'Default', color: 'bg-slate-500/20 text-slate-400' },
        };
        const s = sourceMap[source] || { label: source, color: 'bg-slate-500/20 text-slate-400' };
        return <Badge className={`${s.color} border-0`}>{s.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentRate = liveRate?.usdt_to_bdt || config.default_usdt_to_bdt;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-emerald-400" />
                        এক্সচেঞ্জ রেট কনফিগ
                    </h1>
                    <p className="text-slate-400 mt-2">USDT/BDT এক্সচেঞ্জ রেট ম্যানেজ করুন</p>
                </div>
                <Button
                    onClick={handleForceRefresh}
                    disabled={refreshing}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    ফোর্স রিফ্রেশ
                </Button>
            </div>

            {/* Current Live Rate Card */}
            <Card className="bg-gradient-to-br from-emerald-900/30 to-slate-900 border-emerald-800/50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">বর্তমান লাইভ রেট</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-bold text-white">৳{currentRate.toFixed(2)}</span>
                                <span className="text-slate-400">/1 USDT</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                {liveRate && getSourceBadge(liveRate.source)}
                                {liveRate?.fetched_at && (
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(liveRate.fetched_at).toLocaleString('bn-BD')}
                                    </span>
                                )}
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-sm">ইনভার্স রেট</p>
                            <p className="text-xl font-semibold text-white">
                                1 BDT = {(1 / currentRate).toFixed(6)} USDT
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Config Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rate Bounds */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Shield className="w-5 h-5 text-blue-500" />
                            রেট বাউন্ড কনফিগ
                        </CardTitle>
                        <CardDescription>এক্সচেঞ্জ রেটের সীমা নির্ধারণ করুন</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm text-slate-300">ডিফল্ট রেট (৳/USDT)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={config.default_usdt_to_bdt}
                                    onChange={(e) => setConfig({ ...config, default_usdt_to_bdt: parseFloat(e.target.value) || 0 })}
                                    className="bg-slate-900 border-slate-700 text-white"
                                />
                                <p className="text-xs text-slate-500">API ব্যর্থ হলে এই রেট ব্যবহার হবে</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-300">সর্বনিম্ন (৳)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={config.min_usdt_to_bdt}
                                        onChange={(e) => setConfig({ ...config, min_usdt_to_bdt: parseFloat(e.target.value) || 0 })}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm text-slate-300">সর্বোচ্চ (৳)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={config.max_usdt_to_bdt}
                                        onChange={(e) => setConfig({ ...config, max_usdt_to_bdt: parseFloat(e.target.value) || 0 })}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                এই সীমার বাইরের রেট প্রত্যাখ্যান করা হবে
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Auto Update & Manual Override */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Activity className="w-5 h-5 text-green-500" />
                            অটো-আপডেট ও ম্যানুয়াল ওভাররাইড
                        </CardTitle>
                        <CardDescription>স্বয়ংক্রিয় আপডেট বা ম্যানুয়াল রেট সেট করুন</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Auto-update toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="space-y-0.5">
                                <Label className="text-base font-bold text-white">অটো-আপডেট</Label>
                                <p className="text-sm text-slate-400">Binance P2P থেকে স্বয়ংক্রিয় রেট আপডেট</p>
                            </div>
                            <Switch
                                checked={config.auto_update_enabled}
                                onCheckedChange={(v) => setConfig({ ...config, auto_update_enabled: v })}
                            />
                        </div>

                        {config.auto_update_enabled && (
                            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Clock className="w-4 h-4" />
                                    <Label className="font-bold">আপডেট ইন্টারভাল (মিনিট)</Label>
                                </div>
                                <Input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={config.update_interval_minutes}
                                    onChange={(e) => setConfig({ ...config, update_interval_minutes: parseInt(e.target.value) || 5 })}
                                    className="bg-slate-900 border-slate-700 text-white w-32"
                                />
                            </div>
                        )}

                        {/* Manual rate override */}
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Settings className="w-4 h-4" />
                                <Label className="font-bold">ম্যানুয়াল রেট সেট করুন</Label>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="যেমন: 119.50"
                                    value={manualRate}
                                    onChange={(e) => setManualRate(e.target.value)}
                                    className="bg-slate-900 border-slate-700 text-white flex-1"
                                />
                                <span className="flex items-center text-slate-400 text-sm">৳/USDT</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                এখানে রেট দিলে সেটি সাথে সাথে লাইভ হবে (24 ঘণ্টা পর্যন্ত)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={saveConfig}
                    disabled={saving}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    সেভ করুন
                </Button>
            </div>

            {/* Rate History */}
            {history.length > 0 && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            রেট হিস্ট্রি (সর্বশেষ ২০টি)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-slate-400 border-b border-slate-800">
                                        <th className="text-left py-2 px-3">সময়</th>
                                        <th className="text-right py-2 px-3">রেট (৳/USDT)</th>
                                        <th className="text-right py-2 px-3">সোর্স</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h, i) => (
                                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                            <td className="py-2 px-3 text-slate-300">
                                                {new Date(h.recorded_at).toLocaleString('bn-BD', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-white">
                                                ৳{Number(h.usdt_to_bdt).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                {getSourceBadge(h.source)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Config Last Updated */}
            {config.last_updated && (
                <p className="text-xs text-slate-500 text-right">
                    কনফিগ সর্বশেষ আপডেট: {new Date(config.last_updated).toLocaleString('bn-BD')}
                </p>
            )}
        </div>
    );
}
