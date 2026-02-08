/**
 * LRU Cache with TTL for AI Oracle
 * Prevents redundant API calls and improves response times
 */

import { CacheEntry } from '../types';

interface CacheOptions {
  maxSize: number;
  defaultTtlMs: number;
}

export class OracleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private accessOrder: string[] = [];
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize;
    this.defaultTtlMs = options.defaultTtlMs;
  }

  /**
   * Generate cache key from query parameters
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }
    
    // Update access order (LRU)
    this.updateAccessOrder(key);
    
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, tags: string[] = [], ttlMs?: number): void {
    // Evict if at capacity and adding new key
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTtlMs),
      tags
    };
    
    this.cache.set(key, entry);
    
    // Add to access order if new
    if (!this.accessOrder.includes(key)) {
      this.accessOrder.push(key);
    }
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    return existed;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get or compute value with cache
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    tags: string[] = [],
    ttlMs?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    
    const value = await compute();
    this.set(key, value, tags, ttlMs);
    return value;
  }

  /**
   * Invalidate entries by tag
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
        count++;
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return count;
  }

  /**
   * Invalidate entries by prefix
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
        count++;
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entriesByTag: Record<string, number>;
  } {
    const entriesByTag: Record<string, number> = {};
    
    for (const entry of this.cache.values()) {
      for (const tag of entry.tags) {
        entriesByTag[tag] = (entriesByTag[tag] || 0) + 1;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need hit/miss counters for real metric
      entriesByTag
    };
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder[0];
    this.delete(lruKey);
    
    console.log(`[OracleCache] Evicted LRU entry: ${lruKey}`);
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
        count++;
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return count;
  }
}

// Cache key prefixes for different data types
export const CACHE_KEYS = {
  EVIDENCE_RETRIEVAL: 'evidence',
  SYNTHESIS: 'synthesis',
  DELIBERATION: 'deliberation',
  EXPLANATION: 'explanation',
  FULL_PIPELINE: 'pipeline',
  SOURCE_AUTHORITY: 'authority'
} as const;

// Singleton instance
let globalCache: OracleCache | null = null;

export function getGlobalCache(maxSize = 1000, defaultTtlMs = 300000): OracleCache {
  if (!globalCache) {
    globalCache = new OracleCache({ maxSize, defaultTtlMs });
  }
  return globalCache;
}
