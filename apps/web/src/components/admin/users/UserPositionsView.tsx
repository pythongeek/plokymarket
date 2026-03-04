'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Percent,
    Activity,
    RefreshCw,
    Eye,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface UserPosition {
    id: string;
    market_id: string;
    user_id: string;
    outcome: 'YES' | 'NO';
    quantity: number;
    avg_price: number;
    current_value: number;
    unrealized_pnl: number;
    realized_pnl: number;
    created_at: string;
    updated_at: string;
    market_question?: string;
    market_status?: string;
}

interface UserPositionsViewProps {
    userId: string;
}

export function UserPositionsView({ userId }: UserPositionsViewProps) {
    const supabase = createClient();

    const [positions, setPositions] = useState<UserPosition[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch positions for this user
    useEffect(() => {
        const fetchPositions = async () => {
            setIsLoading(true);
            try {
                // Fetch positions
                const { data: positionsData, error: posError } = await supabase
                    .from('positions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (posError) throw posError;

                // Get unique market IDs
                const marketIds = [...new Set(positionsData?.map((p: UserPosition) => p.market_id) || [])];

                // Fetch market details
                let marketMap: Record<string, { question: string; status: string }> = {};
                if (marketIds.length > 0) {
                    const { data: marketsData } = await supabase
                        .from('markets')
                        .select('id, question, status')
                        .in('id', marketIds);

                    marketsData?.forEach((m: { id: string; question: string; status: string }) => { marketMap[m.id] = { question: m.question, status: m.status }; });
                }

                // Enrich positions with market info
                const enriched = positionsData?.map((p: UserPosition) => ({
                    ...p,
                    market_question: marketMap[p.market_id]?.question,
                    market_status: marketMap[p.market_id]?.status,
                })) || [];

                setPositions(enriched);
            } catch (error) {
                console.error('Error fetching user positions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchPositions();
        }
    }, [userId]);

    // Calculate metrics
    const metrics = useMemo(() => {
        if (positions.length === 0) {
            return { totalValue: 0, totalPnL: 0, winRate: 0, yesExposure: 0, noExposure: 0 };
        }

        const totalValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0);
        const totalUnrealized = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
        const totalRealized = positions.reduce((sum, p) => sum + (p.realized_pnl || 0), 0);
        const totalPnL = totalUnrealized + totalRealized;

        const winning = positions.filter(p => (p.realized_pnl || 0) > 0).length;
        const winRate = positions.length > 0 ? (winning / positions.length) * 100 : 0;

        const yesExposure = positions
            .filter(p => p.outcome === 'YES')
            .reduce((sum, p) => sum + (p.current_value || 0), 0);

        const noExposure = positions
            .filter(p => p.outcome === 'NO')
            .reduce((sum, p) => sum + (p.current_value || 0), 0);

        return { totalValue, totalPnL, winRate, yesExposure, noExposure };
    }, [positions]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total Value</div>
                        <div className="text-xl font-bold">${metrics.totalValue.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total P&L</div>
                        <div className={`text-xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                        <div className="text-xl font-bold">{metrics.winRate.toFixed(1)}%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">YES Exposure</div>
                        <div className="text-xl font-bold text-green-500">${metrics.yesExposure.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">NO Exposure</div>
                        <div className="text-xl font-bold text-red-500">${metrics.noExposure.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Positions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        User Positions ({positions.length})
                    </CardTitle>
                    <CardDescription>All open and closed positions for this user</CardDescription>
                </CardHeader>
                <CardContent>
                    {positions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No positions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-2">Market</th>
                                        <th className="text-left py-2 px-2">Outcome</th>
                                        <th className="text-right py-2 px-2">Qty</th>
                                        <th className="text-right py-2 px-2">Avg Price</th>
                                        <th className="text-right py-2 px-2">Value</th>
                                        <th className="text-right py-2 px-2">P&L</th>
                                        <th className="text-center py-2 px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map((position) => {
                                        const pnl = position.unrealized_pnl || 0;
                                        const isProfit = pnl >= 0;

                                        return (
                                            <tr key={position.id} className="border-b hover:bg-muted/50">
                                                <td className="py-2 px-2">
                                                    <div className="font-medium truncate max-w-[200px]" title={position.market_question}>
                                                        {position.market_question || position.market_id.substring(0, 8)}
                                                    </div>
                                                </td>
                                                <td className="py-2 px-2">
                                                    <Badge variant={position.outcome === 'YES' ? 'default' : 'destructive'}>
                                                        {position.outcome}
                                                    </Badge>
                                                </td>
                                                <td className="py-2 px-2 text-right">{position.quantity}</td>
                                                <td className="py-2 px-2 text-right">${position.avg_price.toFixed(2)}</td>
                                                <td className="py-2 px-2 text-right">${(position.current_value || 0).toFixed(2)}</td>
                                                <td className={`py-2 px-2 text-right font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isProfit ? '+' : ''}{pnl.toFixed(2)}
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <Badge variant={position.market_status === 'resolved' ? 'outline' : 'default'}>
                                                        {position.market_status || 'active'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default UserPositionsView;
