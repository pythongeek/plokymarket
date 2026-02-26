/**
 * Event Creation Workflow
 * 5-Stage AI-powered event creation pipeline
 * Vertex AI + Kimi API with automatic rotation
 */

import { executeWithRotation, type AIProvider } from "../rotation-system";
import {
  generateSlug,
  generateSlugFallback,
  classifyCategory,
  classifyCategoryFallback,
  generateContent,
  generateContentFallback,
  validateEvent,
  validateEventFallback,
  type SlugGenerationResult,
  type CategoryResult,
  type ContentResult,
  type ValidationResult,
} from "../agents";

import {
  generateSlugWithKimi,
  classifyCategoryWithKimi,
  generateContentWithKimi,
  validateEventWithKimi,
} from "../kimi-client";

// ============================================
// WORKFLOW TYPES
// ============================================

export interface WorkflowInput {
  title: string;
  description?: string;
  context?: {
    suggestedCategory?: string;
    resolutionDate?: string;
    tags?: string[];
    creatorId?: string;
  };
}

export interface WorkflowStage<T> {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  provider: AIProvider;
  latencyMs: number;
  result?: T;
  error?: string;
}

export interface WorkflowOutput {
  success: boolean;
  stages: {
    slug: WorkflowStage<SlugGenerationResult>;
    category: WorkflowStage<CategoryResult>;
    content: WorkflowStage<ContentResult>;
    validation: WorkflowStage<ValidationResult>;
  };
  finalOutput: {
    title: string;
    slug: string;
    category: string;
    subcategories: string[];
    tags: string[];
    description: string;
    resolutionCriteria: {
      yes: string;
      no: string;
      edgeCases: string;
    };
    resolutionSource: {
      name: string;
      url: string;
    };
    language: string;
    confidence: number;
    recommendation: "approve" | "review" | "revise" | "reject";
  };
  metadata: {
    totalLatencyMs: number;
    providersUsed: AIProvider[];
    timestamp: string;
  };
}

// ============================================
// STAGE 1: CORE IDENTITY AGENT (Slug Generation)
// ============================================

