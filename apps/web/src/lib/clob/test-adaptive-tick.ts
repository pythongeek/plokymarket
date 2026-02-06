import { MarketVolatilityService } from './MarketVolatilityService';
import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';

async function testAdaptiveTickSizing() {
    console.log("--- Testing Adaptive Tick Sizing Math ---");

    // Test Case: Low Volatility (0.02 annualized)
    const currentPrice = 50000000n; // 50.00
    const minTick = 100n; // 0.0001
    const maxTick = 10000n; // 0.01

    let tick = MarketVolatilityService.calculateAdaptiveTickSize(0.02, currentPrice, minTick, maxTick);
    console.log(`Low Vol (2%): Suggested Tick = ${tick} (Expected around 100)`);

    // Test Case: High Volatility (0.50 annualized)
    tick = MarketVolatilityService.calculateAdaptiveTickSize(0.50, currentPrice, minTick, maxTick);
    console.log(`High Vol (50%): Suggested Tick = ${tick} (Expected higher than 100)`);

    console.log("\n--- Testing Engine Tick Adjustment ---");
    const engine = new OrderBookEngine('test-market', 100n);

    const order1: Order = {
        id: 'order-1',
        marketId: 'test-market',
        userId: 'user-1',
        side: 'bid',
        price: 50000100n, // valid for 100n tick
        quantity: 1000000n,
        remainingQuantity: 1000000n,
        filledQuantity: 0n,
        status: 'open',
        type: 'LIMIT',
        timeInForce: 'GTC',
        stpFlag: 'none',
        cancelRequested: false,
        postOnly: false,
        updatedAt: Date.now(),
        createdAt: Date.now()
    };

    await engine.placeOrder(order1);
    console.log(`Placed order at ${order1.price}`);

    // Update tick size to 500n. Existing order at 50000100n should round to 50000000n.
    await engine.updateTickSize(500n);

    const snapshot = engine.getSnapshot();
    console.log(`New Tick Size: 500n`);
    console.log(`Order Price after adjustment: ${snapshot.bids[0]?.price}`);

    if (snapshot.bids[0]?.price === 50000000n) {
        console.log("SUCCESS: Order rounded down to nearest tick.");
    } else {
        console.log("FAILURE: Order price incorrect.");
    }
}

testAdaptiveTickSizing();
