/**
 * Vertex AI Client - Modular AI Services for Plokymarket
 * Primary AI provider for event creation and market resolution
 * Location: asia-south1 (Mumbai) for optimal Bangladesh latency
 *
 * Model changelog (2026-02-28):
 * - gemini-1.5-pro (deprecated by Google) → gemini-2.5-pro-preview-03-25
 * - gemini-1.5-flash (deprecated by Google) → gemini-2.0-flash-001
 * - gemini-1.5-pro-002 / gemini-1.5-flash-002 → still valid, kept as fallback refs
 */

import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
  GenerationConfig,
  Tool,
} from '@google-cloud/vertexai';

// ─── Configuration ────────────────────────────────────────────────────────────
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT!;
const LOCATION = process.env.VERTEX_LOCATION || 'asia-south1'; // Mumbai — lowest latency for BD

// ─── Safety Settings (Bangladesh context) ────────────────────────────────────
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

// ─── Default Generation Config ────────────────────────────────────────────────
const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.2,
  maxOutputTokens: 2048,
  topP: 0.9,
  topK: 40,
};

// ─── Client Singleton ─────────────────────────────────────────────────────────
function createVertexClient(): VertexAI {
  let credentials = undefined;

  const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    try {
      const decodedKey = Buffer.from(base64Key, 'base64').toString('utf-8');
      credentials = JSON.parse(decodedKey);

      // Fix potential literal newline escaping issues common in Vercel envs
      if (credentials?.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }
    } catch (e) {
      console.error('[Vertex Client] Failed to parse credentials', e);
    }
  }

  return new VertexAI({
    project: PROJECT_ID,
    location: LOCATION,
    googleAuthOptions: credentials ? { credentials } : undefined,
  });
}

let vertexClient: VertexAI | null = null;

export function getVertexClient(): VertexAI {
  if (!vertexClient) vertexClient = createVertexClient();
  return vertexClient;
}

// ─── Model Config Types ───────────────────────────────────────────────────────
export interface ModelConfig {
  modelName: string;
  systemInstruction: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

export function getModel(config: ModelConfig): GenerativeModel {
  const client = getVertexClient();

  const generationConfig: GenerationConfig = {
    ...DEFAULT_GENERATION_CONFIG,
    temperature: config.temperature ?? DEFAULT_GENERATION_CONFIG.temperature,
    maxOutputTokens: config.maxOutputTokens ?? DEFAULT_GENERATION_CONFIG.maxOutputTokens,
    responseMimeType: config.responseMimeType || 'application/json',
  };

  const vertexTools: Tool[] = [
    {
      // @ts-ignore - The types locally might not support disableAttribution yet although the backend does
      googleSearchRetrieval: {
        disableAttribution: false,
      } as any
    }
  ];

  return client.getGenerativeModel({
    model: config.modelName,
    systemInstruction: config.systemInstruction,
    safetySettings: SAFETY_SETTINGS,
    generationConfig,
    tools: vertexTools,
  });
}

// ─── Pre-configured Models ────────────────────────────────────────────────────
// ⚠️  Using auto-updated versions as per Gen AI SDK best practices
export const MODELS = {
  // Fast & cost-effective: slug gen, classification, risk checks
  SLUG_GENERATOR: {
    modelName: 'gemini-1.5-flash-002',
    temperature: 0.1,
    maxOutputTokens: 256,
  },

  CATEGORY_CLASSIFIER: {
    modelName: 'gemini-1.5-flash-002',
    temperature: 0.2,
    maxOutputTokens: 512,
  },

  // Heavy lifting: content generation, market proposals
  CONTENT_GENERATOR: {
    modelName: 'gemini-1.5-pro-002',
    temperature: 0.3,
    maxOutputTokens: 2048,
  },

  VALIDATION_ENGINE: {
    modelName: 'gemini-1.5-flash-002', // Fast is fine for validation
    temperature: 0.1,
    maxOutputTokens: 1024,
  },

  MARKET_CONFIGURATOR: {
    modelName: 'gemini-1.5-pro-002',
    temperature: 0.2,
    maxOutputTokens: 1024,
  },

  // Fallbacks (still active as of 2026-02)
  FLASH_FALLBACK: {
    modelName: 'gemini-1.5-flash-002',
    temperature: 0.2,
    maxOutputTokens: 1024,
  },

  PRO_FALLBACK: {
    modelName: 'gemini-1.5-pro-002',
    temperature: 0.2,
    maxOutputTokens: 2048,
  },
} as const;

// ─── Retry Utility ────────────────────────────────────────────────────────────
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
        console.warn(`[Vertex AI] Retry ${i + 1}/${retries} in ${delay}ms: ${lastError.message}`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

// ─── JSON Parse Utility ───────────────────────────────────────────────────────
export function parseJSONResponse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const mdMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (mdMatch) return JSON.parse(mdMatch[1].trim());

    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);

    throw new Error('Could not extract JSON from Vertex AI response');
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────
export async function checkVertexHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
  model: string;
  error?: string;
}> {
  const start = Date.now();
  const modelName = MODELS.SLUG_GENERATOR.modelName; // Cheapest model for health check

  try {
    const model = getModel({
      modelName,
      systemInstruction: 'Respond only with {"status":"ok"}',
      temperature: 0,
      maxOutputTokens: 50,
    });

    const result = await model.generateContent('ping');
    const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (response) {
      const parsed = parseJSONResponse(response);
      return { healthy: parsed.status === 'ok', latencyMs: Date.now() - start, model: modelName };
    }

    return { healthy: false, latencyMs: Date.now() - start, model: modelName, error: 'Empty response' };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      model: modelName,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
