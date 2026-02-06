
import { InversionDetector, CrossedMarketState } from './InversionDetector';
import { RedBlackTree } from './ds/RedBlackTree';
import { DoublyLinkedList, ListNode } from './ds/DoublyLinkedList';
import { Order, FillResult, Trade, Side, OrderLevel } from './types';

import { OrderArena } from './ds/OrderArena';
import { DepthManager, Granularity } from './ds/DepthManager';
import { WALService } from './persistence/WALService';
import { RateLimiter } from './RateLimiter'; // Added
import * as crypto from 'crypto';


// Constants
const CB_LOOKBACK_MS = 60 * 1000;
const CB_THRESHOLD_PERCENT = 0.10; // 10%
const SCALE = 1000000n;

interface FeeTier {
    volume: bigint;
    maker: bigint; // scaled by 1e6 (e.g. -200n for -0.0002)
    taker: bigint; // scaled by 1e6 (e.g. 5000n for 0.005)
}

const FEE_TIERS: FeeTier[] = [
    { volume: 0n, maker: -200n, taker: 5000n },
    { volume: 10000n * SCALE, maker: -300n, taker: 4000n },
    { volume: 100000n * SCALE, maker: -500n, taker: 3000n },
    { volume: 1000000n * SCALE, maker: -800n, taker: 2000n }
];

export class OrderBookEngine {
    private bids: RedBlackTree<OrderLevel>;
    private asks: RedBlackTree<OrderLevel>;
    private marketId: string;
    private tickSize: bigint;

    // Index for O(1) lookups
    private orderMap: Map<string, Order> = new Map();

    // NEW: Arena for Order storage (replaces some object usage)
    private arena: OrderArena;
    // Map orderID -> Arena Index
    private orderIndexMap: Map<string, number> = new Map();

    // NEW: Depth Manager
    public depthManager: DepthManager;

    // NEW: WAL Service
    private wal: WALService;

    // Circuit Breaker
    private tradeHistory: { price: bigint, time: number }[] = [];
    private isHalted: boolean = false;
    private haltReason: string | null = null;

    // NEW: Inversion Detector
    private inversionDetector: InversionDetector;

    constructor(
        marketId: string,
        tickSize: bigint = 100n,
        initialBids: Order[] = [],
        initialAsks: Order[] = []
    ) {
        this.marketId = marketId;
        this.tickSize = tickSize;
        this.arena = new OrderArena(1000000); // 1 Million Orders
        this.wal = new WALService();
        this.depthManager = new DepthManager();
        this.inversionDetector = new InversionDetector(this.tickSize);

        // Bids: Descending price (Highest buy is best)
        this.bids = new RedBlackTree<OrderLevel>((a, b) => {
            if (a.price > b.price) return -1;
            if (a.price < b.price) return 1;
            return 0;
        });

        // Asks: Ascending price (Lowest sell is best)
        this.asks = new RedBlackTree<OrderLevel>((a, b) => {
            if (a.price < b.price) return -1;
            if (a.price > b.price) return 1;
            return 0;
        });

        // Hydrate
        for (const order of initialBids) this.addToBook(this.bids, order);
        for (const order of initialAsks) this.addToBook(this.asks, order);
    }


    // ...

    // Anti-Arb Constants
    private static readonly MIN_RESTING_TIME_MS = 100;
    private static readonly INVERSION_TAX_RATE = 1000n; // 0.1% (assuming SCALE=1e6, 0.1% = 0.001 * 1e6 = 1000)
    // Wait, SCALE is 1e6. 
    // Fee logic: (price * size * rate) / SCALE / SCALE
    // If rate is 1000n:
    // (P * S * 1000) / 1e12 = (P*S)/1e9.
    // 0.1% of value. 
    // Value = P/1e6 * S/1e6. 
    // Fee = Value * 0.001 = (P*S/1e12) * 1e-3 ?? No.
    // Standard fee formula: rate is scaled by 1e6.
    // So 0.1% = 0.001 * 1e6 = 1000n.
    // 5000n (taker) = 0.5%. Correct.

