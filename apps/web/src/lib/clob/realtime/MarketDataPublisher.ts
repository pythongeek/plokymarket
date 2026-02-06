import * as protobuf from 'protobufjs';
import * as path from 'path';
import { OrderBookEngine } from '../OrderBookEngine';
import * as zlib from 'zlib';
import { DepthManager, Granularity } from '../ds/DepthManager';

// Load Proto Definition synchronously (or async in init)
// Ideally we load once. For this implementation we'll assume it's loaded.
// In a real Next.js app, loading files at runtime can be tricky with bundling.
// We will use a JSON descriptor or static generated code if possible.
// For now, let's use the dynamic valid approach but hardcode the path carefully or use a JSON import if we converted it.
// To avoid FS issues in Edge/Serverless, we'll try to load it, but fallback to a lightweight approach if needed.
// Actually, `protobufjs` supports parsing text directly. Let's embed the schema for reliability in Vercel.

const PROTO_SCHEMA = `
syntax = "proto3";
package market;

enum Level { L1 = 0; L2 = 1; L3 = 2; }

message PriceLevel { double price = 1; double size = 2; }

message Heartbeat { int64 timestamp = 1; uint64 sequence = 2; }

message MarketUpdate {
    uint64 sequence = 1;
    int64 timestamp = 2;
    string market_id = 3;
    Level level = 4;
    repeated PriceLevel bids = 5;
    repeated PriceLevel asks = 6;
    bool is_snapshot = 7;
}

message RealtimeMessage {
    oneof content {
        Heartbeat heartbeat = 1;
        MarketUpdate update = 2;
        BatchMessage batch = 3;
    }
}

message BatchMessage {
    repeated RealtimeMessage messages = 1;
}
`;

const root = protobuf.parse(PROTO_SCHEMA).root;
const RealtimeMessage = root.lookupType("market.RealtimeMessage");

export class MarketDataPublisher {
    private engine: OrderBookEngine;
    private sequence = 0;

    // Interval Handles
    private l1Interval: NodeJS.Timeout | null = null;
    private l2Interval: NodeJS.Timeout | null = null;
    private l3Interval: NodeJS.Timeout | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;

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
    private messageQueue: any[] = []; // for adaptive batching
    private tokens = 100; // Rate limit tokens
    private lastTokenFill = Date.now();
    private MAX_TOKENS = 100;
    private REFILL_RATE = 100; // per second

    constructor(engine: OrderBookEngine, supabaseChannel: any, initialSequence: number = 0) {
        this.engine = engine;
        this.supabaseChannel = supabaseChannel;
        this.sequence = initialSequence;
    }

    start() {
        // Intervals
        this.l1Interval = setInterval(() => this.publishL1(), 100);
        this.l2Interval = setInterval(() => this.publishL2(), 250);
        this.l3Interval = setInterval(() => this.publishL3(), 500);

        // Heartbeat every 30s
        this.heartbeatInterval = setInterval(() => this.checkHeartbeat(), 30000);

        // Token Refill Loop (or check on send) - Let's do check on send
    }

    stop() {
        if (this.l1Interval) clearInterval(this.l1Interval);
        if (this.l2Interval) clearInterval(this.l2Interval);
        if (this.l3Interval) clearInterval(this.l3Interval);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    }

    private checkHeartbeat() {
        const now = Date.now();
        // If idle for 30s
        if (now - this.lastActivityTime >= 30000) {
            this.sendHeartbeat();
        }
    }

    private sendHeartbeat() {
        const payload = {
            heartbeat: {
                timestamp: Date.now(),
                sequence: ++this.sequence
            }
        };
        this.encodeAndSend(payload, 'heartbeat');
    }

    public publishL1() {
        const bids = this.engine.depthManager.getDepth('bid', 1);
        const asks = this.engine.depthManager.getDepth('ask', 1);

        const topBid = bids.slice(0, 1);
        const topAsk = asks.slice(0, 1);

        const bidDelta = this.getChanges(this.lastBidsL1, topBid);
        const askDelta = this.getChanges(this.lastAsksL1, topAsk);

        if (bidDelta.changes.length === 0 && askDelta.changes.length === 0) return;

        this.lastBidsL1 = bidDelta.newMap;
        this.lastAsksL1 = askDelta.newMap;

        this.queueUpdate(1, bidDelta.changes, askDelta.changes, false);
    }

