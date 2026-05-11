'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    Ticket, Plus, Copy, CheckCircle, Clock, AlertTriangle,
    Search, RefreshCw, Download, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Voucher {
    id: string;
    code: string;
    usdt_value: number;
    status: 'active' | 'redeemed' | 'expired' | 'disabled';
    redeemed_by: string | null;
    redeemed_at: string | null;
    expires_at: string | null;
    batch_id: string | null;
    created_at: string;
}

export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showGenModal, setShowGenModal] = useState(false);
    const [genCount, setGenCount] = useState(10);
    const [genValue, setGenValue] = useState(10);
    const [genPrefix, setGenPrefix] = useState('POLY');
    const [genLoading, setGenLoading] = useState(false);
    const [genResult, setGenResult] = useState<any>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchVouchers();
    }, [filter]);

    const fetchVouchers = async () => {
        setLoading(true);
        const status = filter === 'all' ? '' : filter;
        const url = `/api/admin/vouchers?status=${status}&limit=200`;
        try {
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) setVouchers(json.data);
        } catch (e) {
            console.error('Fetch error:', e);
        }
        setLoading(false);
    };

    const generateVouchers = async () => {
        setGenLoading(true);
        setGenResult(null);
        try {
            const res = await fetch('/api/admin/vouchers/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    count: genCount,
                    usdt_value: genValue,
                    prefix: genPrefix,
                }),
            });
            const json = await res.json();
            setGenResult(json);
            if (json.success) fetchVouchers();
        } catch (e: any) {
            setGenResult({ success: false, error: e.message });
        }
        setGenLoading(false);
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const exportCSV = () => {
        const headers = ['Code', 'USDT Value', 'Status', 'Batch ID', 'Created At'];
        const rows = filteredVouchers.map(v => [
            v.code, v.usdt_value, v.status, v.batch_id || '', v.created_at
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vouchers-${Date.now()}.csv`;
        a.click();
    };

    const filteredVouchers = vouchers.filter(v =>
        v.code.toLowerCase().includes(search.toLowerCase()) ||
        (v.batch_id && v.batch_id.toLowerCase().includes(search.toLowerCase()))
    );

    const stats = {
        total: vouchers.length,
        active: vouchers.filter(v => v.status === 'active').length,
        redeemed: vouchers.filter(v => v.status === 'redeemed').length,
        expired: vouchers.filter(v => v.status === 'expired').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-emerald-400" />
                    ভাউচার কোড ম্যানেজমেন্ট
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    ভাউচার কোড তৈরি, মনিটর ও ম্যানেজ করুন
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">মোট</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 mb-1">সক্রিয়</p>
                    <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-400 mb-1">রিডিমড</p>
                    <p className="text-2xl font-bold text-white">{stats.redeemed}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 mb-1">মেয়াদ শেষ</p>
                    <p className="text-2xl font-bold text-white">{stats.expired}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center">
                <Button onClick={() => setShowGenModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-500">
                    <Plus className="w-4 h-4" />
                    নতুন ভাউচার
                </Button>
                <Button variant="outline" onClick={exportCSV} className="gap-2">
                    <Download className="w-4 h-4" />
                    CSV এক্সপোর্ট
                </Button>
                <Button variant="ghost" onClick={fetchVouchers} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    রিফ্রেশ
                </Button>
                <div className="flex-1" />
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                        placeholder="কোড বা ব্যাচ সার্চ..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 w-64 bg-slate-950 border-slate-800"
                    />
                </div>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-sm text-white"
                >
                    <option value="all">সব</option>
                    <option value="active">সক্রিয়</option>
                    <option value="redeemed">রিডিমড</option>
                    <option value="expired">মেয়াদ শেষ</option>
                    <option value="disabled">নিষ্ক্রিয়</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                                <th className="text-left p-3 font-medium">কোড</th>
                                <th className="text-left p-3 font-medium">মান</th>
                                <th className="text-left p-3 font-medium">স্ট্যাটাস</th>
                                <th className="text-left p-3 font-medium">ব্যাচ ID</th>
                                <th className="text-left p-3 font-medium">তৈরি</th>
                                <th className="text-left p-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">লোড হচ্ছে...</td></tr>
                            ) : filteredVouchers.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">কোনো ভাউচার পাওয়া যায়নি</td></tr>
                            ) : (
                                filteredVouchers.map(v => (
                                    <motion.tr
                                        key={v.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="border-b border-slate-800/50 hover:bg-slate-800/30"
                                    >
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <code className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                                                    {v.code}
                                                </code>
                                                <button onClick={() => copyCode(v.code)} className="text-slate-500 hover:text-white">
                                                    {copiedCode === v.code ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-3 font-semibold text-white">{v.usdt_value} USDT</td>
                                        <td className="p-3">
                                            <Badge variant="outline" className={
                                                v.status === 'active' ? 'border-emerald-500/30 text-emerald-400 text-[10px]' :
                                                v.status === 'redeemed' ? 'border-blue-500/30 text-blue-400 text-[10px]' :
                                                v.status === 'expired' ? 'border-amber-500/30 text-amber-400 text-[10px]' :
                                                'border-red-500/30 text-red-400 text-[10px]'
                                            }>
                                                {v.status === 'active' ? 'সক্রিয়' :
                                                 v.status === 'redeemed' ? 'রিডিমড' :
                                                 v.status === 'expired' ? 'মেয়াদ শেষ' : 'নিষ্ক্রিয়'}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-slate-400 text-xs">{v.batch_id || '-'}</td>
                                        <td className="p-3 text-slate-400 text-xs">
                                            {new Date(v.created_at).toLocaleDateString('bn-BD')}
                                        </td>
                                        <td className="p-3">
                                            {v.redeemed_at && (
                                                <span className="text-xs text-slate-500">
                                                    রিডিম: {new Date(v.redeemed_at).toLocaleDateString('bn-BD')}
                                                </span>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Modal */}
            {showGenModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 rounded-2xl p-6 border border-slate-700 w-full max-w-md space-y-4"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-emerald-400" />
                            নতুন ভাউচার তৈরি
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">সংখ্যা (১-৫০০)</label>
                                <Input
                                    type="number"
                                    min={1} max={500}
                                    value={genCount}
                                    onChange={e => setGenCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">USDT মান</label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={genValue}
                                    onChange={e => setGenValue(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">প্রিফিক্স</label>
                                <Input
                                    value={genPrefix}
                                    onChange={e => setGenPrefix(e.target.value.toUpperCase().slice(0, 8))}
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                        </div>

                        {genResult && (
                            <div className={`p-3 rounded-lg text-sm ${genResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {genResult.success
                                    ? `${genResult.generated} টি ভাউচার তৈরি হয়েছে`
                                    : genResult.error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => { setShowGenModal(false); setGenResult(null); }} className="flex-1">
                                বাতিল
                            </Button>
                            <Button onClick={generateVouchers} disabled={genLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-500">
                                {genLoading ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
