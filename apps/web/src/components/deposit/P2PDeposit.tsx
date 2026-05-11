'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowLeftRight, User, Clock, ShieldCheck, AlertTriangle,
    MessageCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface Offer {
    id: string;
    seller_name: string;
    crypto_amount_usdt: number;
    price_per_usdt_bdt: number;
    total_bdt: number;
    payment_methods: string[];
    min_trade_usdt: number;
    max_trade_usdt: number;
    terms: string | null;
    created_at: string;
}

export default function P2PDeposit() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [tradeAmount, setTradeAmount] = useState('');
    const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
    const [trading, setTrading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({
        crypto_amount_usdt: '', price_per_usdt_bdt: '', min_trade_usdt: '5',
        max_trade_usdt: '', terms: '', payment_methods: ['bKash'],
    });
    const [creating, setCreating] = useState(false);
    const supabase = createClient();

    useEffect(() => { fetchOffers(); }, []);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/p2p/offers?status=active&limit=50');
            const json = await res.json();
            if (json.success) setOffers(json.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const initiateTrade = async (offerId: string) => {
        if (!tradeAmount) return;
        setTrading(true);
        setResult(null);
        try {
            const res = await fetch('/api/p2p/trades/initiate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ offer_id: offerId, amount_usdt: parseFloat(tradeAmount) }),
            });
            const json = await res.json();
            setResult(json);
            if (json.success) { setTradeAmount(''); setSelectedOffer(null); }
        } catch (e: any) { setResult({ success: false, error: e.message }); }
        setTrading(false);
    };

    const createOffer = async () => {
        if (!createForm.crypto_amount_usdt || !createForm.price_per_usdt_bdt) return;
        setCreating(true);
        try {
            const res = await fetch('/api/p2p/offers', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crypto_amount_usdt: parseFloat(createForm.crypto_amount_usdt),
                    price_per_usdt_bdt: parseFloat(createForm.price_per_usdt_bdt),
                    payment_methods: createForm.payment_methods,
                    min_trade_usdt: parseFloat(createForm.min_trade_usdt) || 5,
                    max_trade_usdt: parseFloat(createForm.max_trade_usdt) || undefined,
                    terms: createForm.terms || undefined,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setShowCreate(false);
                setCreateForm({ crypto_amount_usdt: '', price_per_usdt_bdt: '', min_trade_usdt: '5', max_trade_usdt: '', terms: '', payment_methods: ['bKash'] });
                fetchOffers();
            }
            setResult(json);
        } catch (e: any) { setResult({ success: false, error: e.message }); }
        setCreating(false);
    };

    return (
        <div className="space-y-5">
            {/* Create Offer Toggle */}
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreate(!showCreate)} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
                    {showCreate ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    নতুন সেল অফার দিন
                </Button>
                <Button variant="ghost" onClick={fetchOffers} className="text-slate-400">
                    রিফ্রেশ
                </Button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
                    <h4 className="font-semibold text-white">সেল অফার তৈরি করুন</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="USDT পরিমাণ" value={createForm.crypto_amount_usdt} onChange={e => setCreateForm({ ...createForm, crypto_amount_usdt: e.target.value })} className="bg-slate-950 border-slate-800" />
                        <Input placeholder="প্রতি USDT দাম (টাকায়)" value={createForm.price_per_usdt_bdt} onChange={e => setCreateForm({ ...createForm, price_per_usdt_bdt: e.target.value })} className="bg-slate-950 border-slate-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="নূন্নতম ট্রেড" value={createForm.min_trade_usdt} onChange={e => setCreateForm({ ...createForm, min_trade_usdt: e.target.value })} className="bg-slate-950 border-slate-800" />
                        <Input placeholder="সর্বাধিক ট্রেড" value={createForm.max_trade_usdt} onChange={e => setCreateForm({ ...createForm, max_trade_usdt: e.target.value })} className="bg-slate-950 border-slate-800" />
                    </div>
                    <Input placeholder="শর্ত (থাকলে ডিসে রাখুন)" value={createForm.terms} onChange={e => setCreateForm({ ...createForm, terms: e.target.value })} className="bg-slate-950 border-slate-800" />
                    <Button onClick={createOffer} disabled={creating} className="w-full bg-purple-600 hover:bg-purple-500">
                        {creating ? 'তৈরি হচ্ছে...' : 'অফার পোস্ট করুন'}
                    </Button>
                </motion.div>
            )}

            {/* Offers List */}
            {loading ? (
                <div className="text-center py-8 text-slate-500">লোড হচ্ছে...</div>
            ) : offers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                    কোনো সক্রিয় সেল অফার নেই। আপনি প্রথম অফার দিতে পারেন।
                </div>
            ) : (
                <div className="space-y-3">
                    {offers.map(offer => {
                        const isSelected = selectedOffer === offer.id;
                        const totalBdt = (parseFloat(tradeAmount) || 0) * offer.price_per_usdt_bdt;
                        return (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white text-sm">{offer.seller_name || 'বিক্রেতা'}</p>
                                            <p className="text-xs text-slate-500">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {new Date(offer.created_at).toLocaleDateString('bn-BD')}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                                        স্টোক: {offer.crypto_amount_usdt} USDT
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-b border-slate-800">
                                    <div>
                                        <p className="text-xs text-slate-500">দাম</p>
                                        <p className="text-sm font-bold text-white">ৣ{(offer.price_per_usdt_bdt).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">নূন্নতম</p>
                                        <p className="text-sm font-bold text-white">{offer.min_trade_usdt} USDT</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">পেমেন্ট</p>
                                        <p className="text-sm font-bold text-emerald-400">{offer.payment_methods.join(', ')}</p>
                                    </div>
                                </div>

                                {offer.terms && <p className="text-xs text-slate-400">শর্ত: {offer.terms}</p>}

                                <button
                                    onClick={() => setSelectedOffer(isSelected ? null : offer.id)}
                                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-white transition-colors"
                                >
                                    {isSelected ? 'বন্ধ করুন' : 'ট্রেড করুন'}
                                </button>

                                {isSelected && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2">
                                        <Input
                                            placeholder={`USDT পরিমাণ (${offer.min_trade_usdt} - ${offer.max_trade_usdt || offer.crypto_amount_usdt})`}
                                            value={tradeAmount}
                                            onChange={e => setTradeAmount(e.target.value)}
                                            className="bg-slate-950 border-slate-800"
                                        />
                                        {tradeAmount && (
                                            <p className="text-sm text-slate-400">
                                                মোট দাম: <span className="text-white font-bold">ৣ{totalBdt.toFixed(2)}</span>
                                            </p>
                                        )}
                                        <Button
                                            onClick={() => initiateTrade(offer.id)}
                                            disabled={trading || !tradeAmount}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500"
                                        >
                                            <ShieldCheck className="w-4 h-4 mr-2" />
                                            {trading ? 'প্রক্রিয়া হচ্ছে...' : 'এসক্রোয়ে ট্রেড শুরু করুন'}
                                        </Button>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {result && (
                <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {result.message || result.error}
                </div>
            )}
        </div>
    );
}