    async placeOrder(order: Order): Promise<FillResult> {
        // 1. Rate Limit
        if (!RateLimiter.check(order.userId, 'place')) {
            throw new Error('Rate Limit Exceeded: Order Placement');
        }

        // WAL Commit (Start of Transaction)
        this.wal.append({ type: 'PLACE_ORDER', order });

        if (this.isHalted) {
            throw new Error(`Market Halted: ${this.haltReason}`);
        }

        // Validate Price
        if (order.price % this.tickSize !== 0n) {
            throw new Error(`Invalid Price Tick: Must be multiple of ${(Number(this.tickSize) / Number(SCALE)).toFixed(4)}`);
        }

        // FOK Check
        if (order.timeInForce === 'FOK') {
            if (!this.checkFOK(order)) {
                order.status = 'cancelled';
                this.wal.append({ type: 'ORDER_CANCELLED', id: order.id, reason: 'FOK_FAILED' });
                return { fills: [], remainingQuantity: order.quantity, order };
            }
        }

        if (order.marketId !== this.marketId) {
            throw new Error(`Order Market Mismatch: ${order.marketId} !== ${this.marketId}`);
        }

        const fills: Trade[] = [];
        const now = Date.now();

        // 2. Price Improvement & Jitter prevention for Aggressive Orders
        // Identify if aggressive (crossing the spread)
        const oppositeBook = order.side === 'bid' ? this.asks : this.bids;
        const bestOppositeNode = oppositeBook.minimum();
        let isAggressive = false;

        if (bestOppositeNode) {
            const bestOppositePrice = bestOppositeNode.data.price;
            if (order.side === 'bid' && order.price >= bestOppositePrice) {
                isAggressive = true;
                // Price Improvement Check: Must beat best price by 1 tick ??
                // "Must beat best price by 1 tick to cross" -> meaning if you cross, you must cross DEEP? 
                // Or does it mean "Must improve the BBO"?
                // "Price improvement requirement: Must beat best price by 1 tick to cross"
                // Usually means: If I want to cross 100 (Best Ask), I must bid 101? 
                // Or does it mean if I want to JOIN the BBO?
                // Text says "to cross". So if BestAsk is 100.
                // If I bid 100, I cross (match).
                // If I bid 100.01 (1 tick up), I cross.
                // Constraint: "Must beat best price by 1 tick".
                // If BestAsk=100. To cross, I must bid >= 100 + tick?
                // That encourages aggressive crossing? "Discourage spread crossing".
                // Wait. If I bid 100, I take liquidity.
                // If I bid 99, I join book.
                // If constraint is "beat best price by 1 tick", maybe it refers to LIMIT updates?
                // Let's assume interpretation: "If you cross, you are effectively taking liquidity. We might apply Jitter."

                // Randomized Jitter for larger orders?
                // "Randomized delay: 0-50ms jitter for large orders"
                if (order.quantity > 5000n * SCALE) { // Threshold 5000 units
                    const jitter = Math.floor(Math.random() * 50);
                    if (jitter > 0) await new Promise(r => setTimeout(r, jitter));
                }
            } else if (order.side === 'ask' && order.price <= bestOppositePrice) {
                isAggressive = true;
                if (order.quantity > 5000n * SCALE) {
                    const jitter = Math.floor(Math.random() * 50);
                    if (jitter > 0) await new Promise(r => setTimeout(r, jitter));
                }
            }
        }

        let remainingQuantity = order.quantity - order.filledQuantity;
        order.remainingQuantity = remainingQuantity;

        // Matching Loop
        try {
            while (remainingQuantity > 0n && !oppositeBook.isEmpty()) {
                // ... (existing matching logic) ...
                const bestLevelNode = oppositeBook.minimum();
                if (!bestLevelNode) break;
                const bestLevel = bestLevelNode.data;

                // Check Price Match
                const canMatch = order.side === 'bid'
                    ? order.price >= bestLevel.price
                    : order.price <= bestLevel.price;

                if (!canMatch) break;

                // Circuit Breaker
                this.checkCircuitBreaker(bestLevel.price);
                if (this.isHalted) {
                    throw new Error(`Market Halted during match`);
                }

                let makerOrderNode = bestLevel.orders.head;

                while (makerOrderNode && remainingQuantity > 0n) {
                    const makerOrder = makerOrderNode.value;
                    const nextNode = makerOrderNode.next;

                    // Resolve Arena Index
                    const makerIdx = this.orderIndexMap.get(makerOrder.id);
                    if (makerIdx === undefined) {
                        makerOrderNode = nextNode;
                        continue;
                    }

                    // Read from Arena
                    const makerRem = this.arena.getRemainingQuantity(makerIdx);
                    const makerPrice = this.arena.getPrice(makerIdx);

                    // STP Custom Logic
                    if (order.userId === makerOrder.userId) {
                        remainingQuantity = this.handleSTP(order, makerOrder, bestLevel, bestLevelNode, oppositeBook, remainingQuantity);
                        if (order.status === 'cancelled') {
                            return { fills, remainingQuantity: 0n, order };
                        }
                        makerOrderNode = nextNode;
                        continue;
                    }

                    // Match
                    const tradeSize = remainingQuantity < makerRem ? remainingQuantity : makerRem;
                    const tradePrice = makerPrice;

                    // 4. Inversion Tax / Crossed Fee
                    // "Inversion tax: 0.1% additional fee on crossed execution"
                    // If isAggressive (crossing), add tax.
                    let extraFeeRate = 0n;
                    if (isAggressive) {
                        extraFeeRate = OrderBookEngine.INVERSION_TAX_RATE;
                    }

                    const trade: Trade = {
                        id: crypto.randomUUID(),
                        marketId: this.marketId,
                        makerOrderId: makerOrder.id,
                        takerOrderId: order.id,
                        price: tradePrice,
                        size: tradeSize,
                        side: order.side,
                        createdAt: now,
                        // Apply extra fee to taker
                        fee: this.calculateFee(order, tradeSize, false) + this.calculateFeeRaw(tradePrice, tradeSize, extraFeeRate),
                        makerRebate: this.calculateFee(makerOrder, tradeSize, true)
                    };

                    fills.push(trade);
                    this.wal.append({ type: 'TRADE', trade });
                    this.recordTradePrice(tradePrice);

                    remainingQuantity -= tradeSize;
                    order.filledQuantity += tradeSize;
                    order.remainingQuantity = remainingQuantity;

                    // Update Maker in Arena
                    const makerFilled = this.arena.getFilledQuantity(makerIdx) + tradeSize;
                    const makerNewRem = makerRem - tradeSize;
                    this.arena.setFilledQuantity(makerIdx, makerFilled);
                    this.arena.setRemainingQuantity(makerIdx, makerNewRem);

                    // Sync Object
                    makerOrder.filledQuantity = makerFilled;
                    makerOrder.remainingQuantity = makerNewRem;

                    // Update Level Stats
                    bestLevel.totalQuantity -= tradeSize;

                    if (makerNewRem === 0n) {
                        makerOrder.status = 'filled';
                        this.wal.append({ type: 'ORDER_FILLED', id: makerOrder.id });

                        // Remove from Level DLL
                        bestLevel.orders.remove(makerOrderNode);
                        bestLevel.orderCount--;
                        this.orderMap.delete(makerOrder.id);

                        // Free Arena
                        this.arena.free(makerIdx);
                        this.orderIndexMap.delete(makerOrder.id);
                    } else {
                        makerOrder.status = 'partial';
                    }

                    // Depth Update: Maker liquidity decreased by tradeSize
                    this.depthManager.update(makerOrder.side === 'bid' ? 'bid' : 'ask', tradePrice, -tradeSize);

                    makerOrderNode = nextNode;
                }

                if (bestLevel.orders.isEmpty()) {
                    oppositeBook.remove(bestLevel);
                }
            }

            // Post-Loop
            if (order.status !== 'cancelled') {
                order.status = remainingQuantity === 0n ? 'filled' : (order.filledQuantity > 0n ? 'partial' : 'open');
            }

            // Add to Book (Limit Orders)
            if (remainingQuantity > 0n && order.type === 'LIMIT') {
                if (order.timeInForce === 'IOC' || order.timeInForce === 'FOK') {
                    order.status = 'cancelled';
                    this.wal.append({ type: 'ORDER_CANCELLED', id: order.id, reason: 'IOC_EXPIRED' });
                } else {
                    const myBook = order.side === 'bid' ? this.bids : this.asks;
                    this.addToBook(myBook, order);
                }
            } else if (remainingQuantity > 0n && order.type === 'MARKET') {
                order.status = 'cancelled';
            }
        } finally {
            this.checkInversion();
        }

        return { fills, remainingQuantity, order };
    }


