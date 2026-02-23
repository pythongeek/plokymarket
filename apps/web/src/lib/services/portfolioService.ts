import { createClient } from '@/lib/supabase/server';

export interface Position {
    market_id: string;
    market_question: string;
    outcome: 'yes' | 'no';
    size: number;
    avg_price: number;
    current_price: number;
    unrealized_pnl: number;
    realized_pnl: number;
}

export interface PortfolioSummary {
    total_value: number;
    total_invested: number;
    total_pnl: number;
    positions: Position[];
}

export class PortfolioService {
    async getPortfolio(userId: string): Promise<PortfolioSummary> {
        const supabase = await createClient();

        // Query positions with joined market data
        // Schema note: using PositionDB mapping from database.ts and migrations
        const { data: positions, error } = await supabase
            .from('positions')
            .select(`
        *,
        market:markets!inner(id, question, current_yes_price, current_no_price)
      `)
            .eq('user_id', userId)
            .gt('total_shares', 0);

        if (error) {
            console.error('[PortfolioService] getPortfolio error:', error.message);
            return {
                total_value: 0,
                total_invested: 0,
                total_pnl: 0,
                positions: []
            };
        }

        if (!positions || positions.length === 0) {
            return {
                total_value: 0,
                total_invested: 0,
                total_pnl: 0,
                positions: []
            };
        }

        const formattedPositions: Position[] = positions.map(p => {
            // market join is restricted with !inner, so p.market should exist
            const market = p.market as any;

            const currentPrice = p.side === 'yes'
                ? market.current_yes_price
                : market.current_no_price;

            const invested = p.total_invested;
            const currentValue = p.total_shares * currentPrice;
            const unrealizedPnl = currentValue - invested;

            return {
                market_id: p.market_id || market.id,
                market_question: market.question,
                outcome: p.side as 'yes' | 'no',
                size: p.total_shares,
                avg_price: p.average_entry_price,
                current_price: currentPrice,
                unrealized_pnl: unrealizedPnl,
                realized_pnl: p.realized_pnl ?? 0
            };
        });

        const totalInvested = formattedPositions.reduce(
            (sum, p) => sum + (p.size * p.avg_price), 0
        );
        const totalValue = formattedPositions.reduce(
            (sum, p) => sum + (p.size * p.current_price), 0
        );

        return {
            total_value: totalValue,
            total_invested: totalInvested,
            total_pnl: totalValue - totalInvested,
            positions: formattedPositions
        };
    }

    async getTradeHistory(userId: string, limit = 50): Promise<any[]> {
        const supabase = await createClient();

        // Industry standard: maker_id and taker_id (Migration 118)
        const { data: trades, error } = await supabase
            .from('trades')
            .select(`
        *,
        market:markets(id, question)
      `)
            .or(`maker_id.eq.${userId},taker_id.eq.${userId}`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[PortfolioService] getTradeHistory error:', error.message);
        }

        return trades || [];
    }
}

export const portfolioService = new PortfolioService();
