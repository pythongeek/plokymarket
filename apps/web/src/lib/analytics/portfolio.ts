import { Position, Trade } from '@/types';

export interface PortfolioMetrics {
    totalValue: number;
    availableBalance: number;
    lockedInPositions: number;
    realizedPnL: number;
    unrealizedPnL: number;
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
}

const RISK_FREE_RATE = 0.05; // 5% annual assumed for BDT

export function calculatePortfolioMetrics(
    positions: Position[],
    trades: Trade[],
    walletBalance: number
): PortfolioMetrics {
    const lockedInPositions = positions.reduce((sum, p) => sum + p.quantity * p.average_price, 0);
    const unrealizedPnL = positions.reduce((sum, p) => {
        const currentPrice = p.outcome === 'YES' ? (p.market?.yes_price || p.average_price) : (p.market?.no_price || p.average_price);
        return sum + (p.quantity * (currentPrice - p.average_price));
    }, 0);

    const totalValue = walletBalance + lockedInPositions + unrealizedPnL;
    const realizedPnL = positions.reduce((sum, p) => sum + p.realized_pnl, 0);

    // Simplified Sharpe Ratio calculation
    // In a real app, we'd need daily value snapshots for volatility
    const returns = trades.map(t => (t.price / 50) - 1); // Mock daily returns
    const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (returns.length || 1);
    const stdDev = Math.sqrt(variance) || 0.01;
    const sharpeRatio = (avgReturn - (RISK_FREE_RATE / 365)) / stdDev;

    // Max Drawdown calculation (simplified)
    let peak = -Infinity;
    let maxDD = 0;
    // This would typically track totalValue history
    maxDD = 0.15; // Placeholder for now without full history

    return {
        totalValue,
        availableBalance: walletBalance,
        lockedInPositions,
        realizedPnL,
        unrealizedPnL,
        totalReturn: (realizedPnL + unrealizedPnL) / (lockedInPositions || 1),
        sharpeRatio,
        maxDrawdown: maxDD
    };
}
