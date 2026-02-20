import { AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PauseBannerProps {
    reason?: string;
    pausedAt?: string;
    estimatedResumeAt?: string;
    level?: 'market' | 'category' | 'platform';
    className?: string;
}

export function PauseBanner({
    reason,
    pausedAt,
    estimatedResumeAt,
    level = 'market',
    className
}: PauseBannerProps) {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === 'bn' ? bn : enUS;

    const titleKey = level === 'platform'
        ? 'trading.platform_paused_title'
        : level === 'category'
            ? 'trading.category_paused_title'
            : 'trading.market_paused_title';

    return (
        <div className={cn(
            "relative overflow-hidden rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-4 duration-500",
            className
        )}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    {level === 'platform' ? (
                        <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    ) : (
                        <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className="font-bold leading-none tracking-tight">
                        {t(titleKey)}
                    </h3>
                    <div className="text-sm opacity-90 font-medium">
                        {level === 'platform' ? t('trading.platform_paused_desc') : reason || t('trading.status_paused')}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 opacity-80">
                        {pausedAt && (
                            <div className="flex items-center gap-1.5 text-xs">
                                <Clock className="h-3 w-3" />
                                <span>{t('trading.paused_at', { time: formatDistanceToNow(new Date(pausedAt), { addSuffix: true, locale: dateLocale }) })}</span>
                            </div>
                        )}
                        {estimatedResumeAt && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                                <Clock className="h-3 w-3" />
                                <span>{t('trading.resume_estimated', { time: formatDistanceToNow(new Date(estimatedResumeAt), { addSuffix: true, locale: dateLocale }) })}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Background decoration for a premium feel */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 h-16 w-16 rounded-full bg-amber-500/5 blur-xl" />
        </div>
    );
}
