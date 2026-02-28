import { useState, useCallback } from 'react';
import {
  proposeMarkets,
  ProposedMarket,
  MarketProposalResult
} from '@/lib/ai-agents/market-proposal-agent';

export interface EventMarketCreationResult {
  success: boolean;
  eventId?: string;
  marketIds?: string[];
  slug?: string;
  error?: string;
}

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
   * Create event with selected markets via API route
   */
  const createEventWithMarkets = useCallback(async (params: CreateParams) => {
    setIsCreating(true);
    setError(null);

    try {
      // Map markets to API payload format
      const marketsData = params.markets.map(market => ({
        question: market.question || market.name,
        description: market.description || '',
        outcomes: market.outcomes || ['Yes', 'No'],
        liquidity: market.suggestedLiquidity || params.event.initial_liquidity || 1000,
        trading_fee: market.tradingFee || 0.02,
        min_trade_amount: 10,
        max_trade_amount: 10000,
        trading_closes_at: params.event.trading_closes_at ? new Date(params.event.trading_closes_at).toISOString() : null,
      }));

      const payload = {
        event_data: {
          title: params.event.title,
          question: params.event.question || params.event.title,
          description: params.event.description || null,
          category: params.event.category,
          subcategory: params.event.subcategory || null,
          tags: params.event.tags || [],
          image_url: params.event.image_url || null,
          trading_closes_at: params.event.trading_closes_at ? new Date(params.event.trading_closes_at).toISOString() : null,
          resolution_method: params.event.resolution_method || 'manual_admin',
          initial_liquidity: params.event.initial_liquidity || 1000,
          is_featured: params.event.is_featured || false,
          b_parameter: 100
        },
        markets_data: marketsData,
        resolution_config: {
          method: params.event.resolution_method || 'manual_admin',
          ai_keywords: [],
          ai_sources: [],
          confidence_threshold: 85,
        }
      };

      const response = await fetch('/api/admin/events/create-atomic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create event and markets');
      }

      const result: EventMarketCreationResult = {
        success: true,
        eventId: data.event_id,
        marketIds: data.market_id ? [data.market_id] : [],
        slug: data.slug,
      };

      setLastResult(result);
      options.onSuccess?.(result);

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
