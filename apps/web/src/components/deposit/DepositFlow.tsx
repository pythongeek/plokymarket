'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import P2PDepositContainer from '../binance-p2p/P2PDepositContainer';
import ManualAgentDeposit from './ManualAgentDeposit';
import { Zap, Smartphone, ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DepositFlow() {
    const [mode, setMode] = useState<'select' | 'binance' | 'manual'>('select');
    const [settings, setSettings] = useState<any>(null);
    const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
    const [amount, setAmount] = useState('1000');
    const supabase = createClient();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'deposit_modes')
            .single();
        if (data) setSettings(data.value);
    };

    const renderSelection = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">ডিপোজিট মেথড নির্বাচন করুন</h2>
                <p className="text-slate-400">আপনার জন্য সুবিধাজনক মাধ্যমটি বেছে নিন</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings?.binance_p2p_scrape && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('binance')}
                        className="group p-8 rounded-3xl border-2 border-yellow-500/20 bg-slate-900 hover:border-yellow-500 transition-all text-left shadow-xl h-full flex flex-col"
                    >
                        <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/20 transition-colors">
                            <Zap className="text-yellow-500 w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-2xl text-white mb-2">বাইন্যান্স P2P মার্কেট</h3>
                        <p className="text-slate-400 text-sm flex-grow">সরাসরি বাইন্যান্স থেকে সেরা রেটে কিনুন। প্রো মেম্বারদের জন্য সেরা।</p>
                        <div className="mt-6 flex items-center gap-2">
                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                রিয়েল-টাইম রেট
                            </span>
                        </div>
                    </motion.button>
                )}

                {settings?.manual_agent_processing && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('manual')}
                        className="group p-8 rounded-3xl border-2 border-primary/20 bg-slate-900 hover:border-primary transition-all text-left shadow-xl h-full flex flex-col"
                    >
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                            <Smartphone className="text-primary w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-2xl text-white mb-2">দ্রুত প্রসেসিং (এজেন্ট)</h3>
                        <p className="text-slate-400 text-sm flex-grow">আমাদের এজেন্টকে সরাসরি টাকা পাঠান। ১০ মিনিটে USDT কনফার্মেশন।</p>
                        <div className="mt-6 flex items-center gap-2">
                            <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                                ২৪/৭ অ্যাভেইলেবল
                            </span>
                        </div>
                    </motion.button>
                )}
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                    <ShieldCheck size={20} />
                </div>
                <p className="text-sm text-slate-400">
                    আমাদের সকল ট্রানজাকশন সুরক্ষিত। যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন।
                </p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
                {mode === 'select' ? (
                    <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {renderSelection()}
                    </motion.div>
                ) : (
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <Button
                            variant="ghost"
                            onClick={() => setMode('select')}
                            className="mb-4 text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                        >
                            <ArrowLeft size={20} />
                            ফিরে যান
                        </Button>

                        {mode === 'binance' ? (
                            <P2PDepositContainer />
                        ) : (
                            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
                                <div className="mb-8 space-y-4">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Clock className="text-primary" />
                                        ম্যানুয়াল এজেন্ট ডিপোজিট
                                    </h2>

                                    <div className="flex bg-slate-950 rounded-2xl p-1 border border-slate-800">
                                        <button
                                            onClick={() => setMethod('bkash')}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${method === 'bkash' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500'}`}
                                        >
                                            bKash
                                        </button>
                                        <button
                                            onClick={() => setMethod('nagad')}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${method === 'nagad' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
                                        >
                                            Nagad
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400 ml-1">টাকার পরিমাণ (BDT)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-500">৳</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full h-16 bg-slate-950 border-2 border-slate-800 rounded-2xl pl-10 pr-4 text-2xl font-bold text-white focus:border-primary focus:outline-none transition-colors"
                                                placeholder="1000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <ManualAgentDeposit method={method} amount={parseInt(amount) || 0} />
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
