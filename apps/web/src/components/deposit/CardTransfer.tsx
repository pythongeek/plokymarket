'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy, CheckCircle, CreditCard, Loader2 } from 'lucide-react';

const CARDS = [
  { name: 'RedotPay', color: 'bg-red-500/10 text-red-400 border-red-500/20', link: 'https://redotpay.com', ref: 'https://redotpay.com/ref/PLKY' },
  { name: 'Bleap', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', link: 'https://bleap.io', ref: 'https://bleap.io/r/ploky' },
  { name: 'Karta.io', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', link: 'https://karta.io', ref: 'https://karta.io/?ref=ploky' },
];

const STEPS = [
  'আপনার কার্ড অ্যাপে লগইন করুন',
  'ক্রিপ্টো তে গিয়ে USDT সিলেক্ট করুন BEP-20 (বিএসসি) নেটওয়ার্ক',
  'নীচের ডিপোজিট এড্রেস কপি করুন (মেমো সহ)',
  'সম্পূর্ণ হলে ট্রানজাকশন হ্যাশ সাবমিট করুন',
];

export default function CardTransfer() {
  const [copied, setCopied] = useState<string | null>(null);
  const [addressData, setAddressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wallet/deposit/crypto/address?network=bep20')
      .then(r => r.json())
      .then(json => {
        if (json.success) setAddressData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copy = (t: string, key: string) => { navigator.clipboard.writeText(t); setCopied(key); setTimeout(() => setCopied(null), 2000); };

  const address = addressData?.address || '';
  const memo = addressData?.memo || '';

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
        <h3 className="font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-400" />কার্ড ট্রানসফার গাইড</h3>
        <ol className="space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0 mt-0.5">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
        <label className="text-xs text-slate-500 block">প্লাটফর্ম ডিপোজিট এড্রেস (BEP-20)</label>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            লোড হচ্ছে...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-3 py-2 border border-slate-800">
              <code className="text-sm text-blue-400 font-mono break-all flex-1">{address || 'এড্রেস পাওয়া যায়নি'}</code>
              <button onClick={() => copy(address, 'addr')} className="text-slate-500 hover:text-white" disabled={!address}>
                {copied === 'addr' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <label className="text-xs text-slate-500 block">মেমো (অবশ্যী পাঠাতে হবে)</label>
            <div className="flex items-center gap-2 bg-slate-950 rounded-lg px-3 py-2 border border-amber-500/30">
              <code className="text-sm text-amber-400 font-mono flex-1">{memo || 'PLY_CARD'}</code>
              <button onClick={() => copy(memo, 'memo')} className="text-slate-500 hover:text-white" disabled={!memo}>
                {copied === 'memo' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
        <p className="text-xs text-amber-500/70">মেমো সহ না পাঠালে ডিপোজিট শনাক্ত হবে না</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-400">সাপোর্টেড কার্ড অ্যাপস:</p>
        <div className="grid grid-cols-1 gap-2">
          {CARDS.map(c => (
            <div key={c.name} className={`p-3 rounded-xl border flex items-center justify-between ${c.color}`}>
              <span className="font-bold text-sm">{c.name}</span>
              <div className="flex gap-2">
                <a href={c.ref} target="_blank" rel="noreferrer" className="text-xs underline opacity-70 hover:opacity-100">রেফারাল</a>
                <a href={c.link} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3" /></a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={() => window.location.href = '/wallet/deposit?mode=crypto'} className="w-full bg-blue-600 hover:bg-blue-500">
        ট্রানজাকশন হ্যাশ সাবমিট করুন
      </Button>
    </div>
  );
}
