'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Smartphone, Send, CheckCircle, AlertCircle,
    Copy, Loader2, RefreshCw, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type MFSProvider = 'bkash' | 'nagad' | 'rocket';

interface PlatformWallet {
    method: string;
    wallet_number: string;
    wallet_name: string;
    instructions: string;
}

const MFS_LABELS: Record<MFSProvider, { name: string; color: string; bg: string; emoji: string }> = {
    bkash: { name: 'bKash', color: 'text-pink-400', bg: 'bg-pink-500/20 border-pink-500/30', emoji: '🌸' },
    nagad: { name: 'Nagad', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', emoji: '🟠' },
    rocket: { name: 'Rocket', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30', emoji: '🚀' },
};

export function MFSDepositForm() {
    const [provider, setProvider] = useState<MFSProvider>('bkash');
    const [platformWallet, setPlatformWallet] = useState<PlatformWallet | null>(null);
    const [form, setForm] = useState({
        bdt_amount: '',
        sender_number: '',
        txn_id: '',
        sender_name: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(120);
    const supabase = createClient();

    useEffect(() => {
        fetchWallet();
        fetchRate();
    }, [provider]);

    const fetchWallet = async () => {
        const { data } = await supabase
            .from('platform_wallets')
            .select('*')
            .eq('method', provider)
            .eq('is_active', true)
            .single();
        setPlatformWallet(data);
    };

    const fetchRate = async () => {
        try {
            const res = await fetch('/api/exchange-rate/current');
            const data = await res.json();
            if (data.rate?.usdt_to_bdt) setExchangeRate(data.rate.usdt_to_bdt);
        } catch { }
    };

    const usdtAmount = form.bdt_amount
        ? (parseFloat(form.bdt_amount) / exchangeRate).toFixed(2)
        : '0.00';

    const copyNumber = () => {
        if (platformWallet?.wallet_number) {
            navigator.clipboard.writeText(platformWallet.wallet_number);
            toast({ title: 'কপি হয়েছে!', description: platformWallet.wallet_number });
        }
    };

    const handleSubmit = async () => {
        if (!form.bdt_amount || !form.sender_number || !form.txn_id) {
            toast({ title: 'ত্রুটি', description: 'সব তথ্য পূরণ করুন', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/wallet/deposit/mfs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_method: provider,
                    bdt_amount: parseFloat(form.bdt_amount),
                    usdt_amount: parseFloat(usdtAmount),
                    sender_number: form.sender_number,
                    sender_name: form.sender_name,
                    txn_id: form.txn_id,
                    exchange_rate: exchangeRate,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            setSubmitted(true);
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-4"
            >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">রিকোয়েস্ট জমা হয়েছে!</h3>
                <p className="text-slate-400 text-sm">
                    আপনার ডিপোজিট রিকোয়েস্ট পর্যালোচনার জন্য পাঠানো হয়েছে।
                    সাধারণত ২-৬ ঘণ্টার মধ্যে অনুমোদন হয়।
                </p>
                <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ bdt_amount: '', sender_number: '', txn_id: '', sender_name: '' }); }}>
                    নতুন রিকোয়েস্ট করুন
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Provider Selection */}
            <div className="space-y-2">
                <Label className="text-slate-300">পেমেন্ট মেথড নির্বাচন করুন</Label>
                <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(MFS_LABELS) as MFSProvider[]).map(p => {
                        const info = MFS_LABELS[p];
                        return (
                            <button
                                key={p}
                                onClick={() => setProvider(p)}
                                className={cn(
                                    'p-3 rounded-xl border text-center transition-all',
                                    provider === p ? info.bg + ' border-opacity-100' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                )}
                            >
                                <span className="text-xl block">{info.emoji}</span>
                                <span className={cn('text-sm font-bold mt-1 block', provider === p ? info.color : 'text-slate-400')}>
                                    {info.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Platform Wallet Number */}
            {platformWallet && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        এই নম্বরে {MFS_LABELS[provider].name} Send Money করুন
                    </p>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-2xl font-bold text-white font-mono tracking-wider">
                                {platformWallet.wallet_number}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{platformWallet.wallet_name}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={copyNumber} className="border-slate-700">
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            কপি
                        </Button>
                    </div>
                    {platformWallet.instructions && (
                        <div className="flex gap-2 mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-300">{platformWallet.instructions}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Exchange Rate */}
            <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">বর্তমান রেট</span>
                <span className="text-white font-medium">১ USDT = {exchangeRate.toFixed(2)} BDT</span>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">পরিমাণ (BDT) *</Label>
                    <Input
                        type="number"
                        min={100}
                        value={form.bdt_amount}
                        onChange={e => setForm(f => ({ ...f, bdt_amount: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="যেমন: 1200"
                    />
                    {form.bdt_amount && (
                        <p className="text-xs text-emerald-400">≈ {usdtAmount} USDT আপনার ওয়ালেটে যোগ হবে</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">আপনার {MFS_LABELS[provider].name} নম্বর *</Label>
                    <Input
                        type="tel"
                        value={form.sender_number}
                        onChange={e => setForm(f => ({ ...f, sender_number: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="01XXXXXXXXX"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">ট্রানজেকশন ID *</Label>
                    <Input
                        value={form.txn_id}
                        onChange={e => setForm(f => ({ ...f, txn_id: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white font-mono"
                        placeholder="TXN ID / Reference Number"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">আপনার নাম (ঐচ্ছিক)</Label>
                    <Input
                        value={form.sender_name}
                        onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder="আপনার পূর্ণ নাম"
                    />
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700"
            >
                {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Send className="w-4 h-4 mr-2" />
                )}
                ডিপোজিট রিকোয়েস্ট জমা দিন
            </Button>
        </div>
    );
}
