'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    DollarSign, Link2, Coins, Shield, FileCode,
    Save, Loader2, AlertTriangle, CheckCircle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface MarketFields {
    id: string;
    title?: string;
    status?: string;
    initial_liquidity?: number;
    volume?: number;
    condition_id?: string;
    token1?: string;
    token2?: string;
    neg_risk?: boolean;
    resolver_reference?: string;
}

interface MarketFieldsPanelProps {
    market: MarketFields;
    onSaved?: (updated: MarketFields) => void;
}

export function MarketFieldsPanel({ market, onSaved }: MarketFieldsPanelProps) {
    const [financial, setFinancial] = useState({
        initial_liquidity: market.initial_liquidity ?? 0,
        volume: market.volume ?? 0,
    });

    const [blockchain, setBlockchain] = useState({
        condition_id: market.condition_id ?? '',
        token1: market.token1 ?? '',
        token2: market.token2 ?? '',
        neg_risk: market.neg_risk ?? false,
        resolver_reference: market.resolver_reference ?? '',
    });

    const [savingFinancial, setSavingFinancial] = useState(false);
    const [savingBlockchain, setSavingBlockchain] = useState(false);
    const [resolvers, setResolvers] = useState<any[]>([]);

    useEffect(() => {
        const fetchResolvers = async () => {
            const { data } = await createClient()
                .from('resolvers')
                .select('*')
                .eq('is_active', true)
                .order('success_count', { ascending: false });
            if (data) setResolvers(data);
        };
        fetchResolvers();
    }, []);

    const saveFinancial = async () => {
        setSavingFinancial(true);
        try {
            const res = await fetch(`/api/admin/markets/${market.id}/fields`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    initial_liquidity: financial.initial_liquidity,
                    volume: financial.volume,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            toast({ title: '✅ সংরক্ষিত', description: 'আর্থিক ফিল্ড আপডেট হয়েছে' });
            onSaved?.({ ...market, ...data.market });
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally {
            setSavingFinancial(false);
        }
    };

    const saveBlockchain = async () => {
        setSavingBlockchain(true);
        try {
            const res = await fetch(`/api/admin/markets/${market.id}/fields`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blockchain),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            toast({ title: '✅ সংরক্ষিত', description: 'ব্লকচেইন ফিল্ড আপডেট হয়েছে' });
            onSaved?.({ ...market, ...data.market });
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally {
            setSavingBlockchain(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Market header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="flex-1">
                    <p className="text-sm font-medium text-white truncate">{market.title || 'মার্কেট'}</p>
                    <p className="text-xs text-slate-500 font-mono">{market.id.slice(0, 16)}...</p>
                </div>
                <Badge className={cn(
                    'text-xs',
                    market.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        market.status === 'resolved' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-slate-700 text-slate-300'
                )}>
                    {market.status || 'unknown'}
                </Badge>
            </div>

            <Tabs defaultValue="financial">
                <TabsList className="bg-slate-900 border border-slate-800 w-full">
                    <TabsTrigger value="financial" className="flex-1 data-[state=active]:bg-slate-800">
                        <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                        আর্থিক
                    </TabsTrigger>
                    <TabsTrigger value="blockchain" className="flex-1 data-[state=active]:bg-slate-800">
                        <Link2 className="w-3.5 h-3.5 mr-1.5" />
                        ব্লকচেইন
                    </TabsTrigger>
                </TabsList>

                {/* ─── Financial Tab ─── */}
                <TabsContent value="financial" className="space-y-4 pt-4">
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-300">
                            <strong>initial_liquidity</strong> পরিবর্তন AMM মূল্য বক্ররেখাকে প্রভাবিত করে।
                            <strong> volume</strong> ম্যানুয়াল ওভাররাইড শুধুমাত্র সিডিং-এর জন্য।
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Initial Liquidity */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-sm flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                                Initial Liquidity (USDT)
                            </Label>
                            <p className="text-xs text-slate-500">
                                AMM সীড ফান্ডিং। বেশি লিকুইডিটি = কম স্লিপেজ।
                                <span className="text-emerald-400 ml-1">&gt;$10,000 = 4.2× বেশি ভলিউম</span>
                            </p>
                            <Input
                                type="number"
                                min={0}
                                step={100}
                                value={financial.initial_liquidity}
                                onChange={e => setFinancial(f => ({ ...f, initial_liquidity: parseFloat(e.target.value) || 0 }))}
                                className="bg-slate-900 border-slate-700 text-white font-mono"
                                placeholder="1000"
                            />
                        </div>

                        {/* Volume Override */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-sm flex items-center gap-2">
                                <Coins className="w-3.5 h-3.5 text-blue-400" />
                                Volume Override (USDT)
                            </Label>
                            <p className="text-xs text-slate-500">
                                সাধারণত ট্রেড ট্রিগার থেকে স্বয়ংক্রিয়ভাবে আপডেট হয়। শুধুমাত্র সিডিং-এর জন্য ম্যানুয়ালি সেট করুন।
                            </p>
                            <Input
                                type="number"
                                min={0}
                                step={10}
                                value={financial.volume}
                                onChange={e => setFinancial(f => ({ ...f, volume: parseFloat(e.target.value) || 0 }))}
                                className="bg-slate-900 border-slate-700 text-white font-mono"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={saveFinancial}
                        disabled={savingFinancial}
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                        {savingFinancial ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        আর্থিক ফিল্ড সংরক্ষণ করুন
                    </Button>
                </TabsContent>

                {/* ─── Blockchain Tab ─── */}
                <TabsContent value="blockchain" className="space-y-4 pt-4">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-2">
                        <FileCode className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-300">
                            এই ফিল্ডগুলি অন-চেইন সেটলমেন্ট এবং CTF ফ্রেমওয়ার্কের সাথে সংযোগের জন্য।
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Condition ID */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-sm">Condition ID</Label>
                            <p className="text-xs text-slate-500">CTF ফ্রেমওয়ার্ক আইডেন্টিফায়ার (0x-prefixed)</p>
                            <Input
                                value={blockchain.condition_id}
                                onChange={e => setBlockchain(b => ({ ...b, condition_id: e.target.value }))}
                                className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                                placeholder="0xabc123..."
                            />
                        </div>

                        {/* Token1 */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-sm flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">YES</span>
                                Token 1 Address
                            </Label>
                            <Input
                                value={blockchain.token1}
                                onChange={e => setBlockchain(b => ({ ...b, token1: e.target.value }))}
                                className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                                placeholder="0xdef456..."
                            />
                        </div>

                        {/* Token2 */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-sm flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400">NO</span>
                                Token 2 Address
                            </Label>
                            <Input
                                value={blockchain.token2}
                                onChange={e => setBlockchain(b => ({ ...b, token2: e.target.value }))}
                                className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                                placeholder="0xghi789..."
                            />
                        </div>

                        {/* Resolver Reference */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300 text-sm flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-purple-400" />
                                Resolver Reference
                            </Label>
                            <p className="text-xs text-slate-500">নিবন্ধিত রেজোলিউশন অথরিটি নির্বাচন করুন</p>

                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {resolvers.length > 0 ? (
                                    resolvers.map((resolver) => {
                                        const isSelected = blockchain.resolver_reference === resolver.address;
                                        const total = resolver.success_count + resolver.dispute_count;
                                        const successRate = total === 0 ? 0 : (resolver.success_count / total) * 100;
                                        const trusted = successRate >= 95 && (resolver.dispute_count / total) * 100 <= 2;

                                        return (
                                            <button
                                                key={resolver.address}
                                                onClick={() => setBlockchain(b => ({ ...b, resolver_reference: resolver.address }))}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                                                    isSelected
                                                        ? "border-purple-500 bg-purple-500/10 text-purple-300"
                                                        : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                                                )}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold truncate">{resolver.name}</span>
                                                        {trusted && (
                                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] py-0 px-1">
                                                                ট্রাস্টেড
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] opacity-50 truncate">{resolver.address}</p>
                                                </div>
                                                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-purple-500 shrink-0 ml-2" />}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <Input
                                        value={blockchain.resolver_reference}
                                        onChange={e => setBlockchain(b => ({ ...b, resolver_reference: e.target.value }))}
                                        className="bg-slate-900 border-slate-700 text-white font-mono text-xs"
                                        placeholder="0xabc123..."
                                    />
                                )}
                            </div>
                        </div>

                        {/* Neg Risk Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div>
                                <Label className="text-slate-300 text-sm">Negative Risk</Label>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    সংশ্লিষ্ট মার্কেটগুলি কল্যাটারাল পুল ভাগ করে
                                </p>
                            </div>
                            <button
                                onClick={() => setBlockchain(b => ({ ...b, neg_risk: !b.neg_risk }))}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium',
                                    blockchain.neg_risk
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                )}
                            >
                                {blockchain.neg_risk ? (
                                    <><ToggleRight className="w-4 h-4" /> সক্রিয়</>
                                ) : (
                                    <><ToggleLeft className="w-4 h-4" /> নিষ্ক্রিয়</>
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        onClick={saveBlockchain}
                        disabled={savingBlockchain}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {savingBlockchain ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        ব্লকচেইন ফিল্ড সংরক্ষণ করুন
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
