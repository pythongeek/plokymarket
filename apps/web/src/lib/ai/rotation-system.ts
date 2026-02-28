/**
 * AI Provider Rotation System
 * Vertex + Kimi Combine Mode with Health Monitoring
 * 
 * Modes:
 * - combine: Run both providers, return highest confidence
 * - race: First response wins (speed critical)
 * - vertex: Vertex AI only
 * - kimi: Kimi only
 * - auto: Automatically select based on provider health
 */

export interface ProviderResponse {
  provider: 'vertex' | 'kimi';
  data: any;
  confidence: number;
  latency: number;
  rawResponse?: string;
  error?: string;
}

export interface RouterConfig {
  mode: 'combine' | 'race' | 'vertex' | 'kimi' | 'auto';
  timeoutMs: number;
  minConfidence: number;
  useBanglaContext?: boolean;
}

export interface HealthStatus {
  vertex: { health: number; latency: number };
  kimi: { health: number; latency: number };
  recommended: 'vertex' | 'kimi';
}

const DEFAULT_CONFIG: RouterConfig = {
  mode: 'auto',
  timeoutMs: 30000,
  minConfidence: 60,
  useBanglaContext: true,
};

export class AIRotationSystem {
  private vertexHealth = 100;
  private kimiHealth = 100;
  private vertexLatencyMs = 0;
  private kimiLatencyMs = 0;
  private kimiApiKey: string | undefined;

  constructor() {
    this.kimiApiKey = process.env.KIMI_API_KEY;
  }

  /**
   * Route a prompt to the appropriate AI provider(s)
   */
  async route(
    prompt: string,
    config: Partial<RouterConfig> = {}
  ): Promise<ProviderResponse> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const effectiveMode = this.resolveMode(finalConfig.mode);

