"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type OrderType = 'market' | 'limit';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled';
export type TradeSide = 'buy' | 'sell';
export type OutcomeType = 'YES' | 'NO';

export interface PositionEvent {
  id: string;
  type: 'entry' | 'fill' | 'partial_fill' | 'exit' | 'market_resolution';
  timestamp: string;
  data: {
    price?: number;
    quantity?: number;
    fees?: number;
    orderType?: OrderType;
    counterparty?: string;
    outcome?: OutcomeType;
    previousPrice?: number;
    previousQuantity?: number;
  };
}

export interface PositionHistory {
  id: string;
  marketId: string;
  marketName: string;
  marketCategory: string;
  marketStatus: string;
  outcome: OutcomeType;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  fees: number;
  pnl: number;
  pnlBDT: number;
  returnPercentage: number;
  holdingPeriodDays: number;
  status: OrderStatus | 'resolved' | 'redeemed';
  orderType: OrderType;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  events: PositionEvent[];
  winningOutcome?: OutcomeType;
}

export interface PositionFilters {
  market?: string;
  dateRange?: { from: Date; to: Date };
  pnlThreshold?: { min?: number; max?: number };
  orderType?: OrderType;
  outcome?: 'win' | 'loss' | 'pending';
  status?: OrderStatus;
}

// Exchange rate
const USD_TO_BDT = 110;

