
import { RedBlackTree } from './ds/RedBlackTree';
import { DoublyLinkedList, ListNode } from './ds/DoublyLinkedList';
import { Order, FillResult, Trade, Side, OrderLevel } from './types';
import { OrderArena } from './ds/OrderArena';
import { DepthManager, Granularity } from './ds/DepthManager';
import { WALService } from './persistence/WALService';
import * as crypto from 'crypto';

// Constants
const CB_LOOKBACK_MS = 60 * 1000;
const CB_THRESHOLD_PERCENT = 0.10; // 10%
const TICK_SIZE = 100n; // 0.0001 assuming 6 decimals (1,000,000 scale)
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

    constructor(marketId: string, initialBids: Order[] = [], initialAsks: Order[] = []) {
        this.marketId = marketId;
        this.arena = new OrderArena(1000000); // 1 Million Orders
        this.wal = new WALService();
        this.depthManager = new DepthManager();

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

    async placeOrder(order: Order): Promise<FillResult> {
        // WAL Commit (Start of Transaction)
        this.wal.append({ type: 'PLACE_ORDER', order });

        if (this.isHalted) {
            throw new Error(`Market Halted: ${this.haltReason}`);
        }

        // Validate Price
        if (order.price % TICK_SIZE !== 0n) {
            throw new Error(`Invalid Price Tick: Must be multiple of 0.01`);
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
            throw new Error(`Market mismatch`);
        }

        const fills: Trade[] = [];
        const now = Date.now();
        let remainingQuantity = order.quantity - order.filledQuantity;
        order.remainingQuantity = remainingQuantity;

        const oppositeBook = order.side === 'bid' ? this.asks : this.bids;

        // Matching Loop
        while (remainingQuantity > 0n && !oppositeBook.isEmpty()) {
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

                const trade: Trade = {
                    id: crypto.randomUUID(),
                    marketId: this.marketId,
                    makerOrderId: makerOrder.id,
                    takerOrderId: order.id,
                    price: tradePrice,
                    size: tradeSize,
                    side: order.side,
                    createdAt: now,
                    fee: this.calculateFee(order, tradeSize, false),
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

                    // Depth Update (Maker Filled - Remove remaining)
                    // Maker was partially filled above, but now it's fully gone.
                    // Wait, logic:
                    // 1. We decreased remainingQuantity by tradeSize.
                    // 2. We should decrease depth by tradeSize.
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
        const order = this.orderMap.get(orderId);
        if (!order) return false;

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

        return true;
    }

    private handleSTP(taker: Order, maker: Order, level: OrderLevel, levelNode: any, book: RedBlackTree<OrderLevel>, remaining: bigint): bigint {
        const mode = taker.stpFlag || 'cancel'; // Default to cancel older? User spec: 'none' | 'decrease' | 'cancel' | 'both'
        // Assuming 'cancel' maps to STP_CANCEL_OLDER
        // 'decrease' maps to STP_DECREMENT
        // 'both' maps to STP_CANCEL_BOTH

        const makerIdx = this.orderIndexMap.get(maker.id)!;

        if (mode === 'both') {
            // Cancel Maker
            level.orders.remove(maker._node);
            level.totalQuantity -= maker.remainingQuantity;
            level.orderCount--;
            this.orderMap.delete(maker.id);
            this.arena.free(makerIdx);
            this.orderIndexMap.delete(maker.id);

            maker.status = 'cancelled';
            this.wal.append({ type: 'ORDER_CANCELLED', id: maker.id, reason: 'STP' });

            if (level.orderCount === 0) book.remove(level);

            // Depth Update (STP Both) - Remove Maker
            this.depthManager.update(maker.side === 'bid' ? 'bid' : 'ask', maker.price, -maker.remainingQuantity);

            // Cancel Taker
            taker.status = 'cancelled';
            return 0n;
        } else if (mode === 'decrease') {
            const dec = remaining < maker.remainingQuantity ? remaining : maker.remainingQuantity;

            taker.remainingQuantity -= dec;
            maker.remainingQuantity -= dec;

            // Update Arena
            this.arena.setRemainingQuantity(makerIdx, maker.remainingQuantity);

            // Depth Update (STP Decrease) - Reduce Maker
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
            // CANCEL OLDER (Maker) - 'cancel' mode or 'none'? 
            // Ideally if 'none', we self-trade. But wash trading prevention usually implies strictness.
            // If spec says 'none', we might allow it? But usually 'cancel' is safe default.

            level.orders.remove(maker._node);
            level.totalQuantity -= maker.remainingQuantity;
            level.orderCount--;
            this.orderMap.delete(maker.id);
            this.arena.free(makerIdx);
            this.orderIndexMap.delete(maker.id);

            maker.status = 'cancelled';
            this.wal.append({ type: 'ORDER_CANCELLED', id: maker.id, reason: 'STP_OLDER' });

            if (level.orderCount === 0) book.remove(level);

            // Depth Update (STP Cancel Maker)
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
}
