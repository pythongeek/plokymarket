/**
 * AI Provider Rotation System
 * Manages fallback between Vertex AI and Kimi API
 * Implements circuit breaker pattern for reliability
 */

import { checkVertexHealth } from "./vertex-client";
import { checkKimiHealth } from "./kimi-client";

export type AIProvider = "vertex" | "kimi" | "fallback";

interface ProviderStatus {
  provider: AIProvider;
  healthy: boolean;
  latencyMs: number;
  failureCount: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
}

interface RotationConfig {
  maxFailures: number;
  cooldownMs: number;
  timeoutMs: number;
  preferVertex: boolean;
}

const DEFAULT_CONFIG: RotationConfig = {
  maxFailures: 3,
  cooldownMs: 60000, // 1 minute
  timeoutMs: 30000,  // 30 seconds
  preferVertex: true,
};

// Provider status tracking
const providerStatus: Record<AIProvider, ProviderStatus> = {
  vertex: {
    provider: "vertex",
    healthy: true,
    latencyMs: 0,
    failureCount: 0,
    lastFailure: null,
    lastSuccess: null,
  },
  kimi: {
    provider: "kimi",
    healthy: true,
    latencyMs: 0,
    failureCount: 0,
    lastFailure: null,
    lastSuccess: null,
  },
  fallback: {
    provider: "fallback",
    healthy: true,
    latencyMs: 0,
    failureCount: 0,
    lastFailure: null,
    lastSuccess: null,
  },
};

/**
 * Get current provider status
 */
export function getProviderStatus(): Record<AIProvider, ProviderStatus> {
  return { ...providerStatus };
}

/**
 * Check if provider is available (not in cooldown)
 */
function isProviderAvailable(provider: AIProvider, config: RotationConfig): boolean {
  const status = providerStatus[provider];
  
  if (status.failureCount >= config.maxFailures && status.lastFailure) {
    const timeSinceFailure = Date.now() - status.lastFailure.getTime();
    if (timeSinceFailure < config.cooldownMs) {
      return false;
    }
    // Reset failure count after cooldown
    status.failureCount = 0;
  }
  
  return status.healthy;
}

/**
 * Record success for a provider
 */
function recordSuccess(provider: AIProvider, latencyMs: number) {
  const status = providerStatus[provider];
  status.healthy = true;
  status.latencyMs = latencyMs;
  status.failureCount = 0;
  status.lastSuccess = new Date();
}

/**
 * Record failure for a provider
 */
function recordFailure(provider: AIProvider, error: Error) {
  const status = providerStatus[provider];
  status.failureCount++;
  status.lastFailure = new Date();
  
  if (status.failureCount >= DEFAULT_CONFIG.maxFailures) {
    status.healthy = false;
    console.warn(`[Rotation] ${provider} marked unhealthy after ${status.failureCount} failures`);
  }
}

/**
 * Select best available provider
 */
export async function selectProvider(
  config: Partial<RotationConfig> = {}
): Promise<AIProvider> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Check health of both providers
  const [vertexHealth, kimiHealth] = await Promise.all([
    checkVertexHealth().catch(() => ({ healthy: false, latencyMs: 0 })),
    checkKimiHealth().catch(() => ({ healthy: false, latencyMs: 0 })),
  ]);
  
  providerStatus.vertex.healthy = vertexHealth.healthy;
  providerStatus.vertex.latencyMs = vertexHealth.latencyMs;
  providerStatus.kimi.healthy = kimiHealth.healthy;
  providerStatus.kimi.latencyMs = kimiHealth.latencyMs;
  
  // Priority selection
  if (fullConfig.preferVertex && vertexHealth.healthy && isProviderAvailable("vertex", fullConfig)) {
    return "vertex";
  }
  
  if (kimiHealth.healthy && isProviderAvailable("kimi", fullConfig)) {
    return "kimi";
  }
  
  // Fallback to vertex if not preferred but available
  if (vertexHealth.healthy && isProviderAvailable("vertex", fullConfig)) {
    return "vertex";
  }
  
  // Last resort: rule-based fallback
  return "fallback";
}

/**
 * Execute with automatic provider rotation
 */
export async function executeWithRotation<T>(
  vertexFn: () => Promise<T>,
  kimiFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  config: Partial<RotationConfig> = {}
): Promise<{ result: T; provider: AIProvider; latencyMs: number }> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  
  const provider = await selectProvider(fullConfig);
  
  try {
    let result: T;
    
    switch (provider) {
      case "vertex":
        result = await Promise.race([
          vertexFn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Vertex AI timeout")), fullConfig.timeoutMs)
          ),
        ]);
        recordSuccess("vertex", Date.now() - startTime);
        return { result, provider: "vertex", latencyMs: Date.now() - startTime };
        
      case "kimi":
        result = await Promise.race([
          kimiFn(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Kimi API timeout")), fullConfig.timeoutMs)
          ),
        ]);
        recordSuccess("kimi", Date.now() - startTime);
        return { result, provider: "kimi", latencyMs: Date.now() - startTime };
        
      case "fallback":
        result = await fallbackFn();
        recordSuccess("fallback", Date.now() - startTime);
        return { result, provider: "fallback", latencyMs: Date.now() - startTime };
    }
  } catch (error) {
    recordFailure(provider, error instanceof Error ? error : new Error(String(error)));
    
    // Try next available provider
    if (provider === "vertex" && providerStatus.kimi.healthy) {
      console.warn(`[Rotation] Vertex failed, trying Kimi...`);
      return executeWithRotation(vertexFn, kimiFn, fallbackFn, { ...fullConfig, preferVertex: false });
    }
    
    if (provider === "kimi" && providerStatus.vertex.healthy) {
      console.warn(`[Rotation] Kimi failed, trying Vertex...`);
      return executeWithRotation(vertexFn, kimiFn, fallbackFn, { ...fullConfig, preferVertex: true });
    }
    
    // All providers failed, use fallback
    console.warn(`[Rotation] All providers failed, using rule-based fallback`);
    const result = await fallbackFn();
    return { result, provider: "fallback", latencyMs: Date.now() - startTime };
  }
}

/**
 * Force provider selection (for testing or manual override)
 */
export function forceProvider(provider: AIProvider) {
  providerStatus.vertex.healthy = provider === "vertex";
  providerStatus.kimi.healthy = provider === "kimi";
  
  if (provider !== "fallback") {
    providerStatus[provider].failureCount = 0;
    providerStatus[provider].lastFailure = null;
  }
}

/**
 * Reset all provider statuses
 */
export function resetProviderStatus() {
  Object.values(providerStatus).forEach(status => {
    status.healthy = true;
    status.failureCount = 0;
    status.lastFailure = null;
  });
}

/**
 * Get rotation statistics
 */
export function getRotationStats() {
  return {
    providers: { ...providerStatus },
    recommendation: getRecommendation(),
  };
}

function getRecommendation(): string {
  const { vertex, kimi } = providerStatus;
  
  if (vertex.healthy && kimi.healthy) {
    return "Both providers healthy - using Vertex AI (preferred)";
  }
  
  if (vertex.healthy && !kimi.healthy) {
    return "Kimi unhealthy - using Vertex AI only";
  }
  
  if (!vertex.healthy && kimi.healthy) {
    return "Vertex unhealthy - using Kimi API";
  }
  
  return "CRITICAL: Both providers unhealthy - using rule-based fallback";
}
