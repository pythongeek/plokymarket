'use client';

import React from 'react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { X } from 'lucide-react';
import { TradingPanel } from './TradingPanel';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { Market } from '@/types';

interface TradingBottomSheetProps {
    open: boolean;
    onClose: () => void;
    marketId: string;
}

export function TradingBottomSheet({ open, onClose, marketId }: TradingBottomSheetProps) {
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && marketId) {
            const fetchMarket = async () => {
                setLoading(true);
                const supabase = createClient();
                const { data } = await supabase
                    .from('markets')
                    .select('*')
                    .eq('id', marketId)
                    .single();

                if (data) setMarket(data);
                setLoading(false);
            };
            fetchMarket();
        }
    }, [open, marketId]);

    return (
        <Drawer open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
            <DrawerContent className="bg-slate-950 border-slate-800">
                <DrawerHeader className="border-b border-slate-800 flex items-center justify-between p-4">
                    <DrawerTitle className="text-white text-left font-bold">ট্রেড করুন</DrawerTitle>
                    <DrawerClose asChild>
                        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </DrawerClose>
                </DrawerHeader>
                <div className="p-4 overflow-y-auto max-h-[80vh]">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : market ? (
                        <TradingPanel market={market} isPaused={market.status !== 'active'} />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                            মার্কেট খুঁজে পাওয়া যায়নি
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
