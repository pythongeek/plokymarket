'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WalletBalance {
    usdt_balance: number;
    locked_usdt: number;
    total_deposited: number;
    total_withdrawn: number;
}

export function useRealtimeBalance() {
    const [balance, setBalance] = useState<WalletBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchBalance = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setBalance(null);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fetchError) throw fetchError;
            setBalance(data);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            console.error('ব্যালেন্স লোডে সমস্যা:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchBalance();

        // Real-time subscription for balance updates
        const channel = supabase
            .channel('wallet_balance_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'wallets',
                },
                (payload: any) => {
                    if (payload.new) {
                        setBalance(payload.new as WalletBalance);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchBalance, supabase]);

    const refreshBalance = useCallback(async () => {
        await fetchBalance();
    }, [fetchBalance]);

    return {
        balance,
        loading,
        error,
        refreshBalance,
        availableBalance: (balance?.usdt_balance || 0) - (balance?.locked_usdt || 0),
    };
}