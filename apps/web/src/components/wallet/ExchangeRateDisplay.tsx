'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ExchangeRate {
    usdt_to_bdt: number;
    bdt_to_usdt: number;
    source: string;
    fetched_at: string;
}

export function ExchangeRateDisplay() {
    const [rate, setRate] = useState<ExchangeRate | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const fetchRate = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('exchange_rates_live')
                .select('*')
                .order('fetched_at', { ascending: false })
                .limit(1)
                .single();

            if (!error && data) {
                setRate(data);
            }
        } catch (error) {
            console.error('রেট আপডেটে সমস্যা:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRate();
    }, []);

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-blue-700">বর্তমান এক্সচেঞ্জ রেট</p>
                    <p className="text-2xl font-bold text-blue-900">
                        ১ USDT = {rate ? rate.usdt_to_bdt.toFixed(2) : '১২০.০০'} BDT
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        সোর্স: {rate?.source === 'binance_p2p' ? 'Binance P2P' : 'ডিফল্ট'} |
                        আপডেট: {rate ? new Date(rate.fetched_at).toLocaleTimeString('bn-BD') : 'এখনই'}
                    </p>
                </div>
                <Button
                    onClick={fetchRate}
                    disabled={loading}
                    variant="outline"
                    size="icon"
                    className="ml-4"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </div>
    );
}