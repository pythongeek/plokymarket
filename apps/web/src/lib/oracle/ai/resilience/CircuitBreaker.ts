/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascade failures in distributed AI Oracle system
 */

import { CircuitBreakerState } from '../types';

export class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private readonly defaultThreshold: number;
  private readonly defaultTimeoutMs: number;
  private readonly halfOpenMaxCalls: number;

  constructor(
    defaultThreshold: number = 5,
    defaultTimeoutMs: number = 60000,
    halfOpenMaxCalls: number = 3
  ) {
    this.defaultThreshold = defaultThreshold;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.halfOpenMaxCalls = halfOpenMaxCalls;
  }

  /**
   * Get or create circuit breaker state for a service
   */
  private getState(service: string): CircuitBreakerState {
    if (!this.states.has(service)) {
      this.states.set(service, {
        service,
        status: 'closed',
        failureCount: 0,
        successCount: 0,
        threshold: this.defaultThreshold,
        timeoutMs: this.defaultTimeoutMs
      });
    }
    return this.states.get(service)!;
  }

  /**
   * Check if request can proceed
   */
  canProceed(service: string): boolean {
    const state = this.getState(service);
    
    switch (state.status) {
      case 'closed':
        return true;
        
      case 'open':
        // Check if timeout has elapsed
        if (state.openedAt) {
          const openedTime = new Date(state.openedAt).getTime();
          if (Date.now() - openedTime > state.timeoutMs) {
            // Transition to half-open
            this.transitionToHalfOpen(service);
            return true;
          }
        }
        return false;
        
      case 'half_open':
        // Allow limited requests in half-open state
        return state.successCount < this.halfOpenMaxCalls;
        
      default:
        return false;
    }
  }

  /**
   * Record successful request
   */
  recordSuccess(service: string): void {
    const state = this.getState(service);
    
    switch (state.status) {
      case 'closed':
        // Reset failure count on success
        state.failureCount = 0;
        break;
        
      case 'half_open':
        state.successCount++;
        // If enough successes, close the circuit
        if (state.successCount >= this.halfOpenMaxCalls) {
          this.transitionToClosed(service);
        }
        break;
    }
    
    state.lastSuccessAt = new Date().toISOString();
  }

  /**
   * Record failed request
   */
  recordFailure(service: string): void {
    const state = this.getState(service);
    
    switch (state.status) {
      case 'closed':
        state.failureCount++;
        // If threshold reached, open the circuit
        if (state.failureCount >= state.threshold) {
          this.transitionToOpen(service);
        }
        break;
        
      case 'half_open':
        // Any failure in half-open immediately opens circuit
        this.transitionToOpen(service);
        break;
    }
    
    state.lastFailureAt = new Date().toISOString();
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    service: string,
    fn: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    if (!this.canProceed(service)) {
      if (fallback) {
        console.warn(`[CircuitBreaker] ${service} is OPEN, using fallback`);
        return fallback();
      }
      throw new Error(`Circuit breaker is OPEN for service: ${service}`);
    }
    
    try {
      const result = await fn();
      this.recordSuccess(service);
      return result;
    } catch (error) {
      this.recordFailure(service);
      throw error;
    }
  }

  /**
   * Transition to closed state
   */
  private transitionToClosed(service: string): void {
    const state = this.getState(service);
    state.status = 'closed';
    state.failureCount = 0;
    state.successCount = 0;
    state.openedAt = undefined;
    
    console.log(`[CircuitBreaker] ${service} transitioned to CLOSED`);
  }

  /**
   * Transition to open state
   */
  private transitionToOpen(service: string): void {
    const state = this.getState(service);
    state.status = 'open';
    state.openedAt = new Date().toISOString();
    
    console.warn(`[CircuitBreaker] ${service} transitioned to OPEN (failures: ${state.failureCount})`);
  }

  /**
   * Transition to half-open state
   */
  private transitionToHalfOpen(service: string): void {
    const state = this.getState(service);
    state.status = 'half_open';
    state.failureCount = 0;
    state.successCount = 0;
    
    console.log(`[CircuitBreaker] ${service} transitioned to HALF_OPEN`);
  }

  /**
   * Get current state for monitoring
   */
  getState(service: string): CircuitBreakerState {
    return this.getState(service);
  }

  /**
   * Get all states for health monitoring
   */
  getAllStates(): CircuitBreakerState[] {
    return Array.from(this.states.values());
  }

  /**
   * Manually reset a circuit breaker
   */
  reset(service: string): void {
    this.states.delete(service);
    console.log(`[CircuitBreaker] ${service} manually reset`);
  }

  /**
   * Manually open a circuit breaker (for maintenance)
   */
  forceOpen(service: string): void {
    const state = this.getState(service);
    state.status = 'open';
    state.openedAt = new Date().toISOString();
    console.log(`[CircuitBreaker] ${service} manually opened`);
  }
}

// Singleton instance for global use
let globalCircuitBreaker: CircuitBreaker | null = null;

export function getGlobalCircuitBreaker(): CircuitBreaker {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new CircuitBreaker();
  }
  return globalCircuitBreaker;
}
