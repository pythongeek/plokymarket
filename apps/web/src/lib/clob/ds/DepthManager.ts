
export type Granularity = 1 | 5 | 10 | 50 | 100; // Multiples of base tick (0.01%)

export class DepthManager {
    private static readonly MAX_BUCKETS = 20000;
    private static readonly TICK_SCALE = 100n; // 0.01% of 1,000,000 is 100.

    private granularities: Granularity[] = [1, 5, 10, 50, 100];

    // Arrays for each granularity. 
    private bids: Map<number, BigInt64Array> = new Map();
    private asks: Map<number, BigInt64Array> = new Map();

    // Fenwick Trees for O(log N) cumulative sum
    private bidsFT: Map<number, BigInt64Array> = new Map();
    private asksFT: Map<number, BigInt64Array> = new Map();

    constructor() {
        this.granularities.forEach(g => {
            const size = Math.ceil(DepthManager.MAX_BUCKETS / g) + 1;
            this.bids.set(g, new BigInt64Array(size));
            this.asks.set(g, new BigInt64Array(size));
            this.bidsFT.set(g, new BigInt64Array(size + 1)); // 1-indexed for Fenwick
            this.asksFT.set(g, new BigInt64Array(size + 1));
        });
    }

    private ftUpdate(ft: BigInt64Array, index: number, delta: bigint) {
        index++; // 1-indexed
        while (index < ft.length) {
            ft[index] += delta;
            index += index & -index;
        }
    }

    private ftQuery(ft: BigInt64Array, index: number): bigint {
        index++; // 1-indexed
        let sum = 0n;
        while (index > 0) {
            sum += ft[index];
            index -= index & -index;
        }
        return sum;
    }

    update(side: 'bid' | 'ask', price: bigint, delta: bigint) {
        const baseIndex = Number(price / DepthManager.TICK_SCALE);
        const map = side === 'bid' ? this.bids : this.asks;
        const ftMap = side === 'bid' ? this.bidsFT : this.asksFT;

        for (const g of this.granularities) {
            const index = Math.floor(baseIndex / g);
            const buffer = map.get(g)!;
            const ft = ftMap.get(g)!;

            if (index >= 0 && index < buffer.length) {
                buffer[index] += delta;
                this.ftUpdate(ft, index, delta);
            }
        }
    }

    getDepth(side: 'bid' | 'ask', granularity: Granularity) {
        if (!this.granularities.includes(granularity)) {
            throw new Error(`Invalid granularity: ${granularity}`);
        }

        const buffer = (side === 'bid' ? this.bids : this.asks).get(granularity)!;
        const ft = (side === 'bid' ? this.bidsFT : this.asksFT).get(granularity)!;
        const result: { price: bigint, size: bigint, total: bigint }[] = [];

        const gBig = BigInt(granularity);
        const step = gBig * DepthManager.TICK_SCALE;

        // For bids, we calculate cumulative total from the *highest* price down.
        // For asks, we calculate cumulative total from the *lowest* price up.

        let cumulative = 0n;
        if (side === 'ask') {
            for (let i = 0; i < buffer.length; i++) {
                const size = buffer[i];
                if (size > 0n) {
                    cumulative += size;
                    const price = BigInt(i) * step;
                    result.push({ price, size, total: cumulative });
                }
            }
        } else {
            // side === 'bid'
            // To get cumulative from HIGHEST price, we need high-to-low sum.
            // Fenwick Tree gives sum(0...i). Total - sum(0...i-1) gives sum(i...max).
            const totalVolume = this.ftQuery(ft, buffer.length - 1);

            for (let i = buffer.length - 1; i >= 0; i--) {
                const size = buffer[i];
                if (size > 0n) {
                    // Cumulative for bids = sum of volume at or ABOVE this price level
                    const sumBelowExcl = i > 0 ? this.ftQuery(ft, i - 1) : 0n;
                    const totalAtOrAbove = totalVolume - sumBelowExcl;
                    const price = BigInt(i) * step;
                    result.push({ price, size, total: totalAtOrAbove });
                }
            }
        }

        return result;
    }

    getCumulativeVolume(side: 'bid' | 'ask', price: bigint, granularity: Granularity): bigint {
        const index = Math.floor(Number(price / DepthManager.TICK_SCALE) / granularity);
        const ft = (side === 'bid' ? this.bidsFT : this.asksFT).get(granularity)!;

        if (side === 'ask') {
            // Asks: total volume AT OR BELOW price (closest to spread)
            return this.ftQuery(ft, index);
        } else {
            // Bids: total volume AT OR ABOVE price (closest to spread)
            const total = this.ftQuery(ft, ft.length - 2); // buffer.length - 1
            const innerSum = index > 0 ? this.ftQuery(ft, index - 1) : 0n;
            return total - innerSum;
        }
    }
}
