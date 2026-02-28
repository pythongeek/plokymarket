/**
 * Kimi API Client - Fallback AI Provider
 * Secondary AI provider when Vertex AI is unavailable
 * Moonshot AI's Kimi models with strong Bengali support
 */

const KIMI_API_KEY = process.env.KIMI_API_KEY;
const KIMI_BASE_URL = "https://api.moonshot.cn/v1";

/**
 * Check if Kimi API is properly configured
 */
export function isKimiConfigured(): boolean {
  return !!KIMI_API_KEY && KIMI_API_KEY.length > 0;
}

export interface KimiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface KimiCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "text" | "json_object" };
}

export interface KimiCompletionResult {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Call Kimi API for completions
 * @throws Error if KIMI_API_KEY is not configured or API call fails
 */
export async function callKimiAPI(
  messages: KimiMessage[],
  options: KimiCompletionOptions = {}
): Promise<KimiCompletionResult> {
  const { providers } = await import("./ai-config").then(m => m.getAIConfigs());
  const kimiConfig = providers?.kimi;

  const activeKey = kimiConfig?.is_active ? process.env.KIMI_API_KEY : KIMI_API_KEY;
  const activeBaseUrl = kimiConfig?.base_url || KIMI_BASE_URL;

  // Check if Kimi API is configured
  if (!activeKey || !kimiConfig?.is_active && !isKimiConfigured()) {
    throw new Error(
      "Kimi API not configured. Please set KIMI_API_KEY environment variable or enable Provider."
    );
  }

  const {
    model = kimiConfig?.model || "moonshot-v1-32k",
    temperature = kimiConfig?.temperature ?? 0.7,
    maxTokens = kimiConfig?.max_tokens || 4000,
    responseFormat = { type: "json_object" },
  } = options;

  const response = await fetch(`${activeBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${activeKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: responseFormat,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi API error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Generate slug using Kimi API
 */
export async function generateSlugWithKimi(title: string) {
  const { prompts } = await import("./ai-config").then(m => m.getAIConfigs());
  const { SLUG_AGENT_PROMPT } = await import("./prompts/eventPrompts");

  const systemPrompt = prompts?.slug_agent?.is_active
    ? prompts.slug_agent.system_prompt
    : SLUG_AGENT_PROMPT;

  const result = await callKimiAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Generate slug for: "${title}"` },
  ]);

  const content = result.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Kimi");

  return JSON.parse(content);
}

/**
 * Classify category using Kimi API
 */
export async function classifyCategoryWithKimi(title: string, description?: string) {
  const { prompts } = await import("./ai-config").then(m => m.getAIConfigs());
  const { CATEGORY_AGENT_PROMPT } = await import("./prompts/eventPrompts");

  const systemPrompt = prompts?.category_agent?.is_active
    ? prompts.category_agent.system_prompt
    : CATEGORY_AGENT_PROMPT;

  const userContent = description
    ? `Title: "${title}"\nDescription: "${description}"`
    : `Title: "${title}"`;

  const result = await callKimiAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ]);

  const content = result.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Kimi");

  return JSON.parse(content);
}

/**
 * Generate content using Kimi API
 */
export async function generateContentWithKimi(title: string, category: string) {
  const { prompts } = await import("./ai-config").then(m => m.getAIConfigs());
  const { CONTENT_AGENT_PROMPT } = await import("./prompts/eventPrompts");

  const systemPrompt = prompts?.content_agent?.is_active
    ? prompts.content_agent.system_prompt
    : CONTENT_AGENT_PROMPT;

  const result = await callKimiAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Title: "${title}"\nCategory: ${category}` },
  ], { maxTokens: 3000 });

  const content = result.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Kimi");

  return JSON.parse(content);
}

/**
 * Validate event using Kimi API
 */
export async function validateEventWithKimi(eventData: object) {
  const { prompts } = await import("./ai-config").then(m => m.getAIConfigs());
  const { VALIDATION_AGENT_PROMPT } = await import("./prompts/eventPrompts");

  const systemPrompt = prompts?.validation_agent?.is_active
    ? prompts.validation_agent.system_prompt
    : VALIDATION_AGENT_PROMPT;

  const result = await callKimiAPI([
    { role: "system", content: systemPrompt },
    { role: "user", content: `Validate: ${JSON.stringify(eventData, null, 2)}` },
  ]);

  const content = result.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from Kimi");

  return JSON.parse(content);
}

/**
 * Fallback wrapper - tries Vertex AI first, falls back to Kimi
 */
export async function withFallback<T>(
  vertexFn: () => Promise<T>,
  kimiFn: () => Promise<T>,
  options: { logFallback?: boolean } = {}
): Promise<T> {
  const { logFallback = true } = options;

  try {
    return await vertexFn();
  } catch (error) {
    if (logFallback) {
      console.warn("[AI Fallback] Vertex AI failed, switching to Kimi:",
        error instanceof Error ? error.message : error);
    }

    try {
      return await kimiFn();
    } catch (kimiError) {
      console.error("[AI Fallback] Kimi also failed:",
        kimiError instanceof Error ? kimiError.message : kimiError);
      throw new Error("Both AI providers failed");
    }
  }
}

/**
 * Health check for Kimi API
 */
export async function checkKimiHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();

  // Check if API key is configured first
  if (!isKimiConfigured()) {
    return {
      healthy: false,
      latencyMs: 0,
      error: "KIMI_API_KEY not configured",
    };
  }

  try {
    await callKimiAPI([
      { role: "user", content: "Respond with {\"status\": \"ok\"}" },
    ], { maxTokens: 50 });

    return {
      healthy: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