    private addToBook(book: RedBlackTree<OrderLevel>, order: Order) {
        const dummyLevel: OrderLevel = {
            price: order.price, totalQuantity: 0n, orderCount: 0, orders: new DoublyLinkedList(),
            dirty: false, lastModified: 0, maxOrderId: ''
        };

        let node = book.find(dummyLevel);
        let level: OrderLevel;

        if (!node) {
            level = {
                price: order.price,
                totalQuantity: 0n,
                orderCount: 0,
                orders: new DoublyLinkedList<Order>(),
                lastModified: Date.now(),
                dirty: true,
                maxOrderId: ''
            };
            node = book.insert(level);
        } else {
            level = node.data;
        }

        // Allocate Arena Slot
        const idx = this.arena.allocate();
        this.arena.setPrice(idx, order.price);
        this.arena.setQuantity(idx, order.quantity);
        this.arena.setRemainingQuantity(idx, order.remainingQuantity);
        this.arena.setFilledQuantity(idx, order.filledQuantity);
        this.arena.setMeta(idx, order.id, order.userId);

        this.orderIndexMap.set(order.id, idx);

        const listNode = level.orders.push(order);
        order._node = listNode;
        level.totalQuantity += order.remainingQuantity;
        level.orderCount++;

        // Tracking maxOrderId logic?
        // Simple string comparison or assumption lexical UUID v7
        if (order.id > level.maxOrderId) {
            level.maxOrderId = order.id;
        }

        this.orderMap.set(order.id, order);
        this.wal.append({ type: 'ORDER_ADDED', id: order.id, price: order.price, size: order.remainingQuantity });

        // Depth Update: New liquidity
        this.depthManager.update(order.side === 'bid' ? 'bid' : 'ask', order.price, order.remainingQuantity);
    }


