import { Order, TimeInForce } from './types';

export interface ValidationResult {
    valid: boolean;
    sanitizedOrder?: Order; // If valid/sanitized
    error?: string;
    code?: number; // 400, 404, etc.
}

export class OrderValidator {
    private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    private static readonly ALPHANUMERIC_REGEX = /^[a-z0-9]+$/i;
    private static readonly TICK_SIZE = 10000n; // 0.01 scaled by 1e6? No, 1e6 is 1.00. 
    // Wait, let's verify Tick Size representation. 
    // 1.00 = 1,000,000n. 
    // 0.01 = 10,000n.
    // Binary markets often are 0-1.

    // Limits
    private static readonly MIN_QTY = 1n;
    private static readonly MAX_QTY = 1_000_000_000_000n; // Arbitrary huge number
    private static readonly MAX_CLIENT_ID_LEN = 36;

    static validate(order: Order, marketActive: boolean): ValidationResult {
        const sanitized = { ...order };

        // 1. Market ID & Status
        if (!this.UUID_REGEX.test(sanitized.marketId)) {
            return { valid: false, error: 'Invalid Market ID format', code: 400 };
        }
        if (!marketActive) {
            return { valid: false, error: 'Market is not active', code: 404 };
        }

        // 2. Price Validation (Binary: 0 < P < 1.0)
        // Scaled by 1e6. 
        // 0 < P < 1000000
        if (sanitized.price <= 0n || sanitized.price >= 1000000n) {
            return { valid: false, error: 'Price must be between 0 and 1.0', code: 400 };
        }

        // Tick Alignment (Round to nearest tick)
        // e.g. Price 500005n, Tick 10000n.
        // Remainder = 5.
        // If remainder > Tick/2 -> Round Up? Or always Round Down?
        // Simple rounding:
        const remainder = sanitized.price % this.TICK_SIZE;
        if (remainder !== 0n) {
            // Rounding logic: Standard Round
            if (remainder >= this.TICK_SIZE / 2n) {
                sanitized.price = sanitized.price + (this.TICK_SIZE - remainder);
            } else {
                sanitized.price = sanitized.price - remainder;
            }
        }

        // 3. Quantity Validation
        // Integer check: BigInt is always integer.
        // Bounds:
        if (sanitized.quantity < this.MIN_QTY) {
            return { valid: false, error: 'Quantity too small', code: 400 };
        }
        if (sanitized.quantity > this.MAX_QTY) {
            return { valid: false, error: 'Quantity too large', code: 400 };
        }
        // Truncate decimals? Already BigInt. 
        // If the input was "10.5", the upstream parser should have handled logic or rejection.
        // Assuming `sanitized.quantity` is the raw BigInt from request parser.

        // 4. TimeInForce
        const validTIF = ['GTC', 'IOC', 'FOK', 'GTD'];
        if (!sanitized.timeInForce) {
            sanitized.timeInForce = 'GTC'; // Default
        } else if (!validTIF.includes(sanitized.timeInForce)) {
            return { valid: false, error: `Invalid TimeInForce. Allowed: ${validTIF.join(', ')}`, code: 400 };
        }

        // 5. Client Order ID
        if (sanitized.id) {
            // Check length
            if (sanitized.id.length > this.MAX_CLIENT_ID_LEN) {
                sanitized.id = sanitized.id.substring(0, this.MAX_CLIENT_ID_LEN); // Truncate
                // Warning?
            }
            // Alphanumeric check is strict? or just "Safe chars"?
            // Request said: "≤ 36 chars, alphanumeric".
            if (!this.ALPHANUMERIC_REGEX.test(sanitized.id.replace(/-/g, ''))) { // Allow dashes for UUIDs if client uses them?
                // Prompt said "alphanumeric". Let's assume strict.
                // But standard IDs often have dashes. Let's allow dashes.
                return { valid: false, error: 'Client Order ID contains invalid characters', code: 400 };
            }
        }

        return { valid: true, sanitizedOrder: sanitized };
    }
}
