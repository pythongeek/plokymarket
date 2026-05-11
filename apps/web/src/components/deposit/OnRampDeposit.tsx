'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Globe, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';

const PROVIDERS = [
  {
    name: 'INXY Pay',
    url: 'https://inxy.com',
    desc: 'বিশ্বজুড়ে প্রচলিত ক্রিপ্টো অন-র্যাম্প প্ল্যাটফর্ম। ভিসা/মাস্টারকার্ড গ্রহণযোগ্য।',
    features: ['ভিসা/মাস্টারকার্ড', 'Apple Pay', 'Google Pay'],
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  },
  {
    name: 'MoonPay',
    url: 'https://www.moonpay.com',
    desc: 'সারা বিশ্বে জনপ্রিয় ক্রিপ্টো কিনার প্ল্যাটফর্ম। ১৬০৲+ দেশ সাপোর্টেড।',
    features: ['ভিসা/মাস্টারকার্ড', 'ব্যাঙ্ক ট্রান্সফার', '3D Secure'],
    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
];

const STEPS = [
  'উপরের যেকোনো প্ল্যাটফর্মে লিঙ্কে ক্লিক করুন',
  'আপনার কার্ড তথ্য পূরণ করুন',
  'USDT কিনুন এবং BEP-20 নেট৅য়ার্ক নির্বাচন করুন',
  'প্ল্যাটফর্ম এড্রেস হিসাবে USDT পাঠান',
  'এর পর আমাদের ক্রিপ্টো ডিপোজিট পেজে ট্রান্সয়েশন হ্যাশ সাবমিট করুন',
];

export default function OnRampDeposit() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      {/* Warning */}
      <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-400 text-sm">ধ্যান দিন</h4>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            এই পদ্ধতিতে আপনি তৃতীয় পক্ষের প্ল্যাটফর্মে USDT কিনবেন। সম্পূর্ণ USDT কিনে আমাদের ক্রিপ্টো ডিপোজিট সিস্টেমে সাবমিট করুন।
            এর পর অটো-ক্রেডিট হবে।
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <div
            key={p.name}
            onClick={() => setSelected(selected === p.name ? null : p.name)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selected === p.name ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.color.split(' ')[0]}`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{p.name}</h3>
                  <p className="text-xs text-slate-400">{p.desc}</p>
                </div>
              </div>
              <Badge variant="outline" className={p.color}>
                <ExternalLink className="w-3 h-3 mr-1" />
                বিজিট
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {p.features.map((f) => (
                <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {f}
                </span>
              ))}
            </div>

            {selected === p.name && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {p.name} ঞে যান
                  </Button>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          স্টেপ-বাই-স্টেপ নির্দেশিকা
        </h3>
        <ol className="space-y-2">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0 mt-0.5">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      {/* Platform Address */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-400" />
          ডিপোজিট সাবমিট করুন
        </h3>
        <p className="text-xs text-slate-400">
          USDT কিনে আমাদের প্ল্যাটফর্ম এড্রেসে পাঠান। এর পর আমাদের ক্রিপ্টো ডিপোজিট পেজে হ্যাশ সাবমিট করুন অথবা অটো-ক্রেডিট হবে।
        </p>
        <Button
          onClick={() => window.location.href = '/wallet/deposit?mode=crypto'}
          variant="outline"
          className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          ক্রিপ্টো ডিপোজিট পেজে যান
        </Button>
      </div>
    </div>
  );
}
