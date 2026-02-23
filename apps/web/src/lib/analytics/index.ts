// lib/analytics/index.ts

import type { Trade } from '@/types';

// ─── Type Definitions ────────────────────────────────────────────────────────

type EventProperties = Record<string, unknown>;

// ─── Core Analytics Object ────────────────────────────────────────────────────

export const analytics = {
    /**
     * trackEvent — Send a named event with optional metadata to the analytics provider.
     *
     * Guard: Only runs client-side (typeof window !== 'undefined') to prevent
     * SSR errors. Safe to call from both server components (no-op) and client components.
     *
     * @param event - The event name string. Use PascalCase noun-verb format e.g. 'Trade Executed'
     * @param properties - Optional flat key-value metadata. Do NOT include PII (emails, names).
     */
    trackEvent: (event: string, properties?: EventProperties): void => {
        if (typeof window === 'undefined') {
            return;
        }

        // Until a provider is configured, events are logged to console in dev only:
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics]', event, properties);
        }
    },

    /**
     * trackTrade — Specialized wrapper for trade execution events.
     *
     * Called whenever a trade is successfully submitted/confirmed.
     *
     * @param trade - The full Trade object returned after a successful trade submission.
     */
    trackTrade: (trade: Trade): void => {
        analytics.trackEvent('Trade Executed', {
            marketId: trade.market_id,
            outcome: trade.outcome,
            size: trade.quantity,
            price: trade.price,
        });
    },

    /**
     * trackDeposit — Tracks when a user initiates or completes a deposit.
     *
     * @param amount - The numeric deposit amount
     * @param method - The deposit method string
     */
    trackDeposit: (amount: number, method: string): void => {
        analytics.trackEvent('Deposit', {
            amount,
            method,
        });
    },
};
