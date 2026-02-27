'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Droplets, Users } from 'lucide-react';
import { formatBDT } from '@/lib/utils/formatUtils';

interface MarketStatsBannerProps {
    marketId: string;
    initialVolume?: number;
    initialLiquidity?: number;
}

export function MarketStatsBanner({ marketId, initialVolume = 0, initialLiquidity = 0 }: MarketStatsBannerProps) {
    const [stats, setStats] = useState({
        volume: initialVolume,
        liquidity: initialLiquidity,
        traders: 0,
    });

    const fetchStats = async () => {
        const supabase = createClient();
        const [tradesRes, positionsRes] = await Promise.all([
            supabase.from('trades').select('price,quantity').eq('market_id', marketId),
            supabase.from('positions').select('user_id').eq('market_id', marketId),
        ]);

        const volume = (tradesRes.data || []).reduce((sum: number, t: any) => sum + t.price * t.quantity, 0);
        const tradersCount = new Set((positionsRes.data || []).map((p: any) => p.user_id)).size;

        setStats(prev => ({
            ...prev,
            volume: volume || initialVolume,
            traders: tradersCount
        }));
    };

    useEffect(() => {
        fetchStats();

        const supabase = createClient();
        const channel = supabase
            .channel(`market-stats:${marketId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'trades',
                filter: `market_id=eq.${marketId}`,
            }, () => fetchStats())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [marketId]);

    return (
        <div className="flex flex-wrap gap-4 py-3 px-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/40">
            <StatItem
                icon={<TrendingUp className="w-4 h-4 text-green-400" />}
                label="মোট ভলিউম"
                value={formatBDT(stats.volume)}
            />
            <span className="text-slate-600 self-center hidden sm:block">·</span>
            <StatItem
                icon={<Droplets className="w-4 h-4 text-blue-400" />}
                label="লিকুইডিটি"
                value={formatBDT(stats.liquidity)}
            />
            <span className="text-slate-600 self-center hidden sm:block">·</span>
            <StatItem
                icon={<Users className="w-4 h-4 text-purple-400" />}
                label="ট্রেডার"
                value={`${stats.traders}+`}
            />
        </div>
    );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-slate-400 text-sm whitespace-nowrap">{label}:</span>
            <span className="text-white font-semibold text-sm">{value}</span>
        </div>
    );
}
