
export class OrderArena {
    // 32-byte "Hot" Layout per Order
    // Offset 0: Price (BigInt64)
    // Offset 1: Size (BigInt64) 
    // Offset 2: Remaining (BigInt64)
    // Offset 3: Meta (High 32: Next, Low 32: Prev) ? - Pointers to DLL
    // Actually, BigInt64Array accesses need 64-bit alignment usually effectively.
    // Stride = 8 words (64 bytes) to accommodate everything?
    // User requested 32-byte alignment. 
    // 4 x 64-bit words = 32 bytes.
    // Word 0: Price
    // Word 1: Remaining
    // Word 2: Meta A (Next(32) | Prev(32))
    // Word 3: Meta B (Side(8) | UserIdRef(24) | Filled(32)?) -> Filled is BigInt (amount).

    // Let's use a cleaner Stride of 8 (64 bytes) to be safe and simple first. 
    // Fits in 1 cache line (64 bytes).

    private buffer: BigInt64Array;
    private capacity: number;
    private freeHead: number = -1;

    // String Pools (Map Index -> String)
    // Less cache efficient, but unavoidable unless we hash to int
    private userIds: Map<number, string> = new Map();
    private orderIds: Map<number, string> = new Map();

    static readonly STRIDE = 8;

    // Field Offsets
    static readonly OFF_PRICE = 0;
    static readonly OFF_SIZE = 1;
    static readonly OFF_REMAINING = 2;
    static readonly OFF_FILLED = 3;
    static readonly OFF_NEXT = 4; // DLL
    static readonly OFF_PREV = 5; // DLL
    static readonly OFF_CREATED = 6;
    static readonly OFF_FLAGS = 7; // Side, etc. Use bitmasks.

    constructor(capacity: number = 100000) {
        this.capacity = capacity;
        this.buffer = new BigInt64Array(capacity * OrderArena.STRIDE);

        // Init free list
        for (let i = 0; i < capacity - 1; i++) {
            this.setNext(i, i + 1);
        }
        this.setNext(capacity - 1, -1);
        this.freeHead = 0;
    }

    allocate(): number {
        if (this.freeHead === -1) {
            throw new Error("Arena Overflow");
        }
        const index = this.freeHead;
        this.freeHead = Number(this.getNext(index));

        // Zero out
        const base = index * OrderArena.STRIDE;
        this.buffer.fill(0n, base, base + OrderArena.STRIDE);

        return index;
    }

    free(index: number): void {
        this.userIds.delete(index);
        this.orderIds.delete(index);

        this.setNext(index, this.freeHead);
        this.freeHead = index;
    }

    // Accessors
    getPrice(index: number): bigint { return this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_PRICE]; }
    setPrice(index: number, val: bigint) { this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_PRICE] = val; }

    getQuantity(index: number): bigint { return this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_SIZE]; }
    setQuantity(index: number, val: bigint) { this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_SIZE] = val; }

    getRemainingQuantity(index: number): bigint { return this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_REMAINING]; }
    setRemainingQuantity(index: number, val: bigint) { this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_REMAINING] = val; }

    getFilledQuantity(index: number): bigint { return this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_FILLED]; }
    setFilledQuantity(index: number, val: bigint) { this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_FILLED] = val; }

    getNext(index: number): number { return Number(this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_NEXT]); }
    setNext(index: number, val: number) { this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_NEXT] = BigInt(val); }

    getPrev(index: number): number { return Number(this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_PREV]); }
    setPrev(index: number, val: number) { this.buffer[index * OrderArena.STRIDE + OrderArena.OFF_PREV] = BigInt(val); }

    // Helpers for Maps
    setMeta(index: number, orderId: string, userId: string) {
        this.orderIds.set(index, orderId);
        this.userIds.set(index, userId);
    }

    getOrderId(index: number): string | undefined { return this.orderIds.get(index); }
    getUserId(index: number): string | undefined { return this.userIds.get(index); }
}
