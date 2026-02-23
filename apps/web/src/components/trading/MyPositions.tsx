'use client';

import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface MyPositionsProps {
    marketId: string;
}

export function MyPositions({ marketId }: MyPositionsProps) {
    const { positions } = useStore();
    const { t } = useTranslation();

    const marketPositions = useMemo(() => {
        return positions.filter(p => p.market_id === marketId && p.quantity > 0);
    }, [positions, marketId]);

    if (marketPositions.length === 0) return null;

    return (
        <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    {t('trading.my_positions', 'My Positions')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {marketPositions.map((pos) => {
                    const isYes = pos.outcome === 'YES';
                    const pnlValue = pos.unrealized_pnl || 0;
                    const isWinner = pnlValue >= 0;

                    return (
                        <div key={pos.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center",
                                    isYes ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                    {isYes ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{pos.outcome}</span>
                                        <Badge variant="outline" className="text-[10px] h-4">
                                            {pos.quantity} Shares
                                        </Badge>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        Avg Price: ৳{pos.avg_price.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={cn(
                                    "font-bold text-sm",
                                    isWinner ? "text-green-500" : "text-red-500"
                                )}>
                                    {isWinner ? '+' : ''}৳{pnlValue.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                    Unrealized P&L
                                </div>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
