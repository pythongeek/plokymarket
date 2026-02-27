'use client';

/**
 * useAIAgents Hook
 * React hook for interacting with the AI agent system
 * Provides real-time state updates and agent control
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AgentState,
  AgentType,
  AgentOrchestrationResult,
  ContentAgentResult,
  MarketLogicResult,
  TimingResult,
  RiskAssessmentResult,
} from '@/lib/ai-agents/types';
import { useAIProviderStore } from '@/store/aiProviderStore';

interface UseAIAgentsOptions {
  onComplete?: (result: AgentOrchestrationResult) => void;
  onError?: (error: Error) => void;
  onStateChange?: (agents: AgentState[], step: number) => void;
}

interface UseAIAgentsReturn {
  // State
  agents: AgentState[];
  currentStep: number;
  isProcessing: boolean;
  result: AgentOrchestrationResult | null;
  error: Error | null;

  // Actions
  runWorkflow: (params: RunWorkflowParams) => Promise<void>;
  runSingleAgent: (type: AgentType, params: RunWorkflowParams) => Promise<void>;
  reset: () => void;
  rotateProvider: () => void;
}

interface RunWorkflowParams {
  title: string;
  description?: string;
  category?: string;
  outcomes?: string[];
  trading_closes_at?: string;
  resolution_date?: string;
  existing_events?: string[];
}

const defaultAgents: AgentState[] = [
  { type: 'content', status: 'idle', progress: 0 },
  { type: 'logic', status: 'idle', progress: 0 },
  { type: 'timing', status: 'idle', progress: 0 },
  { type: 'risk', status: 'idle', progress: 0 },
];

export function useAIAgents(options: UseAIAgentsOptions = {}): UseAIAgentsReturn {
  const [agents, setAgents] = useState<AgentState[]>(defaultAgents);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AgentOrchestrationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { mode, recordSuccess, recordFailure } = useAIProviderStore();

  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  /**
   * Update agent state
   */
  const updateAgentState = useCallback((type: AgentType, updates: Partial<AgentState>) => {
    setAgents(prev =>
      prev.map(agent =>
        agent.type === type ? { ...agent, ...updates } : agent
      )
    );
  }, []);

  /**
   * Run full agent workflow
   */
  const runWorkflow = useCallback(async (params: RunWorkflowParams) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    // Reset all agents to idle
    setAgents(defaultAgents);
    setCurrentStep(0);

    try {
      const response = await fetch('/api/ai/agent-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          mode: 'full',
          aiMode: mode,
        }),
      });

      if (!response.ok) {
        recordFailure('vertex'); // Generic failure recording
        const errorData = await response.json();
        throw new Error(errorData.message || 'Agent workflow failed');
      }

      const data = await response.json();
      recordSuccess(data.metadata?.providerUsed === 'kimi' ? 'kimi' : 'vertex');

      // Update agents based on result
      if (data.data) {
        if (data.data.content) {
          updateAgentState('content', { status: 'completed', progress: 100, result: data.data.content });
        }
        if (data.data.market_logic) {
          updateAgentState('logic', { status: 'completed', progress: 100, result: data.data.market_logic });
        }
        if (data.data.timing) {
          updateAgentState('timing', { status: 'completed', progress: 100, result: data.data.timing });
        }
        if (data.data.risk_assessment) {
          updateAgentState('risk', { status: 'completed', progress: 100, result: data.data.risk_assessment });
        }
      }

      const orchestrationResult: AgentOrchestrationResult = {
        success: data.success,
        content: data.data?.content,
        marketLogic: data.data?.market_logic,
        timing: data.data?.timing,
        riskAssessment: data.data?.risk_assessment,
        errors: data.errors || [],
        warnings: data.warnings || [],
        metadata: data.metadata,
      };

      setResult(orchestrationResult);
      options.onComplete?.(orchestrationResult);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  }, [options, updateAgentState]);

  /**
   * Run single agent
   */
  const runSingleAgent = useCallback(async (type: AgentType, params: RunWorkflowParams) => {
    setIsProcessing(true);
    setError(null);

    // Set specific agent to processing
    updateAgentState(type, { status: 'processing', progress: 0 });

    try {
      const response = await fetch('/api/ai/agent-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          mode: type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `${type} agent failed`);
      }

      const data = await response.json();

      // Update agent with result
      updateAgentState(type, {
        status: 'completed',
        progress: 100,
        result: data.data?.[type],
      });

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      updateAgentState(type, { status: 'error', error: error.message });
      setError(error);
      options.onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [options, updateAgentState]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setAgents(defaultAgents);
    setCurrentStep(0);
    setIsProcessing(false);
    setResult(null);
    setError(null);
  }, []);

  /**
   * Rotate provider (Vertex ↔ Kimi)
   */
  const rotateProvider = useCallback(() => {
    // This would typically call an API endpoint
    // For now, just log it
    console.log('[useAIAgents] Rotating provider...');
  }, []);

  return {
    agents,
    currentStep,
    isProcessing,
    result,
    error,
    runWorkflow,
    runSingleAgent,
    reset,
    rotateProvider,
  };
}

/**
 * Hook for quick title enhancement (debounced)
 */
export function useQuickEnhance(debounceMs: number = 500) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const enhance = useCallback((title: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!title || title.length < 3) {
      setSuggestion(null);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { quickEnhanceTitle } = await import('@/lib/ai-agents');
        const enhanced = quickEnhanceTitle(title);
        setSuggestion(enhanced);
      } catch (e) {
        console.error('Enhancement failed:', e);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  return { suggestion, isLoading, enhance };
}

/**
 * Hook for duplicate detection (debounced)
 */
export function useDuplicateCheck(debounceMs: number = 500) {
  const [result, setResult] = useState<{
    isDuplicate: boolean;
    similarity: number;
    suggestions: string[];
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const check = useCallback((title: string, existingEvents: string[] = []) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!title || title.length < 5) {
      setResult(null);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsChecking(true);
      try {
        const { checkForDuplicates } = await import('@/lib/ai-agents');
        const checkResult = checkForDuplicates(title, existingEvents);
        setResult({
          isDuplicate: checkResult.isDuplicate,
          similarity: checkResult.similarity,
          suggestions: checkResult.suggestions,
        });
      } catch (e) {
        console.error('Duplicate check failed:', e);
      } finally {
        setIsChecking(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  return { result, isChecking, check };
}

/**
 * Hook for real-time risk assessment
 */
export function useRiskCheck() {
  const [risk, setRisk] = useState<{
    isSafe: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  } | null>(null);

  const check = useCallback((title: string) => {
    if (!title) {
      setRisk(null);
      return;
    }

    import('@/lib/ai-agents').then(({ quickRiskCheck }) => {
      setRisk(quickRiskCheck(title));
    });
  }, []);

  return { risk, check };
}
