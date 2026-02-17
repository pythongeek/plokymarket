'use client';

import { motion } from 'framer-motion';
import { Loader2, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';

const messages = [
    {
        icon: Sparkles,
        text: "আমরা আপনার জন্য সেরা অফারটি বাইন্যান্স থেকে আদায় করে নেওয়ার সর্বোচ্চ চেষ্টা করছি...",
        subtext: "Scanning 500+ active sellers"
    },
    {
        icon: Shield,
        text: "যাচাইকৃত সেলারদের তালিকা সংগ্রহ করা হচ্ছে...",
        subtext: "Filtering trusted merchants only"
    },
    {
        icon: TrendingUp,
        text: "বর্তমান মার্কেট রেট বিশ্লেষণ করা হচ্ছে...",
        subtext: "Comparing BDT/USDT rates"
    },
    {
        icon: Zap,
        text: "নিরাপদ ট্রানজাকশনের জন্য প্রস্তুতি নেওয়া হচ্ছে...",
        subtext: "Establishing secure connection"
    }
];

export default function LoadingStates() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const msgInterval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % messages.length);
        }, 3000);

        const progressInterval = setInterval(() => {
            setProgress((prev) => Math.min(prev + 2, 90));
        }, 100);

        return () => {
            clearInterval(msgInterval);
            clearInterval(progressInterval);
        };
    }, []);

    const CurrentIcon = messages[currentIndex].icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-12 text-center space-y-6"
        >
            <div className="relative w-24 h-24 mx-auto">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-yellow-200 border-t-yellow-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <CurrentIcon className="w-10 h-10 text-yellow-600" />
                </div>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-2"
                >
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-relaxed">
                        {messages[currentIndex].text}
                    </p>
                    <p className="text-sm text-gray-500">
                        {messages[currentIndex].subtext}
                    </p>
                </motion.div>

                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                        style={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                    />
                </div>

                <p className="text-xs text-gray-400">
                    Binance P2P Marketplace থেকে রিয়েল-টাইম ডেটা সংগ্রহ করা হচ্ছে...
                </p>
            </div>
        </motion.div>
    );
}
