import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';

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

async function runTest() {
    console.log('--- Starting OrderBookEngine Test ---');
    const engine = new OrderBookEngine('test-market');

    // 1. Place Sell Order: 10 @ $100
    const sell1 = createOrder('s1', 'SELL', 100, 10, 'userA');
    console.log(`Placing SELL: 10 @ $100`);
    await engine.placeOrder(sell1);

    let snap = engine.getSnapshot();
    console.log('Asks:', snap.asks.length, 'Bids:', snap.bids.length);
    if (snap.asks[0].size !== 10) throw new Error('Ask size mismatch');

    // 2. Place Buy Order: 5 @ $101 (Matches 5 @ $100)
    const buy1 = createOrder('b1', 'BUY', 101, 5, 'userB');
    console.log(`Placing BUY: 5 @ $101 (Should match)`);
    const res1 = await engine.placeOrder(buy1);

    console.log('Fills:', res1.fills.length);
    console.log('Buy Status:', res1.order.status);

    if (res1.fills.length !== 1) throw new Error('Should have 1 fill');
    if (res1.fills[0].price !== 100) throw new Error('Fill price should be Maker price (100)');
    if (res1.fills[0].size !== 5) throw new Error('Fill size should be 5');

    snap = engine.getSnapshot();
    console.log('Remaining Ask Size:', snap.asks[0]?.size);
    if (snap.asks[0]?.size !== 5) throw new Error('Remaining Ask should be 5');

    // 3. Place Buy Order: 10 @ $90 (No match, sits on book)
    const buy2 = createOrder('b2', 'BUY', 90, 10, 'userC');
    console.log(`Placing BUY: 10 @ $90`);
    await engine.placeOrder(buy2);

    snap = engine.getSnapshot();
    console.log('Bids:', snap.bids.length);
    if (snap.bids[0].price !== 90) throw new Error('Best Bid should be 90');

    console.log('--- Test Passed ---');
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
