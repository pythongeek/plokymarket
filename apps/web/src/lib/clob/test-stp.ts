import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';

function createOrder(
    id: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number,
    userId: string,
    stpMode: any = 'STP_CANCEL_OLDER'
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
        updatedAt: Date.now(),
        stpMode
    };
}

async function runTests() {
    console.log('--- STP TESTS ---');
    const engine = new OrderBookEngine('test-market');

    // TEST 1: STP_CANCEL_OLDER (Default)
    console.log('Test 1: STP_CANCEL_OLDER');
    await engine.placeOrder(createOrder('s1', 'SELL', 100, 10, 'traderA'));
    // TraderA buys 5 @ 100. Should Cancel s1 (Older) and rest of Buy should sit or match others?
    // Logic: "Opposite book remove bestOrder. bestOrder.status = CANCELED. Continue."
    // So s1 is removed. The new Buy order continues to match next best (none).
    // Then adds to book.
    const res1 = await engine.placeOrder(createOrder('b1', 'BUY', 100, 5, 'traderA', 'STP_CANCEL_OLDER'));

    if (res1.fills.length !== 0) throw new Error('Should have 0 fills');
    // Check if s1 is gone
    const snap1 = engine.getSnapshot();
    if (snap1.asks.length !== 0) throw new Error('Ask s1 should be canceled');
    if (snap1.bids.length !== 1) throw new Error('Bid b1 should be added');
    console.log('PASS: STP_CANCEL_OLDER');

    await engine.cancelOrder('b1'); // Cleanup

    // TEST 2: STP_CANCEL_BOTH
    console.log('Test 2: STP_CANCEL_BOTH');
    await engine.placeOrder(createOrder('s2', 'SELL', 100, 10, 'traderB'));
    const res2 = await engine.placeOrder(createOrder('b2', 'BUY', 100, 5, 'traderB', 'STP_CANCEL_BOTH'));

    if (res2.order.status !== 'CANCELED') throw new Error('Taker should be canceled');
    const snap2 = engine.getSnapshot();
    if (snap2.asks.length !== 0) throw new Error('Maker s2 should be canceled');
    console.log('PASS: STP_CANCEL_BOTH');

    // TEST 3: STP_DECREMENT
    console.log('Test 3: STP_DECREMENT');
    await engine.placeOrder(createOrder('s3', 'SELL', 100, 10, 'traderC'));
    // Buy 6. Overlap is 6.
    // Both reduced by 6.
    // s3 remains: 4. b3 remains: 0 (filled/consumed).
    const res3 = await engine.placeOrder(createOrder('b3', 'BUY', 100, 6, 'traderC', 'STP_DECREMENT'));

    if (res3.fills.length !== 0) throw new Error('Should have 0 fills (Decrement only)');
    if (res3.order.status !== 'CANCELED') throw new Error('Taker fully decremented implies CANCELED state (or Filled w/ 0)');
    // Code sets status to CANCELED if remaining <= 0 in decrement loop.

    const snap3 = engine.getSnapshot();
    const s3Rem = snap3.asks.find(o => o.price === 100);
    if (!s3Rem || s3Rem.size !== 4) throw new Error(`Maker should have 4 remaining, got ${s3Rem?.size}`);
    console.log('PASS: STP_DECREMENT');

}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
