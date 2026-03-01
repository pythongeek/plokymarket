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
    const [syncing, setSyncing] = useState(false);
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
        let userId: string | null = null;

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            userId = user.id;

            await fetchBalance();

            // ✅ FIX: filter with user_id to prevent leaking data to other users
            const channel = supabase
                .channel(`wallet:${user.id}`) // unique channel per user
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'wallets',
                        filter: `user_id=eq.${user.id}`, // the main fix
                    },
                    (payload: any) => {
                        if (payload.new) {
                            // ✅ Optimistic lock: ignore stale updates if server timestamp is older
                            setBalance(prev => {
                                const incoming = payload.new as WalletBalance;
                                if (!prev) return incoming;

                                const prevTime = (prev as any).updated_at || '';
                                const newTime = (incoming as any).updated_at || '';

                                if (newTime >= prevTime) {
                                    setSyncing(false); // Update finished syncing
                                    return incoming;
                                }
                                return prev; // old data ignored
                            });
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanup = init();
        return () => { cleanup.then(fn => fn && fn()); };
    }, [fetchBalance, supabase]);

    const refreshBalance = useCallback(async () => {
        await fetchBalance();
    }, [fetchBalance]);

    return {
        balance,
        loading,
        error,
        syncing,
        setSyncing,
        refreshBalance,
        availableBalance: (balance?.usdt_balance || 0) - (balance?.locked_usdt || 0),
    };
}