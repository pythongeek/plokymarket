'use client';

/**
 * useMarketProposals Hook
 * Manages AI market proposal generation and approval
 */

import { useState, useCallback } from 'react';
import { 
  proposeMarkets, 
  ProposedMarket, 
  MarketProposalResult 
} from '@/lib/ai-agents/market-proposal-agent';
import { eventMarketSync, EventMarketCreationResult } from '@/lib/services/EventMarketSync';

interface UseMarketProposalsOptions {
  onSuccess?: (result: EventMarketCreationResult) => void;
  onError?: (error: Error) => void;
}

interface UseMarketProposalsReturn {
  // State
  proposals: MarketProposalResult | null;
  isGenerating: boolean;
  isCreating: boolean;
  error: string | null;
  lastResult: EventMarketCreationResult | null;
  
  // Actions
  generateProposals: (params: GenerateParams) => Promise<void>;
  createEventWithMarkets: (params: CreateParams) => Promise<void>;
  reset: () => void;
}

interface GenerateParams {
  title: string;
  description?: string;
  category?: string;
}

interface CreateParams {
  event: {
    title: string;
    question?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    tags?: string[];
    image_url?: string;
    trading_closes_at?: string;
    resolution_method?: string;
    resolution_delay_hours?: number;
    initial_liquidity?: number;
    is_featured?: boolean;
    answer1?: string;
    answer2?: string;
  };
  markets: ProposedMarket[];
  createdBy: string;
}

export function useMarketProposals(options: UseMarketProposalsOptions = {}): UseMarketProposalsReturn {
  const [proposals, setProposals] = useState<MarketProposalResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<EventMarketCreationResult | null>(null);

  /**
   * Generate AI market proposals
   */
  const generateProposals = useCallback(async (params: GenerateParams) => {
    setIsGenerating(true);
    setError(null);
    setProposals(null);

    try {
      const result = await proposeMarkets({
        title: params.title,
        description: params.description,
        category: params.category,
        outcomes: [],
      });

      setProposals(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate proposals';
      setError(errorMessage);
      options.onError?.(err as Error);
    } finally {
      setIsGenerating(false);
    }
  }, [options]);

  /**
   * Create event with selected markets
   */
  const createEventWithMarkets = useCallback(async (params: CreateParams) => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await eventMarketSync.createEventWithMarkets({
        event: params.event,
        markets: params.markets,
        createdBy: params.createdBy,
      });

      setLastResult(result);

      if (result.success) {
        options.onSuccess?.(result);
      } else {
        setError(result.error || 'Creation failed');
        options.onError?.(new Error(result.error || 'Creation failed'));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Creation failed';
      setError(errorMessage);
      options.onError?.(err as Error);
    } finally {
      setIsCreating(false);
    }
  }, [options]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setProposals(null);
    setIsGenerating(false);
    setIsCreating(false);
    setError(null);
    setLastResult(null);
  }, []);

  return {
    proposals,
    isGenerating,
    isCreating,
    error,
    lastResult,
    generateProposals,
    createEventWithMarkets,
    reset,
  };
}

/**
 * Hook for quick market type detection
 */
export function useQuickMarketType() {
  const [marketType, setMarketType] = useState<{ type: string; confidence: number } | null>(null);

  const detect = useCallback((title: string) => {
    import('@/lib/ai-agents/market-proposal-agent').then(({ quickMarketTypeDetect }) => {
      setMarketType(quickMarketTypeDetect(title));
    });
  }, []);

  return { marketType, detect };
}
