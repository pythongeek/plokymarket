/**
 * Vertex AI Agent Client
 * Uses Vertex AI Agent API for advanced AI features
 * Requires Google Cloud Run or GCP environment
 */

import { VertexAI } from '@google-cloud/vertexai';

// Initialize Vertex AI with service account (works in GCP)
function initVertexAI(): VertexAI | null {
  try {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0578182636';
    const location = process.env.VERTEX_LOCATION || 'asia-south1';
    
    console.log(`[Vertex Agent] Initializing with project: ${project}, location: ${location}`);
    
    // In GCP environment (Cloud Run), auth is automatic
    return new VertexAI({ project, location });
  } catch (error) {
    console.error('[Vertex Agent] Failed to init:', error);
    return null;
  }
}

/**
 * Generate content using Vertex AI Agent
 */
export async function generateWithVertexAgent(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
) {
  const vertex = initVertexAI();
  if (!vertex) {
    throw new Error('Vertex AI not initialized');
  }

  const {
    model = 'gemini-1.5-flash',
    temperature = 0.2,
    maxOutputTokens = 2048,
  } = options;

  const generativeModel = vertex.preview.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens,
      temperature,
    },
  });

  const result = await generativeModel.generateContent(prompt);
  const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

  return {
    content: response,
    model,
    usage: result.response.usageMetadata,
  };
}

/**
 * Generate event content with Vertex AI Agent
 */
export async function generateEventWithAgent(rawInput: string) {
  const systemPrompt = `You are an expert event creator for Plokymarket, a Bangladeshi prediction market platform.

Create an engaging prediction market event based on the user's input.

Respond in JSON format:
{
  "title": "Event title in Bengali",
  "description": "Detailed description in Bengali",
  "category": "One of: Sports, Politics, Crypto, Weather, Entertainment, Other",
  "subcategory": "Specific subcategory",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedResolutionDate": "2026-03-15T00:00:00+06:00",
  "confidence": 0.85
}`;

  const prompt = `${systemPrompt}\n\nUser Input: "${rawInput}"`;

  const result = await generateWithVertexAgent(prompt, {
    model: 'gemini-1.5-pro',
    temperature: 0.3,
  });

  try {
    const parsed = JSON.parse(result.content || '{}');
    return {
      success: true,
      data: parsed,
      provider: 'vertex-agent',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to parse AI response',
      raw: result.content,
    };
  }
}

/**
 * Check Vertex AI Agent health
 */
export async function checkVertexAgentHealth() {
  const start = Date.now();
  
  try {
    const vertex = initVertexAI();
    if (!vertex) {
      return {
        healthy: false,
        latencyMs: 0,
        error: 'Vertex AI initialization failed',
      };
    }

    const model = vertex.preview.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    await model.generateContent('Say "ok"');

    return {
      healthy: true,
      latencyMs: Date.now() - start,
    };
  } catch (error: any) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      error: error.message,
    };
  }
}
