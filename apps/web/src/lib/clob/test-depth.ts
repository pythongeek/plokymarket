
import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';
import * as crypto from 'crypto';

const SCALING_FACTOR = 1000000n; // 1e6
const MARKET_ID = 'test-depth-market';

function createOrder(
    id: string,
    side: 'bid' | 'ask',
    price: number,
    size: number
): Order {
    return {
        id,
        marketId: MARKET_ID,
        userId: 'user-' + side,
        side,
        price: BigInt(Math.round(price * 1000000)),
        quantity: BigInt(Math.round(size * 1000000)),
        remainingQuantity: BigInt(Math.round(size * 1000000)),
        filledQuantity: 0n,
        status: 'open',
        type: 'LIMIT',
        timeInForce: 'GTC',
        postOnly: false,
        stpFlag: 'cancel',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        cancelRequested: false
    };
}

async function runDepthTest() {
    console.log('--- STARTING DEPTH MANAGER TEST ---');
    const engine = new OrderBookEngine(MARKET_ID);

    // 1. Add Orders at specific prices
    console.log('\n1. Placing Initial Orders...');
    // Bid: 0.50 (size 10)
    await engine.placeOrder(createOrder('bid1', 'bid', 0.50, 10));
    // Bid: 0.50 (size 5) -> Total 15 at 0.50
    await engine.placeOrder(createOrder('bid2', 'bid', 0.50, 5));
    // Bid: 0.49 (size 20)
    await engine.placeOrder(createOrder('bid3', 'bid', 0.49, 20));

    // Ask: 0.51 (size 10)
    await engine.placeOrder(createOrder('ask1', 'ask', 0.51, 10));
    // Ask: 0.52 (size 10)
    await engine.placeOrder(createOrder('ask2', 'ask', 0.52, 10));

    // Verify Tick Level Depth (Granularity 1 - 0.01%)
    const depth1 = engine.depthManager.getDepth('bid', 1);
    console.log('Depth (0.01%):', depth1.map(l => ({ price: Number(l.price) / 1e6, size: Number(l.size) / 1e6 })));

    if (depth1.length !== 2) throw new Error('Expected 2 bid levels');
    if (depth1[0].size !== 15000000n) throw new Error('Expected 15 at 0.50');
    if (depth1[1].size !== 20000000n) throw new Error('Expected 20 at 0.49');

    // 2. Verify Aggregation (Granularity 5 - 0.05%)
    // But since 0.49 and 0.50 fall into which bucket?
    // 0.49 -> 4900 ticks. 4900 / 5 = 980.
    // 0.50 -> 5000 ticks. 5000 / 5 = 1000.
    // They are separate.

    // Let's add something at 0.5002 (if tick allows? Tick is 0.01% - 0.0001)
    // 0.5002 is 0.50 + 2 ticks.
    // 5002 / 5 = 1000.4 -> bucket 1000.
    // So 0.50 (5000 ticks / 5 = 1000) and 0.5004 (5004 / 5 = 1000) should merge.

    console.log('\n2. Testing Granularity Merging...');
    await engine.placeOrder(createOrder('bid4', 'bid', 0.5004, 5));
    // Now bucket 1000 should have 15 (from 0.50) + 5 (from 0.5004) = 20.

    const depth5 = engine.depthManager.getDepth('bid', 5);
    console.log('Depth (0.05%):', depth5.map(l => ({ price: Number(l.price) / 1e6, size: Number(l.size) / 1e6 })));

    // Check for bucket around 0.50
    const bucket50 = depth5.find(l => Number(l.price) / 1e6 >= 0.50 && Number(l.price) / 1e6 < 0.5005);
    if (!bucket50 || bucket50.size !== 20000000n) {
        console.error('Bucket:', bucket50);
        throw new Error('Aggregation Failed: Expected 20 at ~0.50');
    }
    console.log('PASS: Aggregation Correct');

    // 3. Test Decrement (Cancel)
    console.log('\n3. Testing Cancellation...');
    await engine.cancelOrder('bid1'); // -10 at 0.50
    // Remaining at 0.50 bucket: 15 + 5 - 10 = 10?
    // Wait: bid1 was 10. bid2 was 5. bid4 was 5. Total 20.
    // Cancel bid1 (-10) -> Total 10.

    const depthAfterCancel = engine.depthManager.getDepth('bid', 5);
    const bucketAfter = depthAfterCancel.find(l => Number(l.price) / 1e6 >= 0.50 && Number(l.price) / 1e6 < 0.5005);
    console.log('Bucket After Cancel:', bucketAfter ? Number(bucketAfter.size) / 1e6 : 'null');

    if (bucketAfter?.size !== 10000000n) throw new Error('Expected 10 after cancel');
    console.log('PASS: Cancellation Correct');

    // 4. Test Match (Trade)
    console.log('\n4. Testing Match...');
    // Place Sell matches 0.5004 (Best bid, price priority).
    // bid4 is at 0.5004 (size 5).
    await engine.placeOrder(createOrder('taker1', 'ask', 0.50, 2));
    // Should fill 2 from bid4.
    // Remaining at bucket: 10 - 2 = 8.

    const depthAfterTrade = engine.depthManager.getDepth('bid', 5);
    const bucketTrade = depthAfterTrade.find(l => Number(l.price) / 1e6 >= 0.50 && Number(l.price) / 1e6 < 0.5005);
    console.log('Bucket After Trade:', bucketTrade ? Number(bucketTrade.size) / 1e6 : 'null');

    if (bucketTrade?.size !== 8000000n) throw new Error('Expected 8 after trade');
    console.log('PASS: Match Update Correct');

    await engine.shutdown();
    console.log('\n--- ALL DEPTH TESTS PASSED ---');
}

runDepthTest().catch(e => {
    console.error(e);
    process.exit(1);
});
