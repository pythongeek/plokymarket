"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface EquityPoint {
  date: string;
  value: number;
  drawdown: number;
  benchmarkValue?: number;
}

export interface RollingMetricPoint {
  date: string;
  value: number;
}

export interface WinLossDistribution {
  range: string;
  wins: number;
  losses: number;
}

export interface CalendarDay {
  date: string;
  pnl: number;
  trades: number;
}

export interface PerformanceData {
  equity: EquityPoint[];
  rollingSharpe: RollingMetricPoint[];
  rollingVolatility: RollingMetricPoint[];
  winLossDistribution: WinLossDistribution[];
  calendar: CalendarDay[];
  streaks: {
    currentWinStreak: number;
    currentLossStreak: number;
    maxWinStreak: number;
    maxLossStreak: number;
  };
  benchmarks: {
    sp500: number;
    cryptoIndex: number;
    predictionMarketAvg: number;
  };
}

// Exchange rate
const USD_TO_BDT = 110;

export function usePerformanceCharts(userId?: string, timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL' = '6M') {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case '1M': startDate.setMonth(startDate.getMonth() - 1); break;
        case '3M': startDate.setMonth(startDate.getMonth() - 3); break;
        case '6M': startDate.setMonth(startDate.getMonth() - 6); break;
        case '1Y': startDate.setFullYear(startDate.getFullYear() - 1); break;
        case 'ALL': startDate.setTime(0); break;
      }

      // Fetch trades (both as maker and taker)
      const { data: makerTrades, error: makerError } = await supabase
        .from('trades')
        .select(`
          *,
          markets:market_id (question, category, status, winning_outcome)
        `)
        .eq('maker_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const { data: takerTrades, error: takerError } = await supabase
        .from('trades')
        .select(`
          *,
          markets:market_id (question, category, status, winning_outcome)
        `)
        .eq('taker_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (makerError) throw makerError;
      if (takerError) throw takerError;

      // Fetch positions
      const { data: positions } = await supabase
        .from('positions')
        .select(`
          *,
          markets:market_id (question, category, status, winning_outcome)
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      // Combine all trades and infer buy/sell side
      const allTrades = [
        ...(makerTrades || []).map((t: any) => {
          const isTakerBuyer = t.taker_side === 'BUY';
          return { ...t, userSide: isTakerBuyer ? 'sell' : 'buy' }
        }),
        ...(takerTrades || []).map((t: any) => {
          const isTakerBuyer = t.taker_side === 'BUY';
          return { ...t, userSide: isTakerBuyer ? 'buy' : 'sell' }
        })
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // Build equity curve from trades
      // Starting with mock initial capital (would come from wallet history)
      let runningValue = 10000;
      let peak = runningValue;
      const equity: EquityPoint[] = [];

      // Group trades by date
      const tradesByDate = new Map<string, typeof allTrades>();
      allTrades.forEach(trade => {
        const date = trade.created_at.split('T')[0];
        if (!tradesByDate.has(date)) {
          tradesByDate.set(date, []);
        }
        tradesByDate.get(date)!.push(trade);
      });

      // Build equity curve
      const sortedDates = Array.from(tradesByDate.keys()).sort();
      sortedDates.forEach(date => {
        const dayTrades = tradesByDate.get(date) || [];
        let dayPnl = 0;

        dayTrades.forEach(trade => {
          // For prediction markets:
          // Buying: cost = price * quantity (negative PnL initially)
          // Selling: revenue = price * quantity (positive PnL)
          // Resolution: if won, receive 1 * quantity; if lost, receive 0

          if (trade.userSide === 'buy') {
            dayPnl -= trade.price * trade.quantity;
          } else {
            dayPnl += trade.price * trade.quantity;
          }
        });

        runningValue += dayPnl;
        if (runningValue > peak) peak = runningValue;
        const drawdown = peak > 0 ? ((peak - runningValue) / peak) * 100 : 0;

        equity.push({
          date,
          value: runningValue,
          drawdown,
          benchmarkValue: runningValue * 1.02 // Mock benchmark
        });
      });

      // If no trades, create a flat equity curve
      if (equity.length === 0) {
        const today = new Date().toISOString().split('T')[0];
        equity.push({
          date: today,
          value: runningValue,
          drawdown: 0,
          benchmarkValue: runningValue
        });
      }

      // Calculate rolling Sharpe (30-day window) - simplified
      const rollingSharpe: RollingMetricPoint[] = [];
      for (let i = 30; i < equity.length; i++) {
        const windowReturns = equity.slice(i - 30, i).map((d, idx) => {
          if (idx === 0) return 0;
          return ((d.value - equity[i - 30 + idx - 1].value) / equity[i - 30 + idx - 1].value) * 100;
        }).slice(1);

        if (windowReturns.length > 0) {
          const avgReturn = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
          const variance = windowReturns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / windowReturns.length;
          const stdDev = Math.sqrt(variance) || 1;
          const sharpe = stdDev > 0 ? (avgReturn - 0.05) / stdDev : 0;

          rollingSharpe.push({
            date: equity[i].date,
            value: sharpe * Math.sqrt(365)
          });
        }
      }

      // Calculate rolling volatility
      const rollingVolatility: RollingMetricPoint[] = [];
      for (let i = 30; i < equity.length; i++) {
        const windowReturns = equity.slice(i - 30, i).map((d, idx) => {
          if (idx === 0) return 0;
          return ((d.value - equity[i - 30 + idx - 1].value) / equity[i - 30 + idx - 1].value) * 100;
        }).slice(1);

        if (windowReturns.length > 0) {
          const avgReturn = windowReturns.reduce((a, b) => a + b, 0) / windowReturns.length;
          const variance = windowReturns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / windowReturns.length;

          rollingVolatility.push({
            date: equity[i].date,
            value: Math.sqrt(variance) * Math.sqrt(365)
          });
        }
      }

      // Win/Loss distribution based on resolved positions
      const distribution: WinLossDistribution[] = [
        { range: '< -$500', wins: 0, losses: 0 },
        { range: '-$500 to -$100', wins: 0, losses: 0 },
        { range: '-$100 to $0', wins: 0, losses: 0 },
        { range: '$0 to $100', wins: 0, losses: 0 },
        { range: '$100 to $500', wins: 0, losses: 0 },
        { range: '> $500', wins: 0, losses: 0 }
      ];

      // Calculate PnL from resolved positions
      positions?.forEach((pos: any) => {
        if (pos.markets?.status === 'resolved') {
          const entryPrice = pos.average_price || 0;
          const quantity = pos.quantity || 0;
          const won = pos.markets.winning_outcome === pos.outcome;
          const pnl = won ? (1 - entryPrice) * quantity : -entryPrice * quantity;

          const range = distribution.find(r => {
            if (r.range === '< -$500') return pnl < -500;
            if (r.range === '-$500 to -$100') return pnl >= -500 && pnl < -100;
            if (r.range === '-$100 to $0') return pnl >= -100 && pnl < 0;
            if (r.range === '$0 to $100') return pnl >= 0 && pnl < 100;
            if (r.range === '$100 to $500') return pnl >= 100 && pnl < 500;
            if (r.range === '> $500') return pnl >= 500;
            return false;
          });

          if (range) {
            if (pnl > 0) range.wins++;
            else range.losses++;
          }
        }
      });

      // Calendar data - group trades by date
      const calendar: CalendarDay[] = [];
      tradesByDate.forEach((trades, date) => {
        let pnl = 0;
        trades.forEach(trade => {
          if (trade.userSide === 'buy') {
            pnl -= trade.price * trade.quantity;
          } else {
            pnl += trade.price * trade.quantity;
          }
        });
        calendar.push({
          date,
          pnl,
          trades: trades.length
        });
      });

      // Calculate streaks from resolved positions
      let currentWinStreak = 0;
      let currentLossStreak = 0;
      let maxWinStreak = 0;
      let maxLossStreak = 0;

      const resolvedPositions = (positions || [])
        .filter((p: any) => p.markets?.status === 'resolved')
        .sort((a: any, b: any) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

      resolvedPositions.forEach((pos: any) => {
        const won = pos.markets.winning_outcome === pos.outcome;
        if (won) {
          currentWinStreak++;
          currentLossStreak = 0;
          if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
        } else {
          currentLossStreak++;
          currentWinStreak = 0;
          if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
        }
      });

      // Mock benchmark data (would fetch from external APIs in production)
      const benchmarks = {
        sp500: 12.5,
        cryptoIndex: 45.2,
        predictionMarketAvg: 18.3
      };

      setData({
        equity,
        rollingSharpe,
        rollingVolatility,
        winLossDistribution: distribution,
        calendar,
        streaks: {
          currentWinStreak,
          currentLossStreak,
          maxWinStreak,
          maxLossStreak
        },
        benchmarks
      });

      setError(null);
    } catch (err) {
      console.error('Performance Charts Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  }, [userId, timeframe]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const stats = useMemo(() => {
    if (!data?.equity.length) return null;

    const first = data.equity[0].value;
    const last = data.equity[data.equity.length - 1].value;
    const totalReturn = first > 0 ? ((last - first) / first) * 100 : 0;
    const maxDrawdown = data.equity.length > 0 ? Math.max(...data.equity.map(e => e.drawdown)) : 0;

    return {
      totalReturn,
      maxDrawdown,
      finalValue: last,
      finalValueBDT: last * USD_TO_BDT
    };
  }, [data]);

  return { data, stats, loading, error, refetch: fetchPerformanceData };
}
