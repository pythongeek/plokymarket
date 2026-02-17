'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Seller {
    seller_id: string;
    nickname: string;
    price_bdt: number;
    limits: string;
    available_usdt: string;
    completion_rate: string;
    verified: boolean;
}

export default function BinanceP2PSelector({
    method,
    amount,
    onSelectSeller,
    affiliateCode = 'RBA4A5YZ'
}: {
    method: 'bkash' | 'nagad';
    amount: number;
    onSelectSeller: (seller: Seller) => void;
    affiliateCode?: string;
}) {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [messages, setMessages] = useState<string[]>([]);

    const motivationalMessages = [
        "আমরা আপনার জন্য সেরা অফারটি বাইন্যান্স থেকে সংগ্রহ করছি...",
        "যাচাইকৃত সেলারদের তালিকা সংগ্রহ করা হচ্ছে...",
        "বর্তমান মার্কেট রেট বিশ্লেষণ করা হচ্ছে...",
        "নিরাপদ ট্রানজাকশনের জন্য প্রস্তুতি নেওয়া হচ্ছে..."
    ];

    useEffect(() => {
        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            setMessages(prev => [...prev, motivationalMessages[msgIndex]]);
            msgIndex = (msgIndex + 1) % motivationalMessages.length;
        }, 3000);

        const progressInterval = setInterval(() => {
            setProgress(p => Math.min(p + 10, 90));
        }, 1000);

        fetchSellers();

        return () => {
            clearInterval(msgInterval);
            clearInterval(progressInterval);
        };
    }, []);

    const fetchSellers = async () => {
        try {
            const res = await fetch(`/api/p2p-sellers?method=${method}&amount=${amount}`);
            const data = await res.json();

            if (data.status === 'scraping') {
                setTimeout(fetchSellers, 5000);
            } else if (data.sellers) {
                setSellers(data.sellers);
                setProgress(100);
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch sellers:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-orange-950/10 dark:to-yellow-950/10 border border-orange-200 dark:border-orange-900 rounded-2xl p-8 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                >
                    <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                </motion.div>

                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                    <motion.div
                        className="bg-orange-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {messages.length > 0 && (
                        <motion.p
                            key={messages.length}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-orange-800 dark:text-orange-400 font-medium text-lg"
                        >
                            {messages[messages.length - 1]}
                        </motion.p>
                    )}
                </AnimatePresence>

                <p className="text-sm text-muted-foreground mt-4">
                    এটি Binance P2P মার্কেটপ্লেস থেকে রিয়েল-টাইম ডেটা সংগ্রহ করছে
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-4 mb-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2">
                    <TrendingUp size={20} />
                    বাইন্যান্স P2P মার্কেট থেকে সরাসরি
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    নিচের লিংকে ক্লিক করে বাইন্যান্সে রেজিস্ট্রেশন করলে আপনি এবং আমরা উভয়েই বোনাস পাবো!
                </p>
                <a
                    href={`https://accounts.binance.com/en/register?ref=${affiliateCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                    বাইন্যান্সে নতুন অ্যাকাউন্ট খুলুন <ExternalLink size={14} />
                </a>
            </div>

            <div className="grid gap-3">
                {sellers.map((seller, idx) => (
                    <motion.div
                        key={seller.seller_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="hover:border-green-500 cursor-pointer transition-all hover:shadow-lg" onClick={() => onSelectSeller(seller)}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg">{seller.nickname}</h3>
                                            {seller.verified && (
                                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                    <CheckCircle size={12} /> যাচাইকৃত
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">লিমিট: {seller.limits}</p>
                                        <p className="text-sm text-muted-foreground">স্টক: {seller.available_usdt}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-green-600">৳{seller.price_bdt}</p>
                                        <p className="text-xs text-muted-foreground">প্রতি USDT</p>
                                        <p className="text-sm text-muted-foreground mt-1">{seller.completion_rate} সম্পন্ন</p>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">
                                        আপনি পাবেন: {(amount / seller.price_bdt).toFixed(2)} USDT
                                    </span>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                        এই সেলার নির্বাচন করুন
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="text-center mt-4">
                <p className="text-xs text-muted-foreground">
                    ডেটা শেষ আপডেট: {new Date().toLocaleTimeString('bn-BD')}
                </p>
            </div>
        </div>
    );
}