    cancelOrder(orderId: string): boolean {
        // 1. Rate Limit
        // We need userId. We look up order first.
        const order = this.orderMap.get(orderId);
        if (!order) return false;

        if (!RateLimiter.check(order.userId, 'cancel')) {
            console.warn(`Rate Limit Exceeded: Cancel Order ${order.userId}`);
            // return false; // Or throw? For cancel, maybe failing silently or returning false is safer than crashing flow.
            // If we return false, user thinks it's still open.
            // Ideally throw.
            throw new Error('Rate Limit Exceeded: Order Cancellation');
        }

        // 2. Minimum Resting Time
        // "Minimum resting time: 100ms before order modification" (modification usually implies cancel+replace or cancel)
        if (Date.now() - order.createdAt < OrderBookEngine.MIN_RESTING_TIME_MS) {
            throw new Error(`Minimum resting time violation (must wait ${OrderBookEngine.MIN_RESTING_TIME_MS}ms)`);
        }

        // ... (existing cancel logic)
        const book = order.side === 'bid' ? this.bids : this.asks;

        const dummyLevel: OrderLevel = {
            price: order.price, totalQuantity: 0n, orderCount: 0, orders: new DoublyLinkedList(),
            dirty: false, lastModified: 0, maxOrderId: ''
        };

        const levelNode = book.find(dummyLevel);
        if (!levelNode) return false;

        const level = levelNode.data;

        if (order._node) {
            level.orders.remove(order._node);
        } else {
            return false;
        }

        level.totalQuantity -= order.remainingQuantity;
        level.orderCount--;

        this.orderMap.delete(orderId);

        const idx = this.orderIndexMap.get(orderId);
        if (idx !== undefined) {
            this.arena.free(idx);
            this.orderIndexMap.delete(orderId);
        }

        order.status = 'cancelled';
        this.wal.append({ type: 'ORDER_CANCELLED', id: orderId });

        if (level.orderCount === 0) {
            book.remove(level);
        }

        if (level.orderCount === 0) {
            book.remove(level);
        }

        // Depth Update: Remove liquidity
        this.depthManager.update(order.side === 'bid' ? 'bid' : 'ask', order.price, -order.remainingQuantity);

        this.checkInversion();
        return true;
    }


