'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle,
  ShieldCheck, Search, Filter
} from 'lucide-react';

interface Trade {
  id: string; offer_id: string; buyer_id: string; seller_id: string;
  buyer_name?: string; seller_name?: string; payment_methods?: string[];
  amount_usdt: number; price_per_usdt_bdt: number; total_bdt: number;
  status: string; escrow_released: boolean;
  buyer_confirmed_at: string | null; seller_released_at: string | null;
  disputed_at: string | null; completed_at: string | null;
  created_at: string;
}

interface Dispute {
  id: string; trade_id: string; opened_by: string; opener_name?: string;
  reason: string; evidence_url: string | null; status: string;
  resolution: string | null; created_at: string; resolved_at: string | null;
  amount_usdt?: number; total_bdt?: number; trade_status?: string;
}

export default function P2PAdminPage() {
  const [tab, setTab] = useState<'trades' | 'disputes'>('trades');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([
        fetch('/api/admin/p2p?type=trades'),
        fetch('/api/admin/p2p?type=disputes')
      ]);
      const tJson = await tRes.json(); const dJson = await dRes.json();
      if (tJson.success) setTrades(tJson.data);
      if (dJson.success) setDisputes(dJson.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const action = async (trade_id: string, actionType: string, resolution?: string) => {
    setProcessing(trade_id);
    try {
      const res = await fetch('/api/admin/p2p', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade_id, action: actionType, resolution })
      });
      const json = await res.json();
      toast({ title: json.success ? 'Success' : 'Error', description: json.message || json.error, variant: json.success ? 'default' : 'destructive' });
      if (json.success) fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setProcessing(null);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      payment_sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      disputed: 'bg-red-500/10 text-red-400 border-red-500/20',
      cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      open: 'bg-red-500/10 text-red-400 border-red-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return <Badge className={map[s] || map.pending}><Clock className="w-3 h-3 mr-1" />{s}</Badge>;
  };

  const filteredTrades = trades.filter(t =>
    search === '' || t.id.includes(search) || t.buyer_name?.includes(search) || t.seller_name?.includes(search)
  );
  const filteredDisputes = disputes.filter(d =>
    search === '' || d.id.includes(search) || d.opener_name?.includes(search) || d.reason.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">P2P মেনেজমেন্ট</h1>
        <Button onClick={fetchData} variant="outline" size="sm" className="border-slate-700"><RefreshCw className="w-4 h-4 mr-2" />রিফ্রেশ</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-900 border-slate-800" />
        </div>
        <div className="flex bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <button onClick={() => setTab('trades')} className={`px-4 py-2 text-sm ${tab === 'trades' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>ট্রেডস ({trades.length})</button>
          <button onClick={() => setTab('disputes')} className={`px-4 py-2 text-sm ${tab === 'disputes' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>দিসপিউটস ({disputes.filter(d => d.status === 'open').length})</button>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-slate-500">লোড...</div> : tab === 'trades' ? (
        filteredTrades.length === 0 ? <div className="text-center py-12 text-slate-500">কোনো ট্রেড নেই</div> : (
          <div className="space-y-3">
            {filteredTrades.map(t => (
              <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">{statusBadge(t.status)} <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">{t.id.slice(0, 8)}</Badge></div>
                  <span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString('bn-BD')}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><span className="text-slate-500">ক্রেতা:</span> <span className="text-white">{t.buyer_name || t.buyer_id.slice(0, 8)}</span></div>
                  <div><span className="text-slate-500">বিক্রেতা:</span> <span className="text-white">{t.seller_name || t.seller_id.slice(0, 8)}</span></div>
                  <div><span className="text-slate-500">পরিমাণ:</span> <span className="text-white">{t.amount_usdt} USDT</span></div>
                  <div><span className="text-slate-500">মোট দাম:</span> <span className="text-white">ৣ{t.total_bdt.toFixed(2)}</span></div>
                </div>
                {t.payment_methods && <p className="text-xs text-slate-500">পেমেন্ট: {t.payment_methods.join(', ')}</p>}
                {t.status === 'pending' && (
                  <Button onClick={() => action(t.id, 'cancel_trade')} disabled={processing === t.id} variant="destructive" size="sm"><XCircle className="w-3 h-3 mr-1" />বাতিল</Button>
                )}
              </motion.div>
            ))}
          </div>
        )
      ) : (
        filteredDisputes.length === 0 ? <div className="text-center py-12 text-slate-500">কোনো দিসপিউট নেই</div> : (
          <div className="space-y-3">
            {filteredDisputes.map(d => (
              <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">{statusBadge(d.status)} <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">{d.id.slice(0, 8)}</Badge></div>
                  <span className="text-xs text-slate-500">{new Date(d.created_at).toLocaleString('bn-BD')}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-slate-500">ট্রেড ID:</span> <span className="text-white">{d.trade_id.slice(0, 8)}</span></div>
                  <div><span className="text-slate-500">খোলের্দার:</span> <span className="text-white">{d.opener_name || d.opened_by.slice(0, 8)}</span></div>
                  <div><span className="text-slate-500">পরিমাণ:</span> <span className="text-white">{d.amount_usdt} USDT / ৣ{d.total_bdt}</span></div>
                </div>
                <p className="text-sm text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">কারণ: {d.reason}</p>
                {d.evidence_url && <a href={d.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">প্রমাণ দেখুন</a>}
                {d.status === 'open' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <Button onClick={() => action(d.trade_id, 'resolve_dispute', 'release_to_buyer')} disabled={processing === d.trade_id} size="sm" className="bg-emerald-600 hover:bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" />ক্রেতার পক্ষে রিলিজ</Button>
                    <Button onClick={() => action(d.trade_id, 'resolve_dispute', 'return_to_seller')} disabled={processing === d.trade_id} size="sm" variant="destructive"><XCircle className="w-3 h-3 mr-1" />বিক্রেতার পক্ষে ফিরিয়ান্ত</Button>
                  </div>
                )}
                {d.resolution && <p className="text-xs text-slate-500">সমাধান: {d.resolution}</p>}
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
