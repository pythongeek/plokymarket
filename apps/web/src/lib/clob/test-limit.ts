import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';

function createOrder(
    id: string,
    side: 'BUY' | 'SELL',
    price: number,
    size: number,
    userId: string,
    type: any = 'LIMIT',
    tif: any = 'GTC',
    expiration?: number
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
        type,
        timeInForce: tif,
        postOnly: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // @ts-ignore
        expiration
    };
}

async function runTests() {
    console.log('--- LIMIT ORDER & RISK TESTS ---');
    const engine = new OrderBookEngine('test-market');

    // TEST 1: FOK (Fill Or Kill)
    // Setup: Ask 5 @ 100
    await engine.placeOrder(createOrder('s1', 'SELL', 100, 5, 'maker'));

    // Try Buy 10 @ 100 (FOK) -> Should FAIL (Kill) because only 5 avail
    console.log('Test 1: FOK Fail Condition');
    const fokFail = await engine.placeOrder(createOrder('b_fok1', 'BUY', 100, 10, 'taker', 'LIMIT', 'FOK'));
    if (fokFail.order.status !== 'CANCELED') throw new Error('FOK should be CANCELED if not full fill');
    if (fokFail.fills.length > 0) throw new Error('FOK should have 0 fills');
    console.log('PASS: FOK Fail');

    // Setup: Add another 5 @ 100
    await engine.placeOrder(createOrder('s2', 'SELL', 100, 5, 'maker2'));
    // Now 10 avail. Try Buy 10 @ 100 (FOK) -> PASSS
    console.log('Test 2: FOK Success Condition');
    const fokPass = await engine.placeOrder(createOrder('b_fok2', 'BUY', 100, 10, 'taker2', 'LIMIT', 'FOK'));
    if (fokPass.order.status !== 'FILLED') throw new Error('FOK should be FILLED');
    if (fokPass.fills.length !== 2) throw new Error('Should match both sellers');
    console.log('PASS: FOK Success');


    // TEST 2: GTD (Good Till Date)
    console.log('Test 3: GTD Expiry');
    const expiredTime = Date.now() - 10000; // 10s ago
    const validTime = Date.now() + 10000;   // 10s future

    // Place Expired Order
    const gtdExpired = await engine.placeOrder(createOrder('b_gtd1', 'BUY', 90, 10, 'u1', 'LIMIT', 'GTD', expiredTime));
    if (gtdExpired.order.status !== 'CANCELED') throw new Error('Expired GTD should cancel immediately');

    // Place Future Order
    const gtdValid = await engine.placeOrder(createOrder('b_gtd2', 'BUY', 90, 10, 'u2', 'LIMIT', 'GTD', validTime));
    if (gtdValid.order.status !== 'OPEN') throw new Error('Valid GTD should be OPEN');

    console.log('PASS: GTD');
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