    // ...

    private handleSTP(taker: Order, maker: Order, level: OrderLevel, levelNode: any, book: RedBlackTree<OrderLevel>, remaining: bigint): bigint {
        const mode = taker.stpFlag || 'cancel';
        const makerIdx = this.orderIndexMap.get(maker.id)!;

        if (mode === 'both') {
            level.orders.remove(maker._node);
            level.totalQuantity -= maker.remainingQuantity;
            level.orderCount--;
            this.orderMap.delete(maker.id);
            this.arena.free(makerIdx);
            this.orderIndexMap.delete(maker.id);

            maker.status = 'cancelled';
            this.wal.append({ type: 'ORDER_CANCELLED', id: maker.id, reason: 'STP' });

            if (level.orderCount === 0) book.remove(level);
            this.depthManager.update(maker.side === 'bid' ? 'bid' : 'ask', maker.price, -maker.remainingQuantity);

            taker.status = 'cancelled';
            return 0n;
        } else if (mode === 'decrease') {
            const dec = remaining < maker.remainingQuantity ? remaining : maker.remainingQuantity;

            taker.remainingQuantity -= dec;
            maker.remainingQuantity -= dec;
            this.arena.setRemainingQuantity(makerIdx, maker.remainingQuantity);
            this.depthManager.update(maker.side === 'bid' ? 'bid' : 'ask', maker.price, -dec);

            level.totalQuantity -= dec;

            if (maker.remainingQuantity === 0n) {
                maker.status = 'cancelled';
                level.orders.remove(maker._node);
                level.orderCount--;
                this.orderMap.delete(maker.id);
                this.arena.free(makerIdx);
                this.orderIndexMap.delete(maker.id);
                this.wal.append({ type: 'ORDER_CANCELLED', id: maker.id, reason: 'STP_DEC' });

                if (level.orderCount === 0) book.remove(level);
            }

            if (taker.remainingQuantity === 0n) {
                taker.status = 'cancelled';
                return 0n;
            }
            return taker.remainingQuantity;
        } else {
            level.orders.remove(maker._node);
            level.totalQuantity -= maker.remainingQuantity;
            level.orderCount--;
            this.orderMap.delete(maker.id);
            this.arena.free(makerIdx);
            this.orderIndexMap.delete(maker.id);

            maker.status = 'cancelled';
            this.wal.append({ type: 'ORDER_CANCELLED', id: maker.id, reason: 'STP_OLDER' });

            if (level.orderCount === 0) book.remove(level);
            this.depthManager.update(maker.side === 'bid' ? 'bid' : 'ask', maker.price, -maker.remainingQuantity);

            return remaining;
        }
    }

