/**
 * AI Provider Switcher
 * Manages rotation between Vertex AI and Kimi API
 * Handles load balancing, token limits, and failover
 * 
 * NOTE: This module is designed for client-side use.
 * Vertex AI calls are proxied through API routes.
 */

import { ProviderConfig } from './types';

// Provider health tracking
const providers: Map<string, ProviderConfig> = new Map([
  ['vertex', { name: 'vertex', priority: 1, isAvailable: true }],
  ['kimi', { name: 'kimi', priority: 2, isAvailable: true }],
]);

// Rate limiting tracking
const rateLimitTracker = {
  vertex: { requests: 0, resetTime: Date.now() },
  kimi: { requests: 0, resetTime: Date.now() },
};

const RATE_LIMITS = {
  vertex: { requestsPerMinute: 60 },
  kimi: { requestsPerMinute: 100 },
};

/**
 * Check if provider is within rate limits
 */
function isWithinRateLimit(provider: 'vertex' | 'kimi'): boolean {
  const tracker = rateLimitTracker[provider];
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  // Reset counter if minute has passed
  if (now - tracker.resetTime > oneMinute) {
    tracker.requests = 0;
    tracker.resetTime = now;
  }
  
  return tracker.requests < RATE_LIMITS[provider].requestsPerMinute;
}

/**
 * Increment request counter for provider
 */
export function trackRequest(provider: 'vertex' | 'kimi'): void {
  rateLimitTracker[provider].requests++;
}

/**
 * Mark provider as unavailable
 */
export function markProviderUnavailable(
  provider: 'vertex' | 'kimi',
  error?: string
): void {
  const config = providers.get(provider);
  if (config) {
    config.isAvailable = false;
    config.lastError = error;
    providers.set(provider, config);
  }
  
  // Auto-recovery after 5 minutes
  setTimeout(() => {
    const cfg = providers.get(provider);
    if (cfg) {
      cfg.isAvailable = true;
      cfg.lastError = undefined;
      providers.set(provider, cfg);
    }
  }, 5 * 60 * 1000);
}

/**
 * Get the best available provider
 */
export function getBestProvider(): 'vertex' | 'kimi' | null {
  const sortedProviders = Array.from(providers.values())
    .filter(p => p.isAvailable && isWithinRateLimit(p.name))
    .sort((a, b) => a.priority - b.priority);
  
  return sortedProviders.length > 0 ? sortedProviders[0].name : null;
}

/**
 * Execute with automatic failover
 * Client-side: Uses API routes
 */
export async function executeWithFailover<T>(
  vertexFn: () => Promise<T>,
  kimiFn: () => Promise<T>,
  ruleBasedFn?: () => T
): Promise<{ result: T; provider: 'vertex' | 'kimi' | 'rule-based' }> {
  const provider = getBestProvider();
  
  // Try Vertex AI first if available
  if (provider === 'vertex' || (!provider && providers.get('vertex')?.isAvailable)) {
    try {
      trackRequest('vertex');
      const result = await vertexFn();
      return { result, provider: 'vertex' };
    } catch (error) {
      console.warn('[ProviderSwitcher] Vertex AI failed:', error);
      markProviderUnavailable('vertex', String(error));
    }
  }
  
  // Fallback to Kimi
  if (providers.get('kimi')?.isAvailable) {
    try {
      trackRequest('kimi');
      const result = await kimiFn();
      return { result, provider: 'kimi' };
    } catch (error) {
      console.warn('[ProviderSwitcher] Kimi failed:', error);
      markProviderUnavailable('kimi', String(error));
    }
  }
  
  // Final fallback to rule-based
  if (ruleBasedFn) {
    console.warn('[ProviderSwitcher] Using rule-based fallback');
    return { result: ruleBasedFn(), provider: 'rule-based' };
  }
  
  throw new Error('All AI providers unavailable');
}

/**
 * Get provider health status
 */
export function getProviderHealth(): ProviderConfig[] {
  return Array.from(providers.values());
}

/**
 * Force provider rotation
 */
export function rotateProvider(): 'vertex' | 'kimi' {
  const current = getBestProvider();
  return current === 'vertex' ? 'kimi' : 'vertex';
}

/**
 * Initialize Vertex AI client (SERVER-SIDE ONLY)
 * This function should only be called from API routes
 */
export async function initVertexAI(): Promise<any | null> {
  // This is a stub for client-side compatibility
  // Actual implementation is in API routes
  console.warn('[ProviderSwitcher] initVertexAI should only be called server-side');
  return null;
}
