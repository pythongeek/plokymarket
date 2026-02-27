'use client';

import React, { useState } from 'react';
import { useBetSlipStore } from '@/store/betSlipStore';
import { ShoppingCart, X, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

export function BetSlip() {
    const { items, removeItem, clearAll, getTotalCost } = useBetSlipStore();
    const [isOpen, setIsOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);

    React.useEffect(() => {
        setHasHydrated(true);
    }, []);

    if (!hasHydrated) return null;
    if (items.length === 0 && !isOpen) return null;

    const handleSubmitAll = async () => {
        setSubmitting(true);
        try {
            const orders = items.map(item => ({
                marketId: item.marketId,
                outcome: item.outcome,
                side: item.side,
                orderType: item.orderType,
                price: item.price,
                quantity: item.quantity,
            }));

            const res = await fetch('/api/orders/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders }),
            });

            if (res.ok) {
                toast.success(`✅ ${items.length}টি অর্ডার সফলভাবে সাবমিট করা হয়েছে`);
                clearAll();
                setIsOpen(false);
            } else {
                const data = await res.json();
                toast.error(data.error || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে');
            }
        } catch (error) {
            toast.error('সার্ভারের সাথে যোগাযোগ করতে সমস্যা হয়েছে');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Floating trigger */}
            <AnimatePresence>
                {!isOpen && items.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full px-5 py-4
              shadow-2xl flex items-center gap-2 hover:bg-primary/90 transition-all group scale-110 sm:scale-100"
                    >
                        <div className="relative">
                            <ShoppingCart className="w-5 h-5" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border-2 border-primary">
                                {items.length}
                            </span>
                        </div>
                        <span className="font-bold text-sm">বেট স্লিপ</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Slide-in panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-[400px] z-[70] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <ShoppingCart className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg">🛒 বেট স্লিপ</h2>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mt-1">
                                            {items.length} টি আইটেম অপেক্ষমাণ
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-800 rounded-full transition-colors group"
                                >
                                    <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {items.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                                            <ShoppingCart className="w-8 h-8 text-slate-700" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold">স্লিপ খালি</h3>
                                            <p className="text-sm text-slate-500">আপনার স্লিপে কোনো বেট যোগ করা হয়নি।</p>
                                        </div>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 relative group hover:border-slate-700 transition-all"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-bold truncate leading-tight mb-1" title={item.marketTitle}>
                                                        {item.marketTitle}
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                                        <span className={item.outcome === 'YES' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                            {item.outcome === 'YES' ? '✅ YES' : item.outcome === 'NO' ? '❌ NO' : `📌 ${item.outcome}`}
                                                        </span>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="text-slate-400">
                                                            {item.quantity} শেয়ার @ ৳{item.price}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group/del"
                                                >
                                                    <Trash2 className="w-4 h-4 text-slate-600 group-hover/del:text-red-400" />
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[10px] text-slate-500 font-medium">উপমোট:</span>
                                                <span className="text-xs font-bold text-slate-200">৳{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {items.length > 0 && (
                                <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-xl space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">মোট খরচ</p>
                                            <span className="text-2xl font-black text-white">৳{getTotalCost().toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={clearAll}
                                            className="text-slate-500 text-xs hover:text-red-400 flex items-center gap-1 transition-colors py-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> সব মুছুন
                                        </button>
                                    </div>

                                    <Button
                                        onClick={handleSubmitAll}
                                        disabled={submitting}
                                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/20 group"
                                    >
                                        {submitting ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                সাবমিট হচ্ছে...
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-2">
                                                সব অর্ডার দিন ({items.length})
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-slate-500 text-center italic">
                                        *সাবমিট করার সাথে সাথে আপনার ব্যালেন্স থেকে টাকা কাটা হবে
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
