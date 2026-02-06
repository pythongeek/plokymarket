
import { OrderBookEngine } from './OrderBookEngine';
import { Order } from './types';
import { randomUUID } from 'crypto';

async function runTests() {
    const engine = new OrderBookEngine('12345678-1234-4123-8123-1234567890ab', 1n); // Valid UUID for Engine? 
    // Wait, Engine doesn't validate its own ID on construction, but OrderValidator checks if order.marketId matches... 
    // actually Validator just checks Regex.

    console.log('Starting Sanitization Tests...');

    // 1. Test Price Bounds (< 0)
    console.log('[1] Testing Negative Price...');
    const negOrder: Order = {
        id: 'neg-1', userId: 'u1', marketId: '12345678-1234-4123-8123-1234567890ab',
        price: -100n, quantity: 100n, remainingQuantity: 100n, filledQuantity: 0n,
        side: 'bid', type: 'LIMIT', status: 'open', createdAt: Date.now(), timeInForce: 'GTC',
        stpFlag: 'cancel', postOnly: false, updatedAt: Date.now(), cancelRequested: false
    };
    try {
        await engine.placeOrder(negOrder);
        console.error('FAILURE: Negative price was accepted.');
    } catch (e: any) {
        console.log('SUCCESS: Negative price rejected.', e.message);
    }

    // 2. Test Price Rounding
    console.log('[2] Testing Price Rounding (500005 -> 500000 or 510000)...');
    // Tick is 10000. 500005 % 10000 = 5. Should round down to 500000.
    const roundOrder: Order = {
        id: 'round-1', userId: 'u1', marketId: '12345678-1234-4123-8123-1234567890ab',
        price: 500005n, quantity: 100n, remainingQuantity: 100n, filledQuantity: 0n,
        side: 'bid', type: 'LIMIT', status: 'open', createdAt: Date.now(), timeInForce: 'GTC',
        stpFlag: 'cancel', postOnly: false, updatedAt: Date.now(), cancelRequested: false
    };
    try {
        const res = await engine.placeOrder(roundOrder);
        if (res.order.price === 500000n) {
            console.log('SUCCESS: Price rounded down correctly (500005 -> 500000).');
        } else {
            console.error(`FAILURE: Price rounding incorrect. Got ${res.order.price}`);
        }
    } catch (e) {
        console.error('FAILURE: Rounding test threw error', e);
    }

    // 3. Test Invalid Market ID
    console.log('[3] Testing Invalid Market ID...');
    const badIdOrder: Order = {
        id: 'bad-id', userId: 'u1', marketId: 'invalid-id',
        price: 500000n, quantity: 100n, remainingQuantity: 100n, filledQuantity: 0n,
        side: 'bid', type: 'LIMIT', status: 'open', createdAt: Date.now(), timeInForce: 'GTC',
        stpFlag: 'cancel', postOnly: false, updatedAt: Date.now(), cancelRequested: false
    };
    try {
        await engine.placeOrder(badIdOrder);
        console.error('FAILURE: Invalid Market ID accepted.');
    } catch (e: any) {
        console.log('SUCCESS: Invalid Market ID rejected.', e.message);
    }

    // 4. Test Client ID Sanitization (Alphanumeric check)
    console.log('[4] Testing Client ID Sanitization...');
    const badCharOrder: Order = {
        id: 'bad$char', userId: 'u1', marketId: '12345678-1234-4123-8123-1234567890ab',
        price: 500000n, quantity: 100n, remainingQuantity: 100n, filledQuantity: 0n,
        side: 'bid', type: 'LIMIT', status: 'open', createdAt: Date.now(), timeInForce: 'GTC',
        stpFlag: 'cancel', postOnly: false, updatedAt: Date.now(), cancelRequested: false
    };
    try {
        await engine.placeOrder(badCharOrder);
        console.error('FAILURE: Invalid char ID accepted.');
    } catch (e: any) {
        console.log('SUCCESS: Invalid char ID rejected.', e.message);
    }
}

runTests().catch(console.error);
