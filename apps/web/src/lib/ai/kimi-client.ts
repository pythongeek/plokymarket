/**
 * Kimi API Client - Fallback AI Provider
 * Secondary AI provider when Vertex AI is unavailable
 * Moonshot AI's Kimi models with strong Bengali support
 */

const KIMI_API_KEY = process.env.KIMI_API_KEY!;
const KIMI_BASE_URL = "https://api.moonshot.cn/v1";

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
 */
export async function callKimiAPI(
  messages: KimiMessage[],
  options: KimiCompletionOptions = {}
): Promise<KimiCompletionResult> {
  const {
    model = "kimi-k1.5",
    temperature = 0.2,
    maxTokens = 2048,
    responseFormat = { type: "json_object" },
  } = options;

  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KIMI_API_KEY}`,
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
  const systemPrompt = `You are a URL slug generator. Convert titles to URL-safe slugs.
Rules:
1. Transliterate Bengali to English
2. Use only lowercase, numbers, hyphens
3. Max 60 characters

Respond in JSON:
{
  "slug": "url-slug",
  "title": "optimized title",
  "language": "bn|en|mixed",
  "keywords": ["keyword1"]
}`;

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
  const systemPrompt = `Classify events into categories.
Categories: politics, sports, crypto, economics, weather, entertainment, technology, international

Respond in JSON:
{
  "primary": "category",
  "secondary": ["sub"],
  "tags": ["bd-local"],
  "confidence": 0.9,
  "reasoning": "..."
}`;

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
  const systemPrompt = `Generate event descriptions for prediction markets.
Include: description, resolution criteria (yes/no/edge cases), resolution source, context

Respond in JSON:
{
  "description": "...",
  "resolutionCriteria": { "yes": "...", "no": "...", "edgeCases": "..." },
  "resolutionSource": { "name": "...", "url": "..." },
  "context": "...",
  "language": "bn|en|mixed"
}`;

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
  const systemPrompt = `Validate prediction market events.
Score 0-1, recommendation: approve/review/revise/reject

Respond in JSON:
{
  "score": 0.85,
  "recommendation": "approve",
  "breakdown": { "titleQuality": 0.9, "descriptionQuality": 0.8, "resolutionCriteria": 0.85, "resolutionSource": 0.9, "feasibility": 0.85 },
  "risks": [],
  "improvements": [],
  "confidence": 0.9
}`;

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
