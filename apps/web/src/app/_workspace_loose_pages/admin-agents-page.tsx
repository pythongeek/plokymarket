'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Star, TrendingUp, AlertCircle, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AgentWallet {
    id: string;
    user_id: string;
    bkash_number: string;
    nagad_number: string | null;
    rocket_number: string | null;
    upay_number: string | null;
    daily_limit: number;
    is_active: boolean;
    created_at: string;
    user?: { username: string; email: string };
}

interface AgentRating {
    id: string;
    agent_id: string;
    rating: number;
    review: string;
    created_at: string;
}

export default function AdminAgentsPage() {
    const [agents, setAgents] = useState<AgentWallet[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('agent_wallets')
            .select('*, user:users_1(username, email)')
            .order('created_at', { ascending: false });
        setAgents(data || []);
        setLoading(false);
    };

    const toggleAgent = async (id: string, active: boolean) => {
        await supabase.from('agent_wallets').update({ is_active: !active }).eq('id', id);
        fetchAgents();
    };

    const filtered = agents.filter(a =>
        (a.user?.username || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.bkash_number || '').includes(search)
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-emerald-400" />
                    Agent Directory
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Smart Agent match system — agents who accept bKash/Nagad and send USDT
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { icon: Users, label: 'Agents', value: agents.length, color: 'text-emerald-400' },
                    { icon: CheckCircle, label: 'Active', value: agents.filter(a => a.is_active).length, color: 'text-green-400' },
                    { icon: XCircle, label: 'Inactive', value: agents.filter(a => !a.is_active).length, color: 'text-red-400' },
                    { icon: TrendingUp, label: 'Daily Limit', value: agents.reduce((s, a) => s + a.daily_limit, 0).toLocaleString() + ' USDT', color: 'text-blue-400' },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            <span className="text-slate-400 text-sm">{s.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by username or bKash number..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900 text-slate-400">
                        <tr>
                            <th className="text-left p-3">Agent</th>
                            <th className="text-left p-3">bKash</th>
                            <th className="text-left p-3">Nagad</th>
                            <th className="text-left p-3">Daily Limit</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                                No agents found. Users become agents when they add their bKash number in deposit settings.
                            </td></tr>
                        ) : (
                            filtered.map(a => (
                                <tr key={a.id} className="hover:bg-slate-750">
                                    <td className="p-3">
                                        <div className="font-medium text-white">{a.user?.username || 'Unknown'}</div>
                                        <div className="text-slate-500 text-xs">{a.user?.email || ''}</div>
                                    </td>
                                    <td className="p-3 text-white font-mono">{a.bkash_number}</td>
                                    <td className="p-3 text-slate-400">{a.nagad_number || '-'}</td>
                                    <td className="p-3 text-white">{a.daily_limit.toLocaleString()} USDT</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${a.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {a.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleAgent(a.id, a.is_active)}
                                            className={a.is_active ? 'border-red-500/50 text-red-400' : 'border-green-500/50 text-green-400'}
                                        >
                                            {a.is_active ? 'Deactivate' : 'Activate'}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
