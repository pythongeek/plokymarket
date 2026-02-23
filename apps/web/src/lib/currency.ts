/**
 * Currency conversion utilities for BDT to USDT and vice-versa.
 */

/**
 * Convert BDT amount to USDT using the current exchange rate.
 * @param bdt - Amount in Bangladeshi Taka
 * @param rate - Exchange rate (BDT per 1 USDT), e.g. 120
 * @returns Amount in USDT, rounded to 6 decimal places
 */
export function bdtToUsdt(bdt: number, rate: number): number {
    if (rate <= 0) return 0;
    return parseFloat((bdt / rate).toFixed(6));
}

/**
 * Convert USDT amount to BDT using the current exchange rate.
 * @param usdt - Amount in USDT
 * @param rate - Exchange rate (BDT per 1 USDT), e.g. 120
 * @returns Amount in BDT, rounded to 2 decimal places
 */
export function usdtToBdt(usdt: number, rate: number): number {
    if (rate <= 0) return 0;
    return parseFloat((usdt * rate).toFixed(2));
}

/**
 * Format BDT for display
 */
export function formatBDT(amount: number): string {
    return new Intl.NumberFormat('bn-BD', {
        style: 'currency',
        currency: 'BDT',
        currencyDisplay: 'narrowSymbol'
    }).format(amount).replace('BDT', '৳');
}

/**
 * Format USDT for display
 */
export function formatUSDT(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(amount).replace('$', 'USDT ');
}
