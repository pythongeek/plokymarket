'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ExternalLink, BadgeCheck, Wallet } from 'lucide-react';
import { useState } from 'react';

interface Seller {
    seller_id: string;
    nickname: string;
    price_bdt: number;
    available_usdt: string;
    limits: string;
    completion_rate: string;
    verified: boolean;
}

interface Props {
    sellers: Seller[];
    amount: number;
    method: 'bkash' | 'nagad';
    affiliateLink: string;
}

export default function SellerList({ sellers, amount, method, affiliateLink }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const bestSeller = sellers[0]; // Lowest price

    return (
        <div className="space-y-4">
            {/* Best Deal Highlight */}
            {bestSeller && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-2 border-green-500 rounded-2xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-2xl text-sm font-bold">
                        সেরা দাম
                    </div>

                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{bestSeller.nickname}</h3>
                                {bestSeller.verified && (
                                    <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-100 dark:fill-blue-900" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">যাচাইকৃত মার্চেন্ট</p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-green-600">৳{bestSeller.price_bdt}</p>
                            <p className="text-sm text-gray-500">প্রতি USDT</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                            <p className="text-gray-600 dark:text-gray-400 mb-1">সীমা</p>
                            <p className="font-semibold">{bestSeller.limits}</p>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                            <p className="text-gray-600 dark:text-gray-400 mb-1">সফলতার হার</p>
                            <p className="font-semibold text-green-700 dark:text-green-400">{bestSeller.completion_rate}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-black/40 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-900">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600 dark:text-gray-400">আপনি পাবেন:</span>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {(amount / bestSeller.price_bdt).toFixed(2)} USDT
                            </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>বিনিময় হার:</span>
                            <span>৳{bestSeller.price_bdt}/USDT</span>
                        </div>
                    </div>

                    <a
                        href={affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                        এই সেলারের কাছ থেকে কিনুন
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </motion.div>
            )}

            {/* Other Sellers */}
            <div className="space-y-3">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 px-2">অন্যান্য সেলার</h4>

                {sellers.slice(1).map((seller, index) => (
                    <motion.div
                        key={seller.seller_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedId(selectedId === seller.seller_id ? null : seller.seller_id)}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedId === seller.seller_id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 bg-white dark:bg-slate-900'
                            }`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-400">
                                    {seller.nickname.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-bold text-gray-900 dark:text-white">{seller.nickname}</h5>
                                        {seller.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <p className="text-xs text-gray-500">{seller.completion_rate} সফল ট্রেড</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="font-bold text-lg text-gray-900 dark:text-white">৳{seller.price_bdt}</p>
                                <p className="text-xs text-gray-500">{seller.available_usdt}</p>
                            </div>
                        </div>

                        {selectedId === seller.seller_id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900"
                            >
                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">লিমিট:</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{seller.limits}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-400">পেমেন্ট:</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{method === 'bkash' ? 'bKash' : 'Nagad'}</p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-black/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-900">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">আপনি পাবেন:</p>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {(amount / seller.price_bdt).toFixed(2)} USDT
                                    </p>
                                </div>

                                <a
                                    href={affiliateLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    বাইন্যান্সে ট্রেড করুন
                                </a>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 mt-6">
                <h4 className="font-bold text-yellow-900 dark:text-yellow-400 mb-2 flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    কীভাবে কিনবেন:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
                    <li>উপরের লিংকে ক্লিক করে বাইন্যান্সে <strong>নতুন অ্যাকাউন্ট</strong> খুলুন (আমাদের রেফারেল)</li>
                    <li>P2P ট্রেডিং সেকশনে যান এবং <strong>{method === 'bkash' ? 'bKash' : 'Nagad'}</strong> সিলেক্ট করুন</li>
                    <li>উপরের সেলারদের একজনকে খুঁজুন (নাম মিলিয়ে)</li>
                    <li>আপনার পরিমাণ (৳{amount}) এন্টার করে <strong>Buy USDT</strong> করুন</li>
                    <li>bKash/Nagad থেকে টাকা পাঠান এবং <strong>Confirm</strong> করুন</li>
                    <li>USDT পেলে আমাদের প্ল্যাটফর্মে ফিরে এসে ডিপোজিট কনফার্ম করুন</li>
                </ol>
            </div>
        </div>
    );
}
