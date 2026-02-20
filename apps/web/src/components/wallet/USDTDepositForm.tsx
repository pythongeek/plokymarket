'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet, Copy, Send, CheckCircle, Loader2, Info, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type USDTNetwork = 'usdt_trc20' | 'usdt_erc20' | 'usdt_bep20';

const NETWORK_LABELS: Record<USDTNetwork, { name: string; color: string; minAmount: number }> = {
    usdt_trc20: { name: 'TRC20 (TRON)', color: 'text-red-400', minAmount: 10 },
    usdt_erc20: { name: 'ERC20 (Ethereum)', color: 'text-blue-400', minAmount: 20 },
    usdt_bep20: { name: 'BEP20 (BSC)', color: 'text-yellow-400', minAmount: 10 },
};

interface PlatformWallet {
    method: string;
    wallet_number: string;
    wallet_name: string;
    instructions: string;
}

export function USDTDepositForm() {
    const [network, setNetwork] = useState<USDTNetwork>('usdt_trc20');
    const [platformWallet, setPlatformWallet] = useState<PlatformWallet | null>(null);
    const [form, setForm] = useState({ usdt_amount: '', txn_hash: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchWallet();
    }, [network]);

    const fetchWallet = async () => {
        const { data } = await supabase
            .from('platform_wallets')
            .select('*')
            .eq('method', network)
            .eq('is_active', true)
            .single();
        setPlatformWallet(data);
    };

    const copyAddress = () => {
        if (platformWallet?.wallet_number) {
            navigator.clipboard.writeText(platformWallet.wallet_number);
            toast({ title: 'ঠিকানা কপি হয়েছে!' });
        }
    };

    const handleSubmit = async () => {
        const amount = parseFloat(form.usdt_amount);
        const minAmount = NETWORK_LABELS[network].minAmount;
        if (!amount || amount < minAmount) {
            toast({ title: 'ত্রুটি', description: `সর্বনিম্ন ${minAmount} USDT`, variant: 'destructive' });
            return;
        }
        if (!form.txn_hash) {
            toast({ title: 'ত্রুটি', description: 'ট্রানজেকশন হ্যাশ দিন', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/wallet/deposit/usdt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_method: network,
                    usdt_amount: amount,
                    txn_id: form.txn_hash,
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
                    ব্লকচেইন কনফার্মেশনের পর অ্যাডমিন ভেরিফাই করবেন।
                    সাধারণত ১-৩ ঘণ্টার মধ্যে সম্পন্ন হয়।
                </p>
                <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ usdt_amount: '', txn_hash: '' }); }}>
                    নতুন রিকোয়েস্ট করুন
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Network Selection */}
            <div className="space-y-2">
                <Label className="text-slate-300">নেটওয়ার্ক নির্বাচন করুন</Label>
                <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(NETWORK_LABELS) as USDTNetwork[]).map(n => {
                        const info = NETWORK_LABELS[n];
                        return (
                            <button
                                key={n}
                                onClick={() => setNetwork(n)}
                                className={cn(
                                    'p-2.5 rounded-xl border text-center transition-all',
                                    network === n
                                        ? 'bg-slate-800 border-primary/50'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                )}
                            >
                                <Wallet className={cn('w-4 h-4 mx-auto mb-1', network === n ? info.color : 'text-slate-500')} />
                                <span className={cn('text-xs font-medium', network === n ? 'text-white' : 'text-slate-500')}>
                                    {n === 'usdt_trc20' ? 'TRC20' : n === 'usdt_erc20' ? 'ERC20' : 'BEP20'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Warning */}
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-2">
                <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">
                    শুধুমাত্র <strong>{NETWORK_LABELS[network].name}</strong> নেটওয়ার্কে পাঠান।
                    ভুল নেটওয়ার্কে পাঠালে ফান্ড হারিয়ে যাবে।
                </p>
            </div>

            {/* Wallet Address */}
            {platformWallet ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                        আমাদের USDT ঠিকানা ({NETWORK_LABELS[network].name})
                    </p>
                    <div className="flex items-start gap-3">
                        <p className="text-sm text-white font-mono break-all flex-1">
                            {platformWallet.wallet_number}
                        </p>
                        <Button size="sm" variant="outline" onClick={copyAddress} className="border-slate-700 shrink-0">
                            <Copy className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    {platformWallet.instructions && (
                        <p className="text-xs text-slate-500">{platformWallet.instructions}</p>
                    )}
                </div>
            ) : (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-sm">
                    এই নেটওয়ার্কের ঠিকানা এখনো সেট করা হয়নি
                </div>
            )}

            {/* Form */}
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">
                        USDT পরিমাণ * (সর্বনিম্ন {NETWORK_LABELS[network].minAmount} USDT)
                    </Label>
                    <Input
                        type="number"
                        min={NETWORK_LABELS[network].minAmount}
                        step={1}
                        value={form.usdt_amount}
                        onChange={e => setForm(f => ({ ...f, usdt_amount: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white"
                        placeholder={`${NETWORK_LABELS[network].minAmount}`}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">ট্রানজেকশন হ্যাশ *</Label>
                    <Input
                        value={form.txn_hash}
                        onChange={e => setForm(f => ({ ...f, txn_hash: e.target.value }))}
                        className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                        placeholder="0x... বা TXN হ্যাশ"
                    />
                    <p className="text-xs text-slate-500">
                        Binance বা যেকোনো এক্সচেঞ্জ থেকে পাঠানোর পর TXN হ্যাশ কপি করুন
                    </p>
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                disabled={submitting || !platformWallet}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
                {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <Send className="w-4 h-4 mr-2" />
                )}
                USDT ডিপোজিট রিকোয়েস্ট জমা দিন
            </Button>
        </div>
    );
}
