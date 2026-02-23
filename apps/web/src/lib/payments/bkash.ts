import { createClient } from '@/lib/supabase/server';

interface bKashConfig {
    baseUrl: string;
    appKey: string;
    appSecret: string;
    username: string;
    password: string;
}

interface TokenResponse {
    token: string;
    expiresIn: number;
}

interface PaymentResponse {
    paymentID: string;
    paymentCreateTime: string;
    transactionStatus: string;
    amount: string;
    currency: string;
    intent: string;
    merchantInvoiceNumber: string;
    bkashURL: string;
    callbackURL: string;
    successCallbackURL: string;
    failureCallbackURL: string;
    cancelledCallbackURL: string;
}

export class bKashService {
    private config: bKashConfig;
    private token: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.config = {
            baseUrl: process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh',
            appKey: process.env.BKASH_APP_KEY!,
            appSecret: process.env.BKASH_APP_SECRET!,
            username: process.env.BKASH_USERNAME!,
            password: process.env.BKASH_PASSWORD!,
        };
    }

    private async getToken(): Promise<string> {
        // Return cached token if still valid
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/token/grant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'username': this.config.username,
                'password': this.config.password,
            },
            body: JSON.stringify({
                app_key: this.config.appKey,
                app_secret: this.config.appSecret,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get bKash token');
        }

        const data = await response.json();
        this.token = data.id_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        if (!this.token) {
            throw new Error('Failed to get bKash token: Token is null');
        }

        return this.token;
    }

    async createPayment(amount: number, invoiceNumber: string, callbackUrl: string): Promise<PaymentResponse> {
        const token = await this.getToken();

        const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-APP-Key': this.config.appKey,
            },
            body: JSON.stringify({
                mode: '0011',
                payerReference: invoiceNumber,
                callbackURL: callbackUrl,
                amount: amount.toString(),
                currency: 'BDT',
                intent: 'sale',
                merchantInvoiceNumber: invoiceNumber,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create bKash payment');
        }

        return response.json();
    }

    async executePayment(paymentID: string): Promise<any> {
        const token = await this.getToken();

        const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-APP-Key': this.config.appKey,
            },
            body: JSON.stringify({ paymentID }),
        });

        if (!response.ok) {
            throw new Error('Failed to execute bKash payment');
        }

        return response.json();
    }

    async queryPayment(paymentID: string): Promise<any> {
        const token = await this.getToken();

        const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/payment/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-APP-Key': this.config.appKey,
            },
            body: JSON.stringify({ paymentID }),
        });

        if (!response.ok) {
            throw new Error('Failed to query bKash payment');
        }

        return response.json();
    }

    async payout(phoneNumber: string, amount: number, invoiceNumber: string): Promise<any> {
        const token = await this.getToken();

        const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/payout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
                'X-APP-Key': this.config.appKey,
            },
            body: JSON.stringify({
                amount: amount.toString(),
                currency: 'BDT',
                merchantInvoiceNumber: invoiceNumber,
                receiverMSISDN: phoneNumber,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to process bKash payout');
        }

        return response.json();
    }
}

export const bkashService = new bKashService();
