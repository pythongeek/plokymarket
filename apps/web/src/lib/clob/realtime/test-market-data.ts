
import { encode } from '@msgpack/msgpack';
import { MarketDataPublisher } from './MarketDataPublisher';
import { OrderBookEngine } from '../OrderBookEngine';
import { DepthManager } from '../ds/DepthManager';

// Mock Engine and Channel
const mockEngine = {
    marketId: 'test-market',
    depthManager: {
        getDepth: (side: string, granularity: number) => []
    }
} as unknown as OrderBookEngine;

const mockChannel = {
    send: (msg: any) => {
        // console.log('Mock Send:', msg);
    }
};

async function runTest() {
    console.log('--- MARKET DATA PUBLISHER TEST ---');

    // 1. Setup Data
    // We will simulate the Engine's DepthManager returning data.
    // We can't easily mock the internal method return without proxy or modifying the mockEngine object dynamically.

    let currentBids: any[] = [];
    let currentAsks: any[] = [];

    mockEngine.depthManager.getDepth = (side: string, granularity: number) => {
        return side === 'bid' ? currentBids : currentAsks;
    };

    const publisher = new MarketDataPublisher(mockEngine, mockChannel);

    // Test L1 Update
    console.log('\n1. Testing L1 Initial Snapshot (Delta from Empty)...');
    currentBids = [{ price: 500000n, size: 1000000n }]; // 0.50, size 1
    currentAsks = [{ price: 510000n, size: 1000000n }]; // 0.51, size 1

    let lastPayload: any = null;
    mockChannel.send = (msg: any) => {
        lastPayload = msg;
    };

    // Force L1 publish
    // Access private method via any
    (publisher as any).publishL1();

    if (!lastPayload) throw new Error('No payload emitted');
    console.log('Payload Event:', lastPayload.event);

    const binary = Buffer.from(lastPayload.payload.data, 'base64');
    console.log('Binary Size:', binary.length, 'bytes');

    // Decode manual check? We trust the library if size flows.
    // JSON comparison
    const jsonSize = JSON.stringify({
        s: 1, t: Date.now(), m: 'test-market', l: 1,
        b: [[0.5, 1]], a: [[0.51, 1]], y: 'd'
    }).length;
    console.log('JSON Equivalent Size:', jsonSize, 'bytes');
    console.log('Reduction:', ((1 - binary.length / jsonSize) * 100).toFixed(1) + '%');

    // 2. Test Delta (Change Size)
    console.log('\n2. Testing L1 Delta Update...');
    currentBids = [{ price: 500000n, size: 2000000n }]; // Size changed to 2
    lastPayload = null;

    (publisher as any).publishL1();

    if (!lastPayload) throw new Error('No update emitted');
    const bin2 = Buffer.from(lastPayload.payload.data, 'base64');
    console.log('Delta Binary Size:', bin2.length);
    // Should contain b: [[0.5, 2]], a: [] (no change) or absent?
    // Our logic emits empty arrays if no change?
    // Logic: `if (bidDelta.changes.length === 0 && askDelta.changes.length === 0) return;`
    // Ask didn't change. Bid changed.
    // So 'a' should be [].

    // 3. Test No Change
    console.log('\n3. Testing No Change...');
    lastPayload = null;
    (publisher as any).publishL1();
    if (lastPayload) throw new Error('Emitted payload when no change expected');
    console.log('PASS: Correctly suppressed duplicate update');

    // 4. Test L2 (Mutiple Levels)
    console.log('\n4. Testing L2 (5 Levels)...');
    currentBids = [
        { price: 500000n, size: 1000000n },
        { price: 490000n, size: 1000000n },
        { price: 480000n, size: 1000000n },
        { price: 470000n, size: 1000000n },
        { price: 460000n, size: 1000000n }
    ];
    // Asks empty
    currentAsks = [];

    (publisher as any).publishL2();
    if (!lastPayload) throw new Error('No L2 payload');
    const l2Bin = Buffer.from(lastPayload.payload.data, 'base64');
    console.log('L2 Binary Size:', l2Bin.length);

    console.log('\n--- ALL MARKET DATA TESTS PASSED ---');
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