async function stage1SlugGeneration(input: WorkflowInput): Promise<WorkflowStage<SlugGenerationResult>> {
  const startTime = Date.now();
  
  try {
    const { result, provider } = await executeWithRotation(
      () => generateSlug(input.title),
      () => generateSlugWithKimi(input.title),
      () => Promise.resolve(generateSlugFallback(input.title))
    );
    
    return {
      name: "Core Identity Agent (Slug Generation)",
      status: "completed",
      provider,
      latencyMs: Date.now() - startTime,
      result,
    };
  } catch (error) {
    return {
      name: "Core Identity Agent (Slug Generation)",
      status: "failed",
      provider: "fallback",
      latencyMs: Date.now() - startTime,
      result: generateSlugFallback(input.title),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================
// STAGE 2: CATEGORIZATION AGENT (Local Taxonomy)
// ============================================

async function stage2Categorization(
  input: WorkflowInput,
  slugResult: SlugGenerationResult
): Promise<WorkflowStage<CategoryResult>> {
  const startTime = Date.now();
  
  try {
    const { result, provider } = await executeWithRotation(
      () => classifyCategory(slugResult.title, input.description),
      () => classifyCategoryWithKimi(slugResult.title, input.description),
      () => Promise.resolve(classifyCategoryFallback(slugResult.title))
    );
    
    // Override with suggested category if provided
    if (input.context?.suggestedCategory) {
      result.primary = input.context.suggestedCategory as any;
    }
    
    // Add bd-local tag for Bangladesh events
    if (result.bangladeshContext.isLocal && !result.tags.includes("bd-local")) {
      result.tags.push("bd-local");
    }
    
    return {
      name: "Categorization Agent (Local Taxonomy)",
      status: "completed",
      provider,
      latencyMs: Date.now() - startTime,
      result,
    };
  } catch (error) {
    return {
      name: "Categorization Agent (Local Taxonomy)",
      status: "failed",
      provider: "fallback",
      latencyMs: Date.now() - startTime,
      result: classifyCategoryFallback(slugResult.title),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================
// STAGE 3: MARKET DYNAMICS AGENT (Content Generation)
// ============================================

async function stage3ContentGeneration(
  slugResult: SlugGenerationResult,
  categoryResult: CategoryResult
): Promise<WorkflowStage<ContentResult>> {
  const startTime = Date.now();
  
  try {
    const { result, provider } = await executeWithRotation(
      () => generateContent(slugResult.title, categoryResult.primary, slugResult.title),
      () => generateContentWithKimi(slugResult.title, categoryResult.primary),
      () => Promise.resolve(generateContentFallback(slugResult.title, categoryResult.primary))
    );
    
    return {
      name: "Market Dynamics Agent (Content Generation)",
      status: "completed",
      provider,
      latencyMs: Date.now() - startTime,
      result,
    };
  } catch (error) {
    return {
      name: "Market Dynamics Agent (Content Generation)",
      status: "failed",
      provider: "fallback",
      latencyMs: Date.now() - startTime,
      result: generateContentFallback(slugResult.title, categoryResult.primary),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================
// STAGE 4: RESOLUTION & ORACLE AGENT (Validation)
// ============================================

async function stage4Validation(
  slugResult: SlugGenerationResult,
  categoryResult: CategoryResult,
  contentResult: ContentResult,
  input: WorkflowInput
): Promise<WorkflowStage<ValidationResult>> {
  const startTime = Date.now();
  
  const eventData = {
    title: slugResult.title,
    slug: slugResult.slug,
    category: categoryResult.primary,
    description: contentResult.description,
    resolutionCriteria: contentResult.resolutionCriteria,
    resolutionSource: contentResult.resolutionSource,
    resolutionDate: input.context?.resolutionDate || contentResult.suggestedResolutionDate,
  };
  
  try {
    const { result, provider } = await executeWithRotation(
      () => validateEvent(eventData),
      () => validateEventWithKimi(eventData),
      () => Promise.resolve(validateEventFallback(eventData))
    );
    
    return {
      name: "Resolution & Oracle Agent (Validation)",
      status: "completed",
      provider,
      latencyMs: Date.now() - startTime,
      result,
    };
  } catch (error) {
    return {
      name: "Resolution & Oracle Agent (Validation)",
      status: "failed",
      provider: "fallback",
      latencyMs: Date.now() - startTime,
      result: validateEventFallback(eventData),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================
// STAGE 5: AI FINAL REVIEW (Confidence Scorer)
// ============================================

function stage5FinalReview(
  slugStage: WorkflowStage<SlugGenerationResult>,
  categoryStage: WorkflowStage<CategoryResult>,
  contentStage: WorkflowStage<ContentResult>,
  validationStage: WorkflowStage<ValidationResult>
): {
  confidence: number;
  recommendation: "approve" | "review" | "revise" | "reject";
  reasoning: string;
} {
  const validationScore = validationStage.result?.score || 0;
  const categoryConfidence = categoryStage.result?.confidence || 0;
  
  // Weighted confidence calculation
  const confidence = (
    validationScore * 0.5 +
    categoryConfidence * 0.3 +
    (slugStage.status === "completed" ? 0.1 : 0) +
    (contentStage.status === "completed" ? 0.1 : 0)
  );
  
  let recommendation: "approve" | "review" | "revise" | "reject";
  let reasoning: string;
  
  if (confidence >= 0.85) {
    recommendation = "approve";
    reasoning = "High confidence across all validation criteria";
  } else if (confidence >= 0.70) {
    recommendation = "review";
    reasoning = "Moderate confidence - human review recommended";
  } else if (confidence >= 0.50) {
    recommendation = "revise";
    reasoning = "Low confidence - improvements needed";
  } else {
    recommendation = "reject";
    reasoning = "Critical issues detected - event needs significant revision";
  }
  
  return { confidence, recommendation, reasoning };
}

// ============================================
// MAIN WORKFLOW EXECUTION
// ============================================

export async function executeEventCreationWorkflow(input: WorkflowInput): Promise<WorkflowOutput> {
  const workflowStartTime = Date.now();
  
  console.log(`[Workflow] Starting event creation for: "${input.title}"`);
  
  // Execute all stages
  const slugStage = await stage1SlugGeneration(input);
  console.log(`[Workflow] Stage 1 completed (${slugStage.provider}, ${slugStage.latencyMs}ms)`);
  
  const categoryStage = await stage2Categorization(input, slugStage.result!);
  console.log(`[Workflow] Stage 2 completed (${categoryStage.provider}, ${categoryStage.latencyMs}ms)`);
  
  const contentStage = await stage3ContentGeneration(slugStage.result!, categoryStage.result!);
  console.log(`[Workflow] Stage 3 completed (${contentStage.provider}, ${contentStage.latencyMs}ms)`);
  
  const validationStage = await stage4Validation(
    slugStage.result!,
    categoryStage.result!,
    contentStage.result!,
    input
  );
  console.log(`[Workflow] Stage 4 completed (${validationStage.provider}, ${validationStage.latencyMs}ms)`);
  
  // Final review
  const review = stage5FinalReview(slugStage, categoryStage, contentStage, validationStage);
  console.log(`[Workflow] Stage 5 completed (confidence: ${(review.confidence * 100).toFixed(1)}%)`);
  
  const totalLatencyMs = Date.now() - workflowStartTime;
  
  // Collect providers used
  const providersUsed = [
    slugStage.provider,
    categoryStage.provider,
    contentStage.provider,
    validationStage.provider,
  ].filter((v, i, a) => a.indexOf(v) === i); // Unique
  
  return {
    success: validationStage.status === "completed",
    stages: {
      slug: slugStage,
      category: categoryStage,
      content: contentStage,
      validation: validationStage,
    },
    finalOutput: {
      title: slugStage.result!.title,
      slug: slugStage.result!.slug,
      category: categoryStage.result!.primary,
      subcategories: categoryStage.result!.secondary,
      tags: categoryStage.result!.tags,
      description: contentStage.result!.description,
      resolutionCriteria: contentStage.result!.resolutionCriteria,
      resolutionSource: contentStage.result!.resolutionSource,
      language: contentStage.result!.language,
      confidence: review.confidence,
      recommendation: review.recommendation,
    },
    metadata: {
      totalLatencyMs,
      providersUsed,
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================
// BATCH PROCESSING
// ============================================

export async function batchExecuteWorkflow(
  inputs: WorkflowInput[],
  options: { concurrency?: number; onProgress?: (completed: number, total: number) => void } = {}
): Promise<WorkflowOutput[]> {
  const { concurrency = 3, onProgress } = options;
  const results: WorkflowOutput[] = [];
  
  // Process in batches
  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchPromises = batch.map(input => executeEventCreationWorkflow(input));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + concurrency, inputs.length), inputs.length);
    }
  }
  
  return results;
}

// ============================================
// WORKFLOW ANALYTICS
// ============================================

export function getWorkflowAnalytics(outputs: WorkflowOutput[]) {
  const total = outputs.length;
  const successful = outputs.filter(o => o.success).length;
  const avgLatency = outputs.reduce((sum, o) => sum + o.metadata.totalLatencyMs, 0) / total;
  
  const providerDistribution = outputs.reduce((acc, o) => {
    o.metadata.providersUsed.forEach(p => {
      acc[p] = (acc[p] || 0) + 1;
    });
    return acc;
  }, {} as Record<AIProvider, number>);
  
  const recommendationDistribution = outputs.reduce((acc, o) => {
    acc[o.finalOutput.recommendation] = (acc[o.finalOutput.recommendation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    total,
    successful,
    successRate: (successful / total) * 100,
    avgLatencyMs: Math.round(avgLatency),
    providerDistribution,
    recommendationDistribution,
  };
}
