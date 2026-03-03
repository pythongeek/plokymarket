'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    DollarSign,
    Percent,
    Activity,
    BarChart3,
    Download,
    RefreshCw,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Position {
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
    market_closes_at?: string;
}

interface MarketData {
    id: string;
    question: string;
    status: string;
    trading_closes_at: string;
    total_volume?: number;
}

interface PositionDashboardProps {
    userId?: string;
}

interface Metrics {
    totalValue: number;
    totalUnrealizedPnL: number;
    totalRealizedPnL: number;
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgWin: number;
    avgLoss: number;
    largestWin: number;
    largestLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
    exposure: Record<string, number>;
    portfolioAllocation: Record<string, number>;
}

export function PositionDashboard({ userId }: PositionDashboardProps) {
    const { t } = useTranslation();
    const supabase = createClient();

    const [positions, setPositions] = useState<Position[]>([]);
    const [markets, setMarkets] = useState<Record<string, MarketData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let uid = userId;
            if (!uid) {
                const { data: { user } } = await supabase.auth.getUser();
                uid = user?.id;
            }

            if (!uid) return;

            const { data: positionsData, error: posError } = await supabase
                .from('positions')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            if (posError) throw posError;

            const marketIds = [...new Set(positionsData?.map((p: Position) => p.market_id) || [])];

            if (marketIds.length > 0) {
                const { data: marketsData } = await supabase
                    .from('markets')
                    .select('id, question, status, trading_closes_at, total_volume')
                    .in('id', marketIds);

                const marketMap: Record<string, MarketData> = {};
                marketsData?.forEach((m: MarketData) => { marketMap[m.id] = m; });
                setMarkets(marketMap);
            }

            const enrichedPositions: Position[] = positionsData?.map((p: Position) => ({
                ...p,
                market_question: markets[p.market_id]?.question,
                market_status: markets[p.market_id]?.status,
                market_closes_at: markets[p.market_id]?.trading_closes_at,
            })) || [];

            setPositions(enrichedPositions);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching positions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('positions-dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'positions' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const metrics: Metrics = useMemo(() => {
        const defaultMetrics: Metrics = {
            totalValue: 0,
            totalUnrealizedPnL: 0,
            totalRealizedPnL: 0,
            totalPnL: 0,
            winRate: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            avgWin: 0,
            avgLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            exposure: {},
            portfolioAllocation: {},
        };

        if (positions.length === 0) return defaultMetrics;

        const totalValue = positions.reduce((sum, p) => sum + (p.current_value || 0), 0);
        const totalUnrealizedPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
        const totalRealizedPnL = positions.reduce((sum, p) => sum + (p.realized_pnl || 0), 0);
        const totalPnL = totalUnrealizedPnL + totalRealizedPnL;

        const winningTrades = positions.filter(p => (p.realized_pnl || 0) > 0).length;
        const losingTrades = positions.filter(p => (p.realized_pnl || 0) < 0).length;
        const totalTrades = positions.length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        const wins = positions.filter(p => (p.realized_pnl || 0) > 0).map(p => p.realized_pnl || 0);
        const losses = positions.filter(p => (p.realized_pnl || 0) < 0).map(p => Math.abs(p.realized_pnl || 0));
        const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

        const largestWin = wins.length > 0 ? Math.max(...wins) : 0;
        const largestLoss = losses.length > 0 ? Math.max(...losses) : 0;

        const returns = positions.map(p => (p.unrealized_pnl || 0) / (p.avg_price * p.quantity || 1) * 100);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) : 0;

        let maxDrawdown = 0;
        let peak = 0;
        const sortedByDate = [...positions].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        let cumulative = 0;
        sortedByDate.forEach(p => {
            cumulative += p.unrealized_pnl || 0;
            if (cumulative > peak) peak = cumulative;
            const drawdown = (peak - cumulative) / (peak || 1) * 100;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        const exposure: Record<string, number> = { YES: 0, NO: 0 };
        positions.forEach(p => {
            exposure[p.outcome] += p.current_value || 0;
        });

        const portfolioAllocation: Record<string, number> = {};
        positions.forEach(p => {
            const question = p.market_question?.substring(0, 30) || p.market_id;
            portfolioAllocation[question] = (portfolioAllocation[question] || 0) + (p.current_value || 0);
        });

        return {
            totalValue,
            totalUnrealizedPnL,
            totalRealizedPnL,
            totalPnL,
            winRate,
            totalTrades,
            winningTrades,
            losingTrades,
            avgWin,
            avgLoss,
            largestWin,
            largestLoss,
            maxDrawdown,
            sharpeRatio,
            exposure,
            portfolioAllocation,
        };
    }, [positions]);

    // CSV Export function
    const handleExportCSV = () => {
        const headers = ['Market', 'Outcome', 'Quantity', 'Avg Price', 'Current Value', 'Unrealized P&L', 'Realized P&L', 'Status', 'Created'];
        const rows = positions.map(p => [
            p.market_question || p.market_id,
            p.outcome,
            p.quantity,
            p.avg_price,
            p.current_value || 0,
            p.unrealized_pnl || 0,
            p.realized_pnl || 0,
            p.market_status || 'unknown',
            p.created_at,
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `positions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const allocationEntries = Object.entries(metrics.portfolioAllocation)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Total Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${metrics.totalValue.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Total P&L
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Unrealized: ${metrics.totalUnrealizedPnL.toFixed(2)} | Realized: ${metrics.totalRealizedPnL.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Percent className="w-4 h-4" />
                            Win Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                            {metrics.winningTrades}W / {metrics.losingTrades}L
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Risk Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.sharpeRatio.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                            Max Drawdown: {metrics.maxDrawdown.toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Trading Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Trades</span>
                            <span className="font-medium">{metrics.totalTrades}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Winning Trades</span>
                            <span className="font-medium text-green-500">{metrics.winningTrades}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Losing Trades</span>
                            <span className="font-medium text-red-500">{metrics.losingTrades}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Win</span>
                            <span className="font-medium text-green-500">${metrics.avgWin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Loss</span>
                            <span className="font-medium text-red-500">${metrics.avgLoss.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Largest Win</span>
                            <span className="font-medium text-green-500">${metrics.largestWin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Largest Loss</span>
                            <span className="font-medium text-red-500">${metrics.largestLoss.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Exposure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">YES Positions</span>
                            <span className="font-medium">${(metrics.exposure.YES || 0).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(metrics.exposure.YES / (metrics.totalValue || 1)) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">NO Positions</span>
                            <span className="font-medium">${(metrics.exposure.NO || 0).toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${(metrics.exposure.NO / (metrics.totalValue || 1)) * 100}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Portfolio Allocation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {allocationEntries.map(([name, value], i) => (
                            <div key={i} className="flex justify-between items-center">
                                <span className="text-sm truncate max-w-[150px]" title={name}>{name}...</span>
                                <span className="font-medium">${value.toFixed(2)}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Open Positions</CardTitle>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            className="p-2 rounded-md hover:bg-muted"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="p-2 rounded-md hover:bg-muted"
                            title="Export CSV"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No open positions</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-2">Market</th>
                                        <th className="text-left py-3 px-2">Outcome</th>
                                        <th className="text-right py-3 px-2">Quantity</th>
                                        <th className="text-right py-3 px-2">Avg Price</th>
                                        <th className="text-right py-3 px-2">Current Value</th>
                                        <th className="text-right py-3 px-2">P&L</th>
                                        <th className="text-center py-3 px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positions.map((position) => {
                                        const pnl = position.unrealized_pnl || 0;
                                        const isProfit = pnl >= 0;

                                        return (
                                            <tr key={position.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-2">
                                                    <div className="font-medium truncate max-w-[200px]" title={position.market_question}>
                                                        {position.market_question || position.market_id.substring(0, 8)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {position.market_closes_at ? new Date(position.market_closes_at).toLocaleDateString() : ''}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <Badge variant={position.outcome === 'YES' ? 'default' : 'destructive'}>
                                                        {position.outcome}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-2 text-right">{position.quantity}</td>
                                                <td className="py-3 px-2 text-right">${position.avg_price.toFixed(2)}</td>
                                                <td className="py-3 px-2 text-right">${(position.current_value || 0).toFixed(2)}</td>
                                                <td className={`py-3 px-2 text-right font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isProfit ? '+' : ''}{pnl.toFixed(2)}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    {position.market_status === 'resolved' ? (
                                                        <Badge variant="outline" className="bg-gray-100">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Resolved
                                                        </Badge>
                                                    ) : position.market_status === 'paused' ? (
                                                        <Badge variant="outline" className="bg-yellow-100">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Paused
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-green-100">
                                                            <Activity className="w-3 h-3 mr-1" />
                                                            Active
                                                        </Badge>
                                                    )}
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

            {lastUpdate && (
                <div className="text-xs text-muted-foreground text-center">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}

export default PositionDashboard;
