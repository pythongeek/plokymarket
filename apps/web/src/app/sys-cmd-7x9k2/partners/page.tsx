'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    Users, Plus, ExternalLink, Star, ShieldCheck, ShieldAlert,
    Search, RefreshCw, Phone, MapPin, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface Partner {
    id: string;
    name: string;
    telegram: string | null;
    whatsapp: string | null;
    facebook_page: string | null;
    phone: string | null;
    website: string | null;
    location: string | null;
    commission_rate: number;
    trust_score: number;
    status: 'pending' | 'verified' | 'suspended' | 'banned';
    total_volume_usdt: number;
    total_trades: number;
    positive_reviews: number;
    negative_reviews: number;
    verified_at: string | null;
    created_at: string;
}

export default function AdminPartnersPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({
        name: '', telegram: '', whatsapp: '', facebook_page: '', phone: '',
        location: '', website: '', commission_rate: 1,
    });
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchPartners();
    }, [filter]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const status = filter === 'all' ? '' : filter;
            const url = `/api/partners?status=${status}&limit=200`;
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) setPartners(json.data);
        } catch (e) {
            console.error('Fetch error:', e);
        }
        setLoading(false);
    };

    const addPartner = async () => {
        if (!form.name.trim()) return;
        setSubmitting(true);
        try {
            const { error } = await supabase.from('partner_exchangers').insert({
                name: form.name,
                telegram: form.telegram || null,
                whatsapp: form.whatsapp || null,
                facebook_page: form.facebook_page || null,
                phone: form.phone || null,
                location: form.location || null,
                website: form.website || null,
                commission_rate: form.commission_rate / 100,
                status: 'pending',
            });
            if (error) throw error;
            setShowAddModal(false);
            setForm({ name: '', telegram: '', whatsapp: '', facebook_page: '', phone: '', location: '', website: '', commission_rate: 1 });
            fetchPartners();
        } catch (e: any) {
            alert('ত্রুটি: ' + e.message);
        }
        setSubmitting(false);
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('partner_exchangers')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            fetchPartners();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const filtered = partners.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(search.toLowerCase()))
    );

    const stats = {
        total: partners.length,
        verified: partners.filter(p => p.status === 'verified').length,
        pending: partners.filter(p => p.status === 'pending').length,
        suspended: partners.filter(p => p.status === 'suspended').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-400" />
                    পার্টনার এক্সচেঞজার তালিকা
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    যাচাইকৃত লোকাল USDT এক্সচেঞজারদের ব্যবস্থাপনা ও মনিটরিং
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">মোট</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400 mb-1">যাচাইকৃত</p>
                    <p className="text-2xl font-bold text-white">{stats.verified}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-400 mb-1">অপেক্ষারী</p>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-400 mb-1">স্থগিত</p>
                    <p className="text-2xl font-bold text-white">{stats.suspended}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center">
                <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-amber-600 hover:bg-amber-500">
                    <Plus className="w-4 h-4" />
                    নতুন পার্টনার
                </Button>
                <Button variant="ghost" onClick={fetchPartners} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    রিফ্রেশ
                </Button>
                <div className="flex-1" />
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                        placeholder="নাম বা লোকেশন..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 w-56 bg-slate-950 border-slate-800"
                    />
                </div>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-sm text-white"
                >
                    <option value="all">সব</option>
                    <option value="verified">যাচাইকৃত</option>
                    <option value="pending">অপেক্ষারী</option>
                    <option value="suspended">স্থগিত</option>
                    <option value="banned">নিষিদ্ধ</option>
                </select>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">লোড হচ্ছে...</div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">কোনো পার্টনার নেই</div>
                ) : (
                    filtered.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-white">{p.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className={
                                            p.status === 'verified' ? 'border-emerald-500/30 text-emerald-400 text-[10px]' :
                                            p.status === 'pending' ? 'border-amber-500/30 text-amber-400 text-[10px]' :
                                            p.status === 'suspended' ? 'border-red-500/30 text-red-400 text-[10px]' :
                                            'border-slate-600 text-slate-400 text-[10px]'
                                        }>
                                            {p.status === 'verified' ? 'যাচাইকৃত' :
                                             p.status === 'pending' ? 'অপেক্ষারী' :
                                             p.status === 'suspended' ? 'স্থগিত' : 'নিষিদ্ধ'}
                                        </Badge>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-400" />
                                            {p.trust_score}/100
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {p.location && (
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {p.location}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {p.telegram && (
                                    <a href={`https://t.me/${p.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center gap-1 text-xs bg-sky-500/10 text-sky-400 px-2 py-1 rounded hover:bg-sky-500/20">
                                        <MessageCircle className="w-3 h-3" /> Telegram
                                    </a>
                                )}
                                {p.whatsapp && (
                                    <a href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded hover:bg-green-500/20">
                                        <Phone className="w-3 h-3" /> WhatsApp
                                    </a>
                                )}
                                {p.facebook_page && (
                                    <a href={p.facebook_page} target="_blank" rel="noopener noreferrer"
                                       className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20">
                                        <ExternalLink className="w-3 h-3" /> Facebook
                                    </a>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-500">কমিশন</p>
                                    <p className="text-sm font-semibold text-white">{(p.commission_rate * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">ট্রেড</p>
                                    <p className="text-sm font-semibold text-white">{p.total_trades}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">ভলিয়ান</p>
                                    <p className="text-sm font-semibold text-white">{p.total_volume_usdt.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                {p.status === 'pending' && (
                                    <Button size="sm" onClick={() => updateStatus(p.id, 'verified')} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-xs">
                                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                        যাচাই করুন
                                    </Button>
                                )}
                                {p.status === 'verified' && (
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, 'suspended')} className="flex-1 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">
                                        <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                                        স্থগিত
                                    </Button>
                                )}
                                {(p.status === 'suspended' || p.status === 'banned') && (
                                    <Button size="sm" variant="outline" onClick={() => updateStatus(p.id, 'verified')} className="flex-1 text-xs">
                                        পুনরায় যাচাই
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Add Partner Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 rounded-2xl p-6 border border-slate-700 w-full max-w-md space-y-4"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-amber-400" />
                            নতুন পার্টনার যোগ করুন
                        </h3>

                        <div className="space-y-3">
                            <Input placeholder="নাম *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-950 border-slate-800" />
                            <Input placeholder="Telegram (@username)" value={form.telegram} onChange={e => setForm({ ...form, telegram: e.target.value })} className="bg-slate-950 border-slate-800" />
                            <Input placeholder="WhatsApp (২০১...)" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="bg-slate-950 border-slate-800" />
                            <Input placeholder="Facebook Page URL" value={form.facebook_page} onChange={e => setForm({ ...form, facebook_page: e.target.value })} className="bg-slate-950 border-slate-800" />
                            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-slate-950 border-slate-800" />
                            <Input placeholder="Location (ঠাকা/... )" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-slate-950 border-slate-800" />
                            <Input placeholder="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="bg-slate-950 border-slate-800" />
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">কমিশ঩ (%)</label>
                                <Input type="number" min={0} max={50} value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: parseFloat(e.target.value) || 0 })} className="bg-slate-950 border-slate-800" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">বাতিল</Button>
                            <Button onClick={addPartner} disabled={submitting || !form.name.trim()} className="flex-1 bg-amber-600 hover:bg-amber-500">
                                {submitting ? 'সেভ হচ্ছে...' : 'যোগ করুন'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
