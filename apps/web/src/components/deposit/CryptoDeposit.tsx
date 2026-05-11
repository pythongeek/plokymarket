'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Diamond, Copy, CheckCircle, AlertTriangle, ExternalLink,
    Send, Wallet, ChevronDown, ChevronUp
} from 'lucide-react';

const NETWORKS = [
    { id: 'bep20', name: 'BEP-20 (BSC)', fee: 0.05, time: '3 sec', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { id: 'trc20', name: 'TRC-20 (Tron)', fee: 0.01, time: '3 sec', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { id: 'ton', name: 'TON', fee: 0.005, time: '6 sec', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { id: 'erc20', name: 'ERC-20 (Ethereum)', fee: 2.50, time: '12 sec', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
];

export default function CryptoDeposit() {
    const [network, setNetwork] = useState('bep20');
    const [addressData, setAddressData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [showSubmit, setShowSubmit] = useState(false);
    const [txnHash, setTxnHash] = useState('');
    const [amountUSDT, setAmountUSDT] = useState('');
    const [fromAddress, setFromAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const fetchAddress = async (net: string) => {
        setLoading(true);
        setAddressData(null);
        try {
            const res = await fetch(`/api/wallet/deposit/crypto/address?network=${net}`);
            const json = await res.json();
            if (json.success) setAddressData(json);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const submitTxn = async () => {
        if (!txnHash.trim()) return;
        setSubmitting(true);
        setResult(null);
        try {
            const res = await fetch('/api/wallet/deposit/crypto/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    network,
                    txn_hash: txnHash,
                    amount_usdt: parseFloat(amountUSDT) || undefined,
                    from_address: fromAddress || undefined,
                }),
            });
            const json = await res.json();
            setResult(json);
            if (json.success) {
                setTxnHash('');
                setAmountUSDT('');
                setFromAddress('');
            }
        } catch (e: any) {
            setResult({ success: false, error: e.message });
        }
        setSubmitting(false);
    };

    const netInfo = NETWORKS.find(n => n.id === network);

    return (
        <div className="space-y-5">
            {/* Network Selector */}
            <div className="grid grid-cols-2 gap-3">
                {NETWORKS.map(n => (
                    <button
                        key={n.id}
                        onClick={() => { setNetwork(n.id); fetchAddress(n.id); setAddressData(null); }}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                            network === n.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                    >
                        <p className="font-bold text-white text-sm">{n.name}</p>
                        <p className="text-xs text-slate-400 mt-1">ফি: ${n.fee} • {n.time}</p>
                    </button>
                ))}
            </div>

            {/* Get Address */}
            {!addressData ? (
                <Button onClick={() => fetchAddress(network)} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500">
                    <Wallet className="w-4 h-4 mr-2" />
                    {loading ? 'লোড হচ্ছে...' : 'ডিপোজিট এড্রেস দেখুন'}
                </Button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    {/* Address Card */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Badge className={netInfo?.color}>
                                <Diamond className="w-3 h-3 mr-1" />
                                {netInfo?.name}
                            </Badge>
                            <span className="text-xs text-slate-500">মেমো সহ পাঠান</span>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">প্লাটফর্ম এড্রেস</label>
                            <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-3 py-2 border border-slate-800">
                                <code className="text-sm text-blue-400 font-mono break-all flex-1">{addressData.address}</code>
                                <button onClick={() => copy(addressData.address, 'addr')} className="text-slate-500 hover:text-white shrink-0">
                                    {copied === 'addr' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">মেমো (Memo) — অবশ্যী পাঠান</label>
                            <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-3 py-2 border border-amber-500/30">
                                <code className="text-sm text-amber-400 font-mono flex-1">{addressData.memo}</code>
                                <button onClick={() => copy(addressData.memo, 'memo')} className="text-slate-500 hover:text-white shrink-0">
                                    {copied === 'memo' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-amber-500/70 mt-1">সাবধান! এই মেমো সহ না পাঠালে ডিপোজিট শনাক্ত হয়ে যাবে</p>
                        </div>

                        <div className="flex gap-3 text-xs text-slate-400">
                            <span>ফি: ${addressData.fee_usdt} USDT</span>
                            <span>কনফার্ম: {addressData.confirmation_blocks} ব্লক</span>
                        </div>

                        <p className="text-xs text-slate-500">{addressData.instructions}</p>
                    </div>

                    {/* Submit TXN */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
                        <button
                            onClick={() => setShowSubmit(!showSubmit)}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <span className="font-semibold text-white flex items-center gap-2">
                                <Send className="w-4 h-4 text-emerald-400" />
                                ট্রানজাকশ঩ হ্যাশ সাবমিট করুন
                            </span>
                            {showSubmit ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        {showSubmit && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                                <Input
                                    placeholder="TXN Hash (ডিবিতি পূর্বে হেশ) *"
                                    value={txnHash}
                                    onChange={e => setTxnHash(e.target.value)}
                                    className="bg-slate-950 border-slate-800"
                                />
                                <Input
                                    placeholder="USDT পরিমাণ (থাকলে ডিসে রাখুন)"
                                    value={amountUSDT}
                                    onChange={e => setAmountUSDT(e.target.value)}
                                    className="bg-slate-950 border-slate-800"
                                />
                                <Input
                                    placeholder="পাঠানোর সোর্স এড্রেস (থাকলে ডিসে রাখুন)"
                                    value={fromAddress}
                                    onChange={e => setFromAddress(e.target.value)}
                                    className="bg-slate-950 border-slate-800"
                                />
                                <Button onClick={submitTxn} disabled={submitting || !txnHash.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500">
                                    {submitting ? 'সাবমিশন হচ্ছে...' : 'সাবমিশন করুন'}
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {result && (
                        <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {result.message || result.error}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
