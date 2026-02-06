import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';

const SLEEP = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple mock ID generator
const randomUUID = () => Math.random().toString(36).substring(2, 15);

async function testAlertsAndAutoCancel() {
    console.log('--- Starting Alerts & Auto-Cancel Test ---');

    // OrderBookEngine constructor(marketId: string, tickSize: bigint, initialBids: Order[], initialAsks: Order[])
    try {
        const engine = new OrderBookEngine('MARKET-ALERT', 1n);
        const user1 = 'user1';
        const user2 = 'user2';

        const bidOrder: Order = {
            id: randomUUID(),
            userId: user1,
            marketId: 'MARKET-ALERT',
            price: 10005n, // 100.05 (Moderate Inversion: 5 ticks)
            quantity: 100n,
            remainingQuantity: 100n,
            filledQuantity: 0n,
            side: 'bid',
            type: 'LIMIT',
            status: 'open',
            createdAt: Date.now() - 1000,
            timeInForce: 'GTC',
            stpFlag: 'cancel',
            postOnly: false,
            updatedAt: Date.now(),
            cancelRequested: false
        };

        const askOrder: Order = {
            id: randomUUID(),
            userId: user2,
            marketId: 'MARKET-ALERT',
            price: 10000n, // 100.00
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

        // Access private members via `any` casting for test setup
        (engine as any).addToBook((engine as any).bids, bidOrder);
        (engine as any).addToBook((engine as any).asks, askOrder);

        console.log('State: Injected Crossed Orders. Bid @ 105, Ask @ 100.');

        // 2. Trigger Check (Level 1 Detection)
        console.log('[1] Triggering First Detection...');
        (engine as any).checkInversion();

        const detector = (engine as any).inversionDetector;
        console.log('Detector Start Time:', detector.inversionStartTime);

        // 3. Wait for Auto-Cancel Threshold (> 100ms)
        console.log('[2] Waiting > 100ms for Auto-Cancel...');
        await SLEEP(150);

        // Trigger Check again
        (engine as any).checkInversion();

        // Check if newest order (askOrder) was cancelled
        const askCheck = (engine as any).orderMap.get(askOrder.id);
        if (!askCheck || askCheck.status === 'cancelled') {
            console.log('SUCCESS: Newest causing order was auto-cancelled.');
        } else {
            console.error('FAILURE: Order persisted.');
            process.exit(1);
        }

        // 4. Test Escalation (Persistent State)
        console.log('[3] Testing Escalation (Level 3 Halt)...');

        const bidPersistent = { ...bidOrder, id: randomUUID(), createdAt: Date.now() };
        const askPersistent = { ...askOrder, id: randomUUID(), createdAt: Date.now() };
        (engine as any).addToBook((engine as any).bids, bidPersistent);
        (engine as any).addToBook((engine as any).asks, askPersistent);

        // Reset detector state and force fake time
        detector.inversionStartTime = Date.now() - 31000;

        (engine as any).checkInversion();

        // Access private isHalted via cast
        if ((engine as any).isHalted) {
            console.log('SUCCESS: Market Halted due to persistent inversion > 30s.');
        } else {
            console.error('FAILURE: Market did not halt.');
            process.exit(1);
        }

        await engine.shutdown();
        console.log('Test Completed Successfully.');
    } catch (err) {
        console.error('Test Failed Exception:', err);
        process.exit(1);
    }
}

testAlertsAndAutoCancel().catch(e => {
    console.error(e);
    process.exit(1);
});
