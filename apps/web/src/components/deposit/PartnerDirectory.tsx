'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, ExternalLink, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface Partner {
  id: string; name: string; telegram: string | null; whatsapp: string | null;
  phone: string | null; location: string | null; website: string | null;
  facebook_page: string | null; commission_rate: number; trust_score: number;
  status: string; total_volume_usdt: number;
}

export default function PartnerDirectory() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ name: '', telegram: '', whatsapp: '', phone: '', location: '', website: '', facebook_page: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase.from('partner_exchangers').select('*').eq('status', 'verified').order('trust_score', { ascending: false }).limit(50);
    setPartners(data || []);
    setLoading(false);
  };

  const apply = async () => {
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/partners/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      setResult(json);
      if (json.success) { setForm({ name: '', telegram: '', whatsapp: '', phone: '', location: '', website: '', facebook_page: '' }); }
    } catch (e: any) { setResult({ success: false, error: e.message }); }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setShowApply(!showApply)} className="flex-1 border-slate-700 text-slate-300">
          {showApply ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
          পার্টনার হতে আবেদন
        </Button>
        <Button variant="ghost" onClick={fetchPartners} className="text-slate-400">রিফ্রেশ</Button>
      </div>

      <AnimatePresence>
        {showApply && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
            <h4 className="font-semibold text-white">পার্টনার আবেদন ফর্ম</h4>
            <Input placeholder="নাম *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-slate-950 border-slate-800" />
            <Input placeholder="ফোন *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-slate-950 border-slate-800" />
            <Input placeholder="টেলিগ্রাম (@username)" value={form.telegram} onChange={e => setForm({ ...form, telegram: e.target.value })} className="bg-slate-950 border-slate-800" />
            <Input placeholder="ওয়াটসঅ্যাপ (8801XXXXXXXXX)" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="bg-slate-950 border-slate-800" />
            <Input placeholder="ঠিকানা" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="bg-slate-950 border-slate-800" />
            <Input placeholder="ওয়েবসাইট (থাকলে)" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="bg-slate-950 border-slate-800" />
            <Input placeholder="ফেসবুক পেজ" value={form.facebook_page} onChange={e => setForm({ ...form, facebook_page: e.target.value })} className="bg-slate-950 border-slate-800" />
            <Button onClick={apply} disabled={submitting || !form.name || !form.phone} className="w-full bg-amber-600 hover:bg-amber-500">
              <Send className="w-4 h-4 mr-2" />{submitting ? 'প্রক্রিয়া...' : 'আবেদন করুন'}
            </Button>
            {result && <div className={`text-sm p-2 rounded ${result.success ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{result.message || result.error}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <div className="text-center py-8 text-slate-500">লোড...</div> : partners.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          কোনো যাচাইকৃত পার্টনার নেই
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-slate-900 rounded-xl border border-slate-800 hover:border-amber-500/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">ট্রাস্ট {p.trust_score}/100</Badge>
                    {p.commission_rate > 0 && <Badge className="text-slate-400 border-slate-600 text-[10px]">কমিশন {(p.commission_rate * 100).toFixed(1)}%</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {p.telegram && <a href={`https://t.me/${p.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="p-2 bg-sky-500/10 rounded-lg text-sky-400"><ExternalLink className="w-4 h-4" /></a>}
                  {p.whatsapp && <a href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noreferrer" className="p-2 bg-green-500/10 rounded-lg text-green-400"><ExternalLink className="w-4 h-4" /></a>}
                </div>
              </div>
              {p.location && <p className="text-xs text-slate-500 mt-2">📍 {p.location}</p>}
              {p.total_volume_usdt > 0 && <p className="text-xs text-slate-500 mt-1">{p.total_volume_usdt.toLocaleString()} USDT ট্রেড</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
