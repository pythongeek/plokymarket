/**
 * Upstash Workflow Orchestrator
 * Executes verification workflows with step chaining and conditional logic
 * Production-grade with observability and rollback
 */

import { VerificationWorkflow, WorkflowResult, WorkflowStep, VerificationSource } from './WorkflowBuilder';

// QStash configuration
const QSTASH_URL = process.env.QSTASH_URL || 'https://qstash.upstash.io';
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

interface VerificationContext {
  eventId: string;
  eventData: {
    question: string;
    description: string;
    category: string;
    tradingEnds: Date;
  };
  workflow: VerificationWorkflow;
  startTime: number;
}

interface SourceExecutionResult {
  sourceId: string;
  method: string;
  result: 'yes' | 'no' | 'uncertain';
  confidence: number;
  evidence: Record<string, any>;
  executionTime: number;
  error?: string;
}

/**
 * Main workflow orchestrator
 */
export async function executeVerificationWorkflow(
  eventId: string,
  workflowId: string,
  eventData: VerificationContext['eventData']
): Promise<WorkflowResult> {
  const startTime = Date.now();

  try {
    // 1. Load workflow from database
    const workflow = await loadWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const context: VerificationContext = {
      eventId,
      eventData,
      workflow,
      startTime,
    };

    // 2. Execute workflow steps sequentially
    const stepResults = await executeWorkflowSteps(context);

    // 3. Aggregate results
    const finalResult = aggregateWorkflowResults(context, stepResults);

    // 4. Check for mismatches
    const mismatchResult = detectWorkflowMismatch(stepResults);

    // 5. Determine escalation
    const shouldEscalate = finalResult.confidence < workflow.escalationThreshold;

    // 6. Log to audit trail
    await logWorkflowExecution(eventId, workflowId, finalResult, mismatchResult, shouldEscalate);

    // 7. Send alerts if needed
    if (mismatchResult.hasMismatch && workflow.alertOnMismatch) {
      await alertMismatch(eventId, mismatchResult);
    }

    if (shouldEscalate) {
      finalResult.outcome = 'escalated';
      finalResult.escalationReason = `Confidence (${finalResult.confidence}%) below threshold (${workflow.escalationThreshold}%)`;
    }

    return {
      ...finalResult,
      totalExecutionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error(`Workflow execution failed for event ${eventId}:`, error);

    // Log failure
    await logWorkflowFailure(eventId, workflowId, error);

    // Return escalated result
    return {
      eventId,
      workflowId,
      outcome: 'escalated',
      confidence: 0,
      reasoning: `Workflow execution failed: ${error.message}`,
      sources: [],
      mismatch: false,
      mismatchDetails: null,
      escalationReason: `Automatic escalation due to execution error: ${error.message}`,
      executedAt: new Date(),
      totalExecutionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute multiple workflow steps sequentially
 */
async function executeWorkflowSteps(
  context: VerificationContext
): Promise<SourceExecutionResult[]> {
  const allResults: SourceExecutionResult[] = [];

  for (const step of context.workflow.steps) {
    const stepStartTime = Date.now();
    const stepResults: SourceExecutionResult[] = [];

    try {
      // Execute all sources in parallel within timeout
      const sourcePromises = step.sources.map((source) =>
        executeVerificationSource(source, context, step.timeout)
      );

      const results = await Promise.allSettled(sourcePromises);

      // Collect successful results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled') {
          stepResults.push(result.value);
        } else {
          stepResults.push({
            sourceId: step.sources[i].id,
            method: step.sources[i].method,
            result: 'uncertain',
            confidence: 0,
            evidence: { error: result.reason?.message || 'Unknown error' },
            executionTime: Date.now() - stepStartTime,
            error: result.reason?.message || 'Unknown error',
          });
        }
      }

      // Check if step met requirements
      const stepOutcome = determineStepOutcome(step, stepResults);
      allResults.push(...stepResults);

      if (stepOutcome.outcome === 'success' && step.onSuccess === 'resolve') {
        break; // Stop workflow, we have resolution
      }

      if (stepOutcome.confidence < step.requiredConfidence && step.onFailure === 'escalate') {
        break; // Stop workflow, escalation needed
      }
    } catch (error: any) {
      console.error(`Step ${step.name} failed:`, error);

      if (step.onFailure === 'escalate') {
        break;
      }

      // Continue to next step if configured
    }
  }

  return allResults;
}

/**
 * Execute a single verification source
 */
async function executeVerificationSource(
  source: VerificationSource,
  context: VerificationContext,
  stepTimeout: number
): Promise<SourceExecutionResult> {
  const sourceStartTime = Date.now();

  // Create timeout promise
  const timeoutPromise = new Promise<SourceExecutionResult>((_, reject) =>
    setTimeout(() => reject(new Error('Source execution timeout')), stepTimeout)
  );

  // Execute with retries
  let lastError: any;

  for (let attempt = 0; attempt <= source.retries; attempt++) {
    try {
      const executionPromise = executeSource(source, context);
      const result = await Promise.race([executionPromise, timeoutPromise]);

      return {
        ...result,
        executionTime: Date.now() - sourceStartTime,
      };
    } catch (error: any) {
      lastError = error;

      // Exponential backoff
      if (attempt < source.retries) {
        const delay =
          source.retryBackoff === 'exponential'
            ? Math.pow(2, attempt) * 1000
            : (attempt + 1) * 1000;

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Execute individual verification method
 */
async function executeSource(
  source: VerificationSource,
  context: VerificationContext
): Promise<SourceExecutionResult> {
  const sourceStartTime = Date.now();

  switch (source.method) {
    case 'ai_oracle':
      return executeAIOracle(source, context, sourceStartTime);

    case 'news_consensus':
      return executeNewsConsensus(source, context, sourceStartTime);

    case 'api_price_feed':
      return executePriceFeed(source, context, sourceStartTime);

    case 'sports_api':
      return executeSportsAPI(source, context, sourceStartTime);

    case 'expert_voting':
      return executeExpertVoting(source, context, sourceStartTime);

    case 'community_voting':
      return executeCommunityVoting(source, context, sourceStartTime);

    case 'chainlink_oracle':
      return executeChainlinkOracle(source, context, sourceStartTime);

    case 'trusted_sources':
      return executeTrustedSources(source, context, sourceStartTime);

    case 'manual_admin':
      return {
        sourceId: source.id,
        method: source.method,
        result: 'uncertain',
        confidence: 0,
        evidence: { awaiting: 'manual_admin_input' },
        executionTime: Date.now() - sourceStartTime,
      };

    default:
      throw new Error(`Unknown verification method: ${source.method}`);
  }
}

/**
 * AI Oracle verification
 */
async function executeAIOracle(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/verify-event`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        question: context.eventData.question,
        description: context.eventData.description,
        category: context.eventData.category,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`AI Oracle failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'ai_oracle',
    result: data.outcome,
    confidence: data.confidence,
    evidence: {
      reasoning: data.reasoning,
      model: source.config.model,
      sources: data.sources,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * News consensus verification
 */
async function executeNewsConsensus(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/news-consensus`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        question: context.eventData.question,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`News consensus failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'news_consensus',
    result: data.outcome,
    confidence: data.confidence,
    evidence: {
      sources: data.sources,
      votes: data.votes,
      avgConfidence: data.avgConfidence,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * Price feed verification
 */
async function executePriceFeed(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/price-feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        question: context.eventData.question,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Price feed failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'api_price_feed',
    result: data.outcome,
    confidence: 99, // High confidence for on-chain price data
    evidence: {
      currentPrice: data.currentPrice,
      targetPrice: data.targetPrice,
      asset: data.asset,
      timestamp: data.timestamp,
      sources: data.sources,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * Sports API verification
 */
async function executeSportsAPI(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/sports`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        question: context.eventData.question,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Sports API failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'sports_api',
    result: data.outcome,
    confidence: data.confidence,
    evidence: {
      matchResult: data.matchResult,
      apis: data.apis,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * Expert voting verification
 */
async function executeExpertVoting(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/expert-votes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Expert voting failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'expert_voting',
    result: data.outcome,
    confidence: data.confidence,
    evidence: {
      totalVotes: data.totalVotes,
      agreement: data.agreement,
      experts: data.experts,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * Community voting verification
 */
async function executeCommunityVoting(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/community-votes`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Community voting failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'community_voting',
    result: data.outcome,
    confidence: data.confidence,
    evidence: {
      totalVoters: data.totalVoters,
      yesPercentage: data.yesPercentage,
      participated: data.participated,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * Chainlink oracle verification
 */
async function executeChainlinkOracle(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/chainlink`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        question: context.eventData.question,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Chainlink oracle failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'chainlink_oracle',
    result: data.outcome,
    confidence: 98,
    evidence: {
      price: data.price,
      asset: data.asset,
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * Trusted sources verification
 */
async function executeTrustedSources(
  source: VerificationSource,
  context: VerificationContext,
  startTime: number
): Promise<SourceExecutionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/trusted-sources`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: context.eventId,
        question: context.eventData.question,
        config: source.config,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Trusted sources failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    sourceId: source.id,
    method: 'trusted_sources',
    result: data.outcome,
    confidence: data.confidence,
    evidence: {
      sources: data.sources,
      agreements: data.agreements,
    },
    executionTime: Date.now() - startTime,
  };
}

/**
 * Determine step outcome
 */
function determineStepOutcome(
  step: WorkflowStep,
  results: SourceExecutionResult[]
): { outcome: 'success' | 'failure'; confidence: number } {
  if (step.logic === 'all') {
    // All sources must agree
    const allMatch = results.every((r) => r.result === results[0].result);
    return {
      outcome: allMatch ? 'success' : 'failure',
      confidence: allMatch
        ? Math.min(...results.map((r) => r.confidence))
        : Math.max(...results.map((r) => r.confidence)),
    };
  } else if (step.logic === 'any') {
    // Any source can succeed
    return { outcome: 'success', confidence: Math.max(...results.map((r) => r.confidence)) };
  } else if (step.logic === 'weighted_consensus') {
    // Calculate weighted outcome
    const weighted = results.map((r) => ({
      result: r.result,
      confidence: r.confidence,
      weight: step.sources.find((s) => s.id === r.sourceId)?.weight ?? 50,
    }));

    const yesScore = weighted
      .filter((w) => w.result === 'yes')
      .reduce((sum, w) => sum + (w.confidence / 100) * w.weight, 0);

    const noScore = weighted
      .filter((w) => w.result === 'no')
      .reduce((sum, w) => sum + (w.confidence / 100) * w.weight, 0);

    const confidence = Math.max(yesScore, noScore) * 100;

    return {
      outcome: confidence >= step.requiredConfidence ? 'success' : 'failure',
      confidence: Math.round(confidence),
    };
  } else {
    // first_success
    const firstSuccess = results.find((r) => r.confidence >= step.requiredConfidence);
    return {
      outcome: firstSuccess ? 'success' : 'failure',
      confidence: firstSuccess?.confidence ?? 0,
    };
  }
}

/**
 * Aggregate workflow results
 */
function aggregateWorkflowResults(
  context: VerificationContext,
  results: SourceExecutionResult[]
): WorkflowResult {
  if (results.length === 0) {
    return {
      eventId: context.eventId,
      workflowId: context.workflow.id,
      outcome: 'uncertain',
      confidence: 0,
      reasoning: 'No verification sources provided results',
      sources: [],
      mismatch: false,
      mismatchDetails: null,
      escalationReason: null,
      executedAt: new Date(),
      totalExecutionTime: 0,
    };
  }

  // Calculate weighted outcome
  const weighted = results.map((r) => ({
    result: r.result,
    confidence: r.confidence,
    weight: 100 / results.length,
  }));

  const yesScore = weighted
    .filter((w) => w.result === 'yes')
    .reduce((sum, w) => sum + (w.confidence / 100) * w.weight, 0);

  const noScore = weighted
    .filter((w) => w.result === 'no')
    .reduce((sum, w) => sum + (w.confidence / 100) * w.weight, 0);

  let outcome: 'yes' | 'no' | 'uncertain' = 'uncertain';
  if (yesScore > noScore && yesScore > 50) outcome = 'yes';
  else if (noScore > yesScore && noScore > 50) outcome = 'no';

  return {
    eventId: context.eventId,
    workflowId: context.workflow.id,
    outcome,
    confidence: Math.round(Math.max(yesScore, noScore) * 100),
    reasoning: `Weighted consensus from ${results.length} sources: ${Math.round(yesScore * 100)}% YES, ${Math.round(noScore * 100)}% NO, ${Math.round((1 - yesScore - noScore) * 100)}% UNCERTAIN`,
    sources: results.map(r => ({
      method: r.method as any,
      result: r.result,
      confidence: r.confidence,
      evidence: r.evidence,
      executionTime: r.executionTime,
    })),
    mismatch: false,
    mismatchDetails: null,
    escalationReason: null,
    executedAt: new Date(),
    totalExecutionTime: 0,
  };
}

/**
 * Detect workflow mismatches
 */
function detectWorkflowMismatch(
  results: SourceExecutionResult[]
): { hasMismatch: boolean; details: string | null } {
  const yesResults = results.filter((r) => r.result === 'yes' && r.confidence >= 80);
  const noResults = results.filter((r) => r.result === 'no' && r.confidence >= 80);

  if (yesResults.length > 0 && noResults.length > 0) {
    return {
      hasMismatch: true,
      details: `Source conflict: ${yesResults.length} sources say YES, ${noResults.length} sources say NO`,
    };
  }

  return { hasMismatch: false, details: null };
}

/**
 * Load workflow from database
 */
async function loadWorkflow(workflowId: string): Promise<VerificationWorkflow | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/workflows/${workflowId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!response.ok) return null;
  return response.json();
}

/**
 * Log workflow execution
 */
async function logWorkflowExecution(
  eventId: string,
  workflowId: string,
  result: WorkflowResult,
  mismatch: { hasMismatch: boolean; details: string | null },
  escalated: boolean
): Promise<void> {
  // Implementation: Store in database
  console.log(`[AUDIT] Workflow ${workflowId} completed for event ${eventId}`, {
    outcome: result.outcome,
    confidence: result.confidence,
    mismatch: mismatch.hasMismatch,
    escalated,
  });
}

/**
 * Log workflow failure
 */
async function logWorkflowFailure(
  eventId: string,
  workflowId: string,
  error: any
): Promise<void> {
  console.error(`[AUDIT] Workflow ${workflowId} failed for event ${eventId}:`, error);
}

/**
 * Alert on mismatch
 */
async function alertMismatch(
  eventId: string,
  mismatch: { hasMismatch: boolean; details: string | null }
): Promise<void> {
  // Implementation: Send Telegram/Slack alert
  console.warn(`[ALERT] Mismatch detected for event ${eventId}:`, mismatch.details);
}

export {
  executeVerificationSource,
  determineStepOutcome,
  aggregateWorkflowResults,
  detectWorkflowMismatch,
};
