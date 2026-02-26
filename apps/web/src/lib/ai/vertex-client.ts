/**
 * Vertex AI Client - Modular AI Services for Plokymarket
 * Primary AI provider for event creation and market resolution
 * Location: asia-south1 (Mumbai) for optimal Bangladesh latency
 */

import { 
  VertexAI, 
  HarmCategory, 
  HarmBlockThreshold,
  GenerativeModel,
  GenerationConfig
} from "@google-cloud/vertexai";

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
const LOCATION = process.env.VERTEX_LOCATION || "asia-south1";

// Safety settings for Bangladesh context
export const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Default generation config
const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.2,
  maxOutputTokens: 2048,
  topP: 0.9,
  topK: 40,
};

// Initialize Vertex AI client
function createVertexClient(): VertexAI {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64
    ? JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64, "base64").toString()
      )
    : undefined;

  return new VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
    googleAuthOptions: credentials ? { credentials } : undefined,
  });
}

// Singleton instance
let vertexClient: VertexAI | null = null;

export function getVertexClient(): VertexAI {
  if (!vertexClient) {
    vertexClient = createVertexClient();
  }
  return vertexClient;
}

// Model configuration types
export interface ModelConfig {
  modelName: string;
  systemInstruction: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

/**
 * Get a configured generative model for specific tasks
 */
export function getModel(config: ModelConfig): GenerativeModel {
  const client = getVertexClient();
  
  const generationConfig: GenerationConfig = {
    ...DEFAULT_GENERATION_CONFIG,
    temperature: config.temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
    maxOutputTokens: config.maxOutputTokens ?? DEFAULT_GENERATION_CONFIG.maxOutputTokens,
    responseMimeType: config.responseMimeType || "application/json",
  };

  return client.getGenerativeModel({
    model: config.modelName,
    systemInstruction: {
      parts: [{ text: config.systemInstruction }],
    },
    safetySettings: SAFETY_SETTINGS,
    generationConfig,
  });
}

// Pre-configured models for different tasks
export const MODELS = {
  // Fast, cost-effective for simple tasks
  SLUG_GENERATOR: {
    modelName: "gemini-1.5-flash-002",
    temperature: 0.1,
    maxOutputTokens: 256,
  },
  
  // Fast categorization
  CATEGORY_CLASSIFIER: {
    modelName: "gemini-1.5-flash-002",
    temperature: 0.2,
    maxOutputTokens: 512,
  },
  
  // Complex reasoning for content generation
  CONTENT_GENERATOR: {
    modelName: "gemini-1.5-pro-002",
    temperature: 0.3,
    maxOutputTokens: 2048,
  },
  
  // Strict validation
  VALIDATION_ENGINE: {
    modelName: "gemini-1.5-pro-002",
    temperature: 0.1,
    maxOutputTokens: 1024,
  },
  
  // Market configuration
  MARKET_CONFIGURATOR: {
    modelName: "gemini-1.5-pro-002",
    temperature: 0.2,
    maxOutputTokens: 1024,
  },
} as const;

/**
 * Execute with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; backoffMs?: number } = {}
): Promise<T> {
  const { retries = 3, backoffMs = 1000 } = options;
  
  let lastError: Error | undefined;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (i < retries - 1) {
        const delay = backoffMs * Math.pow(2, i);
        console.warn(`[Vertex AI] Retry ${i + 1}/${retries} after ${delay}ms: ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Parse JSON response from model
 */
export function parseJSONResponse(text: string): any {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch {
    // Extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // Extract JSON from curly braces
    const curlyMatch = text.match(/\{[\s\S]*\}/);
    if (curlyMatch) {
      return JSON.parse(curlyMatch[0]);
    }
    
    throw new Error("Could not extract JSON from response");
  }
}

/**
 * Health check for Vertex AI
 */
export async function checkVertexHealth(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  
  try {
    const model = getModel({
      modelName: "gemini-1.5-flash-002",
      systemInstruction: "You are a health check assistant. Respond with {\"status\": \"ok\"}",
      temperature: 0,
      maxOutputTokens: 50,
    });
    
    const result = await model.generateContent("Health check");
    const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (response) {
      const parsed = parseJSONResponse(response);
      return {
        healthy: parsed.status === "ok",
        latencyMs: Date.now() - start,
      };
    }
    
    return { healthy: false, latencyMs: Date.now() - start, error: "Empty response" };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
