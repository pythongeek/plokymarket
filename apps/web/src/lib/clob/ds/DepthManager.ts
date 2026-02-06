
export type Granularity = 1 | 5 | 10 | 50 | 100; // Multiples of base tick (0.01%)

export class DepthManager {
    // We assume max price is 1.00 (1_000_000 scaled).
    // Tick size is 0.01% (0.0001 -> 100 scaled).
    // Max buckets = 1,000,000 / 100 = 10,000.

    private static readonly MAX_BUCKETS = 20000; // Safety margin
    private static readonly TICK_SCALE = 100n; // 0.01% of 1,000,000 is 100.

    private granularities: Granularity[] = [1, 5, 10, 50, 100];

    // Arrays for each granularity. 
    // bids[granularity][bucketIndex] = volume
    // asks[granularity][bucketIndex] = volume
    private bids: Map<number, BigInt64Array> = new Map();
    private asks: Map<number, BigInt64Array> = new Map();

    // Track min/max active indices to optimize iteration
    // bidsMin[g], bidsMax[g]...
    // Actually, simple iteration over valid range (0-10000) is fast enough.
    // We can optimize later if needed.

    constructor() {
        this.granularities.forEach(g => {
            // Bucket count decreases as granularity increases
            // BUT for simplicity map updates, we can just use same size or max size.
            // Size = MAX_BUCKETS / g (approx).
            const size = Math.ceil(DepthManager.MAX_BUCKETS / g) + 1;
            this.bids.set(g, new BigInt64Array(size));
            this.asks.set(g, new BigInt64Array(size));
        });
    }

    /**
     * Update volume at a specific price.
     * @param side 'bid' or 'ask'
     * @param price Price (BigInt, scaled 1e6)
     * @param delta Change in quantity (BigInt, positive or negative)
     */
    update(side: 'bid' | 'ask', price: bigint, delta: bigint) {
        // Calculate base index (0.01% steps)
        // Price 0.50 (500,000) -> Index 5000
        const baseIndex = Number(price / DepthManager.TICK_SCALE);

        const map = side === 'bid' ? this.bids : this.asks;

        for (const g of this.granularities) {
            // Index for this granularity
            // e.g. g=10 (0.1%), index = baseIndex / 10
            const index = Math.floor(baseIndex / g);
            const buffer = map.get(g)!;

            if (index >= 0 && index < buffer.length) {
                buffer[index] += delta;
            }
        }
    }

    /**
     * Get aggregated depth for a specific granularity.
     * @param side 'bid' | 'ask'
     * @param granularity 1, 5, 10, 50, 100
     */
    getDepth(side: 'bid' | 'ask', granularity: Granularity) {
        if (!this.granularities.includes(granularity)) {
            throw new Error(`Invalid granularity: ${granularity}`);
        }

        const buffer = (side === 'bid' ? this.bids : this.asks).get(granularity)!;
        const result: { price: bigint, size: bigint }[] = [];

        // Optimize: Don't iterate zeros?
        // For 10k items, iteration is cheap. 
        // We reconstruct Price from Index.
        // Price = index * g * TICK_SCALE

        const gBig = BigInt(granularity);
        const step = gBig * DepthManager.TICK_SCALE; // e.g. 10 * 100 = 1000 (0.1%)

        for (let i = 0; i < buffer.length; i++) {
            const size = buffer[i];
            if (size > 0n) {
                const price = BigInt(i) * step;
                result.push({ price, size });
            }
        }

        // Bids usually sorted Descending, Asks Ascending
        if (side === 'bid') {
            result.reverse();
        }

        return result;
    }
}
