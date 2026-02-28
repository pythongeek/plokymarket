/**
 * AI Event Creation Orchestrator
 * Coordinates multiple AI agents for event creation
 * Handles fallback between Vertex AI and Kimi API
 */

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
} from "./agents";

import {
  generateSlugWithKimi,
  classifyCategoryWithKimi,
  generateContentWithKimi,
  validateEventWithKimi,
  withFallback,
} from "./kimi-client";

import { checkVertexHealth } from "./vertex-client";
import { checkKimiHealth } from "./kimi-client";

export interface EventCreationInput {
  title: string;
  description?: string;
  context?: {
    suggestedCategory?: string;
    resolutionDate?: string;
    tags?: string[];
  };
}

export interface EventCreationOutput {
  success: boolean;
  slug: SlugGenerationResult;
  category: CategoryResult;
  content: ContentResult;
  validation: ValidationResult;
  metadata: {
    providerUsed: "vertex" | "kimi" | "fallback";
    latencyMs: number;
    stagesCompleted: string[];
    errors: string[];
  };
}

export interface OrchestratorConfig {
  useFallback: boolean;
  skipValidation: boolean;
  preferredProvider: "vertex" | "kimi" | "auto";
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  useFallback: true,
  skipValidation: false,
  preferredProvider: "auto",
};

/**
 * Create event with AI assistance
 */
