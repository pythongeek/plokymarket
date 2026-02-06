
import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';

// Helper to create order
function createOrder(
    id: string,
    side: 'bid' | 'ask',
    price: bigint,
    size: bigint,
    userId: string
): Order {
    return {
        id,
        marketId: 'test-market',
        userId,
        side,
        price,
        quantity: size,
        remainingQuantity: size,
        filledQuantity: 0n,
        status: 'open',
        type: 'LIMIT',
        timeInForce: 'GTC',
        postOnly: false,
        stpFlag: 'none',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        cancelRequested: false
    };
}

// TEST RUNNER
async function runTests() {
    console.log('--- Starting OrderBookEngine Test ---');
    const engine = new OrderBookEngine('test-market');

    // 1. Place SELL Order
    // Price 100.00 (100000000n)
    const sellPrice = 100000000n;
    const size10 = 10n;
    const sellOrder = createOrder('o1', 'ask', sellPrice, size10, 'user1');

    console.log(`Placing SELL: 10 @ $100`);
    await engine.placeOrder(sellOrder);

    const snapshot1 = engine.getSnapshot();
    console.log(`Asks: ${snapshot1.asks.length} Bids: ${snapshot1.bids.length}`);

    if (snapshot1.asks.length !== 1) throw new Error('Ask not added');

    // 2. Place BUY Order (Match)
    // Price 101.00 (101000000n) -> Crosses (Taker Buy >= Maker Sell 100)
    const buyPrice = 101000000n;
    const size5 = 5n;
    const buyOrder = createOrder('o2', 'bid', buyPrice, size5, 'user2');

    console.log(`Placing BUY: 5 @ $101 (Should match)`);
    const result = await engine.placeOrder(buyOrder);

    console.log(`Fills: ${result.fills.length}`);
    if (result.fills.length !== 1) throw new Error('Should match 1 trade');
    if (result.remainingQuantity !== 0n) throw new Error('Buy order should be fully filled');
    console.log(`Buy Status: ${result.order.status.toUpperCase()}`);

    // Check Maker Order Update in Arena/State
    // We can't easily check internal state without fetching fresh snapshot or inspecting memory if exposed.
    // engine.getSnapshot() aggregates size.
    const snapshot2 = engine.getSnapshot();
    const bestAsk = snapshot2.asks[0];
    console.log(`Remaining Ask Size: ${bestAsk.size}n`); // Size 5 rem
    if (bestAsk.size !== 5n) throw new Error('Maker remaining wrong');

    // 3. Place BUY Order (No Match)
    // Price 90.00
    const buyPriceLow = 90000000n;
    const buyOrder2 = createOrder('o3', 'bid', buyPriceLow, 10n, 'user3');

    console.log(`Placing BUY: 10 @ $90`);
    await engine.placeOrder(buyOrder2);

    const snapshot3 = engine.getSnapshot();
    console.log(`Bids: ${snapshot3.bids.length}`);
    if (snapshot3.bids.length !== 1) throw new Error('Bid not added');

    console.log('--- Test Passed ---');

    // Cleanup
    await engine.shutdown();
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
