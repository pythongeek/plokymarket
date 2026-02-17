'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SellerList from './SellerList';
import LoadingStates from './LoadingStates';
import AffiliateBanner from './AffiliateBanner';
import ManualAgentDeposit from '@/components/deposit/ManualAgentDeposit';
import { AlertCircle, RefreshCw, Smartphone, Zap, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Seller {
    seller_id: string;
    nickname: string;
    price_bdt: number;
    available_usdt: string;
    limits: string;
    completion_rate: string;
    verified: boolean;
}

export default function P2PDepositContainer() {
    const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
    const [amount, setAmount] = useState<string>('1000');
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [affiliateLink, setAffiliateLink] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<'p2p' | 'manual'>('p2p');
    const [adminSettings, setAdminSettings] = useState({
        binance_p2p_scrape: true,
        manual_agent_processing: true,
        show_rate_comparison: true
    });
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('admin_settings')
                .select('value')
                .eq('key', 'deposit_modes')
                .single();
            if (data?.value) {
                setAdminSettings(data.value);
                // If P2P is disabled but Manual is enabled, switch to manual
                if (!data.value.binance_p2p_scrape && data.value.manual_agent_processing) {
                    setActiveMode('manual');
                }
            }
        };
        fetchSettings();
    }, []);

    const fetchSellers = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/binance-p2p?method=${method}&amount=${amount}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            if (data.sellers && data.sellers.length > 0) {
                setSellers(data.sellers);
            }
            setAffiliateLink(data.affiliate_link || '');
            if (data.scraped_at) setLastUpdated(new Date(data.scraped_at));

            // If still scraping, poll again in 5 seconds
            if (data.status === 'scraping' || data.status === 'initiating') {
                setTimeout(fetchSellers, 5000);
            } else {
                setLoading(false);
            }
        } catch (err) {
            setError('ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSellers();

        const interval = setInterval(fetchSellers, 120000);
        return () => clearInterval(interval);
    }, [method]);

    return (
        <div className="w-full max-w-4xl mx-auto dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-6 text-white text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    বাইন্যান্স P2P মার্কেটপ্লেস
                </h2>
                <p className="text-yellow-100 text-sm md:text-base">
                    সরাসরি বাইন্যান্স থেকে সেরা রেটে USDT কিনুন
                </p>
            </div>

            {/* Controls */}
            <div className="p-6 bg-gray-50 dark:bg-black/20 border-b dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    {/* Method Toggle */}
                    <div className="flex bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border dark:border-slate-800">
                        <button
                            onClick={() => setMethod('bkash')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${method === 'bkash'
                                ? 'bg-pink-500 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            bKash
                        </button>
                        <button
                            onClick={() => setMethod('nagad')}
                            className={`px-6 py-2 rounded-full font-bold transition-all ${method === 'nagad'
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            Nagad
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="pl-8 pr-4 py-2 border-2 border-gray-200 dark:border-slate-800 dark:bg-slate-900 rounded-xl focus:border-yellow-500 focus:outline-none font-bold text-lg w-40 text-gray-900 dark:text-white"
                            placeholder="1000"
                        />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchSellers}
                        disabled={loading}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
                        title="রিফ্রেশ করুন"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {lastUpdated && (
                    <p className="text-center text-xs text-gray-500 mt-3">
                        সর্বশেষ আপডেট: {lastUpdated.toLocaleTimeString('bn-BD')}
                    </p>
                )}
            </div>

            {/* Affiliate Banner */}
            <AffiliateBanner link={affiliateLink} />

            {/* Mode Selector */}
            {adminSettings.binance_p2p_scrape && adminSettings.manual_agent_processing && (
                <div className="flex gap-2 p-4 bg-slate-900/50 justify-center border-b dark:border-slate-800">
                    <button
                        onClick={() => setActiveMode('p2p')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${activeMode === 'p2p'
                            ? 'bg-yellow-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Zap size={18} />
                        অটোমেটেড (P2P)
                    </button>
                    <button
                        onClick={() => setActiveMode('manual')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${activeMode === 'manual'
                            ? 'bg-primary text-slate-950 shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Smartphone size={18} />
                        এজেন্ট পেমেন্ট
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                <AnimatePresence mode="wait">
                    {activeMode === 'p2p' ? (
                        <div key="p2p-pane">
                            {loading && sellers.length === 0 ? (
                                <LoadingStates key="loading" />
                            ) : error ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12 text-red-500 flex items-center justify-center gap-2"
                                >
                                    <AlertCircle />
                                    {error}
                                </motion.div>
                            ) : (
                                <SellerList
                                    key="sellers"
                                    sellers={sellers}
                                    amount={parseFloat(amount)}
                                    method={method}
                                    affiliateLink={affiliateLink}
                                />
                            )}
                        </div>
                    ) : (
                        <div key="manual-pane">
                            <ManualAgentDeposit method={method} amount={parseFloat(amount)} />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
