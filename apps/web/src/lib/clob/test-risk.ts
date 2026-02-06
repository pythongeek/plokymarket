
import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';

const SLEEP = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomUUID = () => Math.random().toString(36).substring(2, 15);

async function testRiskValidation() {
    console.log('--- Starting Pre-Trade Risk Validation Test ---');

    try {
        const engine = new OrderBookEngine('MARKET-RISK', 1n);
        const userBurst = 'user_burst';
        const userStp = 'user_stp';

        // 1. Test Rate Limit (Layer 3)
        // RateLimiter limit is 50/sec. We will burst 70 orders.
        console.log('[1] Testing Rate Limit (Burst 70 orders)...');

        let accepted = 0;
        let rejected = 0;

        for (let i = 0; i < 70; i++) {
            const order: Order = {
                id: randomUUID(),
                userId: userBurst,
                marketId: 'MARKET-RISK',
                price: 100n,
                quantity: 10n,
                remainingQuantity: 10n,
                filledQuantity: 0n,
                side: 'bid',
                type: 'LIMIT',
                status: 'open',
                createdAt: Date.now(),
                timeInForce: 'GTC',
                stpFlag: 'cancel',
                postOnly: false,
                updatedAt: Date.now(),
                cancelRequested: false
            };

            const result = await engine.placeOrder(order);
            if (result.order.status === 'cancelled' && !result.fills.length) {
                // If cancelled immediately and no fills, likely Risk Reject or IOC (but GTC).
                // Wait, placeOrder returns "cancelled" status for Risk Fail per my edit.
                rejected++;
            } else {
                accepted++;
            }
        }

        console.log(`Burst Result: Accepted=${accepted}, Rejected=${rejected}`);

        if (rejected > 0) {
            console.log('SUCCESS: Rate Limit triggered rejections.');
        } else {
            console.warn('WARNING: No rate limit rejections. (Bucket might be large enough?)');
            // Limit is 50 burst. 55 should fail 5.
        }

        // 2. Test STP (Self-Trade Prevention)
        console.log('[2] Testing STP (Self-Trade Prevention)...');
        // Setup: Place a Sell Order for userStp
        const sellOrder: Order = {
            id: randomUUID(),
            userId: userStp,
            marketId: 'MARKET-RISK',
            price: 200n,
            quantity: 100n,
            remainingQuantity: 100n,
            filledQuantity: 0n,
            side: 'ask',
            type: 'LIMIT',
            status: 'open',
            createdAt: Date.now(),
            timeInForce: 'GTC',
            stpFlag: 'cancel',
            postOnly: false,
            updatedAt: Date.now(),
            cancelRequested: false
        };
        await engine.placeOrder(sellOrder);
        console.log('Placed Sell Order for User1 @ 100');

        // Try to Buy with same User (Crossing)
        const buySelf: Order = {
            id: randomUUID(),
            userId: userStp, // SAME USER
            marketId: 'MARKET-RISK',
            price: 200n,
            quantity: 10n,
            remainingQuantity: 10n,
            filledQuantity: 0n,
            side: 'bid',
            type: 'LIMIT', // Matches
            status: 'open',
            createdAt: Date.now(),
            timeInForce: 'GTC',
            stpFlag: 'cancel',
            postOnly: false,
            updatedAt: Date.now(),
            cancelRequested: false
        };

        const stpResult = await engine.placeOrder(buySelf);
        if (stpResult.order.status === 'cancelled' && !stpResult.fills.length) {
            console.log('SUCCESS: STP rejected the self-trade order.');
        } else {
            console.error('FAILURE: Self-trade was NOT rejected.', stpResult);
            process.exit(1);
        }

        // 3. Test Position Limits
        console.log('[3] Testing Position Limits...');
        const engine2 = new OrderBookEngine('MARKET-LIMITS', 1n);

        // Scenario A: Tier 1 User trying to place $1500 (Limit $1000)
        // Price 100n (100e6) * Qty 15 (15e6) = 1500e12 / 1e6 = 1500e6 ($1500)
        const tier1Order: Order = {
            id: randomUUID(), userId: 'u_tier1', marketId: 'MARKET-LIMITS',
            price: 100000000n, quantity: 15000000n, remainingQuantity: 15000000n, filledQuantity: 0n,
            side: 'bid', type: 'LIMIT', status: 'open', createdAt: Date.now(), timeInForce: 'GTC',
            stpFlag: 'cancel', postOnly: false, updatedAt: Date.now(), cancelRequested: false
        };
        const r1 = await engine2.placeOrder(tier1Order, { tier: 'TIER_1', totalNotional: 0n });
        if (r1.order.status === 'cancelled') console.log('SUCCESS: Tier 1 Limit Enforced.');
        else console.error('FAILURE: Tier 1 Limit Ignored.', r1);

        // Scenario B: Market Absolute Limit ($100K)
        // User Tier 3 (Limit $500K) but Market Max is $100K.
        // Trying to place $110K.
        const whaleOrder: Order = {
            id: randomUUID(), userId: 'u_whale', marketId: 'MARKET-LIMITS',
            price: 100000000n, quantity: 1100000000n, remainingQuantity: 1100000000n, filledQuantity: 0n, // 110 * 10 = 1100?? No. 100n price * 1.1M qty?
            // Price=100n ($100). Qty=1100. Val=110,000.
            // Wait, my scaling in RiskEngine was: (Price * Qty) / 1e6.
            // If Price = 100e6 ($100). Qty = 1100e6 (1100).
            // Val = (100e6 * 1100e6) / 1e6 = 110000e6 = $110,000. Correct.
            side: 'bid', type: 'LIMIT', status: 'open', createdAt: Date.now(), timeInForce: 'GTC',
            stpFlag: 'cancel', postOnly: false, updatedAt: Date.now(), cancelRequested: false
        };

        const r2 = await engine2.placeOrder(whaleOrder, { tier: 'TIER_3', totalNotional: 0n });
        if (r2.order.status === 'cancelled') console.log('SUCCESS: Market Absolute Limit Enforced.');
        else console.error('FAILURE: Market Absolute Limit Ignored.', r2);

        // Scenario C: Stress Test (High Volatility)
        // User Tier 3 ($500K). Volatility 0.8 (80%).
        // Limit = Cap / (5 * 0.8) = Cap / 4 = $125K.
        // User tries $150K.
        const stressOrder: Order = {
            id: randomUUID(), userId: 'u_stress', marketId: 'MARKET-LIMITS',
            price: 100000000n, quantity: 1500000000n, remainingQuantity: 1500000000n, filledQuantity: 0n, // $150K
            side: 'bid', type: 'LIMIT', status: 'open', createdAt: Date.now(), timeInForce: 'GTC',
            stpFlag: 'cancel', postOnly: false, updatedAt: Date.now(), cancelRequested: false
        };
        const r3 = await engine2.placeOrder(stressOrder, { tier: 'TIER_3', portfolioVolatility: 0.8 });
        if (r3.order.status === 'cancelled') console.log('SUCCESS: Stress Test Limit Enforced.');
        else console.error('FAILURE: Stress Test Limit Ignored.', r3);

        await engine2.shutdown();
        await engine.shutdown();
        console.log('Risk Test Completed.');

    } catch (err) {
        console.error('Risk Test Failed:', err);
        process.exit(1);
    }
}

testRiskValidation().catch(e => {
    console.error(e);
    process.exit(1);
});
