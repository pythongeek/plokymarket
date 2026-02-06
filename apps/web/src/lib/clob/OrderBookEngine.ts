import { RedBlackTree } from './ds/RedBlackTree';
import { Order, FillResult, Trade, Side, OrderLevel } from './types';

// Constants for Circuit Breaker
const CB_LOOKBACK_MS = 60 * 1000; // 1 Minute
const CB_THRESHOLD_PERCENT = 0.10; // 10% move
const TICK_SIZE = 0.01; // Default tick size

interface FeeTier {
    volume: number;
    maker: number;
    taker: number;
}

const FEE_TIERS: FeeTier[] = [
    { volume: 0, maker: -0.0002, taker: 0.005 },
    { volume: 10000, maker: -0.0003, taker: 0.004 },
    { volume: 100000, maker: -0.0005, taker: 0.003 },
    { volume: 1000000, maker: -0.0008, taker: 0.002 }
];

export class OrderBookEngine {
    private bids: RedBlackTree<Order>;
    private asks: RedBlackTree<Order>;
    private marketId: string;

    // Circuit Breaker State
    private tradeHistory: { price: number, time: number }[] = [];
    private isHalted: boolean = false;
    private haltReason: string | null = null;

    constructor(marketId: string, predefinedBids: Order[] = [], predefinedAsks: Order[] = []) {
        this.marketId = marketId;

        // Sort Bids: Highest Price First, then Oldest Time
        this.bids = new RedBlackTree<Order>((a, b) => {
            if (b.price !== a.price) return b.price - a.price; // Descending price
            return a.createdAt - b.createdAt; // Ascending time
        });

        // Sort Asks: Lowest Price First, then Oldest Time
        this.asks = new RedBlackTree<Order>((a, b) => {
            if (a.price !== b.price) return a.price - b.price; // Ascending price
            return a.createdAt - b.createdAt; // Ascending time
        });

        predefinedBids.forEach(o => this.bids.insert(o));
        predefinedAsks.forEach(o => this.asks.insert(o));
    }

    /**
     * Main entry point to place an order.
     */
    async placeOrder(order: Order): Promise<FillResult> {
        // 0. Circuit Breaker Check
        if (this.isHalted) {
            throw new Error(`Market Halted: ${this.haltReason}`);
        }

        // 1. Validation: Tick Size
        // Using epsilon for float comparison safety
        const remainder = order.price % TICK_SIZE;
        if (Math.abs(remainder) > 0.0000001 && Math.abs(remainder - TICK_SIZE) > 0.0000001) {
            throw new Error(`Invalid Price Tick: Must be multiple of ${TICK_SIZE}`);
        }

        // 2. FOK (Fill-Or-Kill) Pre-flight Check
        // Must be able to fill ENTIRELY immediately.
        if (order.timeInForce === 'FOK') {
            const oppositeBook = order.side === 'BUY' ? this.asks : this.bids;
            let simulatedFill = 0;
            // We need to iterate without modifying (peek)
            // Simulating using values() array which is sorted
            const candidates = oppositeBook.values();
            for (const candidate of candidates) {
                const canMatch = order.side === 'BUY' ? order.price >= candidate.price : order.price <= candidate.price;
                if (!canMatch) break;

                // Sim Check STP
                if (order.userId === candidate.userId) continue; // STP skip logic roughly

                simulatedFill += Math.min(order.size - simulatedFill, candidate.remaining);
                if (simulatedFill >= order.size) break;
            }

            if (simulatedFill < order.size) {
                order.status = 'CANCELED'; // Kill immediately
                return { fills: [], remainingSize: order.size, order };
            }
        }

        const fills: Trade[] = [];
        const oppositeBook = order.side === 'BUY' ? this.asks : this.bids;
        const now = Date.now();

        // Safety: ensure order belongs to this market
        if (order.marketId !== this.marketId) {
            throw new Error(`Order marketId ${order.marketId} does not match engine marketId ${this.marketId}`);
        }

        let remainingSize = order.size - order.filled;
        order.remaining = remainingSize; // Sync helper

        // MATCHING LOOP
        while (remainingSize > 0 && !oppositeBook.isEmpty()) {
            const bestOrder = oppositeBook.min();
            if (!bestOrder) break;

            // GTD (Good Till Date) Expiry Check on Maker Order
            // If bestOrder is GTD and Expired, remove it and continue
            // (Assuming Order interface has 'expiration' field if GTD, let's cast or check)
            if (bestOrder.timeInForce === 'GTD' && (bestOrder as any).expiration && now > (bestOrder as any).expiration) {
                oppositeBook.remove(bestOrder);
                bestOrder.status = 'CANCELED';
                continue;
            }

            const canMatch = order.side === 'BUY'
                ? order.price >= bestOrder.price
                : order.price <= bestOrder.price;

            if (!canMatch) break;

            // Check Circuit Breaker Logic Before Execution
            // If this trade would deviate price > 10% from 1 min ago
            this.checkCircuitBreaker(bestOrder.price);
            if (this.isHalted) {
                throw new Error(`Market Halted during match: Price moved > 10% in 1 min. Last: ${bestOrder.price}`);
            }

            // Self-Trade Prevention (STP)
            if (order.userId === bestOrder.userId) {
                const stpMode = order.stpMode || 'STP_CANCEL_OLDER'; // Default

                if (stpMode === 'STP_CANCEL_BOTH') {
                    // Cancel both
                    oppositeBook.remove(bestOrder);
                    bestOrder.status = 'CANCELED';

                    order.status = 'CANCELED';
                    remainingSize = 0; // Ensure loop breaks and we treat as done
                    order.remaining = 0;
                    // Return immediately as taker is dead and we don't want standard post-loop logic to set it to FILLED
                    return { fills, remainingSize: 0, order };

                } else if (stpMode === 'STP_DECREMENT') {
                    // Decrement both by smaller size (No trade)
                    const decrement = Math.min(remainingSize, bestOrder.remaining);

                    // Decrease Taker
                    remainingSize -= decrement;
                    order.remaining = remainingSize;

                    // Decrease Maker
                    bestOrder.remaining -= decrement;
                    // Note: bestOrder.filled is NOT increased because no trade happened?
                    // Or should we track 'filled' as 'processed'? usually filled = traded.
                    // We simply reduce remaining.

                    if (bestOrder.remaining <= 0) {
                        bestOrder.status = 'CANCELED'; // Consumed by STP
                        oppositeBook.remove(bestOrder);
                    } else {
                        // Update maker in book if needed (RBT usually handles value changes if key is constant)
                    }

                    // If Taker exhausted
                    if (remainingSize <= 0) {
                        order.status = 'CANCELED'; // Consumed
                        break;
                    }

                    continue; // Continue to next match

                } else {
                    // STP_CANCEL_OLDER (Default)
                    oppositeBook.remove(bestOrder);
                    bestOrder.status = 'CANCELED';
                    continue;
                }
            }

            // Execute Match
            const tradeSize = Math.min(remainingSize, bestOrder.remaining);
            const tradePrice = bestOrder.price;

            const trade: Trade = {
                id: crypto.randomUUID(),
                marketId: this.marketId,
                makerOrderId: bestOrder.id,
                takerOrderId: order.id,
                price: tradePrice,
                size: tradeSize,
                side: order.side,
                createdAt: now,
                fee: this.calculateFee(order, tradeSize, false),
                makerRebate: this.calculateFee(bestOrder, tradeSize, true)
            };

            fills.push(trade);
            this.recordTradePrice(tradePrice); // Record for CB

            // Update states
            remainingSize -= tradeSize;
            order.filled += tradeSize;
            order.remaining = remainingSize;

            bestOrder.filled += tradeSize;
            bestOrder.remaining -= tradeSize;

            if (bestOrder.remaining <= 0) {
                bestOrder.status = 'FILLED';
                oppositeBook.remove(bestOrder);
            } else {
                bestOrder.status = 'PARTIAL';
            }
        }

        if (order.status !== 'CANCELED') {
            order.status = remainingSize <= 0 ? 'FILLED' : (order.filled > 0 ? 'PARTIAL' : 'OPEN');
        }

        // ADD TO BOOK
        if (remainingSize > 0 && order.type === 'LIMIT') {
            if (order.timeInForce === 'IOC' || order.timeInForce === 'FOK') {
                order.status = 'CANCELED';
            } else if (order.timeInForce === 'GTD' && (order as any).expiration && now > (order as any).expiration) {
                order.status = 'CANCELED'; // Instant expire if sent late
            } else {
                const myBook = order.side === 'BUY' ? this.bids : this.asks;
                myBook.insert(order);
            }
        } else if (remainingSize > 0 && order.type === 'MARKET') {
            order.status = 'CANCELED';
        }

        return {
            fills,
            remainingSize,
            order
        };
    }

