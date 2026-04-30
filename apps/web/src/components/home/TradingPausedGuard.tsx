'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TradingPausedState {
    paused: boolean;
    reason?: string;
}

export function useTradingPaused() {
    const [state, setState] = useState<TradingPausedState>({ paused: false });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchState() {
            try {
                const res = await fetch('/api/admin/site-settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.trading_paused) {
                        setState(data.trading_paused);
                    }
                }
            } catch (error) {
                console.error('[TradingPausedGuard] Failed to fetch:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchState();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('site-settings-channel')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'site_settings',
                    filter: 'id=eq.trading_paused'
                },
                (payload: { new?: { setting_value?: TradingPausedState } }) => {
                    if (payload.new && payload.new.setting_value) {
                        setState(payload.new.setting_value);
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return { isPaused: state.paused, reason: state.reason, loading };
}

interface TradingPausedOverlayProps {
    reason?: string;
}

export function TradingPausedOverlay({ reason }: TradingPausedOverlayProps) {
    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Trading Paused</h2>
                <p className="text-slate-400 mb-6">
                    {reason || 'Trading is temporarily paused. Please check back later.'}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                </button>
            </div>
        </div>
    );
}

interface TradeButtonGuardProps {
    children: React.ReactNode;
    className?: string;
}

export function TradeButtonGuard({ children, className }: TradeButtonGuardProps) {
    const { isPaused, loading } = useTradingPaused();

    if (loading) {
        return <>{children}</>;
    }

    if (isPaused) {
        return (
            <button
                disabled
                className={`${className} opacity-50 cursor-not-allowed`}
                onClick={(e) => e.preventDefault()}
            >
                {children}
            </button>
        );
    }

    return <>{children}</>;
}
