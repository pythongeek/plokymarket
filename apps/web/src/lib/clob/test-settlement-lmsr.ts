
import { SettlementEngine } from '../settlement/SettlementEngine';
import { LMSRMarketMaker } from './LMSRMarketMaker';

async function runTests() {
    console.log('--- SETTLEMENT & LMSR TESTS ---');

    // Test 1: LMSR Pricing
    console.log('Test 1: LMSR Pricing');
    const lmsr = new LMSRMarketMaker(100); // b=100
    const quantities = [0, 0]; // Equal start

    // Initial Price should be 0.5
    const p1 = lmsr.getPrice(0, quantities);
    const p2 = lmsr.getPrice(1, quantities);

    console.log(`Initial Prices: YES=${p1.toFixed(4)}, NO=${p2.toFixed(4)}`);
    if (Math.abs(p1 - 0.5) > 0.001) throw new Error('Initial price not 0.5');

    // Buy 10 shares of YES
    const cost = lmsr.getCostToBuy(0, 10, quantities);
    console.log(`Cost to buy 10 YES: ${cost.toFixed(4)}`);

    quantities[0] += 10;
    const newP1 = lmsr.getPrice(0, quantities);
    console.log(`New Price YES after purchase: ${newP1.toFixed(4)}`);

    if (newP1 <= 0.5) throw new Error('Price did not increase after buy');
    console.log('PASS: LMSR Logic');

    // Test 2: Settlement Engine
    console.log('Test 2: Settlement Payouts');
    const engine = new SettlementEngine();
    // This logs to console, manual verification of log logic
    await engine.processMarket('market-settle', 'YES');
    console.log('PASS: Settlement Engine Execution');
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