export function usePositionHistory(userId?: string, filters?: PositionFilters) {
  const [positions, setPositions] = useState<PositionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPositions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch positions with market data
      let query = supabase
        .from('positions')
        .select(`
          *,
          markets:market_id (question, category, status, winning_outcome)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.market) {
        query = query.ilike('markets.question', `%${filters.market}%`);
      }

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch related orders for position history
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Fetch trades for this user
      const { data: makerTrades } = await supabase
        .from('trades')
        .select('*')
        .eq('maker_id', userId)
        .order('created_at', { ascending: false });

      const { data: takerTrades } = await supabase
        .from('trades')
        .select('*')
        .eq('taker_id', userId)
        .order('created_at', { ascending: false });

      const processedPositions: PositionHistory[] = (data || []).map((pos: any) => {
        const market = pos.markets;
        const entryPrice = pos.average_price || 0;
        const quantity = pos.quantity || 0;

        // Build event history
        const events: PositionEvent[] = [
          {
            id: `entry-${pos.id}`,
            type: 'entry',
            timestamp: pos.created_at,
            data: {
              price: entryPrice,
              quantity: quantity,
              outcome: pos.outcome
            }
          }
        ];

        // Find related orders and trades
        const relatedOrders = ordersData?.filter((o: any) =>
          o.market_id === pos.market_id && o.outcome === pos.outcome
        ) || [];

        // Add fill events from trades
        const allRelatedTrades = [
          ...makerTrades?.filter((t: any) => t.market_id === pos.market_id && t.outcome === pos.outcome).map((t: any) => {
            const isTakerBuyer = t.taker_side === 'BUY';
            return { ...t, isBuyer: !isTakerBuyer }
          }) || [],
          ...takerTrades?.filter((t: any) => t.market_id === pos.market_id && t.outcome === pos.outcome).map((t: any) => {
            const isTakerBuyer = t.taker_side === 'BUY';
            return { ...t, isBuyer: isTakerBuyer }
          }) || []
        ];

        allRelatedTrades.forEach((trade: any) => {
          events.push({
            id: `${trade.isBuyer ? 'buy' : 'sell'}-fill-${trade.id}`,
            type: trade.isBuyer ? 'fill' : 'exit',
            timestamp: trade.created_at,
            data: {
              price: trade.price,
              quantity: trade.quantity,
              outcome: trade.outcome
            }
          });
        });

        // Add market resolution event if resolved
        if (market?.status === 'resolved') {
          events.push({
            id: `resolution-${pos.market_id}`,
            type: 'market_resolution',
            timestamp: pos.updated_at,
            data: {
              outcome: market.winning_outcome,
              price: market.winning_outcome === pos.outcome ? 1 : 0
            }
          });
        }

        // Sort events by timestamp
        events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Calculate PnL
        let pnl = 0;
        let currentPrice = entryPrice;
        let status: PositionHistory['status'] = 'open';
        let exitPrice: number | undefined;

        if (market?.status === 'resolved') {
          // Market resolved
          const won = market.winning_outcome === pos.outcome;
          currentPrice = won ? 1 : 0;
          pnl = (currentPrice - entryPrice) * quantity;
          status = 'resolved';
          exitPrice = currentPrice;
        } else {
          // Market still active - use average entry as current price for now
          // In real implementation, would fetch current price from order book
          currentPrice = entryPrice;
          pnl = 0;
          status = quantity > 0 ? 'open' : 'filled';
        }

        const holdingPeriodDays = market?.status === 'resolved' && pos.updated_at
          ? Math.floor((new Date(pos.updated_at).getTime() - new Date(pos.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : Math.floor((Date.now() - new Date(pos.created_at).getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: pos.id,
          marketId: pos.market_id,
          marketName: market?.question || 'Unknown Market',
          marketCategory: market?.category || 'Other',
          marketStatus: market?.status || 'active',
          outcome: pos.outcome,
          entryPrice,
          currentPrice,
          exitPrice,
          quantity,
          filledQuantity: quantity,
          remainingQuantity: 0,
          fees: 0, // Would calculate from trades
          pnl,
          pnlBDT: pnl * USD_TO_BDT,
          returnPercentage: entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0,
          holdingPeriodDays,
          status,
          orderType: 'limit', // Default, would get from related orders
          createdAt: pos.created_at,
          updatedAt: pos.updated_at,
          closedAt: market?.status === 'resolved' ? pos.updated_at : undefined,
          events,
          winningOutcome: market?.winning_outcome
        };
      });

      // Apply PnL threshold filter
      let filteredPositions = processedPositions;
      if (filters?.pnlThreshold) {
        filteredPositions = processedPositions.filter(pos => {
          if (filters.pnlThreshold?.min !== undefined && pos.pnl < filters.pnlThreshold.min) return false;
          if (filters.pnlThreshold?.max !== undefined && pos.pnl > filters.pnlThreshold.max) return false;
          return true;
        });
      }

      // Apply outcome filter
      if (filters?.outcome) {
        filteredPositions = processedPositions.filter(pos => {
          if (filters.outcome === 'win') return pos.pnl > 0;
          if (filters.outcome === 'loss') return pos.pnl < 0;
          if (filters.outcome === 'pending') return pos.status !== 'resolved';
          return true;
        });
      }

      // Apply status filter
      if (filters?.status) {
        filteredPositions = processedPositions.filter(pos => pos.status === filters.status);
      }

      // Apply order type filter
      if (filters?.orderType) {
        filteredPositions = processedPositions.filter(pos => pos.orderType === filters.orderType);
      }

      setPositions(filteredPositions);
      setTotalCount(filteredPositions.length);
      setError(null);
    } catch (err) {
      console.error('Position History Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const exportToCSV = useCallback(() => {
    const headers = [
      'Market', 'Category', 'Outcome', 'Entry Price', 'Exit Price',
      'Quantity', 'PnL (USD)', 'PnL (BDT)', 'Return %', 'Holding Days',
      'Status', 'Created At', 'Closed At'
    ];

    const rows = positions.map(pos => [
      pos.marketName,
      pos.marketCategory,
      pos.outcome,
      pos.entryPrice,
      pos.exitPrice || pos.currentPrice,
      pos.quantity,
      pos.pnl.toFixed(2),
      pos.pnlBDT.toFixed(2),
      pos.returnPercentage.toFixed(2),
      pos.holdingPeriodDays,
      pos.status,
      new Date(pos.createdAt).toLocaleDateString('bn-BD'),
      pos.closedAt ? new Date(pos.closedAt).toLocaleDateString('bn-BD') : '-'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }, [positions]);

  const exportToJSON = useCallback(() => {
    const json = JSON.stringify(positions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [positions]);

  return {
    positions,
    loading,
    error,
    totalCount,
    refetch: fetchPositions,
    exportToCSV,
    exportToJSON
  };
}