    public publishL2() {
        const bids = this.engine.depthManager.getDepth('bid', 1).slice(0, 5);
        const asks = this.engine.depthManager.getDepth('ask', 1).slice(0, 5);

        const bidDelta = this.getChanges(this.lastBidsL2, bids);
        const askDelta = this.getChanges(this.lastAsksL2, asks);

        if (bidDelta.changes.length === 0 && askDelta.changes.length === 0) return;

        this.lastBidsL2 = bidDelta.newMap;
        this.lastAsksL2 = askDelta.newMap;

        this.queueUpdate(2, bidDelta.changes, askDelta.changes, false);
    }

    public publishL3() {
        const bids = this.engine.depthManager.getDepth('bid', 1);
        const asks = this.engine.depthManager.getDepth('ask', 1);

        const bidDelta = this.getChanges(this.lastBidsL3, bids);
        const askDelta = this.getChanges(this.lastAsksL3, asks);

        if (bidDelta.changes.length === 0 && askDelta.changes.length === 0) return;

        this.lastBidsL3 = bidDelta.newMap;
        this.lastAsksL3 = askDelta.newMap;

        this.queueUpdate(3, bidDelta.changes, askDelta.changes, false);
    }

    private getChanges(prev: Map<number, number>, curr: { price: bigint, size: bigint }[]) {
        const changes: { price: number, size: number }[] = [];
        const currMap = new Map<number, number>();

        for (const l of curr) {
            const p = Number(l.price);
            const s = Number(l.size);
            currMap.set(p, s);

            const prevSize = prev.get(p);
            if (prevSize !== s) {
                // Changed or New
                changes.push({ price: p / 1e6, size: s / 1e6 });
            }
        }

        // Detect Deletions
        for (const [p, s] of prev) {
            if (!currMap.has(p)) {
                changes.push({ price: p / 1e6, size: 0 });
            }
        }

        return { changes, newMap: currMap };
    }

    // Batching
    private batchQueue: any[] = [];
    private batchTimer: NodeJS.Timeout | null = null;
    private readonly BATCH_WINDOW_MS = 10;

    private queueUpdate(level: number, bids: any[], asks: any[], isSnapshot: boolean) {
        // Graceful Degradation: Check Load (Tokens)
        // Refill tokens
        const now = Date.now();
        const elapsed = (now - this.lastTokenFill) / 1000;
        this.tokens = Math.min(this.MAX_TOKENS, this.tokens + elapsed * this.REFILL_RATE);
        this.lastTokenFill = now;

        // Decision: Drop L2/L3 if volatile (low tokens)
        if (this.tokens < 1) {
            if (level > 1) {
                // Drop L2/L3
                return;
            }
            // Force L1 (allow debt)
        } else {
            this.tokens -= 1;
        }

        const payload = {
            update: {
                sequence: ++this.sequence,
                timestamp: now,
                market_id: (this.engine as any).marketId,
                level: level === 1 ? 0 : (level === 2 ? 1 : 2),
                bids: bids,
                asks: asks,
                is_snapshot: isSnapshot
            }
        };

        // Push to Batch
        this.batchQueue.push(payload);

        // Schedule Flush if not running
        if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => this.flushBatch(), this.BATCH_WINDOW_MS);
        }
    }

    public flushBatch() {
        this.batchTimer = null;
        if (this.batchQueue.length === 0) return;

        // Create Batch Message
        const batchPayload = {
            batch: {
                messages: this.batchQueue // array of RealtimeMessage objects
            }
        };

        const event = 'market:batch'; // Unified event or use specific if mixed?
        // Spec implies single stream. Let's use 'market:update'.

        this.encodeAndSend(batchPayload, 'market:update');
        this.batchQueue = [];
    }

    private encodeAndSend(message: any, event: string) {
        const errMsg = RealtimeMessage.verify(message);
        if (errMsg) throw Error(errMsg);

        const buffer = RealtimeMessage.encode(RealtimeMessage.create(message)).finish();

        // Compression (Deflate)
        // Using sync for simplicity in this context. Async better for Node main loop.
        // We need 'zlib'. require it dynamically if needed.
        const compressed = zlib.deflateSync(buffer);

        if (this.supabaseChannel && this.supabaseChannel.send) {
            this.supabaseChannel.send({
                type: 'broadcast',
                event: event,
                payload: {
                    data: compressed.toString('base64'),
                    c: 1 // Flag for compression? Or assume all compressed.
                }
            });
        }

        this.lastActivityTime = Date.now();
    }
}
