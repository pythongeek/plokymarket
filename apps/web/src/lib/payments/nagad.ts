import crypto from 'crypto';

interface NagadConfig {
    baseUrl: string;
    merchantId: string;
    merchantPrivateKey: string;
    merchantPublicKey: string;
    nagadPublicKey: string;
}

export class NagadService {
    private config: NagadConfig;

    constructor() {
        this.config = {
            baseUrl: process.env.NAGAD_BASE_URL || 'https://sandbox.nagad.com',
            merchantId: process.env.NAGAD_MERCHANT_ID!,
            merchantPrivateKey: process.env.NAGAD_MERCHANT_PRIVATE_KEY!,
            merchantPublicKey: process.env.NAGAD_MERCHANT_PUBLIC_KEY!,
            nagadPublicKey: process.env.NAGAD_PUBLIC_KEY!,
        };
    }

    private generateSignature(data: string): string {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(this.config.merchantPrivateKey, 'base64');
    }

    private generateRandomString(length: number): string {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }

    async initializePayment(amount: number, orderId: string): Promise<any> {
        const timestamp = Date.now().toString();
        const random = this.generateRandomString(20);

        const sensitiveData = {
            merchantId: this.config.merchantId,
            datetime: timestamp,
            orderId,
            challenge: random,
        };

        const encryptedData = this.encryptData(JSON.stringify(sensitiveData));
        const signature = this.generateSignature(JSON.stringify(sensitiveData));

        const response = await fetch(`${this.config.baseUrl}/api/dfs/check-out/initialize/${this.config.merchantId}/${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dateTime: timestamp,
                sensitiveData: encryptedData,
                signature,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to initialize Nagad payment');
        }

        return response.json();
    }

    private encryptData(data: string): string {
        // Implement Nagad's specific encryption
        // This is a simplified version - use actual Nagad SDK
        return Buffer.from(data).toString('base64');
    }

    async verifyPayment(paymentRefId: string): Promise<any> {
        const response = await fetch(`${this.config.baseUrl}/api/dfs/verify/payment/${paymentRefId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to verify Nagad payment');
        }

        return response.json();
    }
}

export const nagadService = new NagadService();
