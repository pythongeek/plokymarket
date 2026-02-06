const { DepthManager } = require('../src/lib/clob/ds/DepthManager');

async function test() {
    console.log('--- Testing Advanced Depth Aggregation ---');
    const dm = new DepthManager();

    // 1. Basic Update Level 1 (0.01%)
    // Price 1.00 (1_000_000)
    dm.update('bid', 1000000n, 10n);
    dm.update('bid', 999900n, 20n);
    dm.update('bid', 999800n, 30n);

    const g1 = dm.getDepth('bid', 1);
    console.log('Granularity 1 (0.01%):');
    g1.forEach(l => console.log(`  Price: ${l.price}, Size: ${l.size}, Total: ${l.total}`));

    // Expected:
    // 1,000,000: size 10, total 10
    //    999,900: size 20, total 30
    //    999,800: size 30, total 60

    if (g1[0].total !== 10n || g1[1].total !== 30n || g1[2].total !== 60n) {
        console.error('❌ Cumulative Bid Total Mismatch in G1');
    } else {
        console.log('✅ G1 Bid Totals Correct');
    }

    // 2. Test Granularity Mapping (G10 - 0.1%)
    // G10 bucket for 1,000,000 and 999,900 and 999,800?
    // TICK_SCALE = 100
    // baseIndex = price / 100
    // G10 index = baseIndex / 10
    // 1,000,000 -> base 10000 -> G10 1000
    //   999,900 -> base  9999 -> G10 999
    //   999,800 -> base  9998 -> G10 999

    // So G10 at index 999 should have 20 + 30 = 50.
    // G10 at index 1000 should have 10.

    const g10 = dm.getDepth('bid', 10);
    console.log('\nGranularity 10 (0.1%):');
    g10.forEach(l => console.log(`  Price: ${l.price}, Size: ${l.size}, Total: ${l.total}`));

    // Expected:
    // Price 10,000*100 = 1,000,000: size 10, total 10
    // Price  9,990*100 =   999,000: size 50, total 60

    if (g10[0].total !== 10n || g10[1].total !== 60n) {
        console.error('❌ Cumulative Bid Total Mismatch in G10');
    } else {
        console.log('✅ G10 Bid Totals Correct');
    }

    // 3. Test Asks
    dm.update('ask', 1000100n, 100n);
    dm.update('ask', 1000200n, 200n);

    const a1 = dm.getDepth('ask', 1);
    console.log('\nAsks G1:');
    a1.forEach(l => console.log(`  Price: ${l.price}, Size: ${l.size}, Total: ${l.total}`));

    if (a1[0].total !== 100n || a1[1].total !== 300n) {
        console.error('❌ Cumulative Ask Total Mismatch');
    } else {
        console.log('✅ Ask Totals Correct');
    }

    // 4. Test getCumulativeVolume
    const cum = dm.getCumulativeVolume('bid', 999900n, 1);
    console.log(`\nCumulative Bid at 999,900: ${cum} (Expected 30)`);
    if (cum !== 30n) console.error('❌ getCumulativeVolume Mismatch');

    console.log('\n--- Advanced Depth Verification Complete ---');
}

test();