    private recordTradePrice(price: number) {
        const now = Date.now();
        this.tradeHistory.push({ price, time: now });
        // Clean old history
        this.tradeHistory = this.tradeHistory.filter(t => now - t.time <= CB_LOOKBACK_MS);
    }

    private checkCircuitBreaker(currentMatchPrice: number) {
        if (this.tradeHistory.length === 0) return;

        // Find oldest price in window (approx "start" price)
        const startPrice = this.tradeHistory[0].price; // Oldest due to push/filter
        const deviation = Math.abs(currentMatchPrice - startPrice) / startPrice;

        if (deviation > CB_THRESHOLD_PERCENT) {
            this.isHalted = true;
            this.haltReason = `Price moved ${(deviation * 100).toFixed(2)}% in last minute`;
        }
    }

    private calculateFee(order: Order, size: number, isMaker: boolean): number {
        const volume = (order as any).userThirtyDayVolume || 0;
        const tier = [...FEE_TIERS].reverse().find(t => volume >= t.volume) || FEE_TIERS[0];
        const rate = isMaker ? tier.maker : tier.taker;
        return (order.price * size) * rate;
    }

    getSnapshot() {
        const depth = 20;
        const aggregate = (orders: Order[], isBuy: boolean): OrderLevel[] => {
            const levels: Map<number, number> = new Map();
            for (const o of orders) {
                const p = o.price;
                const s = o.remaining;
                levels.set(p, (levels.get(p) || 0) + s);
            }
            const res: OrderLevel[] = Array.from(levels.entries()).map(([price, size]) => ({ price, size, total: 0 }));
            res.sort((a, b) => isBuy ? b.price - a.price : a.price - b.price);
            return res.slice(0, depth);
        };

        return {
            marketId: this.marketId,
            bids: aggregate(this.bids.values(), true),
            asks: aggregate(this.asks.values(), false),
            lastUpdateId: Date.now()
        };
    }

    cancelOrder(orderId: string, side: Side): boolean {
        const book = side === 'BUY' ? this.bids : this.asks;
        const orders = book.values();
        const target = orders.find(o => o.id === orderId);
        if (target) {
            book.remove(target);
            target.status = 'CANCELED';
            return true;
        }
        return false;
    }
}