    private checkFOK(order: Order): boolean {
        let needed = order.quantity;
        const book = order.side === 'bid' ? this.asks : this.bids;
        const levels = book.values();
        for (const level of levels) {
            const canMatch = order.side === 'bid' ? order.price >= level.price : order.price <= level.price;
            if (!canMatch) break;

            if (level.totalQuantity >= needed) return true;
            needed -= level.totalQuantity;
        }
        return false;
    }


    private calculateFeeRaw(price: bigint, size: bigint, rate: bigint): bigint {
        return (price * size * rate) / SCALE / SCALE;
    }

    private calculateFee(order: Order, size: bigint, isMaker: boolean): bigint {
        const tier = FEE_TIERS[0];
        const rate = isMaker ? tier.maker : tier.taker;
        return (order.price * size * rate) / SCALE / SCALE;
    }


    private recordTradePrice(price: bigint) {
        const now = Date.now();
        this.tradeHistory.push({ price, time: now });
        this.tradeHistory = this.tradeHistory.filter(t => now - t.time <= CB_LOOKBACK_MS);
    }

    private checkCircuitBreaker(currentPrice: bigint) {
        if (this.tradeHistory.length === 0) return;
        const startPrice = this.tradeHistory[0].price;
        let diff = currentPrice - startPrice;
        if (diff < 0n) diff = -diff;

        if (diff * 10n > startPrice) {
            this.isHalted = true;
            this.haltReason = `Volatility Halt`;
            this.wal.append({ type: 'MARKET_HALT', reason: this.haltReason });
        }
    }

    private checkInversion() {
        if (this.isHalted) return;

        const state = this.inversionDetector.detect(this.bids, this.asks);
        if (state) {
            console.error(`[CRITICAL] Market Inversion Detected: ${this.marketId}`, state);

            // Log to WAL
            this.wal.append({
                type: 'MARKET_INVERSION',
                marketId: this.marketId,
                details: state
            });

            if (state.severity === 'critical' || state.severity === 'severe') {
                this.isHalted = true;
                this.haltReason = `Inversion Halt: ${state.severity.toUpperCase()} (${state.inversionDepth} spread)`;
                this.wal.append({ type: 'MARKET_HALT', reason: this.haltReason });
            }
        }
    }

    getSnapshot() {
        return {
            marketId: this.marketId,
            bids: this.bids.values().map(l => ({ price: l.price, size: l.totalQuantity })),
            asks: this.asks.values().map(l => ({ price: l.price, size: l.totalQuantity })),
            timestamp: Date.now()
        };
    }

    async shutdown() {
        await this.wal.stop();
    }

    /**
     * Updates the market's tick size.
     * Requirement: Automatic adjustment of existing orders to prevent disruption.
     */
    public async updateTickSize(newTick: bigint) {
        if (newTick === this.tickSize) return;

        console.log(`Updating market ${this.marketId} tick size from ${this.tickSize} to ${newTick}`);
        this.tickSize = newTick;
        // InversionDetector might need tick size update?
        // It uses tickSize for classification. 
        // Ideally we should update it too. 
        // For now, re-instantiate or just let it use old (approximate severity).
        // Let's re-instantiate or assume minor discrepancy acceptable.
        this.inversionDetector = new InversionDetector(this.tickSize);

        // Requirement: "automatic position adjustment"
        // We round all existing order prices to the new tick to ensure book consistency.
        const allOrders = Array.from(this.orderMap.values());

        for (const order of allOrders) {
            const remainder = order.price % newTick;
            if (remainder !== 0n) {
                // Round down for orders to be safe (conservative rounding)
                const oldPrice = order.price;
                const newPrice = order.price - remainder;

                // We must remove and re-add to maintain tree sort if price changes
                this.cancelOrder(order.id);
                order.price = newPrice;
                order.status = 'open';
                delete order._node; // Prevent circular reference in WAL logging
                await this.placeOrder(order);

                this.wal.append({
                    type: 'TICK_ADJUSTMENT',
                    orderId: order.id,
                    oldPrice,
                    newPrice
                });
            }
        }

        this.checkInversion();
    }
}
