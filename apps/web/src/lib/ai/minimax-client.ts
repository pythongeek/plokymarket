/**
 * MiniMax AI Client
 * Provides text generation and agent capabilities via MiniMax API
 */

const MINIMAX_API_BASE = 'https://api.minimax.io/v1';

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MiniMaxGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}

interface MiniMaxResponse {
  id: string;
  model: string;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

function getMiniMaxClient() {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;

  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY is not set in environment variables');
  }

  return { apiKey, groupId };
}

/**
 * Generate text using MiniMax API
 */
export async function generateWithMiniMax(
  prompt: string,
  options: MiniMaxGenerateOptions = {}
): Promise<MiniMaxResponse> {
  const start = Date.now();
  const { apiKey, groupId } = getMiniMaxClient();

  const {
    model = 'abab6.5s-chat',
    temperature = 0.7,
    maxTokens = 2048,
    topP = 0.95,
  } = options;

  const response = await fetch(`${MINIMAX_API_BASE}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - start;

  // Parse MiniMax response format
  const choices = data.choices || [];
  const content = choices[0]?.messages?.[0]?.text
    || choices[0]?.message?.content
    || choices[0]?.text
    || '';

  return {
    id: data.id || '',
    model: data.model || model,
    content: typeof content === 'string' ? content : JSON.stringify(content),
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
    latencyMs,
  };
}

/**
 * Generate event content with MiniMax AI Agent
 * System prompt configured for Plokymarket event creation
 */
export async function generateEventWithMiniMax(rawInput: string): Promise<{
  success: boolean;
  data?: any;
  provider: string;
  error?: string;
}> {
  const systemPrompt = `You are an expert event creator for Plokymarket, a Bangladeshi prediction market platform.

Create an engaging prediction market event based on the user's input.

Respond ONLY in valid JSON format (no markdown, no explanation):
{
  "title": "Event title in Bengali",
  "description": "Detailed description in Bengali",
  "category": "Sports|Politics|Crypto|Weather|Entertainment|Other",
  "subcategory": "Specific subcategory",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedResolutionDate": "2026-MM-DD",
  "confidence": 0.85
}`;

  try {
    const result = await generateWithMiniMax(
      `${systemPrompt}\n\nUser Input: "${rawInput}"`,
      {
        model: 'abab6.5s-chat',
        temperature: 0.3,
        maxTokens: 1024,
      }
    );

    // Try to parse JSON from response
    const text = result.content.trim();
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      // Try extracting JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return {
          success: false,
          error: 'Failed to parse AI response as JSON',
          raw: text,
          provider: 'minimax',
        };
      }
    }

    return {
      success: true,
      data: parsed,
      provider: 'minimax',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      provider: 'minimax',
    };
  }
}

/**
 * Generate daily topic with MiniMax AI
 */
export async function generateDailyTopicWithMiniMax(context?: string): Promise<{
  success: boolean;
  data?: { topic: string; description: string; category: string; tags: string[] };
  provider: string;
  error?: string;
}> {
  const prompt = `You are an AI content curator for Plokymarket, a Bangladeshi prediction market.

Generate an interesting, timely prediction market topic for today.

Respond ONLY in valid JSON format:
{
  "topic": "A compelling question/topic in Bengali",
  "description": "Why this topic is interesting for prediction trading",
  "category": "Sports|Politics|Crypto|Weather|Entertainment|Other",
  "tags": ["tag1", "tag2"]
}

${context ? `Context:\n${context}` : ''}`;

  try {
    const result = await generateWithMiniMax(prompt, {
      temperature: 0.6,
      maxTokens: 512,
    });

    const text = result.content.trim();
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return { success: false, error: 'Failed to parse response', provider: 'minimax' };
      }
    }

    return { success: true, data: parsed, provider: 'minimax' };
  } catch (error: any) {
    return { success: false, error: error.message, provider: 'minimax' };
  }
}

/**
 * Check MiniMax API health
 */
export async function checkMiniMaxHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await generateWithMiniMax('Say "ok" in one word.', {
      maxTokens: 10,
      temperature: 0.1,
    });

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

/**
 * Structured content generation with MiniMax
 * Used for multi-field content (market logic, timing, risk, etc.)
 */
export async function generateStructuredContentWithMiniMax(
  schema: string,
  userInput: string
): Promise<{ success: boolean; data?: any; provider: string; error?: string }> {
  try {
    const result = await generateWithMiniMax(
      `You are an AI assistant for Plokymarket prediction market platform.\n\n${schema}\n\nUser input: "${userInput}"\n\nRespond ONLY with valid JSON.`,
      { temperature: 0.3, maxTokens: 2048 }
    );

    const text = result.content.trim();
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return { success: false, error: 'Failed to parse JSON', provider: 'minimax', raw: text };
      }
    }

    return { success: true, data: parsed, provider: 'minimax' };
  } catch (error: any) {
    return { success: false, error: error.message, provider: 'minimax' };
  }
}
