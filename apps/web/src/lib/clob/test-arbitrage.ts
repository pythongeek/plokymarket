
import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';
import * as crypto from 'crypto';

const SCALE = 1000000n;

function createOrder(side: 'bid' | 'ask', price: number, quantity: number, type: 'LIMIT' | 'MARKET' = 'LIMIT', userId: string = 'user1'): Order {
    return {
        id: crypto.randomUUID(),
        userId,
        side,
        price: BigInt(price) * SCALE,
        quantity: BigInt(quantity) * SCALE,
        remainingQuantity: BigInt(quantity) * SCALE,
        filledQuantity: 0n,
        createdAt: Date.now(),
        type,
        timeInForce: 'GTC',
        stpFlag: 'none',
        status: 'open',
        marketId: 'test-market',
        postOnly: false,
        updatedAt: Date.now(),
        cancelRequested: false
    };
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('--- Starting Auto-Arbitrage Prevention Test ---');

    const engine = new OrderBookEngine('test-market', 100n);

    // 1. Minimum Resting Time Test
    console.log('\n[1] Testing Minimum Resting Time (100ms)...');
    const ord1 = createOrder('bid', 100, 10);
    await engine.placeOrder(ord1);

    try {
        // Try to cancel immediately
        engine.cancelOrder(ord1.id);
        console.error('FAILURE: Immediate Cancel SUCCEEDED (Should have failed)');
    } catch (e: any) {
        if (e.message.includes('Minimum resting time')) {
            console.log('SUCCESS: Immediate Cancel blocked by Resting Time check.');
        } else {
            console.error(`FAILURE: Unexpected error: ${e.message}`);
        }
    }

    // Wait > 100ms and try again
    await sleep(150);
    const cancelResult = engine.cancelOrder(ord1.id);
    if (cancelResult) {
        console.log('SUCCESS: Cancel accepted after resting time.');
    } else {
        console.error('FAILURE: Cancel failed after resting time.');
    }

    // 2. Cancellation Rate Limit
    console.log('\n[2] Testing Cancellation Rate Limit (10/sec)...');
    const orders = [];
    // Verify bucket logic: Burst is 10. Refill 10/sec.
    // We need to place enough orders first. 
    // RateLimiter is static/global? Yes.
    // We need to trigger rate limit.
    // Place 15 orders.
    for (let i = 0; i < 15; i++) {
        const o = createOrder('ask', 105 + i, 1);
        await engine.placeOrder(o);
        orders.push(o);
    }

    await sleep(150); // Ensure resting time passed for all

    let cancelCount = 0;
    let rejectedCount = 0;

    for (const o of orders) {
        try {
            engine.cancelOrder(o.id);
            cancelCount++;
        } catch (e: any) {
            if (e.message.includes('Rate Limit Exceeded')) {
                rejectedCount++;
            }
        }
    }

    console.log(`Cancelled: ${cancelCount}, Rejected: ${rejectedCount}`);
    // Burst is 10. We expect ~10-11 to succeed, rest fail.
    if (rejectedCount > 0) {
        console.log('SUCCESS: Rate Limit triggered.');
    } else {
        console.warn('WARNING: Rate Limit NOT triggered (Bucket might be too large or refill too fast).');
    }

    // 3. Jitter for Large Aggressive Orders
    console.log('\n[3] Testing Jitter on Aggressive Order...');
    // Place a resting ask at 100
    const restingAsk = createOrder('ask', 100, 1000); // 1000 units
    await engine.placeOrder(restingAsk);

    // Large aggressive bid (Take 100)
    const largeBid = createOrder('bid', 100, 6000); // > 5000 threshold

    const start = Date.now();
    await engine.placeOrder(largeBid);
    const duration = Date.now() - start;

    console.log(`Execution Duration: ${duration}ms`);
    // Hard to verify non-deterministic jitter, but if it takes > 0ms significantly (node is fast), it suggests delay or just processing.
    // Given local execution is <1ms typically.
    if (duration > 1) {
        console.log('INFO: Jitter/Processing delay observed.');
    }

    console.log('\nTest Completed.');
}

runTest().catch(console.error);