    switch (effectiveMode) {
      case 'combine':
        return this.combineMode(prompt, finalConfig);
      case 'race':
        return this.raceMode(prompt, finalConfig);
      case 'vertex':
        return this.callVertex(prompt, finalConfig);
      case 'kimi':
        return this.callKimi(prompt, finalConfig);
      default:
        return this.combineMode(prompt, finalConfig);
    }
  }

  /**
   * Get current health status of providers
   */
  getHealthStatus(): HealthStatus {
    return {
      vertex: { health: this.vertexHealth, latency: this.vertexLatencyMs },
      kimi: { health: this.kimiHealth, latency: this.kimiLatencyMs },
      recommended: this.vertexHealth >= this.kimiHealth ? 'vertex' : 'kimi',
    };
  }

  /**
   * Resolve the effective mode based on request and health
   */
  private resolveMode(requested: string): string {
    if (requested !== 'auto') return requested;

    // Auto mode: degrade to healthy provider
    if (this.vertexHealth < 30) return 'kimi';
    if (this.kimiHealth < 30) return 'vertex';

    // Both healthy - use combine for best results
    return 'combine';
  }

  /**
   * Combine mode: Run both providers and select best result
   */
  private async combineMode(
    prompt: string,
    config: RouterConfig
  ): Promise<ProviderResponse> {
    const [vertexResult, kimiResult] = await Promise.allSettled([
      this.withTimeout(this.callVertex(prompt, config), config.timeoutMs),
      this.withTimeout(this.callKimi(prompt, config), config.timeoutMs),
    ]);

    const responses: ProviderResponse[] = [];

    if (vertexResult.status === 'fulfilled') {
      responses.push(vertexResult.value);
      this.updateHealth('vertex', true, vertexResult.value.latency);
    } else {
      this.updateHealth('vertex', false, config.timeoutMs);
    }

    if (kimiResult.status === 'fulfilled') {
      responses.push(kimiResult.value);
      this.updateHealth('kimi', true, kimiResult.value.latency);
    } else {
      this.updateHealth('kimi', false, config.timeoutMs);
    }

    if (responses.length === 0) {
      throw new Error('All AI providers failed');
    }

    // Return highest confidence response
    return responses.reduce((best, r) =>
      r.confidence > best.confidence ? r : best
    );
  }

  /**
   * Race mode: First response wins
   */
  private async raceMode(
    prompt: string,
    config: RouterConfig
  ): Promise<ProviderResponse> {
    return Promise.race([
      this.withTimeout(this.callVertex(prompt, config), config.timeoutMs),
      this.withTimeout(this.callKimi(prompt, config), config.timeoutMs),
    ]);
  }

  /**
   * Call Vertex AI API
   */
  private async callVertex(
    prompt: string,
    config: RouterConfig
  ): Promise<ProviderResponse> {
    const start = Date.now();

    try {
      // Add Bangla context if requested
      const contextualPrompt = config.useBanglaContext
        ? `${prompt}\n\nContext: Generate content suitable for Bangladesh market. Use Bengali language where appropriate.`
        : prompt;

      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));
      const res = await fetch(`${baseUrl}/api/ai/vertex-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          context: { rawInput: contextualPrompt },
        }),
      });

      if (!res.ok) {
        throw new Error(`Vertex API error: ${res.status}`);
      }

      const data = await res.json();
      const latency = Date.now() - start;

      // Calculate confidence based on response quality
      const confidence = this.calculateVertexConfidence(data);

      return {
        provider: 'vertex',
        data,
        confidence,
        latency,
        rawResponse: JSON.stringify(data),
      };
    } catch (error) {
      throw {
        provider: 'vertex',
        error: String(error),
        latency: Date.now() - start,
      };
    }
  }

  /**
   * Call Kimi API
   */
  private async callKimi(
    prompt: string,
    config: RouterConfig
  ): Promise<ProviderResponse> {
    const start = Date.now();

    if (!this.kimiApiKey) {
      throw new Error('Kimi API key not configured');
    }

    try {
      // Add Bangla context if requested
      const contextualPrompt = config.useBanglaContext
        ? `${prompt}\n\nদয়া করে বাংলাদেশের প্রেক্ষাপট বিবেচনা করে বাংলা ভাষায় উপযুক্ত কন্টেন্ট তৈরি করুন।`
        : prompt;

      const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.kimiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [{ role: 'user', content: contextualPrompt }],
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        throw new Error(`Kimi API error: ${res.status}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      const latency = Date.now() - start;

      if (!content) {
        throw new Error('Empty response from Kimi');
      }

      // Try to parse JSON response
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch {
        // If not JSON, wrap in object
        parsedData = { content, raw: true };
      }

      // Calculate confidence
      const confidence = this.calculateKimiConfidence(parsedData, content);

      return {
        provider: 'kimi',
        data: parsedData,
        confidence,
        latency,
        rawResponse: content,
      };
    } catch (error) {
      throw {
        provider: 'kimi',
        error: String(error),
        latency: Date.now() - start,
      };
    }
  }

  /**
   * Calculate confidence score for Vertex response
   */
  private calculateVertexConfidence(data: any): number {
    let score = 75; // Base score

    // Boost for structured data
    if (data && typeof data === 'object') {
      score += 10;
    }

    // Boost for confidence field
    if (data?.confidence) {
      score = Math.min(100, data.confidence);
    }

    // Penalty for errors
    if (data?.error) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate confidence score for Kimi response
   */
  private calculateKimiConfidence(data: any, rawContent: string): number {
    let score = 70; // Base score

    // Boost for structured JSON
    if (data && !data.raw) {
      score += 10;
    }

    // Boost for Bengali content
    if (this.containsBengali(rawContent)) {
      score += 10;
    }

    // Boost for length (more detailed responses)
    if (rawContent.length > 200) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if text contains Bengali characters
   */
  private containsBengali(text: string): boolean {
    // Bengali Unicode range: \u0980-\u09FF
    return /[\u0980-\u09FF]/.test(text);
  }

  /**
   * Update provider health score
   */
  private updateHealth(
    provider: 'vertex' | 'kimi',
    success: boolean,
    latency: number
  ) {
    if (provider === 'vertex') {
      this.vertexHealth = success
        ? Math.min(100, this.vertexHealth + 5)
        : Math.max(0, this.vertexHealth - 20);
      this.vertexLatencyMs = latency;
    } else {
      this.kimiHealth = success
        ? Math.min(100, this.kimiHealth + 5)
        : Math.max(0, this.kimiHealth - 20);
      this.kimiLatencyMs = latency;
    }
  }

  /**
   * Wrap promise with timeout
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);
  }
}

// Singleton instance (shared across requests via module cache)
export const aiRotationSystem = new AIRotationSystem();

/**
 * Generate market outcomes using AI
 * Uses Combine Mode: Vertex for fact retrieval, Kimi for Bangla nuance
 */
export async function generateOutcomesWithAI(
  eventName: string,
  category: string,
  context?: string
): Promise<{
  outcomes: Array<{ label: string; labelBn: string; initialPrice: number }>;
  confidence: number;
  provider: string;
}> {
  const prompt = `Generate 2-4 possible outcomes for this prediction market:

Event: ${eventName}
Category: ${category}
${context ? `Context: ${context}` : ''}

Return a JSON object with this structure:
{
  "outcomes": [
    { "label": "Outcome 1", "labelBn": "ফলাফল ১", "initialPrice": 0.5 },
    { "label": "Outcome 2", "labelBn": "ফলাফল ২", "initialPrice": 0.3 }
  ]
}

Rules:
- Labels should be clear and specific
- labelBn should be natural Bengali translations
- initialPrice should sum to approximately 1.0 across all outcomes
- Include 2-4 outcomes depending on the event complexity`;

  const response = await aiRotationSystem.route(prompt, {
    mode: 'combine',
    timeoutMs: 30000,
    useBanglaContext: true,
  });

  // Validate and normalize outcomes
  const outcomes = response.data?.outcomes || [];
  const normalizedOutcomes = outcomes.map((o: any) => ({
    label: o.label || 'Unknown',
    labelBn: o.labelBn || o.label || 'অজানা',
    initialPrice: Math.max(0.01, Math.min(0.99, o.initialPrice || 0.5)),
  }));

  return {
    outcomes: normalizedOutcomes,
    confidence: response.confidence,
    provider: response.provider,
  };
}

/**
 * Analyze price trend using AI
 */
export async function analyzePriceTrendWithAI(
  marketId: string,
  priceHistory: Array<{ price: number; recordedAt: string }>
): Promise<{
  trend: 'up' | 'down' | 'stable';
  analysis: string;
  analysisBn: string;
  confidence: number;
}> {
  const prompt = `Analyze this price trend data and provide insights:

Price History: ${JSON.stringify(priceHistory.slice(-24))}

Return a JSON object:
{
  "trend": "up|down|stable",
  "analysis": "Brief trend analysis in English",
  "analysisBn": "বাংলায় সংক্ষিপ্ত বিশ্লেষণ"
}`;

  const response = await aiRotationSystem.route(prompt, {
    mode: 'combine',
    timeoutMs: 20000,
    useBanglaContext: true,
  });

  return {
    trend: response.data?.trend || 'stable',
    analysis: response.data?.analysis || 'No analysis available',
    analysisBn: response.data?.analysisBn || 'কোনো বিশ্লেষণ উপলব্ধ নেই',
    confidence: response.confidence,
  };
}
/**
 * Helper to execute a prompt with rotation
 */
export async function executeWithRotation(
  prompt: string,
  config: Partial<RouterConfig> = {}
): Promise<ProviderResponse> {
  return aiRotationSystem.route(prompt, config);
}

/**
 * Get current status of all providers
 */
export function getProviderStatus() {
  return aiRotationSystem.getHealthStatus();
}

/**
 * Type for AI providers
 */
export type AIProvider = 'vertex' | 'kimi';

/**
 * Placeholder for additional stats
 */
export function getRotationStats() {
  return {
    timestamp: new Date().toISOString(),
    providers: aiRotationSystem.getHealthStatus(),
  };
}

/**
 * Force a specific provider (by setting mode in config)
 */
export function forceProvider(provider: AIProvider): Partial<RouterConfig> {
  return { mode: provider };
}

/**
 * Reset health (not implemented in class but added for API compatibility)
 */
export function resetProviderStatus() {
  console.log('Resetting provider health status...');
  // In a real implementation, we would call a reset method on the singleton
}