export async function createEventWithAI(
  input: EventCreationInput,
  config: Partial<OrchestratorConfig> = {}
): Promise<EventCreationOutput> {
  const startTime = Date.now();
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const stagesCompleted: string[] = [];
  const errors: string[] = [];
  const { providers } = await import("./ai-config").then(m => m.getAIConfigs());

  // Determine which provider to use based on DB settings FIRST, then fallback to args
  let provider: "vertex" | "kimi" | "fallback" = "vertex";

  const vertexActive = providers?.vertex?.is_active ?? true;
  const kimiActive = providers?.kimi?.is_active ?? true;

  if (fullConfig.preferredProvider === "auto") {
    if (vertexActive) {
      // Check Vertex health
      const vertexHealth = await checkVertexHealth();
      if (!vertexHealth.healthy) {
        console.warn("[Orchestrator] Vertex AI unhealthy, will use fallback");
        provider = kimiActive ? "kimi" : "fallback";
      }
    } else if (kimiActive) {
      provider = "kimi";
    } else {
      provider = "fallback";
    }
  } else if (fullConfig.preferredProvider === "kimi" && kimiActive) {
    provider = "kimi";
  } else if (fullConfig.preferredProvider === "vertex" && !vertexActive) {
    provider = kimiActive ? "kimi" : "fallback";
  }

  // Stage 1: Generate Slug
  let slugResult: SlugGenerationResult;
  try {
    if (provider === "vertex") {
      slugResult = await withFallback(
        () => generateSlug(input.title),
        () => generateSlugWithKimi(input.title),
        { logFallback: fullConfig.useFallback }
      );
    } else {
      slugResult = await generateSlugWithKimi(input.title);
    }
    stagesCompleted.push("slug");
  } catch (error) {
    console.warn("[Orchestrator] Slug generation failed, using fallback:", error);
    slugResult = generateSlugFallback(input.title);
    provider = "fallback";
    errors.push(`Slug: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Stage 2: Classify Category
  let categoryResult: CategoryResult;
  try {
    if (provider === "fallback") {
      categoryResult = classifyCategoryFallback(slugResult.title);
    } else if (provider === "vertex") {
      categoryResult = await withFallback(
        () => classifyCategory(slugResult.title, input.description),
        () => classifyCategoryWithKimi(slugResult.title, input.description),
        { logFallback: fullConfig.useFallback }
      );
    } else {
      categoryResult = await classifyCategoryWithKimi(slugResult.title, input.description);
    }
    stagesCompleted.push("category");
  } catch (error) {
    console.warn("[Orchestrator] Category classification failed, using fallback:", error);
    categoryResult = classifyCategoryFallback(slugResult.title);
    provider = "fallback";
    errors.push(`Category: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Override with suggested category if provided
  if (input.context?.suggestedCategory) {
    categoryResult.primary = input.context.suggestedCategory as any;
  }

  // Stage 3: Generate Content
  let contentResult: ContentResult;
  try {
    if (provider === "fallback") {
      contentResult = generateContentFallback(slugResult.title, categoryResult.primary);
    } else if (provider === "vertex") {
      contentResult = await withFallback(
        () => generateContent(slugResult.title, categoryResult.primary, input.description),
        () => generateContentWithKimi(slugResult.title, categoryResult.primary),
        { logFallback: fullConfig.useFallback }
      );
    } else {
      contentResult = await generateContentWithKimi(slugResult.title, categoryResult.primary);
    }
    stagesCompleted.push("content");
  } catch (error) {
    console.warn("[Orchestrator] Content generation failed, using fallback:", error);
    contentResult = generateContentFallback(slugResult.title, categoryResult.primary);
    provider = "fallback";
    errors.push(`Content: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Override resolution date if provided
  if (input.context?.resolutionDate) {
    contentResult.suggestedResolutionDate = input.context.resolutionDate;
  }

  // Stage 4: Validate
  let validationResult: ValidationResult;
  if (!fullConfig.skipValidation) {
    try {
      const eventData = {
        title: slugResult.title,
        slug: slugResult.slug,
        category: categoryResult.primary,
        description: contentResult.description,
        resolutionCriteria: contentResult.resolutionCriteria,
        resolutionSource: contentResult.resolutionSource,
        resolutionDate: contentResult.suggestedResolutionDate,
      };

      if (provider === "fallback") {
        validationResult = validateEventFallback(eventData);
      } else if (provider === "vertex") {
        validationResult = await withFallback(
          () => validateEvent(eventData),
          () => validateEventWithKimi(eventData),
          { logFallback: fullConfig.useFallback }
        );
      } else {
        validationResult = await validateEventWithKimi(eventData);
      }
      stagesCompleted.push("validation");
    } catch (error) {
      console.warn("[Orchestrator] Validation failed, using fallback:", error);
      validationResult = validateEventFallback({
        title: slugResult.title,
        slug: slugResult.slug,
        category: categoryResult.primary,
        description: contentResult.description,
        resolutionCriteria: contentResult.resolutionCriteria,
        resolutionSource: contentResult.resolutionSource,
        resolutionDate: contentResult.suggestedResolutionDate,
      });
      errors.push(`Validation: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    validationResult = {
      score: 0.5,
      recommendation: "review",
      breakdown: {
        titleQuality: 0.5,
        descriptionQuality: 0.5,
        resolutionCriteria: 0.5,
        resolutionSource: 0.5,
        feasibility: 0.5,
      },
      risks: [],
      improvements: ["Validation was skipped"],
      confidence: 0.5,
    };
  }

  const latencyMs = Date.now() - startTime;

  return {
    success: errors.length === 0 || provider !== "fallback",
    slug: slugResult,
    category: categoryResult,
    content: contentResult,
    validation: validationResult,
    metadata: {
      providerUsed: provider,
      latencyMs,
      stagesCompleted,
      errors,
    },
  };
}

/**
 * Batch process multiple events
 */
export async function batchCreateEvents(
  inputs: EventCreationInput[],
  config: Partial<OrchestratorConfig> = {}
): Promise<EventCreationOutput[]> {
  const results: EventCreationOutput[] = [];

  for (const input of inputs) {
    try {
      const result = await createEventWithAI(input, config);
      results.push(result);
    } catch (error) {
      console.error("[Orchestrator] Batch item failed:", error);
      results.push({
        success: false,
        slug: { slug: "", title: input.title, language: "en", keywords: [] },
        category: {
          primary: "international",
          secondary: [],
          tags: [],
          confidence: 0,
          reasoning: "Failed to process",
          bangladeshContext: { isLocal: false, relevantEntities: [], suggestedAuthority: "" },
        },
        content: {
          description: "",
          resolutionCriteria: { yes: "", no: "", edgeCases: "" },
          resolutionSource: { name: "", url: "" },
          context: "",
          language: "en",
        },
        validation: {
          score: 0,
          recommendation: "reject",
          breakdown: {
            titleQuality: 0,
            descriptionQuality: 0,
            resolutionCriteria: 0,
            resolutionSource: 0,
            feasibility: 0,
          },
          risks: [{
            severity: "high",
            category: "source",
            description: error instanceof Error ? error.message : "Unknown error",
            suggestion: "Retry with different parameters",
          }],
          improvements: [],
          confidence: 0,
        },
        metadata: {
          providerUsed: "fallback",
          latencyMs: 0,
          stagesCompleted: [],
          errors: [error instanceof Error ? error.message : String(error)],
        },
      });
    }
  }

  return results;
}

/**
 * Get orchestrator health status
 */
export async function getOrchestratorHealth(): Promise<{
  vertex: { healthy: boolean; latencyMs: number; error?: string };
  kimi: { healthy: boolean; latencyMs: number; error?: string };
  recommendation: string;
}> {
  const [vertexHealth, kimiHealth] = await Promise.all([
    checkVertexHealth(),
    checkKimiHealth(),
  ]);

  let recommendation = "All systems operational";
  if (!vertexHealth.healthy && !kimiHealth.healthy) {
    recommendation = "CRITICAL: Both AI providers unavailable";
  } else if (!vertexHealth.healthy) {
    recommendation = "Vertex AI unavailable - using Kimi fallback";
  } else if (!kimiHealth.healthy) {
    recommendation = "Kimi unavailable - Vertex AI only";
  }

  return {
    vertex: vertexHealth,
    kimi: kimiHealth,
    recommendation,
  };
}
