"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export type TimeHorizon = 'intraday' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'allTime';
export type ReturnMetric = 'simple' | 'twr' | 'mwr' | 'sharpe' | 'sortino' | 'maxDrawdown';

export interface PnLData {
  realized: number;
  unrealized: number;
  total: number;
  realizedBDT: number;
  unrealizedBDT: number;
  totalBDT: number;
  returnPercentage: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  history: Array<{ date: string; value: number; bdtValue: number }>;
}

export interface PnLAttribution {
  byCategory: {
    politics: number;
    cricket: number;
    economy: number;
    weather: number;
    entertainment: number;
    other: number;
  };
  byStrategy: {
    momentum: number;
    contrarian: number;
    arbitrage: number;
    longTerm: number;
  };
  byOutcome: {
    correct: number;
    incorrect: number;
    pending: number;
  };
}

export interface TaxLossHarvestingSuggestion {
  marketId: string;
  marketName: string;
  unrealizedLoss: number;
  unrealizedLossBDT: number;
  daysHeld: number;
  potentialTaxSavings: number;
  potentialTaxSavingsBDT: number;
  action: 'harvest' | 'hold' | 'wait';
  reason: string;
}

// Exchange rate: 1 USD = 110 BDT (for prediction markets, 1 share ≈ $1)
export const USD_TO_BDT = 110;

