import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Clock,
    Activity,
    Gavel,
    AlertTriangle,
    Lock,
    PlayCircle,
    PauseCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Market, TradingPhase } from '@/types';
import { cn } from '@/lib/utils';

interface MarketStatusDisplayProps {
    market: Market;
    oracleConfidence?: number;
}

export function MarketStatusDisplay({ market, oracleConfidence }: MarketStatusDisplayProps) {
    const { t } = useTranslation();
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Phase configuration mapping
    const phaseConfig: Record<TradingPhase, { color: string; icon: any; label: string; description: string }> = {
        'PRE_OPEN': {
            color: 'bg-blue-500',
            icon: Clock,
            label: t('phase.pre_open', 'Pre-Open'),
            description: t('phase.desc.pre_open', 'Orders accepted, no matching.')
        },
        'CONTINUOUS': {
            color: 'bg-green-500',
            icon: PlayCircle,
            label: t('phase.continuous', 'Continuous Trading'),
            description: t('phase.desc.continuous', 'Live order matching.')
        },
        'AUCTION': {
            color: 'bg-purple-500',
            icon: Gavel,
            label: t('phase.auction', 'Auction'),
            description: t('phase.desc.auction', 'Orders accumulate, single price clearing.')
        },
        'HALTED': {
            color: 'bg-red-500',
            icon: PauseCircle,
            label: t('phase.halted', 'Halted'),
            description: t('phase.desc.halted', 'Trading suspended.')
        },
        'CLOSED': {
            color: 'bg-slate-500',
            icon: Lock,
            label: t('phase.closed', 'Closed'),
            description: t('phase.desc.closed', 'Market closed for trading.')
        }
    };

    const currentPhase = market.trading_phase || 'CONTINUOUS';
    const config = phaseConfig[currentPhase];
    const nextPhaseTime = market.next_phase_time ? new Date(market.next_phase_time) : null;

    // Countdown timer effect
    useEffect(() => {
        if (!nextPhaseTime) return;

        const updateTimer = () => {
            const now = new Date();
            if (now >= nextPhaseTime) {
                setTimeLeft(t('common.now', 'Processing...'));
                return;
            }
            setTimeLeft(formatDistanceToNow(nextPhaseTime, { addSuffix: true }));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [nextPhaseTime, t]);

    return (
        <Card className="border-l-4" style={{ borderLeftColor: `var(--${config.color.replace('bg-', '')})` }}>
            <CardContent className="p-4 flex items-center justify-between gap-4">

                {/* Phase Info */}
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full text-white", config.color)}>
                        <config.icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            {config.label}
                            {currentPhase === 'AUCTION' && (
                                <span className="animate-pulse text-xs text-purple-600 font-normal border border-purple-200 px-1 rounded">
                                    {t('auction.live', 'Live')}
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                </div>

                {/* Middle Stats - Countdown / Auction Data */}
                <div className="flex-1 flex justify-center border-x px-4 mx-2">
                    {currentPhase === 'AUCTION' && market.auction_data ? (
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground uppercase">{t('auction.clearing_price', 'Est. Clearing Price')}</div>
                            <div className="text-lg font-mono font-bold">৳{market.auction_data.indicative_price.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                                {t('auction.vol', 'Vol')}: {market.auction_data.indicative_volume.toLocaleString()}
                            </div>
                        </div>
                    ) : nextPhaseTime ? (
                        <div className="text-center">
                            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                                <Clock className="h-3 w-3" />
                                {t('phase.next_change', 'Next Phase')}
                            </div>
                            <div className="text-lg font-mono font-medium">{timeLeft}</div>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground">
                            {t('phase.no_change_scheduled', 'No scheduled changes')}
                        </div>
                    )}
                </div>

                {/* Oracle Confidence */}
                <div className="w-32 flex flex-col gap-1">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-muted-foreground">{t('oracle.confidence', 'Oracle AI')}</span>
                        <span className={cn(
                            "font-bold",
                            (oracleConfidence || 0) > 80 ? "text-green-600" : (oracleConfidence || 0) > 50 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {oracleConfidence ? `${oracleConfidence}%` : 'N/A'}
                        </span>
                    </div>
                    <Progress value={oracleConfidence || 0} className="h-2" />
                </div>

            </CardContent>
        </Card>
    );
}
