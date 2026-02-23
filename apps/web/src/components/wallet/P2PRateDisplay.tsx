'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, ArrowRight, DollarSign, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useExchangeRateSSE, useAutoRefreshRate } from '@/lib/realtime/exchange-rate-sse';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ExchangeRate {
    usdt_to_bdt: number;
    bdt_to_usdt: number;
    source: 'binance_p2p' | 'binance_spot' | 'manual';
    fetched_at: string;
    buy_rate?: number;
    sell_rate?: number;
}

interface P2PRateDisplayProps {
    showCalculator?: boolean;
    compact?: boolean;
    className?: string;
}

export function P2PRateDisplay({ showCalculator = false, compact = false, className = '' }: P2PRateDisplayProps) {
    const { t } = useTranslation();
    const { rate, loading, error, lastUpdated, refresh } = useAutoRefreshRate(60);
    const { isConnected } = useExchangeRateSSE(true);
    const [calculatorAmount, setCalculatorAmount] = useState('');
    const [calculatorFrom, setCalculatorFrom] = useState<'usdt' | 'bdt'>('usdt');
    const [prevRate, setPrevRate] = useState<number | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (rate?.usdt_to_bdt && prevRate === null) {
            setPrevRate(rate.usdt_to_bdt);
        }
    }, [rate, prevRate]);

    const handleRefresh = async () => {
        // setLoading(true); // Removed setLoading(true) from here
        try {
            // Try Binance P2P first
            const response = await fetch('/api/exchange-rate/refresh', { method: 'POST' });
            const data = await response.json();
            if (data.rate) {
                setPrevRate(rate?.usdt_to_bdt || null);
            }
            await refresh();
        } catch (e) {
            console.error('Refresh error:', e);
        } finally {
            // setLoading(false); // Removed setLoading(false) from here
        }
    };

    const currentRate = rate?.usdt_to_bdt || 120;
    const rateChange = prevRate ? ((currentRate - prevRate) / prevRate) * 100 : 0;
    const isPositive = rateChange >= 0;

    const calculateConversion = useCallback((amount: number, from: 'usdt' | 'bdt') => {
        if (from === 'usdt') {
            return amount * currentRate;
        } else {
            return amount / currentRate;
        }
    }, [currentRate]);

    const convertedAmount = calculatorAmount ? calculateConversion(parseFloat(calculatorAmount) || 0, calculatorFrom) : 0;

    if (compact) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <span className="text-lg font-bold">৳{currentRate.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">/USDT</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                    className="h-6 w-6 p-0"
                >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        );
    }

    return (
        <Card className={`bg-gradient-to-br from-slate-900 to-slate-800 text-white ${className}`}>
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">USDT/BDT {t('wallet.exchange_rate', 'এক্সচেঞ্জ রেট')}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold">৳{currentRate.toFixed(2)}</span>
                                {rateChange !== 0 && (
                                    <span className={`flex items-center text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                        {Math.abs(rateChange).toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        disabled={loading}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-700"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {t('common.refresh', 'রিফ্রেশ')}
                    </Button>
                </div>

                {/* Buy/Sell Rates */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">কেনার রেট (Buy)</p>
                        <p className="text-xl font-bold text-green-400">
                            ৳{(rate?.buy_rate || currentRate).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">১ USDT = ৳{(rate?.buy_rate || currentRate).toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-slate-400 text-sm mb-1">বিক্রয়ের রেট (Sell)</p>
                        <p className="text-xl font-bold text-red-400">
                            ৳{(rate?.sell_rate || currentRate * 0.99).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">১ USDT = ৳{(rate?.sell_rate || currentRate * 0.99).toFixed(2)}</p>
                    </div>
                </div>

                {/* Source & Last Updated */}
                <div className="flex items-center justify-between text-sm text-slate-400 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                            Binance P2P
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs">{t('wallet.live_exchange_rate')}</span>
                            <span className="flex h-2 w-2 relative">
                                <span className={cn(
                                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                    isConnected ? "bg-emerald-400" : "bg-slate-400"
                                )}></span>
                                <span className={cn(
                                    "relative inline-flex rounded-full h-2 w-2",
                                    isConnected ? "bg-emerald-500" : "bg-slate-500"
                                )}></span>
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                            {t('common.updated', 'আপডেট')}: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : t('common.just_now', 'এখনই')}
                        </span>
                    </div>
                </div>

                {/* Calculator */}
                {showCalculator && (
                    <div className="bg-slate-800/30 rounded-lg p-4">
                        <p className="text-sm text-slate-300 mb-3 font-medium">ক্যালকুলেটর</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={calculatorAmount}
                                    onChange={(e) => setCalculatorAmount(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <select
                                    value={calculatorFrom}
                                    onChange={(e) => setCalculatorFrom(e.target.value as 'usdt' | 'bdt')}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="usdt">USDT</option>
                                    <option value="bdt">BDT</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-center">
                                <ArrowRight className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                        <div className="mt-3 p-3 bg-emerald-500/10 rounded-lg text-center">
                            <p className="text-slate-400 text-sm">
                                {calculatorFrom === 'usdt' ? 'আপনি পাবেন' : 'আপনাকে দিতে হবে'}
                            </p>
                            <p className="text-2xl font-bold text-emerald-400">
                                {calculatorFrom === 'usdt' ? '৳' : '₿'}{convertedAmount.toFixed(2)}
                                <span className="text-sm font-normal text-slate-400 ml-1">
                                    {calculatorFrom === 'usdt' ? 'BDT' : 'USDT'}
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">⚠️ {error}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Compact version for navbar
export function P2PRateCompact() {
    return <P2PRateDisplay compact />;
}

// Full version for wallet page
export function P2PRateFull() {
    return <P2PRateDisplay showCalculator />;
}