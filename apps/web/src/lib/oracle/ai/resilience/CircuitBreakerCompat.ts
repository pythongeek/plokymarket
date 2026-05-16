/**
 * Compatibility shim for old CircuitBreaker API.
 * Maps to RedisCircuitBreaker (distributed, Redis-backed).
 * @deprecated Use RedisCircuitBreaker directly.
 */

import {
  executeWithCircuitBreaker,
  getCircuitState,
  resetCircuit,
  type RedisCircuitState,
} from "./RedisCircuitBreaker";

export interface CircuitBreakerState extends RedisCircuitState {}

export class CircuitBreakerCompat {
  async execute<T>(
    service: string,
    fn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    return executeWithCircuitBreaker(service, fn, fallback);
  }

  getAllStates(): CircuitBreakerState[] {
    // Cannot be async in the old API — return empty, use getCircuitState for specific services
    return [];
  }

  reset(service: string): Promise<void> {
    return resetCircuit(service);
  }
}

let globalInstance: CircuitBreakerCompat | null = null;

export function getGlobalCircuitBreaker(): CircuitBreakerCompat {
  if (!globalInstance) {
    globalInstance = new CircuitBreakerCompat();
  }
  return globalInstance;
}
