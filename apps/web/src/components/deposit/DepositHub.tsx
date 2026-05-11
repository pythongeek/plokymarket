'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
    Ticket, UserCheck, Diamond, Users, ArrowLeftRight,
    CreditCard, Globe, Smartphone, BookOpen, ArrowLeft,
    ShieldCheck, TrendingUp, Clock, AlertTriangle,
    ChevronRight, Sparkles, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import DepositFlow from './DepositFlow';
import CryptoDeposit from './CryptoDeposit';
import P2PDeposit from './P2PDeposit';
import CardTransfer from './CardTransfer';
import OnRampDeposit from './OnRampDeposit';

export type DepositMethod =
    | 'hub'
    | 'voucher'
    | 'agent'
    | 'crypto'
    | 'partner'
    | 'p2p'
    | 'card'
    | 'moonpay'
    | 'telegram'
    | 'guide';

interface DepositMethodConfig {
    id: DepositMethod;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    borderColor: string;
    bgGradient: string;
    iconBg: string;
    iconColor: string;
    popular?: boolean;
    comingSoon?: boolean;
    external?: boolean;
    href?: string;
}

const DEPOSIT_METHODS: DepositMethodConfig[] = [
    {
        id: 'voucher',
        title: 'ভাউচার কোড',
        subtitle: 'Voucher System',
        description: 'অফলাইন কিনা তারপর ভিয়া অনলাইন রিডিম করুন। সবচেয়ে দ্রুত এবং নিরাপদ পদ্ধতি।',
        icon: <Ticket className="h-7 w-7" />,
        badge: 'সবচেয়ে দ্রুত',
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        borderColor: 'border-emerald-500/20 hover:border-emerald-500/60',
        bgGradient: 'from-emerald-500/5 to-transparent',
        iconBg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
        iconColor: 'text-emerald-400',
        popular: true,
    },
    {
        id: 'agent',
        title: 'এজেন্ট ম্যাচ',
        subtitle: 'Agent Match',
        description: 'ডায়নামিক এজেন্ট পুল থেকে স্বয়ংক্রিয় ম্যাচিং। bKash/Nagad থেকে পেমেন্ট করুন।',
        icon: <UserCheck className="h-7 w-7" />,
        badge: 'জনপ্রিয়',
        badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        borderColor: 'border-pink-500/20 hover:border-pink-500/60',
        bgGradient: 'from-pink-500/5 to-transparent',
        iconBg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
        iconColor: 'text-pink-400',
        popular: true,
    },
    {
        id: 'crypto',
        title: 'ক্রিপ্টো ডিপোজিট',
        subtitle: 'Crypto Direct',
        description: 'BEP-20, TRC-20, TON, ERC-20 নেটওয়ার্কে সরাসরি USDT পাঠান। স্মার্ট মেমো কন্ট্রাক্টের মাধ্যমে অটো-ক্রেডিট।',
        icon: <Diamond className="h-7 w-7" />,
        badge: 'ক্রিপ্টো',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        borderColor: 'border-blue-500/20 hover:border-blue-500/60',
        bgGradient: 'from-blue-500/5 to-transparent',
        iconBg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
        iconColor: 'text-blue-400',
        popular: true,
    },
    {
        id: 'partner',
        title: 'পার্টনার তালিকা',
        subtitle: 'Partner Directory',
        description: 'যাচাইকৃত লোকাল USDT এক্সচেঞ্জারদের তালিকা। ট্রাস্ট স্কোর ও রিভিউ দিয়ে সরাসরি পার্টনার নির্বাচন করুন।',
        icon: <Users className="h-7 w-7" />,
        badge: 'যাচাইকৃত',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        borderColor: 'border-amber-500/20 hover:border-amber-500/60',
        bgGradient: 'from-amber-500/5 to-transparent',
        iconBg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
        iconColor: 'text-amber-400',
    },
    {
        id: 'p2p',
        title: 'P2P এসক্রো',
        subtitle: 'P2P Escrow',
        description: 'কমিউনিটি থেকে USDT কিনুন বিক্রি করুন। প্ল্যাটফর্ম এসক্রোয় USDT লক করে রাখে নিরাপত্তা নিশ্চিত।',
        icon: <ArrowLeftRight className="h-7 w-7" />,
        badge: 'নিরাপত্তা',
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        borderColor: 'border-purple-500/20 hover:border-purple-500/60',
        bgGradient: 'from-purple-500/5 to-transparent',
        iconBg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
        iconColor: 'text-purple-400',
    },
    {
        id: 'card',
        title: 'কার্ড ট্রান্সফার',
        subtitle: 'Card Transfer',
        description: 'RedotPay বা Bleap ভার্চুয়াল কার্ড থেকে সরাসরি USDT পাঠান। বিস্তারিত গাইড ও স্টেপ-বাই-স্টেপ নির্দেশিকা।',
        icon: <CreditCard className="h-7 w-7" />,
        borderColor: 'border-cyan-500/20 hover:border-cyan-500/60',
        bgGradient: 'from-cyan-500/5 to-transparent',
        iconBg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
        iconColor: 'text-cyan-400',
    },
    {
        id: 'moonpay',
        title: 'INXY / MoonPay',
        subtitle: 'Crypto On-Ramp',
        description: 'ব্যাঙ্ক কার্ড দিয়ে সরাসরি USDT কিনুন। ভিসা/মাস্টারকার্ড গ্রহণযোগ্য।',
        icon: <Globe className="h-7 w-7" />,
        badge: 'On-Ramp',
        badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        borderColor: 'border-indigo-500/20 hover:border-indigo-500/60',
        bgGradient: 'from-indigo-500/5 to-transparent',
        iconBg: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
        iconColor: 'text-indigo-400',
        comingSoon: true,
    },
    {
        id: 'telegram',
        title: 'টেলিগ্রাম মিনি অ্যাপ',
        subtitle: 'Telegram Mini App',
        description: 'টেলিগ্রাম থেকে সরাসরি ডিপোজিট করুন। নোটিফিকেশন সহজে পাবেন।',
        icon: <Smartphone className="h-7 w-7" />,
        badge: 'মিনি অ্যাপ',
        badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        borderColor: 'border-sky-500/20 hover:border-sky-500/60',
        bgGradient: 'from-sky-500/5 to-transparent',
        iconBg: 'bg-sky-500/10 group-hover:bg-sky-500/20',
        iconColor: 'text-sky-400',
        comingSoon: true,
    },
    {
        id: 'guide',
        title: 'নির্দেশিকা ও গাইড',
        subtitle: 'Guides',
        description: 'নতুন যুজারদের জন্য স্টেপ-বাই-স্টেপ গাইড। Binance P2P, Bitget Wallet, এবং অন্যান্য ক্রিপ্টো ওয়ালেট সেটাপ গাইড।',
        icon: <BookOpen className="h-7 w-7" />,
        borderColor: 'border-slate-500/20 hover:border-slate-500/60',
        bgGradient: 'from-slate-500/5 to-transparent',
        iconBg: 'bg-slate-500/10 group-hover:bg-slate-500/20',
        iconColor: 'text-slate-400',
        href: '/wallet/deposit/guides',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06 },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export default function DepositHub() {
    const [mode, setMode] = useState<DepositMethod>('hub');
    const [exchangeRate, setExchangeRate] = useState<number>(119.50);
    const [rateLoading, setRateLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchExchangeRate();
    }, []);

    const fetchExchangeRate = async () => {
        try {
            const { data } = await supabase
                .from('exchange_rates')
                .select('rate')
                .eq('pair', 'USDTBDT')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (data?.rate) {
                setExchangeRate(Number(data.rate));
            }
        } catch (e) {
            console.error('Rate fetch error:', e);
        } finally {
            setRateLoading(false);
        }
    };

    const handleMethodClick = (method: DepositMethodConfig) => {
        if (method.external && method.href) {
            router.push(method.href);
            return;
        }
        if (method.href && !method.external) {
            router.push(method.href);
            return;
        }
        setMode(method.id);
    };

    const getLegacyMode = (m: DepositMethod): string | null => {
        switch (m) {
            case 'agent': return 'manual';
            default: return null;
        }
    };

    const legacyMode = getLegacyMode(mode);

    if (mode !== 'hub' && legacyMode) {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
            >
                <Button
                    variant="ghost"
                    onClick={() => setMode('hub')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                >
                    <ArrowLeft size={18} />
                    ডিপোজিট হাবে ফিরে যান
                </Button>
                <DepositFlow initialMode={legacyMode as any} />
            </motion.div>
        );
    }

    if (mode === 'voucher') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                <Button
                    variant="ghost"
                    onClick={() => setMode('hub')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                >
                    <ArrowLeft size={18} />
                    ডিপোজিট হাবে ফিরে যান
                </Button>
                <VoucherDeposit />
            </motion.div>
        );
    }

    if (mode === 'partner') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                <Button
                    variant="ghost"
                    onClick={() => setMode('hub')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                >
                    <ArrowLeft size={18} />
                    ডিপোজিট হাবে ফিরে যান
                </Button>
                <PartnerDirectory />
            </motion.div>
        );
    }

    if (mode === 'crypto') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                <Button
                    variant="ghost"
                    onClick={() => setMode('hub')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                >
                    <ArrowLeft size={18} />
                    ডিপোজিট হাবে ফিরে যান
                </Button>
                <CryptoDeposit />
            </motion.div>
        );
    }

    if (mode === 'p2p') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                <Button
                    variant="ghost"
                    onClick={() => setMode('hub')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                >
                    <ArrowLeft size={18} />
                    ডিপোজিট হাবে ফিরে যান
                </Button>
                <P2PDeposit />
            </motion.div>
        );
    }

    if (mode === 'card') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                <Button
                    variant="ghost"
                    onClick={() => setMode('hub')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                >
                    <ArrowLeft size={18} />
                    ডিপোজিট হাবে ফিরে যান
                </Button>
                <CardTransfer />
            </motion.div>
        );
    }

    if (mode === 'moonpay') {
        return (
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
            >
                <Button
                    variant="ghost"
                    onClick={() => setMode('hub')}
                    className="text-slate-400 hover:text-white flex items-center gap-2 pl-0"
                >
                    <ArrowLeft size={18} />
                    ডিপোজিট হাবে ফিরে যান
                </Button>
                <OnRampDeposit />
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Header with exchange rate */}
            <motion.div variants={itemVariants} className="text-center space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                    ডিপোজিট করুন
                </h2>
                <p className="text-slate-400 text-sm md:text-base">
                    আপনার পছন্দের মাধ্যম বাছাই নির্বাচন করুন
                </p>
                <div className="inline-flex items-center gap-2 bg-slate-900/80 rounded-full px-4 py-2 border border-slate-700">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">
                        বর্তমান রেট: {rateLoading ? '...' : `৳${exchangeRate.toFixed(2)} / USDT`}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                        লাইভ
                    </Badge>
                </div>
            </motion.div>

            {/* Method Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEPOSIT_METHODS.map((method, idx) => (
                    <motion.button
                        key={method.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleMethodClick(method)}
                        disabled={method.comingSoon}
                        className={cn(
                            'group relative p-5 rounded-2xl border-2 bg-gradient-to-br transition-all text-left shadow-lg overflow-hidden',
                            method.borderColor,
                            method.bgGradient,
                            method.comingSoon && 'opacity-60 cursor-not-allowed grayscale-[0.3]'
                        )}
                    >
                        {method.popular && (
                            <div className="absolute top-3 right-3">
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    জনপ্রিয়
                                </Badge>
                            </div>
                        )}

                        {method.comingSoon && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
                                <Badge className="bg-slate-800/90 text-slate-300 border-slate-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    শীঘ্রই আসছে
                                </Badge>
                            </div>
                        )}

                        <div className="flex items-start gap-4">
                            <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                                method.iconBg
                            )}>
                                <span className={method.iconColor}>{method.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-base text-white">{method.title}</h3>
                                </div>
                                <p className="text-xs text-slate-500 mb-1.5">{method.subtitle}</p>
                                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                                    {method.description}
                                </p>
                            </div>
                        </div>

                        {method.badge && !method.popular && (
                            <div className="mt-3 flex items-center justify-between">
                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', method.badgeColor)}>
                                    {method.badge}
                                </span>
                                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                            </div>
                        )}
                        {method.popular && (
                            <div className="mt-3 flex items-center justify-end">
                                <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Security notice */}
            <motion.div
                variants={itemVariants}
                className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 flex items-start gap-4"
            >
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 shrink-0">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h4 className="font-semibold text-white text-sm mb-1">
                        নিরাপত্তা নিশ্চিত
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        আমাদের সকল ট্রানজাকশন সুরক্ষিত। যেকোনো সমস্যায় আমাদের সাথে যোগাযোগ করুন
                        <span className="text-primary font-medium"> support@polymarketbd.com </span>
                        এ মেল করুন। কর্ণক সময় আমাদের সাপোর্ট টীম সক্রিয় চ্যাটে যোগাযোগ করুন।
                    </p>
                </div>
            </motion.div>

            {/* Quick tip */}
            <motion.div
                variants={itemVariants}
                className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-3"
            >
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-amber-400 text-sm mb-1">
                        ডিপোজিট টিপস
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed space-y-1">
                        <span className="block">১. সর্বদাই বাছাই ডিপোজিট হবে গেলতে জন্য <strong>ভাউচার কোড</strong> বা <strong>এজেন্ট ম্যাচ</strong> বাছাই করুন।</span>
                        <span className="block">২. ক্রিপ্টো ব্যবহারকারীদের জন্য <strong>BEP-20 (BSC)</strong> সবচেয়ে কম ফি এবং ১২ সেকেন্ড কনফার্মেশন।</span>
                        <span className="block">৩. লেনদেনে তুলতে পারলে KYC ভেরিফিকেশন দায়া হতে পারে।</span>
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

function VoucherDeposit() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
    const supabase = createClient();

    const handleRedeem = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const { data: voucher, error: findError } = await supabase
                .from('voucher_codes')
                .select('*')
                .eq('code', code.trim().toUpperCase())
                .eq('status', 'active')
                .single();

            if (findError || !voucher) {
                setResult({ success: false, message: 'এই কোড টি ভুল বা ব্যবহার করা হয়েছে' });
                return;
            }

            if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
                setResult({ success: false, message: 'এই ভাউচারের মেয়াদ শেষ হয়েছে' });
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setResult({ success: false, message: 'থাবে লগইন করুন' });
                return;
            }

            const { error: updateError } = await supabase
                .from('voucher_codes')
                .update({
                    status: 'redeemed',
                    redeemed_by: user.id,
                    redeemed_at: new Date().toISOString(),
                })
                .eq('id', voucher.id);

            if (updateError) throw updateError;

            const { error: walletError } = await supabase.rpc('credit_wallet', {
                p_user_id: user.id,
                p_amount: voucher.usdt_value,
                p_type: 'voucher_redeem',
                p_description: `Voucher redeemed: ${voucher.code}`,
            });

            if (walletError) throw walletError;

            setResult({
                success: true,
                message: `সাফল্য! ${voucher.usdt_value} USDT আপনার ওয়ালেটে জমা হয়েছে`
            });
            setCode('');
        } catch (err: any) {
            setResult({ success: false, message: err.message || 'এক এরর হয়েছে' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl max-w-lg mx-auto">
            <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Ticket className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">ভাউচার কোড রিডিম করুন</h2>
                <p className="text-slate-400 text-sm">
                    আপনার ভাউচার কোড এখানে লিখুন এবং সরাসরি রিডিম করুন
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">ভাউচার কোড</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                        placeholder="POLY-XXXX-XXXX"
                        className="w-full h-14 bg-slate-950 border-2 border-slate-800 rounded-xl px-4 text-lg font-bold text-white tracking-widest uppercase focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-slate-700 placeholder:tracking-normal"
                    />
                </div>

                <Button
                    onClick={handleRedeem}
                    disabled={loading || !code.trim()}
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl"
                >
                    {loading ? 'প্রসেসিং...' : 'রিডিম করুন'}
                </Button>

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            'p-4 rounded-xl text-center text-sm font-medium',
                            result.success
                                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                        )}
                    >
                        {result.message}
                    </motion.div>
                )}
            </div>

            <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">ভাউচার কোড কিথায় পাবেন?</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    আপনি আমাদের যেকোনো যুগ্ম পার্টনার বা প্রতিনিধি থেকে ভাউচার কোড কিনতে পারবেন।
                    তারপর আমাদের টেলিগ্রাম চ্যানেলে যোগার করুন: @polymarketbd_support
                </p>
            </div>
        </div>
    );
}

