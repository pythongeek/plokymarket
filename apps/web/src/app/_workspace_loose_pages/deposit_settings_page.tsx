'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Settings, Shield, Workflow, Clock, DollarSign, ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import AgentWalletManager from '@/components/admin/AgentWalletManager';

export default function DepositSettingsPage() {
    const [settings, setSettings] = useState({
        // Deposit modes
        auto_deposit_enabled: false,
        manual_agent_processing: true,
        voucher_deposit_enabled: true,
        crypto_deposit_enabled: true,
        p2p_deposit_enabled: true,
        // Withdrawal modes
        auto_withdrawal_enabled: false,
        mfs_withdrawal_enabled: true,
        crypto_withdrawal_enabled: true,
        bank_withdrawal_enabled: true,
        // Limits
        min_deposit_usdt: 5,
        max_deposit_usdt: 10000,
        min_withdrawal_usdt: 5,
        max_withdrawal_usdt: 50000,
        daily_withdrawal_limit_usdt: 50000,
        daily_withdrawal_limit_nonkyc: 10000,
        // Rate
        exchange_rate_override: null as number | null,
        rate_spread_percent: 0,
        // Agent
        agent_processing_time_minutes: 10,
        auto_assign_agents: true,
        // Display
        show_rate_comparison: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase.from('admin_settings').select('value').eq('key', 'deposit_modes').single();
            if (error && error.code !== 'PGRST116') throw error;
            if (data?.value) setSettings(prev => ({ ...prev, ...data.value }));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('admin_settings').upsert(
                { key: 'deposit_modes', value: settings, updated_at: new Date().toISOString() },
                { onConflict: 'key' }
            );
            if (error) throw error;
            toast({ title: 'সাফল', description: 'সেটিংস সেভ হয়েছে' });
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally { setSaving(false); }
    };

    const update = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary" />
                        ডিপোজিট এবং উইথড্রয়াল সেটিংস
                    </h1>
                    <p className="text-slate-500 mt-2">অ্যাডমিন প্যানেল থেকে সব ডিপোজিট/উইথড্রয়াল পদ্ধতি কন্ট্রোল করুন</p>
                </div>
                <button onClick={saveSettings} disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                    সেভ করুন
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Deposit Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                            ডিপোজিট কন্ট্রোল
                        </CardTitle>
                        <CardDescription>ডিপোজিট পদ্ধতি চালু/বন্ধ করুন</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">অটো ডিপোজিট মোড</Label>
                                <p className="text-sm text-slate-500">অটোমেটিকলি ডিপোজিট কনফার্ম করা হবে (শীঘ্র ডেভেলাপমেন্ট)</Label>
                            </div>
                            <Switch checked={settings.auto_deposit_enabled} onCheckedChange={v => update('auto_deposit_enabled', v)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">এজেন্ট ম্যাচ ডিপোজিট</Label>
                                <p className="text-sm text-slate-500">bKash/Nagad এজেন্ট ম্যাচিং চালু করুন</p>
                            </div>
                            <Switch checked={settings.manual_agent_processing} onCheckedChange={v => update('manual_agent_processing', v)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">ভাউচার ডিপোজিট</Label>
                                <p className="text-sm text-slate-500">ভাউচার কোড রিডিম চালু করুন</p>
                            </div>
                            <Switch checked={settings.voucher_deposit_enabled} onCheckedChange={v => update('voucher_deposit_enabled', v)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">ক্রিপ্টো ডিপোজিট</Label>
                                <p className="text-sm text-slate-500">USDT ক্রিপ্টো ডিপোজিট চালু করুন</p>
                            </div>
                            <Switch checked={settings.crypto_deposit_enabled} onCheckedChange={v => update('crypto_deposit_enabled', v)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">P2P ডিপোজিট</Label>
                                <p className="text-sm text-slate-500">P2P এস্ক্রো মার্কেটপ্লেস চালু করুন</p>
                            </div>
                            <Switch checked={settings.p2p_deposit_enabled} onCheckedChange={v => update('p2p_deposit_enabled', v)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Withdrawal Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <ArrowUpRight className="w-5 h-5 text-blue-500" />
                            উইথড্রয়াল কন্ট্রোল
                        </CardTitle>
                        <CardDescription>উইথড্রয়াল পদ্ধতি চালু/বন্ধ করুন</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">অটো উইথড্রয়াল মোড</Label>
                                <p className="text-sm text-slate-500">অটোমেটিক উইথড্রয়াল কনফার্ম (শীঘ্র ডেভেলাপমেন্ট)</Label>
                            </div>
                            <Switch checked={settings.auto_withdrawal_enabled} onCheckedChange={v => update('auto_withdrawal_enabled', v)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">MFS উইথড্রয়াল</Label>
                                <p className="text-sm text-slate-500">bKash/Nagad/Rocket/Upay উইথড্রয়াল চালু করুন</p>
                            </div>
                            <Switch checked={settings.mfs_withdrawal_enabled} onCheckedChange={v => update('mfs_withdrawal_enabled', v)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">ক্রিপ্টো উইথড্রয়াল</Label>
                                <p className="text-sm text-slate-500">USDT ক্রিপ্টো উইথড্রয়াল চালু করুন</p>
                            </div>
                            <Switch checked={settings.crypto_withdrawal_enabled} onCheckedChange={v => update('crypto_withdrawal_enabled', v)} />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">ব্যাঙ্ক উইথড্রয়াল</Label>
                                <p className="text-sm text-slate-500">ব্যাঙ্ক ট্রান্সফার চালু করুন</p>
                            </div>
                            <Switch checked={settings.bank_withdrawal_enabled} onCheckedChange={v => update('bank_withdrawal_enabled', v)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Limits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <DollarSign className="w-5 h-5 text-amber-500" />
                            সীমা এবং লিমিট
                        </CardTitle>
                        <CardDescription>সর্বনিম্ন/সর্বোচ্চ লিমিট সেট করুন</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { key: 'min_deposit_usdt', label: 'সর্বনিম ডিপোজিট (USDT)', icon: ArrowDownLeft },
                            { key: 'max_deposit_usdt', label: 'সর্বোচ্চ ডিপোজিট (USDT)', icon: ArrowDownLeft },
                            { key: 'min_withdrawal_usdt', label: 'সর্বনিম উইথড্রয়াল (USDT)', icon: ArrowUpRight },
                            { key: 'max_withdrawal_usdt', label: 'সর্বোচ্চ উইথড্রয়াল (USDT)', icon: ArrowUpRight },
                            { key: 'daily_withdrawal_limit_usdt', label: 'দৈনিক উইথড্রয়াল KYC (USDT)', icon: Users },
                            { key: 'daily_withdrawal_limit_nonkyc', label: 'দৈনিক উইথড্রয়াল Non-KYC (USDT)', icon: Users },
                        ].map(field => (
                            <div key={field.key} className="flex items-center gap-3">
                                <field.icon className="h-4 w-4 text-slate-400 shrink-0" />
                                <div className="flex-1">
                                    <Label className="text-sm font-medium">{field.label}</Label>
                                </div>
                                <Input type="number" value={String((settings as any)[field.key])}
                                    onChange={e => update(field.key, parseFloat(e.target.value) || 0)}
                                    className="w-28 text-right h-9" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Rate & Agent */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <Workflow className="w-5 h-5 text-purple-500" />
                            রেট এবং এজেন্ট সেটিং
                        </CardTitle>
                        <CardDescription>এক্সচেঞ্জ রেট ও এজেন্ট সেটিংস</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">রেট ওভাররাইড (অপশন)</Label>
                                <p className="text-xs text-slate-400">খালি থাকলে স্বয়ংক্রিয়াভাবে রেট কাজ করবে</p>
                            </div>
                            <Input type="number" step="0.01" value={settings.exchange_rate_override || ''}
                                onChange={e => update('exchange_rate_override', e.target.value ? parseFloat(e.target.value) : null)}
                                placeholder="119.50" className="w-28 text-right h-9" />
                        </div>
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">রেট স্প্রেড (%)</Label>
                                <p className="text-xs text-slate-400">প্লাটফরমের লাভ</p>
                            </div>
                            <Input type="number" step="0.01" value={String(settings.rate_spread_percent)}
                                onChange={e => update('rate_spread_percent', parseFloat(e.target.value) || 0)}
                                className="w-28 text-right h-9" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <Label className="text-base font-bold text-gray-900">অটো এজেন্ট বাছাই</Label>
                                <p className="text-sm text-slate-500">এজেন্ট অটো-রোটেশন চালু করুন</p>
                            </div>
                            <Switch checked={settings.auto_assign_agents} onCheckedChange={v => update('auto_assign_agents', v)} />
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                            <div className="flex-1">
                                <Label className="text-sm font-medium">এজেন্ট প্রসেসিং টাইম (মিনিট)</Label>
                            </div>
                            <Input type="number" value={String(settings.agent_processing_time_minutes)}
                                onChange={e => update('agent_processing_time_minutes', parseInt(e.target.value) || 10)}
                                className="w-28 text-right h-9" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AgentWalletManager />
        </div>
    );
}
