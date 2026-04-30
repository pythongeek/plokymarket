'use client';

import { motion } from 'framer-motion';
import { Gift, ExternalLink, Users, Coins } from 'lucide-react';

interface Props {
    link: string;
}

export default function AffiliateBanner({ link }: Props) {
    if (!link) return null;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4"
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full">
                        <Gift className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">বিশেষ অফার!</h3>
                        <p className="text-sm text-blue-100">
                            আমাদের রেফারেল লিঙ্ক ব্যবহার করে বাইন্যান্সে নতুন অ্যাকাউন্ট খুলুন
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                        <Coins className="w-4 h-4" />
                        <span>ট্রেডিং ফি ছাড়</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                        <Users className="w-4 h-4" />
                        <span>আমরাও পুরস্কার পাবো</span>
                    </div>

                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-blue-600 px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-yellow-300 hover:text-blue-800 transition-all shadow-lg transform hover:scale-105"
                    >
                        এখনই রেজিস্টার করুন
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            <div className="mt-3 text-xs text-blue-200 text-center md:text-left">
                💡 টিপ: নতুন অ্যাকাউন্টে প্রথম ট্রেডে বিশেষ ছাড় পাবেন এবং আমাদের প্ল্যাটফর্মও সমর্থন করা হবে
            </div>
        </motion.div>
    );
}
