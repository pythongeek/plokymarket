/**
 * AI Module Barrel Export
 * Central export for all AI functionality
 */

// Vertex AI
export {
  getVertexClient,
  getModel,
  executeWithRetry,
  parseJSONResponse,
  checkVertexHealth,
  MODELS,
  SAFETY_SETTINGS,
  type ModelConfig,
} from "./vertex-client";

// Kimi API
export {
  callKimiAPI,
  generateSlugWithKimi,
  classifyCategoryWithKimi,
  generateContentWithKimi,
  validateEventWithKimi,
  withFallback,
  checkKimiHealth,
  type KimiMessage,
  type KimiCompletionOptions,
  type KimiCompletionResult,
} from "./kimi-client";

// Agents
export {
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
  type Category,
  type Subcategory,
  type EventTag,
  type ContentResult,
  type ResolutionCriteria,
  type ResolutionSource,
  type ValidationResult,
  type Risk,
  type RiskSeverity,
  type RiskCategory,
  type Recommendation,
  type ValidationBreakdown,
} from "./agents";

// Rotation System
export {
  executeWithRotation,
  selectProvider,
  getProviderStatus,
  getRotationStats,
  forceProvider,
  resetProviderStatus,
  type AIProvider,
} from "./rotation-system";

// Workflows
export {
  executeEventCreationWorkflow,
  batchExecuteWorkflow,
  getWorkflowAnalytics,
  type WorkflowInput,
  type WorkflowOutput,
  type WorkflowStage,
} from "./workflows/event-creation-workflow";

// Orchestrator (legacy - use workflows instead)
export {
  createEventWithAI,
  batchCreateEvents,
  getOrchestratorHealth,
  type EventCreationInput,
  type EventCreationOutput,
  type OrchestratorConfig,
} from "./orchestrator";

// Prompts (for reference)
export {
  SLUG_AGENT_PROMPT,
  CATEGORY_AGENT_PROMPT,
  CONTENT_AGENT_PROMPT,
  VALIDATION_AGENT_PROMPT,
  MARKET_CONFIG_AGENT_PROMPT,
} from "./prompts/eventPrompts";
