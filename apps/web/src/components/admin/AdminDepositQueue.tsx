'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle, XCircle, Clock, Filter, RefreshCw,
    Loader2, User, Hash, DollarSign, Smartphone, Wallet,
    ChevronDown, ChevronUp, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DepositRequest {
    id: string;
    user_id: string;
    payment_method: string;
    bdt_amount: number;
    usdt_amount: number;
    sender_number: string;
    sender_name: string;
    txn_id: string;
    exchange_rate: number;
    status: 'pending' | 'approved' | 'rejected';
    admin_notes: string;
    created_at: string;
    reviewed_at: string;
    user_profiles?: { full_name: string; email: string };
}

const METHOD_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    bkash: { label: 'bKash', color: 'text-pink-400 bg-pink-500/20', icon: '🌸' },
    nagad: { label: 'Nagad', color: 'text-orange-400 bg-orange-500/20', icon: '🟠' },
    rocket: { label: 'Rocket', color: 'text-purple-400 bg-purple-500/20', icon: '🚀' },
    usdt_trc20: { label: 'USDT TRC20', color: 'text-blue-400 bg-blue-500/20', icon: '💎' },
    usdt_erc20: { label: 'USDT ERC20', color: 'text-blue-400 bg-blue-500/20', icon: '💎' },
    usdt_bep20: { label: 'USDT BEP20', color: 'text-yellow-400 bg-yellow-500/20', icon: '💎' },
    agent: { label: 'Agent', color: 'text-slate-400 bg-slate-700', icon: '👤' },
};

function DepositCard({ deposit, onAction }: { deposit: DepositRequest; onAction: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const method = METHOD_LABELS[deposit.payment_method] || { label: deposit.payment_method, color: 'text-slate-400 bg-slate-700', icon: '💰' };

    const handleApprove = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/deposits/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ depositId: deposit.id, adminNotes: notes }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast({ title: '✅ অনুমোদিত', description: `${deposit.usdt_amount} USDT ক্রেডিট করা হয়েছে` });
            onAction();
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!notes) {
            toast({ title: 'কারণ দিন', description: 'প্রত্যাখ্যানের কারণ লিখুন', variant: 'destructive' });
            return;
        }
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/deposits/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ depositId: deposit.id, reason: notes }),
            });
            if (!res.ok) throw new Error(await res.text());
            toast({ title: '❌ প্রত্যাখ্যাত', description: 'ডিপোজিট প্রত্যাখ্যান করা হয়েছে' });
            onAction();
        } catch (err: any) {
            toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'rounded-xl border transition-all',
                deposit.status === 'pending' ? 'bg-slate-900/80 border-amber-500/20' :
                    deposit.status === 'approved' ? 'bg-slate-900/50 border-emerald-500/20' :
                        'bg-slate-900/50 border-red-500/20'
            )}
        >
            {/* Header */}
            <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <span className="text-xl">{method.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('text-xs', method.color)}>{method.label}</Badge>
                        <span className="text-white font-bold">{deposit.usdt_amount?.toFixed(2)} USDT</span>
                        {deposit.bdt_amount && (
                            <span className="text-slate-500 text-xs">≈ ৳{deposit.bdt_amount?.toFixed(0)}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>{deposit.user_profiles?.full_name || deposit.user_id.slice(0, 8)}</span>
                        <span>{format(new Date(deposit.created_at), 'dd MMM, HH:mm')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {deposit.status === 'pending' && (
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            মুলতুবি
                        </Badge>
                    )}
                    {deposit.status === 'approved' && (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            অনুমোদিত
                        </Badge>
                    )}
                    {deposit.status === 'rejected' && (
                        <Badge className="bg-red-500/20 text-red-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            প্রত্যাখ্যাত
                        </Badge>
                    )}
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {deposit.sender_number && (
                                    <div>
                                        <p className="text-slate-500 text-xs">প্রেরকের নম্বর</p>
                                        <p className="text-white font-mono">{deposit.sender_number}</p>
                                    </div>
                                )}
                                {deposit.sender_name && (
                                    <div>
                                        <p className="text-slate-500 text-xs">প্রেরকের নাম</p>
                                        <p className="text-white">{deposit.sender_name}</p>
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <p className="text-slate-500 text-xs">TXN ID / হ্যাশ</p>
                                    <p className="text-white font-mono text-xs break-all">{deposit.txn_id}</p>
                                </div>
                                {deposit.exchange_rate && (
                                    <div>
                                        <p className="text-slate-500 text-xs">রেট</p>
                                        <p className="text-white">৳{deposit.exchange_rate?.toFixed(2)}/USDT</p>
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes */}
                            {deposit.status === 'pending' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        অ্যাডমিন নোট (প্রত্যাখ্যানের ক্ষেত্রে আবশ্যক)
                                    </div>
                                    <Textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="কারণ বা নোট লিখুন..."
                                        className="bg-slate-950 border-slate-700 text-white text-sm resize-none h-20"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleApprove}
                                            disabled={processing}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                            size="sm"
                                        >
                                            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                                            অনুমোদন করুন
                                        </Button>
                                        <Button
                                            onClick={handleReject}
                                            disabled={processing}
                                            variant="outline"
                                            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                            size="sm"
                                        >
                                            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                                            প্রত্যাখ্যান করুন
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {deposit.admin_notes && deposit.status !== 'pending' && (
                                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                                    <p className="text-xs text-slate-500 mb-1">অ্যাডমিন নোট</p>
                                    <p className="text-sm text-slate-300">{deposit.admin_notes}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export function AdminDepositQueue() {
    const [deposits, setDeposits] = useState<DepositRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [methodFilter, setMethodFilter] = useState('all');
    const supabase = createClient();

    const loadDeposits = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('deposit_requests')
                .select(`
          *,
          user_profiles(full_name, email)
        `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (statusFilter !== 'all') query = query.eq('status', statusFilter);
            if (methodFilter !== 'all') query = query.eq('payment_method', methodFilter);

            const { data, error } = await query;
            if (error) throw error;
            setDeposits(data || []);
        } catch (err) {
            console.error('Error loading deposits:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, methodFilter]);

    useEffect(() => { loadDeposits(); }, [loadDeposits]);

    const pendingCount = deposits.filter(d => d.status === 'pending').length;

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                                statusFilter === s ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                            )}
                        >
                            {s === 'pending' ? `মুলতুবি${pendingCount > 0 ? ` (${pendingCount})` : ''}` :
                                s === 'approved' ? 'অনুমোদিত' :
                                    s === 'rejected' ? 'প্রত্যাখ্যাত' : 'সব'}
                        </button>
                    ))}
                </div>

                <select
                    title="পেমেন্ট মেথড ফিল্টার"
                    value={methodFilter}
                    onChange={e => setMethodFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                >
                    <option value="all">সব মেথড</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="usdt_trc20">USDT TRC20</option>
                    <option value="usdt_erc20">USDT ERC20</option>
                    <option value="usdt_bep20">USDT BEP20</option>
                </select>

                <Button variant="outline" size="sm" onClick={loadDeposits} disabled={loading} className="border-slate-700 ml-auto">
                    <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                </Button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : deposits.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>কোনো ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {deposits.map(d => (
                        <DepositCard key={d.id} deposit={d} onAction={loadDeposits} />
                    ))}
                </div>
            )}
        </div>
    );
}
