/**
 * Search-Then-Reason Pipeline
 * Gemini searches web → MiniMax decides outcome
 * Optimized for Vercel Edge: targets <8s total
 */

import { searchMarketFacts, GeminiSearchOutput } from '../agents/GeminiSearchAgent';
import { resolveWithMiniMax, MiniMaxResolutionResult } from '../agents/MiniMaxResolutionAgent';

export interface PipelineResult {
  success: boolean;
  marketId: string;
  marketQuestion: string;
  category: string;
  searchResults: GeminiSearchOutput;
  resolution: MiniMaxResolutionResult;
  executionTimeMs: number;
  error?: string;
}

/**
 * Run full search-then-reason pipeline
 */
export async function runSearchThenReasonPipeline(
  marketId: string,
  marketQuestion: string,
  category: string = 'general',
  resolutionDate?: string
): Promise<PipelineResult> {
  const startTime = Date.now();

  try {
    // Stage 1: Gemini web search (with 20s timeout)
    console.log(`[Pipeline] Stage 1: Gemini search for "${marketQuestion.slice(0, 60)}..."`);
    const searchPromise = searchMarketFacts(marketQuestion, category, resolutionDate);
    const searchResults = await withTimeout(searchPromise, 20000, 'Gemini search timeout');

    // Stage 2: MiniMax resolution (with 15s timeout)
    console.log(`[Pipeline] Stage 2: MiniMax resolution (${searchResults.facts.length} facts)`);
    const resolvePromise = resolveWithMiniMax(marketQuestion, category, searchResults);
    const resolution = await withTimeout(resolvePromise, 25000, 'MiniMax resolution timeout');

    const executionTimeMs = Date.now() - startTime;
    console.log(`[Pipeline] Complete in ${executionTimeMs}ms — outcome: ${resolution.outcome}, confidence: ${resolution.confidence}`);

    return {
      success: true,
      marketId,
      marketQuestion,
      category,
      searchResults,
      resolution,
      executionTimeMs,
    };
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    console.error(`[Pipeline] Failed after ${executionTimeMs}ms:`, error.message);
    return {
      success: false,
      marketId,
      marketQuestion,
      category,
      searchResults: {
        query: marketQuestion,
        facts: [],
        sources: [],
        keyEvents: [],
        conflictingInfo: [],
        overallSummary: '',
        searchTimestamp: new Date().toISOString(),
      },
      resolution: {
        outcome: 'UNRESOLVED',
        confidence: 0,
        reasoning: `Pipeline error: ${error.message}`,
        reasoningBn: 'পাইপলাইন ত্রুটি: ' + error.message,
        sources: [],
        certaintyLevel: 'Uncertain',
        certaintyBn: 'অনিশ্চিত',
        recommendedAction: 'ESCALATE',
      },
      executionTimeMs,
      error: error.message,
    };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} after ${ms}ms`)), ms)
    ),
  ]);
}
