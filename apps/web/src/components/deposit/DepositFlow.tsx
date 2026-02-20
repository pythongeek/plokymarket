'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import P2PDepositContainer from '../binance-p2p/P2PDepositContainer';
import ManualAgentDeposit from './ManualAgentDeposit';
import { MFSDepositForm } from '@/components/wallet/MFSDepositForm';
import { USDTDepositForm } from '@/components/wallet/USDTDepositForm';
import {
    Zap, Smartphone, ArrowLeft, ShieldCheck,
    Clock, Wallet, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DepositMode = 'select' | 'mfs' | 'usdt' | 'binance' | 'manual';

const DEPOSIT_METHODS = [
    {
        id: 'mfs' as DepositMode,
        title: 'bKash / Nagad / Rocket',
        subtitle: 'MFS পেমেন্ট',
        description: 'বাংলাদেশের যেকোনো মোবাইল ব্যাংকিং থেকে সরাসরি ডিপোজিট করুন। সবচেয়ে সহজ ও দ্রুত পদ্ধতি।',
        badge: 'সবচেয়ে জনপ্রিয়',
        badgeColor: 'bg-pink-500/20 text-pink-400',
        borderColor: 'border-pink-500/20 hover:border-pink-500',
        icon: '🌸',
        iconBg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
        iconColor: 'text-pink-400',
        alwaysShow: true,
    },
    {
        id: 'usdt' as DepositMode,
        title: 'USDT (Crypto)',
        subtitle: 'TRC20 / ERC20 / BEP20',
        description: 'Binance বা যেকোনো এক্সচেঞ্জ থেকে সরাসরি USDT পাঠান। ক্রিপ্টো ব্যবহারকারীদের জন্য আদর্শ।',
        badge: 'ক্রিপ্টো',
        badgeColor: 'bg-blue-500/20 text-blue-400',
        borderColor: 'border-blue-500/20 hover:border-blue-500',
        icon: '💎',
        iconBg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
        iconColor: 'text-blue-400',
        alwaysShow: true,
    },
    {
        id: 'binance' as DepositMode,
        title: 'Binance P2P মার্কেট',
        subtitle: 'সরাসরি বাইন্যান্স থেকে',
        description: 'লাইভ Binance P2P সেলারদের কাছ থেকে সেরা রেটে USDT কিনুন।',
        badge: 'রিয়েল-টাইম রেট',
        badgeColor: 'bg-yellow-500/20 text-yellow-500',
        borderColor: 'border-yellow-500/20 hover:border-yellow-500',
        icon: '⚡',
        iconBg: 'bg-yellow-500/10 group-hover:bg-yellow-500/20',
        iconColor: 'text-yellow-500',
        settingKey: 'binance_p2p_scrape',
    },
    {
        id: 'manual' as DepositMode,
        title: 'এজেন্ট ডিপোজিট',
        subtitle: 'ম্যানুয়াল প্রসেসিং',
        description: 'আমাদের এজেন্টকে সরাসরি টাকা পাঠান। ১০ মিনিটে USDT কনফার্মেশন।',
        badge: '২৪/৭ অ্যাভেইলেবল',
        badgeColor: 'bg-primary/20 text-primary',
        borderColor: 'border-primary/20 hover:border-primary',
        icon: '👤',
        iconBg: 'bg-primary/10 group-hover:bg-primary/20',
        iconColor: 'text-primary',
        settingKey: 'manual_agent_processing',
    },
];

export default function DepositFlow() {
    const [mode, setMode] = useState<DepositMode>('select');
    const [settings, setSettings] = useState<any>({});
    const [agentMethod, setAgentMethod] = useState<'bkash' | 'nagad'>('bkash');
    const [agentAmount, setAgentAmount] = useState('1000');
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

    const visibleMethods = DEPOSIT_METHODS.filter(m =>
        m.alwaysShow || settings?.[m.settingKey as string]
    );

    const renderSelection = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">ডিপোজিট মেথড নির্বাচন করুন</h2>
                <p className="text-slate-400">আপনার জন্য সুবিধাজনক মাধ্যমটি বেছে নিন</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleMethods.map(method => (
                    <motion.button
                        key={method.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode(method.id)}
                        className={cn(
                            'group p-6 rounded-2xl border-2 bg-slate-900 transition-all text-left shadow-xl flex flex-col',
                            method.borderColor
                        )}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors',
                                method.iconBg
                            )}>
                                {method.icon}
                            </div>
                            <span className={cn('text-xs px-2.5 py-1 rounded-full font-bold', method.badgeColor)}>
                                {method.badge}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-0.5">{method.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">{method.subtitle}</p>
                        <p className="text-slate-400 text-sm flex-grow">{method.description}</p>
                    </motion.button>
                ))}
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 shrink-0">
                    <ShieldCheck size={20} />
                </div>
                <p className="text-sm text-slate-400">
                    আমাদের সকল ট্রানজাকশন সুরক্ষিত। যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন।
                </p>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (mode) {
            case 'mfs':
                return (
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">🌸</span>
                            <div>
                                <h2 className="text-xl font-bold text-white">MFS ডিপোজিট</h2>
                                <p className="text-slate-400 text-sm">bKash / Nagad / Rocket</p>
                            </div>
                        </div>
                        <MFSDepositForm />
                    </div>
                );
            case 'usdt':
                return (
                    <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">💎</span>
                            <div>
                                <h2 className="text-xl font-bold text-white">USDT ডিপোজিট</h2>
                                <p className="text-slate-400 text-sm">Binance P2P থেকে সরাসরি পাঠান</p>
                            </div>
                        </div>
                        <USDTDepositForm />
                    </div>
                );
            case 'binance':
                return <P2PDepositContainer />;
            case 'manual':
                return (
                    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl">
                        <div className="mb-8 space-y-4">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Clock className="text-primary" />
                                ম্যানুয়াল এজেন্ট ডিপোজিট
                            </h2>
                            <div className="flex bg-slate-950 rounded-2xl p-1 border border-slate-800">
                                <button
                                    onClick={() => setAgentMethod('bkash')}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${agentMethod === 'bkash' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500'}`}
                                >
                                    bKash
                                </button>
                                <button
                                    onClick={() => setAgentMethod('nagad')}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${agentMethod === 'nagad' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
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
                                        value={agentAmount}
                                        onChange={(e) => setAgentAmount(e.target.value)}
                                        className="w-full h-16 bg-slate-950 border-2 border-slate-800 rounded-2xl pl-10 pr-4 text-2xl font-bold text-white focus:border-primary focus:outline-none transition-colors"
                                        placeholder="1000"
                                    />
                                </div>
                            </div>
                        </div>
                        <ManualAgentDeposit method={agentMethod} amount={parseInt(agentAmount) || 0} />
                    </div>
                );
            default:
                return null;
        }
    };

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
                        {renderContent()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
