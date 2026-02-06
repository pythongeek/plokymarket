const { encode, decode } = require('@msgpack/msgpack');
const zlib = require('zlib');

async function test() {
    console.log('--- Testing Advanced MessagePack Protocol ---');

    // 1. Mock Update
    const update = {
        t: 'upd',
        seq: 101,
        ts: Date.now(),
        m: 'market-1',
        l: 0, // L1
        b: [[1.00, 10, 10], [0.99, 20, 30]], // [Price, Size, Total]
        a: [[1.01, 5, 5]]
    };

    // 2. Encode & Compress
    const packed = encode(update);
    const compressed = zlib.deflateSync(Buffer.from(packed));
    console.log(`Payload Size: ${compressed.length} bytes (MessagePack + Zlib)`);

    // Compare with JSON (Estimate)
    const jsonStr = JSON.stringify(update);
    console.log(`JSON Size: ${Buffer.from(jsonStr).length} bytes`);
    console.log(`Bandwidth Reduction: ${Math.round((1 - compressed.length / jsonStr.length) * 100)}%`);

    // 3. Decompress & Decode
    const decompressed = zlib.inflateSync(compressed);
    const decoded = decode(decompressed);
    console.log('Decoded Sequence:', decoded.seq);

    if (decoded.seq !== 101) console.error('❌ Sequence mismatch');
    else console.log('✅ Sequence match');

    // 4. Test Delta Application Mock
    let localBids = [];
    const apply = (prev, deltas) => {
        const newLevels = [...prev];
        deltas.forEach(([price, size, total]) => {
            const idx = newLevels.findIndex(l => l.price === price);
            if (size === 0) {
                if (idx > -1) newLevels.splice(idx, 1);
            } else {
                if (idx > -1) newLevels[idx] = { price, size, total };
                else newLevels.push({ price, size, total });
            }
        });
        return newLevels.sort((a, b) => b.price - a.price);
    };

    localBids = apply(localBids, decoded.b);
    console.log('Applied Bids:', localBids);

    if (localBids.length !== 2 || localBids[0].total !== 10) {
        console.error('❌ Delta application mismatch');
    } else {
        console.log('✅ Delta application correct');
    }

    console.log('\n--- Advanced Protocol Verification Complete ---');
}

test();
