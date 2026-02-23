
import { Order, RiskCheckType, RiskContext, RiskValidationResult } from './types';
import { RateLimiter } from './RateLimiter';

export class RiskEngine {
    constructor() { }

    /**
     * Parallel execution of risk checks.
     * Latency target: <10ms
     */
    async validateOrderRisk(order: Order, context: RiskContext, currentBookOrders: Order[]): Promise<RiskValidationResult> {
        // We run checks in parallel where possible, but some are sync/instant.
        // For simulation/prototype, most are sync.

        // 1. Balance Check (Layer 1)
        // In real system: Cached balance check.
        // Here: validated via context if provided.
        if (context.balance !== undefined) {
            const cost = order.price * order.quantity / 1000000n; // Normalized? Keeping logic simple for now. 
            // Logic: Price is scaled, Qty is scaled. 
            // If Balance is scaled, direct compare. 
            // We'll assume strict check if balance provided.
            if (context.balance < (order.price * order.quantity)) {
                // Note: Logic depends on scale. Assuming Balance is capable of covering Notional.
                // This is a placeholder for the "Layer 1: Balance" check.
            }
        }

        // 2. Position Limits (Layer 2)
        const posCheck = this.checkPositionLimits(order, context);
        if (!posCheck.passed) {
            return posCheck;
        }

        // 3. Rate Limiting (Layer 3)
        // We reuse the central RateLimiter but strictly for "New Order" events here if needed.
        // The Engine calls RateLimiter before this? 
        // Actually, Design says "Layer 3: Rate limiting" inside validateOrderRisk.
        if (!(await RateLimiter.check(order.userId, 'place'))) {
            return {
                passed: false,
                failedCheck: 'RATE_LIMIT',
                details: { userId: order.userId },
                retryable: true
            };
        }

        // 4. Market Status (Layer 4)
        // Passed as generic check before entering? 
        // Check performed by caller (Engine.isHalted). We can check here if logic moved.

        // 5. Self-Trade Prevention (Layer 5)
        // Check if user has orders on opposite side overlapping.
        // This requires access to the Book or a filtered list.
        // We pass `currentBookOrders` (inefficient to pass all, but efficient if we pass only user's open orders).
        // Let's assume `currentBookOrders` contains only the USER'S orders on the OPPOSITE side.
        const stpConflict = this.checkSTP(order, currentBookOrders);
        if (stpConflict) {
            return {
                passed: false,
                failedCheck: 'SELF_TRADE',
                details: { conflictingOrderId: stpConflict.id },
                retryable: false
            };
        }

        // 6. Wash Trading (Layer 6)
        // Simple pattern: Buying and selling same asset aggressively.
        // STP covers the mechanical self-match. Wash trading implies intent over time.
        // We'll placeholder this.

        return { passed: true, retryable: false };
    }

    private checkSTP(newOrder: Order, existingOrders: Order[]): Order | null {
        for (const existing of existingOrders) {
            // Must be same user (guaranteed by caller usually, but check)
            if (existing.userId !== newOrder.userId) continue;

            // Must be opposite side
            if (existing.side === newOrder.side) continue;

            // Check Price Overlap
            // Buy Order (New) >= Sell Order (Existing)
            if (newOrder.side === 'bid' && newOrder.price >= existing.price) {
                return existing;
            }
            // Sell Order (New) <= Buy Order (Existing)
            if (newOrder.side === 'ask' && newOrder.price <= existing.price) {
                return existing;
            }
        }
        return null;
    }

    private checkPositionLimits(order: Order, context: RiskContext): RiskValidationResult {
        // Values are in BigInt scaled (e.g. 1e6).
        // Let's assume order.price is NOTIONAL for simplicity here, or Price * Qty.
        // If Price=100 (100000000n), Qty=10 (10000000n) -> Value = 1000 ??
        // Scaling: Price (6 decimals), Qty (6 decimals). Notional = (P * Q) / 1e6.
        // Example: $100.00 (100e6) * 10.00 (10e6) = 1000e12 / 1e6 = 1000e6 ($1000).

        const SCALE = 1000000n;
        const notional = (order.price * order.remainingQuantity) / SCALE; // Estimated exposure
        const currentTotal = context.totalNotional;
        const newTotal = currentTotal + notional;

        // 1. Tier-Based Limits
        let tierLimit = 0n;
        switch (context.tier) {
            case 'TIER_1': tierLimit = 1000n * SCALE; break;
            case 'TIER_2': tierLimit = 50000n * SCALE; break;
            case 'TIER_3': tierLimit = 500000n * SCALE; break;
            default: tierLimit = 0n; // Block unrecognized
        }

        if (newTotal > tierLimit) {
            return {
                passed: false,
                failedCheck: 'POSITION_LIMIT',
                details: { reason: 'Tier Limit Exceeded', limit: String(tierLimit), current: String(newTotal) },
                retryable: false
            };
        }

        // 2. Per-Market Absolute Limit (Max $100K)
        // This effectively caps specific market exposure regardless of Tier 3 capacity.
        const MARKET_MAX = 100000n * SCALE;
        if (newTotal > MARKET_MAX) {
            return {
                passed: false,
                failedCheck: 'POSITION_LIMIT',
                details: { reason: 'Market Absolute Limit Exceeded', limit: String(MARKET_MAX) },
                retryable: false
            };
        }

        // 3. Delta-Adjusted Limit
        // Warn @ 80%, Block @ 100% of Correlated Limit. 
        // Let's assume Correlated Limit is derived dynamically, say $100K for now.
        const DELTA_LIMIT = 100000n * SCALE;
        const newCorrelated = context.correlatedExposure + notional;

        if (newCorrelated > DELTA_LIMIT) {
            return {
                passed: false,
                failedCheck: 'POSITION_LIMIT',
                details: { reason: 'Delta-Adjusted Limit Exceeded', limit: String(DELTA_LIMIT) },
                retryable: false
            };
        }
        // Warning logic would be upper layer (not returning failure, but attaching warning? 
        // ValidationResult doesn't support "Warning passed". We skip warning for Hard Block validation here).

        // 4. Portfolio Stress Test
        // Limit = MaxCapital / (5 * Volatility).
        // Let's assume MaxCapital is user's Tier Limit for simplification.
        // Volatility: 0.1 (10%) -> 5 * 0.1 = 0.5. Limit = Cap / 0.5 = 2 * Cap. (Allows leverage?)
        // Or if Volatility is High (0.8) -> 5 * 0.8 = 4. Limit = Cap / 4. (Restricts exposure).
        // We'll enforce this dynamic limit.
        if (context.portfolioVolatility > 0) {
            // Factor: 5 * Vol
            // Cap / Factor. 
            // We use integer math. Vol * 100 -> int.
            // Limit = (TierLimit * 100) / (5 * (Vol * 100))
            const volPercent = BigInt(Math.floor(context.portfolioVolatility * 100)); // e.g. 0.2 -> 20
            if (volPercent > 0n) {
                const stressFactor = 5n * volPercent; // 100
                const stressLimit = (tierLimit * 100n) / stressFactor;

                if (newTotal > stressLimit) {
                    return {
                        passed: false,
                        failedCheck: 'POSITION_LIMIT',
                        details: { reason: 'Stress Test Failed', volatility: context.portfolioVolatility, limit: String(stressLimit) },
                        retryable: false
                    };
                }
            }
        }

        return { passed: true, retryable: false };
    }
}
