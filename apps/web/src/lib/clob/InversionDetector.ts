import { OrderLevel } from './types';
import { RedBlackTree } from './ds/RedBlackTree';

export type InversionSeverity = 'minor' | 'moderate' | 'severe' | 'critical';

export interface CrossedMarketState {
    detectedAt: number;
    severity: InversionSeverity;
    bidPrice: bigint;
    askPrice: bigint;
    inversionDepth: bigint;
    crossedVolume: bigint;
    duration: number; // in ms, 0 for instantaneous check
    affectedOrders: string[];
}

export class InversionDetector {
    private tickSize: bigint;

    constructor(tickSize: bigint) {
        this.tickSize = tickSize;
    }

    public detect(
        bids: RedBlackTree<OrderLevel>,
        asks: RedBlackTree<OrderLevel>
    ): CrossedMarketState | null {
        // Both Bids and Asks trees in the engine are sorted such that the "Best" price is at the minimum node.
        // Bids: Descending comparator (Highest price is "smaller" -> Left/Min)
        // Asks: Ascending comparator (Lowest price is "smaller" -> Left/Min)
        const bestBidNode = bids.minimum();
        const bestAskNode = asks.minimum();

        if (!bestBidNode || !bestAskNode) return null;

        const bestBid = bestBidNode.data.price;
        const bestAsk = bestAskNode.data.price;

        // Normal state: Max Bid < Min Ask
        // Crossed state: Max Bid >= Min Ask
        if (bestBid < bestAsk) return null;

        const spread = bestBid - bestAsk;
        const severity = this.classifySeverity(spread);
        const crossedVolume = this.calculateCrossableVolume(bids, asks, bestBid, bestAsk);

        return {
            detectedAt: performance.now(),
            severity,
            bidPrice: bestBid,
            askPrice: bestAsk,
            inversionDepth: spread,
            crossedVolume,
            duration: 0, // Instantaneous check
            affectedOrders: [] // Could populate by traversing crossed levels
        };
    }

    private classifySeverity(spread: bigint): InversionSeverity {
        const ticks = Number(spread / this.tickSize); // Approximate ticks

        // User Rule:
        // Minor: < 3 ticks
        // Moderate: 3-10 ticks
        // Severe: > 10 ticks (User said > 10 ticks OR > 500ms, here we check depth)
        // Critical: > 20 ticks

        if (ticks > 20) return 'critical';
        if (ticks > 10) return 'severe';
        if (ticks >= 3) return 'moderate';
        return 'minor';
    }

    private calculateCrossableVolume(
        bids: RedBlackTree<OrderLevel>,
        asks: RedBlackTree<OrderLevel>,
        bidCeiling: bigint,
        askFloor: bigint
    ): bigint {
        // Volume that COULD execute if we matched right now.
        // It is the intersection of Bids >= AskFloor and Asks <= BidCeiling.

        // Use values() since RedBlackTree doesn't support iterator/filter directly
        const allBids = bids.values();
        const allAsks = asks.values();

        const activeBids = allBids.filter(l => l.price >= askFloor);
        const activeAsks = allAsks.filter(l => l.price <= bidCeiling);

        const bidVol = activeBids.reduce((s, l) => s + l.totalQuantity, 0n);
        const askVol = activeAsks.reduce((s, l) => s + l.totalQuantity, 0n);

        return bidVol < askVol ? bidVol : askVol; // Min of the two piles
    }
}
