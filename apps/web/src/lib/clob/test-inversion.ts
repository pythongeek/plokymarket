
import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';
import * as crypto from 'crypto';

const SCALE = 1000000n;

function createOrder(side: 'bid' | 'ask', price: number, quantity: number): Order {
    return {
        id: crypto.randomUUID(),
        userId: 'user1',
        side,
        price: BigInt(price) * SCALE,
        quantity: BigInt(quantity) * SCALE,
        remainingQuantity: BigInt(quantity) * SCALE,
        filledQuantity: 0n,
        createdAt: Date.now(),
        type: 'LIMIT',
        timeInForce: 'GTC',
        stpFlag: 'none',
        status: 'open',
        marketId: 'test-market',
        postOnly: false,
        updatedAt: Date.now(),
        cancelRequested: false
    };
}

async function runTest() {
    console.log('--- Starting Inversion Detection Test ---');

    const engine = new OrderBookEngine('test-market', 100n);

    // 1. Setup normal book
    console.log('1. Setting up normal book...');
    await engine.placeOrder(createOrder('bid', 100, 10));
    await engine.placeOrder(createOrder('ask', 105, 10));

    // 2. Force Inversion (Simulate via direct insertion bypass if possible, or modifying limits if public)
    // Since we can't easily bypass `placeOrder` matching logic without modifying the class to expose internal trees,
    // we will rely on the fact that `placeOrder` calls `checkInversion` AFTER the matching loop.
    // BUT the matching loop SHOULD clear the inversion.
    // An inversion happens if the matching logic FAILS or if an external state is corrupted.
    // TO TEST THIS: We need to subvert the matching logic.
    // OR we define a scenario where `postOnly` logic might fail? No.

    // Hack for testing: We will use `any` to access private properties and manually insert crossed orders.
    console.log('2. Forcing crossed state manually...');
    const crossedBid = createOrder('bid', 110, 5); // Bid 110
    // Ask is 105. 110 > 105. Inversion!

    // Insert into bid tree manually
    (engine as any).addToBook((engine as any).bids, crossedBid);

    // Trigger check
    console.log('3. Triggering detection check...');
    (engine as any).checkInversion();

    const state = (engine as any).isHalted;
    console.log(`4. Market Halted State: ${state}`);

    if (state) {
        console.log('SUCCESS: Market halted due to inversion.');
    } else {
        console.error('FAILURE: Market NOT halted.');
        process.exit(1);
    }
}

runTest().catch(console.error);
