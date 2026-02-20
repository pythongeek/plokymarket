'use client';

import { AdminDepositQueue } from '@/components/admin/AdminDepositQueue';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminDepositsPage() {
    const [stats, setStats] = useState({ pending: 0, approved: 0, total_usdt: 0 });
    const supabase = createClient();

    useEffect(() => {
        const fetchStats = async () => {
            const { data } = await supabase
                .from('deposit_requests')
                .select('status, usdt_amount');
            if (data) {
                const rows = data as { status: string; usdt_amount: number }[];
                setStats({
                    pending: rows.filter(d => d.status === 'pending').length,
                    approved: rows.filter(d => d.status === 'approved').length,
                    total_usdt: rows
                        .filter(d => d.status === 'approved')
                        .reduce((sum: number, d) => sum + (d.usdt_amount || 0), 0),
                });
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                    ডিপোজিট ম্যানেজমেন্ট
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    bKash, Nagad, Rocket এবং USDT ডিপোজিট রিকোয়েস্ট পর্যালোচনা ও অনুমোদন করুন
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-400 font-medium">মুলতুবি</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-medium">অনুমোদিত</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.approved}</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-blue-400 font-medium">মোট USDT</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stats.total_usdt.toFixed(0)}</p>
                </div>
            </div>

            {/* Queue */}
            <AdminDepositQueue />
        </div>
    );
}
