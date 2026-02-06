import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';
import { RateLimiter } from './RateLimiter';

// UTILS
function createOrder(
    id: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number,
    userId: string
): Order {
    return {
        id,
        marketId: 'test-market',
        userId,
        side,
        price,
        size,
        filled: 0,
        remaining: size,
        status: 'OPEN',
        type: 'LIMIT',
        timeInForce: 'GTC',
        postOnly: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

// TEST RUNNER
async function runTests() {
    console.log('--- ADVANCED FEATURES TESTS ---');

    // TEST 1: Rate Limiter (Token Bucket)
    console.log('Test 1: Rate Limiter Burst');
    const userA = 'user_burst_test';
    // Consume 20 tokens (Max Burst)
    for (let i = 0; i < 20; i++) {
        if (!RateLimiter.check(userA)) throw new Error(`Rate limit failed at ${i}`);
    }
    // 21st should fail
    if (RateLimiter.check(userA)) throw new Error('21st request should fail (Burst Exceeded)');
    console.log('PASS: Rate Limiter Burst');

    // TEST 2: Tick Size Validation
    console.log('Test 2: Tick Size Validation');
    const engine = new OrderBookEngine('test-market');
    try {
        await engine.placeOrder(createOrder('t1', 'BUY', 100.015, 1, 'u1'));
        throw new Error('Should check tick size');
    } catch (e: any) {
        if (!e.message.includes('Invalid Price Tick')) throw e;
    }
    await engine.placeOrder(createOrder('t2', 'BUY', 100.01, 1, 'u1')); // Valid
    console.log('PASS: Tick Size');

    // TEST 3: Circuit Breaker
    console.log('Test 3: Circuit Breaker');
    // 1. Establish baseline price
    await engine.placeOrder(createOrder('s1', 'SELL', 100, 10, 'maker'));
    await engine.placeOrder(createOrder('b1', 'BUY', 100, 5, 'taker1')); // Match @ 100

    // 2. Try to match at 111 (11% increase) -> Should Halt
    // Setup order book to allow match
    await engine.placeOrder(createOrder('s2', 'SELL', 112, 10, 'maker2'));

    try {
        // Buy at 112
        await engine.placeOrder(createOrder('b2', 'BUY', 112, 5, 'taker2'));
        throw new Error('Should Halt trading');
    } catch (e: any) {
        if (!e.message.includes('Market Halted')) throw new Error('Wrong error: ' + e.message);
        console.log('Caught Halt:', e.message);
    }
    console.log('PASS: Circuit Breaker');
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
