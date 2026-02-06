import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SpreadIndicatorProps {
    spread: number;
    bestAsk: number;
}

export function SpreadIndicator({ spread, bestAsk }: SpreadIndicatorProps) {
    const { t } = useTranslation();

    const { color, label, icon: Icon, animate } = useMemo(() => {
        // Avoid division by zero
        const spreadPercent = bestAsk > 0 ? (spread / bestAsk) * 100 : 0;

        if (spreadPercent < 0.5) {
            return {
                color: 'text-green-500',
                bg: 'bg-green-500/10',
                border: 'border-green-500/20',
                label: t('spread.excellent', { defaultValue: 'Excellent Liquidity' }),
                icon: CheckCircle2,
                animate: false
            };
        } else if (spreadPercent < 2) {
            return {
                color: 'text-yellow-500',
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500/20',
                label: t('spread.good', { defaultValue: 'Good Conditions' }),
                icon: Activity,
                animate: false
            };
        } else if (spreadPercent < 5) {
            return {
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
                border: 'border-orange-500/20',
                label: t('spread.caution', { defaultValue: 'Caution Advised' }),
                icon: AlertTriangle,
                animate: true
            };
        } else {
            return {
                color: 'text-red-500',
                bg: 'bg-red-500/10',
                border: 'border-red-500/20',
                label: t('spread.illiquid', { defaultValue: 'High Slippage Risk' }),
                icon: AlertTriangle,
                animate: true
            };
        }
    }, [spread, bestAsk, t]);

    return (
        <div className={cn("flex items-center gap-2 text-xs px-2 py-1 rounded border", color.replace('text-', 'border-').replace('500', '500/20'), color.replace('text-', 'bg-').replace('500', '500/5'))}>
            <Icon className={cn("h-3 w-3", animate && (color.includes('red') ? "animate-pulse" : "animate-bounce"))} />
            <span className={cn("font-medium", color)}>
                {t('order_book.spread')}: ৳{spread.toFixed(3)}
            </span>
            <span className="text-muted-foreground/60">|</span>
            <span className={cn("font-medium", color)}>
                {label}
            </span>
        </div>
    );
}
