import { encode } from '@msgpack/msgpack';
import { OrderBookEngine } from '../OrderBookEngine';
import * as zlib from 'zlib';

export enum MarketLevel { L1 = 0, L2 = 1, L3 = 2 }

export class MarketDataPublisher {
    private engine: OrderBookEngine;
    private sequence = 0;

    // Interval Handles
    private l1Interval: NodeJS.Timeout | null = null;
    private l2Interval: NodeJS.Timeout | null = null;
    private l3Interval: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private ackRetryInterval: NodeJS.Timeout | null = null;

    // ACK Tracking
    private pendingAcks: Map<number, { payload: any, attempts: number }> = new Map();
    private readonly MAX_ACK_ATTEMPTS = 3;

    // Previous States
    private lastBidsL1: Map<number, number> = new Map();
    private lastAsksL1: Map<number, number> = new Map();

    private lastBidsL2: Map<number, number> = new Map();
    private lastAsksL2: Map<number, number> = new Map();

    private lastBidsL3: Map<number, number> = new Map();
    private lastAsksL3: Map<number, number> = new Map();

    private supabaseChannel: any;

    // Reliability & Backpressure
    private lastActivityTime = Date.now();
    private tokens = 100; // Rate limit tokens
    private lastTokenFill = Date.now();
    private MAX_TOKENS = 100;
    private REFILL_RATE = 100; // per second (Max 100 msg/s)

    // Batching
    private batchQueue: any[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    private readonly BATCH_WINDOW_MS = 10;

    constructor(engine: OrderBookEngine, supabaseChannel: any, initialSequence: number = 0) {
        this.engine = engine;
        this.supabaseChannel = supabaseChannel;
        this.sequence = initialSequence;
    }

    start() {
        this.l1Interval = setInterval(() => this.publishL1(), 100);
        this.l2Interval = setInterval(() => this.publishL2(), 250);
        this.l3Interval = setInterval(() => this.publishL3(), 500);
        this.heartbeatInterval = setInterval(() => this.checkHeartbeat(), 30000);
        this.ackRetryInterval = setInterval(() => this.retryUnacked(), 1000);

        // Listen for ACKs from clients
        if (this.supabaseChannel) {
            this.supabaseChannel.on('broadcast', { event: 'market:ack' }, ({ payload }: any) => {
                if (payload && payload.seq) {
                    this.pendingAcks.delete(payload.seq);
                }
            });
        }
    }

    stop() {
        if (this.l1Interval) clearInterval(this.l1Interval);
        if (this.l2Interval) clearInterval(this.l2Interval);
        if (this.l3Interval) clearInterval(this.l3Interval);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.ackRetryInterval) clearInterval(this.ackRetryInterval);
    }

    private checkHeartbeat() {
        if (Date.now() - this.lastActivityTime >= 30000) {
            this.sendHeartbeat();
        }
    }

    private sendHeartbeat() {
        this.encodeAndSend({
            t: 'hb',
            ts: Date.now(),
            seq: ++this.sequence
        }, 'heartbeat');
    }

    public publishL1() {
        const bids = this.engine.depthManager.getDepth('bid', 1).slice(0, 1);
        const asks = this.engine.depthManager.getDepth('ask', 1).slice(0, 1);
        this.processTier(MarketLevel.L1, bids, asks, this.lastBidsL1, this.lastAsksL1);
    }

    public publishL2() {
        const bids = this.engine.depthManager.getDepth('bid', 1).slice(0, 5);
        const asks = this.engine.depthManager.getDepth('ask', 1).slice(0, 5);
        this.processTier(MarketLevel.L2, bids, asks, this.lastBidsL2, this.lastAsksL2);
    }

    public publishL3() {
        const bids = this.engine.depthManager.getDepth('bid', 1);
        const asks = this.engine.depthManager.getDepth('ask', 1);
        this.processTier(MarketLevel.L3, bids, asks, this.lastBidsL3, this.lastAsksL3);
    }

    private processTier(level: MarketLevel, currBids: any[], currAsks: any[], prevBids: Map<number, number>, prevAsks: Map<number, number>) {
        const bidDelta = this.getChanges(prevBids, currBids);
        const askDelta = this.getChanges(prevAsks, currAsks);

        if (bidDelta.changes.length === 0 && askDelta.changes.length === 0) return;

        // Update internal cache
        prevBids.clear();
        bidDelta.newMap.forEach((v, k) => prevBids.set(k, v));
        prevAsks.clear();
        askDelta.newMap.forEach((v, k) => prevAsks.set(k, v));

        this.queueUpdate(level, bidDelta.changes, askDelta.changes);
    }

    private getChanges(prev: Map<number, number>, curr: { price: bigint, size: bigint, total: bigint }[]) {
        const changes: any[] = [];
        const currMap = new Map<number, number>();

        for (const l of curr) {
            const p = Number(l.price);
            const s = Number(l.size);
            const t = Number(l.total);
            currMap.set(p, s);

            if (prev.get(p) !== s) {
                // [Price, Size, Total] - scaled to standard floating point for UI
                changes.push([p / 1e6, s / 1e6, t / 1e6]);
            }
        }

        for (const [p, s] of prev) {
            if (!currMap.has(p)) {
                changes.push([p / 1e6, 0, 0]); // Deletion
            }
        }

        return { changes, newMap: currMap };
    }

    private queueUpdate(level: MarketLevel, bids: any[], asks: any[]) {
        const now = Date.now();
        const elapsed = (now - this.lastTokenFill) / 1000;
        this.tokens = Math.min(this.MAX_TOKENS, this.tokens + elapsed * this.REFILL_RATE);
        this.lastTokenFill = now;

        // Priority-Based Shedding (Graceful Degradation)
        // If system load is high (low tokens), we drop L2/L3 based on importance.
        if (this.tokens < 10) {
            if (level === MarketLevel.L3) return; // Drop L3 first
            if (this.tokens < 2 && level === MarketLevel.L2) return; // Drop L2 next
        }

        this.tokens -= 1;
        const seq = ++this.sequence;

        const msg = {
            t: 'upd',
            seq: seq,
            ts: now,
            m: (this.engine as any).marketId,
            l: level,
            b: bids,
            a: asks,
            ack: true // Request Acknowledgment for update events
        };

        this.batchQueue.push(msg);
        this.pendingAcks.set(seq, { payload: msg, attempts: 0 });

        if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => this.flushBatch(), this.BATCH_WINDOW_MS);
        }
    }

    private retryUnacked() {
        if (this.pendingAcks.size === 0) return;

        for (const [seq, item] of this.pendingAcks.entries()) {
            if (item.attempts >= this.MAX_ACK_ATTEMPTS) {
                this.pendingAcks.delete(seq);
                continue;
            }
            item.attempts++;
            // Resend unacked critical update
            this.encodeAndSend(item.payload, 'market:update');
        }
    }

    public flushBatch() {
        this.batchTimer = null;
        if (this.batchQueue.length === 0) return;

        const payload = this.batchQueue.length === 1 ? this.batchQueue[0] : {
            t: 'batch',
            msgs: this.batchQueue
        };

        this.encodeAndSend(payload, 'market:update');
        this.batchQueue = [];
    }

    private encodeAndSend(message: any, event: string) {
        const packed = encode(message);
        const compressed = zlib.deflateSync(Buffer.from(packed));

        if (this.supabaseChannel && this.supabaseChannel.send) {
            this.supabaseChannel.send({
                type: 'broadcast',
                event: event,
                payload: {
                    data: compressed.toString('base64'),
                    msgpack: true
                }
            });
        }
        this.lastActivityTime = Date.now();
    }
}
