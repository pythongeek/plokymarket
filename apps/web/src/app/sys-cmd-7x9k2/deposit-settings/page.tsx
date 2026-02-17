'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Settings, Shield, Workflow, Clock } from 'lucide-react';
import AgentWalletManager from '@/components/admin/AgentWalletManager';

export default function DepositSettingsPage() {
    const [settings, setSettings] = useState({
        binance_p2p_scrape: true,
        manual_agent_processing: true,
        show_rate_comparison: true,
        agent_processing_time_minutes: 10
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'deposit_modes')
                .single();

            if (error) throw error;
            if (data) setSettings(data.value);
        } catch (err) {
            console.error('Error fetching settings:', err);
            toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            const { error } = await supabase
                .from('admin_settings')
                .update({ value: newSettings })
                .eq('key', 'deposit_modes');

            if (error) throw error;
            toast({ title: 'Success', description: 'Settings updated' });
        } catch (err) {
            console.error('Error updating settings:', err);
            toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
            // Revert local state on failure
            fetchSettings();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-8 h-8 text-primary" />
                    ডিপোজিট মোড সেটিংস
                </h1>
                <p className="text-slate-400 mt-2">Manage how users deposit funds into their wallets</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Workflow className="w-5 h-5 text-blue-500" />
                            অটোমেশন ও স্ক্রেপিং
                        </CardTitle>
                        <CardDescription>Configure automated Binance P2P discovery</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="space-y-0.5">
                                <Label className="text-base font-bold text-white">বাইন্যান্স P2P স্ক্রেপিং</Label>
                                <p className="text-sm text-slate-400">ইউজারদের লাইভ সেলার তালিকা দেখান</p>
                            </div>
                            <Switch
                                checked={settings.binance_p2p_scrape}
                                onCheckedChange={(v) => updateSetting('binance_p2p_scrape', v)}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="space-y-0.5">
                                <Label className="text-base font-bold text-white">রেট কম্পারিজন</Label>
                                <p className="text-sm text-slate-400">অটোমেটেড বনাম ম্যানুয়াল রেট তুলনা দেখান</p>
                            </div>
                            <Switch
                                checked={settings.show_rate_comparison}
                                onCheckedChange={(v) => updateSetting('show_rate_comparison', v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Shield className="w-5 h-5 text-green-500" />
                            ম্যানুয়াল এজেন্ট প্রসেসিং
                        </CardTitle>
                        <CardDescription>Configure direct agent payment processing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="space-y-0.5">
                                <Label className="text-base font-bold text-white">ম্যানুয়াল এজেন্ট মোড</Label>
                                <p className="text-sm text-slate-400">ইউজার সরাসরি আমাদের এজেন্টকে পেমেন্ট করবে</p>
                            </div>
                            <Switch
                                checked={settings.manual_agent_processing}
                                onCheckedChange={(v) => updateSetting('manual_agent_processing', v)}
                            />
                        </div>

                        {settings.manual_agent_processing && (
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-3">
                                <div className="flex items-center gap-2 text-yellow-500">
                                    <Clock className="w-4 h-4" />
                                    <Label className="font-bold">প্রসেসিং টাইম (মিনিট)</Label>
                                </div>
                                <Input
                                    type="number"
                                    value={settings.agent_processing_time_minutes}
                                    onChange={(e) => updateSetting('agent_processing_time_minutes', parseInt(e.target.value))}
                                    className="bg-slate-950 border-slate-800 text-white w-32"
                                />
                                <p className="text-xs text-slate-400">
                                    এই সময়ের মধ্যে এজেন্টকে USDT কিনে পাঠাতে হবে (টাইমার হিসেবে কাজ করবে)
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AgentWalletManager />
        </div>
    );
}
