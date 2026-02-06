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

    private inversionStartTime: number | null = null;

    public detect(
        bids: RedBlackTree<OrderLevel>,
        asks: RedBlackTree<OrderLevel>
    ): CrossedMarketState | null {
        const bestBidNode = bids.minimum(); // Descending: min is Best Bid (Highest)
        const bestAskNode = asks.minimum(); // Ascending: min is Best Ask (Lowest)

        if (!bestBidNode || !bestAskNode) {
            this.inversionStartTime = null;
            return null;
        }

        const bestBid = bestBidNode.data.price;
        const bestAsk = bestAskNode.data.price;

        if (bestBid < bestAsk) {
            this.inversionStartTime = null;
            return null;
        }

        const now = Date.now();
        if (this.inversionStartTime === null) {
            this.inversionStartTime = now;
        }

        const duration = now - this.inversionStartTime;

        const spread = bestBid - bestAsk;
        const severity = this.classifySeverity(spread);

        // Only classify as Critical if duration > 30s OR immediate ticks > 20
        // (Modified per new requirement: Persistent > 30s = Level 3/Halt)
        // We leave calculateSeverity based on TICKS primarily, but External Engine handles Time-based escalation.

        const crossedVolume = this.calculateCrossableVolume(bids, asks, bestBid, bestAsk);

        return {
            detectedAt: now,
            severity,
            bidPrice: bestBid,
            askPrice: bestAsk,
            inversionDepth: spread,
            crossedVolume,
            duration,
            affectedOrders: [] // Engine can call getCrossedOrders if needed to save perf here
        };
    }

    public getCrossedOrders(bids: RedBlackTree<OrderLevel>, asks: RedBlackTree<OrderLevel>): string[] {
        const bestBidNode = bids.minimum();
        const bestAskNode = asks.minimum();
        if (!bestBidNode || !bestAskNode) return [];

        const bestBid = bestBidNode.data.price;
        const bestAsk = bestAskNode.data.price;

        if (bestBid < bestAsk) return [];

        // Identify all levels that are crossed
        const crossedBids = bids.values().filter(l => l.price >= bestAsk);
        const crossedAsks = asks.values().filter(l => l.price <= bestBid);

        const orderIds: string[] = [];

        // Collect orders from these levels. 
        // Strategy: "Newest orders causing cross".
        // We'll return ALL orders in the crossed zone, Engine decides which to cancel (e.g. by timestamp).

        for (const level of crossedBids) {
            for (const order of level.orders) {
                orderIds.push(order.id);
            }
        }

        for (const level of crossedAsks) {
            for (const order of level.orders) {
                orderIds.push(order.id);
            }
        }

        return orderIds;
    }
}
