
import * as fs from 'fs';
import * as path from 'path';

export class WALService {
    private logPath: string;
    private buffer: string[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private isFlushing: boolean = false;

    constructor(logDir: string = './logs') {
        if (!fs.existsSync(logDir)) {
            try {
                fs.mkdirSync(logDir, { recursive: true });
            } catch (e) {
                // Ignore if exists race
            }
        }
        this.logPath = path.join(logDir, `wal_${Date.now()}.log`);
        // Start flush loop (10ms)
        this.flushInterval = setInterval(() => this.flush(), 10);
    }

    append(event: any) {
        // Serialize with BigInt support
        const entry = JSON.stringify({ t: Date.now(), ...event }, (key, value) =>
            typeof value === 'bigint' ? value.toString() + 'n' : value
        ) + '\n';
        this.buffer.push(entry);
    }

    async flush() {
        if (this.isFlushing || this.buffer.length === 0) return;
        this.isFlushing = true;

        const data = this.buffer.join('');
        this.buffer = []; // Swap buffer

        try {
            await fs.promises.appendFile(this.logPath, data);
        } catch (e) {
            console.error("WAL Flush Error:", e);
            // Put back in buffer? Complex error handling needed in real prod.
        } finally {
            this.isFlushing = false;
        }
    }

    async stop() {
        if (this.flushInterval) clearInterval(this.flushInterval);
        await this.flush();
    }
}
