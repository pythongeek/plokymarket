'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
    RefreshCw, CheckCircle, XCircle, Clock, ExternalLink,
    Filter, Search
} from 'lucide-react';

interface CryptoDeposit {
    id: string;
    user_id: string;
    user_email?: string;
    user_name?: string;
    network: string;
    amount_usdt: number | null;
    txn_hash: string;
    from_address: string | null;
    to_address: string;
    memo: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    reviewed_at: string | null;
    notes: string | null;
}

export default function CryptoDepositsAdminPage() {
    const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});

    const fetchDeposits = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/crypto-deposits?status=${filter}&limit=200`);
            const json = await res.json();
            if (json.success) setDeposits(json.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchDeposits(); }, [filter]);

    const action = async (id: string, actionType: 'approve' | 'reject') => {
        setProcessing(id);
        try {
            const res = await fetch('/api/admin/crypto-deposits', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deposit_id: id, action: actionType, notes: notes[id] || null }),
            });
            const json = await res.json();
            toast({ title: json.success ? 'Success' : 'Error', description: json.message || json.error, variant: json.success ? 'default' : 'destructive' });
            if (json.success) fetchDeposits();
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, variant: 'destructive' });
        }
        setProcessing(null);
    };

    const filtered = deposits.filter(d =>
        search === '' ||
        d.txn_hash.toLowerCase().includes(search.toLowerCase()) ||
        d.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        d.network.toLowerCase().includes(search.toLowerCase())
    );

    const statusBadge = (s: string) => {
        if (s === 'approved') return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1" />অনুমোদন</Badge>;
        if (s === 'rejected') return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />বাতিল</Badge>;
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20"><Clock className="w-3 h-3 mr-1" />মন্দে</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">ক্রিপ্টো ডিপোজিট মেনেজমেন্ট</h1>
                <Button onClick={fetchDeposits} variant="outline" size="sm" className="border-slate-700">
                    <RefreshCw className="w-4 h-4 mr-2" />রিফ্রেশ
                </Button>
            </div>

            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input placeholder="Search TXN / email / network" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-900 border-slate-800" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-3 text-white text-sm">
                    <option value="all">সকল স্ট্যাটাস</option>
                    <option value="pending">মন্দে</option>
                    <option value="approved">অনুমোদন</option>
                    <option value="rejected">বাতিল</option>
                </select>
            </div>

            {loading ? <div className="text-center py-12 text-slate-500">লোড হচ্ছে...</div> : filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500">কোনো ডিপোজিট পাওয়া যায়নি</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(d => (
                        <div key={d.id} className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    {statusBadge(d.status)}
                                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] uppercase">{d.network}</Badge>
                                </div>
                                <span className="text-xs text-slate-500">{new Date(d.created_at).toLocaleString('bn-BD')}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div><span className="text-slate-500">ব্যবহারকারী:</span> <span className="text-white">{d.user_name || d.user_email || d.user_id.substring(0, 8)}</span></div>
                                <div><span className="text-slate-500">পরিমাণ:</span> <span className="text-white">{d.amount_usdt ? `${d.amount_usdt} USDT` : 'অজানা'}</span></div>
                                <div className="md:col-span-2">
                                    <span className="text-slate-500">TXN Hash:</span>
                                    <code className="text-blue-400 font-mono ml-2 break-all">{d.txn_hash}</code>
                                    <a href={`https://bscscan.com/tx/${d.txn_hash}`} target="_blank" rel="noreferrer" className="inline-flex ml-2 text-slate-500 hover:text-white">
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                {d.from_address && <div><span className="text-slate-500">From:</span> <code className="text-slate-300 font-mono ml-2">{d.from_address}</code></div>}
                                {d.to_address && <div><span className="text-slate-500">To:</span> <code className="text-slate-300 font-mono ml-2">{d.to_address}</code></div>}
                                {d.memo && <div><span className="text-slate-500">Memo:</span> <code className="text-amber-400 font-mono ml-2">{d.memo}</code></div>}
                            </div>

                            {d.status === 'pending' && (
                                <div className="flex gap-3 pt-2 border-t border-slate-800">
                                    <Input
                                        placeholder="নোট (থাকলে)"
                                        value={notes[d.id] || ''}
                                        onChange={e => setNotes({ ...notes, [d.id]: e.target.value })}
                                        className="flex-1 bg-slate-950 border-slate-800 text-sm"
                                    />
                                    <Button onClick={() => action(d.id, 'approve')} disabled={processing === d.id} className="bg-emerald-600 hover:bg-emerald-500">
                                        <CheckCircle className="w-4 h-4 mr-1" />অনুমোদন
                                    </Button>
                                    <Button onClick={() => action(d.id, 'reject')} disabled={processing === d.id} variant="destructive">
                                        <XCircle className="w-4 h-4 mr-1" />বাতিল
                                    </Button>
                                </div>
                            )}

                            {d.notes && <p className="text-xs text-slate-500 pt-1">নোট: {d.notes}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