export function usePnL(userId?: string, timeHorizon: TimeHorizon = 'allTime') {
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [attribution, setAttribution] = useState<PnLAttribution | null>(null);
  const [taxSuggestions, setTaxSuggestions] = useState<TaxLossHarvestingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPnL = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Calculate date range based on time horizon
      const now = new Date();
      let startDate = new Date(0);

      switch (timeHorizon) {
        case 'intraday':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'daily':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarterly':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'annual':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        case 'allTime':
          startDate = new Date(0);
          break;
      }

      // Fetch user's trades (both as maker and taker)
      const { data: makerTrades, error: makerError } = await supabase
        .from('trades')
        .select(`
          *,
          markets:market_id (question, category, status, winning_outcome)
        `)
        .eq('maker_id', userId)
        .gte('created_at', startDate.toISOString());

      const { data: takerTrades, error: takerError } = await supabase
        .from('trades')
        .select(`
          *,
          markets:market_id (question, category, status, winning_outcome)
        `)
        .eq('taker_id', userId)
        .gte('created_at', startDate.toISOString());

      if (makerError) throw makerError;
      if (takerError) throw takerError;

      // Fetch open positions with market data
      const { data: openPositions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          markets:market_id (question, category, status, winning_outcome, total_volume)
        `)
        .eq('user_id', userId)
        .gt('quantity', 0);

      if (positionsError) throw positionsError;

      // Calculate realized PnL from trades
      // For prediction markets:
      // - Buying YES at $0.50, selling at $0.70 = $0.20 profit per share
      // - Buying NO at $0.30, market resolves NO = $0.70 profit per share (1 - 0.30)

      let realized = 0;
      let winningTrades = 0;
      let losingTrades = 0;
      let totalWins = 0;
      let totalLosses = 0;
      const categoryPnl: Record<string, number> = {
        politics: 0, cricket: 0, economy: 0, weather: 0, entertainment: 0, other: 0
      };

      const allTrades = [
        ...(makerTrades || []).map((t: any) => {
          const isTakerBuyer = t.taker_side === 'BUY';
          return { ...t, isBuyer: isTakerBuyer ? false : true }
        }),
        ...(takerTrades || []).map((t: any) => {
          const isTakerBuyer = t.taker_side === 'BUY';
          return { ...t, isBuyer: isTakerBuyer ? true : false }
        })
      ];

      allTrades.forEach((trade: any) => {
        const category = trade.markets?.category?.toLowerCase() || 'other';
        if (categoryPnl[category] !== undefined) {
          categoryPnl[category] += 0; // Placeholder
        }
      });

      // Calculate unrealized PnL from open positions
      // For prediction markets, unrealized PnL is based on:
      // - Current market price vs average entry price
      // - If market resolves in favor, PnL = (1 - entry_price) * quantity
      // - If against, PnL = -entry_price * quantity

      let unrealized = 0;
      const suggestions: TaxLossHarvestingSuggestion[] = [];

      openPositions?.forEach((position: any) => {
        const market = position.markets;
        const entryPrice = position.average_price || 0;
        const quantity = position.quantity || 0;

        // Calculate potential PnL based on market status
        let potentialPnl = 0;

        if (market?.status === 'resolved') {
          // Market resolved - calculate final PnL
          const won = market.winning_outcome === position.outcome;
          if (won) {
            // Won: receive $1 per share
            potentialPnl = (1 - entryPrice) * quantity;
          } else {
            // Lost: lose entry cost
            potentialPnl = -entryPrice * quantity;
          }
        } else {
          // Market still active - estimate based on implied probability
          // For now, use a simple estimation
          const currentPrice = entryPrice; // Would need actual current price from order book
          potentialPnl = (currentPrice - entryPrice) * quantity;
        }

        unrealized += potentialPnl;

        // Check for tax loss harvesting opportunities
        if (potentialPnl < -50) { // Significant unrealized loss (in BDT)
          const daysHeld = Math.floor(
            (Date.now() - new Date(position.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          const lossAmount = Math.abs(potentialPnl);
          const potentialTaxSavings = lossAmount * 0.15; // 15% tax rate assumption

          suggestions.push({
            marketId: position.market_id,
            marketName: market?.question || 'Unknown Market',
            unrealizedLoss: lossAmount,
            unrealizedLossBDT: lossAmount * USD_TO_BDT,
            daysHeld,
            potentialTaxSavings,
            potentialTaxSavingsBDT: potentialTaxSavings * USD_TO_BDT,
            action: daysHeld > 30 ? 'harvest' : 'wait',
            reason: daysHeld > 30
              ? 'আপনার এই পজিশনে উল্লেখযোগ্য লোস রয়েছে। ট্যাক্স সেভিংয়ের জন্য এটি বিক্রয় করুন।'
              : '৩০ দিনের ওয়েটিং পিরিয়ড শেষ হলে ট্যাক্স হারভেস্টিং করুন।'
          });
        }
      });

      // Calculate metrics
      const totalTrades = (makerTrades?.length || 0) + (takerTrades?.length || 0);
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0;
      const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0;
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

      // Simplified Sharpe ratio calculation
      const sharpeRatio = 0; // Would need historical returns data
      const maxDrawdown = 0; // Would need equity curve data

      const totalInvested = openPositions?.reduce((sum: number, pos: any) =>
        sum + ((pos.average_price || 0) * (pos.quantity || 0)), 0) || 10000;
      const returnPercentage = totalInvested > 0 ? ((realized + unrealized) / totalInvested) * 100 : 0;

      // Generate history (mock for now, ideally derived from historic balances)
      const history = [];
      const days = timeHorizon === 'intraday' ? 24 :
        timeHorizon === 'daily' ? 24 :
          timeHorizon === 'weekly' ? 7 :
            timeHorizon === 'monthly' ? 30 :
              timeHorizon === 'quarterly' ? 90 :
                timeHorizon === 'annual' ? 365 : 180;

      let runningVal = realized + unrealized;
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        if (timeHorizon === 'intraday' || timeHorizon === 'daily') {
          date.setHours(date.getHours() - i);
        } else {
          date.setDate(date.getDate() - i);
        }

        // Add some random noise to the running value
        runningVal = runningVal * (0.995 + Math.random() * 0.01);

        history.push({
          date: date.toISOString(),
          value: runningVal,
          bdtValue: runningVal * USD_TO_BDT
        });
      }

      setPnlData({
        realized,
        unrealized,
        total: realized + unrealized,
        realizedBDT: realized * USD_TO_BDT,
        unrealizedBDT: unrealized * USD_TO_BDT,
        totalBDT: (realized + unrealized) * USD_TO_BDT,
        returnPercentage,
        sharpeRatio,
        maxDrawdown,
        winRate,
        totalTrades,
        winningTrades,
        losingTrades,
        avgWin,
        avgLoss,
        profitFactor,
        history
      });

      // Set attribution data
      setAttribution({
        byCategory: categoryPnl as PnLAttribution['byCategory'],
        byStrategy: { momentum: 0, contrarian: 0, arbitrage: 0, longTerm: 0 },
        byOutcome: {
          correct: winningTrades,
          incorrect: losingTrades,
          pending: openPositions?.length || 0
        }
      });

      setTaxSuggestions(suggestions);
      setError(null);
    } catch (err) {
      console.error('PnL Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch PnL');
    } finally {
      setLoading(false);
    }
  }, [userId, timeHorizon]);

  useEffect(() => {
    fetchPnL();
    const interval = setInterval(fetchPnL, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchPnL]);

  return { pnlData, attribution, taxSuggestions, loading, error, refetch: fetchPnL };
}