function PartnerDirectory() {
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        const { data } = await supabase
            .from('partner_exchangers')
            .select('*')
            .eq('status', 'verified')
            .order('trust_score', { ascending: false })
            .limit(50);
        setPartners(data || []);
        setLoading(false);
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-2xl">
            <div className="text-center space-y-2 mb-6">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">পার্টনার তালিকা</h2>
                <p className="text-slate-400 text-sm">
                    যাচাইকৃত লোকাল USDT এক্সচেঞ্জারদের তালিকা
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">লোড হচ্ছে...</div>
            ) : partners.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">এখনো কোনো পার্টনার নেই</p>
                    <p className="text-slate-500 text-sm mt-1">
                        আমরা শীঘ্রই পার্টনার যোগ করছি। শীঘ্রই দেখানোর জন্য কিছুক্ষণ পরে রাখুন।
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {partners.map((partner) => (
                        <motion.div
                            key={partner.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-white">{partner.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                                            ট্রাস্ট {partner.trust_score}/100
                                        </Badge>
                                        {partner.commission_rate > 0 && (
                                            <Badge variant="outline" className="text-slate-400 border-slate-600">
                                                কমিশন {(partner.commission_rate * 100).toFixed(1)}%
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {partner.telegram && (
                                        <a
                                            href={`https://t.me/${partner.telegram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-sky-500/10 rounded-lg text-sky-400 hover:bg-sky-500/20 transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
                                    {partner.whatsapp && (
                                        <a
                                            href={`https://wa.me/${partner.whatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-green-500/10 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                            {partner.location && (
                                <p className="text-xs text-slate-500 mt-2">📍 {partner.location}</p>
                            )}
                            {partner.total_volume_usdt > 0 && (
                                <p className="text-xs text-slate-500 mt-1">
                                    সর্বমোট {partner.total_volume_usdt.toLocaleString()} USDT ট্রেড হয়েছে
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
